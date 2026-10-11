# Production-readiness audit

Completed locally on 2026-10-11. This records checks actually executed, not a Vercel
hosting certification. There was no live deployment and no claim of cryptographic
authenticity, exhaustive device testing, or a formal WCAG conformance assessment.

## Changes in this pass

- Suppress unchanged persistence writes from display ticks; storage failures keep
  state in memory. Add regression tests for quota/security errors and key removal.
- Reject control characters in registration names/classes before result generation.
- Add registration, expired hint/pause, repeated hint, and interrupted-streak tests.
- Keep mobile header audio controls accessible on home/result/checker pages.
- Replace leftover prototype labels; preserve the existing visual design.
- Replace README with concise setup, build, deployment, rules, and verification limits.

## Coverage

| Area                  | Executed validation                                                                                                                                                                                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routes                | Production build prerenders `/`, `/play`, `/result`, `/cek`; browser visited all plus the custom 404. Public navigation has no `/cek` link.                                                                                                                                                                                |
| Layouts               | Production desktop game/result/checker and mobile home/game inspected; previous checker pass inspected mobile batch/manual views. No document-width overflow in measured mobile views; the wide checker table scrolls independently.                                                                                       |
| Registration          | Browser rejected a short NIM; unit tests reject missing/blank/long/malformed identities and control characters. Valid registration starts gameplay.                                                                                                                                                                        |
| Stack                 | Immutable PUSH/POP/PEEK/isEmpty, capacity guards, one-based array TOP, linked TOP/next, and every question's reachable answer tested. Browser run included real PUSH and pointer tracing.                                                                                                                                  |
| Randomization         | 1000 seeded selections verify 3/4/3 quotas, unique IDs, coverage, determinism, and bank reach.                                                                                                                                                                                                                             |
| Timing                | Exact expiry, delayed ticks, hints/pause at expiry, stale callbacks, and repeated timeout tested. Browser navigation away from an active attempt caused one timeout and terminal game over.                                                                                                                                |
| Lives/streak          | Wrong answers, zero-life terminal guard, restore every third consecutive success, cap at 3, and wrong-after-two reset tested. Browser run exercised wrong answers, three-success streak resets, and game over.                                                                                                             |
| Hint/scoring          | Difficulty base points, time bonus, exact 25% deduction, repeated hint guard, and fractional score tested. Browser first hinted stage earned 118.5 = (100 + 29 × 2) × .75.                                                                                                                                                 |
| Transitions           | Duplicate submit/continue guards and terminal lock tested; complete browser run traversed ten rooms to victory.                                                                                                                                                                                                            |
| Pause/recovery        | Millisecond pause/resume and journal replay tested. Browser reload retained paused state; victory report and game-over reload preserved their outcomes.                                                                                                                                                                    |
| Audio/effects         | Mocked Web Audio tests cover autoplay lock, one scheduler/context, volumes, visibility, resume failure, bounded oscillators, disposal, and event correspondence. UI exposes labelled controls; actual sound quality was not measured.                                                                                      |
| Results               | Tests verify correct/incorrect/timeout/hints/accuracy/lives/active versus wall time, timestamps, and replay consistency. Browser victory report showed ten correct, one hint, 100% accuracy and 2056.5 points.                                                                                                             |
| PNG                   | Real browser PNG download at fixed 1200 × 1600; generated card visually inspected and successfully decoded by `/cek`. Encoding/decoding, Unicode iTXt, CRC, duplicate/missing chunks, truncation, schema and journal mismatch tested.                                                                                      |
| Batch/manual/CSV      | Browser eight-file batch: two valid, four invalid, one NO DATA, one UNSUPPORTED, one duplicate session group. Shared SWM1 matched the generated card; browser CSV downloaded all eight rows. Unit tests cover mismatches, canonical normalization, search/sort, conflicts, quoting and spreadsheet formula neutralization. |
| Storage               | Safe get/set/remove, unchanged-write suppression and memory fallback tested; corrupt journal/audio preference validation covered by recovery/effects tests. Refresh depends on successful storage writes.                                                                                                                  |
| Accessibility         | Source and UI audit: Indonesian document language, skip link, visible focus, labelled inputs/fieldset legends, native radio/button controls, native modal dialog, status feedback, reduced motion, and labelled audio controls. No automated axe scan or screen-reader certification performed.                            |
| Performance           | Bounded effects, oscillator cleanup, sequential image decoding/resource disposal, 20-row checker pagination, image/file limits, local fonts, and reduced persistence writes reviewed. No Lighthouse score claimed.                                                                                                         |
| TypeScript/deployment | Production build compiles TypeScript and prerenders routes; no environment-variable reads, API routes, remote data fetches, backend services, or runtime asset service required. README documents normal Vercel Next.js deployment.                                                                                        |

## Commands

`npm install`, `npm run lint`, `npm run build`, and `npm run test` were executed
successfully. The test suite contains **74 passing tests**. The production server
was started and used for the browser checks above. No Vercel account changes or
production deployment were performed.

PNG/check codes use public client-side CRC32. Passing checks establishes format and
internal consistency only. See [payload v2](result-format-v2.md) and
[manual checks](manual-check-v1.md) for the exact canonical methods and limitations.
