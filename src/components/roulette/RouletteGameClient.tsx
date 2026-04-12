"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
import { SPIN_ANIMATION_MS } from "@/lib/roulette/table-layout";
import type { BetType } from "@/lib/roulette/types";
import { isValidBetStake, MAX_BET_AMOUNT, MIN_BET_AMOUNT } from "@/lib/roulette/types";
import { roulettePost } from "@/lib/roulette/client-api";
import { payoutForBet } from "@/lib/roulette/payout";
import { colorOf } from "@/lib/roulette/constants";
import { mergePlacedLines, type PlacedLine } from "@/lib/roulette/merge-placed-bets";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import { BetAmountControl } from "./BetAmountControl";
import { BettingTable, type TableBetPayload } from "./BettingTable";
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

/** Chip styles aligned with `RouletteWheel` pocket fills (#15803d / #b91c1c / #18181b). */
function recentNumberChipClass(n: number): string {
  const base =
    "inline-flex h-5 w-7 shrink-0 items-center justify-center rounded border text-[9px] font-bold tabular-nums lg:h-6 lg:w-8 lg:text-[10px]";
  switch (colorOf(n)) {
    case "green":
      return `${base} border-green-900/80 bg-[#15803d] text-white`;
    case "red":
      return `${base} border-red-900/90 bg-[#b91c1c] text-white`;
    default:
      return `${base} border-zinc-700 bg-[#18181b] text-zinc-100`;
  }
}

type LiveBet = {
  type: BetType;
  selection: number | null;
  selectionStr?: string | null;
  amount: number;
  userId: string;
};

/** Auto-hide transient errors (e.g. “Betting window ended”, “Insufficient balance”). */
const ROULETTE_ERROR_DISMISS_MS = 6500;

export function RouletteGameClient() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [betUnit, setBetUnit] = useState(50);
  const [spinComplete, setSpinComplete] = useState(false);
  /** Cumulative lines placed in the current round (for same-round Rebet). */
  const lastPlacedRef = useRef<PlacedLine[]>([]);
  /** Snapshot at last round change — previous round’s layout (for Rebet after a new round opens). */
  const rebetPatternRef = useRef<PlacedLine[]>([]);
  /** Latest confirmed stake sum from Firestore (updated every render for place/double timing). */
  const userStakeSnapRef = useRef(0);
  const [canRebet, setCanRebet] = useState(false);
  /** After Place bets, expected min stake until `liveBets` snapshot catches up (keeps Double / “Your bet” responsive). */
  const [pendingExpectedMyStake, setPendingExpectedMyStake] = useState<number | null>(null);
  const [activityToasts, setActivityToasts] = useState<{ id: string; text: string }[]>([]);
  const [placing, setPlacing] = useState(false);
  const [doubling, setDoubling] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adminMissing, setAdminMissing] = useState(false);
  const [spinRev, setSpinRev] = useState(0);
  const prevPhase = useRef<Phase | null>(null);
  /** Prevents overlapping POSTs; never “stick” on failed/409 responses. */
  const resolveInFlightRef = useRef(false);
  const openNextInFlightRef = useRef(false);
  const gameRef = useRef<GameState | null>(null);
  gameRef.current = game;
  /** Wallet after stakes for this round; payouts are hidden until the ball animation finishes. */
  const balanceAtLastBettingRef = useRef<number | null>(null);
  const winSoundRoundRef = useRef<string | null>(null);
  const { playSpin, playWin, playChip } = useRouletteSounds();

  useEffect(() => {
    if (err == null) return;
    const t = window.setTimeout(() => setErr(null), ROULETTE_ERROR_DISMISS_MS);
    return () => clearTimeout(t);
  }, [err]);

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
        spinDurationSec: Number(d.spinDurationSec) || 30,
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
          selectionStr:
            x.selectionStr != null && String(x.selectionStr).length > 0
              ? String(x.selectionStr)
              : null,
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
    if (game?.phase === "betting" && balance != null) {
      balanceAtLastBettingRef.current = balance;
    }
  }, [game?.phase, balance]);

  useEffect(() => {
    if (!game) return;
    if (game.phase === "result" && prevPhase.current === "betting") {
      setSpinRev((r) => r + 1);
      playSpin();
    }
    prevPhase.current = game.phase;
  }, [game, playSpin]);

  useEffect(() => {
    if (game?.phase !== "result") {
      setSpinComplete(false);
      return;
    }
    if (game.winningNumber == null) {
      setSpinComplete(false);
      return;
    }
    if (spinRev === 0) {
      setSpinComplete(true);
      return;
    }
    setSpinComplete(false);
    const t = window.setTimeout(() => setSpinComplete(true), SPIN_ANIMATION_MS);
    return () => clearTimeout(t);
  }, [game?.phase, game?.winningNumber, spinRev]);

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
    setPendingExpectedMyStake(null);
    if (lastPlacedRef.current.length > 0) {
      rebetPatternRef.current = lastPlacedRef.current.map((b) => ({ ...b }));
    }
    lastPlacedRef.current = [];
    setCanRebet(rebetPatternRef.current.length > 0);
  }, [game?.roundId]);

  function pushActivityToast(text: string) {
    const id = crypto.randomUUID();
    setActivityToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => {
      setActivityToasts((t) => t.filter((x) => x.id !== id));
    }, 4500);
  }

  function payloadToLine(p: TableBetPayload, amount: number): PlacedLine {
    return {
      type: p.type,
      selection:
        p.type === "straight" || p.type === "column" || p.type === "dozen" ? p.selection : undefined,
      selectionStr:
        p.type === "split" || p.type === "corner" || p.type === "street" ? p.selectionStr : undefined,
      amount,
    };
  }

  async function rebet() {
    if (!user || !token || !game || game.phase !== "betting" || game.endsAt == null || Date.now() >= game.endsAt) {
      return;
    }
    const list =
      lastPlacedRef.current.length > 0
        ? [...lastPlacedRef.current]
        : [...rebetPatternRef.current];
    if (list.length === 0) {
      setErr("No previous bet to repeat.");
      return;
    }
    const total = list.reduce((s, b) => s + b.amount, 0);
    if (balance != null && balance < total) {
      setErr(`Need ₹${total.toLocaleString("en-IN")} balance for this rebet.`);
      return;
    }
    const bets = list.map((b) => ({
      type: b.type,
      selection:
        b.type === "straight" || b.type === "column" || b.type === "dozen" ? b.selection : undefined,
      selectionStr:
        b.type === "split" || b.type === "corner" || b.type === "street" ? b.selectionStr : undefined,
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
    setErr(null);
    setPlacing(true);
    try {
      await roulettePost<{ ok: boolean }>("/api/roulette/place-bet", token, {
        roundId: game.roundId,
        bets,
      });
      lastPlacedRef.current = mergePlacedLines(lastPlacedRef.current, list);
      setCanRebet(true);
      setPendingExpectedMyStake(userStakeSnapRef.current + total);
      pushActivityToast(`Rebet ₹${total.toLocaleString("en-IN")} · ${bets.length} line(s)`);
      playChip();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not rebet");
    } finally {
      setPlacing(false);
    }
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

  const displayedRecents = useMemo(() => {
    if (!game || game.recentResults.length === 0) return [];
    if (game.phase === "betting") return game.recentResults;
    if (!spinComplete) return game.recentResults.slice(1);
    return game.recentResults;
  }, [game?.recentResults, game?.phase, spinComplete]);

  const displayBalance = useMemo(() => {
    if (
      game?.phase === "result" &&
      !spinComplete &&
      balanceAtLastBettingRef.current != null
    ) {
      return balanceAtLastBettingRef.current;
    }
    return balance;
  }, [game?.phase, spinComplete, balance]);

  const userRoundWinTotal = useMemo(() => {
    if (!user || !game || game.phase !== "result" || !spinComplete || game.winningNumber == null) {
      return 0;
    }
    const w = game.winningNumber;
    let sum = 0;
    for (const b of liveBets) {
      if (b.userId !== user.uid) continue;
      sum += payoutForBet(w, {
        type: b.type,
        selection: b.selection ?? undefined,
        selectionStr: b.selectionStr ?? undefined,
        amount: b.amount,
      });
    }
    return sum;
  }, [user, game, spinComplete, liveBets]);

  useEffect(() => {
    if (game?.phase === "betting") {
      winSoundRoundRef.current = null;
    }
  }, [game?.phase]);

  useEffect(() => {
    if (!spinComplete || !game || game.phase !== "result" || userRoundWinTotal <= 0) return;
    if (winSoundRoundRef.current === game.roundId) return;
    winSoundRoundRef.current = game.roundId;
    playWin();
  }, [spinComplete, game?.roundId, game?.phase, userRoundWinTotal, playWin]);

  /** This user’s bets in the current round (table + totals are per-viewer; payouts still use full `liveBets`). */
  const myRoundBets = useMemo(() => {
    if (!user) return [];
    return liveBets.filter((b) => b.userId === user.uid);
  }, [user, liveBets]);

  /** Confirmed stakes for this user in the current round (Firestore), not chips on the felt. */
  const userPlacedStakeTotal = useMemo(
    () => myRoundBets.reduce((s, b) => s + b.amount, 0),
    [myRoundBets]
  );

  useLayoutEffect(() => {
    userStakeSnapRef.current = userPlacedStakeTotal;
  }, [userPlacedStakeTotal]);

  useEffect(() => {
    if (pendingExpectedMyStake == null) return;
    if (userPlacedStakeTotal >= pendingExpectedMyStake) {
      setPendingExpectedMyStake(null);
    }
  }, [userPlacedStakeTotal, pendingExpectedMyStake]);

  const displayMyPlacedStake = useMemo(() => {
    if (pendingExpectedMyStake == null) return userPlacedStakeTotal;
    return Math.max(userPlacedStakeTotal, pendingExpectedMyStake);
  }, [userPlacedStakeTotal, pendingExpectedMyStake]);

  const headerBalance = useMemo(() => displayBalance, [displayBalance]);

  const stakeMaxHint = useMemo(() => {
    if (balance == null) return null;
    return balance;
  }, [balance]);

  const placeLockRef = useRef(false);

  const onBet = useCallback(
    (p: TableBetPayload) => {
      if (
        !user ||
        !token ||
        blocked ||
        !game ||
        game.phase !== "betting" ||
        game.endsAt == null ||
        Date.now() >= game.endsAt ||
        placeLockRef.current
      ) {
        return;
      }
      if (!isValidBetStake(betUnit)) return;
      const line = payloadToLine(p, betUnit);
      const bets = [
        {
          type: line.type,
          selection:
            line.type === "straight" || line.type === "column" || line.type === "dozen"
              ? line.selection
              : undefined,
          selectionStr:
            line.type === "split" || line.type === "corner" || line.type === "street"
              ? line.selectionStr
              : undefined,
          amount: line.amount,
        },
      ];
      void (async () => {
        placeLockRef.current = true;
        setPlacing(true);
        setErr(null);
        try {
          await roulettePost<{ ok: boolean }>("/api/roulette/place-bet", token, {
            roundId: game.roundId,
            bets,
          });
          lastPlacedRef.current = mergePlacedLines(lastPlacedRef.current, [line]);
          setCanRebet(true);
          setPendingExpectedMyStake(userStakeSnapRef.current + betUnit);
          playChip();
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Could not place bet");
        } finally {
          setPlacing(false);
          placeLockRef.current = false;
        }
      })();
    },
    [user, token, blocked, game, betUnit, playChip]
  );

  async function doubleMyBets() {
    if (
      !user ||
      !token ||
      !game ||
      game.phase !== "betting" ||
      game.endsAt == null ||
      Date.now() >= game.endsAt
    ) {
      return;
    }
    if (userPlacedStakeTotal <= 0) {
      setErr("Place a bet before doubling.");
      return;
    }
    if (balance != null && balance < userPlacedStakeTotal) {
      setErr(`Need ₹${userPlacedStakeTotal.toLocaleString("en-IN")} balance to double your bets.`);
      return;
    }
    setErr(null);
    setDoubling(true);
    try {
      const duplicateCost = userPlacedStakeTotal;
      await roulettePost<{ ok: boolean }>("/api/roulette/double-bets", token, {
        roundId: game.roundId,
      });
      pushActivityToast(`Doubled · +₹${duplicateCost.toLocaleString("en-IN")} stake`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not double bets");
    } finally {
      setDoubling(false);
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

  const recentsSection = (
    <div className="rounded-lg border border-zinc-800 bg-black/40 px-2 py-1 lg:rounded-xl lg:px-3 lg:py-1.5">
      <div className="flex min-w-0 items-stretch gap-2">
        <p className="flex shrink-0 items-center text-[9px] font-medium uppercase leading-none tracking-wider text-zinc-500 lg:text-[10px]">
          Recent
        </p>
        <div className="flex min-h-[1.375rem] min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:none] lg:min-h-7 [&::-webkit-scrollbar]:hidden">
          {displayedRecents.slice(0, 15).map((n, i) => (
            <span key={`${n}-${i}`} className={recentNumberChipClass(n)}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-1 sm:space-y-4 lg:space-y-8">
      {activityToasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex max-w-[min(92vw,22rem)] -translate-x-1/2 flex-col gap-1.5 lg:bottom-6 lg:max-w-[min(90vw,24rem)] lg:gap-2">
          {activityToasts.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-amber-600/40 bg-zinc-950/95 px-3 py-2 text-center text-xs text-amber-100 shadow-lg backdrop-blur-sm lg:rounded-xl lg:px-4 lg:py-3 lg:text-sm"
            >
              {t.text}
            </div>
          ))}
        </div>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 lg:px-4 lg:py-2 lg:text-sm">
          {err}
        </p>
      ) : null}

      <div className="flex flex-col gap-1 sm:gap-3 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:gap-3 lg:gap-4">
          <div className="flex flex-col gap-0">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-900/30 bg-black/50 px-2 py-1 sm:rounded-xl sm:py-1.5 sm:px-3 lg:gap-4 lg:px-4 lg:py-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 lg:text-xs">Balance</p>
                <p
                  className={`truncate text-sm font-bold tabular-nums sm:text-base lg:text-2xl ${
                    game?.phase === "betting" && headerBalance != null && headerBalance === 0
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  {headerBalance != null ? `₹${headerBalance.toLocaleString("en-IN")}` : "—"}
                </p>
                {displayMyPlacedStake > 0 ? (
                  <p className="mt-0.5 truncate text-[9px] font-semibold tabular-nums text-emerald-300/95 sm:text-[10px] lg:text-xs">
                    Your bet
                    {game?.phase === "result" ? " (this round)" : ""} · ₹
                    {displayMyPlacedStake.toLocaleString("en-IN")}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 lg:text-xs">
                  <span className="sm:hidden">{game?.phase === "betting" ? "Time" : "Spin"}</span>
                  <span className="hidden sm:inline">
                    {game?.phase === "betting" ? "Time left" : "Status"}
                  </span>
                </p>
                <p className="text-sm font-mono font-bold tabular-nums text-zinc-100 sm:text-base lg:text-2xl">
                  {game?.phase === "betting" ? `${secondsLeft}s` : "…"}
                </p>
              </div>
            </div>

            <RouletteWheel
              winningNumber={game?.winningNumber ?? null}
              spinTrigger={spinRev}
              phase={game?.phase ?? "betting"}
              highlightWinner={game?.phase === "result" && spinComplete}
              idleRestNumber={
                game?.phase === "betting" && game.recentResults.length > 0
                  ? game.recentResults[0]!
                  : null
              }
            />
          </div>

          {spinComplete && game?.phase === "result" && userRoundWinTotal > 0 ? (
            <motion.div
              key={`${game.roundId}-win`}
              initial={{ opacity: 0, y: 18, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                opacity: { duration: 0.55, ease: "easeOut" },
                y: { type: "spring", stiffness: 200, damping: 20, mass: 1.05 },
                scale: { type: "spring", stiffness: 200, damping: 20, mass: 1.05 },
              }}
              className="relative overflow-hidden rounded-lg border border-amber-400/50 bg-gradient-to-br from-amber-950 via-amber-900/85 to-yellow-950/55 px-3 py-2 text-center shadow-[0_0_20px_rgba(245,158,11,0.18)] sm:rounded-xl sm:px-4 sm:py-3 lg:rounded-2xl lg:px-6 lg:py-5 lg:shadow-[0_0_36px_rgba(245,158,11,0.22)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(250,204,21,0.28),transparent_55%)]" />
              <p className="relative text-[9px] font-bold uppercase tracking-[0.22em] text-amber-200/95 sm:text-[10px] lg:text-xs lg:tracking-[0.32em]">
                Prize won
              </p>
              <p className="relative mt-0.5 text-xl font-black tabular-nums text-amber-50 sm:mt-1 sm:text-2xl lg:mt-2 lg:text-3xl">
                ₹{userRoundWinTotal.toLocaleString("en-IN")}
              </p>
            </motion.div>
          ) : null}

          {game && displayedRecents.length > 0 ? (
            <div className="hidden lg:block">{recentsSection}</div>
          ) : null}
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:gap-3 lg:max-w-xl lg:gap-4">
          <div className="order-1 lg:order-2">
            <BettingTable
              onBet={onBet}
              disabled={
                placing ||
                game?.phase !== "betting" ||
                game.endsAt == null ||
                Date.now() >= game.endsAt ||
                blocked
              }
              liveBets={myRoundBets}
            />
          </div>

          <div className="order-2 space-y-2 lg:order-1 lg:space-y-3">
            <BetAmountControl
              value={betUnit}
              onChange={setBetUnit}
              maxHint={stakeMaxHint}
              disabled={
                placing ||
                game?.phase !== "betting" ||
                (game.endsAt != null && Date.now() >= game.endsAt)
              }
            />
          </div>

          <div className="order-3 relative z-30 flex flex-wrap gap-1 sm:gap-1.5 lg:gap-2">
            <button
              type="button"
              disabled={
                placing ||
                !canRebet ||
                game?.phase !== "betting" ||
                game.endsAt == null ||
                Date.now() >= game.endsAt
              }
              onClick={() => void rebet()}
              className="rounded-md border border-amber-700/50 px-2 py-1 text-[10px] font-medium text-amber-200 hover:bg-amber-950/40 disabled:opacity-40 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs lg:rounded-xl lg:px-4 lg:py-2 lg:text-sm"
            >
              Rebet
            </button>
            <button
              type="button"
              disabled={
                doubling ||
                placing ||
                userPlacedStakeTotal <= 0 ||
                game?.phase !== "betting" ||
                game.endsAt == null ||
                Date.now() >= game.endsAt
              }
              onClick={() => void doubleMyBets()}
              className="min-h-9 min-w-[4.5rem] shrink-0 touch-manipulation rounded-md border border-emerald-700/50 px-2 py-1.5 text-[10px] font-medium text-emerald-200 hover:bg-emerald-950/35 disabled:opacity-40 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs lg:min-h-10 lg:rounded-xl lg:px-4 lg:py-2 lg:text-sm"
              title="Duplicate every bet you already have this round (same positions and amounts)"
            >
              {doubling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" aria-hidden />
                  <span className="sr-only">Doubling…</span>
                </>
              ) : (
                "Double"
              )}
            </button>
          </div>

          {game && displayedRecents.length > 0 ? (
            <div className="order-4 lg:order-5 lg:hidden">{recentsSection}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
