import { randomInt } from "node:crypto";
import {
  columnDozenMultiplier,
  cornerMultiplier,
  evenMoneyMultiplier,
  isBlack,
  isRed,
  splitMultiplier,
  straightMultiplier,
} from "./constants";
import {
  columnIndex,
  dozenIndex,
  isValidCornerKey,
  isValidSplitKey,
  normalizeSplitKey,
  parseSplitKey,
} from "./table-layout";
import type { BetType } from "./types";

export interface BetForEngine {
  type: BetType;
  selection?: number;
  selectionStr?: string;
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
    case "split": {
      const key = bet.selectionStr;
      if (!key || !isValidSplitKey(key)) return 0;
      const p = parseSplitKey(key)!;
      const norm = normalizeSplitKey(p[0], p[1]);
      if (norm !== key) return 0;
      return result === p[0] || result === p[1] ? stake * (1 + splitMultiplier()) : 0;
    }
    case "corner": {
      const key = bet.selectionStr;
      if (!key || !isValidCornerKey(key)) return 0;
      const nums = key.split("-").map((s) => parseInt(s, 10));
      return nums.includes(result) ? stake * (1 + cornerMultiplier()) : 0;
    }
    case "column": {
      const col = bet.selection;
      if (col !== 1 && col !== 2 && col !== 3) return 0;
      if (result === 0) return 0;
      return columnIndex(result) === col ? stake * (1 + columnDozenMultiplier()) : 0;
    }
    case "dozen": {
      const dz = bet.selection;
      if (dz !== 1 && dz !== 2 && dz !== 3) return 0;
      if (result === 0) return 0;
      return dozenIndex(result) === dz ? stake * (1 + columnDozenMultiplier()) : 0;
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

export function validateColumnDozenSelection(n: unknown): n is 1 | 2 | 3 {
  return n === 1 || n === 2 || n === 3;
}
