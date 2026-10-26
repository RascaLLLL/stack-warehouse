import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveEffects,
  normalizeAudioPreferences,
} from "../src/lib/effects/events";
import {
  initialEngine,
  startEngine,
  transition,
  attemptKey,
  type EngineState,
} from "../src/lib/game/engine";
const start = () => startEngine("effects", 42, 1000);
const submit = (s: EngineState, correct = true) =>
  transition(s, {
    type: "submit",
    key: attemptKey(s),
    now: 2000,
    answer: correct
      ? s.selectedQuestions[s.currentRoom - 1].expectedAnswer
      : s.selectedQuestions[s.currentRoom - 1].availableActions.find(
          (a) => a.id !== s.selectedQuestions[s.currentRoom - 1].expectedAnswer,
        )!.id,
  });
const advance = (s: EngineState) => {
  const next = transition(s, {
    type: "continue",
    key: attemptKey(s),
    now: 2100,
  });
  return next.currentRoom === 11
    ? transition(next, { type: "enterQueue", now: 2100 })
    : next;
};
test("effects follow committed traces, never replay unchanged or duplicate submissions", () => {
  const s = start(),
    next = submit(s),
    batch = deriveEffects(s, next)!;
  assert.equal(batch.record, next.operationHistory.at(-1));
  assert.deepEqual(
    batch.cues.filter((c) => c === "push" || c === "pop"),
    batch
      .record!.trace.filter(
        (t) =>
          !["overflow", "underflow"].includes(t.output) &&
          ["PUSH", "POP"].includes(t.command.operation),
      )
      .map((t) => t.command.operation.toLowerCase()),
  );
  assert.equal(batch.celebration, true);
  assert.equal(batch.life, null);
  assert.equal(deriveEffects(next, next), null);
  assert.equal(deriveEffects(next, submit(next)), null);
  assert.deepEqual(deriveEffects(initialEngine(), s)!.cues, ["door"]);
});
test("life loss, recovery, and terminal cues correspond to actual rules", () => {
  let s = start(),
    n = submit(s, false),
    batch = deriveEffects(s, n)!;
  assert.equal(batch.life, "lost");
  assert.equal(batch.heart, 3);
  assert.equal(batch.shake, true);
  s = advance(n);
  for (let i = 0; i < 3; i++) {
    n = submit(s);
    batch = deriveEffects(s, n)!;
    assert.equal(batch.cues.includes("lifeRestored"), i === 2);
    s = advance(n);
  }
  assert.equal(batch.life, "restored");
  assert.equal(batch.heart, 3);
  for (let i = 0; i < 17; i++) {
    n = submit(s);
    batch = deriveEffects(s, n)!;
    assert.equal(batch.cues.includes("victory"), i === 16);
    s = advance(n);
  }
  assert.equal(n.gameStatus, "victory");
  s = start();
  for (let i = 0; i < 3; i++) {
    n = submit(s, false);
    batch = deriveEffects(s, n)!;
    assert.equal(batch.cues.includes("gameOver"), i === 2);
    s = advance(n);
  }
  assert.equal(n.gameStatus, "gameOver");
});
test("warnings occur only when an active deadline enters a new final-ten second", () => {
  const s = start(),
    n = transition(s, { type: "tick", now: 21000 });
  assert.deepEqual(deriveEffects(s, n)!.cues, ["warning"]);
  assert.equal(
    deriveEffects(n, transition(n, { type: "tick", now: 21100 })),
    null,
  );
  const paused = transition(n, { type: "pause", now: 21100 });
  assert.equal(deriveEffects(n, paused), null);
  const expired = transition(n, { type: "tick", now: 31000 });
  assert.equal(deriveEffects(n, expired)!.life, "lost");
  assert.equal(
    deriveEffects(expired, transition(expired, { type: "tick", now: 32000 })),
    null,
  );
});
test("saved audio preferences clamp invalid volumes and use safe defaults", () => {
  assert.deepEqual(normalizeAudioPreferences(undefined), {
    musicMuted: false,
    musicPreferenceSet: false,
    musicVolume: 0.35,
    sfxVolume: 0.5,
    soundEnabled: false,
  });
  assert.deepEqual(
    normalizeAudioPreferences({
      musicMuted: false,
      musicVolume: 5,
      sfxVolume: -4,
      soundEnabled: true,
    }),
    {
      musicMuted: false,
      musicPreferenceSet: false,
      musicVolume: 1,
      sfxVolume: 0,
      soundEnabled: true,
    },
  );
  assert.equal(
    normalizeAudioPreferences({ musicVolume: NaN, sfxVolume: Infinity })
      .musicVolume,
    0.35,
  );
  assert.equal(
    normalizeAudioPreferences({ musicMuted: true, musicPreferenceSet: true })
      .musicMuted,
    true,
  );
  assert.equal(
    normalizeAudioPreferences({ musicMuted: true }).musicMuted,
    false,
  );
});
