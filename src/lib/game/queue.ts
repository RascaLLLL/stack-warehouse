import type { QueueCommand } from "../../types/question";

export const QUEUE_CAPACITY = 4;
export type QueueState = { items: string[]; head: number; tail: number };
export type QueueStep = {
  command: QueueCommand;
  before: QueueState;
  after: QueueState;
  output: string;
  shifted: boolean;
};
export const emptyQueue = (): QueueState => ({ items: [], head: 0, tail: 0 });
export function queueFrom(items: readonly string[]): QueueState {
  if (items.length > QUEUE_CAPACITY)
    throw new RangeError("Kapasitas antrean terlampaui.");
  return { items: [...items], head: items.length ? 1 : 0, tail: items.length };
}
export const isEmptyQueue = (q: QueueState) => q.items.length === 0;
export const isFullQueue = (q: QueueState) => q.items.length >= QUEUE_CAPACITY;
export const frontQueue = (q: QueueState) => q.items[0] ?? null;
export const isEmpty = isEmptyQueue;
export const isFull = isFullQueue;
export const front = frontQueue;
export function linkedQueue(q: QueueState) {
  return {
    HEAD: q.items.length ? "node-1" : null,
    TAIL: q.items.length ? `node-${q.items.length}` : null,
    nodes: q.items.map((value, i) => ({
      id: `node-${i + 1}`,
      value,
      next: i + 1 < q.items.length ? `node-${i + 2}` : null,
    })),
  };
}
export function runQueueCommand(
  q: QueueState,
  command: QueueCommand,
): QueueStep {
  const before = { ...q, items: [...q.items] };
  let after = before;
  let output = "";
  let shifted = false;
  switch (command.operation) {
    case "isEmpty":
      output = String(isEmptyQueue(q));
      break;
    case "isFull":
      output = String(isFullQueue(q));
      break;
    case "FRONT":
      output = frontQueue(q) ?? "underflow";
      break;
    case "DEQUEUE":
      if (isEmptyQueue(q)) output = "underflow";
      else {
        output = q.items[0];
        const items = q.items.slice(1);
        after = items.length
          ? { items, head: q.head + 1, tail: q.tail }
          : emptyQueue();
      }
      break;
    case "ENQUEUE":
      if (!command.value) output = "invalid";
      else if (isFullQueue(q)) output = "overflow";
      else {
        shifted = q.tail === QUEUE_CAPACITY && q.head > 1;
        const items = [...q.items, command.value];
        after = {
          items,
          head: q.items.length ? (shifted ? 1 : q.head) : 1,
          tail: shifted ? items.length : q.tail + 1,
        };
        output = command.value;
      }
      break;
  }
  return { command, before, after, output, shifted };
}
export const enqueue = (q: QueueState, value: string) =>
  runQueueCommand(q, { operation: "ENQUEUE", value });
export const dequeue = (q: QueueState) =>
  runQueueCommand(q, { operation: "DEQUEUE" });
export function runQueueProgram(
  initial: QueueState,
  commands: readonly QueueCommand[],
) {
  let state = initial;
  const trace: QueueStep[] = [];
  for (const command of commands) {
    const step = runQueueCommand(state, command);
    trace.push(step);
    state = step.after;
  }
  return { state, trace };
}
