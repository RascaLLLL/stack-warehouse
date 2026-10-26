import { test } from "node:test";
import assert from "node:assert/strict";
import {
  queueFrom,
  runQueueCommand,
  runQueueProgram,
  linkedQueue,
  frontQueue,
  isFullQueue,
} from "../src/lib/game/queue";
import { queueQuestions } from "../src/data/queue-questions";
import {
  computedAnswer,
  evaluateQuestion,
  validateQuestion,
} from "../src/lib/game/puzzles";
import { startEngine, transition, attemptKey } from "../src/lib/game/engine";

test("queue FIFO, pointers, capacity and invalid operations preserve state", () => {
  const input = queueFrom(["A", "B"]);
  const added = runQueueCommand(input, {
    operation: "ENQUEUE",
    value: "C",
  }).after;
  assert.deepEqual(added.items, ["A", "B", "C"]);
  assert.equal(frontQueue(added), "A");
  assert.deepEqual(linkedQueue(added), {
    HEAD: "node-1",
    TAIL: "node-3",
    nodes: [
      { id: "node-1", value: "A", next: "node-2" },
      { id: "node-2", value: "B", next: "node-3" },
      { id: "node-3", value: "C", next: null },
    ],
  });
  const removed = runQueueCommand(added, { operation: "DEQUEUE" });
  assert.equal(removed.output, "A");
  assert.deepEqual(removed.after.items, ["B", "C"]);
  const last = runQueueCommand(queueFrom(["X"]), {
    operation: "DEQUEUE",
  }).after;
  assert.deepEqual(last, { items: [], head: 0, tail: 0 });
  assert.deepEqual(runQueueCommand(last, { operation: "DEQUEUE" }).after, last);
  assert.equal(
    runQueueCommand(last, { operation: "DEQUEUE" }).output,
    "underflow",
  );
  const full = queueFrom(["A", "B", "C", "D"]);
  assert.equal(isFullQueue(full), true);
  assert.equal(
    runQueueCommand(full, { operation: "ENQUEUE", value: "E" }).output,
    "overflow",
  );
  assert.deepEqual(
    runQueueCommand(full, { operation: "ENQUEUE", value: "E" }).after,
    full,
  );
  assert.deepEqual(input, queueFrom(["A", "B"]));
});

test("Modul 8 Alternative 2 shifts only when TAIL reaches IndexMax", () => {
  const initial = queueFrom(["A", "B", "C", "D"]);
  const { state, trace } = runQueueProgram(initial, [
    { operation: "DEQUEUE" },
    { operation: "DEQUEUE" },
    { operation: "ENQUEUE", value: "E" },
  ]);
  assert.deepEqual(trace[0].after, {
    items: ["B", "C", "D"],
    head: 2,
    tail: 4,
  });
  assert.equal(trace[0].shifted, false);
  assert.deepEqual(trace[1].after, { items: ["C", "D"], head: 3, tail: 4 });
  assert.equal(trace[2].shifted, true);
  assert.deepEqual(state, { items: ["C", "D", "E"], head: 1, tail: 3 });
  assert.equal(
    runQueueCommand(state, { operation: "ENQUEUE", value: "F" }).shifted,
    false,
  );
});

test("all queue questions compute their expected answers and wrong choices fail", () => {
  for (const q of queueQuestions) {
    assert.deepEqual(validateQuestion(q), [], q.id);
    assert.equal(computedAnswer(q), q.expectedAnswer, q.id);
    assert.equal(evaluateQuestion(q, q.expectedAnswer).correct, true, q.id);
    for (const choice of q.availableActions.filter(
      (a) => a.id !== q.expectedAnswer,
    ))
      assert.equal(evaluateQuestion(q, choice.id).correct, false, q.id);
  }
});

test("stage 10 opens a paused tutorial, stage 11 preserves lives and score", () => {
  let s = startEngine("transition", 42, 0);
  for (let i = 0; i < 10; i++) {
    s = transition(s, {
      type: "submit",
      key: attemptKey(s),
      answer: s.selectedQuestions[i].expectedAnswer,
      now: i * 1000,
    });
    if (i < 9)
      s = transition(s, {
        type: "continue",
        key: attemptKey(s),
        now: i * 1000,
      });
  }
  const score = s.score,
    lives = s.lives;
  s = transition(s, { type: "continue", key: attemptKey(s), now: 10000 });
  assert.equal(s.currentRoom, 11);
  assert.equal(s.currentZone, "queue");
  assert.equal(s.gameStatus, "paused");
  assert.equal(s.score, score);
  assert.equal(s.lives, lives);
  assert.equal(s.deadline, null);
  s = transition(s, { type: "enterQueue", now: 11000 });
  assert.equal(s.deadline, 41000);
});
