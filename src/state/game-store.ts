"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameResult, Player } from "@/types/game";
import { isGameResult } from "@/lib/game/result";
import { isPlayer } from "@/lib/game/player";
import { safeStorage } from "@/lib/game/storage";
import { BANK_VERSION } from "@/lib/game/questions";
import { normalizeAudioPreferences } from "@/lib/effects/events";
import {
  initialEngine,
  startEngine,
  transition,
  recoverSession,
  gameResult,
  type EngineState,
  type EngineAction,
  type SavedSession,
} from "@/lib/game/engine";
type GameState = EngineState & {
  player: Player | null;
  result: GameResult | null;
  soundEnabled: boolean;
  musicMuted: boolean;
  musicPreferenceSet: boolean;
  musicVolume: number;
  sfxVolume: number;
  savedSession: SavedSession | null;
  runCount: number;
  register: (player: Player) => void;
  reset: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  setVolume: (channel: "music" | "sfx", volume: number) => void;
  start: () => void;
  dispatch: (action: EngineAction) => void;
};
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialEngine(),
      player: null,
      result: null,
      soundEnabled: false,
      musicMuted: false,
      musicPreferenceSet: false,
      musicVolume: 0.35,
      sfxVolume: 0.5,
      savedSession: null,
      runCount: 0,
      register: (player) => {
        if (isPlayer(player))
          set({ ...initialEngine(), player, result: null, savedSession: null });
      },
      reset: () =>
        set({
          ...initialEngine(),
          player: null,
          result: null,
          savedSession: null,
        }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic: () =>
        set((s) => ({ musicMuted: !s.musicMuted, musicPreferenceSet: true })),
      setVolume: (channel, volume) => {
        if (!Number.isFinite(volume)) return;
        set(
          channel === "music"
            ? {
                musicVolume: Math.max(0, Math.min(1, volume)),
                musicPreferenceSet: true,
              }
            : { sfxVolume: Math.max(0, Math.min(1, volume)) },
        );
      },
      start: () => {
        const s = get();
        if (
          !s.player ||
          (s.gameStatus !== "idle" &&
            s.gameStatus !== "victory" &&
            s.gameStatus !== "gameOver")
        )
          return;
        const sessionId = crypto.randomUUID();
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        const now = Date.now();
        const engine = startEngine(sessionId, seed, now);
        const attemptNumber = s.runCount + 1;
        set({
          ...engine,
          runCount: attemptNumber,
          result: null,
          savedSession: {
            bankVersion: BANK_VERSION,
            questionIds: engine.selectedQuestions.map((q) => q.id),
            sessionId,
            seed,
            startedAt: now,
            attemptNumber,
            events: [],
          },
        });
      },
      dispatch: (action) => {
        const s = get();
        const next = transition(s, action);
        if (next === s) return;
        // Display ticks do not bloat storage. The absolute deadline recovers them.
        const shouldSave =
          action.type !== "tick" || next.answerStatus !== s.answerStatus;
        const savedSession =
          shouldSave && s.savedSession
            ? { ...s.savedSession, events: [...s.savedSession.events, action] }
            : s.savedSession;
        const terminal =
          next.gameStatus === "victory" || next.gameStatus === "gameOver";
        set({
          ...next,
          savedSession,
          result:
            terminal && s.player
              ? gameResult(next, s.player, action.now)
              : s.result,
        });
      },
    }),
    {
      name: "stack-warehouse-v1",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage(() => localStorage)),
      partialize: (s) => ({
        player: s.player,
        result: s.result,
        soundEnabled: s.soundEnabled,
        musicMuted: s.musicMuted,
        musicPreferenceSet: s.musicPreferenceSet,
        musicVolume: s.musicVolume,
        sfxVolume: s.sfxVolume,
        savedSession: s.savedSession,
        runCount: s.runCount,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameState> | undefined;
        const player = isPlayer(saved?.player) ? saved.player : null;
        const recovered = player ? recoverSession(saved?.savedSession) : null;
        return {
          ...current,
          ...(recovered ?? initialEngine()),
          player,
          runCount: Math.max(
            Number.isSafeInteger(saved?.runCount) && saved!.runCount! >= 0
              ? saved!.runCount!
              : 0,
            Number.isSafeInteger(saved?.savedSession?.attemptNumber) &&
              saved!.savedSession!.attemptNumber! > 0
              ? saved!.savedSession!.attemptNumber!
              : recovered
                ? 1
                : 0,
          ),
          ...normalizeAudioPreferences(saved),
          savedSession: recovered ? saved!.savedSession! : null,
          result:
            recovered &&
            (recovered.gameStatus === "victory" ||
              recovered.gameStatus === "gameOver") &&
            player
              ? gameResult(
                  recovered,
                  player,
                  saved!.savedSession!.events.at(-1)!.now,
                )
              : isGameResult(saved?.result)
                ? saved.result
                : null,
        };
      },
    },
  ),
);
