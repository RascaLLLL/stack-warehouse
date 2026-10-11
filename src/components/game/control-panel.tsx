import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ScanLine,
  LockKeyhole,
} from "lucide-react";
export function ControlPanel() {
  return (
    <section
      className="control-panel pixel-panel"
      aria-labelledby="controls-title"
    >
      <div className="panel-kicker">
        TERMINAL OPERASI <span>SIAGA</span>
      </div>
      <h2 id="controls-title">Kendali stack</h2>
      <div className="operation-controls">
        <button disabled aria-describedby="control-status">
          <ArrowDownToLine size={20} />
          <strong>PUSH</strong>
          <span>Tambah</span>
        </button>
        <button disabled aria-describedby="control-status">
          <ArrowUpFromLine size={20} />
          <strong>POP</strong>
          <span>Ambil</span>
        </button>
        <button disabled aria-describedby="control-status">
          <ScanLine size={20} />
          <strong>PEEK</strong>
          <span>Intip</span>
        </button>
      </div>
      <p className="control-status" id="control-status">
        <LockKeyhole size={15} />
        Kendali akan aktif setelah puzzle diimplementasikan.
      </p>
    </section>
  );
}
