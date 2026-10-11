"use client";
import { Check, RotateCcw } from "lucide-react";
import type { MissionOutcome } from "@/types/game";
import { GameDialog } from "@/components/ui/game-dialog";
// Hanya mesin permainan yang boleh memasok outcome; tidak menciptakan hasil contoh.
export function OutcomeModal({
  outcome,
  onClose,
  onContinue,
}: {
  outcome: MissionOutcome | null;
  onClose: () => void;
  onContinue: () => void;
}) {
  const success = outcome?.kind === "success";
  return (
    <GameDialog
      open={outcome !== null}
      onClose={onClose}
      title={outcome?.title ?? "Hasil misi"}
      className={`outcome-dialog ${success ? "outcome-success" : "outcome-failure"}`}
    >
      <div className="outcome-emblem">
        {success ? <Check size={42} /> : <RotateCcw size={42} />}
      </div>
      <p className="dialog-intro">{outcome?.message}</p>
      <button className="button" onClick={onContinue}>
        {success ? "Lanjutkan" : "Coba kembali"}
      </button>
    </GameDialog>
  );
}
