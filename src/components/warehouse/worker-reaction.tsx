"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { PixelWorker } from "./pixel-worker";
import type { EffectBatch } from "@/lib/effects/events";

export function WorkerReaction({
  event,
  paused,
  terminal,
}: {
  event: EffectBatch | null;
  paused: boolean;
  terminal: "victory" | "gameOver" | null;
}) {
  const reduced = useReducedMotion();
  const [working, setWorking] = useState(Boolean(event?.record?.trace.length));
  useEffect(() => {
    if (!event?.record?.trace.length || reduced) return;
    const timer = setTimeout(
      () => setWorking(false),
      100 + event.record.trace.length * 280,
    );
    return () => clearTimeout(timer);
  }, [event, reduced]);
  const pose =
    working && !reduced
      ? "working"
      : terminal === "victory" || event?.celebration
        ? "celebrate"
        : terminal === "gameOver" || event?.shake
          ? "sad"
          : "idle";
  return (
    <div className="worker-station">
      <PixelWorker pose={pose} active={!paused} />
      <span>
        {paused
          ? "OPERATOR ISTIRAHAT"
          : event?.record
            ? "OPERASI TERCATAT"
            : "OPERATOR SIAP"}
      </span>
    </div>
  );
}
