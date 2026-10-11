import {
  validateResultPayload,
  resultFilename,
  formatDuration,
  type ResultPayload,
} from "./result-payload";
import { embedResultMetadata } from "./png-metadata";
import { createResultQr } from "./result-qr";
import {
  manualFieldsFromReport,
  manualVerificationCode,
} from "../verification/manual";
export const EXPORT_WIDTH = 1200,
  EXPORT_HEIGHT = 1600;
const palette = {
  bg: "#101b2a",
  panel: "#1b2d3f",
  cream: "#f4eedf",
  muted: "#b3c0cb",
  gold: "#eab45a",
  green: "#8ccb9e",
  red: "#e79580",
};
function wrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const character of Array.from(text)) {
    if (ctx.measureText(line + character).width > width && line) {
      lines.push(line.trimEnd());
      line = character.trimStart();
    } else line += character;
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}
export function fittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  maxSize: number,
  minSize: number,
  maxLines: number,
  font = "Arial",
  color = palette.cream,
): number {
  let size = maxSize,
    lines: string[] = [];
  for (; size >= minSize; size--) {
    ctx.font = `bold ${size}px ${font}`;
    lines = wrapped(ctx, text, width);
    if (lines.length <= maxLines) break;
  }
  if (size < minSize)
    throw new Error("Teks laporan terlalu panjang untuk kartu.");
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * size * 1.3));
  return lines.length * size * 1.3;
}
function pixelWorker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const sprite = [
    "...gggg...",
    "..gggggg..",
    "..gggggg..",
    "...ssss...",
    "...sdsd...",
    "...ssss...",
    "..gbbbbg..",
    ".sgbbbbgs.",
    ".ssbbbbss.",
    "...bbbb...",
    "...d..d...",
    "..dd..dd..",
  ];
  const colors: Record<string, string> = {
    g: palette.gold,
    s: "#d6a576",
    d: "#526477",
    b: "#8199a9",
  };
  sprite.forEach((row, py) =>
    Array.from(row).forEach((p, px) => {
      if (colors[p]) {
        ctx.fillStyle = colors[p];
        ctx.fillRect(x + px * 12, y + py * 12, 12, 12);
      }
    }),
  );
}
function crate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.fillStyle = "#6a4b2d";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = palette.gold;
  ctx.fillRect(x, y, size, 5);
  ctx.fillRect(x, y, 5, size);
  ctx.fillRect(x + size - 5, y, 5, size);
  ctx.fillRect(x, y + size - 5, size, 5);
  ctx.fillStyle = "#a77743";
  ctx.fillRect(x + 12, y + 12, size - 24, size - 24);
  ctx.fillStyle = "#60472f";
  ctx.fillRect(x + size / 2 - 4, y + 12, 8, size - 24);
}
export async function createResultPng(payload: ResultPayload): Promise<Blob> {
  validateResultPayload(payload);
  await document.fonts.load('24px "Press Start 2P"');
  await document.fonts.ready;
  const qr = await createResultQr(payload),
    canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung ekspor PNG.");
  ctx.imageSmoothingEnabled = false;
  const r = payload.report;
  const text = (
    value: string,
    x: number,
    y: number,
    size = 22,
    color = palette.cream,
    font = "Arial",
  ) => {
    ctx.font = `${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.fillText(value, x, y);
  };
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(32, 32, 1136, 1536);
  for (let x = 36; x < 1164; x += 32) {
    ctx.fillStyle = (x / 32) % 2 > 1 ? palette.gold : "#a77743";
    ctx.fillRect(x, 36, 16, 12);
    ctx.fillRect(x, 1548, 16, 12);
  }
  text(
    "LAPORAN SHIFT / THE LIFO CHALLENGE",
    72,
    80,
    20,
    palette.gold,
    "monospace",
  );
  fittedText(
    ctx,
    "STACK WAREHOUSE",
    72,
    124,
    1056,
    36,
    28,
    1,
    '"Press Start 2P"',
    palette.gold,
  );
  text(
    r.completionStatus === "victory"
      ? "10 RUANG SELESAI · VICTORY"
      : "SHIFT BERAKHIR · GAME OVER",
    72,
    190,
    24,
    r.completionStatus === "victory" ? palette.green : palette.red,
    "monospace",
  );
  for (let i = 0; i < 4; i++) crate(ctx, 680 + i * 98, 233 - (i % 2) * 22, 72);
  pixelWorker(ctx, 978, 170);
  ctx.fillStyle = palette.panel;
  ctx.fillRect(60, 320, 1080, 226);
  text("NAMA PRAKTIKAN", 84, 340, 18, palette.muted, "monospace");
  fittedText(ctx, r.player.name, 84, 370, 1032, 38, 28, 2);
  text("NIM", 84, 468, 18, palette.muted, "monospace");
  text(r.player.nim, 84, 496, 27);
  text("KELAS", 640, 460, 18, palette.muted, "monospace");
  fittedText(ctx, r.player.className, 640, 488, 470, 22, 18, 2);
  text("SKOR AKHIR", 72, 576, 20, palette.gold, "monospace");
  text(String(r.score), 72, 612, 86, palette.green, "monospace");
  text(
    `RUANG ${r.completedRooms.length} / 10`,
    704,
    606,
    28,
    palette.cream,
    "monospace",
  );
  text(
    `PERMAINAN #${r.attemptNumber}`,
    704,
    654,
    24,
    palette.muted,
    "monospace",
  );
  const metrics = [
    ["JAWABAN BENAR", String(r.correctAnswers)],
    ["JAWABAN SALAH", String(r.incorrectAnswers)],
    ["TIMEOUT", String(r.timeoutCount)],
    ["PETUNJUK DIPAKAI", String(r.hintUsage)],
    ["SISA NYAWA", `${r.remainingLives} / 3`],
    ["AKURASI", `${r.accuracy}%`],
  ];
  metrics.forEach(([label, value], i) => {
    const x = 72 + (i % 3) * 356,
      y = 730 + Math.floor(i / 3) * 124;
    ctx.fillStyle = palette.panel;
    ctx.fillRect(x, y, 336, 104);
    text(label, x + 18, y + 16, 17, palette.muted, "monospace");
    text(
      value,
      x + 18,
      y + 46,
      36,
      i === 1 || i === 2 ? palette.red : palette.cream,
      "monospace",
    );
  });
  text("WAKTU AKTIF", 72, 994, 18, palette.muted, "monospace");
  text(formatDuration(r.totalTimeMs), 72, 1020, 30);
  text("DURASI SESI", 430, 994, 18, palette.muted, "monospace");
  text(formatDuration(r.wallDurationMs), 430, 1020, 30);
  text("RUANG SELESAI", 790, 994, 18, palette.muted, "monospace");
  text(r.completedRooms.join(", ") || "—", 790, 1020, 23);
  text("SESSION ID", 72, 1080, 18, palette.muted, "monospace");
  fittedText(ctx, r.sessionId, 72, 1106, 1056, 23, 16, 2, "monospace");
  text("SELESAI (UTC)", 72, 1180, 18, palette.muted, "monospace");
  text(r.completedAt, 72, 1206, 22, palette.cream, "monospace");
  text("KODE MANUAL / SCREENSHOT", 72, 1250, 18, palette.gold, "monospace");
  fittedText(
    ctx,
    manualVerificationCode(manualFieldsFromReport(r)),
    72,
    1278,
    700,
    32,
    26,
    1,
    "monospace",
    palette.gold,
  );
  text("KODE PNG / PAYLOAD LENGKAP", 72, 1340, 18, palette.muted, "monospace");
  fittedText(
    ctx,
    payload.verificationCode,
    72,
    1366,
    700,
    26,
    22,
    1,
    "monospace",
    palette.gold,
  );
  if (qr.width > 300) throw new Error("Ringkasan QR terlalu besar.");
  ctx.drawImage(qr, 1140 - qr.width, 1176);
  fittedText(
    ctx,
    "Checksum memeriksa integritas dan konsistensi data lokal. Bukan bukti keaslian skor atau identitas.",
    72,
    1410,
    700,
    18,
    16,
    4,
    "Arial",
    palette.muted,
  );
  text("QR: RINGKASAN LOKAL", 840, 1492, 16, palette.muted, "monospace");
  text(
    "PAYLOAD V2 · PNG 1200 × 1600 · STACK WAREHOUSE",
    72,
    1510,
    17,
    palette.gold,
    "monospace",
  );
  const raw = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG gagal dibuat."))),
      "image/png",
    ),
  );
  const bytes = embedResultMetadata(
    new Uint8Array(await raw.arrayBuffer()),
    payload,
  );
  return new Blob([bytes as BlobPart], { type: "image/png" });
}
export function downloadPng(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
export async function downloadResultPng(payload: ResultPayload) {
  downloadPng(await createResultPng(payload), resultFilename(payload));
}
