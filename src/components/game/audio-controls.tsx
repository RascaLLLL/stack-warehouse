"use client";
import { Music2, Music4, Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "@/state/game-store";
export function AudioControls({ compact = false }: { compact?: boolean }) {
  const musicMuted = useGameStore((s) => s.musicMuted),
    sound = useGameStore((s) => s.soundEnabled);
  const musicVolume = useGameStore((s) => s.musicVolume),
    sfxVolume = useGameStore((s) => s.sfxVolume);
  const toggleMusic = useGameStore((s) => s.toggleMusic),
    toggleSound = useGameStore((s) => s.toggleSound),
    setVolume = useGameStore((s) => s.setVolume);
  return (
    <details className={`audio-controls ${compact ? "audio-compact" : ""}`}>
      <summary
        aria-label="Pengaturan musik dan efek suara"
        title="Pengaturan audio"
      >
        {musicMuted ? <Music4 size={19} /> : <Music2 size={19} />}
        <span className="audio-summary-text">AUDIO</span>
      </summary>
      <div className="audio-popover">
        <strong className="hud-label">AUDIO RETRO</strong>
        <button
          type="button"
          className="button button-secondary"
          aria-pressed={!musicMuted}
          onClick={toggleMusic}
        >
          {musicMuted ? <Music4 size={17} /> : <Music2 size={17} />}{" "}
          {musicMuted ? "Aktifkan musik" : "Bisukan musik"}
        </button>
        <label>
          Volume musik · {Math.round(musicVolume * 100)}%
          <input
            aria-label="Volume musik"
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(musicVolume * 100)}
            onChange={(e) => setVolume("music", Number(e.target.value) / 100)}
          />
        </label>
        <button
          type="button"
          className="button button-secondary"
          aria-pressed={sound}
          onClick={toggleSound}
        >
          {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}{" "}
          {sound ? "Bisukan efek suara" : "Aktifkan efek suara"}
        </button>
        <label>
          Volume efek suara · {Math.round(sfxVolume * 100)}%
          <input
            aria-label="Volume efek suara"
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(sfxVolume * 100)}
            onChange={(e) => setVolume("sfx", Number(e.target.value) / 100)}
          />
        </label>
        <p>Audio mulai setelah interaksi. Pilihan tersimpan di browser ini.</p>
      </div>
    </details>
  );
}
