"use client";
import { motion, useReducedMotion } from "motion/react";
import { Trophy, HardHat } from "lucide-react";
import { PixelWorker } from "@/components/warehouse/pixel-worker";
export function DoorArrival({ room, name }: { room: number; name: string }) {
  const reduced = useReducedMotion();
  return (
    <div className="door-arrival" aria-hidden="true">
      <span>
        RUANG {String(room).padStart(2, "0")} · {name}
      </span>
      <motion.div
        className="arrival-shutter"
        initial={reduced ? false : { scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: reduced ? 0 : 0.65, ease: "easeOut" }}
      />
    </div>
  );
}
export function PixelCelebration() {
  return (
    <div className="pixel-celebration" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <i
          key={i}
          style={
            {
              "--spark-x": `${((i % 5) - 2) * 34}px`,
              "--spark-delay": `${(i % 3) * 0.08}s`,
              "--spark-color": i % 2 ? "#8ccb9e" : "#eab45a",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
export function EndScene({ victory }: { victory: boolean }) {
  return (
    <div
      className={`pixel-end-scene ${victory ? "scene-victory" : "scene-gameover"}`}
    >
      <div className="end-sky" aria-hidden="true">
        {victory ? <Trophy size={66} /> : <HardHat size={66} />}
        <div className="end-worker">
          <PixelWorker pose={victory ? "celebrate" : "sad"} />
        </div>
        <div className="end-floor" />
        {victory && <PixelCelebration />}
      </div>
      <div className="end-caption">
        {victory
          ? "SHIFT SELESAI · OPERATOR TELADAN"
          : "SHIFT BERAKHIR · COBA LAGI"}
      </div>
    </div>
  );
}
