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
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[8rem] flex-1 text-xs uppercase tracking-wider text-zinc-500">
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
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-amber-600/50 disabled:opacity-40"
          />
        </label>
        <p className="text-[10px] text-zinc-600">
          Min ₹{MIN_BET_AMOUNT}, max ₹{MAX_BET_AMOUNT.toLocaleString("en-IN")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">Quick:</span>
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
              className={`h-10 min-w-[2.5rem] rounded-full border-2 px-2 text-xs font-bold transition disabled:opacity-40 ${
                active
                  ? "border-amber-300 bg-gradient-to-br from-amber-500 to-amber-700 text-black ring-2 ring-amber-400/40"
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
