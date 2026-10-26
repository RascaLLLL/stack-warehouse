import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import "./globals.css";
import "@fontsource/press-start-2p/latin-400.css";
import "./adventure.css";
export const metadata: Metadata = {
  title: {
    default: "Stack Warehouse: Petualangan Stack & Queue",
    template: "%s | Stack Warehouse",
  },
  description:
    "Belajar struktur data Stack dan Queue melalui 20 tantangan gudang interaktif.",
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
              STACK WAREHOUSE <span className="footer-slash">/</span>{" "}
              PETUALANGAN STACK & QUEUE
            </span>
            <span>Dibuat untuk belajar, satu peti setiap langkah.</span>
            <span className="version">STACK / LIFO · QUEUE / FIFO</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
