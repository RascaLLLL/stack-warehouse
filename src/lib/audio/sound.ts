import type { AudioPreferences, SoundCue } from "../effects/events";
export type MusicTrack = "menu" | "gameplay" | null;
type Voice = {
  oscillator: OscillatorNode;
  envelope: GainNode;
  bus: "music" | "sfx";
};
type Note = [frequency: number, duration: number];
export type AudioScheduler = {
  start: (callback: () => void) => ReturnType<typeof setInterval>;
  stop: (timer: ReturnType<typeof setInterval>) => void;
};
// Original synthesized chiptunes; no licensed assets or network requests.
const melodies: Record<SoundCue, Note[]> = {
  click: [[620, 0.035]],
  push: [
    [180, 0.05],
    [360, 0.07],
  ],
  pop: [
    [360, 0.04],
    [160, 0.08],
  ],
  correct: [
    [523.25, 0.08],
    [659.25, 0.08],
    [783.99, 0.12],
  ],
  wrong: [
    [220, 0.1],
    [164.81, 0.14],
  ],
  warning: [[880, 0.055]],
  lifeRestored: [
    [659.25, 0.09],
    [783.99, 0.09],
    [1046.5, 0.16],
  ],
  stageComplete: [
    [783.99, 0.1],
    [1046.5, 0.15],
  ],
  door: [
    [130.81, 0.08],
    [196, 0.08],
    [261.63, 0.1],
  ],
  victory: [
    [523.25, 0.12],
    [659.25, 0.12],
    [783.99, 0.12],
    [1046.5, 0.28],
  ],
  gameOver: [
    [392, 0.18],
    [329.63, 0.18],
    [261.63, 0.18],
    [130.81, 0.35],
  ],
};
const tracks = {
  menu: {
    beat: 0.27,
    notes: [60, 0, 64, 67, 0, 64, 62, 0, 60, 64, 67, 72, 71, 67, 64, 0],
    bass: [48, 48, 53, 55],
  },
  gameplay: {
    beat: 0.2,
    notes: [
      60, 67, 64, 67, 62, 69, 65, 69, 64, 71, 67, 71, 65, 72, 69, 72, 64, 67,
      72, 67, 62, 65, 69, 65, 60, 64, 67, 64, 59, 62, 67, 0,
    ],
    bass: [48, 50, 52, 53, 52, 50, 48, 43],
  },
};
export class RetroAudio {
  private context: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private voices = new Set<Voice>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private track: MusicTrack = null;
  private step = 0;
  private nextNote = 0;
  private visible = true;
  private unlocked = false;
  private preferences: AudioPreferences = {
    musicMuted: false,
    musicVolume: 0.35,
    sfxVolume: 0.5,
    soundEnabled: false,
  };
  constructor(
    private createContext: () => AudioContext = () => new AudioContext(),
    private scheduler: AudioScheduler = {
      start: (callback) => setInterval(callback, 100),
      stop: (timer) => clearInterval(timer),
    },
  ) {}
  diagnostics() {
    return {
      contextState: this.context?.state ?? "uninitialized",
      schedulerActive: this.timer !== null,
      voices: this.voices.size,
      unlocked: this.unlocked,
    };
  }
  // Must be invoked directly in a trusted pointer/key handler, never by hydration.
  async unlock(): Promise<boolean> {
    try {
      if (!this.context) {
        const context = this.createContext();
        this.context = context;
        this.musicBus = context.createGain();
        this.sfxBus = context.createGain();
        this.musicBus.connect(context.destination);
        this.sfxBus.connect(context.destination);
        this.applyGains();
      }
      const context = this.context;
      if (context.state === "suspended") await context.resume();
      if (this.context !== context) return false;
      this.unlocked = context.state === "running";
      this.syncMusic();
      return this.unlocked;
    } catch {
      return false;
    }
  }
  configure(preferences: AudioPreferences) {
    this.preferences = preferences;
    this.applyGains();
    if (!preferences.soundEnabled || preferences.sfxVolume === 0)
      this.stopVoices("sfx");
    this.syncMusic();
  }
  setTrack(track: MusicTrack) {
    if (this.track === track) {
      this.syncMusic();
      return;
    }
    this.stopMusic();
    this.track = track;
    this.step = 0;
    this.syncMusic();
  }
  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible) {
      this.stopMusic();
      this.stopVoices("sfx");
      if (this.context?.state === "running")
        void this.context.suspend().catch(() => {});
    } else if (this.unlocked && this.context) {
      const context = this.context;
      void context
        .resume()
        .then(() => {
          if (this.context === context) this.syncMusic();
        })
        .catch(() => {});
    }
  }
  private applyGains() {
    const context = this.context;
    if (!context) return;
    this.musicBus?.gain.setTargetAtTime(
      this.preferences.musicMuted ? 0 : this.preferences.musicVolume * 0.18,
      context.currentTime,
      0.035,
    );
    this.sfxBus?.gain.setTargetAtTime(
      this.preferences.soundEnabled ? this.preferences.sfxVolume * 0.22 : 0,
      context.currentTime,
      0.015,
    );
  }
  private syncMusic() {
    if (
      !this.context ||
      !this.unlocked ||
      this.context.state !== "running" ||
      !this.visible ||
      !this.track ||
      this.preferences.musicMuted ||
      this.preferences.musicVolume === 0
    ) {
      this.stopMusic();
      return;
    }
    if (this.timer !== null) return; // One scheduler, irrespective of renders/routes/toggles.
    this.nextNote = this.context.currentTime + 0.035;
    this.schedule();
    this.timer = this.scheduler.start(() => this.schedule());
  }
  private schedule() {
    const context = this.context;
    if (!context || !this.track || context.state !== "running") return;
    const pattern = tracks[this.track];
    // Never catch up a suspended or stalled scheduler with a burst of old notes.
    if (this.nextNote < context.currentTime)
      this.nextNote = context.currentTime + 0.025;
    while (this.nextNote < context.currentTime + 0.18) {
      const note = pattern.notes[this.step % pattern.notes.length];
      if (note)
        this.tone(
          440 * 2 ** ((note - 69) / 12),
          this.nextNote,
          pattern.beat * 0.75,
          "music",
          "triangle",
        );
      if (this.step % 4 === 0)
        this.tone(
          440 *
            2 **
              ((pattern.bass[Math.floor(this.step / 4) % pattern.bass.length] -
                69) /
                12),
          this.nextNote,
          pattern.beat * 1.7,
          "music",
          "triangle",
        );
      this.step++;
      this.nextNote += pattern.beat;
    }
  }
  play(cue: SoundCue, delay = 0) {
    const context = this.context;
    if (
      !context ||
      !this.unlocked ||
      !this.visible ||
      context.state !== "running" ||
      !this.preferences.soundEnabled ||
      this.preferences.sfxVolume === 0
    )
      return;
    let at = context.currentTime + 0.015 + delay;
    for (const [frequency, duration] of melodies[cue]) {
      this.tone(frequency, at, duration, "sfx", "square");
      at += duration;
    }
  }
  playBatch(cues: readonly SoundCue[]) {
    cues.forEach((cue, i) => this.play(cue, i * 0.16));
  }
  private tone(
    frequency: number,
    at: number,
    duration: number,
    bus: Voice["bus"],
    type: OscillatorType,
  ) {
    const context = this.context,
      output = bus === "music" ? this.musicBus : this.sfxBus;
    if (!context || !output || this.voices.size >= 48) return;
    const oscillator = context.createOscillator(),
      envelope = context.createGain();
    const voice: Voice = { oscillator, envelope, bus };
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(0.4, at + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    this.voices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(voice);
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.012);
  }
  private stopVoices(bus?: Voice["bus"]) {
    for (const voice of [...this.voices])
      if (!bus || voice.bus === bus) {
        voice.oscillator.onended = null;
        try {
          voice.oscillator.stop();
        } catch {}
        voice.oscillator.disconnect();
        voice.envelope.disconnect();
        this.voices.delete(voice);
      }
  }
  private stopMusic() {
    if (this.timer !== null) this.scheduler.stop(this.timer);
    this.timer = null;
    this.stopVoices("music");
  }
  dispose() {
    this.stopMusic();
    this.stopVoices();
    this.musicBus?.disconnect();
    this.sfxBus?.disconnect();
    const context = this.context;
    this.context = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.unlocked = false;
    if (context && context.state !== "closed")
      void context.close().catch(() => {});
  }
}
export const retroAudio = new RetroAudio();
export const playClick = () => retroAudio.play("click");
