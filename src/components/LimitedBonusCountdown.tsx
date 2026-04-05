"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** Resets every 24h (local) for a recurring “limited window” CTA. */
export function LimitedBonusCountdown() {
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    function tick() {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      const now = Date.now();
      let ms = end.getTime() - now;
      if (ms < 0) ms = 0;
      const s = Math.floor(ms / 1000);
      setLeft({
        h: Math.floor(s / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-red-900/20 px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
          <Timer className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-white">Limited bonus window</p>
          <p className="mt-1 text-sm text-zinc-400">
            Use partner links today and stack welcome offers where eligible. Timers are illustrative;
            operator rules always apply.
          </p>
        </div>
      </div>
      <div
        className="mt-4 flex justify-center gap-3 font-mono text-xl font-bold tabular-nums text-amber-300 sm:mt-0"
        aria-live="polite"
      >
        <span>{pad(left.h)}h</span>
        <span>{pad(left.m)}m</span>
        <span>{pad(left.s)}s</span>
      </div>
    </div>
  );
}
