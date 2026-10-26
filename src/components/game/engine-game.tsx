"use client";
import { useState } from "react";
import { linkedStack } from "@/lib/game/stack";
import { CAPACITY, attemptKey } from "@/lib/game/engine";
import { useGameStore } from "@/state/game-store";
import { stages } from "@/data/stages";
import { GameHud } from "./game-hud";
import Link from "next/link";
import { PuzzleControls } from "./puzzle-controls";
import { WarehouseEnvironment } from "@/components/warehouse/warehouse-environment";
import { AnimatedStack } from "@/components/warehouse/animated-stack";
import { QueueVisualization } from "@/components/warehouse/queue-visualization";
import { TOTAL_STAGES } from "@/lib/game/questions";
import { WorkerReaction } from "@/components/warehouse/worker-reaction";
import { DoorArrival, PixelCelebration, EndScene } from "./pixel-effects";
import { useEffectsStore } from "@/state/effects-store";

export function EngineGame() {
  const s = useGameStore();
  const [mode, setMode] = useState<"array" | "linked">("array");
  const key = attemptKey(s);
  const active = s.gameStatus === "playing" && s.answerStatus === "pending";
  const terminal = s.gameStatus === "victory" || s.gameStatus === "gameOver";
  const q = s.selectedQuestions[s.currentRoom - 1];
  const stage = stages[s.currentRoom - 1];
  const isQueue = s.currentZone === "queue";
  const last = s.operationHistory.at(-1);
  const feedback = s.answerStatus !== "pending" && last?.questionId === q?.id;
  const batch = useEffectsStore((s) => s.batch);
  const entry = useEffectsStore((s) => s.entry);
  const event = batch?.key === key ? batch : null;
  return (
    <div className="game-effects-frame">
      <div className="game-page-title">
        <div>
          <div className="eyebrow">STACK WAREHOUSE / RUANG {s.currentRoom}</div>
          <h1 className="page-title pixel-heading">{stage.title}</h1>
        </div>
        <Link href="/result" className="button button-secondary">
          Laporan
        </Link>
      </div>
      <div className="operator-line">
        <span>
          <strong>{s.player?.name}</strong>
          <span>
            {s.player?.nim} · {s.player?.className}
          </span>
        </span>
        <button className="text-link" onClick={s.reset}>
          Ganti operator
        </button>
      </div>
      <GameHud
        snapshot={{
          hearts: s.lives,
          room: s.currentRoom,
          score: s.score,
          elapsedSeconds: s.remainingTime,
          completedStages: s.completedRooms.length,
          totalStages: TOTAL_STAGES,
        }}
      />
      {s.gameStatus === "idle" ? (
        <section className="pixel-panel engine-panel">
          <h2>Siap bertugas?</h2>
          {s.oldSaveIncompatible && (
            <p role="status">
              Sesi lama berisi 10 ruang Stack dan tidak dapat dilanjutkan
              sebagai petualangan 20 ruang. Mulai sesi baru untuk bermain Stack
              dan Queue. Laporan lama tetap tersimpan di browser.
            </p>
          )}
          <p>
            20 ruang: 10 Stack lalu 10 Queue. Tiga nyawa, 30 detik per ruang.
            Setiap 3 jawaban benar berurutan memulihkan 1 nyawa (maksimal 3).
            Salah atau waktu habis mengurangi 1 nyawa; ulangi ruang sampai
            benar.
          </p>
          <button className="button" onClick={s.start}>
            Mulai permainan
          </button>
        </section>
      ) : (
        <>
          {s.currentRoom === 11 && !s.queueTutorialDone && (
            <div
              className="queue-tutorial-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label="Pengenalan Queue Logistics"
            >
              <div className="queue-tutorial pixel-panel">
                <div className="queue-door" aria-hidden="true">
                  ▥ → 🚚
                </div>
                <div className="eyebrow">ZONA BARU TERBUKA</div>
                <h2>Logistik Queue</h2>
                <p>
                  <strong>Stack:</strong> terakhir masuk, pertama keluar (LIFO).
                </p>
                <p>
                  <strong>Queue:</strong> pertama masuk, pertama keluar (FIFO).
                  Paket baru masuk di TAIL; truk mengambil dari HEAD.
                </p>
                <button
                  className="button"
                  onClick={() =>
                    s.dispatch({ type: "enterQueue", now: Date.now() })
                  }
                >
                  Buka jalur pengiriman
                </button>
              </div>
            </div>
          )}
          <div className="room-environment-wrap">
            <WarehouseEnvironment room={stage} />
            {entry === `${s.sessionId}:${s.currentRoom}:${s.attempt}:enter` && (
              <DoorArrival
                key={entry}
                room={s.currentRoom}
                name={stage.title}
              />
            )}
          </div>
          <div
            className={`engine-layout ${event?.shake ? "answer-shake" : ""}`}
            style={{ borderTop: `3px solid ${stage.accent}` }}
          >
            <section
              className="pixel-panel engine-panel"
              aria-label={
                isQueue
                  ? "Visualisasi queue aktual"
                  : "Visualisasi stack aktual"
              }
            >
              <div className="panel-kicker">
                {isQueue ? "QUEUE AKTUAL" : "STACK AKTUAL"}{" "}
                <span>
                  {isQueue ? s.queueItems.length : s.stackItems.length}/
                  {CAPACITY} PETI
                </span>
              </div>
              <div className="engine-buttons">
                <button
                  className="button button-secondary"
                  aria-pressed={mode === "array"}
                  onClick={() => setMode("array")}
                >
                  Array
                </button>
                <button
                  className="button button-secondary"
                  aria-pressed={mode === "linked"}
                  onClick={() => setMode("linked")}
                >
                  Daftar tertaut
                </button>
              </div>
              <WorkerReaction
                key={`worker:${key}:${event?.key ?? "idle"}`}
                event={event}
                paused={s.gameStatus === "paused"}
                terminal={
                  s.gameStatus === "victory" || s.gameStatus === "gameOver"
                    ? s.gameStatus
                    : null
                }
              />
              {isQueue ? (
                <QueueVisualization
                  items={s.queueItems}
                  head={s.queueHead}
                  tail={s.queueTail}
                  mode={mode}
                  last={
                    last?.questionId === q.id ? last.queueTrace.at(-1) : null
                  }
                />
              ) : (
                <AnimatedStack
                  key={`${key}:${event?.key ?? "static"}`}
                  stack={s.stackItems}
                  mode={mode}
                  event={event?.record ?? null}
                />
              )}
              {last?.questionId === q.id && (
                <div className="operation-feedback" aria-live="polite">
                  <strong>
                    {last.operation} → {last.output}
                  </strong>
                  <p>
                    [{last.before.join(", ")}] → [{last.after.join(", ")}]
                  </p>
                  {!isQueue && (
                    <p>
                      TOP array: {last.before.length} → {last.after.length}; TOP
                      pointer: {linkedStack(last.before).TOP ?? "null"} →{" "}
                      {linkedStack(last.after).TOP ?? "null"}
                    </p>
                  )}
                  {isQueue && (
                    <p>
                      HEAD: {last.queueTrace[0]?.before.head ?? s.queueHead} →{" "}
                      {s.queueHead}; TAIL:{" "}
                      {last.queueTrace[0]?.before.tail ?? s.queueTail} →{" "}
                      {s.queueTail}
                    </p>
                  )}
                  <ol>
                    {last.trace.map((step, i) => (
                      <li key={i}>
                        {step.command.operation}({step.command.value ?? ""}) →{" "}
                        {step.output}: [{step.before.join(", ")}] → [
                        {step.after.join(", ")}]<br />
                        TOP {step.before.length} → {step.after.length}; pointer{" "}
                        {linkedStack(step.before).TOP ?? "null"} →{" "}
                        {linkedStack(step.after).TOP ?? "null"}
                      </li>
                    ))}
                  </ol>
                  {isQueue && (
                    <ol>
                      {last.queueTrace.map((step, i) => (
                        <li key={i}>
                          {step.command.operation}({step.command.value ?? ""}) →{" "}
                          {step.output}: [{step.before.items.join(", ")}] → [
                          {step.after.items.join(", ")}]{" "}
                          {step.shifted ? "· geser ke awal array" : ""}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </section>
            <section className="pixel-panel engine-panel">
              {feedback && (
                <div className="stage-explanation" role="status">
                  {event?.celebration && <PixelCelebration key={event.key} />}
                  <h3>
                    {s.answerStatus === "correct"
                      ? "Benar!"
                      : s.answerStatus === "timeout"
                        ? "Waktu habis. −1 nyawa."
                        : "Jawaban salah. −1 nyawa."}
                  </h3>
                  <p>{q.explanation}</p>
                  <p>
                    Jawaban acuan:{" "}
                    {q.puzzleType === "arrangeSequence"
                      ? (JSON.parse(q.expectedAnswer) as string[])
                          .map(
                            (id) =>
                              q.availableActions.find((a) => a.id === id)!
                                .label,
                          )
                          .join(" → ")
                      : q.availableActions.find(
                          (a) => a.id === q.expectedAnswer,
                        )!.label}
                  </p>
                  <p>
                    <strong>+{last.earnedPoints} poin</strong> · Streak{" "}
                    {s.correctStreak}/3
                  </p>
                  <small>{q.materialReference}</small>
                </div>
              )}
              {terminal ? (
                <div role="status">
                  <EndScene victory={s.gameStatus === "victory"} />
                  <h2>
                    {s.gameStatus === "victory"
                      ? "Kemenangan! 20 ruang selesai."
                      : "Permainan berakhir. Nyawa habis."}
                  </h2>
                  <p>
                    Skor {s.score} · {s.completedRooms.length}/{TOTAL_STAGES}{" "}
                    ruang selesai.
                  </p>
                  <div className="engine-buttons">
                    <Link className="button" href="/result">
                      Lihat laporan
                    </Link>
                    <button
                      className="button button-secondary"
                      onClick={s.start}
                    >
                      Main lagi
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="panel-kicker">
                    MISI RUANG {s.currentRoom}
                    <span>{isQueue ? "ANTREAN" : "TUMPUKAN"}</span>
                  </div>
                  <h2>{q.title}</h2>
                  <p>{q.mission}</p>
                  <p className="form-help">
                    {
                      { easy: "MUDAH", medium: "SEDANG", hard: "SULIT" }[
                        q.difficulty
                      ]
                    }{" "}
                    · {q.basePoints} poin + sisa detik × 2 · {q.topic}
                  </p>
                  <PuzzleControls
                    key={key}
                    question={q}
                    active={active}
                    savedAnswer={feedback ? last?.answer : null}
                    onSubmit={(answer) =>
                      s.dispatch({
                        type: "submit",
                        key,
                        answer,
                        now: Date.now(),
                      })
                    }
                  />
                  <div className="engine-buttons">
                    <button
                      className="button button-secondary"
                      disabled={!active || s.hintUsed}
                      onClick={() =>
                        s.dispatch({ type: "hint", now: Date.now() })
                      }
                    >
                      Petunjuk (−25% poin tahap)
                    </button>
                    <button
                      className="button button-secondary"
                      disabled={!active && s.gameStatus !== "paused"}
                      onClick={() =>
                        s.dispatch({
                          type: s.gameStatus === "paused" ? "resume" : "pause",
                          now: Date.now(),
                        })
                      }
                    >
                      {s.gameStatus === "paused" ? "Lanjutkan timer" : "Jeda"}
                    </button>
                  </div>
                  {s.hintUsed && <p className="mission-hint">{q.hint}</p>}
                  {s.gameStatus === "paused" && (
                    <p role="status">
                      Permainan dijeda. Timer dan operasi berhenti sampai
                      dilanjutkan.
                    </p>
                  )}
                  {s.answerStatus !== "pending" && (
                    <div role="status">
                      <button
                        className="button"
                        onClick={() =>
                          s.dispatch({ type: "continue", key, now: Date.now() })
                        }
                      >
                        {s.answerStatus === "correct"
                          ? "Ruang berikutnya"
                          : "Coba kembali"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
          <details className="room-map">
            <summary>Riwayat operasi · {s.operationHistory.length}</summary>
            <ol>
              {s.operationHistory.map((h) => (
                <li key={h.attempt}>
                  Ruang {h.room}: {h.operation} · [{h.before.join(", ")}] → [
                  {h.after.join(", ")}] · hasil {h.output} ·{" "}
                  {h.correct ? "benar" : "gagal"}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      <p className="form-help">
        Progres tersimpan di browser ini. Timer tetap berjalan saat tab
        ditinggalkan atau halaman dimuat ulang; gunakan Jeda untuk
        menghentikannya.
      </p>
    </div>
  );
}
