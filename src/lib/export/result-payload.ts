import type { Player } from "../../types/game";
import { isPlayer } from "../game/player";
import {
  recoverSession,
  startEngine,
  transition,
  type SavedSession,
} from "../game/engine";
import { crc32 } from "./crc32";
export const RESULT_APPLICATION = "id.stackwarehouse.result" as const;
export const RESULT_VERSION = 3 as const;
export type ResultReport = {
  player: Player;
  sessionId: string;
  sessionSeed: number;
  attemptNumber: number;
  score: number;
  stackScore: number;
  queueScore: number;
  stackCorrect: number;
  queueCorrect: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeoutCount: number;
  hintUsage: number;
  completedRooms: number[];
  remainingLives: number;
  accuracy: number;
  totalTimeMs: number;
  wallDurationMs: number;
  startedAt: string;
  completedAt: string;
  completionStatus: "victory" | "gameOver";
  totalStages: 20;
};
export type ResultPayload = {
  application: typeof RESULT_APPLICATION;
  version: typeof RESULT_VERSION;
  checksumAlgorithm: "CRC32-IEEE/UTF8";
  report: ResultReport;
  session: SavedSession;
  verificationCode: string;
};
// Sorted object keys; arrays retain order. JSON numbers/strings; no whitespace, NFC
// conversion, or locale formatting. Reject values JSON would silently discard.
export function canonicalSerialize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value))
    return JSON.stringify(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!Object.hasOwn(value, i))
        throw new Error("Array sparse tidak didukung.");
    }
    return `[${value.map(canonicalSerialize).join(",")}]`;
  }
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return `{${Object.keys(value)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonicalSerialize((value as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  throw new Error("Nilai tidak didukung serialisasi kanonis.");
}
export function verificationCode(
  value: Omit<ResultPayload, "verificationCode">,
): string {
  const hex = crc32(new TextEncoder().encode(canonicalSerialize(value)))
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `SW3-${hex.slice(0, 4)}-${hex.slice(4)}`;
}
export function createResultPayload(
  saved: SavedSession,
  player: Player,
): ResultPayload {
  if (!isPlayer(player) || !recoverSession(saved))
    throw new Error("Sesi atau identitas tidak valid.");
  const epoch = (n: number) =>
    Number.isSafeInteger(n) && Math.abs(n) <= 8.64e15;
  if (
    saved.sessionId.length > 128 ||
    /[\u0000-\u001f]/.test(saved.sessionId) ||
    !epoch(saved.startedAt) ||
    saved.events.some((e) => !epoch(e.now))
  )
    throw new Error("Session ID atau timestamp sesi tidak valid.");
  const attemptNumber = saved.attemptNumber ?? 1;
  if (!Number.isSafeInteger(attemptNumber) || attemptNumber < 1)
    throw new Error("Nomor permainan tidak valid.");
  let state = startEngine(saved.sessionId, saved.seed, saved.startedAt),
    lastTime = saved.startedAt,
    totalTimeMs = 0,
    hintUsage = 0;
  const events: SavedSession["events"] = [];
  for (const original of saved.events) {
    if (state.gameStatus === "victory" || state.gameStatus === "gameOver")
      break;
    const event =
      original.type === "submit"
        ? {
            type: original.type,
            now: original.now,
            key: original.key,
            answer: original.answer,
          }
        : original.type === "continue"
          ? { type: original.type, now: original.now, key: original.key }
          : { type: original.type, now: original.now };
    if (
      state.gameStatus === "playing" &&
      state.answerStatus === "pending" &&
      state.deadline !== null
    )
      totalTimeMs += Math.max(
        0,
        Math.min(event.now, state.deadline) - lastTime,
      );
    const next = transition(state, event);
    if (!state.hintUsed && next.hintUsed) hintUsage++;
    events.push(event);
    lastTime = event.now;
    state = next;
  }
  if (
    (state.gameStatus !== "victory" && state.gameStatus !== "gameOver") ||
    !state.sessionId
  )
    throw new Error("Laporan tersedia setelah permainan berakhir.");
  const completedTime = state.operationHistory.at(-1)!.at;
  const correctAnswers = state.operationHistory.filter((r) => r.correct).length;
  const timeoutCount = state.operationHistory.filter(
    (r) => r.operation === "TIMEOUT",
  ).length;
  const incorrectAnswers =
    state.operationHistory.length - correctAnswers - timeoutCount;
  const report: ResultReport = {
    player: { name: player.name, nim: player.nim, className: player.className },
    sessionId: state.sessionId,
    sessionSeed: state.sessionSeed,
    attemptNumber,
    score: state.score,
    stackScore: state.stackScore,
    queueScore: state.queueScore,
    stackCorrect: state.stackCorrect,
    queueCorrect: state.queueCorrect,
    correctAnswers,
    incorrectAnswers,
    timeoutCount,
    hintUsage,
    completedRooms: state.completedRooms,
    remainingLives: state.lives,
    accuracy:
      Math.round((correctAnswers / state.operationHistory.length) * 10000) /
      100,
    totalTimeMs,
    wallDurationMs: completedTime - saved.startedAt,
    startedAt: new Date(saved.startedAt).toISOString(),
    completedAt: new Date(completedTime).toISOString(),
    completionStatus: state.gameStatus,
    totalStages: 20,
  };
  const session: SavedSession = {
    bankVersion: saved.bankVersion,
    questionIds: [...saved.questionIds],
    sessionId: saved.sessionId,
    seed: saved.seed,
    startedAt: saved.startedAt,
    attemptNumber,
    events,
  };
  const unsigned = {
    application: RESULT_APPLICATION,
    version: RESULT_VERSION,
    checksumAlgorithm: "CRC32-IEEE/UTF8" as const,
    report,
    session,
  };
  return { ...unsigned, verificationCode: verificationCode(unsigned) };
}
export function validateResultPayload(value: unknown): ResultPayload {
  if (!value || typeof value !== "object")
    throw new Error("Payload bukan objek.");
  const p = value as ResultPayload;
  if (
    p.application !== RESULT_APPLICATION ||
    p.version !== RESULT_VERSION ||
    p.checksumAlgorithm !== "CRC32-IEEE/UTF8"
  )
    throw new Error("Aplikasi, versi, atau algoritma tidak didukung.");
  if (!p.report || !p.session || typeof p.verificationCode !== "string")
    throw new Error("Payload laporan tidak lengkap.");
  const { verificationCode: code, ...unsigned } = p;
  if (verificationCode(unsigned) !== code)
    throw new Error("Checksum tidak cocok. Data mungkin rusak atau berubah.");
  const expected = createResultPayload(p.session, p.report.player);
  if (canonicalSerialize(expected) !== canonicalSerialize(p))
    throw new Error("Field laporan tidak konsisten dengan jurnal sesi.");
  return expected;
}
export function resultFilename(p: ResultPayload): string {
  const safe = (text: string) =>
    text
      .normalize("NFC")
      .replace(/[^\p{L}\p{N}.-]+/gu, "_")
      .replace(/^[._-]+|[._-]+$/g, "") || "Operator";
  return `StackWarehouse_${safe(p.report.player.nim)}_${safe(p.report.player.name)}_${p.report.attemptNumber}.png`;
}
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}
