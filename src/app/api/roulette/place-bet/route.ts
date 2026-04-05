import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import {
  ApiError,
  handleRouteError,
  jsonError,
  jsonOk,
  requireUser,
} from "@/lib/roulette/api-auth";
import {
  validateColumnDozenSelection,
  validateStraightSelection,
} from "@/lib/roulette/engine";
import {
  isValidCornerKey,
  isValidSplitKey,
  isValidStreetKey,
} from "@/lib/roulette/table-layout";
import type { BetType } from "@/lib/roulette/types";
import {
  BET_STEP,
  isValidBetStake,
  MAX_BET_AMOUNT,
  MAX_BETS_PER_PLACE_REQUEST,
  MIN_BET_AMOUNT,
} from "@/lib/roulette/types";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import type { RouletteStateDoc } from "@/lib/roulette/server-state";

const ALLOWED_TYPES: BetType[] = [
  "straight",
  "split",
  "corner",
  "street",
  "column",
  "dozen",
  "red",
  "black",
  "even",
  "odd",
  "low",
  "high",
];

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const decoded = await requireUser(request);
    const body = (await request.json()) as {
      roundId?: string;
      bets?: Array<{
        type?: string;
        selection?: number;
        selectionStr?: string;
        amount?: number;
      }>;
    };
    const roundId = body.roundId?.trim();
    const bets = body.bets;
    if (!roundId || !Array.isArray(bets) || bets.length === 0) {
      throw new ApiError(400, "roundId and bets required");
    }
    if (bets.length > MAX_BETS_PER_PLACE_REQUEST) {
      throw new ApiError(
        400,
        `At most ${MAX_BETS_PER_PLACE_REQUEST} bet lines per submit — place in batches or wait for the next round`
      );
    }

    for (const b of bets) {
      if (!b.type || !ALLOWED_TYPES.includes(b.type as BetType)) {
        throw new ApiError(400, "Invalid bet type");
      }
      if (b.type === "straight" && !validateStraightSelection(b.selection)) {
        throw new ApiError(400, "Straight bet needs selection 0–36");
      }
      if (b.type === "split") {
        const s = typeof b.selectionStr === "string" ? b.selectionStr.trim() : "";
        if (!isValidSplitKey(s)) {
          throw new ApiError(400, "Invalid split bet");
        }
      }
      if (b.type === "corner") {
        const s = typeof b.selectionStr === "string" ? b.selectionStr.trim() : "";
        if (!isValidCornerKey(s)) {
          throw new ApiError(400, "Invalid corner bet");
        }
      }
      if (b.type === "street") {
        const s = typeof b.selectionStr === "string" ? b.selectionStr.trim() : "";
        if (!isValidStreetKey(s)) {
          throw new ApiError(400, "Invalid street bet");
        }
      }
      if (b.type === "column" && !validateColumnDozenSelection(b.selection)) {
        throw new ApiError(400, "Column bet needs selection 1, 2, or 3");
      }
      if (b.type === "dozen" && !validateColumnDozenSelection(b.selection)) {
        throw new ApiError(400, "Dozen bet needs selection 1, 2, or 3");
      }
      if (b.type === "split" || b.type === "corner" || b.type === "street") {
        if (b.selection != null) {
          throw new ApiError(400, "Split/corner/street bets use selectionStr only");
        }
      }
      if ((b.type === "column" || b.type === "dozen") && b.selectionStr != null) {
        throw new ApiError(400, "Column/dozen bets use selection only");
      }
      if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0) {
        throw new ApiError(400, "Invalid amount");
      }
      if (!isValidBetStake(b.amount)) {
        throw new ApiError(
          400,
          `Each stake must be ₹${MIN_BET_AMOUNT}–₹${MAX_BET_AMOUNT} in multiples of ${BET_STEP}`
        );
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
        const selection =
          b.type === "straight" || b.type === "column" || b.type === "dozen"
            ? b.selection
            : null;
        const selectionStr =
          b.type === "split" || b.type === "corner" || b.type === "street"
            ? String(b.selectionStr).trim()
            : null;
        tx.set(betRef, {
          roundId,
          userId: decoded.uid,
          type: b.type,
          selection: selection ?? null,
          selectionStr,
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
