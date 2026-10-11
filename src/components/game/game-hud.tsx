"use client";
import { Heart } from "lucide-react";
import type { HudSnapshot } from "@/types/game";
import { useGameStore } from "@/state/game-store";
import { useEffectsStore } from "@/state/effects-store";
import { attemptKey } from "@/lib/game/engine";
import { AudioControls } from "./audio-controls";
export function GameHud({ snapshot }: { snapshot: HudSnapshot }) {
  const key = useGameStore((s) => attemptKey(s));
  const batch = useEffectsStore((s) => s.batch);
  const active = useGameStore(
    (s) => s.gameStatus === "playing" && s.answerStatus === "pending",
  );
  const danger =
    active && snapshot.elapsedSeconds !== null && snapshot.elapsedSeconds <= 10;

  const time =
    snapshot.elapsedSeconds === null
      ? "--:--"
      : `${String(Math.floor(snapshot.elapsedSeconds / 60)).padStart(2, "0")}:${String(snapshot.elapsedSeconds % 60).padStart(2, "0")}`;
  return (
    <section
      className={`game-hud ${danger ? "time-danger" : ""}`}
      aria-label="Status permainan"
    >
      <div className="hud-life">
        <span className="hud-label">NYAWA</span>
        <div
          className="hearts"
          aria-label={
            snapshot.hearts === null
              ? "Tiga slot nyawa; permainan belum aktif"
              : `${snapshot.hearts} nyawa tersisa`
          }
        >
          {[1, 2, 3].map((n) => (
            <Heart
              key={`${n}:${batch?.key === key && batch.heart === n ? batch.key : "stable"}`}
              size={21}
              aria-hidden="true"
              fill={
                snapshot.hearts !== null && n <= snapshot.hearts
                  ? "currentColor"
                  : "none"
              }
              className={`${snapshot.hearts === null ? "heart-inactive" : ""} ${batch?.key === key && batch.heart === n ? `heart-${batch.life}` : ""}`}
            />
          ))}
        </div>
      </div>
      <div>
        <span className="hud-label">RUANG</span>
        <strong>
          {String(snapshot.room).padStart(2, "0")}
          <small> / {snapshot.totalStages}</small>
        </strong>
      </div>
      <div>
        <span className="hud-label">SKOR</span>
        <strong>{snapshot.score === null ? "—" : snapshot.score}</strong>
      </div>
      <div className="hud-timer">
        <span className="hud-label">WAKTU {danger ? "· SEGERA!" : ""}</span>
        <strong>{time}</strong>
      </div>
      <div className="hud-progress">
        <span className="hud-label">
          PROGRES{" "}
          <b>
            {snapshot.completedStages}/{snapshot.totalStages}
          </b>
        </span>
        <progress
          value={snapshot.completedStages}
          max={snapshot.totalStages}
          aria-label="Tahap yang selesai"
        />
      </div>
      <AudioControls compact />
    </section>
  );
}
