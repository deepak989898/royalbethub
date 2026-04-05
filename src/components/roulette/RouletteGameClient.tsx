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
import type { ChipValue } from "@/lib/roulette/types";
import { roulettePost } from "@/lib/roulette/client-api";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import { ChipSelector } from "./ChipSelector";
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

export function RouletteGameClient() {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [chip, setChip] = useState<ChipValue>(50);
  const [staged, setStaged] = useState<Map<string, { type: BetType; selection?: number; amount: number }>>(
    () => new Map()
  );
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adminMissing, setAdminMissing] = useState(false);
  const [spinRev, setSpinRev] = useState(0);
  const prevPhase = useRef<Phase | null>(null);
  const resolvedForRound = useRef<string | null>(null);
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
    if (!game || game.phase !== "betting" || !game.endsAt) return;
    if (Date.now() >= game.endsAt) return;
    const id = window.setInterval(() => {
      if (Date.now() < game.endsAt!) return;
      if (resolvedForRound.current === game.roundId) return;
      resolvedForRound.current = game.roundId;
      void fetch("/api/roulette/resolve-round", { method: "POST" }).catch(() => {
        resolvedForRound.current = null;
      });
    }, 500);
    return () => clearInterval(id);
  }, [game?.roundId, game?.phase, game?.endsAt]);

  useEffect(() => {
    if (!game || game.phase !== "result" || !game.resultShownUntil) return;
    const ms = Math.max(0, game.resultShownUntil - Date.now()) + 400;
    const t = window.setTimeout(() => {
      void fetch("/api/roulette/open-next", { method: "POST" });
    }, ms);
    return () => clearTimeout(t);
  }, [game?.phase, game?.resultShownUntil, game?.roundId]);

  useEffect(() => {
    if (game?.phase === "betting") {
      resolvedForRound.current = null;
    }
  }, [game?.roundId, game?.phase]);

  useEffect(() => {
    setStaged(new Map());
  }, [game?.roundId]);

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
      const k = betKey(type, selection);
      setStaged((prev) => {
        const next = new Map(prev);
        const cur = next.get(k);
        const add = chip;
        next.set(k, {
          type,
          selection: type === "straight" ? selection : undefined,
          amount: (cur?.amount || 0) + add,
        });
        return next;
      });
      playChip();
    },
    [user, blocked, game, chip, playChip]
  );

  async function placeStaged() {
    if (!user || !token || !game || staged.size === 0) return;
    setErr(null);
    setPlacing(true);
    try {
      const bets = [...staged.values()].map((b) => ({
        type: b.type,
        selection: b.type === "straight" ? b.selection : undefined,
        amount: b.amount,
      }));
      await roulettePost<{ ok: boolean }>("/api/roulette/place-bet", token, {
        roundId: game.roundId,
        bets,
      });
      setStaged(new Map());
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
          <ChipSelector
            value={chip}
            onChange={setChip}
            disabled={game?.phase !== "betting" || (game.endsAt != null && Date.now() >= game.endsAt)}
          />
          <p className="text-xs text-zinc-500">
            Tap the table to stack chips (₹{chip} per tap). Press place to confirm.
            {totalStaged > 0 ? (
              <span className="ml-2 text-amber-400">Staged: ₹{totalStaged}</span>
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
