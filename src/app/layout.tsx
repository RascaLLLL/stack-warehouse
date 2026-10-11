import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import "./globals.css";
import "@fontsource/press-start-2p/latin-400.css";
import "./adventure.css";
export const metadata: Metadata = {
  title: {
    default: "Stack Warehouse: The LIFO Challenge",
    template: "%s | Stack Warehouse",
  },
  description:
    "Belajar struktur data stack melalui tantangan gudang interaktif. Kenali PUSH, POP, PEEK, dan prinsip LIFO.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <a href="#main" className="skip-link">
            Lewati ke konten
          </a>
          <Header />
          <main id="main">{children}</main>
          <footer className="footer shell">
            <span>
              STACK WAREHOUSE <span className="footer-slash">/</span> THE LIFO
              CHALLENGE
            </span>
            <span>Dibuat untuk belajar, satu peti setiap langkah.</span>
            <span className="version">STACK / LIFO</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
