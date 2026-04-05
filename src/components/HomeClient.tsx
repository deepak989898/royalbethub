"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Shield, TrendingUp, Zap } from "lucide-react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import type { CasinoSite } from "@/lib/types";
import { CasinoCard } from "./CasinoCard";
import { BonusLeadForm } from "./BonusLeadForm";

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
          const data = d.data() as CasinoSite;
          if (data.active !== false) rows.push({ ...data, slug: data.slug || d.id });
        });
        if (!cancelled) {
          setSites(rows);
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
      <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245, 158, 11, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(168, 85, 247, 0.15), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400/90">
            Independent affiliate picks
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find the right casino{" "}
            <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
              for how you play
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Royal Bet Hub explains what each brand is best at—sports depth, slots variety, or live
            tables—so you can choose confidently. When you use our buttons, we may earn a
            commission at no extra cost to you.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { icon: Shield, t: "Transparent comparisons", d: "Why a site fits your style." },
              { icon: Zap, t: "One-tap partner links", d: "Tracked clicks; you stay in control." },
              { icon: TrendingUp, t: "Extra bonus queue", d: "50% uplift for qualifying signups." },
            ].map(({ icon: Icon, t, d }) => (
              <div
                key={t}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left"
              >
                <Icon className="h-8 w-8 text-amber-400" aria-hidden />
                <h2 className="mt-3 font-semibold text-white">{t}</h2>
                <p className="mt-1 text-sm text-zinc-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="scroll-mt-24 px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Compared partner sites</h2>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Editorial summaries only—not financial advice. Verify legality and offers in your
            region on the operator&apos;s site.
          </p>
          {err ? (
            <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {err}
            </p>
          ) : null}
          {loading ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl bg-white/[0.05]"
                  aria-hidden
                />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-zinc-400">
              No casinos yet. Configure Firebase, deploy rules, then sign in to{" "}
              <strong className="text-zinc-200">Admin</strong> and click{" "}
              <strong className="text-zinc-200">Seed default casinos</strong>.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {sites.map((s) => (
                <CasinoCard key={s.slug} site={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="bonus" className="scroll-mt-24 border-t border-white/10 bg-black/20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            Hub-exclusive first-deposit uplift
          </h2>
          <p className="mt-3 text-center text-zinc-400">
            Tap the button, leave your details, then complete signup and minimum play on your
            chosen partner. We use your mobile number to match your account for the extra credit.
          </p>
          <div className="mt-10">
            <BonusLeadForm />
          </div>
        </div>
      </section>
    </>
  );
}
