import type { Player } from "../../types/game";
export function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Player>;
  return (
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 40 &&
    !/[\u0000-\u001f\u007f]/.test(p.name) &&
    typeof p.nim === "string" &&
    /^[A-Za-z0-9.-]{3,24}$/.test(p.nim) &&
    typeof p.className === "string" &&
    p.className.trim().length > 0 &&
    p.className.length <= 40 &&
    !/[\u0000-\u001f\u007f]/.test(p.className)
  );
}
