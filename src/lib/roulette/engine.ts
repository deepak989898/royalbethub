import { randomInt } from "node:crypto";
import type { BetForEngine } from "./payout";
import { totalPayoutForResult } from "./payout";

export type { BetForEngine } from "./payout";
export { payoutForBet, totalPayoutForResult } from "./payout";

function pickFromPayoutExtreme(bets: BetForEngine[], mode: "min" | "max"): number {
  if (bets.length === 0) {
    return randomInt(0, 37);
  }
  const payouts: number[] = [];
  for (let n = 0; n <= 36; n++) {
    payouts.push(totalPayoutForResult(n, bets));
  }
  const target = mode === "min" ? Math.min(...payouts) : Math.max(...payouts);
  const candidates: number[] = [];
  for (let n = 0; n <= 36; n++) {
    if (payouts[n] === target) candidates.push(n);
  }
  return candidates[randomInt(0, candidates.length)]!;
}

/**
 * House edge: pick the winning number that minimizes total payout.
 * When there are no bets, every outcome ties at 0 — use a fair random spin (not always 0).
 * When multiple numbers tie for minimum payout, pick randomly among ties (not always 0).
 */
export function pickMinPayoutNumber(bets: BetForEngine[]): number {
  return pickFromPayoutExtreme(bets, "min");
}

/** Pick a number that maximizes total payout (favors players when bets exist). */
export function pickMaxPayoutNumber(bets: BetForEngine[]): number {
  return pickFromPayoutExtreme(bets, "max");
}

function normalizeRtpMode(raw: string | undefined): "house" | "fair" | "player" | "mixed" | "manual" {
  const x = String(raw ?? "house").toLowerCase();
  if (x === "manual") return "manual";
  if (x === "fair") return "fair";
  if (x === "player") return "player";
  if (x === "mixed") return "mixed";
  return "house";
}

/**
 * Resolves the winning pocket from admin RTP settings and current bets.
 * No bets → always uniform random (strategies only apply when stakes exist, except manual).
 */
export function pickWinningNumber(
  bets: BetForEngine[],
  rtpModeRaw: string | undefined,
  manualNextNumber: number | null | undefined,
  playerFavorPercentRaw: number | undefined
): number {
  const mode = normalizeRtpMode(rtpModeRaw);
  const manualOk =
    manualNextNumber != null &&
    Number.isInteger(manualNextNumber) &&
    manualNextNumber >= 0 &&
    manualNextNumber <= 36;

  if (mode === "manual" && manualOk) {
    return manualNextNumber!;
  }

  if (bets.length === 0) {
    return randomInt(0, 37);
  }

  const pctRaw = Number(playerFavorPercentRaw);
  const pct = Number.isFinite(pctRaw) ? Math.max(0, Math.min(100, Math.round(pctRaw))) : 50;

  switch (mode) {
    case "fair":
      return randomInt(0, 37);
    case "player":
      return pickMaxPayoutNumber(bets);
    case "mixed": {
      const roll = randomInt(0, 100);
      if (roll < pct) return pickMaxPayoutNumber(bets);
      return pickMinPayoutNumber(bets);
    }
    case "manual":
    case "house":
    default:
      return pickMinPayoutNumber(bets);
  }
}

export function validateStraightSelection(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 36;
}

export function validateColumnDozenSelection(n: unknown): n is 1 | 2 | 3 {
  return n === 1 || n === 2 || n === 3;
}
