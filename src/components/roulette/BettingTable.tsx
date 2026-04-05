"use client";

import type React from "react";
import { colorOf } from "@/lib/roulette/constants";
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

function NumberCell({
  r,
  c,
  disabled,
  stagedKeys,
  totals,
  onBet,
}: {
  r: 0 | 1 | 2;
  c: number;
  disabled: boolean;
  stagedKeys: Set<string>;
  totals: Map<string, number>;
  onBet: (p: TableBetPayload) => void;
}) {
  const n = rcToNum(r, c);
  const sk = clientBetKey("straight", n);
  const col = colorOf(n);
  const bg =
    col === "red"
      ? "bg-red-800 border-red-600 text-white"
      : "bg-zinc-900 border-zinc-600 text-zinc-100";

  return (
    <div className="relative min-h-[1.45rem] min-w-0 flex-1 sm:min-h-[1.6rem] lg:min-h-[2.35rem]">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          const { x, y } = normClick(e);
          onBet(resolveNumberCellClick(r, c, x, y));
        }}
        className={`relative flex h-full min-h-[1.45rem] w-full items-center justify-center rounded border text-[9px] font-semibold transition sm:min-h-[1.6rem] sm:text-[10px] lg:min-h-[2.35rem] lg:text-xs ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-[0.98]"
        } ${bg} ${stagedKeys.has(sk) ? "ring-1 ring-amber-400 ring-offset-0 ring-offset-black lg:ring-2 lg:ring-offset-1" : ""}`}
      >
        {n}
        {totals.get(sk) ? (
          <span className="absolute bottom-px text-[6px] text-amber-300 lg:bottom-0.5 lg:text-[8px]">
            ₹{totals.get(sk)}
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
  stagedKeys,
}: {
  onBet: (p: TableBetPayload) => void;
  disabled: boolean;
  liveBets: LiveBet[];
  stagedKeys: Set<string>;
}) {
  const totals = aggregate(liveBets);

  function cellClass(base: string, active: boolean) {
    return `${base} relative flex min-h-[1.45rem] items-center justify-center rounded border text-[9px] font-semibold transition sm:min-h-[1.6rem] sm:text-[10px] lg:min-h-[2.25rem] lg:rounded-md lg:text-xs ${
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:brightness-110 active:scale-[0.98]"
    } ${active ? "ring-1 ring-amber-400 ring-offset-0 ring-offset-black lg:ring-2 lg:ring-offset-1" : ""}`;
  }

  const zeroKey = clientBetKey("straight", 0);
  const colKeys = [3, 2, 1] as const;

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
          className={cellClass(
            "relative flex w-7 shrink-0 flex-col items-center justify-center rounded border border-emerald-700 bg-emerald-800 py-4 text-[10px] text-white sm:w-8 sm:rounded-md sm:py-5 sm:text-[11px] lg:w-11 lg:rounded-lg lg:py-8 lg:text-sm",
            stagedKeys.has(zeroKey)
          )}
        >
          0
          {totals.get(zeroKey) ? (
            <span className="absolute bottom-0.5 text-[7px] text-amber-300 lg:text-[9px]">
              ₹{totals.get(zeroKey)}
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
                  stagedKeys={stagedKeys}
                  totals={totals}
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
                  stagedKeys.has(ck)
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
                stagedKeys.has(dk)
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
            className={cellClass(`${cls} px-1 py-2 lg:px-2 lg:py-3`, stagedKeys.has(type))}
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
