"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { BetType } from "@/lib/roulette/types";
import { isValidBetStake, MAX_BET_AMOUNT, MIN_BET_AMOUNT } from "@/lib/roulette/types";
import { roulettePost } from "@/lib/roulette/client-api";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import { BetAmountControl } from "./BetAmountControl";
import { BettingTable } from "./BettingTable";
import { RouletteWheel } from "./RouletteWheel";
import { useRouletteSounds } from "./useRouletteSounds";

type Phase = "betting" | "result";

type GameState = {
  phase: Phase;
  roundId: string;
  sequence: number;
  endsAt: number | null;
  winningNumber: number | null;
  resultShownUntil: number | null;
  spinDurationSec: number;
  recentResults: number[];
};

type LiveBet = {
  type: BetType;
  selection: number | null;
  amount: number;
  userId: string;
};

function betKey(type: BetType, selection?: number): string {
  if (type === "straight") return `s-${selection}`;
  return type;
}

type StakeAction = { key: string; type: BetType; selection?: number; amount: number };

type PlacedBet = { type: BetType; selection?: number; amount: number };

export function RouletteGameClient() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [betUnit, setBetUnit] = useState(50);
  const [staged, setStaged] = useState<Map<string, { type: BetType; selection?: number; amount: number }>>(
    () => new Map()
  );
  const [undoStack, setUndoStack] = useState<StakeAction[]>([]);
  const lastPlacedRef = useRef<PlacedBet[]>([]);
  const [canRebet, setCanRebet] = useState(false);
  const [activityToasts, setActivityToasts] = useState<{ id: string; text: string }[]>([]);
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adminMissing, setAdminMissing] = useState(false);
  const [spinRev, setSpinRev] = useState(0);
  const prevPhase = useRef<Phase | null>(null);
  /** Prevents overlapping POSTs; never “stick” on failed/409 responses. */
  const resolveInFlightRef = useRef(false);
  const openNextInFlightRef = useRef(false);
  const gameRef = useRef<GameState | null>(null);
  gameRef.current = game;
  const { playSpin, playWin, playChip } = useRouletteSounds();

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setToken(null);
        setBalance(null);
        return;
      }
      setUser({ uid: u.uid, email: u.email });
      const t = await u.getIdToken();
      setToken(t);
    });
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    void (async () => {
      try {
        await roulettePost("/api/roulette/bootstrap-user", token, {});
      } catch {
        /* ignore */
      }
    })();
  }, [user, token]);

  useEffect(() => {
    void fetch("/api/roulette/ensure-state", { method: "POST" })
      .then((r) => {
        if (r.status === 503) setAdminMissing(true);
      })
      .catch(() => setAdminMissing(true));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const db = getDb();
    const ref = doc(db, "roulette_state", ROULETTE_STATE_DOC);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setGame({
        phase: (d.phase as Phase) || "betting",
        roundId: String(d.roundId || ""),
        sequence: Number(d.sequence) || 1,
        endsAt: d.endsAt?.toMillis?.() ?? null,
        winningNumber: d.winningNumber != null ? Number(d.winningNumber) : null,
        resultShownUntil: d.resultShownUntil?.toMillis?.() ?? null,
        spinDurationSec: Number(d.spinDurationSec) || 15,
        recentResults: Array.isArray(d.recentResults) ? d.recentResults.map(Number) : [],
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !game?.roundId) {
      setLiveBets([]);
      return;
    }
    const db = getDb();
    const q = query(collection(db, "roulette_bets"), where("roundId", "==", game.roundId));
    const unsub = onSnapshot(q, (snap) => {
      const rows: LiveBet[] = [];
      snap.forEach((docSnap) => {
        const x = docSnap.data();
        rows.push({
          type: x.type as BetType,
          selection: x.selection != null ? Number(x.selection) : null,
          amount: Number(x.amount) || 0,
          userId: String(x.userId),
        });
      });
      setLiveBets(rows);
    });
    return () => unsub();
  }, [game?.roundId]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !user) {
      setBalance(null);
      return;
    }
    const db = getDb();
    const ref = doc(db, "roulette_users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setBalance(null);
        return;
      }
      const d = snap.data();
      setBalance(Number(d.balance) || 0);
      setBlocked(Boolean(d.blocked));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!game) return;
    if (game.phase === "result" && prevPhase.current === "betting") {
      setSpinRev((r) => r + 1);
      playSpin();
    }
    prevPhase.current = game.phase;
  }, [game, playSpin]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    async function tryResolveRound() {
      const g = gameRef.current;
      if (!g || g.phase !== "betting" || !g.endsAt) return;
      if (Date.now() < g.endsAt) return;
      if (resolveInFlightRef.current) return;
      resolveInFlightRef.current = true;
      try {
        const res = await fetch("/api/roulette/resolve-round", { method: "POST" });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 409 && /still in progress/i.test(String(body.error || ""))) {
          return;
        }
      } catch {
        /* network error — retry on next tick */
      } finally {
        resolveInFlightRef.current = false;
      }
    }

    const g = gameRef.current;
    if (!g || g.phase !== "betting" || !g.endsAt) return;

    void tryResolveRound();
    const id = window.setInterval(() => void tryResolveRound(), 400);
    return () => clearInterval(id);
  }, [game?.roundId, game?.phase, game?.endsAt]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    async function tryOpenNext() {
      const g = gameRef.current;
      if (!g || g.phase !== "result" || !g.resultShownUntil) return;
      if (Date.now() < g.resultShownUntil) return;
      if (openNextInFlightRef.current) return;
      openNextInFlightRef.current = true;
      try {
        const res = await fetch("/api/roulette/open-next", { method: "POST" });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 409 && /still showing/i.test(String(body.error || ""))) {
          return;
        }
      } catch {
        /* retry */
      } finally {
        openNextInFlightRef.current = false;
      }
    }

    const g = gameRef.current;
    if (!g || g.phase !== "result" || !g.resultShownUntil) return;

    const ms = Math.max(0, g.resultShownUntil - Date.now()) + 300;
    const t0 = window.setTimeout(() => void tryOpenNext(), ms);
    const id = window.setInterval(() => void tryOpenNext(), 600);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
    };
  }, [game?.phase, game?.resultShownUntil, game?.roundId]);

  useEffect(() => {
    setStaged(new Map());
    setUndoStack([]);
  }, [game?.roundId]);

  function pushActivityToast(text: string) {
    const id = crypto.randomUUID();
    setActivityToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => {
      setActivityToasts((t) => t.filter((x) => x.id !== id));
    }, 4500);
  }

  function undoLastStake() {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1]!;
      const rest = prev.slice(0, -1);
      setStaged((s) => {
        const next = new Map(s);
        const cur = next.get(last.key);
        if (!cur) return next;
        const na = cur.amount - last.amount;
        if (na <= 0) next.delete(last.key);
        else
          next.set(last.key, {
            type: last.type,
            selection: last.selection,
            amount: na,
          });
        return next;
      });
      return rest;
    });
  }

  function clearStaged() {
    setUndoStack([]);
    setStaged(new Map());
  }

  function rebet() {
    if (!game || game.phase !== "betting" || !game.endsAt || Date.now() >= game.endsAt) return;
    const list = lastPlacedRef.current;
    if (list.length === 0) {
      setErr("No previous bet to repeat.");
      return;
    }
    const total = list.reduce((s, b) => s + b.amount, 0);
    if (balance != null && balance < total) {
      setErr(`Need ₹${total.toLocaleString("en-IN")} balance for this rebet.`);
      return;
    }
    setErr(null);
    const m = new Map<string, { type: BetType; selection?: number; amount: number }>();
    for (const b of list) {
      const k = betKey(b.type, b.selection);
      m.set(k, {
        type: b.type,
        selection: b.type === "straight" ? b.selection : undefined,
        amount: b.amount,
      });
    }
    setStaged(m);
    setUndoStack([]);
  }

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!game?.endsAt || game.phase !== "betting") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [game?.endsAt, game?.phase, game?.roundId]);

  const secondsLeft = useMemo(() => {
    if (!game?.endsAt || game.phase !== "betting") return 0;
    void tick;
    return Math.max(0, Math.ceil((game.endsAt - Date.now()) / 1000));
  }, [game?.endsAt, game?.phase, tick]);

  const stagedKeys = useMemo(() => new Set(staged.keys()), [staged]);

  const totalStaged = useMemo(() => {
    let s = 0;
    staged.forEach((v) => {
      s += v.amount;
    });
    return s;
  }, [staged]);

  const onCellClick = useCallback(
    (type: BetType, selection?: number) => {
      if (!user || blocked || !game || game.phase !== "betting" || !game.endsAt || Date.now() >= game.endsAt) {
        return;
      }
      if (!isValidBetStake(betUnit)) return;
      const k = betKey(type, selection);
      const add = betUnit;
      setUndoStack((prev) => [...prev, { key: k, type, selection: type === "straight" ? selection : undefined, amount: add }]);
      setStaged((prev) => {
        const next = new Map(prev);
        const cur = next.get(k);
        next.set(k, {
          type,
          selection: type === "straight" ? selection : undefined,
          amount: (cur?.amount || 0) + add,
        });
        return next;
      });
      playChip();
    },
    [user, blocked, game, betUnit, playChip]
  );

  async function placeStaged() {
    if (!user || !token || !game || staged.size === 0) return;
    setErr(null);
    const bets = [...staged.values()].map((b) => ({
      type: b.type,
      selection: b.type === "straight" ? b.selection : undefined,
      amount: b.amount,
    }));
    for (const b of bets) {
      if (!isValidBetStake(b.amount)) {
        setErr(
          `Each line must be ₹${MIN_BET_AMOUNT.toLocaleString("en-IN")}–₹${MAX_BET_AMOUNT.toLocaleString("en-IN")} in multiples of ₹10.`
        );
        return;
      }
    }
    setPlacing(true);
    try {
      await roulettePost<{ ok: boolean }>("/api/roulette/place-bet", token, {
        roundId: game.roundId,
        bets,
      });
      lastPlacedRef.current = bets;
      setCanRebet(true);
      const total = bets.reduce((s, b) => s + b.amount, 0);
      pushActivityToast(`Placed ₹${total.toLocaleString("en-IN")} · ${bets.length} line(s)`);
      setStaged(new Map());
      setUndoStack([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not place bets");
    } finally {
      setPlacing(false);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <p className="rounded-xl border border-amber-900/40 bg-black/40 p-6 text-center text-zinc-400">
        Configure Firebase in <code className="text-amber-400">.env.local</code> to play.
      </p>
    );
  }

  if (adminMissing) {
    return (
      <div className="space-y-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-6 text-sm text-zinc-300">
        <p className="font-semibold text-amber-200">Server keys missing</p>
        <p>
          Add <code className="text-amber-400">FIREBASE_SERVICE_ACCOUNT_JSON</code> to{" "}
          <code className="text-amber-400">.env.local</code> (full service account JSON as one line)
          so bets and spins run securely on the server. Then restart{" "}
          <code className="text-amber-400">next dev</code>.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-center text-zinc-400">
        <a href="/roulette/login" className="text-amber-400 underline hover:text-amber-300">
          Sign in
        </a>{" "}
        to place bets and use your wallet.
      </p>
    );
  }

  if (blocked) {
    return <p className="text-center text-red-400">Your account is blocked from play.</p>;
  }

  return (
    <div className="space-y-8">
      {activityToasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex max-w-[min(90vw,24rem)] -translate-x-1/2 flex-col gap-2">
          {activityToasts.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-amber-600/40 bg-zinc-950/95 px-4 py-3 text-center text-sm text-amber-100 shadow-lg backdrop-blur-sm"
            >
              {t.text}
            </div>
          ))}
        </div>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-2 text-sm text-red-300">
          {err}
        </p>
      ) : null}

      <div className="flex flex-col items-center justify-between gap-6 lg:flex-row lg:items-start">
        <div className="w-full flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-900/30 bg-black/50 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Balance</p>
              <p className="text-2xl font-bold text-amber-400">
                {balance != null ? `₹${balance.toLocaleString("en-IN")}` : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                {game?.phase === "betting" ? "Time left" : "Status"}
              </p>
              <p className="text-2xl font-mono font-bold text-zinc-100">
                {game?.phase === "betting" ? `${secondsLeft}s` : "Spinning…"}
              </p>
            </div>
          </div>

          <RouletteWheel
            winningNumber={game?.winningNumber ?? null}
            spinTrigger={spinRev}
            phase={game?.phase ?? "betting"}
          />

          {game && game.recentResults.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
              <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Recent numbers</p>
              <div className="flex flex-wrap gap-1">
                {game.recentResults.slice(0, 12).map((n, i) => (
                  <span
                    key={`${n}-${i}`}
                    className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs font-bold text-zinc-200"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="w-full flex-1 space-y-4 lg:max-w-xl">
          <BetAmountControl
            value={betUnit}
            onChange={setBetUnit}
            maxHint={balance}
            disabled={game?.phase !== "betting" || (game.endsAt != null && Date.now() >= game.endsAt)}
          />
          <p className="text-xs text-zinc-500">
            Tap the table to add ₹{betUnit.toLocaleString("en-IN")} per cell. Confirm with Place bets.
            {totalStaged > 0 ? (
              <span className="ml-2 text-amber-400">
                Staged: ₹{totalStaged.toLocaleString("en-IN")}
              </span>
            ) : null}
          </p>
          <BettingTable
            onCellClick={onCellClick}
            disabled={
              game?.phase !== "betting" || !game.endsAt || Date.now() >= game.endsAt || blocked
            }
            liveBets={liveBets}
            stagedKeys={stagedKeys}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                undoStack.length === 0 ||
                game?.phase !== "betting" ||
                !game?.endsAt ||
                Date.now() >= game.endsAt
              }
              onClick={() => undoLastStake()}
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              disabled={
                staged.size === 0 ||
                game?.phase !== "betting" ||
                !game?.endsAt ||
                Date.now() >= game.endsAt
              }
              onClick={() => clearStaged()}
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={
                !canRebet ||
                game?.phase !== "betting" ||
                !game?.endsAt ||
                Date.now() >= game.endsAt
              }
              onClick={() => rebet()}
              className="rounded-xl border border-amber-700/50 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-950/40 disabled:opacity-40"
            >
              Rebet
            </button>
          </div>
          <button
            type="button"
            disabled={
              placing ||
              staged.size === 0 ||
              game?.phase !== "betting" ||
              !game?.endsAt ||
              Date.now() >= game.endsAt
            }
            onClick={() => void placeStaged()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 font-bold text-black shadow-lg shadow-amber-900/30 disabled:opacity-40"
          >
            {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Place bets
          </button>
        </div>
      </div>
    </div>
  );
}
