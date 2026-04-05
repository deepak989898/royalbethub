"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { roulettePost } from "@/lib/roulette/client-api";

const WALLET_MSG_DISMISS_MS = 6500;

export function RouletteWalletClient() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [deposit, setDeposit] = useState("500");
  const [withdraw, setWithdraw] = useState("100");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (msg == null) return;
    const t = window.setTimeout(() => setMsg(null), WALLET_MSG_DISMISS_MS);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setToken(null);
        return;
      }
      setUser({ uid: u.uid });
      setToken(await u.getIdToken());
    });
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) return;
    const ref = doc(getDb(), "roulette_users", user.uid);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setBalance(null);
        return;
      }
      const d = snap.data();
      setBalance(Number(d.balance) || 0);
      setBlocked(Boolean(d.blocked));
    });
  }, [user]);

  async function doDeposit() {
    if (!token) return;
    setMsg(null);
    setBusy(true);
    try {
      const amount = Number(deposit);
      await roulettePost("/api/roulette/deposit", token, { amount });
      setMsg("Deposit credited.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function doWithdrawRequest() {
    if (!token) return;
    setMsg(null);
    setBusy(true);
    try {
      const amount = Number(withdraw);
      await roulettePost("/api/roulette/withdraw-request", token, { amount });
      setMsg("Withdrawal request submitted for admin review.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return <p className="text-zinc-500">Configure Firebase.</p>;
  }

  if (!user) {
    return (
      <p className="text-zinc-400">
        <Link href="/roulette/login" className="text-amber-400 underline">
          Sign in
        </Link>{" "}
        to manage your wallet.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-6">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Balance</p>
        <p className="mt-2 text-4xl font-bold text-amber-400">
          {balance != null ? `₹${balance.toLocaleString("en-IN")}` : "—"}
        </p>
        {blocked ? <p className="mt-2 text-sm text-red-400">Account blocked</p> : null}
      </div>

      {msg ? <p className="text-sm text-amber-200/90">{msg}</p> : null}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="font-semibold text-zinc-200">Simulated deposit</h2>
        <p className="mt-1 text-sm text-zinc-500">Adds play credits instantly (demo).</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="number"
            min={1}
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-4 py-2 text-white"
          />
          <button
            type="button"
            disabled={busy || blocked}
            onClick={() => void doDeposit()}
            className="rounded-xl bg-amber-600 px-5 py-2 font-semibold text-black disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deposit"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="font-semibold text-zinc-200">Withdraw request</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sends a request to admins. Balance stays until approved.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="number"
            min={1}
            value={withdraw}
            onChange={(e) => setWithdraw(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-4 py-2 text-white"
          />
          <button
            type="button"
            disabled={busy || blocked}
            onClick={() => void doWithdrawRequest()}
            className="rounded-xl border border-amber-700/50 px-5 py-2 font-semibold text-amber-200 hover:bg-amber-950/40 disabled:opacity-40"
          >
            Request
          </button>
        </div>
      </div>
    </div>
  );
}
