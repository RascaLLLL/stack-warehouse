export type StackOutcome<T> =
  | { ok: true; stack: T[]; value?: T }
  | { ok: false; reason: "overflow" | "underflow" };
export function push<T>(
  stack: readonly T[],
  value: T,
  capacity: number,
): StackOutcome<T> {
  if (!Number.isInteger(capacity) || capacity < 0)
    throw new RangeError("Kapasitas harus berupa bilangan bulat nonnegatif.");
  return stack.length >= capacity
    ? { ok: false, reason: "overflow" }
    : { ok: true, stack: [...stack, value] };
}
export function pop<T>(stack: readonly T[]): StackOutcome<T> {
  return stack.length === 0
    ? { ok: false, reason: "underflow" }
    : { ok: true, stack: stack.slice(0, -1), value: stack[stack.length - 1] };
}
export function peek<T>(stack: readonly T[]): T | undefined {
  return stack[stack.length - 1];
}
export const top = peek;
export function isEmpty(stack: readonly unknown[]): boolean {
  return stack.length === 0;
}
// Modul 7 uses indices 1..capacity; slot zero is never occupied.
export function arrayStack<T>(stack: readonly T[], capacity: number) {
  if (!Number.isInteger(capacity) || capacity < stack.length || capacity < 0)
    throw new RangeError("Invalid capacity");
  return {
    TOP: stack.length,
    slots: Array.from({ length: capacity + 1 }, (_, i) =>
      i === 0 ? undefined : stack[i - 1],
    ),
  };
}
export function linkedStack<T>(stack: readonly T[]) {
  const nodes = stack.map((value, i) => ({
    id: `node-${i + 1}`,
    value,
    next: i === 0 ? null : `node-${i}`,
  }));
  return { TOP: nodes.at(-1)?.id ?? null, nodes };
}
