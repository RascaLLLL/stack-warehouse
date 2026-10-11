import { isGameResult } from "../src/lib/game/result";
import { test } from "node:test";
import assert from "node:assert/strict";
import { questionBank } from "../src/data/questions";
import { stages } from "../src/data/stages";
import { selectQuestions, BANK_VERSION } from "../src/lib/game/questions";
import {
  evaluateQuestion,
  validateQuestion,
  computedAnswer,
  runProgram,
  acceptsAnswer,
} from "../src/lib/game/puzzles";
import { stagePoints, MAX_SCORE } from "../src/lib/game/scoring";
import {
  startEngine,
  transition,
  attemptKey,
  recoverSession,
} from "../src/lib/game/engine";

test("bank has 30 complete serializable questions and exactly 10 per difficulty", () => {
  assert.equal(questionBank.length, 30);
  assert.deepEqual(JSON.parse(JSON.stringify(questionBank)), questionBank);
  assert.equal(new Set(questionBank.map((q) => q.id)).size, 30);
  for (const difficulty of ["easy", "medium", "hard"])
    assert.equal(
      questionBank.filter((q) => q.difficulty === difficulty).length,
      10,
    );
  assert.equal(new Set(questionBank.map((q) => q.puzzleType)).size, 8);
  assert.equal(new Set(questionBank.map((q) => q.topic)).size, 12);
});
for (const q of questionBank)
  test(`${q.id}: valid mechanic, reachable answer, immutable execution`, () => {
    const before = JSON.stringify(q);
    assert.deepEqual(validateQuestion(q), []);
    assert.equal(computedAnswer(q), q.expectedAnswer);
    const evaluated = evaluateQuestion(q, q.expectedAnswer);
    assert.equal(evaluated.correct, true);
    assert.equal(JSON.stringify(q), before);
    assert.ok(evaluated.stack.length <= 4);
    for (const step of evaluated.trace) {
      assert.ok(step.after.length <= 4);
      if (step.output === "overflow" || step.output === "underflow")
        assert.deepEqual(step.after, step.before);
    }
    if (q.puzzleType !== "arrangeSequence") {
      for (const a of q.availableActions.filter(
        (a) => a.id !== q.expectedAnswer,
      ))
        assert.equal(evaluateQuestion(q, a.id).correct, false);
    }
  });
test("seeded selection always has quotas, unique IDs, all 12 curriculum topics and broad bank reach", () => {
  const reached = new Set<string>();
  for (let seed = 0; seed < 1000; seed++) {
    const qs = selectQuestions(seed);
    assert.equal(qs.length, 10);
    assert.equal(new Set(qs.map((q) => q.id)).size, 10);
    assert.equal(qs.filter((q) => q.difficulty === "easy").length, 3);
    assert.equal(qs.filter((q) => q.difficulty === "medium").length, 4);
    assert.equal(qs.filter((q) => q.difficulty === "hard").length, 3);
    assert.equal(new Set(qs.flatMap((q) => q.coverage)).size, 12);
    for (const q of qs) reached.add(q.id);
  }
  assert.equal(reached.size, 30);
  assert.deepEqual(selectQuestions(123456), selectQuestions(123456));
  assert.notDeepEqual(selectQuestions(123456), selectQuestions(123457));
  const first = selectQuestions(1);
  first[0].initialStack.push("tamper");
  assert.notDeepEqual(first, selectQuestions(1));
});
test("sequence puzzles validate permutations, execute actual operations, accept alternative valid plans", () => {
  const q = questionBank.find((q) => q.id === "H02")!;
  assert.equal(acceptsAnswer(q, '["pop","pop","pop"]'), false);
  assert.equal(acceptsAnswer(q, '["push-a"]'), false);
  assert.equal(acceptsAnswer(q, '["push-a","push-b","unknown"]'), false);
  assert.equal(evaluateQuestion(q, '["pop","push-a","push-b"]').correct, false);
  assert.equal(evaluateQuestion(q, '["push-b","pop","push-a"]').correct, true);
  assert.deepEqual(evaluateQuestion(q, q.expectedAnswer).stack, ["A"]);
});
test("trace guards and createStack have real effects", () => {
  const traced = runProgram(
    ["A"],
    [
      { operation: "POP" },
      { operation: "POP" },
      { operation: "PUSH", value: "B" },
    ],
  );
  assert.deepEqual(traced.stack, ["B"]);
  assert.equal(traced.trace[1].output, "underflow");
  assert.deepEqual(
    runProgram(["A", "B"], [{ operation: "createStack" }]).stack,
    [],
  );
});
test("difficulty score, time bonus and exact 25% hint deduction", () => {
  for (const base of [100, 150, 200]) {
    assert.equal(stagePoints(base, 30, false), base + 60);
    assert.equal(stagePoints(base, 17, true), (base + 34) * 0.75);
    assert.equal(stagePoints(base, 0, false), base);
  }
  assert.equal(stagePoints(150, 0, true), 112.5);
  assert.equal(stagePoints(100, 100, false), 160);
  assert.equal(stagePoints(100, -10, false), 100);
  const s = transition(startEngine("score", 42, 0), { type: "hint", now: 0 });
  const q = s.selectedQuestions[0];
  const correct = transition(s, {
    type: "submit",
    key: attemptKey(s),
    answer: q.expectedAnswer,
    now: 1000,
  });
  assert.equal(correct.score, (q.basePoints + 58) * 0.75);
  const wrong = transition(startEngine("wrong", 42, 0), {
    type: "submit",
    key: attemptKey(startEngine("wrong", 42, 0)),
    answer: q.availableActions.find((a) => a.id !== q.expectedAnswer)!.id,
    now: 1000,
  });
  assert.equal(wrong.score, 0);
  const timeout = transition(startEngine("timeout", 42, 0), {
    type: "tick",
    now: 30000,
  });
  assert.equal(timeout.score, 0);
});
test("all seeded stages integrate through victory with the exact maximum score", () => {
  for (let seed = 0; seed < 30; seed++) {
    let s = startEngine("integration", seed, 0);
    for (let room = 1; room <= 10; room++) {
      const q = s.selectedQuestions[room - 1];
      s = transition(s, {
        type: "submit",
        key: attemptKey(s),
        answer: q.expectedAnswer,
        now: 0,
      });
      assert.equal(s.answerStatus, "correct", q.id);
      assert.equal(s.operationHistory.at(-1)?.questionId, q.id);
      if (room < 10)
        s = transition(s, { type: "continue", key: attemptKey(s), now: 0 });
    }
    assert.equal(s.gameStatus, "victory");
    assert.equal(s.score, MAX_SCORE);
  }
});
test("versioned persistence refuses old curricula or changed question IDs", () => {
  const saved = {
    bankVersion: BANK_VERSION,
    questionIds: selectQuestions(42).map((q) => q.id),
    sessionId: "saved",
    seed: 42,
    startedAt: 0,
    events: [],
  };
  assert.ok(recoverSession(saved));
  assert.equal(recoverSession({ ...saved, bankVersion: 1 }), null);
  assert.equal(recoverSession({ ...saved, questionIds: ["unknown"] }), null);
});
test("question validator rejects incorrect answers, scores and unsupported mechanics", () => {
  const q = questionBank[0];
  assert.ok(validateQuestion({ ...q, expectedAnswer: "missing" }).length);
  assert.ok(validateQuestion({ ...q, basePoints: 200 }).length);
  assert.ok(
    validateQuestion({ ...q, puzzleType: "fake" as typeof q.puzzleType })
      .length,
  );
});
test("ten distinct warehouse environments match the required progression", () => {
  assert.deepEqual(
    stages.map((s) => s.title),
    [
      "Receiving Dock",
      "Storage Bay",
      "Loading Station",
      "Sorting Area",
      "Conveyor Control",
      "Inventory Room",
      "Linked Storage",
      "Array Storage",
      "Maintenance Zone",
      "Master Warehouse",
    ],
  );
  assert.equal(new Set(stages.map((s) => s.motif)).size, 10);
  assert.equal(new Set(stages.map((s) => s.accent)).size, 10);
});

test("result validation retains fractional hint scores and the new maximum", () => {
  const player = { name: "Test", nim: "TEST001", className: "TEST" };
  const result = {
    version: 1,
    player,
    score: 112.5,
    completedStages: 10,
    completedAt: "2026-10-11T00:00:00.000Z",
  };
  assert.equal(isGameResult(result), true);
  assert.equal(isGameResult({ ...result, score: MAX_SCORE }), true);
  assert.equal(isGameResult({ ...result, score: MAX_SCORE + 1 }), false);
  assert.equal(isGameResult({ ...result, score: NaN }), false);
});
