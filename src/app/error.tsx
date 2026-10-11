"use client";
import { ButtonLink } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell page-space">
      <div className="panel empty-panel">
        <h1>Gudang mengalami gangguan.</h1>
        <p>Coba muat ulang area ini untuk melanjutkan.</p>
        <button className="button" onClick={reset}>
          Coba lagi
        </button>
        <ButtonLink href="/" secondary>
          Kembali ke beranda
        </ButtonLink>
      </div>
    </div>
  );
}
