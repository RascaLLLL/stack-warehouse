export const MAX_SCORE = 2100; // 3×100 + 4×150 + 3×200 + 10×30×2.
export function stagePoints(
  basePoints: number,
  remainingSeconds: number,
  hintUsed: boolean,
): number {
  const earned =
    basePoints + Math.min(30, Math.max(0, Math.floor(remainingSeconds))) * 2;
  return earned * (hintUsed ? 0.75 : 1);
}
export function scoreAnswer(
  lives: number,
  streak: number,
  correct: boolean,
  remainingTime: number,
  hintUsed: boolean,
  basePoints = 100,
) {
  if (!correct)
    return { lives: Math.max(0, lives - 1), correctStreak: 0, points: 0 };
  const restore = streak + 1 === 3;
  return {
    lives: Math.min(3, lives + (restore ? 1 : 0)),
    correctStreak: restore ? 0 : streak + 1,
    points: stagePoints(basePoints, remainingTime, hintUsed),
  };
}
