"use client";
import { useState } from "react";
import { ArrowRight, HardHat } from "lucide-react";
import { useGameStore } from "@/state/game-store";
import { useHydrated } from "@/components/providers";
import { isPlayer } from "@/lib/game/player";
import { WarehouseScene } from "@/components/warehouse/warehouse-scene";
import { PixelWorker } from "@/components/warehouse/pixel-worker";
import { Reveal } from "@/components/ui/reveal";
import { EngineGame } from "./engine-game";
export function PlayFoundation() {
  const ready = useHydrated();
  const player = useGameStore((s) => s.player);
  const register = useGameStore((s) => s.register);
  const [error, setError] = useState("");
  if (!ready)
    return (
      <div className="shell page-space loading-state" role="status">
        Menyiapkan area bermain…
      </div>
    );
  return (
    <div className="shell page-space game-page">
      {!player ? (
        <>
          <div className="eyebrow">POS PENDAFTARAN / OPERATOR BARU</div>
          <h1 className="page-title pixel-heading">
            Ambil helm.
            <br />
            <span>Mulai petualangan.</span>
          </h1>
          <div className="registration-layout">
            <Reveal className="registration-art">
              <WarehouseScene />
              <div className="operator-brief">
                <PixelWorker />
                <div>
                  <strong>Selamat datang, calon operator!</strong>
                  <p>
                    Mandor menunggumu di ruang pertama. Lengkapi kartu operator
                    sebelum masuk.
                  </p>
                </div>
              </div>
            </Reveal>
            <section className="pixel-panel registration">
              <div className="panel-kicker">
                <HardHat size={18} /> KARTU OPERATOR <span>BARU</span>
              </div>
              <h2>Daftar sebelum bertugas</h2>
              <p className="form-intro">
                Tiga data sederhana untuk kartu hasil belajarmu.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  const next = {
                    name: String(data.get("name") || "").trim(),
                    nim: String(data.get("nim") || "").trim(),
                    className: String(data.get("className") || "").trim(),
                  };
                  if (!isPlayer(next)) {
                    setError(
                      "Lengkapi nama, NIM (3–24 huruf, angka, titik atau tanda hubung), dan kelas.",
                    );
                    return;
                  }
                  register(next);
                  setError("");
                }}
              >
                <label htmlFor="name">Nama</label>
                <input
                  id="name"
                  name="name"
                  placeholder="Nama lengkap"
                  autoComplete="name"
                  required
                  maxLength={40}
                />
                <label htmlFor="nim">NIM</label>
                <input
                  id="nim"
                  name="nim"
                  placeholder="Contoh: 1025886213"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9.\-]{3,24}"
                  autoComplete="off"
                  aria-describedby="nim-help"
                />
                <p className="field-hint" id="nim-help">
                  3–15 karakter.
                </p>
                <label htmlFor="className">Kelas</label>
                <input
                  id="className"
                  name="className"
                  placeholder="Contoh: 25-01"
                  required
                  maxLength={40}
                  autoComplete="off"
                />
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button" type="submit">
                  Daftar & masuk gudang <ArrowRight size={18} />
                </button>
                <p className="form-help">
                  Data hanya disimpan di browser ini. Tanpa akun atau server
                  penyimpanan.
                </p>
              </form>
            </section>
          </div>
        </>
      ) : (
        <EngineGame />
      )}
    </div>
  );
}
