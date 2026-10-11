import type { Metadata } from "next";
import { ResultView } from "@/components/game/result-view";
export const metadata: Metadata = { title: "Hasil belajar" };
export default function ResultPage() {
  return <ResultView />;
}
