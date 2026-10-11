"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { useGameStore } from "@/state/game-store";
import { EffectsRuntime } from "@/components/game/effects-runtime";
const HydrationContext = createContext(false);
export const useHydrated = () => useContext(HydrationContext);
export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve(useGameStore.persist.rehydrate())
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    const sync = () =>
      useGameStore.getState().dispatch({ type: "tick", now: Date.now() });
    sync();
    const timer = window.setInterval(sync, 200);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [ready]);
  return (
    <HydrationContext.Provider value={ready}>
      <EffectsRuntime ready={ready} />
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </HydrationContext.Provider>
  );
}
