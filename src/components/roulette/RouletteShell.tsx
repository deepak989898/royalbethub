"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { RouletteNav } from "./RouletteNav";

export function RouletteShell({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (u) => setEmail(u?.email ?? null));
  }, []);

  return (
    <div className="dark min-h-screen bg-[#050508] font-sans text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(245,158,11,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(234,179,8,0.08), transparent 35%)",
        }}
      />
      <RouletteNav userEmail={email} />
      <div className="relative mx-auto max-w-6xl px-2 py-2 sm:px-6 sm:py-8 lg:py-10">{children}</div>
      <p className="relative px-2 pb-2 text-center text-[10px] text-zinc-600 sm:px-6 sm:pb-8 sm:text-[11px]">
        Simulated casino credits only — not real money. 18+.
      </p>
    </div>
  );
}
