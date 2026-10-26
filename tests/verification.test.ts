import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import {
  startEngine,
  transition,
  attemptKey,
  type SavedSession,
} from "../src/lib/game/engine";
import { BANK_VERSION } from "../src/lib/game/questions";
import {
  createResultPayload,
  canonicalSerialize,
  verificationCode,
} from "../src/lib/export/result-payload";
import {
  encodePngChunk,
  embedResultMetadata,
  PNG_RESULT_KEYWORD,
} from "../src/lib/export/png-metadata";
import {
  inspectFile,
  batchSummary,
  duplicateSessions,
  filterAndSort,
  resultsCsv,
  type CheckRow,
} from "../src/lib/verification/batch";
import {
  normalizeManualFields,
  manualVerificationCode,
  manualFieldsFromReport,
  checkManual,
} from "../src/lib/verification/manual";
function payload(victory = false) {
  let s = startEngine("verification-session", 42, 1000);
  const saved: SavedSession = {
    bankVersion: BANK_VERSION,
    questionIds: s.selectedQuestions.map((q) => q.id),
    sessionId: s.sessionId!,
    seed: 42,
    startedAt: 1000,
    attemptNumber: 2,
    events: [],
  };
  const rounds = victory ? 20 : 3;
  for (let i = 0; i < rounds; i++) {
    const q = s.selectedQuestions[s.currentRoom - 1],
      action = {
        type: "submit" as const,
        now: 2000 + i * 2000,
        key: attemptKey(s),
        answer: victory
          ? q.expectedAnswer
          : q.availableActions.find((a) => a.id !== q.expectedAnswer)!.id,
      };
    saved.events.push(action);
    s = transition(s, action);
    if (i < rounds - 1) {
      const next = {
        type: "continue" as const,
        key: attemptKey(s),
        now: 3000 + i * 2000,
      };
      saved.events.push(next);
      s = transition(s, next);
      if (i === 9) {
        const enter = { type: "enterQueue" as const, now: 3001 + i * 2000 };
        saved.events.push(enter);
        s = transition(s, enter);
      }
    }
  }
  return createResultPayload(saved, {
    name: "Alia Putri",
    nim: "24001001",
    className: "TI-2A",
  });
}
function png(
  data: Uint8Array = deflateSync(Uint8Array.of(0, 255, 255, 255, 255)),
) {
  const header = new Uint8Array(13);
  new DataView(header.buffer).setUint32(0, 1);
  new DataView(header.buffer).setUint32(4, 1);
  header[8] = 8;
  header[9] = 6;
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      encodePngChunk("IHDR", header),
      encodePngChunk("IDAT", data),
      encodePngChunk("IEND", new Uint8Array()),
    ]),
  );
}
function withRawMetadata(value: unknown) {
  const plain = png();
  return new Uint8Array(
    Buffer.concat([
      plain.subarray(0, plain.length - 12),
      encodePngChunk(
        "iTXt",
        new TextEncoder().encode(
          `${PNG_RESULT_KEYWORD}\0\0\0\0\0${canonicalSerialize(value)}`,
        ),
      ),
      plain.subarray(plain.length - 12),
    ]),
  );
}
const file = (name: string, data: Uint8Array) => ({
  name,
  size: data.length,
  arrayBuffer: async () => Uint8Array.from(data).buffer,
});
const pixels = async () => {};
test("batch classifies valid, missing, corrupted and unsupported files without stopping subsequent files", async () => {
  const p = payload(true),
    good = embedResultMetadata(png(), p),
    bad = good.slice();
  bad[40] ^= 1;
  const inputs = [
    file("valid.PNG", good),
    file("missing.png", png()),
    file("corrupt.png", bad),
    file("future.png", withRawMetadata({ ...p, version: 99 })),
    file("renamed.png", new TextEncoder().encode("not PNG")),
    file("wrong.jpg", good),
  ];
  const rows: CheckRow[] = [];
  for (let i = 0; i < inputs.length; i++)
    rows.push(await inspectFile(inputs[i], i + 1, pixels));
  assert.deepEqual(
    rows.map((r) => r.status),
    ["VALID FORMAT", "NO DATA", "INVALID", "UNSUPPORTED", "INVALID", "INVALID"],
  );
  assert.equal(rows[0].report!.score, p.report.score);
  assert.match(rows[2].message, /CRC/);
  assert.match(rows[3].message, /99/);
  assert.match(rows[4].message, /Signature/);
  assert.match(rows[5].message, /Ekstensi/);
  assert.deepEqual(batchSummary(rows), {
    total: 6,
    valid: 1,
    invalid: 3,
    noData: 1,
    unsupported: 1,
    duplicateSessions: 0,
    duplicateFiles: 0,
  });
});
test("schema/consistency faults stay INVALID; pixel decode and unreadable files cannot pass", async () => {
  const p = payload(),
    { verificationCode: _code, ...unsigned } = p;
  assert.equal(_code, verificationCode(unsigned));
  const changed = { ...unsigned, report: { ...p.report, score: 100 } };
  const inconsistent = await inspectFile(
    file(
      "inconsistent.png",
      withRawMetadata({
        ...changed,
        verificationCode: verificationCode(changed),
      }),
    ),
    1,
    pixels,
  );
  assert.equal(inconsistent.status, "INVALID", inconsistent.message);
  assert.match(inconsistent.message, /konsisten/);
  const broken = await inspectFile(
    file("broken-pixels.png", png(Uint8Array.of(1, 2, 3))),
    2,
    async () => {
      throw new Error("invalid compressed pixels");
    },
  );
  assert.equal(broken.status, "INVALID");
  assert.match(broken.message, /pixel/);
  const unreadable = await inspectFile(
    {
      name: "failed.png",
      size: 10,
      arrayBuffer: async () => {
        throw new Error("read failed");
      },
    },
    3,
    pixels,
  );
  assert.equal(unreadable.status, "INVALID");
  assert.match(unreadable.message, /read failed/);
  const oversized = await inspectFile(
    {
      name: "large.png",
      size: 21 * 1024 * 1024,
      arrayBuffer: async () => {
        throw new Error("should not read");
      },
    },
    4,
    pixels,
  );
  assert.match(oversized.message, /20 MB/);
  const schema = await inspectFile(
    file(
      "schema.png",
      withRawMetadata({ application: p.application, version: 3 }),
    ),
    5,
    pixels,
  );
  assert.equal(schema.status, "INVALID");
});
test("duplicate detection distinguishes copied sessions and conflicting data without implying authenticity", async () => {
  const p = payload(),
    good = embedResultMetadata(png(), p);
  const rows = [
    await inspectFile(file("first.png", good), 1, pixels),
    await inspectFile(file("copy.png", good), 2, pixels),
  ];
  assert.deepEqual(duplicateSessions(rows).get(p.report.sessionId), {
    count: 2,
    conflict: false,
  });
  assert.equal(batchSummary(rows).valid, 2);
  assert.equal(batchSummary(rows).duplicateSessions, 1);
  const changed = createResultPayload(p.session, {
    ...p.report.player,
    name: "Another name",
  });
  rows.push(
    await inspectFile(
      file("conflict.png", embedResultMetadata(png(), changed)),
      3,
      pixels,
    ),
  );
  assert.deepEqual(duplicateSessions(rows).get(p.report.sessionId), {
    count: 3,
    conflict: true,
  });
});
test("name/NIM search and score sorting are stable and do not mutate the uploaded batch", async () => {
  const low = await inspectFile(
      file("low.png", embedResultMetadata(png(), payload())),
      1,
      pixels,
    ),
    high = await inspectFile(
      file("high.png", embedResultMetadata(png(), payload(true))),
      2,
      pixels,
    ),
    missing = await inspectFile(file("missing.png", png()), 3, pixels);
  const rows = [low, high, missing];
  assert.deepEqual(
    filterAndSort(rows, "ALIA", "score-desc").map((r) => r.id),
    [2, 1],
  );
  assert.deepEqual(
    filterAndSort(rows, "24001", "score-asc").map((r) => r.id),
    [1, 2],
  );
  assert.equal(filterAndSort(rows, "nobody", "upload").length, 0);
  assert.deepEqual(
    filterAndSort(rows, "", "score-desc").map((r) => r.id),
    [2, 1, 3],
  );
  assert.deepEqual(
    rows.map((r) => r.id),
    [1, 2, 3],
  );
});
test("CSV quotes Unicode and delimiters, neutralizes spreadsheet formulas, and includes failure and duplicate reasons", async () => {
  const p = payload(),
    good = embedResultMetadata(png(), p),
    row = await inspectFile(file('=HYPERLINK("bad").png', good), 1, pixels),
    copy = { ...row, id: 2, filename: "copy,one.png" };
  const failed = await inspectFile(file("missing.png", png()), 3, pixels);
  const text = resultsCsv([row, copy, failed]);
  assert.ok(text.startsWith("\ufeff"));
  assert.ok(text.includes('"\'=HYPERLINK(""bad"").png"'));
  assert.ok(text.includes('"copy,one.png"'));
  assert.ok(text.includes('"NO DATA"'));
  assert.ok(text.includes('"Sesi sama"'));
  assert.ok(text.endsWith("\r\n"));
  assert.ok(text.includes("Kode manual"));
});
test("manual fields normalize canonically, and shared screenshot codes match the generated card", () => {
  const fields = {
    name: "  Alia   Putri ",
    nim: " abc-001 ",
    className: " TI-2A ",
    score: "112,5",
    correctAnswers: "01",
    stackCorrect: "1",
    queueCorrect: "0",
    hintUsage: "1",
    attemptNumber: "02",
  };
  const normalized = normalizeManualFields(fields);
  assert.deepEqual(normalized, {
    name: "Alia Putri",
    nim: "ABC-001",
    className: "TI-2A",
    score: 112.5,
    correctAnswers: 1,
    stackCorrect: 1,
    queueCorrect: 0,
    hintUsage: 1,
    attemptNumber: 2,
  });
  const code = manualVerificationCode(fields);
  assert.equal(code, manualVerificationCode(normalized));
  assert.equal(checkManual(fields, code.toLowerCase()).matches, true);
  assert.equal(
    checkManual({ ...fields, name: "Different" }, code).matches,
    false,
  );
  const report = payload(true).report,
    generated = manualVerificationCode(manualFieldsFromReport(report));
  assert.equal(
    checkManual({ ...manualFieldsFromReport(report) }, generated).matches,
    true,
  );
  assert.equal(
    manualVerificationCode({ ...normalized, name: "E\u0301lodie" }),
    manualVerificationCode({ ...normalized, name: "Élodie" }),
  );
});
test("manual checks reject missing, malformed, fractional count, out-of-range and wrong code domains", () => {
  const input = {
    name: "Alia",
    nim: "ABC001",
    className: "TI-2A",
    score: "100",
    correctAnswers: "1",
    stackCorrect: "1",
    queueCorrect: "0",
    hintUsage: "0",
    attemptNumber: "1",
  };
  for (const patch of [
    { name: "" },
    { nim: "?" },
    { className: "" },
    { score: "NaN" },
    { score: "2,100.5" },
    { score: "100.25" },
    { correctAnswers: "21" },
    { correctAnswers: "1.5" },
    { hintUsage: "100" },
    { attemptNumber: "0" },
    { attemptNumber: "9007199254740992" },
  ])
    assert.throws(() => normalizeManualFields({ ...input, ...patch }));
  assert.throws(() => checkManual(input, "SW3-1234-5678"), /checksum PNG/);
  assert.throws(() => checkManual(input, ""), /SWM2/);
  assert.throws(
    () =>
      normalizeManualFields({ ...input, score: "100", correctAnswers: "0" }),
    /konsisten/,
  );
});
