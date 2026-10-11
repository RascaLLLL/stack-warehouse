"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WarehouseBackdrop } from "./warehouse-backdrop";
import { PixelWorker } from "./pixel-worker";
import { StackVisualization } from "./stack-visualization";
export function WarehouseScene({
  compact = false,
  interactive = false,
}: {
  compact?: boolean;
  interactive?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const reduced = useReducedMotion();
  return (
    <div className={`adventure-warehouse ${compact ? "scene-compact" : ""}`}>
      <div className="scene-toolbar">
        <span>
          <i className="status-dot" /> GUDANG 01
        </span>
        <span>
          {interactive ? "AREA ORIENTASI" : "TERAKHIR MASUK · PERTAMA KELUAR"}
        </span>
      </div>
      <div className="scene-world">
        <WarehouseBackdrop />
        <motion.div
          className="light-haze"
          aria-hidden="true"
          animate={reduced ? undefined : { opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <PixelWorker />
        <StackVisualization
          selected={selected}
          onSelect={interactive ? setSelected : undefined}
        />
        <div className="floor-stencil" aria-hidden="true">
          ZONA STACK
        </div>
      </div>
      <div className="scene-caption" aria-live="polite">
        {interactive
          ? selected
            ? `Peti ${selected} dipilih. ${selected === "C" ? "Peti teratas: pertama keluar menurut LIFO." : "Peti ini berada di bawah peti lain."}`
            : "Ketuk peti untuk melihat posisinya dalam stack."
          : "Peti C masuk terakhir, sehingga keluar paling awal."}
      </div>
      <div className="scene-status">
        <span>● {interactive ? "ORIENTASI" : "ILUSTRASI LIFO"}</span>
        <span>3 PETI · TOP = C</span>
      </div>
    </div>
  );
}
