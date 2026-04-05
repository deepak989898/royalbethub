"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Loader2, RefreshCw } from "lucide-react";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { roulettePatch, roulettePost } from "@/lib/roulette/client-api";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import type { BetType } from "@/lib/roulette/types";
import { formatBetLabel } from "@/lib/roulette/types";

type UserRow = { id: string; balance: number; blocked: boolean; email: string };

type WRow = {
  id: string;
  userId: string;
  email: string;
  amount: number;
  status: string;
};

type BetRow = {
  id: string;
  userId: string;
  type: BetType;
  selection: number | null;
  selectionStr?: string | null;
  amount: number;
};

type StateRow = {
  phase: string;
  roundId: string;
  sequence: number;
  endsAt: number | null;
  winningNumber: number | null;
  rtpMode: string;
  manualNextNumber: number | null;
  spinDurationSec: number;
  totalHouseProfit: number;
  recentResults: number[];
};

export function RouletteAdminPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<StateRow | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [spinDurationSec, setSpinDurationSec] = useState("15");
  const [rtpMode, setRtpMode] = useState<"auto" | "manual">("auto");
  const [manualNext, setManualNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (u) => {
      setToken(u ? await u.getIdToken() : null);
    });
  }, []);

  useEffect(() => {
    const db = getDb();
    const ref = doc(db, "roulette_state", ROULETTE_STATE_DOC);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setState(null);
        return;
      }
      const d = snap.data();
      setState({
        phase: String(d.phase),
        roundId: String(d.roundId),
        sequence: Number(d.sequence) || 1,
        endsAt: d.endsAt?.toMillis?.() ?? null,
        winningNumber: d.winningNumber != null ? Number(d.winningNumber) : null,
        rtpMode: String(d.rtpMode || "auto"),
        manualNextNumber: d.manualNextNumber != null ? Number(d.manualNextNumber) : null,
        spinDurationSec: Number(d.spinDurationSec) || 15,
        totalHouseProfit: Number(d.totalHouseProfit) || 0,
        recentResults: Array.isArray(d.recentResults) ? d.recentResults.map(Number) : [],
      });
      setSpinDurationSec(String(Number(d.spinDurationSec) || 15));
      setRtpMode(d.rtpMode === "manual" ? "manual" : "auto");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!state?.roundId) {
      setBets([]);
      return;
    }
    const db = getDb();
    const q = query(collection(db, "roulette_bets"), where("roundId", "==", state.roundId));
    const unsub = onSnapshot(q, (snap) => {
      const rows: BetRow[] = [];
      snap.forEach((docSnap) => {
        const x = docSnap.data();
        rows.push({
          id: docSnap.id,
          userId: String(x.userId),
          type: x.type as BetType,
          selection: x.selection != null ? Number(x.selection) : null,
          selectionStr:
            x.selectionStr != null && String(x.selectionStr).length > 0
              ? String(x.selectionStr)
              : null,
          amount: Number(x.amount) || 0,
        });
      });
      setBets(rows);
    });
    return () => unsub();
  }, [state?.roundId]);

  useEffect(() => {
    const db = getDb();
    const q = query(
      collection(db, "roulette_withdrawals"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: WRow[] = [];
        snap.forEach((docSnap) => {
          const x = docSnap.data();
          rows.push({
            id: docSnap.id,
            userId: String(x.userId),
            email: String(x.email || ""),
            amount: Number(x.amount) || 0,
            status: String(x.status),
          });
        });
        setWithdrawals(rows);
      },
      () => setWithdrawals([])
    );
    return () => unsub();
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(getDb(), "roulette_users"));
      const rows: UserRow[] = [];
      snap.forEach((d) => {
        const x = d.data();
        rows.push({
          id: d.id,
          balance: Number(x.balance) || 0,
          blocked: Boolean(x.blocked),
          email: String(x.email || ""),
        });
      });
      rows.sort((a, b) => a.id.localeCompare(b.id));
      setUsers(rows);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function saveSettings() {
    if (!token) return;
    setMsg(null);
    setSaving(true);
    try {
      let manualNextNumber: number | null = null;
      if (manualNext.trim() !== "") {
        const m = parseInt(manualNext, 10);
        if (Number.isNaN(m) || m < 0 || m > 36) {
          setMsg("Manual number must be 0–36 or empty");
          return;
        }
        manualNextNumber = m;
      }
      await roulettePatch("/api/roulette/admin/settings", token, {
        spinDurationSec: Number(spinDurationSec),
        rtpMode,
        manualNextNumber,
      });
      setMsg("Settings saved (timer changes apply on next round).");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function actWithdraw(id: string, action: "approve" | "reject") {
    if (!token) return;
    setMsg(null);
    try {
      await roulettePost("/api/roulette/admin/withdraw", token, { id, action });
      setMsg(`Withdrawal ${action}d.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleBlock(uid: string, blocked: boolean) {
    if (!token) return;
    setMsg(null);
    try {
      await roulettePost("/api/roulette/admin/user-block", token, { uid, blocked });
      await loadUsers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  const totalRoundStake = bets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-10">
      {msg ? <p className="text-sm text-amber-300">{msg}</p> : null}

      <section className="rounded-xl border border-amber-900/30 bg-black/30 p-5">
        <h2 className="text-lg font-semibold text-white">Live round &amp; RTP</h2>
        {state ? (
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p className="text-zinc-400">
              Phase: <span className="text-white">{state.phase}</span>
            </p>
            <p className="text-zinc-400">
              Round: <span className="font-mono text-amber-200/90">{state.roundId.slice(0, 12)}…</span>
            </p>
            <p className="text-zinc-400">
              Sequence: <span className="text-white">{state.sequence}</span>
            </p>
            <p className="text-zinc-400">
              Last result:{" "}
              <span className="text-white">
                {state.winningNumber != null ? state.winningNumber : "—"}
              </span>
            </p>
            <p className="text-zinc-400 sm:col-span-2">
              Model profit (stakes − payouts, cumulative):{" "}
              <span className="font-mono text-emerald-400">₹{state.totalHouseProfit}</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-zinc-500">No roulette_state yet — open /roulette once with server keys.</p>
        )}

        <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
          <label className="block text-xs text-zinc-500">
            Spin timer (seconds, next betting window)
            <input
              type="number"
              min={5}
              max={120}
              value={spinDurationSec}
              onChange={(e) => setSpinDurationSec(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            RTP mode
            <select
              value={rtpMode}
              onChange={(e) => setRtpMode(e.target.value as "auto" | "manual")}
              className="mt-1 block w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="auto">Auto (minimum payout number)</option>
              <option value="manual">Manual (next spin only)</option>
            </select>
          </label>
          <label className="block text-xs text-zinc-500">
            Manual winning number (0–36, next resolve only — leave empty for auto)
            <input
              type="number"
              min={0}
              max={36}
              value={manualNext}
              onChange={(e) => setManualNext(e.target.value)}
              placeholder="e.g. 17"
              className="mt-1 w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
          <button
            type="button"
            disabled={saving || !token}
            onClick={() => void saveSettings()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Current round bets</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Total staked this round: <span className="text-amber-300">₹{totalRoundStake}</span>
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10 bg-black/30 text-zinc-500">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Bet</th>
                <th className="px-4 py-2">₹</th>
              </tr>
            </thead>
            <tbody>
              {bets.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-zinc-500">
                    No bets on this round.
                  </td>
                </tr>
              ) : (
                bets.map((b) => (
                  <tr key={b.id} className="border-b border-white/5">
                    <td className="px-4 py-2 font-mono text-xs text-zinc-400">{b.userId.slice(0, 10)}…</td>
                    <td className="px-4 py-2 text-zinc-200">
                      {formatBetLabel({
                        type: b.type,
                        selection: b.selection,
                        selectionStr: b.selectionStr,
                      })}
                    </td>
                    <td className="px-4 py-2 text-amber-200/90">{b.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Roulette players</h2>
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loadingUsers}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
          >
            <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-white/10 bg-black/30 text-zinc-500">
              <tr>
                <th className="px-4 py-2">UID</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2 text-right">Block</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="px-4 py-2 font-mono text-xs text-zinc-500">{u.id.slice(0, 12)}…</td>
                  <td className="max-w-[140px] truncate px-4 py-2 text-zinc-300">{u.email || "—"}</td>
                  <td className="px-4 py-2 text-amber-200/90">{u.balance}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void toggleBlock(u.id, !u.blocked)}
                      className={`rounded px-2 py-1 text-xs ${
                        u.blocked
                          ? "bg-emerald-900/40 text-emerald-300"
                          : "bg-red-900/30 text-red-300"
                      }`}
                    >
                      {u.blocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Withdrawal requests</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-white/10 bg-black/30 text-zinc-500">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-zinc-500">
                    No pending requests.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-white/5">
                    <td className="px-4 py-2 text-xs text-zinc-400">{w.email || w.userId.slice(0, 10)}</td>
                    <td className="px-4 py-2 text-amber-200/90">₹{w.amount}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void actWithdraw(w.id, "approve")}
                        className="mr-2 rounded bg-emerald-700/50 px-2 py-1 text-xs text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void actWithdraw(w.id, "reject")}
                        className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
