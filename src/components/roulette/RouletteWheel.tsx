"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect } from "react";
import { colorOf } from "@/lib/roulette/constants";
import { EUROPEAN_WHEEL_ORDER, targetRotationDegrees } from "@/lib/roulette/wheel-layout";

export function RouletteWheel({
  winningNumber,
  spinTrigger,
  phase,
}: {
  winningNumber: number | null;
  spinTrigger: number;
  phase: "betting" | "result";
}) {
  const rotation = useMotionValue(0);

  useEffect(() => {
    if (spinTrigger === 0 || winningNumber == null) return;
    const current = rotation.get();
    const target = targetRotationDegrees(winningNumber, 6, current);
    void animate(rotation, target, { duration: 5.2, ease: [0.12, 0.8, 0.12, 1] });
  }, [spinTrigger, winningNumber, rotation]);

  const r = 160;
  const step = (2 * Math.PI) / EUROPEAN_WHEEL_ORDER.length;

  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,380px)] flex-col items-center">
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
        aria-hidden
      >
        ▼
      </div>
      <div className="relative aspect-square w-full max-w-[340px]">
        <div className="absolute inset-0 rounded-full border-4 border-amber-700/80 bg-gradient-to-b from-amber-950 to-black shadow-[0_0_40px_rgba(245,158,11,0.15)]" />
        <motion.div
          className="absolute inset-[10px] rounded-full"
          style={{ rotate: rotation }}
        >
          <svg viewBox={`-${r} -${r} ${r * 2} ${r * 2}`} className="h-full w-full">
            {EUROPEAN_WHEEL_ORDER.map((num, i) => {
              const a0 = i * step - Math.PI / 2;
              const a1 = (i + 1) * step - Math.PI / 2;
              const col = colorOf(num);
              const fill =
                col === "green"
                  ? "#15803d"
                  : col === "red"
                    ? "#b91c1c"
                    : "#18181b";
              const x0 = Math.cos(a0) * (r - 8);
              const y0 = Math.sin(a0) * (r - 8);
              const x1 = Math.cos(a1) * (r - 8);
              const y1 = Math.sin(a1) * (r - 8);
              const mid = (a0 + a1) / 2;
              const tx = Math.cos(mid) * (r * 0.72);
              const ty = Math.sin(mid) * (r * 0.72);
              return (
                <g key={`${num}-${i}`}>
                  <path
                    d={`M 0 0 L ${x0} ${y0} A ${r - 8} ${r - 8} 0 0 1 ${x1} ${y1} Z`}
                    fill={fill}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1}
                  />
                  <text
                    x={tx}
                    y={ty}
                    fill="#fafafa"
                    fontSize={num >= 10 ? 11 : 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-bold"
                    style={{ textShadow: "0 1px 2px #000" }}
                  >
                    {num}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>
        <div className="absolute left-1/2 top-1/2 z-10 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500/60 bg-gradient-to-br from-zinc-900 to-black shadow-inner" />
      </div>
      {phase === "result" && winningNumber != null ? (
        <p className="mt-4 text-center text-sm text-zinc-400">
          Result:{" "}
          <span
            className={`text-lg font-bold ${
              colorOf(winningNumber) === "red"
                ? "text-red-400"
                : colorOf(winningNumber) === "black"
                  ? "text-zinc-200"
                  : "text-emerald-400"
            }`}
          >
            {winningNumber}
          </span>
        </p>
      ) : (
        <p className="mt-4 text-center text-sm text-zinc-500">Place your bets — round is live</p>
      )}
    </div>
  );
}
