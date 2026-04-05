"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { normalizeCasinoSite } from "@/lib/casino-utils";
import { logClick } from "@/lib/analytics";
import Link from "next/link";

export function GoRedirect() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [message, setMessage] = useState("Checking partner link…");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    async function run() {
      if (!isFirebaseConfigured()) {
        setMessage("Firebase is not configured.");
        return;
      }
      const ref = doc(getDb(), "sites", slug);
      const snap = await getDoc(ref);
      if (cancelled) return;
      if (!snap.exists()) {
        setMessage("This partner is no longer listed.");
        return;
      }
      const site = normalizeCasinoSite(snap.data() as Record<string, unknown>, snap.id);
      if (!site.url) {
        setMessage("URL missing for this listing.");
        return;
      }
      await logClick(slug, `/go/${slug}`);
      window.location.replace(site.url);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-[var(--text-secondary)]">Invalid partner link.</p>
        <Link href="/" className="mt-4 text-amber-600 hover:underline dark:text-amber-400">
          Back home
        </Link>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-[var(--text-secondary)]">Configure Firebase in .env.local to enable redirects.</p>
        <Link href="/" className="mt-4 text-amber-600 hover:underline dark:text-amber-400">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-amber-600 dark:text-amber-400" aria-hidden />
      <p className="text-[var(--text-primary)]">{message}</p>
      {message !== "Checking partner link…" ? (
        <Link href="/" className="text-sm text-amber-600 hover:underline dark:text-amber-400">
          Return to Royal Bet Hub
        </Link>
      ) : null}
    </div>
  );
}
