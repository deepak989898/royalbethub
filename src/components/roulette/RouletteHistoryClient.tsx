"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { BetType } from "@/lib/roulette/types";
import { formatBetLabel } from "@/lib/roulette/types";

type BetRow = {
  id: string;
  roundId: string;
  type: BetType;
  selection: number | null;
  selectionStr?: string | null;
  amount: number;
  createdAt?: Date;
};

type LedgerRow = {
  id: string;
  type: string;
  amount: number;
  balanceAfter?: number;
  createdAt?: Date;
};

export function RouletteHistoryClient() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [betsListenErr, setBetsListenErr] = useState<string | null>(null);
  const [ledgerListenErr, setLedgerListenErr] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid } : null));
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      setBets([]);
      return;
    }
    const q = query(
      collection(getDb(), "roulette_bets"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    return onSnapshot(
      q,
      (snap) => {
        setBetsListenErr(null);
        const list: BetRow[] = [];
        snap.forEach((d) => {
          const x = d.data();
          list.push({
            id: d.id,
            roundId: String(x.roundId),
            type: x.type as BetType,
            selection: x.selection != null ? Number(x.selection) : null,
            selectionStr:
              x.selectionStr != null && String(x.selectionStr).length > 0
                ? String(x.selectionStr)
                : null,
            amount: Number(x.amount) || 0,
            createdAt: x.createdAt?.toDate?.(),
          });
        });
        setBets(list);
      },
      (err) => {
        setBetsListenErr(err.message || "Could not load bets");
      }
    );
  }, [user]);

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      setLedger([]);
      return;
    }
    const q = query(
      collection(getDb(), "roulette_transactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(80)
    );
    return onSnapshot(
      q,
      (snap) => {
        setLedgerListenErr(null);
        const list: LedgerRow[] = [];
        snap.forEach((d) => {
          const x = d.data();
          list.push({
            id: d.id,
            type: String(x.type),
            amount: Number(x.amount) || 0,
            balanceAfter: x.balanceAfter != null ? Number(x.balanceAfter) : undefined,
            createdAt: x.createdAt?.toDate?.(),
          });
        });
        setLedger(list);
      },
      (err) => {
        setLedgerListenErr(err.message || "Could not load ledger");
      }
    );
  }, [user]);

  if (!isFirebaseConfigured()) {
    return <p className="text-zinc-500">Configure Firebase.</p>;
  }

  if (!user) {
    return (
      <p className="text-zinc-400">
        <Link href="/roulette/login" className="text-amber-400 underline">
          Sign in
        </Link>{" "}
        to see your bets and wallet ledger.
      </p>
    );
  }

  function fmtBet(b: BetRow) {
    return formatBetLabel({
      type: b.type,
      selection: b.selection,
      selectionStr: b.selectionStr,
    });
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-amber-200/90">Your bets</h2>
        {betsListenErr ? (
          <p className="mt-2 text-sm text-amber-600/90">{betsListenErr}</p>
        ) : null}
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Bet</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {bets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No bets yet.
                  </td>
                </tr>
              ) : (
                bets.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-900">
                    <td className="px-4 py-3 text-zinc-300">{fmtBet(r)}</td>
                    <td className="px-4 py-3 font-mono text-amber-200/90">₹{r.amount}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{r.roundId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {r.createdAt ? r.createdAt.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-amber-200/90">Wallet ledger</h2>
        <p className="mt-1 text-xs text-zinc-500">Deposits, approved withdrawals, and balance snapshots.</p>
        {ledgerListenErr ? (
          <p className="mt-2 text-sm text-amber-600/90">{ledgerListenErr}</p>
        ) : null}
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Balance after</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No ledger entries yet.
                  </td>
                </tr>
              ) : (
                ledger.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-900">
                    <td className="px-4 py-3 capitalize text-zinc-300">{r.type}</td>
                    <td className="px-4 py-3 font-mono text-amber-200/90">₹{r.amount}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {r.balanceAfter != null ? `₹${r.balanceAfter}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {r.createdAt ? r.createdAt.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
