import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { crc32 } from "../src/lib/export/crc32";
import {
  createResultPayload,
  canonicalSerialize,
  validateResultPayload,
  verificationCode,
  resultFilename,
} from "../src/lib/export/result-payload";
import {
  embedResultMetadata,
  decodeResultMetadata,
  encodePngChunk,
  PNG_RESULT_KEYWORD,
} from "../src/lib/export/png-metadata";
import { compactQrPayload } from "../src/lib/export/result-qr";
import {
  startEngine,
  transition,
  attemptKey,
  type SavedSession,
  type EngineAction,
} from "../src/lib/game/engine";
import { BANK_VERSION } from "../src/lib/game/questions";
const player = {
  name: "Praktikan 日本 • É",
  nim: "24001001",
  className: "TI-2A",
};
export function completedSession(victory = false): SavedSession {
  let s = startEngine("550e8400-e29b-41d4-a716-446655440000", 42, 1000);
  const saved: SavedSession = {
    bankVersion: BANK_VERSION,
    questionIds: s.selectedQuestions.map((q) => q.id),
    sessionId: s.sessionId!,
    seed: 42,
    startedAt: 1000,
    attemptNumber: 3,
    events: [],
  };
  const step = (action: EngineAction) => {
    saved.events.push(action);
    s = transition(s, action);
  };
  const answer = (now: number, correct: boolean) => {
    const q = s.selectedQuestions[s.currentRoom - 1];
    step({
      type: "submit",
      key: attemptKey(s),
      now,
      answer: correct
        ? q.expectedAnswer
        : q.availableActions.find((a) => a.id !== q.expectedAnswer)!.id,
    });
  };
  if (victory) {
    for (let i = 0; i < 10; i++) {
      answer(2000 + i * 2000, true);
      if (i < 9)
        step({ type: "continue", key: attemptKey(s), now: 3000 + i * 2000 });
    }
  } else {
    step({ type: "hint", now: 1500 });
    step({ type: "hint", now: 1600 });
    step({ type: "pause", now: 2000 });
    step({ type: "resume", now: 7000 });
    answer(8000, false);
    step({ type: "continue", key: attemptKey(s), now: 13000 });
    step({ type: "tick", now: 70000 });
    step({ type: "continue", key: attemptKey(s), now: 75000 });
    answer(76000, false);
  }
  return saved;
}
function tinyPng(): Uint8Array {
  const header = new Uint8Array(13),
    view = new DataView(header.buffer);
  view.setUint32(0, 1);
  view.setUint32(4, 1);
  header[8] = 8;
  header[9] = 6;
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      encodePngChunk("IHDR", header),
      encodePngChunk("IDAT", deflateSync(Uint8Array.of(0, 255, 255, 255, 255))),
      encodePngChunk("IEND", new Uint8Array()),
    ]),
  );
}
test("canonical JSON and CRC have stable documented vectors", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  assert.equal(
    canonicalSerialize({ z: 2, a: [true, "é", { b: 1, a: 0 }] }),
    '{"a":[true,"é",{"a":0,"b":1}],"z":2}',
  );
  assert.throws(() => canonicalSerialize({ a: undefined }));
  assert.throws(() => canonicalSerialize(NaN));
  assert.throws(() => canonicalSerialize(new Array(2)), /sparse/);
});
test("report regenerates all actual statistics and excludes pause, feedback, late timeout delay", () => {
  const p = createResultPayload(completedSession(), player),
    r = p.report;
  assert.equal(r.correctAnswers, 0);
  assert.equal(r.incorrectAnswers, 2);
  assert.equal(r.timeoutCount, 1);
  assert.equal(r.hintUsage, 1);
  assert.equal(r.totalTimeMs, 33000);
  assert.equal(r.wallDurationMs, 75000);
  assert.equal(r.remainingLives, 0);
  assert.equal(r.completionStatus, "gameOver");
  assert.equal(r.attemptNumber, 3);
  assert.equal(r.accuracy, 0);
  assert.deepEqual(validateResultPayload(JSON.parse(canonicalSerialize(p))), p);
  assert.deepEqual(
    createResultPayload(JSON.parse(JSON.stringify(p.session)), player),
    p,
  );
  const victory = createResultPayload(completedSession(true), player);
  assert.equal(victory.report.correctAnswers, 10);
  assert.equal(victory.report.accuracy, 100);
  assert.equal(victory.report.completedRooms.length, 10);
  assert.equal(victory.report.remainingLives, 3);
  assert.equal(victory.report.totalTimeMs, 10000);
  assert.throws(
    () =>
      createResultPayload({ ...completedSession(), startedAt: 1000.5 }, player),
    /timestamp/,
  );
});
test("UTF-8 iTXt round trip retains Unicode and exact payload and replaces prior metadata", () => {
  const p = createResultPayload(completedSession(), player),
    png = embedResultMetadata(tinyPng(), p);
  assert.deepEqual(decodeResultMetadata(png), p);
  assert.deepEqual(embedResultMetadata(png, p), png);
  assert.ok(Buffer.from(png).includes(Buffer.from(PNG_RESULT_KEYWORD)));
  assert.ok(Buffer.from(png).includes(Buffer.from("日本")));
  const second = createResultPayload(completedSession(true), player);
  assert.deepEqual(
    decodeResultMetadata(embedResultMetadata(png, second)),
    second,
  );
});
test("PNG parser rejects corrupted, truncated, missing, duplicate and unsafe chunks", () => {
  const p = createResultPayload(completedSession(), player),
    png = embedResultMetadata(tinyPng(), p);
  const changed = png.slice();
  changed[changed.length - 20] ^= 1;
  assert.throws(() => decodeResultMetadata(changed), /CRC/);
  assert.throws(() => decodeResultMetadata(png.subarray(0, png.length - 1)));
  assert.throws(() => decodeResultMetadata(tinyPng()), /metadata/);
  assert.throws(() => decodeResultMetadata(new Uint8Array([...png, 0])));
  const data = new TextEncoder().encode(
    `${PNG_RESULT_KEYWORD}\0\0\0\0\0${canonicalSerialize(p)}`,
  );
  const duplicate = new Uint8Array(
    Buffer.concat([
      png.subarray(0, png.length - 12),
      encodePngChunk("iTXt", data),
      png.subarray(png.length - 12),
    ]),
  );
  assert.throws(() => decodeResultMetadata(duplicate), /tepat/);
  const huge = png.slice();
  new DataView(huge.buffer).setUint32(8, 0xffffffff);
  assert.throws(() => decodeResultMetadata(huge), /batas/);
  const compressed = data.slice();
  compressed[PNG_RESULT_KEYWORD.length + 1] = 1;
  const unsupported = new Uint8Array(
    Buffer.concat([
      tinyPng().subarray(0, tinyPng().length - 12),
      encodePngChunk("iTXt", compressed),
      encodePngChunk("IEND", new Uint8Array()),
    ]),
  );
  assert.throws(() => decodeResultMetadata(unsupported), /iTXt/);
  const badUtf8 = new Uint8Array([
    ...new TextEncoder().encode(`${PNG_RESULT_KEYWORD}\0\0\0\0\0`),
    0xff,
  ]);
  const malformed = new Uint8Array(
    Buffer.concat([
      tinyPng().subarray(0, tinyPng().length - 12),
      encodePngChunk("iTXt", badUtf8),
      encodePngChunk("IEND", new Uint8Array()),
    ]),
  );
  assert.throws(() => decodeResultMetadata(malformed));
});
test("checksum and journal replay reject inconsistent reports even after checksum recomputation", () => {
  const p = createResultPayload(completedSession(), player);
  assert.throws(
    () => validateResultPayload({ ...p, report: { ...p.report, score: 100 } }),
    /Checksum/,
  );
  const { verificationCode: _code, ...unsigned } = p;
  assert.equal(_code, verificationCode(unsigned));
  for (const field of [
    "score",
    "accuracy",
    "remainingLives",
    "totalTimeMs",
    "hintUsage",
    "incorrectAnswers",
  ] as const) {
    const changed = {
      ...unsigned,
      report: { ...p.report, [field]: p.report[field] + 1 },
    };
    assert.throws(
      () =>
        validateResultPayload({
          ...changed,
          verificationCode: verificationCode(changed),
        }),
      /konsisten/,
    );
  }
  assert.throws(() => validateResultPayload({ ...p, version: 99 }), /versi/);
  assert.throws(
    () => validateResultPayload({ ...p, application: "other" }),
    /Aplikasi/,
  );
});
test("filename and compact QR schema include session, attempt, and visible verification code", () => {
  const p = createResultPayload(completedSession(), {
    ...player,
    name: "Nama / Test",
  });
  assert.equal(resultFilename(p), "StackWarehouse_24001001_Nama_Test_3.png");
  const qr = JSON.parse(compactQrPayload(p));
  assert.equal(qr.v, 2);
  assert.equal(qr.code, p.verificationCode);
  assert.equal(qr.data[14], p.report.sessionId);
  assert.equal(qr.data[13], 3);
});
