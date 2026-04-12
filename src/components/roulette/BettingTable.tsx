"use client";

import type React from "react";
import { useMemo } from "react";
import { colorOf } from "@/lib/roulette/constants";
import { numbersInBetTotalKey } from "@/lib/roulette/bet-table-keys";
import { resolveNumberCellClick, resolveZeroCellClick } from "@/lib/roulette/grid-click";
import type { BetType } from "@/lib/roulette/types";
import { clientBetKey } from "@/lib/roulette/types";

export type TableBetPayload = {
  type: BetType;
  selection?: number;
  selectionStr?: string;
};

type LiveBet = {
  type: BetType;
  selection: number | null;
  selectionStr?: string | null;
  amount: number;
};

function rowKey(b: LiveBet): string {
  return clientBetKey(b.type, b.selection ?? undefined, b.selectionStr ?? undefined);
}

function aggregate(bets: LiveBet[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const b of bets) {
    const k = rowKey(b);
    m.set(k, (m.get(k) || 0) + b.amount);
  }
  return m;
}

function normClick(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const w = rect.width || 1;
  const h = rect.height || 1;
  const x = (e.clientX - rect.left) / w;
  const y = (e.clientY - rect.top) / h;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

function rcToNum(r: 0 | 1 | 2, c: number) {
  return (3 - r) + 3 * c;
}

type CellVisual = {
  ring: boolean;
  straightTotal: number;
  /** Split only: full line stake on the top chip row on each covered number. */
  compoundTopStakes: Array<{ key: string; amt: number }>;
};

function buildInsideCellVisual(totals: Map<string, number>): Map<number, CellVisual> {
  const byN = new Map<number, CellVisual>();
  for (let n = 0; n <= 36; n++) {
    byN.set(n, { ring: false, straightTotal: 0, compoundTopStakes: [] });
  }

  const markRingForKey = (key: string) => {
    const nums = numbersInBetTotalKey(key);
    if (!nums) return;
    for (const n of nums) {
      const c = byN.get(n);
      if (c) c.ring = true;
    }
  };

  for (const [k, amt] of totals) {
    if (!amt) continue;
    if (k.startsWith("s-")) {
      const v = parseInt(k.slice(2), 10);
      if (!Number.isNaN(v) && v >= 0 && v <= 36) {
        const c = byN.get(v)!;
        c.straightTotal += amt;
        c.ring = true;
      }
      continue;
    }
    if (k.startsWith("corner-") || k.startsWith("street-")) {
      const nums = numbersInBetTotalKey(k);
      if (!nums) continue;
      for (const n of nums) {
        const c = byN.get(n);
        if (c) c.ring = true;
      }
      continue;
    }
    if (k.startsWith("split-")) {
      const nums = numbersInBetTotalKey(k);
      if (!nums) continue;
      for (const n of nums) {
        const c = byN.get(n);
        if (!c) continue;
        c.ring = true;
        c.compoundTopStakes.push({ key: k, amt });
      }
      continue;
    }
    markRingForKey(k);
  }

  return byN;
}

function NumberCell({
  r,
  c,
  disabled,
  totals,
  cellVisual,
  onBet,
}: {
  r: 0 | 1 | 2;
  c: number;
  disabled: boolean;
  totals: Map<string, number>;
  cellVisual: Map<number, CellVisual>;
  onBet: (p: TableBetPayload) => void;
}) {
  const n = rcToNum(r, c);
  const sk = clientBetKey("straight", n);
  const col = colorOf(n);
  const bg =
    col === "red"
      ? "bg-red-800 border-red-600 text-white"
      : "bg-zinc-900 border-zinc-600 text-zinc-100";

  const vis = cellVisual.get(n)!;
  const straightChip = vis.straightTotal || totals.get(sk) || 0;

  return (
    <div className="relative min-h-[1.55rem] min-w-0 flex-1 sm:min-h-[1.75rem] lg:min-h-[2.45rem]">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          const { x, y } = normClick(e);
          onBet(resolveNumberCellClick(r, c, x, y));
        }}
        className={`relative flex h-full min-h-[1.55rem] w-full flex-col items-center justify-center rounded border px-px pb-3 pt-3 text-[9px] font-semibold transition sm:min-h-[1.75rem] sm:text-[10px] lg:min-h-[2.45rem] lg:pb-3.5 lg:pt-3.5 lg:text-xs ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-[0.98] touch-manipulation"
        } ${bg} ${vis.ring ? "ring-1 ring-amber-400 ring-offset-0 ring-offset-black lg:ring-2 lg:ring-offset-1" : ""}`}
      >
        {vis.compoundTopStakes.length > 0 ? (
          <div className="pointer-events-none absolute left-0 right-0 top-0.5 flex max-h-[42%] flex-col items-center gap-0 overflow-hidden px-0.5 lg:top-1">
            {vis.compoundTopStakes.map((row) => (
              <span
                key={`${n}-${row.key}`}
                className="w-full truncate text-center text-[6px] font-black tabular-nums leading-tight text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-[7px] lg:text-[8px]"
                title={`Split stake · ₹${row.amt.toLocaleString("en-IN")}`}
              >
                ₹{row.amt.toLocaleString("en-IN")}
              </span>
            ))}
          </div>
        ) : null}
        <span className="z-[1] leading-none">{n}</span>
        {straightChip > 0 ? (
          <span className="absolute bottom-px text-[6px] font-bold tabular-nums text-amber-300 lg:bottom-0.5 lg:text-[8px]">
            ₹{straightChip.toLocaleString("en-IN")}
          </span>
        ) : null}
      </button>
    </div>
  );
}

export function BettingTable({
  onBet,
  disabled,
  liveBets,
}: {
  onBet: (p: TableBetPayload) => void;
  disabled: boolean;
  liveBets: LiveBet[];
}) {
  const totals = useMemo(() => aggregate(liveBets), [liveBets]);

  const cellVisual = useMemo(() => buildInsideCellVisual(totals), [totals]);

  function cellClass(base: string, totalKey: string) {
    const active = (totals.get(totalKey) ?? 0) > 0;
    return `${base} relative flex min-h-[1.45rem] items-center justify-center rounded border text-[9px] font-semibold transition sm:min-h-[1.6rem] sm:text-[10px] lg:min-h-[2.25rem] lg:rounded-md lg:text-xs ${
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-[0.98] touch-manipulation"
    } ${active ? "ring-1 ring-amber-400 ring-offset-0 ring-offset-black lg:ring-2 lg:ring-offset-1" : ""}`;
  }

  const zeroKey = clientBetKey("straight", 0);
  const colKeys = [3, 2, 1] as const;
  const zeroVis = cellVisual.get(0)!;
  const zeroHasStake = (totals.get(zeroKey) ?? 0) > 0;
  const zeroActive = zeroVis.ring || zeroHasStake;

  return (
    <div className="w-full space-y-0.5 overflow-x-auto pb-0 sm:space-y-1.5 sm:pb-1 lg:space-y-2 lg:pb-2">
      <div className="flex min-w-[min(100%,248px)] gap-px sm:min-w-[260px] sm:gap-0.5 md:min-w-[300px] lg:min-w-[320px] lg:gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            const { x, y } = normClick(e);
            onBet(resolveZeroCellClick(x, y));
          }}
          className={`relative flex w-7 shrink-0 flex-col items-center justify-center gap-0 rounded border border-emerald-700 bg-emerald-800 py-4 text-[10px] text-white sm:w-8 sm:rounded-md sm:py-5 sm:text-[11px] lg:w-11 lg:rounded-lg lg:py-8 lg:text-sm ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-[0.98] touch-manipulation"
          } ${zeroActive ? "ring-1 ring-amber-400 ring-offset-0 ring-offset-black lg:ring-2 lg:ring-offset-1" : ""}`}
        >
          {zeroVis.compoundTopStakes.length > 0 ? (
            <div className="pointer-events-none absolute left-0 right-0 top-1 flex max-h-[36%] flex-col items-center gap-0 overflow-hidden px-0.5 sm:top-1.5 lg:top-2">
              {zeroVis.compoundTopStakes.map((row) => (
                <span
                  key={`0-${row.key}`}
                  className="w-full truncate text-center text-[6px] font-black tabular-nums text-amber-100 sm:text-[7px] lg:text-[8px]"
                >
                  ₹{row.amt.toLocaleString("en-IN")}
                </span>
              ))}
            </div>
          ) : null}
          <span className="z-[1] leading-none">0</span>
          {zeroHasStake ? (
            <span className="absolute bottom-0.5 text-[7px] font-bold tabular-nums text-amber-300 lg:text-[9px]">
              ₹{(totals.get(zeroKey) ?? 0).toLocaleString("en-IN")}
            </span>
          ) : null}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-px lg:gap-0.5">
          {([0, 1, 2] as const).map((r) => (
            <div key={r} className="flex gap-px lg:gap-0.5">
              {Array.from({ length: 12 }, (_, c) => (
                <NumberCell
                  key={`${r}-${c}`}
                  r={r}
                  c={c}
                  disabled={disabled}
                  totals={totals}
                  cellVisual={cellVisual}
                  onBet={onBet}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex w-6 shrink-0 flex-col justify-stretch gap-px lg:w-9 lg:gap-0.5">
          {colKeys.map((col) => {
            const ck = clientBetKey("column", col);
            return (
              <button
                key={col}
                type="button"
                disabled={disabled}
                onClick={() => onBet({ type: "column", selection: col })}
                className={cellClass(
                  "flex flex-1 items-center justify-center bg-zinc-800 px-px text-[7px] leading-tight text-zinc-200 border-zinc-600 lg:px-0.5 lg:text-[9px]",
                  ck
                )}
              >
                2:1
                {totals.get(ck) ? (
                  <span className="absolute bottom-px text-[6px] text-amber-300 lg:bottom-0.5 lg:text-[8px]">
                    ₹{totals.get(ck)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-w-[min(100%,260px)] grid-cols-3 gap-0.5 sm:min-w-[280px] lg:gap-1">
        {(
          [
            [1, "1st 12"],
            [2, "2nd 12"],
            [3, "3rd 12"],
          ] as const
        ).map(([dz, label]) => {
          const dk = clientBetKey("dozen", dz);
          return (
            <button
              key={dz}
              type="button"
              disabled={disabled}
              onClick={() => onBet({ type: "dozen", selection: dz })}
              className={cellClass(
                "bg-slate-900 px-1 py-1.5 text-[9px] text-slate-100 border-slate-600 lg:px-2 lg:py-2.5 lg:text-xs",
                dk
              )}
            >
              <span className="lg:hidden">{dz === 1 ? "1st" : dz === 2 ? "2nd" : "3rd"}</span>
              <span className="hidden lg:inline">{label}</span>
              {totals.get(dk) ? (
                <span className="absolute bottom-0.5 text-[7px] text-amber-300 lg:bottom-1 lg:text-[9px]">
                  ₹{totals.get(dk)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid min-w-[min(100%,260px)] grid-cols-3 gap-0.5 sm:min-w-[280px] sm:grid-cols-3 md:grid-cols-6 lg:gap-1">
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
            onClick={() => onBet({ type: type as BetType })}
            className={cellClass(`${cls} px-1 py-2 lg:px-2 lg:py-3`, type)}
          >
            <span className="max-[400px]:text-[9px]">{label}</span>
            {totals.get(type) ? (
              <span className="absolute bottom-0.5 text-[7px] text-amber-300 lg:bottom-1 lg:text-[10px]">
                ₹{totals.get(type)}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
