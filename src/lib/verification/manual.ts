import {
  canonicalSerialize,
  type ResultReport,
} from "../export/result-payload";
import { crc32 } from "../export/crc32";
import { MAX_SCORE } from "../game/scoring";
export type ManualFields = {
  name: string;
  nim: string;
  className: string;
  score: number;
  correctAnswers: number;
  hintUsage: number;
  attemptNumber: number;
};
export type ManualInput = Record<keyof ManualFields, string | number>;
const clean = (value: unknown) => {
  if (typeof value !== "string")
    throw new Error("Identitas harus berupa teks.");
  const text = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (
    !text ||
    text.length > 80 ||
    Array.from(text).some((c) => c.charCodeAt(0) < 32)
  )
    throw new Error(
      "Nama dan kelas wajib diisi, maksimal 80 karakter setelah normalisasi.",
    );
  return text;
};
export function normalizeManualFields(value: ManualInput): ManualFields {
  if (!value || typeof value !== "object")
    throw new Error("Field manual tidak lengkap.");
  const name = clean(value.name),
    className = clean(value.className);
  if (typeof value.nim !== "string") throw new Error("NIM wajib berupa teks.");
  const nim = value.nim.normalize("NFC").trim().toUpperCase();
  if (!/^[A-Z0-9.-]{3,24}$/.test(nim))
    throw new Error(
      "NIM wajib 3–24 karakter: huruf, angka, titik, atau tanda hubung.",
    );
  const number = (
    key: keyof ManualFields,
    integer: boolean,
    min: number,
    max: number,
  ) => {
    const label = {
      score: "Skor",
      correctAnswers: "Jumlah benar",
      hintUsage: "Hint dipakai",
      attemptNumber: "Percobaan ke-",
      name: "Nama",
      nim: "NIM",
      className: "Kelas",
    }[key];
    const raw = String(value[key] ?? "").trim();
    if (!(integer ? /^\d+$/ : /^\d+(?:[.,]\d+)?$/).test(raw))
      throw new Error(`${label}: angka wajib diisi tanpa pemisah ribuan.`);
    const n = Number(raw.replace(",", "."));
    if (
      !Number.isFinite(n) ||
      n < min ||
      n > max ||
      (integer && !Number.isSafeInteger(n))
    )
      throw new Error(`${label}: nilai di luar batas.`);
    return n;
  };
  const score = number("score", false, 0, MAX_SCORE),
    correctAnswers = number("correctAnswers", true, 0, 10),
    hintUsage = number("hintUsage", true, 0, 16),
    attemptNumber = number("attemptNumber", true, 1, Number.MAX_SAFE_INTEGER);
  if (!Number.isInteger(score * 2) || score > correctAnswers * 260)
    throw new Error(
      "Skor tidak konsisten dengan jumlah benar atau satuan poin .5.",
    );
  if (hintUsage > correctAnswers + 3 + Math.floor(correctAnswers / 3))
    throw new Error("Jumlah hint melebihi jumlah percobaan yang mungkin.");
  return {
    name,
    nim,
    className,
    score,
    correctAnswers,
    hintUsage,
    attemptNumber,
  };
}
export function manualVerificationCode(input: ManualInput): string {
  const fields = normalizeManualFields(input);
  const bytes = new TextEncoder().encode(
    canonicalSerialize({
      application: "id.stackwarehouse.manual",
      version: 1,
      ...fields,
    }),
  );
  const hex = crc32(bytes).toString(16).toUpperCase().padStart(8, "0");
  return `SWM1-${hex.slice(0, 4)}-${hex.slice(4)}`;
}
export function manualFieldsFromReport(report: ResultReport): ManualFields {
  return normalizeManualFields({
    name: report.player.name,
    nim: report.player.nim,
    className: report.player.className,
    score: report.score,
    correctAnswers: report.correctAnswers,
    hintUsage: report.hintUsage,
    attemptNumber: report.attemptNumber,
  });
}
export function checkManual(
  input: ManualInput,
  supplied: string,
): { matches: boolean; expectedCode: string; fields: ManualFields } {
  const fields = normalizeManualFields(input),
    code = supplied.trim().toUpperCase();
  if (code.startsWith("SW2-"))
    throw new Error(
      "SW2 adalah checksum PNG lengkap. Gunakan KODE MANUAL SWM1 pada kartu; SW2 tidak bisa dihitung dari screenshot saja.",
    );
  if (!/^SWM1-[A-F0-9]{4}-[A-F0-9]{4}$/.test(code))
    throw new Error("Kode manual wajib berformat SWM1-XXXX-XXXX.");
  const expectedCode = manualVerificationCode(fields);
  return { matches: expectedCode === code, expectedCode, fields };
}
