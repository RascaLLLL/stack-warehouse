import { Flag, Info } from "lucide-react";
import type { Stage } from "@/types/game";
export function MissionPanel({ stage }: { stage: Stage }) {
  return (
    <section className="mission-panel pixel-panel">
      <div className="panel-kicker">
        <Flag size={15} /> MISI RUANG {String(stage.id).padStart(2, "0")}
        <span>{stage.topic}</span>
      </div>
      <h2>{stage.title}</h2>
      <p>{stage.description}</p>
      <div className="mission-objective">
        <span className="hud-label">ORIENTASI OPERATOR</span>
        <strong>Temukan peti di posisi TOP.</strong>
        <p>
          Ketuk peti dalam ilustrasi untuk membaca posisinya. Ini eksplorasi
          visual, tanpa penilaian.
        </p>
      </div>
      <div className="mission-hint">
        <Info size={17} />
        <p>Semua operasi stack dilakukan di bagian paling atas tumpukan.</p>
      </div>
    </section>
  );
}
