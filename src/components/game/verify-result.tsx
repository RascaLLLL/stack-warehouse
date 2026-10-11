"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  FileImage,
  Download,
  Trash2,
  ShieldCheck,
  Search,
  ClipboardCheck,
  LockKeyhole,
} from "lucide-react";
import {
  inspectFile,
  batchSummary,
  duplicateSessions,
  filterAndSort,
  downloadCsv,
  type CheckRow,
} from "@/lib/verification/batch";
import { checkManual, type ManualInput } from "@/lib/verification/manual";
const manualFields = [
  { name: "name", label: "Nama", placeholder: "Nama sesuai kartu" },
  { name: "nim", label: "NIM", placeholder: "Contoh: 24001001" },
  { name: "className", label: "Kelas", placeholder: "Contoh: TI-2A" },
  {
    name: "score",
    label: "Skor",
    placeholder: "Contoh: 2041.5",
    mode: "decimal",
  },
  {
    name: "correctAnswers",
    label: "Jumlah benar",
    placeholder: "0–10",
    mode: "numeric",
  },
  {
    name: "hintUsage",
    label: "Hint dipakai",
    placeholder: "Contoh: 1",
    mode: "numeric",
  },
  {
    name: "attemptNumber",
    label: "Percobaan ke-",
    placeholder: "Contoh: 2",
    mode: "numeric",
  },
  { name: "code", label: "Kode verifikasi", placeholder: "SWM1-XXXX-XXXX" },
] as const;
const statusClass = {
  "VALID FORMAT": "valid",
  INVALID: "invalid",
  "NO DATA": "empty",
  UNSUPPORTED: "unsupported",
};
const PAGE_SIZE = 20;
export function VerifyResult() {
  const [rows, setRows] = useState<CheckRow[]>([]),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState<"upload" | "score-desc" | "score-asc">("upload"),
    [page, setPage] = useState(1),
    [progress, setProgress] = useState({ done: 0, total: 0 }),
    [uploadMessage, setUploadMessage] = useState("");
  const [manual, setManual] = useState<{
    matches: boolean;
    message: string;
    expected?: string;
  } | null>(null);
  const input = useRef<HTMLInputElement>(null),
    job = useRef(0),
    nextId = useRef(0),
    processing = useRef(false);
  useEffect(
    () => () => {
      job.current++;
      processing.current = false;
    },
    [],
  );
  const summary = useMemo(() => batchSummary(rows), [rows]),
    duplicates = useMemo(() => duplicateSessions(rows), [rows]),
    filtered = useMemo(
      () => filterAndSort(rows, query, sort),
      [rows, query, sort],
    );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    currentPage = Math.min(page, pages),
    visible = filtered.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  async function upload(files: File[]) {
    if (!files.length || processing.current) return;
    const token = ++job.current;
    processing.current = true;
    setBusy(true);
    setDrag(false);
    setUploadMessage("");
    setProgress({ done: 0, total: files.length });
    try {
      for (let i = 0; i < files.length; i++) {
        const row = await inspectFile(files[i], ++nextId.current);
        if (job.current !== token) return;
        setRows((previous) => [...previous, row]);
        setProgress({ done: i + 1, total: files.length });
        // Sequential decoding limits memory. Yield between images for responsive mobile UI.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        if (job.current !== token) return;
      }
      setUploadMessage(
        `${files.length} file selesai diperiksa. Hasil hanya berada di memori tab ini.`,
      );
    } finally {
      if (job.current === token) {
        processing.current = false;
        setBusy(false);
        if (input.current) input.current.value = "";
      }
    }
  }
  const clear = () => {
    job.current++;
    processing.current = false;
    setBusy(false);
    setRows([]);
    setProgress({ done: 0, total: 0 });
    setUploadMessage("Hasil pemeriksaan dihapus dari tab ini.");
    setPage(1);
    setQuery("");
    if (input.current) input.current.value = "";
  };
  const exportCsv = () => downloadCsv(rows);
  return (
    <div className="shell page-space check-page">
      <div className="check-eyebrow">
        <LockKeyhole size={14} /> TERMINAL ASISTEN / PEMERIKSAAN LOKAL
      </div>
      <h1 className="check-title">CEK HASIL PRAKTIKAN</h1>
      <p className="check-subtitle">
        Semua pengecekan berjalan di browser ini saja — file tidak diunggah ke
        server mana pun.
      </p>
      <div className="check-privacy">
        <ShieldCheck size={20} />
        <p>
          <strong>VALID FORMAT berarti format dan data konsisten.</strong>{" "}
          Pemeriksaan ini tidak membuktikan keaslian, identitas, atau bahwa
          hasil bebas edit. Data praktikan tidak dikirim ke server dan tidak
          disimpan oleh halaman ini.
        </p>
      </div>
      <section className="check-panel" aria-labelledby="batch-title">
        <div className="check-section-top">
          <h2 id="batch-title">1 · CEK FILE HASIL (BANYAK SEKALIGUS)</h2>
          <span className="check-chip">PNG / PAYLOAD V2</span>
        </div>
        <input
          id="batch-files"
          ref={input}
          className="check-file-input"
          type="file"
          accept=".png,image/png"
          multiple
          disabled={busy}
          aria-label="Pilih banyak file PNG"
          onChange={(e) => void upload(Array.from(e.target.files ?? []))}
        />
        <button
          type="button"
          className={`check-dropzone ${drag ? "is-dragging" : ""}`}
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDrag(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null))
              setDrag(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDrag(false);
            if (!busy) void upload(Array.from(e.dataTransfer.files));
          }}
        >
          <span className="check-upload-icon">
            <Upload size={34} />
          </span>
          <strong>
            {busy
              ? `MEMERIKSA ${progress.done} / ${progress.total} FILE…`
              : "SERET FILE PNG KE SINI"}
          </strong>
          <span>
            {busy
              ? "Dekode lokal satu per satu. Hapus hasil untuk membatalkan."
              : "atau klik untuk memilih banyak file sekaligus"}
          </span>
          <small>
            PNG asli hasil Stack Warehouse · maksimal 20 MB per file
          </small>
        </button>
        {busy && (
          <progress
            className="check-progress"
            max={progress.total}
            value={progress.done}
            aria-label="Progres pemeriksaan file"
          />
        )}
        <p className="check-upload-message" role="status">
          {busy
            ? `Pemeriksaan berjalan: ${progress.done} dari ${progress.total} file.`
            : uploadMessage ||
              "Screenshot biasanya tidak memiliki metadata: hasilnya NO DATA, bukan VALID FORMAT."}
        </p>
        <div className="check-toolbar">
          <label className="check-search">
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau NIM…"
              aria-label="Cari nama atau NIM"
            />
          </label>
          <label className="check-sort">
            Urutan
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as typeof sort);
                setPage(1);
              }}
              aria-label="Urutkan hasil"
            >
              <option value="upload">Urutan upload</option>
              <option value="score-desc">Skor tertinggi</option>
              <option value="score-asc">Skor terendah</option>
            </select>
          </label>
          <button
            className="check-button"
            disabled={!rows.length || busy}
            onClick={exportCsv}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            className="check-button check-button-secondary"
            disabled={!rows.length && !busy}
            onClick={clear}
          >
            <Trash2 size={16} /> Hapus hasil
          </button>
        </div>
        <div
          className="check-table-scroll"
          role="region"
          aria-label="Tabel hasil pemeriksaan PNG"
          tabIndex={0}
        >
          <table className="check-table">
            <caption>
              Hasil pemeriksaan lokal · {filtered.length} file ditampilkan oleh
              filter
            </caption>
            <thead>
              <tr>
                {[
                  "Filename",
                  "Nama",
                  "NIM",
                  "Kelas",
                  "Skor",
                  "Benar",
                  "Hint",
                  "Percobaan",
                  "Kode verifikasi",
                  "Status pemeriksaan",
                ].map((c) => (
                  <th scope="col" key={c}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((row) => {
                  const r = row.report,
                    d = r ? duplicates.get(r.sessionId) : null;
                  return (
                    <tr key={row.id}>
                      <td className="check-filename" title={row.filename}>
                        <FileImage size={14} />
                        <span>{row.filename}</span>
                      </td>
                      <td>{r?.player.name ?? "—"}</td>
                      <td>{r?.player.nim ?? "—"}</td>
                      <td>{r?.player.className ?? "—"}</td>
                      <td className="check-number">{r?.score ?? "—"}</td>
                      <td className="check-number">
                        {r?.correctAnswers ?? "—"}
                      </td>
                      <td className="check-number">{r?.hintUsage ?? "—"}</td>
                      <td className="check-number">
                        {r?.attemptNumber ?? "—"}
                      </td>
                      <td className="check-code">
                        {row.verificationCode ? (
                          <>
                            <span>PNG</span>
                            <code>{row.verificationCode}</code>
                            <span>MANUAL</span>
                            <code>{row.manualCode}</code>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="check-result-cell">
                        <span
                          className={`check-badge check-badge-${statusClass[row.status]}`}
                        >
                          {row.status}
                        </span>
                        {d && (
                          <span className="check-duplicate">
                            DUPLIKAT SESI · {d.count} file
                            {d.conflict ? " · data berbeda" : ""}
                          </span>
                        )}
                        <details>
                          <summary
                            aria-label={`Detail pemeriksaan ${row.filename}`}
                          >
                            Detail pemeriksaan
                          </summary>
                          <p>{row.message}</p>
                          {r && (
                            <p className="check-session-id">
                              Session ID: {r.sessionId}
                            </p>
                          )}
                          {d && (
                            <p>
                              {d.conflict
                                ? "Session ID sama digunakan pada payload yang berbeda. Bandingkan kedua laporan secara manual."
                                : "Session ID yang sama muncul lebih dari sekali. Jangan menghitung berkas ini sebagai run tambahan."}
                            </p>
                          )}
                        </details>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="check-empty">
                    {rows.length
                      ? "Tidak ada nama atau NIM yang cocok."
                      : "Belum ada file. Pilih PNG hasil praktikan untuk memulai."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="check-pagination">
          <span>
            {filtered.length} hasil · halaman {currentPage}/{pages}
          </span>
          <div>
            <button
              className="check-button check-button-secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Sebelumnya
            </button>
            <button
              className="check-button check-button-secondary"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
        <p className="check-help">
          VALID FORMAT: schema, checksum, dan jurnal cocok · INVALID: file rusak
          atau data tidak konsisten · NO DATA: metadata tidak ditemukan ·
          UNSUPPORTED: versi belum didukung. CSV mencakup semua hasil, termasuk
          file yang tidak lolos.
        </p>
      </section>
      <section className="check-panel" aria-labelledby="manual-title">
        <div className="check-section-top">
          <h2 id="manual-title">2 · CEK MANUAL DARI SCREENSHOT</h2>
          <ClipboardCheck size={22} />
        </div>
        <p className="check-help">
          Salin <strong>KODE MANUAL SWM1</strong> pada kartu. Kode PNG SW2
          mencakup jurnal lengkap dan tidak dapat diperiksa dari field
          screenshot saja. Kartu lama yang hanya memiliki SW2 perlu file PNG
          asli.
        </p>
        <form
          onChange={() => setManual(null)}
          onSubmit={(e) => {
            e.preventDefault();
            const values = Object.fromEntries(
              new FormData(e.currentTarget),
            ) as unknown as ManualInput & { code: string };
            try {
              const checked = checkManual(values, values.code);
              setManual({
                matches: checked.matches,
                expected: checked.expectedCode,
                message: checked.matches
                  ? "FIELD KONSISTEN — nilai yang dimasukkan cocok dengan kode manual."
                  : "FIELD TIDAK COCOK — periksa ejaan, angka, atau kode yang disalin.",
              });
            } catch (error) {
              setManual({
                matches: false,
                message:
                  error instanceof Error ? error.message : "Input tidak valid.",
              });
            }
          }}
        >
          <div className="check-manual-grid">
            {manualFields.map((field) => (
              <label key={field.name} htmlFor={`manual-${field.name}`}>
                {field.label}
                <input
                  id={`manual-${field.name}`}
                  name={field.name}
                  required
                  type="text"
                  inputMode={"mode" in field ? field.mode : "text"}
                  maxLength={
                    ["name", "className"].includes(field.name) ? 80 : 32
                  }
                  placeholder={field.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
            ))}
          </div>
          <div className="check-manual-bottom">
            <button className="check-button" type="submit">
              <ShieldCheck size={17} /> CEK
            </button>
            <p className="check-help">
              Normalisasi: NFC, trim dan satu spasi pada nama/kelas; NIM huruf
              besar. Skor memakai titik atau koma desimal, tanpa pemisah ribuan.
            </p>
          </div>
          {manual && (
            <div
              className={`check-manual-feedback ${manual.matches ? "is-consistent" : "is-inconsistent"}`}
              role="status"
            >
              <strong>{manual.message}</strong>
              {manual.expected && (
                <span>
                  Kode dari input: <code>{manual.expected}</code>
                </span>
              )}
              <p>
                Kesamaan kode bukan bukti screenshot asli. Logika checksum
                terbuka dan berjalan di browser; data maupun kode dapat dibuat
                ulang.
              </p>
            </div>
          )}
        </form>
      </section>
      <section
        className="check-panel check-recap"
        aria-labelledby="recap-title"
      >
        <div className="check-section-top">
          <h2 id="recap-title">REKAP PEMERIKSAAN</h2>
          <span className="check-chip">BATCH LOKAL</span>
        </div>
        <div className="check-stat-grid">
          {[
            [
              "TOTAL UPLOADED",
              summary.total + (busy ? progress.total - progress.done : 0),
              "total",
            ],
            ["VALID FORMAT", summary.valid, "valid"],
            ["INVALID", summary.invalid, "invalid"],
            ["DUPLIKAT SESI", summary.duplicateSessions, "duplicate"],
          ].map(([label, value, tone]) => (
            <div className={`check-stat check-stat-${tone}`} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="check-recap-bottom">
          <p className="check-help">
            NO DATA: {summary.noData} · UNSUPPORTED: {summary.unsupported} ·{" "}
            {summary.duplicateFiles} file dalam {summary.duplicateSessions}{" "}
            kelompok sesi duplikat. Duplikat ditandai terpisah dari status
            format.
          </p>
          <button
            className="check-button"
            disabled={!rows.length || busy}
            onClick={exportCsv}
          >
            <Download size={17} /> Download CSV report
          </button>
        </div>
      </section>
      <p className="check-footer-note">
        <LockKeyhole size={14} /> Pemeriksaan lokal · tidak ada upload · tidak
        ada tanda tangan server
      </p>
    </div>
  );
}
