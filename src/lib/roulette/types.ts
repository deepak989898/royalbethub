export type RoulettePhase = "betting" | "result";

export type BetType =
  | "straight"
  | "red"
  | "black"
  | "even"
  | "odd"
  | "low"
  | "high";

export type RtpMode = "auto" | "manual";

export interface RouletteGlobalState {
  phase: RoulettePhase;
  roundId: string;
  sequence: number;
  endsAt: { seconds: number; nanoseconds: number } | null;
  winningNumber: number | null;
  resultShownUntil: { seconds: number; nanoseconds: number } | null;
  spinDurationSec: number;
  rtpMode: RtpMode;
  manualNextNumber: number | null;
  recentResults: number[];
}

export interface PlaceBetPayload {
  roundId: string;
  bets: Array<{
    type: BetType;
    /** For straight: 0–36; ignored for color/range bets */
    selection?: number;
    amount: number;
  }>;
}

/** Quick-pick amounts in the UI (any ₹10 step is allowed via input). */
export const QUICK_BET_AMOUNTS = [20, 50, 100, 500, 1000] as const;

/** Strictly greater than ₹10 → smallest valid stake is ₹20 (still in ₹10 steps). */
export const MIN_BET_AMOUNT = 20;
export const MAX_BET_AMOUNT = 500_000;
export const BET_STEP = 10;

export function isValidBetStake(n: number): boolean {
  return (
    Number.isFinite(n) &&
    n >= MIN_BET_AMOUNT &&
    n <= MAX_BET_AMOUNT &&
    n % BET_STEP === 0
  );
}
