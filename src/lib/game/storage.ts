/** Synchronous browser storage with an in-memory fallback and unchanged-write suppression. */
export function safeStorage(
  resolve: () => Pick<Storage, "getItem" | "setItem" | "removeItem">,
) {
  const memory = new Map<string, string>();
  return {
    getItem(name: string): string | null {
      try {
        const value = resolve().getItem(name);
        if (value === null) memory.delete(name);
        else memory.set(name, value);
        return value;
      } catch {
        return memory.get(name) ?? null;
      }
    },
    setItem(name: string, value: string): void {
      if (memory.get(name) === value) return;
      memory.set(name, value);
      try {
        resolve().setItem(name, value);
      } catch {
        // Quota/private-mode failures must not stop a live game.
      }
    },
    removeItem(name: string): void {
      memory.delete(name);
      try {
        resolve().removeItem(name);
      } catch {
        // Removing an unavailable store is harmless.
      }
    },
  };
}
