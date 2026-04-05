export type RoulettePhase = "betting" | "result";

export type BetType =
  | "straight"
  | "split"
  | "corner"
  | "street"
  | "column"
  | "dozen"
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
    /** straight, column (1–3), dozen (1–3) */
    selection?: number;
    /** split "a-b", corner "a-b-c-d" (sorted ascending) */
    selectionStr?: string;
    amount: number;
  }>;
}

/** Stable key for staging / aggregation (must match server document fields). */
export function clientBetKey(
  type: BetType,
  selection?: number,
  selectionStr?: string
): string {
  switch (type) {
    case "straight":
      return `s-${selection}`;
    case "split":
      return `split-${selectionStr}`;
    case "corner":
      return `corner-${selectionStr}`;
    case "street":
      return `street-${selectionStr}`;
    case "column":
      return `col-${selection}`;
    case "dozen":
      return `dz-${selection}`;
    default:
      return type;
  }
}

/** Human-readable label for history / admin. */
export function formatBetLabel(p: {
  type: BetType;
  selection?: number | null;
  selectionStr?: string | null;
}): string {
  switch (p.type) {
    case "straight":
      return `straight ${p.selection}`;
    case "split":
      return `split ${p.selectionStr ?? ""}`;
    case "corner":
      return `corner ${p.selectionStr ?? ""}`;
    case "street":
      return `street ${p.selectionStr ?? ""}`;
    case "column":
      return `column ${p.selection} (2:1)`;
    case "dozen":
      return `dozen ${p.selection} (${p.selection === 1 ? "1–12" : p.selection === 2 ? "13–24" : "25–36"})`;
    default:
      return p.type;
  }
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
