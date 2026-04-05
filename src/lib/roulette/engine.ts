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
 * Tie-break: lowest number.
 */
export function pickMinPayoutNumber(bets: BetForEngine[]): number {
  let best = 0;
  let bestPay = Infinity;
  for (let n = 0; n <= 36; n++) {
    const pay = totalPayoutForResult(n, bets);
    if (pay < bestPay || (pay === bestPay && n < best)) {
      bestPay = pay;
      best = n;
    }
  }
  return best;
}

export function validateStraightSelection(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 36;
}
