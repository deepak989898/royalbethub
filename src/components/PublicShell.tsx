"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TrackVisit } from "@/components/TrackVisit";
import { FirebaseBanner } from "@/components/FirebaseBanner";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/roulette")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full flex-col">
      <TrackVisit />
      <FirebaseBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
