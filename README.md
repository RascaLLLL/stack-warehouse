# Stack Warehouse

An Indonesian educational Stack and Queue game built with Next.js, TypeScript, and Zustand.
All gameplay, audio, session recovery, PNG generation, and verification run in the
browser. No database, backend service, API keys, or environment variables are required.

## Prerequisites and local setup

Use Node.js 22 LTS or a newer supported LTS release and npm. A modern browser with
Canvas and Web Audio support is recommended. Production hosting must use HTTPS;
localhost also supports the secure browser APIs used for session IDs.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Register your name, NIM, and class at `/play`.
Routes: `/` (home), `/play` (game), `/result` (latest completed session), and `/cek`
(local assistant verification, deliberately absent from public navigation).

## Production and checks

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

The build uses webpack. Tests compile TypeScript and run with Node's built-in test
runner. Fonts are bundled locally; audio is synthesized without asset downloads.

## Deploy to Vercel

1. Push this project, including `package-lock.json`, to a Git repository.
2. Import the repository into Vercel and select the **Next.js** framework preset.
3. Use the project root, a supported Node.js LTS runtime, `npm install` for install,
   and `npm run build` for build. Leave output-directory detection at its default.
4. No environment variables or backend integrations are needed. Deploy, then check
   `/`, `/play`, `/result`, and `/cek` on the HTTPS preview before promoting it.

Progress belongs to one browser/origin. A preview deployment and production domain
have separate localStorage. `/cek` is hidden and noindex, but is not access-controlled.

## Game rules

- Each seeded run selects 20 unique questions: 10 Stack and 10 Queue. Each topic
  uses 3 easy, 4 medium, and 3 hard questions from a bank of 54 questions.
- Start with 3 lives, maximum 3. Wrong answers and timeouts lose one life and reset
  the streak. Three consecutive correct answers restore one life and reset it.
- Each attempt has 30 seconds. Correct answers finish a room; wrong/timeout attempts
  can be retried while lives remain. Zero lives ends the game; 20 rooms wins.
- Base points: easy 100, medium 150, hard 200. Time bonus: remaining seconds × 2.
  A hint reduces the entire earned stage score by 25%; fractional .5 points remain.
  Wrong answers/timeouts earn zero. Maximum run score: 4200.
- PUSH/POP execute real stack mutations. Array TOP starts at 0 and increases before
  insertion; linked-list TOP and next pointers reflect the same stack.
- ENQUEUE appends at TAIL and DEQUEUE removes HEAD. Queue array Alternative 2
  moves HEAD/TAIL and shifts active elements only when TAIL reaches IndexMax.
  Stage 11 pauses for a short FIFO tutorial before the timer starts.
- Deadline timing survives tab switching and refresh. Pause freezes remaining
  milliseconds. Duplicate/stale submissions cannot deduct or score twice.
- Session journals and audio preferences persist locally. Storage failures leave
  the current game playable in memory, but progress may not survive closing/reload.
  Repeated display ticks do not rewrite unchanged persisted data.
- Ten-stage saves cannot resume into a 20-stage run; the game prompts for a new
  session. Old summary results remain visible as an archive on `/result`.
- Audio starts after interaction, with independent music/SFX controls. Reduced-motion
  preferences suppress motion effects. Effects do not alter timing or scores.
  Music is enabled by default (35% volume), and legacy default-muted preferences
  are migrated once. Explicit music mute/volume choices are then saved separately.

## Results and verification limitations

Completed sessions generate a fixed **1200 × 1600 PNG** named
`StackWarehouse_NIM_Nama_Attempt.png`, with visible statistics, codes, a compact QR,
and versioned UTF-8 iTXt metadata. The latest saved session can regenerate the card.

`/cek` processes batches locally, validates PNG structure, payload version, checksum,
and journal/report consistency, detects duplicate sessions, and exports CSV.
**VALID FORMAT means consistent data, not an authentic result.** Nothing is uploaded;
checker data stays in tab memory. CSV includes invalid files and duplicate flags.

The full PNG uses `SW3`; screenshot checking uses the separate `SWM2` code containing
identity, score, Stack/Queue correct counts, total correct, hints, and attempt.
Client-side CRC32 is public and can be regenerated:
it detects accidental corruption and inconsistent fields, but does not prevent
cheating, prove identity, or establish that a screenshot was not edited.

Current formats: [PNG payload v3](docs/result-format-v3.md) and
[manual code v2](docs/manual-check-v2.md). Older format documents remain in `docs/`
for reference. The existing [production audit](docs/production-readiness.md)
describes the earlier Stack-only release.
