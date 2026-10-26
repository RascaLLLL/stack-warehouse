# Screenshot checking: separate manual code v1

> Archived Stack-only manual code. Current 20-stage cards use
> [manual code v2](manual-check-v2.md).

`/cek` is an unlisted, `noindex` local assistant tool. There is no public menu or
result-page link to it. Images and manual fields stay in tab memory; there is no
upload, API submission, remote QR service, or localStorage persistence by this
checker. CSV export uses a browser Blob download.

## Two code domains

The complete PNG format stays at version 2; its `SW2-XXXX-XXXX` code covers the
full result envelope and replayable journal as documented in
[result-format-v2.md](result-format-v2.md). Existing PNGs remain readable.

Newly generated cards additionally display `KODE MANUAL / SCREENSHOT` with a
`SWM1-XXXX-XXXX` code. It is computed by the same
`src/lib/verification/manual.ts` utility used by the screenshot checker, the PNG
renderer, and the result view. This code is derived; it does not add fields to or
change the v2 full-envelope checksum. Older screenshots with only SW2 cannot be
checked from the seven manual fields: the user needs the original PNG. The page
explicitly rejects using SW2 as a screenshot code.

## Canonical manual fields

Only these seven user-entered fields are covered:

| Manual label  | Payload field    | Formatting                                                               |
| ------------- | ---------------- | ------------------------------------------------------------------------ |
| Nama          | `name`           | Unicode NFC, trim, collapse ECMAScript `\s+` to one space; preserve case |
| NIM           | `nim`            | NFC, trim, ECMAScript uppercase; 3–24 ASCII letters/digits/dot/hyphen    |
| Kelas         | `className`      | Same text formatting as name                                             |
| Skor          | `score`          | Finite number, 0–2100, steps of 0.5                                      |
| Jumlah benar  | `correctAnswers` | Integer 0–10                                                             |
| Hint dipakai  | `hintUsage`      | Integer 0–16                                                             |
| Percobaan ke- | `attemptNumber`  | Positive safe integer; this is the game run number                       |

Text must be nonempty and at most 80 UTF-16 code units after normalization. The
larger manual bound accommodates canonical expansion of an original 40-code-unit
player name/class. Numeric input accepts digits and one decimal dot or comma for
score, without grouping separators, exponent notation, or signs. Leading zeros
and insignificant decimal zeros disappear when converted to numbers. Count/run
fields accept only digits. Score may not exceed `correctAnswers * 260`, and hint
usage may not exceed `correctAnswers + 3 + floor(correctAnswers / 3)`; these are
basic consistency limits, not authentication checks.

The checksum object has exactly:

```text
{
  application: "id.stackwarehouse.manual",
  version: 1,
  name, nim, className, score, correctAnswers, hintUsage, attemptNumber
}
```

Serialize with the same sorted-key canonical JSON and UTF-8 utility as the PNG
envelope. Compute the same CRC-32/ISO-HDLC algorithm (IEEE, reflected polynomial
0xEDB88320, initial/final XOR 0xFFFFFFFF). Format eight uppercase hex digits as
`SWM1-XXXX-XXXX`. The supplied code is trimmed and uppercased; internal spaces and
altered delimiters are rejected. Comparison only concerns the normalized seven
fields, not session ID, timestamps, room lists, other statistics, or the PNG journal.

For example, name ` Alia   Putri`, NIM `abc-001`, class `TI-2A`, score
`112,5`, correct `01`, hint `1`, attempt `02` normalize to Alia Putri, ABC-001,
TI-2A, 112.5, 1, 1, 2. Name case is significant. Precomposed and decomposed Unicode
spellings normalize to the same code.

A match is labeled **FIELD KONSISTEN**, never authentic, tamper-proof, or unedited.
All checksum logic is public and client-side; edited screenshots and values can
receive new matching codes. There is no server signature or identity attestation.

## Batch statuses and recap

- VALID FORMAT: PNG extension/signature/chunks/pixels, supported payload,
  full checksum, schema, and journal consistency passed.
- INVALID: malformed file, failed pixel decoding, invalid schema/checksum, or
  inconsistent report. Each file retains an explanation; one failure does not
  abort later files.
- NO DATA: a decodable PNG with no recognized `StackWarehouse.Result` chunk.
- UNSUPPORTED: recognized payload with an unsupported integer payload version
  or bank version. It is not treated as valid.

Limits: 20 MiB/file, 1 MiB metadata, at most 10,000 PNG chunks and 16 Mi pixels.
Images decode sequentially and image resources are released after each file.
Table pages contain 20 rows; name/NIM filtering and score sorting do not change
the recap or CSV source. Clear also cancels the current processing generation.

Duplicate session IDs are checked only among validated reports, across all
uploads retained in this tab. Recap counts distinct duplicate session groups,
with the number of involved files stated separately. Matching session IDs with
different full checksums receive a conflict warning. Duplicate flags do not
change the format status or count as a new game run.

CSV includes all rows, status/error reasons, session IDs, both codes, and duplicate
flags. It uses UTF-8 with BOM, comma separators, CRLF, and quoted/escaped cells.
Potential spreadsheet formulas are prefixed with an apostrophe before escaping.

`tests/verification.test.ts` covers mixed batches, signatures/extensions, corruption,
missing/unsupported data, pixel/read failures, duplicates/conflicts, search/sort,
CSV safety, canonical manual formatting, and matched/mismatched/manual code domains.
