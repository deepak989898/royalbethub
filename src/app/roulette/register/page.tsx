"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { roulettePost } from "@/lib/roulette/client-api";

function friendlyRegisterError(error: unknown): string {
  const code = (error as FirebaseError | undefined)?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already in use. Try Login.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-up is disabled in Firebase Console -> Authentication -> Sign-in method.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/network-request-failed":
      return "Network issue. Check internet and try again.";
    default:
      return "Could not register right now. Please try again.";
  }
}

export default function RouletteRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isFirebaseConfigured()) {
      setError("Configure Firebase first.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim().toLowerCase(),
        password
      );
      try {
        const token = await cred.user.getIdToken();
        await roulettePost("/api/roulette/bootstrap-user", token, {});
      } catch {
        // Account creation should not be treated as failed if wallet bootstrap is unavailable.
      }
      router.replace("/roulette");
      router.refresh();
    } catch (e) {
      setError(friendlyRegisterError(e));
    } finally {
      setLoading(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <p className="text-center text-zinc-500">
        Add Firebase keys to <code className="text-amber-500">.env.local</code>.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-amber-900/40 bg-black/60 p-8 shadow-xl shadow-amber-950/20">
      <h1 className="text-center text-xl font-semibold text-amber-200">Create account</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        Already have one?{" "}
        <Link href="/roulette/login" className="text-amber-400 hover:underline">
          Login
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-xs uppercase tracking-wide text-zinc-500">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-600/50"
          />
        </label>
        <label className="block text-xs uppercase tracking-wide text-zinc-500">
          Password
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-600/50"
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Register &amp; play
        </button>
      </form>
    </div>
  );
}
