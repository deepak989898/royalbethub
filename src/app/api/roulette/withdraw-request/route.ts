import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/roulette/api-auth";

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const decoded = await requireUser(request);
    const body = (await request.json()) as { amount?: number };
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      throw new ApiError(400, "Invalid amount");
    }

    const db = getAdminDb();
    const userRef = db.collection("roulette_users").doc(decoded.uid);
    const uSnap = await userRef.get();
    if (!uSnap.exists) throw new ApiError(400, "Wallet not initialized");
    const bal = Number(uSnap.data()?.balance) || 0;
    if (uSnap.data()?.blocked) throw new ApiError(403, "Account blocked");
    if (bal < amount) throw new ApiError(400, "Insufficient balance");

    const wRef = db.collection("roulette_withdrawals").doc();
    await wRef.set({
      userId: decoded.uid,
      email: decoded.email ?? "",
      amount,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    return jsonOk({ id: wRef.id });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    const msg = e instanceof Error ? e.message : "Request failed";
    return jsonError(500, msg);
  }
}
