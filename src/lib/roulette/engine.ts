import { randomInt } from "node:crypto";
import type { BetForEngine } from "./payout";
import { totalPayoutForResult } from "./payout";

export type { BetForEngine } from "./payout";
export { payoutForBet, totalPayoutForResult } from "./payout";

/**
 * RTP / house edge: pick the winning number that minimizes total payout.
 * When there are no bets, every outcome ties at 0 — use a fair random spin (not always 0).
 * When multiple numbers tie for minimum payout, pick randomly among ties (not always 0).
 */
export function pickMinPayoutNumber(bets: BetForEngine[]): number {
  if (bets.length === 0) {
    return randomInt(0, 37);
  }
  const payouts: number[] = [];
  for (let n = 0; n <= 36; n++) {
    payouts.push(totalPayoutForResult(n, bets));
  }
  const minPay = Math.min(...payouts);
  const candidates: number[] = [];
  for (let n = 0; n <= 36; n++) {
    if (payouts[n] === minPay) candidates.push(n);
  }
  return candidates[randomInt(0, candidates.length)]!;
}

export function validateStraightSelection(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 36;
}

export function validateColumnDozenSelection(n: unknown): n is 1 | 2 | 3 {
  return n === 1 || n === 2 || n === 3;
}
