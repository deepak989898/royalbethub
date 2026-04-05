import * as admin from "firebase-admin";
import type { RoulettePhase, RtpMode } from "./types";

export interface RouletteStateDoc {
  phase: RoulettePhase;
  roundId: string;
  sequence: number;
  endsAt: admin.firestore.Timestamp | null;
  winningNumber: number | null;
  resultShownUntil: admin.firestore.Timestamp | null;
  spinDurationSec: number;
  rtpMode: RtpMode;
  /** 0–100; used when `rtpMode === "mixed"` (default 50 if missing in older docs). */
  playerFavorPercent?: number;
  manualNextNumber: number | null;
  recentResults: number[];
  totalHouseProfit?: number;
}

export function defaultRouletteState(spinDurationSec = 30): RouletteStateDoc {
  const now = admin.firestore.Timestamp.now();
  const roundId = crypto.randomUUID();
  const endsAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + spinDurationSec * 1000
  );
  return {
    phase: "betting",
    roundId,
    sequence: 1,
    endsAt,
    winningNumber: null,
    resultShownUntil: null,
    spinDurationSec,
    rtpMode: "house",
    playerFavorPercent: 50,
    manualNextNumber: null,
    recentResults: [],
    totalHouseProfit: 0,
  };
}
