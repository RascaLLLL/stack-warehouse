import type { Question, StackCommand } from "../../types/question";
import { isEmpty, peek, pop, push, linkedStack } from "./stack";
import {
  queueFrom,
  runQueueProgram,
  frontQueue,
  type QueueState,
  type QueueStep,
} from "./queue";
export const CAPACITY = 4;
export type StepTrace = {
  command: StackCommand;
  before: string[];
  after: string[];
  output: string;
};
export function executeCommand(
  stack: readonly string[],
  command: StackCommand,
) {
  if (command.operation === "createStack")
    return { stack: [], output: "created" };
  if (command.operation === "PEEK")
    return { stack: [...stack], output: peek(stack) ?? "underflow" };
  if (command.operation === "isEmpty")
    return {
      stack: [...stack],
      output: String(command.negate ? !isEmpty(stack) : isEmpty(stack)),
    };
  const result =
    command.operation === "PUSH"
      ? push(stack, command.value!, CAPACITY)
      : pop(stack);
  return result.ok
    ? {
        stack: result.stack,
        output:
          command.operation === "PUSH"
            ? String(result.stack.length)
            : result.value!,
      }
    : { stack: [...stack], output: result.reason };
}
export function runProgram(
  initial: readonly string[],
  program: readonly StackCommand[],
) {
  let stack = [...initial];
  const trace: StepTrace[] = [];
  for (const command of program) {
    const before = [...stack];
    const result = executeCommand(stack, command);
    stack = result.stack;
    trace.push({ command, before, after: [...stack], output: result.output });
  }
  return { stack, trace };
}
export function sequenceIds(q: Question, answer: string): string[] | null {
  try {
    const ids: unknown = JSON.parse(answer);
    return Array.isArray(ids) &&
      ids.length === q.availableActions.length &&
      new Set(ids).size === ids.length &&
      ids.every(
        (id) =>
          typeof id === "string" && q.availableActions.some((a) => a.id === id),
      )
      ? ids
      : null;
  } catch {
    return null;
  }
}
export function acceptsAnswer(q: Question, answer: string) {
  return q.puzzleType === "arrangeSequence"
    ? sequenceIds(q, answer) !== null
    : q.availableActions.some((a) => a.id === answer);
}
export function evaluateQuestion(
  q: Question,
  answer: string,
  initial: readonly string[] = q.initialStack,
  initialQueue: QueueState = queueFrom(q.initialQueue ?? []),
) {
  if (q.questionTopic === "queue") {
    const action = q.availableActions.find((a) => a.id === answer);
    const program =
      action?.queueProgram ??
      (action?.queueCommand ? [action.queueCommand] : (q.queueProgram ?? []));
    const { state, trace } = runQueueProgram(initialQueue, program);
    return {
      stack: [...initial],
      trace: [] as StepTrace[],
      queueState: state,
      queueTrace: trace,
      correct: acceptsAnswer(q, answer) && answer === q.expectedAnswer,
      output: trace.at(-1)?.output ?? answer,
    };
  }
  const action = q.availableActions.find((a) => a.id === answer);
  const sequence =
    q.puzzleType === "arrangeSequence" ? sequenceIds(q, answer) : null;
  const program = sequence
    ? sequence.map(
        (id) => q.availableActions.find((a) => a.id === id)!.command!,
      )
    : (action?.program ??
      (action?.command ? [action.command] : (q.program ?? [])));
  const result = runProgram(initial, program);
  const correct =
    acceptsAnswer(q, answer) &&
    (q.puzzleType === "arrangeSequence"
      ? !result.trace.some(
          (s) => s.output === "overflow" || s.output === "underflow",
        ) && JSON.stringify(result.stack) === JSON.stringify(q.targetStack)
      : answer === q.expectedAnswer);
  return {
    ...result,
    queueState: initialQueue,
    queueTrace: [] as QueueStep[],
    correct,
    output:
      q.puzzleType === "predictStack" || q.puzzleType === "arrangeSequence"
        ? JSON.stringify(result.stack)
        : (result.trace.at(-1)?.output ?? answer),
  };
}
export function computedAnswer(q: Question): string {
  if (q.questionTopic === "queue") {
    if (q.puzzleType !== "queuePredict") return q.expectedAnswer;
    const { state, trace } = runQueueProgram(
      queueFrom(q.initialQueue ?? []),
      q.queueProgram ?? [],
    );
    switch (q.queueAnswerKind ?? "items") {
      case "items":
        return JSON.stringify(state.items);
      case "front":
        return frontQueue(state) ?? "NIL";
      case "tail":
        return state.items.at(-1) ?? "NIL";
      case "indices":
        return `${state.head}-${state.tail}`;
      case "output":
        return trace.at(-1)?.output ?? "";
    }
  }
  const { stack } = runProgram(q.initialStack, q.program ?? []);
  switch (q.puzzleType) {
    case "selectTop":
      return peek(stack) ?? "null";
    case "predictStack":
      return JSON.stringify(stack);
    case "topIndex":
      return String(stack.length);
    case "tracePointers": {
      const linked = linkedStack(stack);
      return (
        (q.pointerTarget === "next" ? linked.nodes.at(-1)?.next : linked.TOP) ??
        "null"
      );
    }
    default:
      return q.expectedAnswer;
  }
}
export function validateQuestion(q: Question): string[] {
  const errors: string[] = [];
  const types = [
    "execute",
    "selectTop",
    "predictStack",
    "arrangeSequence",
    "topIndex",
    "tracePointers",
    "invalidOperation",
    "debugCode",
    "queueChoice",
    "queueExecute",
    "queuePredict",
    "queueDebug",
  ];
  for (const key of [
    "id",
    "topic",
    "title",
    "mission",
    "expectedAnswer",
    "explanation",
    "hint",
    "materialReference",
  ] as const)
    if (typeof q[key] !== "string" || !q[key].trim())
      errors.push(`Missing ${key}`);
  if (!types.includes(q.puzzleType)) errors.push("Unsupported puzzle type");
  if (q.basePoints !== { easy: 100, medium: 150, hard: 200 }[q.difficulty])
    errors.push("Invalid base points");
  if (
    q.initialStack.length > CAPACITY ||
    !q.initialStack.every((v) => typeof v === "string" && v.length > 0)
  )
    errors.push("Invalid initial stack");
  if (
    q.questionTopic === "queue" &&
    (!q.initialQueue || q.initialQueue.length > 4)
  )
    errors.push("Invalid initial queue");
  if (
    q.availableActions.length < 2 ||
    new Set(q.availableActions.map((a) => a.id)).size !==
      q.availableActions.length
  )
    errors.push("Invalid action IDs");
  if (!acceptsAnswer(q, q.expectedAnswer))
    errors.push("Expected answer is unavailable");
  if (computedAnswer(q) !== q.expectedAnswer)
    errors.push("Computed answer mismatch");
  const programs = [
    ...(q.program ?? []),
    ...q.availableActions.flatMap(
      (a) => a.program ?? (a.command ? [a.command] : []),
    ),
  ];
  if (
    programs.some(
      (c) =>
        !["PUSH", "POP", "PEEK", "isEmpty", "createStack"].includes(
          c.operation,
        ) ||
        (c.operation === "PUSH" && (typeof c.value !== "string" || !c.value)),
    )
  )
    errors.push("Invalid command");
  if (q.availableActions.some((a) => !a.label))
    errors.push("Missing action label");
  if (
    q.questionTopic === "queue" &&
    q.puzzleType === "queueExecute" &&
    q.availableActions.some((a) => !a.queueCommand)
  )
    errors.push("Missing queue command");
  if (!q.coverage.length || !q.coverage.includes(q.topic))
    errors.push("Missing topic coverage");
  const result = evaluateQuestion(q, q.expectedAnswer);
  if (!result.correct) errors.push("Expected answer rejected");
  if (
    q.targetStack &&
    JSON.stringify(q.targetStack) !== JSON.stringify(result.stack)
  )
    errors.push("Target stack mismatch");
  if (
    q.puzzleType === "invalidOperation" &&
    !["overflow", "underflow"].includes(result.output)
  )
    errors.push("Expected invalid operation is valid");
  if (
    q.puzzleType === "arrangeSequence" &&
    (!q.targetStack || q.availableActions.some((a) => !a.command))
  )
    errors.push("Incomplete sequence mechanic");
  if (
    q.puzzleType === "debugCode" &&
    (!q.code ||
      !q.targetStack ||
      q.availableActions.some((a) => !a.code || !a.program))
  )
    errors.push("Incomplete code mechanic");
  if (
    (q.puzzleType === "execute" || q.puzzleType === "invalidOperation") &&
    q.availableActions.some((a) => !a.command)
  )
    errors.push("Missing executable action");
  return errors;
}
