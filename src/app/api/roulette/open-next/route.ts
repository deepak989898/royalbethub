import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { ApiError, handleRouteError, jsonError, jsonOk } from "@/lib/roulette/api-auth";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import type { RouletteStateDoc } from "@/lib/roulette/server-state";

export async function POST() {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const db = getAdminDb();
    const stateRef = db.collection("roulette_state").doc(ROULETTE_STATE_DOC);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(stateRef);
      if (!snap.exists) throw new ApiError(503, "Game not initialized");
      const st = snap.data() as RouletteStateDoc;
      if (st.phase !== "result") {
        throw new ApiError(409, "Not in result phase");
      }
      if (!st.resultShownUntil || st.resultShownUntil.toMillis() > Date.now()) {
        throw new ApiError(409, "Result still showing");
      }

      const dur = Math.max(5, Math.min(120, Number(st.spinDurationSec) || 30));
      const newRoundId = crypto.randomUUID();
      const endsAt = admin.firestore.Timestamp.fromMillis(Date.now() + dur * 1000);

      tx.update(stateRef, {
        phase: "betting",
        roundId: newRoundId,
        sequence: FieldValue.increment(1),
        endsAt,
        winningNumber: null,
        resultShownUntil: null,
      });
    });

    const after = await stateRef.get();
    const d = after.data() as RouletteStateDoc;
    return jsonOk({
      roundId: d.roundId,
      endsAt: d.endsAt?.toMillis(),
      sequence: d.sequence,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    return handleRouteError(e);
  }
}
