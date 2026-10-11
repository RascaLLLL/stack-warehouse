"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGameStore } from "@/state/game-store";
import { useEffectsStore } from "@/state/effects-store";
import { deriveEffects } from "@/lib/effects/events";
import { retroAudio, type MusicTrack } from "@/lib/audio/sound";
function syncAudio(path: string) {
  const s = useGameStore.getState();
  retroAudio.configure(s);
  let track: MusicTrack = "menu";
  if (path === "/play" && s.gameStatus !== "idle")
    track = s.gameStatus === "playing" ? "gameplay" : null;
  retroAudio.setTrack(track);
}
export function EffectsRuntime({ ready }: { ready: boolean }) {
  const path = usePathname();
  const route = useRef(path);
  useEffect(() => {
    route.current = path;
    if (ready) syncAudio(path);
  }, [path, ready]);
  useEffect(() => {
    if (!ready) return;
    const sync = () => syncAudio(route.current);
    // Baseline is hydrated state. Do not replay past operations, sounds, or life changes.
    useEffectsStore.getState().clear();
    sync();
    const unsubscribe = useGameStore.subscribe((next, previous) => {
      const batch = deriveEffects(previous, next);
      if (batch) {
        useEffectsStore.getState().publish(batch);
        if (route.current === "/play") retroAudio.playBatch(batch.cues);
      }
      if (
        next.musicMuted !== previous.musicMuted ||
        next.musicVolume !== previous.musicVolume ||
        next.sfxVolume !== previous.sfxVolume ||
        next.soundEnabled !== previous.soundEnabled ||
        next.gameStatus !== previous.gameStatus
      )
        sync();
    });
    const unlock = (event: Event) => {
      if (event.isTrusted) void retroAudio.unlock().then(sync);
    };
    const keydown = (event: KeyboardEvent) => {
      if (!event.repeat) unlock(event);
    };
    const click = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "button:not(:disabled), a, summary, input[type=radio], input[type=checkbox]",
        )
      )
        retroAudio.play("click");
    };
    const visibility = () => {
      const visible = document.visibilityState !== "hidden";
      document.documentElement.dataset.effectsVisible = String(visible);
      retroAudio.setVisible(visible);
    };
    const pagehide = () => retroAudio.setVisible(false);
    visibility();
    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", keydown);
    document.addEventListener("click", click);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("pageshow", visibility);
    return () => {
      unsubscribe();
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("click", click);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("pageshow", visibility);
      retroAudio.dispose();
    };
  }, [ready]);
  return null;
}
