"use client";
import { useState } from "react";
import type { Question } from "@/types/question";
import { acceptsAnswer, sequenceIds } from "@/lib/game/puzzles";
export function PuzzleControls({
  question: q,
  active,
  savedAnswer,
  onSubmit,
}: {
  question: Question;
  active: boolean;
  savedAnswer?: string | null;
  onSubmit: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const sequence = q.puzzleType === "arrangeSequence";
  const displayOrder =
    !active && savedAnswer ? (sequenceIds(q, savedAnswer) ?? order) : order;
  const selection = sequence ? JSON.stringify(order) : answer;
  return (
    <>
      {q.program && (
        <div className="puzzle-program">
          <span className="hud-label">PROGRAM YANG DITELUSURI</span>
          <code>
            {q.program
              .map((c) => `${c.operation}(${c.value ?? ""})`)
              .join(" → ")}
          </code>
        </div>
      )}
      {q.queueProgram && (
        <div className="puzzle-program">
          <span className="hud-label">JEJAK OPERASI QUEUE</span>
          <code>
            {q.queueProgram
              .map((c) => `${c.operation}(${c.value ?? ""})`)
              .join(" → ")}
          </code>
        </div>
      )}
      {q.code && (
        <pre className="puzzle-code" aria-label="Kode yang perlu diperbaiki">
          {q.code}
        </pre>
      )}
      {q.targetStack && (
        <p>Target stack (bawah → atas): [{q.targetStack.join(", ")}]</p>
      )}
      {sequence ? (
        <fieldset className="sequence-builder" disabled={!active}>
          <legend>Susun urutan operasi</legend>
          <div className="engine-buttons">
            {q.availableActions.map((a) => (
              <button
                type="button"
                className="button button-secondary"
                key={a.id}
                disabled={order.includes(a.id)}
                onClick={() => setOrder([...order, a.id])}
              >
                + {a.label}
              </button>
            ))}
          </div>
          <ol>
            {displayOrder.map((id, i) => (
              <li key={id}>
                {q.availableActions.find((a) => a.id === id)!.label}{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setOrder(order.filter((_, j) => j !== i))}
                >
                  Hapus langkah {i + 1}
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="text-link"
            onClick={() => setOrder([])}
          >
            Reset urutan
          </button>
        </fieldset>
      ) : (
        <fieldset disabled={!active} className="engine-answers">
          <legend>
            {q.puzzleType === "debugCode"
              ? "Pilih perbaikan kode"
              : q.puzzleType === "queueExecute"
                ? "Pilih operasi queue untuk dijalankan"
                : q.puzzleType === "execute"
                  ? "Pilih operasi untuk dijalankan"
                  : q.puzzleType === "invalidOperation"
                    ? "Pilih operasi yang tidak valid"
                    : q.puzzleType === "selectTop"
                      ? "Pilih peti TOP"
                      : "Pilih hasil yang benar"}
          </legend>
          {q.availableActions.map((a) => (
            <label key={a.id}>
              <input
                type="radio"
                name={`question-${q.id}`}
                value={a.id}
                checked={(savedAnswer ?? answer) === a.id}
                onChange={() => setAnswer(a.id)}
              />
              <span>
                {a.label}
                {a.code && <code className="answer-code">{a.code}</code>}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <button
        className="button"
        disabled={!active || !acceptsAnswer(q, selection)}
        onClick={() => onSubmit(selection)}
      >
        {sequence
          ? "Jalankan urutan operasi"
          : q.puzzleType === "execute" || q.puzzleType === "invalidOperation"
            ? "Jalankan operasi pilihan"
            : q.puzzleType === "queueExecute"
              ? "Jalankan operasi queue"
              : q.puzzleType === "debugCode"
                ? "Jalankan perbaikan"
                : "Kirim jawaban & telusuri"}
      </button>
    </>
  );
}
