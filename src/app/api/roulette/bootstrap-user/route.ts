import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { jsonError, jsonOk, requireUser } from "@/lib/roulette/api-auth";

const STARTING_BALANCE = 5000;

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const decoded = await requireUser(request);
    const db = getAdminDb();
    const ref = db.collection("roulette_users").doc(decoded.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        balance: STARTING_BALANCE,
        blocked: false,
        email: decoded.email ?? "",
        displayName: decoded.name ?? "",
        createdAt: FieldValue.serverTimestamp(),
      });
      return jsonOk({ created: true, balance: STARTING_BALANCE });
    }
    return jsonOk({ created: false, balance: snap.data()?.balance ?? 0 });
  } catch (e) {
    if (e instanceof Error && "status" in e) {
      const err = e as Error & { status: number };
      return jsonError(err.status, err.message);
    }
    const msg = e instanceof Error ? e.message : "Bootstrap failed";
    return jsonError(500, msg);
  }
}
