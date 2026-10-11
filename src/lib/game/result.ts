import type { GameResult } from "../../types/game";
import { isPlayer } from "./player";
import { MAX_SCORE } from "./scoring";
export function isGameResult(value: unknown): value is GameResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<GameResult>;
  return (
    r.version === 1 &&
    isPlayer(r.player) &&
    typeof r.score === "number" &&
    Number.isFinite(r.score) &&
    r.score >= 0 &&
    r.score <= MAX_SCORE &&
    typeof r.completedStages === "number" &&
    Number.isInteger(r.completedStages) &&
    r.completedStages >= 0 &&
    r.completedStages <= 10 &&
    typeof r.completedAt === "string" &&
    !Number.isNaN(Date.parse(r.completedAt))
  );
}
