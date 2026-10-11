import type { EngineState, OperationRecord } from "../game/engine";
export type SoundCue =
  | "click"
  | "push"
  | "pop"
  | "correct"
  | "wrong"
  | "warning"
  | "lifeRestored"
  | "stageComplete"
  | "victory"
  | "gameOver"
  | "door";
export type EffectBatch = {
  key: string;
  record: OperationRecord | null;
  life: "lost" | "restored" | null;
  heart: number | null;
  roomEntry: boolean;
  celebration: boolean;
  shake: boolean;
  cues: SoundCue[];
};
// Only committed transitions produce effects. Recovery uses the restored state as its baseline.
export function deriveEffects(
  previous: EngineState,
  next: EngineState,
): EffectBatch | null {
  const newSession = previous.sessionId !== next.sessionId;
  const roomEntry =
    next.gameStatus === "playing" &&
    (newSession ||
      previous.gameStatus === "idle" ||
      previous.currentRoom !== next.currentRoom);
  const record =
    !newSession &&
    next.operationHistory.length > previous.operationHistory.length
      ? next.operationHistory.at(-1)!
      : null;
  const cues: SoundCue[] = [];
  let life: EffectBatch["life"] = null;
  let heart: number | null = null;
  if (roomEntry) cues.push("door");
  if (record) {
    for (const step of record.trace) {
      if (step.output !== "overflow" && step.output !== "underflow") {
        if (step.command.operation === "PUSH") cues.push("push");
        if (step.command.operation === "POP") cues.push("pop");
      }
    }
    cues.push(record.correct ? "correct" : "wrong");
    if (next.lives < previous.lives) {
      life = "lost";
      heart = previous.lives;
    }
    if (next.lives > previous.lives) {
      life = "restored";
      heart = next.lives;
      cues.push("lifeRestored");
    }
    if (record.correct) cues.push("stageComplete");
    if (next.gameStatus === "victory") cues.push("victory");
    if (next.gameStatus === "gameOver") cues.push("gameOver");
  }
  const warning =
    !newSession &&
    next.gameStatus === "playing" &&
    next.answerStatus === "pending" &&
    next.remainingTime > 0 &&
    next.remainingTime <= 10 &&
    next.remainingTime < previous.remainingTime;
  if (warning) cues.push("warning");
  if (!cues.length) return null;
  return {
    key:
      record?.attempt ??
      `${next.sessionId}:${next.currentRoom}:${next.attempt}:${roomEntry ? "enter" : next.remainingTime}`,
    record,
    life,
    heart,
    roomEntry,
    celebration: record?.correct === true,
    shake: record !== null && !record.correct,
    cues,
  };
}
export type AudioPreferences = {
  musicMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  soundEnabled: boolean;
};
export function normalizeAudioPreferences(
  value:
    (Partial<AudioPreferences> & { musicPreferenceSet?: boolean }) | undefined,
): AudioPreferences & { musicPreferenceSet: boolean } {
  const volume = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(1, Math.max(0, v))
      : fallback;
  return {
    // Legacy sessions saved the default mute without recording a user choice.
    // Enable their music once; explicit choices in this version remain persistent.
    musicMuted:
      value?.musicPreferenceSet === true && value.musicMuted !== false,
    musicPreferenceSet: value?.musicPreferenceSet === true,
    musicVolume: volume(value?.musicVolume, 0.35),
    sfxVolume: volume(value?.sfxVolume, 0.5),
    soundEnabled: value?.soundEnabled === true,
  };
}
