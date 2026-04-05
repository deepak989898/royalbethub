import {
  columnDozenMultiplier,
  cornerMultiplier,
  evenMoneyMultiplier,
  isBlack,
  isRed,
  splitMultiplier,
  straightMultiplier,
  streetMultiplier,
} from "./constants";
import {
  columnIndex,
  dozenIndex,
  isValidCornerKey,
  isValidSplitKey,
  isValidStreetKey,
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
    case "street": {
      const key = bet.selectionStr;
      if (!key || !isValidStreetKey(key)) return 0;
      const nums = key.split("-").map((s) => parseInt(s, 10));
      return nums.includes(result) ? stake * (1 + streetMultiplier()) : 0;
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

export function totalPayoutForResult(result: number, bets: BetForEngine[]): number {
  return bets.reduce((sum, b) => sum + payoutForBet(result, b), 0);
}
