import { test } from "node:test";
import assert from "node:assert/strict";
import {
  push,
  pop,
  peek,
  top,
  isEmpty,
  arrayStack,
  linkedStack,
} from "../src/lib/game/stack";
import { scoreAnswer } from "../src/lib/game/scoring";
import {
  startEngine,
  transition,
  attemptKey,
  recoverSession,
  selectQuestions,
  type EngineState,
  type EngineAction,
} from "../src/lib/game/engine";
import { questionBank } from "../src/data/questions";
import { evaluateQuestion } from "../src/lib/game/puzzles";
import { BANK_VERSION } from "../src/lib/game/questions";
const start = () => startEngine("test-session", 42, 1000);
function answer(s: EngineState, correct = true, now = 2000): EngineState {
  const q = s.selectedQuestions[s.currentRoom - 1];
  const expected = q.expectedAnswer;
  return transition(s, {
    type: "submit",
    key: attemptKey(s),
    answer: correct
      ? expected
      : q.availableActions.find((c) => c.id !== expected)!.id,
    now,
  });
}
const advance = (s: EngineState, now = 2100) =>
  transition(s, { type: "continue", key: attemptKey(s), now });
test("immutable stack operations, Modul 7 TOP, and linked pointers", () => {
  const input = ["A", "B"];
  assert.deepEqual(push(input, "C", 3), { ok: true, stack: ["A", "B", "C"] });
  assert.deepEqual(push(input, "C", 2), { ok: false, reason: "overflow" });
  assert.deepEqual(pop(input), { ok: true, stack: ["A"], value: "B" });
  assert.deepEqual(pop([]), { ok: false, reason: "underflow" });
  assert.equal(peek(input), "B");
  assert.equal(top(input), "B");
  assert.equal(isEmpty([]), true);
  assert.equal(isEmpty(input), false);
  assert.deepEqual(input, ["A", "B"]);
  assert.deepEqual(arrayStack([], 2), {
    TOP: 0,
    slots: [undefined, undefined, undefined],
  });
  assert.deepEqual(arrayStack(["A", "B"], 2), {
    TOP: 2,
    slots: [undefined, "A", "B"],
  });
  assert.deepEqual(linkedStack(input), {
    TOP: "node-2",
    nodes: [
      { id: "node-1", value: "A", next: null },
      { id: "node-2", value: "B", next: "node-1" },
    ],
  });
  assert.equal(linkedStack([]).TOP, null);
  assert.throws(() => push([], "A", -1), RangeError);
});
test("scoring restores life every three successes and caps at three", () => {
  assert.deepEqual(scoreAnswer(2, 2, true, 30, false), {
    lives: 3,
    correctStreak: 0,
    points: 160,
  });
  assert.equal(scoreAnswer(3, 2, true, 30, false).lives, 3);
  assert.deepEqual(scoreAnswer(1, 2, false, 20, false), {
    lives: 0,
    correctStreak: 0,
    points: 0,
  });
  assert.equal(scoreAnswer(3, 0, true, 30, true).points, 120);
});
test("duplicate submissions and stale room callbacks cannot score or deduct twice", () => {
  const s = start();
  const key = attemptKey(s);
  const wrong = answer(s, false);
  assert.equal(wrong.lives, 2);
  assert.strictEqual(
    transition(wrong, { type: "submit", key, answer: "anything", now: 2100 }),
    wrong,
  );
  assert.strictEqual(transition(wrong, { type: "tick", now: 60000 }), wrong);
  const retry = advance(wrong);
  assert.strictEqual(
    transition(retry, { type: "continue", key, now: 2200 }),
    retry,
  );
  assert.strictEqual(
    transition(retry, { type: "submit", key, answer: "A", now: 2200 }),
    retry,
  );
  assert.equal(retry.currentRoom, 1);
  assert.equal(retry.remainingTime, 30);
});
test("deadline wins at exact expiry even with delayed browser callbacks", () => {
  let s = start();
  const key = attemptKey(s);
  s = transition(s, {
    type: "submit",
    key,
    answer: s.selectedQuestions[0].availableActions[0].id,
    now: 31000,
  });
  assert.equal(s.answerStatus, "timeout");
  assert.equal(s.lives, 2);
  assert.equal(s.operationHistory.length, 1);
  assert.strictEqual(transition(s, { type: "tick", now: 999999 }), s);
  assert.strictEqual(transition(s, { type: "pause", now: 999999 }), s);
});
test("pause preserves exact milliseconds and ignores submissions while paused", () => {
  const paused = transition(start(), { type: "pause", now: 12345 });
  assert.equal(paused.pausedRemainingMs, 18655);
  assert.strictEqual(transition(paused, { type: "tick", now: 500000 }), paused);
  assert.strictEqual(answer(paused, true, 500000), paused);
  const resumed = transition(paused, { type: "resume", now: 500000 });
  assert.equal(resumed.deadline, 518655);
  assert.equal(
    transition(resumed, { type: "tick", now: 518654 }).answerStatus,
    "pending",
  );
  assert.equal(
    transition(resumed, { type: "tick", now: 518655 }).answerStatus,
    "timeout",
  );
});
test("real PUSH and POP mutate authoritative state", () => {
  for (const id of ["E04", "E05", "E06", "E07"]) {
    const q = questionBank.find((q) => q.id === id)!;
    const s = {
      ...start(),
      selectedQuestions: [q, ...start().selectedQuestions.slice(1)],
      stackItems: [...q.initialStack],
    };
    const result = answer(s, true);
    assert.deepEqual(result.stackItems, q.targetStack);
    assert.deepEqual(
      result.operationHistory[0].trace,
      evaluateQuestion(q, q.expectedAnswer).trace,
    );
  }
});
test("wrong answer resets streak, third correct restores life, terminal states freeze", () => {
  let s = advance(answer(start(), false));
  for (let i = 0; i < 3; i++) {
    s = answer(s, true, 3000 + i * 1000);
    if (i < 2) s = advance(s, 3100 + i * 1000);
  }
  assert.equal(s.lives, 3);
  assert.equal(s.correctStreak, 0);
  let lost = start();
  for (let i = 0; i < 3; i++) {
    lost = answer(lost, false, 3000 + i * 1000);
    if (i < 2) lost = advance(lost, 3100 + i * 1000);
  }
  assert.equal(lost.gameStatus, "gameOver");
  assert.equal(lost.lives, 0);
  assert.strictEqual(advance(lost, 10000), lost);
  s = start();
  for (let i = 0; i < 20; i++) {
    s = answer(s, true, 2000 + i * 1000);
    if (i < 19) {
      s = advance(s, 2100 + i * 1000);
      if (s.currentRoom === 11)
        s = transition(s, { type: "enterQueue", now: 2100 + i * 1000 });
    }
  }
  assert.equal(s.gameStatus, "victory");
  assert.equal(s.completedRooms.length, 20);
  assert.equal(new Set(s.completedRooms).size, 20);
  assert.ok(s.score <= 4200);
  assert.strictEqual(advance(s, 20000), s);
});
test("refresh replays operations, preserves pause/feedback, catches expired deadline once", () => {
  const events: EngineAction[] = [];
  let s = start();
  const dispatch = (e: EngineAction) => {
    events.push(e);
    s = transition(s, e);
  };
  dispatch({ type: "hint", now: 1500 });
  dispatch({ type: "pause", now: 1600 });
  const saved = () => ({
    bankVersion: BANK_VERSION,
    questionIds: selectQuestions(42).map((q) => q.id),
    sessionId: "test-session",
    seed: 42,
    startedAt: 1000,
    events: [...events],
  });
  assert.deepEqual(recoverSession(saved()), s);
  dispatch({ type: "resume", now: 100000 });
  dispatch({
    type: "submit",
    key: attemptKey(s),
    answer: s.selectedQuestions[0].expectedAnswer,
    now: 100100,
  });
  assert.deepEqual(recoverSession(saved()), s);
  dispatch({ type: "continue", key: attemptKey(s), now: 100200 });
  const recovered = recoverSession(saved())!;
  const expired = transition(recovered, { type: "tick", now: 999999 });
  assert.equal(expired.lives, 2);
  assert.equal(expired.answerStatus, "timeout");
  assert.strictEqual(
    transition(expired, { type: "tick", now: 1000000 }),
    expired,
  );
  assert.equal(
    recoverSession({ sessionId: "x", seed: 42, startedAt: 0, events: [null] }),
    null,
  );
  assert.equal(
    recoverSession({
      sessionId: "x",
      seed: 42,
      startedAt: 10,
      events: [{ type: "pause", now: 5 }],
    }),
    null,
  );
});
