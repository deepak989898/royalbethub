"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Gift, Loader2, CheckCircle2 } from "lucide-react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

export function BonusLeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lastPhone, setLastPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured. Add .env.local with your project keys.");
      return;
    }
    setLoading(true);
    try {
      const p = phone.trim();
      await addDoc(collection(getDb(), "bonus_leads"), {
        name: name.trim(),
        email: email.trim(),
        phone: p,
        createdAt: serverTimestamp(),
      });
      setLastPhone(p);
      setDone(true);
      setName("");
      setEmail("");
      setPhone("");
    } catch {
      setError("Could not submit. Check Firestore rules and your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold text-white">You&apos;re on the list</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          Create your account through our partner link, play with the minimum amount required by
          that offer, and we&apos;ll match your details to credit the{" "}
          <strong className="text-amber-300">extra 50% first-deposit bonus</strong> to the gaming
          account tied to <strong className="text-white">{lastPhone || "your mobile number"}</strong>{" "}
          once eligibility is confirmed. Allow up to 48 hours after qualifying play.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-6 text-sm text-amber-400 underline-offset-2 hover:underline"
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-[#12101a]/80 p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
          <Gift className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">Extra 50% on first deposit</h3>
          <p className="text-sm text-zinc-400">
            Register via our links, then claim this hub-exclusive uplift using your mobile number.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-amber-500/0 transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/30"
            placeholder="As on your ID"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/30"
            placeholder="you@email.com"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/30"
            placeholder="+91 …"
            autoComplete="tel"
          />
        </label>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-[#1a1005] transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {loading ? "Sending…" : "Claim bonus eligibility"}
      </button>
    </form>
  );
}
