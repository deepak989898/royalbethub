import type { Metadata } from "next";
import { RouletteShell } from "@/components/roulette/RouletteShell";

export const metadata: Metadata = {
  title: "Roulette — play table",
  description: "European roulette simulator with wallet and live rounds. Simulated credits — 18+.",
};

export default function RouletteLayout({ children }: { children: React.ReactNode }) {
  return <RouletteShell>{children}</RouletteShell>;
}
