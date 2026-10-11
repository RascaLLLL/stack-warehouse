import type { Metadata } from "next";
import { PlayFoundation } from "@/components/game/play-foundation";
export const metadata: Metadata = { title: "Area bermain" };
export default function PlayPage() {
  return <PlayFoundation />;
}
