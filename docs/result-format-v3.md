# Stack Warehouse PNG report, version 3

The 20-stage game writes a 1200 × 1600 PNG with one uncompressed `iTXt` chunk
under keyword `StackWarehouse.Result`. All generation and checking run locally in
the browser. The application identifier is `id.stackwarehouse.result`.

The payload envelope contains `application`, `version: 3`,
`checksumAlgorithm: "CRC32-IEEE/UTF8"`, `report`, `session`, and
`verificationCode`. The `session` records bank version 3, the selected 20
question IDs, seed, session ID, start time, attempt number, and ordered actions.
The verifier replays those actions against the same bank and rules.

The report contains player identity; session ID, seed, and attempt number; total,
Stack, and Queue scores; total, Stack, and Queue correct counts; wrong answers,
timeouts, hints, completed rooms, remaining lives, accuracy, active and wall time,
start and completion times, completion status, and `totalStages: 20`.

To compute `SW3-XXXX-XXXX`, remove only `verificationCode`, recursively sort
object keys, preserve array order, serialize as compact JSON, encode UTF-8, and
compute CRC-32/IEEE. The decoder verifies PNG structure and pixel decoding,
checks the code, regenerates the report by replay, and compares the complete
canonical envelope. PNG files are capped at 20 MiB and metadata at 1 MiB.

The card also shows a separate `SWM2` code for manual screenshot field checking;
see [manual code v2](manual-check-v2.md). The two codes are not interchangeable.
Payload v2 from the former Stack-only game is reported as **UNSUPPORTED** with a
clear legacy-format message; it is never treated as a 20-stage report.

CRC32 detects corruption and inconsistencies. It does not prove authenticity,
identity, or that a player completed the game without modifying client data.
