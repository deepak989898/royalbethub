"use client";

import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { CasinoSite } from "@/lib/types";

type Props = { site: CasinoSite };

export function CasinoCard({ site }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-sm transition hover:border-amber-500/40 hover:shadow-md dark:shadow-xl dark:shadow-black/40 dark:hover:border-amber-500/30 dark:hover:shadow-amber-900/20">
      {site.badge ? (
        <span className="absolute right-4 top-4 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
          {site.badge}
        </span>
      ) : null}
      <div className="mb-4 flex items-start justify-between gap-3 pr-16">
        <div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">{site.name}</h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/80">{site.tagline}</p>
        </div>
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-amber-600 dark:bg-black/40 dark:text-amber-400"
          title="Editorial rating"
        >
          <Star className="h-4 w-4 fill-current" aria-hidden />
          <span className="text-sm font-semibold tabular-nums">{site.rating.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{site.description}</p>
      {site.promoCode ? (
        <p className="mt-3 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200/90">
          Promo: <strong className="font-mono">{site.promoCode}</strong> (verify on cashier)
        </p>
      ) : null}
      <ul className="mt-4 space-y-2 text-sm text-[var(--text-primary)] dark:text-zinc-300">
        {site.pros.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/go/${site.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-center text-sm font-semibold text-[#1a1005] transition group-hover:from-amber-400 group-hover:to-amber-500 sm:flex-none"
        >
          Play &amp; sign up
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href={`/reviews/${site.slug}`}
          className="text-sm font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400/90"
        >
          Full review
        </Link>
      </div>
    </article>
  );
}
