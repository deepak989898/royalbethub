import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { defaultRouletteState } from "@/lib/roulette/server-state";
import { jsonError, jsonOk } from "@/lib/roulette/api-auth";

export async function POST() {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured (FIREBASE_SERVICE_ACCOUNT_JSON).");
    }
    getFirebaseAdminApp();
    const db = getAdminDb();
    const ref = db.collection("roulette_state").doc("global");
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        tx.set(ref, defaultRouletteState(30));
      }
    });
    return jsonOk({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to ensure state";
    return jsonError(500, msg);
  }
}
