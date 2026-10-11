import { test } from "node:test";
import assert from "node:assert/strict";
import { RetroAudio, type AudioScheduler } from "../src/lib/audio/sound";
import { normalizeAudioPreferences } from "../src/lib/effects/events";
const preferences = {
  musicMuted: false,
  musicVolume: 0.5,
  sfxVolume: 0.6,
  soundEnabled: true,
};
class Param {
  values: number[] = [];
  setTargetAtTime(v: number) {
    this.values.push(v);
  }
  setValueAtTime(v: number) {
    this.values.push(v);
  }
  linearRampToValueAtTime(v: number) {
    this.values.push(v);
  }
  exponentialRampToValueAtTime(v: number) {
    this.values.push(v);
  }
}
class Gain {
  gain = new Param();
  disconnected = false;
  connect() {}
  disconnect() {
    this.disconnected = true;
  }
}
class Oscillator {
  frequency = new Param();
  type = "square";
  onended: (() => void) | null = null;
  disconnected = false;
  connect() {}
  disconnect() {
    this.disconnected = true;
  }
  start() {}
  stop() {}
}
class Context {
  state = "suspended";
  currentTime = 0;
  destination = {};
  gains: Gain[] = [];
  oscillators: Oscillator[] = [];
  createGain() {
    const g = new Gain();
    this.gains.push(g);
    return g;
  }
  createOscillator() {
    const o = new Oscillator();
    this.oscillators.push(o);
    return o;
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
}
function setup() {
  const contexts: Context[] = [],
    timers = new Map<number, () => void>();
  let id = 0;
  const scheduler: AudioScheduler = {
    start: (callback) => {
      timers.set(++id, callback);
      return id as unknown as ReturnType<typeof setInterval>;
    },
    stop: (timer) => {
      timers.delete(timer as unknown as number);
    },
  };
  const audio = new RetroAudio(() => {
    const c = new Context();
    contexts.push(c);
    return c as unknown as AudioContext;
  }, scheduler);
  return { audio, contexts, timers };
}
test("autoplay stays locked; repeated renders and unlocks never duplicate context or music loop", async () => {
  const { audio, contexts, timers } = setup();
  audio.configure(preferences);
  audio.setTrack("menu");
  audio.play("click");
  assert.equal(contexts.length, 0);
  assert.equal(timers.size, 0);
  assert.equal(await audio.unlock(), true);
  for (let i = 0; i < 20; i++) {
    audio.configure(preferences);
    audio.setTrack("menu");
    await audio.unlock();
  }
  assert.equal(contexts.length, 1);
  assert.equal(timers.size, 1);
  const voices = [...contexts[0].oscillators];
  audio.setTrack("gameplay");
  assert.equal(timers.size, 1);
  assert.ok(voices.every((v) => v.disconnected));
  audio.dispose();
  assert.equal(timers.size, 0);
  assert.equal(contexts[0].state, "closed");
  assert.ok(contexts[0].gains.every((g) => g.disconnected));
  await audio.unlock();
  assert.equal(contexts.length, 2);
  assert.equal(timers.size, 1);
  audio.dispose();
});
test("music and SFX controls are independent and visibility suspends resources", async () => {
  const { audio, contexts, timers } = setup();
  audio.configure(preferences);
  audio.setTrack("menu");
  await audio.unlock();
  assert.equal(contexts[0].gains[0].gain.values.at(-1), 0.5 * 0.18);
  assert.equal(contexts[0].gains[1].gain.values.at(-1), 0.6 * 0.22);
  audio.configure({ ...preferences, musicMuted: true });
  assert.equal(timers.size, 0);
  audio.play("push");
  assert.equal(audio.diagnostics().voices, 2);
  audio.configure({ ...preferences, soundEnabled: false });
  assert.equal(timers.size, 1);
  const count = audio.diagnostics().voices;
  audio.play("push");
  assert.equal(audio.diagnostics().voices, count);
  audio.setVisible(false);
  assert.equal(timers.size, 0);
  assert.equal(audio.diagnostics().voices, 0);
  assert.equal(contexts[0].state, "suspended");
  audio.setVisible(true);
  await Promise.resolve();
  assert.equal(timers.size, 1);
  audio.dispose();
  assert.equal(timers.size, 0);
  assert.equal(audio.diagnostics().voices, 0);
});
test("rapid effects are bounded and finished oscillators disconnect", async () => {
  const { audio, contexts } = setup();
  audio.configure(preferences);
  await audio.unlock();
  audio.play("click");
  contexts[0].oscillators[0].onended!();
  assert.equal(audio.diagnostics().voices, 0);
  for (let i = 0; i < 100; i++) audio.play("victory");
  assert.equal(audio.diagnostics().voices, 48);
  audio.dispose();
  assert.ok(contexts[0].oscillators.every((o) => o.disconnected));
});
test("failed browser resume leaves audio silent and safely disposable", async () => {
  const { audio, contexts } = setup();
  audio.configure(preferences);
  await audio.unlock();
  audio.setVisible(false);
  contexts[0].resume = async () => {
    throw new Error("autoplay blocked");
  };
  assert.equal(await audio.unlock(), false);
  assert.equal(audio.diagnostics().schedulerActive, false);
  audio.dispose();
});

test("new and legacy sessions start gameplay music on interaction independently of SFX", async () => {
  for (const saved of [
    undefined,
    { musicMuted: true, musicVolume: 0.25, soundEnabled: true },
  ]) {
    const { audio, contexts, timers } = setup();
    const settings = normalizeAudioPreferences(saved);
    audio.configure(settings);
    audio.setTrack("gameplay");
    assert.equal(timers.size, 0);
    await audio.unlock();
    assert.equal(timers.size, 1);
    assert.ok(contexts[0].gains[0].gain.values.at(-1)! > 0);
    assert.ok(contexts[0].oscillators.length >= 2);
    audio.setTrack(null); // Pause.
    assert.equal(timers.size, 0);
    audio.setTrack("gameplay");
    assert.equal(timers.size, 1);
    audio.configure(
      normalizeAudioPreferences({
        ...settings,
        musicMuted: true,
        musicPreferenceSet: true,
      }),
    );
    assert.equal(timers.size, 0);
    audio.dispose();
  }
});
