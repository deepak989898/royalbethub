import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import {
  ApiError,
  handleRouteError,
  jsonError,
  jsonOk,
  requireUser,
} from "@/lib/roulette/api-auth";
import type { BetType } from "@/lib/roulette/types";
import { isValidBetStake } from "@/lib/roulette/types";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import type { RouletteStateDoc } from "@/lib/roulette/server-state";

/** Firestore transaction op budget (reads + writes); keep under ~500. */
const MAX_DOUBLE_LINES = 200;

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const decoded = await requireUser(request);
    const body = (await request.json()) as { roundId?: string };
    const roundId = body.roundId?.trim();
    if (!roundId) {
      throw new ApiError(400, "roundId required");
    }

    const db = getAdminDb();
    const stateRef = db.collection("roulette_state").doc(ROULETTE_STATE_DOC);
    const userRef = db.collection("roulette_users").doc(decoded.uid);

    const preSnap = await db.collection("roulette_bets").where("roundId", "==", roundId).get();
    const mineDocs = preSnap.docs.filter((d) => String(d.data().userId) === decoded.uid);
    if (mineDocs.length === 0) {
      throw new ApiError(400, "No bets to double this round");
    }
    if (mineDocs.length > MAX_DOUBLE_LINES) {
      throw new ApiError(
        400,
        `Too many bet lines to double at once (max ${MAX_DOUBLE_LINES}). Place a smaller set or wait for the next round.`
      );
    }

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

      const betSnaps = await Promise.all(mineDocs.map((d) => tx.get(d.ref)));
      let totalStake = 0;
      for (let i = 0; i < betSnaps.length; i++) {
        const bs = betSnaps[i]!;
        if (!bs.exists) {
          throw new ApiError(409, "Bets changed — try again");
        }
        const x = bs.data()!;
        if (String(x.roundId) !== roundId || String(x.userId) !== decoded.uid) {
          throw new ApiError(409, "Bets changed — try again");
        }
        const amt = Number(x.amount) || 0;
        if (!isValidBetStake(amt)) {
          throw new ApiError(400, "Invalid stored stake — contact support");
        }
        totalStake += amt;
      }

      const balance = Number(u.balance) || 0;
      if (balance < totalStake) {
        throw new ApiError(400, "Insufficient balance to double");
      }

      tx.update(userRef, { balance: balance - totalStake });

      for (const bs of betSnaps) {
        const x = bs.data()!;
        const newRef = db.collection("roulette_bets").doc();
        const selection =
          x.type === "straight" || x.type === "column" || x.type === "dozen"
            ? x.selection != null
              ? Number(x.selection)
              : null
            : null;
        const selectionStr =
          x.type === "corner" || x.type === "street"
            ? x.selectionStr != null && String(x.selectionStr).length > 0
              ? String(x.selectionStr)
              : null
            : null;
        tx.set(newRef, {
          roundId,
          userId: decoded.uid,
          type: x.type as BetType,
          selection: selection ?? null,
          selectionStr,
          amount: Number(x.amount) || 0,
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
