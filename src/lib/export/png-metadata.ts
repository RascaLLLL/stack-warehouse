import { crc32 } from "./crc32";
import {
  canonicalSerialize,
  validateResultPayload,
  type ResultPayload,
  RESULT_APPLICATION,
  RESULT_VERSION,
} from "./result-payload";
import { BANK_VERSION } from "../game/questions";
export class PngResultError extends Error {
  constructor(
    public readonly code: "NO DATA" | "UNSUPPORTED",
    message: string,
  ) {
    super(message);
    this.name = "PngResultError";
  }
}
export const PNG_RESULT_KEYWORD = "StackWarehouse.Result";
export const MAX_PNG_BYTES = 20 * 1024 * 1024;
const MAX_METADATA_BYTES = 1024 * 1024;
const signature = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
export const hasPngSignature = (bytes: Uint8Array) =>
  bytes.length >= 8 && signature.every((b, i) => bytes[i] === b);
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
type Chunk = { type: string; data: Uint8Array; raw: Uint8Array };
function concat(parts: Uint8Array[]): Uint8Array {
  const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    bytes.set(p, offset);
    offset += p.length;
  }
  return bytes;
}
export function encodePngChunk(type: string, data: Uint8Array): Uint8Array {
  if (!/^[A-Za-z]{4}$/.test(type)) throw new Error("Tipe chunk tidak valid.");
  const raw = new Uint8Array(data.length + 12),
    view = new DataView(raw.buffer);
  view.setUint32(0, data.length);
  raw.set(encoder.encode(type), 4);
  raw.set(data, 8);
  view.setUint32(data.length + 8, crc32(raw.subarray(4, data.length + 8)));
  return raw;
}
function chunks(bytes: Uint8Array): Chunk[] {
  if (
    bytes.length > MAX_PNG_BYTES ||
    bytes.length < 8 ||
    !signature.every((b, i) => bytes[i] === b)
  )
    throw new Error("Signature atau ukuran PNG tidak valid.");
  const result: Chunk[] = [];
  let offset = 8,
    ended = false,
    seenData = false,
    dataEnded = false,
    palette = false;
  while (offset < bytes.length) {
    if (result.length >= 10000)
      throw new Error("PNG memiliki terlalu banyak chunk.");
    if (ended || bytes.length - offset < 12)
      throw new Error("PNG terpotong atau memiliki data setelah IEND.");
    const view = new DataView(
        bytes.buffer,
        bytes.byteOffset + offset,
        bytes.length - offset,
      ),
      length = view.getUint32(0);
    if (length > bytes.length - offset - 12)
      throw new Error("Panjang chunk di luar batas.");
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (!/^[A-Za-z]{4}$/.test(type) || type[2] !== type[2].toUpperCase())
      throw new Error("Nama chunk PNG tidak valid.");
    const data = bytes.subarray(offset + 8, offset + 8 + length),
      raw = bytes.subarray(offset, offset + length + 12);
    if (crc32(raw.subarray(4, raw.length - 4)) !== view.getUint32(length + 8))
      throw new Error(`CRC chunk ${type} tidak cocok.`);
    if (!result.length && (type !== "IHDR" || length !== 13))
      throw new Error("IHDR harus menjadi chunk pertama.");
    if (type === "IHDR") {
      if (result.length) throw new Error("IHDR ganda.");
      const h = new DataView(data.buffer, data.byteOffset, data.length),
        width = h.getUint32(0),
        height = h.getUint32(4);
      const depths: Record<number, number[]> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      };
      if (
        !width ||
        !height ||
        width > 8192 ||
        height > 8192 ||
        width * height > 16 * 1024 * 1024 ||
        !depths[data[9]]?.includes(data[8]) ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12] > 1
      )
        throw new Error("Header PNG tidak didukung.");
    } else if (type === "PLTE") {
      if (palette || seenData || !length || length % 3 || length > 768)
        throw new Error("Palette PNG tidak valid.");
      palette = true;
    } else if (type === "IDAT") {
      if (dataEnded || (result[0].data[9] === 3 && !palette))
        throw new Error("Urutan IDAT tidak valid.");
      seenData = true;
    } else if (type === "IEND") {
      if (length || !seenData) throw new Error("IEND atau IDAT tidak valid.");
      ended = true;
    } else {
      if (type[0] === type[0].toUpperCase())
        throw new Error("Chunk kritis PNG tidak didukung.");
      if (seenData) dataEnded = true;
    }
    result.push({ type, data, raw });
    offset += raw.length;
  }
  if (!ended) throw new Error("IEND tidak ditemukan.");
  return result;
}
function keyword(data: Uint8Array): string {
  const end = data.indexOf(0);
  return end > 0
    ? String.fromCharCode(...data.subarray(0, Math.min(end, 80)))
    : "";
}
function isResultChunk(chunk: Chunk): boolean {
  return (
    ["iTXt", "tEXt", "zTXt"].includes(chunk.type) &&
    keyword(chunk.data) === PNG_RESULT_KEYWORD
  );
}
export function embedResultMetadata(
  png: Uint8Array,
  payload: ResultPayload,
): Uint8Array {
  validateResultPayload(payload);
  const text = encoder.encode(canonicalSerialize(payload));
  if (text.length > MAX_METADATA_BYTES)
    throw new Error("Metadata laporan terlalu besar.");
  const data = concat([
    encoder.encode(PNG_RESULT_KEYWORD),
    Uint8Array.of(0, 0, 0, 0, 0),
    text,
  ]);
  const parsed = chunks(png),
    parts: Uint8Array[] = [signature];
  for (const chunk of parsed) {
    if (chunk.type === "IEND") parts.push(encodePngChunk("iTXt", data));
    if (!isResultChunk(chunk)) parts.push(chunk.raw);
  }
  const result = concat(parts);
  if (result.length > MAX_PNG_BYTES) throw new Error("PNG terlalu besar.");
  return result;
}
export function decodeResultMetadata(png: Uint8Array): ResultPayload {
  const found = chunks(png).filter(isResultChunk);
  if (found.length === 0)
    throw new PngResultError(
      "NO DATA",
      "PNG tidak memiliki metadata StackWarehouse.Result. Screenshot atau gambar yang diekspor ulang biasanya kehilangan metadata.",
    );
  if (found.length !== 1 || found[0].type !== "iTXt")
    throw new Error(
      "PNG harus memiliki tepat satu metadata Stack Warehouse iTXt.",
    );
  const data = found[0].data,
    zero = data.indexOf(0);
  if (
    data.length > MAX_METADATA_BYTES + 100 ||
    data[zero + 1] !== 0 ||
    data[zero + 2] !== 0 ||
    data[zero + 3] !== 0 ||
    data[zero + 4] !== 0
  )
    throw new Error("Format iTXt laporan tidak didukung.");
  const text = decoder.decode(data.subarray(zero + 5));
  const parsed: unknown = JSON.parse(text);
  if (parsed && typeof parsed === "object") {
    const p = parsed as {
      application?: unknown;
      version?: unknown;
      session?: { bankVersion?: unknown };
    };
    if (
      p.application === RESULT_APPLICATION &&
      typeof p.version === "number" &&
      Number.isInteger(p.version) &&
      p.version !== RESULT_VERSION
    )
      throw new PngResultError(
        "UNSUPPORTED",
        `Versi payload ${p.version} belum didukung (saat ini versi ${RESULT_VERSION}).`,
      );
    if (
      p.application === RESULT_APPLICATION &&
      p.version === RESULT_VERSION &&
      typeof p.session?.bankVersion === "number" &&
      Number.isInteger(p.session.bankVersion) &&
      p.session.bankVersion !== BANK_VERSION
    )
      throw new PngResultError(
        "UNSUPPORTED",
        `Versi bank soal ${p.session.bankVersion} belum didukung.`,
      );
  }
  const result = validateResultPayload(parsed);
  if (canonicalSerialize(result) !== text)
    throw new Error("Metadata bukan JSON kanonis.");
  return result;
}
