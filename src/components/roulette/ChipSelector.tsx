"use client";

import type { ChipValue } from "@/lib/roulette/types";
import { CHIP_VALUES } from "@/lib/roulette/types";

export function ChipSelector({
  value,
  onChange,
  disabled,
}: {
  value: ChipValue;
  onChange: (c: ChipValue) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-zinc-500">Chips ₹</span>
      {CHIP_VALUES.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c)}
            className={`relative h-11 w-11 rounded-full border-2 text-xs font-bold shadow-lg transition disabled:opacity-40 ${
              active
                ? "scale-110 border-amber-300 bg-gradient-to-br from-amber-500 to-amber-700 text-black ring-2 ring-amber-400/50"
                : "border-zinc-600 bg-gradient-to-br from-zinc-700 to-zinc-900 text-amber-100 hover:border-amber-600/60"
            }`}
          >
            {c >= 1000 ? `${c / 1000}k` : c}
          </button>
        );
      })}
    </div>
  );
}
