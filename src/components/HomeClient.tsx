"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Shield, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { filterCasinosForIndia, normalizeCasinoSite } from "@/lib/casino-utils";
import type { CasinoSite } from "@/lib/types";
import { CasinoCard } from "./CasinoCard";
import { BonusLeadForm } from "./BonusLeadForm";
import { LimitedBonusCountdown } from "./LimitedBonusCountdown";
import { LiveWinsTicker } from "./LiveWinsTicker";
import { WithdrawalProofSection } from "./WithdrawalProofSection";
import { TestimonialsSection } from "./TestimonialsSection";

export function HomeClient() {
  const [sites, setSites] = useState<CasinoSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isFirebaseConfigured()) {
        setSites([]);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(getDb(), "sites"), orderBy("sortOrder", "asc"));
        const snap = await getDocs(q);
        const rows: CasinoSite[] = [];
        snap.forEach((d) => {
          const data = normalizeCasinoSite(d.data() as Record<string, unknown>, d.id);
          if (data.active !== false) rows.push(data);
        });
        if (!cancelled) {
          setSites(filterCasinosForIndia(rows));
          setErr(null);
        }
      } catch {
        if (!cancelled) {
          setErr("Could not load listings. Check Firestore rules and indexes.");
          setSites([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-40"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245, 158, 11, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(220, 20, 60, 0.1), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl space-y-6">
          <LiveWinsTicker />
          <LimitedBonusCountdown />
        </div>
      </section>

      <section className="relative overflow-hidden px-4 pb-16 sm:px-6">
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/90">
            India-focused affiliate picks
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            Best casino &amp; betting apps{" "}
            <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent dark:from-amber-200 dark:to-amber-500">
              compared for Indian players
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            RoyalBetHub explains what each brand is best at—UPI-friendly flows, sports depth, slots,
            and live tables. We track outbound clicks and may earn a commission when you sign up
            through our links.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--text-tertiary)]">
            Target topics we cover in the{" "}
            <Link href="/blog" className="text-amber-600 hover:underline dark:text-amber-400">
              blog
            </Link>
            : best casino apps in India, online betting real money India, legality by state, and
            operator reviews.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { icon: Shield, t: "Transparent comparisons", d: "Why a site fits your style." },
              { icon: Zap, t: "Tracked partner links", d: "CTAs open in a new tab for safety." },
              { icon: TrendingUp, t: "Bonus + promo codes", d: "See cards, offers page, and admin." },
            ].map(({ icon: Icon, t, d }) => (
              <div
                key={t}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 text-left shadow-sm dark:shadow-none"
              >
                <Icon className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden />
                <h2 className="mt-3 font-semibold text-[var(--text-primary)]">{t}</h2>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="scroll-mt-24 px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Compared partner sites
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">
            Editorial summaries only—not financial advice. Geo-targeted for India where
            <code className="mx-1 rounded bg-[var(--surface-muted)] px-1 text-xs text-[var(--text-primary)]">
              regions
            </code>{" "}
            includes IN or is unset. Verify legality in your state on the operator&apos;s site.
          </p>
          {err ? (
            <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-700 dark:border-red-500/30 dark:text-red-300">
              {err}
            </p>
          ) : null}
          {loading ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
                  aria-hidden
                />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-8 text-[var(--text-secondary)]">
              No casinos yet. Configure Firebase, deploy rules, then sign in to{" "}
              <strong className="text-[var(--text-primary)]">Admin</strong> and click{" "}
              <strong className="text-[var(--text-primary)]">Seed default casinos</strong>.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {sites.map((s) => (
                <CasinoCard key={s.slug} site={s} />
              ))}
            </div>
          )}

          <div className="mt-12">
            <WithdrawalProofSection />
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section
        id="bonus"
        className="scroll-mt-24 border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-20 sm:px-6 dark:bg-black/20"
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Hub-exclusive first-deposit uplift
          </h2>
          <p className="mt-3 text-center text-[var(--text-secondary)]">
            Choose your partner below, submit details, then complete signup and minimum play. We use
            your mobile number to match your account for the extra credit.
          </p>
          <div className="mt-10">
            <BonusLeadForm />
          </div>
        </div>
      </section>
    </>
  );
}
