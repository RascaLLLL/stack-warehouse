"use client";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Stage } from "@/types/game";
import { GameDialog } from "@/components/ui/game-dialog";
import { PixelWorker } from "@/components/warehouse/pixel-worker";
export function RoomTransition({
  stage,
  open,
  onEnter,
  onClose,
}: {
  stage: Stage;
  open: boolean;
  onEnter: () => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <GameDialog
      open={open}
      onClose={onClose}
      title="Pintu gudang terbuka"
      className="room-transition"
    >
      <div className="transition-door">
        <motion.div
          className="door-shutter"
          aria-hidden="true"
          initial={false}
          animate={{ y: open ? -48 : 0 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: "easeOut" }}
        />
        <span>RUANG {String(stage.id).padStart(2, "0")}</span>
        <PixelWorker />
      </div>
      <span className="eyebrow">ORIENTASI / {stage.topic}</span>
      <h3>{stage.title}</h3>
      <p>{stage.description}</p>
      <p className="development-label">
        Masuk untuk menjelajahi antarmuka. Puzzle belum aktif.
      </p>
      <button className="button" onClick={onEnter}>
        Masuk ruangan <ArrowRight size={18} />
      </button>
    </GameDialog>
  );
}
