"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isFirebaseConfigured()) {
      setError("Configure .env.local first.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      window.location.href = "/admin";
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a12] px-4 text-center text-zinc-400">
        <p>Add Firebase environment variables to use admin login.</p>
        <Link href="/" className="mt-4 text-amber-400 hover:underline">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0a12] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12101a] p-8 shadow-2xl">
        <h1 className="text-center text-xl font-semibold text-white">Admin sign in</h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Use an account that has an <code className="text-amber-600">admins/&lt;uid&gt;</code>{" "}
          document in Firestore.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Email
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-amber-500/50"
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-amber-500/50"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-semibold text-[#1a1005] hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Sign in
          </button>
        </form>
        <Link href="/" className="mt-6 block text-center text-sm text-zinc-500 hover:text-amber-400">
          ← Back to Royal Bet Hub
        </Link>
      </div>
    </div>
  );
}
