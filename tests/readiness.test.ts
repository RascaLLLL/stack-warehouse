import { test } from "node:test";
import assert from "node:assert/strict";
import { safeStorage } from "../src/lib/game/storage";
import { isPlayer } from "../src/lib/game/player";
import { startEngine, transition, attemptKey } from "../src/lib/game/engine";

test("registration rejects missing, whitespace, oversized and malformed identity fields", () => {
  const player = { name: "Ayu Putri", nim: "24.001-A", className: "TI-2A" };
  assert.equal(isPlayer(player), true);
  for (const invalid of [
    null,
    {},
    { ...player, name: "  " },
    { ...player, className: "\t" },
    { ...player, nim: "12" },
    { ...player, nim: "24 001" },
    { ...player, nim: "<script>" },
    { ...player, name: "Ayu\u0000Putri" },
    { ...player, className: "TI\u007fA" },
    { ...player, name: "A".repeat(41) },
    { ...player, className: "A".repeat(41) },
    { ...player, nim: "1".repeat(25) },
  ])
    assert.equal(isPlayer(invalid), false);
});

test("storage suppresses display-tick rewrites but saves changed data and removes keys", () => {
  const data = new Map<string, string>();
  let writes = 0;
  const storage = safeStorage(() => ({
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      writes++;
      data.set(name, value);
    },
    removeItem: (name) => {
      data.delete(name);
    },
  }));
  storage.setItem("session", "one");
  for (let i = 0; i < 150; i++) storage.setItem("session", "one");
  assert.equal(writes, 1);
  storage.setItem("session", "two");
  assert.equal(writes, 2);
  assert.equal(storage.getItem("session"), "two");
  storage.removeItem("session");
  assert.equal(storage.getItem("session"), null);
  storage.setItem("session", "two");
  assert.equal(writes, 3);
});

test("security/quota storage failures preserve in-memory progress without throwing", () => {
  for (const error of [
    new Error("SecurityError"),
    new Error("QuotaExceededError"),
  ]) {
    const storage = safeStorage(() => {
      throw error;
    });
    assert.equal(storage.getItem("session"), null);
    assert.doesNotThrow(() => storage.setItem("session", "saved"));
    assert.equal(storage.getItem("session"), "saved");
    storage.setItem("session", "changed");
    assert.equal(storage.getItem("session"), "changed");
    storage.removeItem("session");
    assert.equal(storage.getItem("session"), null);
  }
});

test("hint and pause at deadline settle once; repeated hint cannot double-penalize", () => {
  const s = startEngine("deadline", 42, 1000);
  for (const type of ["hint", "pause"] as const) {
    const expired = transition(s, { type, now: 31000 });
    assert.equal(expired.answerStatus, "timeout");
    assert.equal(expired.lives, 2);
    assert.equal(expired.hintUsed, false);
    assert.strictEqual(transition(expired, { type, now: 32000 }), expired);
  }
  const hinted = transition(s, { type: "hint", now: 1001 });
  assert.strictEqual(transition(hinted, { type: "hint", now: 1002 }), hinted);
  const correct = transition(hinted, {
    type: "submit",
    key: attemptKey(hinted),
    now: 1002,
    answer: hinted.selectedQuestions[0].expectedAnswer,
  });
  assert.equal(
    correct.score,
    (hinted.selectedQuestions[0].basePoints + 60) * 0.75,
  );
});

test("a wrong answer after two successes resets the recovery streak", () => {
  let s = startEngine("streak", 42, 1000);
  let now = 1001;
  for (const correct of [false, true, true, false, true]) {
    const q = s.selectedQuestions[s.currentRoom - 1];
    s = transition(s, {
      type: "submit",
      now: now++,
      key: attemptKey(s),
      answer: correct
        ? q.expectedAnswer
        : q.availableActions.find((a) => a.id !== q.expectedAnswer)!.id,
    });
    if (!correct) assert.equal(s.correctStreak, 0);
    s = transition(s, { type: "continue", now: now++, key: attemptKey(s) });
  }
  assert.equal(s.lives, 1);
  assert.equal(s.correctStreak, 1);
});
