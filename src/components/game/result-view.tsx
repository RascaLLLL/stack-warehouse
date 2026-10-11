"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Download, ArrowRight } from "lucide-react";
import {
  manualVerificationCode,
  manualFieldsFromReport,
} from "@/lib/verification/manual";
import { useGameStore } from "@/state/game-store";
import { useHydrated } from "@/components/providers";
import { ButtonLink } from "@/components/ui/button";
import {
  createResultPayload,
  resultFilename,
  formatDuration,
} from "@/lib/export/result-payload";
import { createResultPng, downloadPng } from "@/lib/export/result-png";
export function ResultView() {
  const ready = useHydrated(),
    player = useGameStore((s) => s.player),
    saved = useGameStore((s) => s.savedSession);
  const report = useMemo(() => {
    try {
      return saved && player ? createResultPayload(saved, player) : null;
    } catch {
      return null;
    }
  }, [saved, player]);
  const [preview, setPreview] = useState<{
      payload: typeof report;
      url: string;
      blob: Blob;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!report) return;
    let disposed = false,
      url: string | undefined;
    void createResultPng(report)
      .then((blob) => {
        if (disposed) return;
        url = URL.createObjectURL(blob);
        setPreview({ payload: report, url, blob });
        setError("");
      })
      .catch((e) => {
        if (!disposed)
          setError(e instanceof Error ? e.message : "PNG gagal dibuat.");
      });
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [report]);
  if (!ready)
    return (
      <div className="shell page-space loading-state" role="status">
        Memuat laporan gudang…
      </div>
    );
  if (!report)
    return (
      <div className="shell page-space">
        <div className="eyebrow">POS EVALUASI</div>
        <h1 className="page-title pixel-heading">Laporan shift.</h1>
        <section className="pixel-panel engine-panel">
          <h2>Belum ada sesi selesai.</h2>
          <p>
            Selesaikan permainan sampai victory atau game over untuk membuat
            kartu hasil lengkap dari jurnal sesi tersimpan.
          </p>
          <ButtonLink href="/play">
            Kembali ke gudang <ArrowRight size={18} />
          </ButtonLink>
        </section>
      </div>
    );
  const r = report.report,
    png = preview?.payload === report ? preview : null;
  const fields = [
    ["Nama praktikan", r.player.name],
    ["NIM", r.player.nim],
    ["Kelas", r.player.className],
    ["Skor akhir", String(r.score)],
    ["Jawaban benar", String(r.correctAnswers)],
    ["Jawaban salah", String(r.incorrectAnswers)],
    ["Timeout", String(r.timeoutCount)],
    ["Petunjuk dipakai", String(r.hintUsage)],
    [
      "Ruang selesai",
      `${r.completedRooms.length}/10 (${r.completedRooms.join(", ") || "—"})`,
    ],
    ["Sisa nyawa", `${r.remainingLives}/3`],
    ["Akurasi", `${r.accuracy}%`],
    ["Total waktu aktif", formatDuration(r.totalTimeMs)],
    ["Durasi sesi", formatDuration(r.wallDurationMs)],
    ["Nomor permainan", String(r.attemptNumber)],
    ["Session ID", r.sessionId],
    ["Selesai (UTC)", r.completedAt],
    ["Kode PNG", report.verificationCode],
    [
      "Kode manual screenshot",
      manualVerificationCode(manualFieldsFromReport(r)),
    ],
    [
      "Status",
      r.completionStatus === "victory"
        ? "Victory — semua ruang selesai"
        : "Game over — nyawa habis",
    ],
  ];
  return (
    <div className="shell page-space final-result-page">
      <div className="eyebrow">POS EVALUASI / LAPORAN SHIFT</div>
      <h1 className="page-title pixel-heading">Catatan petualangan.</h1>
      <p className="page-intro">
        {r.completionStatus === "victory"
          ? "Seluruh gudang berhasil dituntaskan."
          : "Shift berakhir. Setiap percobaan adalah langkah belajar."}
      </p>
      <div className="final-result-layout">
        <section
          className="result-card-preview"
          aria-label="Kartu hasil pixel art"
        >
          {png ? (
            <Image
              unoptimized
              src={png.url}
              width={1200}
              height={1600}
              alt={`Kartu hasil ${r.player.name}: skor ${r.score}, ${r.completionStatus}, kode ${report.verificationCode}`}
            />
          ) : (
            <div className="pixel-panel engine-panel" role="status">
              {error || "Menyiapkan kartu hasil 1200 × 1600…"}
            </div>
          )}
        </section>
        <section className="pixel-panel final-report-panel">
          <div className="panel-kicker">
            MANIFEST HASIL <span>V2</span>
          </div>
          <h2>Rincian operator</h2>
          <dl className="final-report-fields">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <button
            className="button"
            disabled={!png}
            onClick={() => {
              if (png) downloadPng(png.blob, resultFilename(report));
            }}
          >
            <Download size={18} />
            {png ? "Unduh kartu hasil PNG" : "Menyiapkan PNG…"}
          </button>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="form-help">
            PNG 1200 × 1600, dengan metadata laporan lengkap. Browser menyimpan
            ke Downloads atau lokasi pilihan Anda. Kartu dapat dibuat ulang dari
            sesi tersimpan.
          </p>
          <p className="form-help">
            Akurasi = benar ÷ seluruh percobaan, termasuk timeout. Waktu aktif
            mengecualikan jeda dan waktu membaca feedback; durasi sesi mencakup
            keduanya.
          </p>
          <p className="form-help">
            Kode memeriksa integritas dan konsistensi data lokal. Kode yang
            dibuat di browser bukan bukti keaslian, identitas, atau pencegah
            kecurangan.
          </p>
          <div className="engine-buttons">
            <ButtonLink href="/play" secondary>
              Kembali ke gudang <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
