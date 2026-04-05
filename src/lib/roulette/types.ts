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

export const CHIP_VALUES = [10, 50, 100, 500, 1000] as const;
export type ChipValue = (typeof CHIP_VALUES)[number];
