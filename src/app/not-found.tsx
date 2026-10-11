import { ButtonLink } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="shell page-space">
      <div className="panel empty-panel">
        <div className="eyebrow">404 / AREA TIDAK DITEMUKAN</div>
        <h1>Jalur gudang tidak tersedia.</h1>
        <p>Kembali ke pintu masuk untuk melanjutkan.</p>
        <ButtonLink href="/">Kembali ke beranda</ButtonLink>
      </div>
    </div>
  );
}
