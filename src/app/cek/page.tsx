import type { Metadata } from "next";
import { VerifyResult } from "@/components/game/verify-result";
export const metadata: Metadata = {
  title: "CEK HASIL PRAKTIKAN",
  robots: { index: false, follow: false },
};
export default function VerifyPage() {
  return <VerifyResult />;
}
