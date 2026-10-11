"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ArrowUpRight } from "lucide-react";
import { AudioControls } from "@/components/game/audio-controls";

export function Header() {
  const path = usePathname();

  return (
    <header className="header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Stack Warehouse — beranda">
          <span className="brand-icon">
            <Boxes size={24} />
          </span>
          <span>
            STACK<span className="brand-sub">WAREHOUSE</span>
          </span>
        </Link>
        <nav aria-label="Navigasi utama">
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>
            Beranda
          </Link>
          <Link
            href="/play"
            aria-current={path === "/play" ? "page" : undefined}
          >
            Area bermain
          </Link>
        </nav>
        <div className="header-actions">
          <AudioControls />
          <Link href="/play" className="header-start">
            Masuk gudang <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
