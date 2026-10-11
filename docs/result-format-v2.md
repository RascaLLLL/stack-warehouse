# Stack Warehouse result format, version 2

Application identifier: `id.stackwarehouse.result`. PNG keyword:
`StackWarehouse.Result`. The encoder/decoder is in
`src/lib/export/png-metadata.ts`; report generation and validation are in
`src/lib/export/result-payload.ts`.

New cards show a separate `SWM1` screenshot-field code alongside the `SW2` full
PNG checksum. This does not change the v2 metadata envelope. See
[manual-check-v1.md](manual-check-v1.md) for the exact normalized fields and code
domain; the two codes are not interchangeable.

## Envelope

The JSON object has exactly these fields: `application`, `version` (2),
`checksumAlgorithm` (`CRC32-IEEE/UTF8`), `report`, `session`, and
`verificationCode`. The complete JSON-compatible TypeScript definition is
`ResultPayload`. `session` contains the bank version, ordered selected question
IDs, session ID, seed, start epoch milliseconds, game attempt number, and ordered
engine actions. The bank version is required for replay; a future reader must
retain that curriculum version or report it as unsupported instead of validating
against a different bank.

`report` contains player `name`, `nim`, `className`; `sessionId`, `sessionSeed`,
`attemptNumber`; `score`, `correctAnswers`, `incorrectAnswers`, `timeoutCount`,
`hintUsage`, `completedRooms`, `remainingLives`, `accuracy`, `totalTimeMs`,
`wallDurationMs`, `startedAt`, `completedAt`, `completionStatus`, and `totalStages`.
Times are UTC ISO 8601 strings or integer milliseconds as named. Scores retain
fractional hint deductions. Completed rooms are an ordered array of room numbers.

`incorrectAnswers` counts submitted wrong answers, excluding timeouts.
Accuracy is `round(correct / (correct + incorrect + timeout) * 10000) / 100`,
expressed as a percent. Hint usage counts transitions from unused to used,
including failed attempts; repeated clicks do not count twice. Active time sums
pending, unpaused intervals, capped at each deadline; it excludes feedback,
paused time, and delayed delivery after timeout. Wall duration is final committed
answer timestamp minus session start, including pauses and feedback. Completion
time is the final engine record timestamp, not export time. Regenerating the
result does not change its timestamp or verification code.

Attempt number means the game run number in this browser, not an answer attempt.
`runCount` persists across registration/reset and is incremented by game start.
Older saved sessions without a run number regenerate as attempt 1. Only the latest
saved session is retained. Transitions and scoring remain the engine's rules.

## Canonical serialization and checksum

1. Remove only the top-level `verificationCode` from the envelope.
2. Recursively sort object keys lexicographically using ECMAScript `.sort()`
   (UTF-16 code unit order). Array order is unchanged.
3. Serialize strings, finite numbers, booleans, and null using ECMAScript
   `JSON.stringify`. Use commas/colons with no whitespace. Strings are not
   normalized or translated. Unsupported values, including undefined and
   non-finite numbers, are rejected. Canonical input is acyclic plain JSON data.
4. Encode the resulting string as UTF-8 using `TextEncoder`.
5. Compute CRC-32/ISO-HDLC (IEEE), reflected polynomial `0xEDB88320`, initial
   accumulator `0xFFFFFFFF`, final XOR `0xFFFFFFFF`.
6. Format the unsigned result as eight uppercase zero-padded hexadecimal digits,
   with code `SW2-XXXX-XXXX`.

CRC reference vector: UTF-8 `123456789` gives `CBF43926`.
Canonical vector: `{z:2,a:[true,"é",{b:1,a:0}]}` becomes
`{"a":[true,"é",{"a":0,"b":1}],"z":2}`.

The encoder then serializes the full envelope, including its code, by the same
canonical method. The decoder checks the checksum, regenerates the report by
replaying the provided journal, and compares the complete canonical envelope.
This also rejects unknown extra fields, unsupported versions, mismatched scores,
counts, identity copies, room lists, lives, and times. The envelope is bounded to
1 MiB; PNG input is bounded to 20 MiB, 10,000 chunks, 8192 per axis, and 16 Mi pixels.

This checksum is **not cryptographic proof of authenticity**. A person can edit
the journal, identity, or answers and generate another consistent report and code.
CRC can collide. There is no server signature, identity attestation, or cheating
prevention. The check detects accidental corruption, malformed structure, and
inconsistency, not intent or authenticity. PNG pixels are not authenticated against
the report; `/cek` displays metadata values for comparison with the visible card.

## PNG container

The card is independently rendered at **1200 × 1600 pixels**, independent of DPR,
browser viewport, or the responsive HTML preview. No screenshot library is used.
Text is wrapped/fitted and QR modules are rendered at integer pixel scales.

Exactly one application chunk is written immediately before IEND: uncompressed
`iTXt` with the following data bytes:

```text
ASCII StackWarehouse.Result
00                 keyword terminator
00                 compression flag (uncompressed)
00                 compression method
00                 empty language tag terminator
00                 empty translated keyword terminator
UTF-8 canonical full envelope
```

Each PNG chunk uses standard big-endian length, 4-byte type, data, and CRC-32 of
type + data. Existing application metadata is replaced on regeneration. The
decoder verifies the signature, every chunk's length and CRC, IHDR/IDAT/IEND
structure, duplicate application metadata, UTF-8, canonical JSON, and payload.
Compressed application text or application tEXt/zTXt are rejected rather than
silently interpreted. Unrelated ancillary chunks are preserved. `/cek` also asks
the browser to decode the image to reject invalid compressed pixel streams.

Download uses an `image/png` Blob, object URL, and `<a download>`; the browser
chooses Downloads or a save destination. Filename:
`StackWarehouse_NIM_Nama_Attempt.png`. Unicode letters/digits are preserved;
unsafe separators and punctuation become underscores, with empty parts replaced
by `Operator`. Object URLs are released after use and preview URLs on unmount.

## QR summary

The visible QR is standalone JSON, not a URL and not the complete replayable
payload. It uses error correction M, a four-module quiet zone, and integer module
scale. Shape:

```text
{"app":"SW","v":2,"code":"SW2-XXXX-XXXX","data":[...]}
```

The `data` positions are, in order:
name, NIM, class, score, correct answers, wrong answers, timeouts, hint uses,
completed room array, remaining lives, accuracy percent, active milliseconds,
wall milliseconds, run attempt number, session ID, UTC completion timestamp,
completion status. A future `/cek` QR reader can interpret this versioned summary;
full validation still requires the PNG envelope/journal. It must not recompute
the full-envelope checksum using only this summary.

## Tests

`tests/result-export.test.ts` tests canonical vectors, report regeneration,
Unicode round trips, metadata replacement, truncated/corrupt/duplicate/unsupported
chunks, checksum mismatches, recomputed-code inconsistencies, filenames, and QR
schema. Browser QA also downloads the real generated PNG and checks its dimensions,
metadata, regeneration, and `/cek` file reading.
