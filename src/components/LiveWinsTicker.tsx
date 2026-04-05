"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const LINES = [
  "Player in Mumbai • Aviator round cashout",
  "Hyderabad • Live roulette session",
  "Delhi NCR • Slots bonus triggered",
  "Pune • Sportsbook parlay settled",
  "Bangalore • Teen Patti live table",
  "Chennai • Deposit offer claimed",
];

export function LiveWinsTicker() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % LINES.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300">
      <Sparkles className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <p className="min-w-0 truncate">
        <span className="text-amber-200/90">Live activity (demo):</span>{" "}
        <span key={i} className="inline-block animate-pulse">
          {LINES[i]}
        </span>
      </p>
    </div>
  );
}
