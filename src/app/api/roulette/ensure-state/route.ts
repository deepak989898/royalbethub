import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { jsonError, jsonOk } from "@/lib/roulette/api-auth";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import { defaultRouletteState } from "@/lib/roulette/server-state";

export async function POST() {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured (FIREBASE_SERVICE_ACCOUNT_JSON).");
    }
    getFirebaseAdminApp();
    const db = getAdminDb();
    const ref = db.collection("roulette_state").doc(ROULETTE_STATE_DOC);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        tx.set(ref, defaultRouletteState(30));
        return;
      }
      const d = snap.data() ?? {};
      const patch: Record<string, unknown> = {};
      const dur = Number(d.spinDurationSec);
      if (dur === 15) {
        patch.spinDurationSec = 30;
      }
      const pfp = d.playerFavorPercent;
      if (pfp == null || !Number.isFinite(Number(pfp))) {
        patch.playerFavorPercent = 50;
      }
      if (Object.keys(patch).length > 0) {
        tx.update(ref, patch);
      }
    });
    return jsonOk({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to ensure state";
    return jsonError(500, msg);
  }
}
