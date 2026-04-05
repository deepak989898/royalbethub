import { randomInt } from "node:crypto";
import { evenMoneyMultiplier, isBlack, isRed, straightMultiplier } from "./constants";
import type { BetType } from "./types";

export interface BetForEngine {
  type: BetType;
  selection?: number;
  amount: number;
}

/** Returns total payout (profit + returned stake) if `result` wins for this bet. */
export function payoutForBet(result: number, bet: BetForEngine): number {
  const stake = bet.amount;
  switch (bet.type) {
    case "straight": {
      const n = bet.selection ?? -1;
      if (n === result) return stake * (1 + straightMultiplier());
      return 0;
    }
    case "red":
      return isRed(result) ? stake * evenMoneyMultiplier() : 0;
    case "black":
      return isBlack(result) ? stake * evenMoneyMultiplier() : 0;
    case "even":
      if (result === 0) return 0;
      return result % 2 === 0 ? stake * evenMoneyMultiplier() : 0;
    case "odd":
      if (result === 0) return 0;
      return result % 2 === 1 ? stake * evenMoneyMultiplier() : 0;
    case "low":
      if (result === 0) return 0;
      return result >= 1 && result <= 18 ? stake * evenMoneyMultiplier() : 0;
    case "high":
      if (result === 0) return 0;
      return result >= 19 && result <= 36 ? stake * evenMoneyMultiplier() : 0;
    default:
      return 0;
  }
}

/** Total amount the house pays out if the ball lands on `result` (winnings including returned stakes). */
export function totalPayoutForResult(result: number, bets: BetForEngine[]): number {
  return bets.reduce((sum, b) => sum + payoutForBet(result, b), 0);
}

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
