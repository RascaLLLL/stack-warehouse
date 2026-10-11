"use client";
import { useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { GameDialog } from "@/components/ui/game-dialog";
import Link from "next/link";
export function HowToPlay({ small = false }: { small?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={
          small
            ? "button button-secondary"
            : "button button-secondary how-button"
        }
        onClick={() => setOpen(true)}
      >
        <BookOpen size={18} />
        Cara bermain
      </button>
      <GameDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Panduan operator"
      >
        <p className="dialog-intro">
          Aturan gudang sederhana: peti terakhir masuk akan keluar lebih dulu.
        </p>
        <ol className="how-steps">
          <li>
            <b>01</b>
            <div>
              <strong>Daftarkan operator</strong>
              <p>Isi nama, NIM, dan kelas. Data tersimpan di browser ini.</p>
            </div>
          </li>
          <li>
            <b>02</b>
            <div>
              <strong>Prediksi lalu jalankan operasi</strong>
              <p>
                Pilih TOP, telusuri operasi, susun urutan, atau perbaiki kode.
                Array dan linked list menampilkan stack yang sama.
              </p>
            </div>
          </li>
          <li>
            <b>03</b>
            <div>
              <strong>Pahami operasi</strong>
              <p>PUSH menambah, POP mengambil, PEEK mengintip peti teratas.</p>
            </div>
          </li>
        </ol>
        <p className="form-help">
          10 ruang, 30 detik per ruang, 3 nyawa. Salah atau waktu habis
          mengurangi 1 nyawa. Setiap 3 jawaban benar berurutan memulihkan 1
          nyawa, maksimal 3. Gunakan Jeda untuk menghentikan timer. Tiap run: 3
          easy (100 poin), 4 medium (150), 3 hard (200). Bonus sisa detik × 2;
          petunjuk mengurangi 25% poin tahap.
        </p>
        <Link className="button" href="/play" onClick={() => setOpen(false)}>
          Mulai permainan <ArrowRight size={18} />
        </Link>
      </GameDialog>
    </>
  );
}
