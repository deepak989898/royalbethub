"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ArrowUpRight, Loader2, Star } from "lucide-react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { normalizeCasinoSite } from "@/lib/casino-utils";
import type { CasinoSite } from "@/lib/types";

function ReviewInner({ slug }: { slug: string }) {
  const [site, setSite] = useState<CasinoSite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const snap = await getDoc(doc(getDb(), "sites", slug));
      if (cancelled) return;
      if (!snap.exists()) {
        setSite(null);
        setLoading(false);
        return;
      }
      setSite(normalizeCasinoSite(snap.data() as Record<string, unknown>, snap.id));
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (site?.name) {
      document.title = `${site.name} review | RoyalBetHub`;
    }
  }, [site?.name]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" aria-hidden />
        Loading review…
      </div>
    );
  }

  if (!site) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-zinc-400">This casino is not in our directory (or was removed).</p>
        <Link href="/" className="mt-4 inline-block text-amber-400 hover:underline">
          Back to listings
        </Link>
      </div>
    );
  }

  const cons = site.cons?.length
    ? site.cons
    : ["Bonus wagering can be strict—read operator T&Cs.", "Availability varies by state law."];
  const payments = site.paymentMethods?.length
    ? site.paymentMethods
    : ["UPI / cards / bank (verify on operator site)", "Typical KYC before first withdrawal"];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        <Link href="/" className="text-amber-400 hover:underline">
          Home
        </Link>{" "}
        · Editorial review
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{site.name} review</h1>
          <p className="mt-2 text-lg text-amber-200/80">{site.tagline}</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-black/40 px-3 py-2 text-amber-400">
          <Star className="h-5 w-5 fill-current" aria-hidden />
          <span className="text-lg font-bold tabular-nums">{site.rating.toFixed(1)}</span>
          <span className="text-xs text-zinc-500">/5</span>
        </div>
      </div>

      <p className="mt-6 leading-relaxed text-zinc-300">{site.description}</p>

      {site.promoCode ? (
        <div className="mt-6 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
          Featured code: <strong className="font-mono">{site.promoCode}</strong> — confirm in
          cashier before deposit.
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Pros</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {site.pros.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-emerald-400">+</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Cons</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {cons.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-red-400/80">–</span>
                {c}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-lg font-semibold text-white">Payments &amp; withdrawals</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
          {payments.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">Bonuses</h2>
        {site.welcomeOffer ? (
          <p className="mt-2 text-sm text-zinc-300">
            <strong className="text-white">Welcome:</strong> {site.welcomeOffer}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">Welcome offer varies—check the operator site.</p>
        )}
        {site.noDepositNote ? (
          <p className="mt-3 text-sm text-zinc-300">
            <strong className="text-white">No-deposit style:</strong> {site.noDepositNote}
          </p>
        ) : null}
        {site.bonusDetails ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{site.bonusDetails}</p>
        ) : null}
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href={`/go/${site.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-[#1a1005] hover:from-amber-400 hover:to-amber-500"
        >
          Play &amp; sign up
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/legal-warning"
          className="inline-flex items-center rounded-xl border border-white/15 px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
        >
          India legal notice
        </Link>
      </div>
    </article>
  );
}

export function ReviewPageClient() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  if (!slug) {
    return <p className="p-8 text-center text-zinc-400">Invalid review link.</p>;
  }

  if (!isFirebaseConfigured()) {
    return (
      <p className="p-8 text-center text-zinc-400">
        Configure Firebase to load live reviews.{" "}
        <Link href="/" className="text-amber-400 hover:underline">
          Home
        </Link>
      </p>
    );
  }

  return <ReviewInner slug={slug} />;
}
