import {
  decodeResultMetadata,
  hasPngSignature,
  MAX_PNG_BYTES,
  PngResultError,
} from "../export/png-metadata";
import type { ResultReport } from "../export/result-payload";
import { manualFieldsFromReport, manualVerificationCode } from "./manual";
export type CheckStatus =
  "VALID FORMAT" | "INVALID" | "NO DATA" | "UNSUPPORTED";
export type CheckRow = {
  id: number;
  filename: string;
  status: CheckStatus;
  message: string;
  report: ResultReport | null;
  verificationCode: string;
  manualCode: string;
};
export type LocalFile = {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};
export async function decodeImageLocally(bytes: Uint8Array): Promise<void> {
  const blob = new Blob([bytes as BlobPart], { type: "image/png" });
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    bitmap.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function inspectFile(
  file: LocalFile,
  id: number,
  decodePixels: (bytes: Uint8Array) => Promise<void> = decodeImageLocally,
): Promise<CheckRow> {
  const base = {
    id,
    filename: file.name,
    report: null,
    verificationCode: "",
    manualCode: "",
  };
  try {
    if (!/\.png$/i.test(file.name))
      throw new Error(
        "Ekstensi file harus .png. Mengganti ekstensi JPG tidak mengubah formatnya.",
      );
    if (file.size > MAX_PNG_BYTES)
      throw new Error("File melebihi batas 20 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasPngSignature(bytes))
      throw new Error(
        "Signature PNG tidak cocok; file bukan PNG atau sudah rusak.",
      );
    let payload;
    let classification: PngResultError | null = null;
    try {
      payload = decodeResultMetadata(bytes);
    } catch (error) {
      if (error instanceof PngResultError) classification = error;
      else throw error;
    }
    try {
      await decodePixels(bytes);
    } catch {
      throw new Error(
        "Data pixel PNG gagal didekode. Gambar rusak meskipun header atau CRC chunk dapat dibaca.",
      );
    }
    if (classification)
      return {
        ...base,
        status: classification.code,
        message: classification.message,
      };
    if (!payload) throw new Error("Payload tidak ditemukan.");
    return {
      ...base,
      status: "VALID FORMAT",
      message:
        "Schema, CRC PNG, checksum payload, dan konsistensi jurnal cocok. Ini bukan bukti keaslian atau anti-edit.",
      report: payload.report,
      verificationCode: payload.verificationCode,
      manualCode: manualVerificationCode(
        manualFieldsFromReport(payload.report),
      ),
    };
  } catch (error) {
    return {
      ...base,
      status: "INVALID",
      message: error instanceof Error ? error.message : "File gagal dibaca.",
    };
  }
}
export function duplicateSessions(
  rows: CheckRow[],
): Map<string, { count: number; conflict: boolean }> {
  const groups = new Map<string, CheckRow[]>();
  for (const row of rows)
    if (row.report) {
      const id = row.report.sessionId;
      const group = groups.get(id);
      if (group) group.push(row);
      else groups.set(id, [row]);
    }
  return new Map(
    [...groups]
      .filter(([, r]) => r.length > 1)
      .map(([id, r]) => [
        id,
        {
          count: r.length,
          conflict: new Set(r.map((x) => x.verificationCode)).size > 1,
        },
      ]),
  );
}
export function batchSummary(rows: CheckRow[]) {
  const duplicates = duplicateSessions(rows);
  return {
    total: rows.length,
    valid: rows.filter((r) => r.status === "VALID FORMAT").length,
    invalid: rows.filter((r) => r.status === "INVALID").length,
    noData: rows.filter((r) => r.status === "NO DATA").length,
    unsupported: rows.filter((r) => r.status === "UNSUPPORTED").length,
    duplicateSessions: duplicates.size,
    duplicateFiles: [...duplicates.values()].reduce((n, g) => n + g.count, 0),
  };
}
export function filterAndSort(
  rows: CheckRow[],
  query: string,
  sort: "score-desc" | "score-asc" | "upload",
): CheckRow[] {
  const search = query.normalize("NFC").trim().toLocaleLowerCase("id-ID");
  const found = rows.filter(
    (r) =>
      !search ||
      (r.report &&
        [r.report.player.name, r.report.player.nim].some((s) =>
          s.normalize("NFC").toLocaleLowerCase("id-ID").includes(search),
        )),
  );
  return [...found].sort((a, b) => {
    if (sort === "upload") return a.id - b.id;
    if (!a.report && !b.report) return a.id - b.id;
    if (!a.report) return 1;
    if (!b.report) return -1;
    return (
      (sort === "score-desc"
        ? b.report.score - a.report.score
        : a.report.score - b.report.score) || a.id - b.id
    );
  });
}
export function resultsCsv(rows: CheckRow[]): string {
  const groups = duplicateSessions(rows),
    headers = [
      "Filename",
      "Nama",
      "NIM",
      "Kelas",
      "Skor",
      "Benar",
      "Hint",
      "Percobaan",
      "Kode verifikasi PNG",
      "Kode manual",
      "Status pemeriksaan",
      "Session ID",
      "Duplikat sesi",
      "Penjelasan",
    ];
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\ufeff" +
    [
      headers,
      ...rows.map((r) => {
        const p = r.report,
          d = p ? groups.get(p.sessionId) : null;
        return [
          r.filename,
          p?.player.name,
          p?.player.nim,
          p?.player.className,
          p?.score,
          p?.correctAnswers,
          p?.hintUsage,
          p?.attemptNumber,
          r.verificationCode,
          r.manualCode,
          r.status,
          p?.sessionId,
          d ? (d.conflict ? "Sesi sama, data berbeda" : "Sesi sama") : "",
          r.message,
        ];
      }),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n") +
    "\r\n"
  );
}
export function downloadCsv(rows: CheckRow[]): void {
  const blob = new Blob([resultsCsv(rows)], { type: "text/csv;charset=utf-8" }),
    url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = "StackWarehouse_Rekap_Pemeriksaan.csv";
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
