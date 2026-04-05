"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BET_STEP,
  MAX_BET_AMOUNT,
  MIN_BET_AMOUNT,
  QUICK_BET_AMOUNTS,
  isValidBetStake,
} from "@/lib/roulette/types";

export function BetAmountControl({
  value,
  onChange,
  disabled,
  maxHint,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  /** Optional balance cap hint (still allows typing; place validates server-side) */
  maxHint?: number | null;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clampAndSnap = useCallback(
    (raw: number) => {
      let n = Math.floor(raw / BET_STEP) * BET_STEP;
      if (n < MIN_BET_AMOUNT) n = MIN_BET_AMOUNT;
      if (n > MAX_BET_AMOUNT) n = MAX_BET_AMOUNT;
      if (maxHint != null && Number.isFinite(maxHint) && maxHint >= MIN_BET_AMOUNT) {
        const cap = Math.floor(maxHint / BET_STEP) * BET_STEP;
        if (cap >= MIN_BET_AMOUNT && n > cap) n = cap;
      }
      return n;
    },
    [maxHint]
  );

  function commitFromInput() {
    const parsed = parseInt(text.replace(/\D/g, ""), 10);
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const n = clampAndSnap(parsed);
    onChange(n);
    setText(String(n));
  }

  return (
    <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
      <div className="flex flex-wrap items-end gap-2 lg:gap-3">
        <label className="block min-w-0 flex-1 text-[10px] uppercase tracking-wider text-zinc-500 lg:min-w-[8rem] lg:text-xs">
          Stake ₹ (×{BET_STEP})
          <input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => commitFromInput()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitFromInput();
            }}
            className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-amber-600/50 disabled:opacity-40 lg:mt-1 lg:rounded-xl lg:px-3 lg:py-2 lg:text-sm"
          />
        </label>
        <p className="hidden text-[10px] text-zinc-600 sm:block">
          Min ₹{MIN_BET_AMOUNT}, max ₹{MAX_BET_AMOUNT.toLocaleString("en-IN")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
        <span className="text-[10px] text-zinc-500 lg:text-xs">Quick</span>
        {QUICK_BET_AMOUNTS.map((c) => {
          const active = c === value;
          return (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => {
                const n = clampAndSnap(c);
                onChange(n);
                setText(String(n));
              }}
              className={`h-7 min-w-[1.75rem] rounded-md border px-1.5 text-[10px] font-bold transition disabled:opacity-40 lg:h-10 lg:min-w-[2.5rem] lg:rounded-full lg:border-2 lg:px-2 lg:text-xs ${
                active
                  ? "border-amber-300 bg-gradient-to-br from-amber-500 to-amber-700 text-black ring-1 ring-amber-400/40 lg:ring-2"
                  : "border-zinc-600 bg-zinc-900 text-amber-100 hover:border-amber-600/50"
              }`}
            >
              {c >= 1000 ? `${c / 1000}k` : c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function normalizeStakeInput(n: number, maxBalance?: number | null): number {
  let v = Math.floor(n / BET_STEP) * BET_STEP;
  if (v < MIN_BET_AMOUNT) v = MIN_BET_AMOUNT;
  if (v > MAX_BET_AMOUNT) v = MAX_BET_AMOUNT;
  if (maxBalance != null && Number.isFinite(maxBalance)) {
    const cap = Math.floor(maxBalance / BET_STEP) * BET_STEP;
    if (cap >= MIN_BET_AMOUNT && v > cap) v = cap;
  }
  return isValidBetStake(v) ? v : MIN_BET_AMOUNT;
}
