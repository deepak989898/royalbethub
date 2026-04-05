import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import {
  ApiError,
  handleRouteError,
  jsonError,
  jsonOk,
  requireUser,
} from "@/lib/roulette/api-auth";
import { validateStraightSelection } from "@/lib/roulette/engine";
import type { BetType } from "@/lib/roulette/types";
import { CHIP_VALUES } from "@/lib/roulette/types";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import type { RouletteStateDoc } from "@/lib/roulette/server-state";

const ALLOWED_TYPES: BetType[] = [
  "straight",
  "red",
  "black",
  "even",
  "odd",
  "low",
  "high",
];

function isChipAmount(n: number): boolean {
  return CHIP_VALUES.includes(n as (typeof CHIP_VALUES)[number]);
}

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const decoded = await requireUser(request);
    const body = (await request.json()) as {
      roundId?: string;
      bets?: Array<{ type?: string; selection?: number; amount?: number }>;
    };
    const roundId = body.roundId?.trim();
    const bets = body.bets;
    if (!roundId || !Array.isArray(bets) || bets.length === 0) {
      throw new ApiError(400, "roundId and bets required");
    }
    if (bets.length > 40) {
      throw new ApiError(400, "Too many bets in one request");
    }

    for (const b of bets) {
      if (!b.type || !ALLOWED_TYPES.includes(b.type as BetType)) {
        throw new ApiError(400, "Invalid bet type");
      }
      if (b.type === "straight" && !validateStraightSelection(b.selection)) {
        throw new ApiError(400, "Straight bet needs selection 0–36");
      }
      if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0) {
        throw new ApiError(400, "Invalid amount");
      }
      if (!isChipAmount(b.amount)) {
        throw new ApiError(400, `Amount must be one of: ${CHIP_VALUES.join(", ")}`);
      }
    }

    const totalStake = bets.reduce((s, b) => s + (b.amount ?? 0), 0);
    const db = getAdminDb();
    const stateRef = db.collection("roulette_state").doc(ROULETTE_STATE_DOC);
    const userRef = db.collection("roulette_users").doc(decoded.uid);

    await db.runTransaction(async (tx) => {
      const [stateSnap, userSnap] = await Promise.all([tx.get(stateRef), tx.get(userRef)]);
      if (!stateSnap.exists) throw new ApiError(503, "Game not initialized");
      const st = stateSnap.data() as RouletteStateDoc;
      if (st.phase !== "betting") throw new ApiError(409, "Betting closed for this round");
      if (st.roundId !== roundId) throw new ApiError(409, "Round mismatch — refresh the page");
      if (!st.endsAt) throw new ApiError(500, "Invalid round timer");
      if (st.endsAt.toMillis() <= Date.now()) {
        throw new ApiError(409, "Betting window ended");
      }
      if (!userSnap.exists) throw new ApiError(400, "Wallet not initialized — open wallet once");
      const u = userSnap.data()!;
      if (u.blocked) throw new ApiError(403, "Account blocked");
      const balance = Number(u.balance) || 0;
      if (balance < totalStake) throw new ApiError(400, "Insufficient balance");

      tx.update(userRef, { balance: balance - totalStake });

      for (const b of bets) {
        const betRef = db.collection("roulette_bets").doc();
        tx.set(betRef, {
          roundId,
          userId: decoded.uid,
          type: b.type,
          selection: b.type === "straight" ? b.selection : null,
          amount: b.amount,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    return handleRouteError(e);
  }
}
