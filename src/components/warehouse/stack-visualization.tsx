"use client";
import { motion } from "motion/react";
export function StackVisualization({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect?: (crate: string) => void;
}) {
  return (
    <div
      className="scene-stack"
      role="group"
      aria-label="Ilustrasi stack: C teratas, B di tengah, A terbawah"
    >
      <div className="top-marker">TOP →</div>
      {["C", "B", "A"].map((crate, index) => {
        const contents = (
          <>
            <span className="crate-letter">{crate}</span>
            <span className="crate-code">
              KARGO
              <br />
              00{3 - index}
            </span>
            <span className="crate-rivet" aria-hidden="true" />
          </>
        );
        return onSelect ? (
          <motion.button
            key={crate}
            className={`pixel-crate ${selected === crate ? "crate-selected" : ""}`}
            onClick={() => onSelect(crate)}
            aria-pressed={selected === crate}
            aria-label={`Peti ${crate}, ${index === 0 ? "teratas" : index === 1 ? "tengah" : "terbawah"}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {contents}
          </motion.button>
        ) : (
          <div key={crate} className="pixel-crate">
            {contents}
          </div>
        );
      })}
      <div className="pixel-pallet" aria-hidden="true" />
    </div>
  );
}
