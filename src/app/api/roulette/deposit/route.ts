import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/roulette/api-auth";

const MAX_DEPOSIT = 1_000_000;

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const decoded = await requireUser(request);
    const body = (await request.json()) as { amount?: number };
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > MAX_DEPOSIT) {
      throw new ApiError(400, `Amount must be between 1 and ${MAX_DEPOSIT}`);
    }

    const db = getAdminDb();
    const userRef = db.collection("roulette_users").doc(decoded.uid);
    const txRef = db.collection("roulette_transactions").doc();

    await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) throw new ApiError(400, "Wallet not initialized");
      const bal = Number(snap.data()?.balance) || 0;
      t.update(userRef, { balance: bal + amount });
      t.set(txRef, {
        userId: decoded.uid,
        type: "deposit",
        amount,
        balanceAfter: bal + amount,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    const msg = e instanceof Error ? e.message : "Deposit failed";
    return jsonError(500, msg);
  }
}
