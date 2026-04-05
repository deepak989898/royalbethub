"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { Gift, Loader2, CheckCircle2 } from "lucide-react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { filterCasinosForIndia, normalizeCasinoSite } from "@/lib/casino-utils";
import type { CasinoSite } from "@/lib/types";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/25";

export function BonusLeadForm() {
  const [sites, setSites] = useState<CasinoSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [siteSlug, setSiteSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lastPhone, setLastPhone] = useState("");
  const [lastSiteName, setLastSiteName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSites() {
      if (!isFirebaseConfigured()) {
        setSites([]);
        setSitesLoading(false);
        return;
      }
      try {
        const q = query(collection(getDb(), "sites"), orderBy("sortOrder", "asc"));
        const snap = await getDocs(q);
        const rows: CasinoSite[] = [];
        snap.forEach((d) => {
          const row = normalizeCasinoSite(d.data() as Record<string, unknown>, d.id);
          if (row.active !== false) rows.push(row);
        });
        if (!cancelled) {
          setSites(filterCasinosForIndia(rows));
        }
      } catch {
        if (!cancelled) setSites([]);
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    }
    void loadSites();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!siteSlug) {
      setError("Please select the website you signed up on.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured. Add .env.local with your project keys.");
      return;
    }
    const picked = sites.find((s) => s.slug === siteSlug);
    if (!picked) {
      setError("Selected website is no longer available. Refresh and try again.");
      return;
    }
    setLoading(true);
    try {
      const p = phone.trim();
      await addDoc(collection(getDb(), "bonus_leads"), {
        name: name.trim(),
        email: email.trim(),
        phone: p,
        siteSlug: picked.slug,
        siteName: picked.name,
        createdAt: serverTimestamp(),
      });
      setLastPhone(p);
      setLastSiteName(picked.name);
      setDone(true);
      setSiteSlug("");
      setName("");
      setEmail("");
      setPhone("");
    } catch {
      setError("Could not submit. Check Firestore rules are deployed (must include siteSlug & siteName).");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center dark:border-emerald-500/30">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">You&apos;re on the list</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          For <strong className="text-[var(--text-primary)]">{lastSiteName}</strong>: create your
          account through our partner link, play with the minimum amount required by that offer, and
          we&apos;ll match your details to credit the{" "}
          <strong className="text-amber-600 dark:text-amber-300">extra 50% first-deposit bonus</strong>{" "}
          to the gaming account tied to{" "}
          <strong className="text-[var(--text-primary)]">{lastPhone || "your mobile number"}</strong>{" "}
          once eligibility is confirmed. Allow up to 48 hours after qualifying play.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 text-sm text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-6 shadow-sm backdrop-blur-sm dark:bg-[var(--surface)]/80 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <Gift className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Extra 50% on first deposit</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Pick the partner you joined, then leave your details so we can match your account.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Partner website
          </span>
          <select
            required
            value={siteSlug}
            onChange={(e) => setSiteSlug(e.target.value)}
            disabled={sitesLoading || (!sitesLoading && sites.length === 0)}
            className={inputClass}
          >
            <option value="">
              {sitesLoading
                ? "Loading partners…"
                : sites.length === 0
                  ? "No partners available (configure Firebase)"
                  : "Select website…"}
            </option>
            {sites.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Full name
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="As on your ID"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Email
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Phone
          </span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="+91 …"
            autoComplete="tel"
          />
        </label>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || sitesLoading || sites.length === 0}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-[#1a1005] transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {loading ? "Sending…" : "Claim bonus eligibility"}
      </button>
    </form>
  );
}
