import {
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ScanLine,
  Layers,
  MousePointer2,
  Trophy,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { WarehouseScene } from "@/components/warehouse/warehouse-scene";
import { HowToPlay } from "@/components/game/how-to-play";
export default function Home() {
  return (
    <div className="shell adventure-landing">
      <section className="hero adventure-hero">
        <Reveal className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> PETUALANGAN STRUKTUR DATA
          </div>
          <h1 className="pixel-heading">
            STACK
            <br />
            <span>WAREHOUSE</span>
          </h1>
          <div className="hero-subtitle">THE LIFO CHALLENGE</div>
          <p className="hero-description">
            Selamat datang di <strong>Stack Warehouse.</strong> Susun peti, atur
            pengiriman, dan kuasai konsep <strong>stack</strong> lewat tantangan
            gudang.
          </p>
          <div className="hero-buttons">
            <ButtonLink href="/play">
              Mulai permainan <ArrowRight size={19} />
            </ButtonLink>
            <HowToPlay />
          </div>
          <div className="hero-stats">
            <div>
              <strong>10</strong>
              <span>Tantangan gudang</span>
            </div>
            <div>
              <strong>3</strong>
              <span>Operasi utama</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>Kesempatan belajar</span>
            </div>
          </div>
        </Reveal>
        <Reveal className="hero-art">
          <div className="art-caption">
            <span>01 / SELAMAT DATANG DI GUDANG</span>
            <span className="small-tag">LIFO</span>
          </div>
          <WarehouseScene />
          <div className="art-note">
            <span className="note-arrow">↳</span>
            <p>
              Peti <strong>C</strong> masuk terakhir.
              <br />
              Jadi, peti <strong>C</strong> keluar lebih dulu.
            </p>
            <span className="note-stamp">
              TERAKHIR MASUK
              <br />
              PERTAMA KELUAR
            </span>
          </div>
        </Reveal>
      </section>
      <div className="info-strip">
        <span>
          <Layers size={17} /> BELAJAR SAMBIL MENCOBA
        </span>
        <span>
          <MousePointer2 size={17} /> LANGSUNG DI BROWSER
        </span>
        <span>
          <Trophy size={17} /> TANTANGAN BERTAHAP
        </span>
      </div>
      <section id="cara-kerja" className="concept-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">KENALI ALAT KERJAMU</div>
            <h2>Satu stack. Tiga operasi.</h2>
          </div>
          <p>
            Semua aktivitas terjadi di bagian paling atas.
            <br />
            Itulah cara sebuah stack bekerja.
          </p>
        </div>
        <div className="concept-grid">
          {[
            {
              name: "PUSH",
              title: "Tambahkan peti",
              body: "Letakkan peti baru di posisi paling atas tumpukan.",
              icon: ArrowDownToLine,
              num: "01",
              color: "amber",
            },
            {
              name: "POP",
              title: "Ambil peti teratas",
              body: "Keluarkan peti paling atas. Peti di bawahnya menunggu giliran.",
              icon: ArrowUpFromLine,
              num: "02",
              color: "green",
            },
            {
              name: "PEEK",
              title: "Intip tanpa mengambil",
              body: "Lihat peti paling atas tanpa mengubah isi tumpukan.",
              icon: ScanLine,
              num: "03",
              color: "cream",
            },
          ].map(({ name, title, body, icon: Icon, num, color }) => (
            <article className={`concept-card ${color}`} key={name}>
              <div className="card-top">
                <span className="operation-icon">
                  <Icon size={22} />
                </span>
                <span className="card-number">/{num}</span>
              </div>
              <span className="operation-name">{name}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="foundation-note">
        <span className="status-dot" />
        <p>
          <strong>Gudang siap dimainkan.</strong> Selesaikan 10 tantangan stack,
          jalankan operasi nyata, dan kumpulkan skor sebelum waktu habis.
        </p>
      </div>
    </div>
  );
}
