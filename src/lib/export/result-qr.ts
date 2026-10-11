import QRCode from "qrcode";
import type { ResultPayload } from "./result-payload";
export function compactQrPayload(p: ResultPayload): string {
  const r = p.report;
  return JSON.stringify({
    app: "SW",
    v: 2,
    code: p.verificationCode,
    data: [
      r.player.name,
      r.player.nim,
      r.player.className,
      r.score,
      r.correctAnswers,
      r.incorrectAnswers,
      r.timeoutCount,
      r.hintUsage,
      r.completedRooms,
      r.remainingLives,
      r.accuracy,
      r.totalTimeMs,
      r.wallDurationMs,
      r.attemptNumber,
      r.sessionId,
      r.completedAt,
      r.completionStatus,
    ],
  });
}
export async function createResultQr(
  p: ResultPayload,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, compactQrPayload(p), {
    errorCorrectionLevel: "M",
    margin: 4,
    scale: 3,
    color: { dark: "#101b2aff", light: "#ffffffff" },
  });
  // Keep an integer module scale even for maximum-length Unicode identities.
  if (canvas.width > 300)
    await QRCode.toCanvas(canvas, compactQrPayload(p), {
      errorCorrectionLevel: "M",
      margin: 4,
      scale: 2,
      color: { dark: "#101b2aff", light: "#ffffffff" },
    });
  return canvas;
}
