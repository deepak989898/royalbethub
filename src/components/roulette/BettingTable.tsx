"use client";

import { colorOf } from "@/lib/roulette/constants";
import type { BetType } from "@/lib/roulette/types";

type LiveBet = {
  type: BetType;
  selection: number | null;
  amount: number;
};

function betKey(b: Pick<LiveBet, "type" | "selection">): string {
  if (b.type === "straight") return `s-${b.selection}`;
  return b.type;
}

function aggregate(bets: LiveBet[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const b of bets) {
    const k = betKey(b);
    m.set(k, (m.get(k) || 0) + b.amount);
  }
  return m;
}

export function BettingTable({
  onCellClick,
  disabled,
  liveBets,
  stagedKeys,
}: {
  onCellClick: (type: BetType, selection?: number) => void;
  disabled: boolean;
  liveBets: LiveBet[];
  /** Highlight keys user staged this round */
  stagedKeys: Set<string>;
}) {
  const totals = aggregate(liveBets);

  function cellClass(base: string, active: boolean) {
    return `${base} relative flex min-h-[2.25rem] items-center justify-center rounded-md border text-xs font-semibold transition ${
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-[0.98]"
    } ${active ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black" : ""}`;
  }

  const nums = Array.from({ length: 36 }, (_, i) => i + 1);

  return (
    <div className="w-full space-y-2 overflow-x-auto pb-2">
      <div className="flex min-w-[280px] gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onCellClick("straight", 0)}
          className={cellClass(
            "w-10 shrink-0 bg-emerald-800 text-white border-emerald-600",
            stagedKeys.has("s-0")
          )}
        >
          <span>0</span>
          {totals.get("s-0") ? (
            <span className="absolute bottom-0.5 text-[9px] text-amber-300">₹{totals.get("s-0")}</span>
          ) : null}
        </button>
        <div className="grid flex-1 grid-cols-12 gap-0.5 sm:gap-1">
          {nums.map((n) => {
            const c = colorOf(n);
            const bg =
              c === "red"
                ? "bg-red-800 border-red-600 text-white"
                : "bg-zinc-900 border-zinc-600 text-zinc-100";
            const k = `s-${n}`;
            return (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onCellClick("straight", n)}
                className={cellClass(bg, stagedKeys.has(k))}
              >
                {n}
                {totals.get(k) ? (
                  <span className="absolute bottom-0.5 text-[8px] text-amber-300">₹{totals.get(k)}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-w-[280px] grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-6">
        {(
          [
            ["red", "Red", "bg-red-900 border-red-700 text-red-100"],
            ["black", "Black", "bg-zinc-950 border-zinc-600 text-zinc-200"],
            ["even", "Even", "bg-violet-950 border-violet-700 text-violet-100"],
            ["odd", "Odd", "bg-indigo-950 border-indigo-700 text-indigo-100"],
            ["low", "1–18", "bg-teal-950 border-teal-700 text-teal-100"],
            ["high", "19–36", "bg-cyan-950 border-cyan-800 text-cyan-100"],
          ] as const
        ).map(([type, label, cls]) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onCellClick(type as BetType)}
            className={cellClass(`${cls} px-2 py-3`, stagedKeys.has(type))}
          >
            {label}
            {totals.get(type) ? (
              <span className="absolute bottom-1 text-[10px] text-amber-300">₹{totals.get(type)}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
