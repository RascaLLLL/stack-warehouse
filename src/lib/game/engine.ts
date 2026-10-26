import type { Player } from "../../types/game";
import type { Question } from "../../types/question";
import {
  CAPACITY,
  executeCommand,
  evaluateQuestion,
  acceptsAnswer,
  type StepTrace,
} from "./puzzles";
import { BANK_VERSION, selectQuestions } from "./questions";
import { TOTAL_STAGES } from "./questions";
import { queueFrom, type QueueStep } from "./queue";
export { CAPACITY, selectQuestions };
export type { Question };
import { scoreAnswer } from "./scoring";

export const STAGE_MS = 30_000;
export type Operation = "PUSH" | "POP" | "PEEK" | "isEmpty";
export type OperationRecord = {
  attempt: string;
  room: number;
  operation: Operation | "TIMEOUT" | "PUZZLE";
  questionId: string;
  trace: StepTrace[];
  queueTrace: QueueStep[];
  topic: "stack" | "queue";
  earnedPoints: number;
  before: string[];
  after: string[];
  output: string;
  answer: string | null;
  correct: boolean;
  at: number;
};
export type EngineState = {
  sessionId: string | null;
  sessionSeed: number;
  currentRoom: number;
  selectedQuestions: Question[];
  stackItems: string[];
  queueItems: string[];
  queueHead: number;
  queueTail: number;
  currentZone: "stack" | "queue";
  questionTopic: "stack" | "queue";
  queueOperationHistory: QueueStep[];
  stackScore: number;
  queueScore: number;
  stackCorrect: number;
  queueCorrect: number;
  queueTutorialDone: boolean;
  lives: number;
  score: number;
  remainingTime: number;
  correctStreak: number;
  hintUsed: boolean;
  operationHistory: OperationRecord[];
  completedRooms: number[];
  gameStatus: "idle" | "playing" | "paused" | "victory" | "gameOver";
  answerStatus: "pending" | "correct" | "wrong" | "timeout";
  deadline: number | null;
  pausedRemainingMs: number;
  attempt: number;
};
export function initialEngine(): EngineState {
  return {
    sessionId: null,
    sessionSeed: 0,
    currentRoom: 1,
    selectedQuestions: [],
    stackItems: [],
    queueItems: [],
    queueHead: 0,
    queueTail: 0,
    currentZone: "stack",
    questionTopic: "stack",
    queueOperationHistory: [],
    stackScore: 0,
    queueScore: 0,
    stackCorrect: 0,
    queueCorrect: 0,
    queueTutorialDone: false,
    lives: 3,
    score: 0,
    remainingTime: 30,
    correctStreak: 0,
    hintUsed: false,
    operationHistory: [],
    completedRooms: [],
    gameStatus: "idle",
    answerStatus: "pending",
    deadline: null,
    pausedRemainingMs: STAGE_MS,
    attempt: 1,
  };
}
export function executeOperation(
  stack: readonly string[],
  operation: Operation,
  value: string,
) {
  return executeCommand(stack, { operation, value });
}
export function startEngine(
  sessionId: string,
  seed: number,
  now: number,
): EngineState {
  const selectedQuestions = selectQuestions(seed);
  return {
    ...initialEngine(),
    sessionId,
    sessionSeed: seed,
    selectedQuestions,
    stackItems: [...selectedQuestions[0].initialStack],
    queueItems: [],
    gameStatus: "playing",
    deadline: now + STAGE_MS,
  };
}
export const attemptKey = (s: EngineState) =>
  `${s.sessionId}:${s.currentRoom}:${s.attempt}`;
type Action =
  | { type: "tick" | "pause" | "resume" | "hint" | "enterQueue"; now: number }
  | { type: "submit"; now: number; key: string; answer: string }
  | { type: "continue"; now: number; key: string };
function settle(
  s: EngineState,
  now: number,
  answer: string | null,
): EngineState {
  const q = s.selectedQuestions[s.currentRoom - 1];
  const zone = q.questionTopic ?? "stack";
  const result =
    answer === null
      ? {
          stack: s.stackItems,
          queueState: {
            items: s.queueItems,
            head: s.queueHead,
            tail: s.queueTail,
          },
          queueTrace: [] as QueueStep[],
          output: "timeout",
          correct: false,
          trace: [] as StepTrace[],
        }
      : evaluateQuestion(q, answer, s.stackItems, {
          items: s.queueItems,
          head: s.queueHead,
          tail: s.queueTail,
        });
  const correct = answer !== null && result.correct;
  const remainingTime = Math.max(
    0,
    Math.ceil(((s.deadline ?? now) - now) / 1000),
  );
  const scoring = scoreAnswer(
    s.lives,
    s.correctStreak,
    correct,
    remainingTime,
    s.hintUsed,
    q.basePoints,
  );
  const completedRooms = correct
    ? [...s.completedRooms, s.currentRoom]
    : s.completedRooms;
  return {
    ...s,
    lives: scoring.lives,
    correctStreak: scoring.correctStreak,
    score: s.score + scoring.points,
    stackScore: s.stackScore + (zone === "stack" ? scoring.points : 0),
    queueScore: s.queueScore + (zone === "queue" ? scoring.points : 0),
    stackCorrect: s.stackCorrect + (correct && zone === "stack" ? 1 : 0),
    queueCorrect: s.queueCorrect + (correct && zone === "queue" ? 1 : 0),
    remainingTime,
    stackItems: result.stack,
    queueItems: result.queueState.items,
    queueHead: result.queueState.head,
    queueTail: result.queueState.tail,
    queueOperationHistory: [...s.queueOperationHistory, ...result.queueTrace],
    completedRooms,
    deadline: null,
    gameStatus:
      scoring.lives === 0
        ? "gameOver"
        : completedRooms.length === TOTAL_STAGES
          ? "victory"
          : "playing",
    answerStatus: answer === null ? "timeout" : correct ? "correct" : "wrong",
    operationHistory: [
      ...s.operationHistory,
      {
        attempt: attemptKey(s),
        room: s.currentRoom,
        operation:
          answer === null
            ? "TIMEOUT"
            : result.trace.length === 1 &&
                result.trace[0].command.operation !== "createStack"
              ? result.trace[0].command.operation
              : "PUZZLE",
        questionId: q.id,
        trace: result.trace,
        queueTrace: result.queueTrace,
        topic: zone,
        earnedPoints: scoring.points,
        before: zone === "queue" ? [...s.queueItems] : [...s.stackItems],
        after:
          zone === "queue" ? [...result.queueState.items] : [...result.stack],
        output: result.output,
        answer,
        correct,
        at: now,
      },
    ],
  };
}
export function transition(s: EngineState, action: Action): EngineState {
  if (
    !Number.isFinite(action.now) ||
    s.gameStatus === "idle" ||
    s.gameStatus === "victory" ||
    s.gameStatus === "gameOver"
  )
    return s;
  if (
    (action.type === "submit" || action.type === "continue") &&
    action.key !== attemptKey(s)
  )
    return s;
  if (
    s.gameStatus === "playing" &&
    s.answerStatus === "pending" &&
    s.deadline !== null &&
    action.now >= s.deadline
  )
    return settle(s, action.now, null);
  switch (action.type) {
    case "submit":
      if (
        s.gameStatus !== "playing" ||
        s.answerStatus !== "pending" ||
        !acceptsAnswer(s.selectedQuestions[s.currentRoom - 1], action.answer)
      )
        return s;
      return settle(s, action.now, action.answer);
    case "tick": {
      if (s.gameStatus !== "playing" || s.deadline === null) return s;
      const remainingTime = Math.max(
        0,
        Math.ceil((s.deadline - action.now) / 1000),
      );
      return remainingTime === s.remainingTime ? s : { ...s, remainingTime };
    }
    case "pause":
      if (
        s.gameStatus !== "playing" ||
        s.answerStatus !== "pending" ||
        s.deadline === null
      )
        return s;
      return {
        ...s,
        gameStatus: "paused",
        pausedRemainingMs: s.deadline - action.now,
        deadline: null,
        remainingTime: Math.ceil((s.deadline - action.now) / 1000),
      };
    case "resume":
      return s.gameStatus === "paused" &&
        (s.currentRoom !== 11 || s.queueTutorialDone)
        ? {
            ...s,
            gameStatus: "playing",
            deadline: action.now + s.pausedRemainingMs,
          }
        : s;
    case "enterQueue":
      return s.currentRoom === 11 &&
        s.gameStatus === "paused" &&
        !s.queueTutorialDone
        ? {
            ...s,
            queueTutorialDone: true,
            gameStatus: "playing",
            deadline: action.now + STAGE_MS,
            pausedRemainingMs: STAGE_MS,
          }
        : s;
    case "hint":
      return s.gameStatus === "playing" &&
        s.answerStatus === "pending" &&
        !s.hintUsed
        ? { ...s, hintUsed: true }
        : s;
    case "continue": {
      if (s.gameStatus !== "playing" || s.answerStatus === "pending") return s;
      const currentRoom =
        s.currentRoom + (s.answerStatus === "correct" ? 1 : 0);
      return {
        ...s,
        currentRoom,
        stackItems: [...s.selectedQuestions[currentRoom - 1].initialStack],
        queueItems: [
          ...queueFrom(s.selectedQuestions[currentRoom - 1].initialQueue ?? [])
            .items,
        ],
        queueHead: queueFrom(
          s.selectedQuestions[currentRoom - 1].initialQueue ?? [],
        ).head,
        queueTail: queueFrom(
          s.selectedQuestions[currentRoom - 1].initialQueue ?? [],
        ).tail,
        currentZone:
          s.selectedQuestions[currentRoom - 1].questionTopic ?? "stack",
        questionTopic:
          s.selectedQuestions[currentRoom - 1].questionTopic ?? "stack",
        attempt: s.attempt + 1,
        answerStatus: "pending",
        hintUsed: false,
        remainingTime: 30,
        pausedRemainingMs: STAGE_MS,
        deadline: action.now + STAGE_MS,
        ...(currentRoom === 11 && !s.queueTutorialDone
          ? { gameStatus: "paused" as const, deadline: null }
          : {}),
      };
    }
  }
}

// Persist data only, and recover by replaying validated events through the same reducer.
export type SavedSession = {
  attemptNumber?: number;
  bankVersion: number;
  questionIds: string[];
  sessionId: string;
  seed: number;
  startedAt: number;
  events: Action[];
};
export function recoverSession(value: unknown): EngineState | null {
  try {
    if (!value || typeof value !== "object") return null;
    const v = value as SavedSession;
    if (
      v.bankVersion !== BANK_VERSION ||
      JSON.stringify(v.questionIds) !==
        JSON.stringify(selectQuestions(v.seed).map((q) => q.id)) ||
      typeof v.sessionId !== "string" ||
      !v.sessionId ||
      !Number.isInteger(v.seed) ||
      !Number.isFinite(v.startedAt) ||
      !Array.isArray(v.events) ||
      v.events.length > 10000
    )
      return null;
    let state = startEngine(v.sessionId, v.seed, v.startedAt);
    let last = v.startedAt;
    for (const e of v.events) {
      if (
        !e ||
        ![
          "tick",
          "pause",
          "resume",
          "hint",
          "enterQueue",
          "submit",
          "continue",
        ].includes(e.type) ||
        !Number.isFinite(e.now) ||
        e.now < last
      )
        return null;
      if (
        (e.type === "submit" || e.type === "continue") &&
        typeof e.key !== "string"
      )
        return null;
      if (e.type === "submit" && typeof e.answer !== "string") return null;
      state = transition(state, e);
      last = e.now;
    }
    return state;
  } catch {
    return null;
  }
}
export type EngineAction = Action;
export function gameResult(state: EngineState, player: Player, now: number) {
  return {
    version: 1 as const,
    player,
    score: state.score,
    completedStages: state.completedRooms.length,
    completedAt: new Date(now).toISOString(),
  };
}
