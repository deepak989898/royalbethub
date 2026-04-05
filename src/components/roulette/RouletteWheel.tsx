"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useLayoutEffect } from "react";
import { colorOf } from "@/lib/roulette/constants";
import {
  EUROPEAN_WHEEL_ORDER,
  ballArmTargetWorldDegrees,
  pocketCenterAngleDegreesFromTop,
  wheelSpinTargetDegrees,
} from "@/lib/roulette/wheel-layout";

export function RouletteWheel({
  winningNumber,
  spinTrigger,
  phase,
  highlightWinner,
}: {
  winningNumber: number | null;
  spinTrigger: number;
  phase: "betting" | "result";
  /** When false during result, the wheel does not emphasize the winning pocket (ball still animates). */
  highlightWinner: boolean;
}) {
  const ballAngle = useMotionValue(0);
  const wheelRotation = useMotionValue(0);
  const r = 160;
  const step = (2 * Math.PI) / EUROPEAN_WHEEL_ORDER.length;

  /** Hydration / refresh while a result is already showing: snap ball + wheel (no spin). */
  useLayoutEffect(() => {
    if (phase === "result" && winningNumber != null && spinTrigger === 0) {
      const w = wheelRotation.get();
      const L = pocketCenterAngleDegreesFromTop(winningNumber);
      ballAngle.set((((L + w) % 360) + 360) % 360);
    }
  }, [phase, winningNumber, spinTrigger, ballAngle, wheelRotation]);

  useEffect(() => {
    if (spinTrigger === 0 || winningNumber == null) return;
    const ease = [0.15, 0.75, 0.1, 1] as const;
    const duration = 5.4;
    const wheelCurrent = wheelRotation.get();
    const wheelTarget = wheelSpinTargetDegrees(6.5, wheelCurrent);
    const ballCurrent = ballAngle.get();
    const ballTarget = ballArmTargetWorldDegrees(winningNumber, 6, ballCurrent, wheelTarget);
    void animate(wheelRotation, wheelTarget, { duration, ease });
    void animate(ballAngle, ballTarget, { duration, ease });
  }, [spinTrigger, winningNumber, ballAngle, wheelRotation]);

  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,380px)] flex-col items-center">
      <div className="relative aspect-square w-full max-w-[340px]">
        <div className="absolute inset-0 rounded-full border-4 border-amber-700/80 bg-gradient-to-b from-amber-950 to-black shadow-[0_0_40px_rgba(245,158,11,0.15)]" />

        <motion.div
          className="absolute inset-[10px] rounded-full"
          style={{ rotate: wheelRotation }}
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
              const isWin =
                highlightWinner && phase === "result" && winningNumber != null && num === winningNumber;
              return (
                <g key={`${num}-${i}`}>
                  <path
                    d={`M 0 0 L ${x0} ${y0} A ${r - 8} ${r - 8} 0 0 1 ${x1} ${y1} Z`}
                    fill={fill}
                    stroke={isWin ? "rgba(250, 204, 21, 0.95)" : "rgba(0,0,0,0.5)"}
                    strokeWidth={isWin ? 3 : 1}
                    filter={isWin ? "url(#winGlow)" : undefined}
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
            <defs>
              <filter id="winGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </motion.div>

        <div className="pointer-events-none absolute inset-[4px] z-[15] flex items-center justify-center">
          <motion.div className="absolute inset-0" style={{ rotate: ballAngle }}>
            <div
              className="absolute left-1/2 top-[3.5%] z-10 -translate-x-1/2"
              style={{
                width: "clamp(10px, 3.2vw, 14px)",
                height: "clamp(10px, 3.2vw, 14px)",
              }}
            >
              <div
                className="h-full w-full rounded-full border border-white/90 bg-gradient-to-br from-white via-zinc-100 to-zinc-400 shadow-[0_0_14px_rgba(255,255,255,0.85),inset_0_1px_2px_rgba(255,255,255,0.9)]"
                aria-hidden
              />
            </div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500/60 bg-gradient-to-br from-zinc-900 to-black shadow-inner" />
      </div>

      {phase === "result" && winningNumber != null && highlightWinner ? (
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
      ) : phase === "result" ? (
        <p className="mt-4 text-center text-sm text-zinc-500">Spinning…</p>
      ) : (
        <p className="mt-4 text-center text-sm text-zinc-500">Place your bets — round is live</p>
      )}
    </div>
  );
}
