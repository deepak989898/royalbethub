import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { ApiError, jsonError, jsonOk, requireAdmin } from "@/lib/roulette/api-auth";

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    await requireAdmin(request);
    const body = (await request.json()) as {
      id?: string;
      action?: "approve" | "reject";
    };
    const id = body.id?.trim();
    if (!id || (body.action !== "approve" && body.action !== "reject")) {
      throw new ApiError(400, "id and action (approve|reject) required");
    }

    const db = getAdminDb();
    const wRef = db.collection("roulette_withdrawals").doc(id);

    await db.runTransaction(async (tx) => {
      const wSnap = await tx.get(wRef);
      if (!wSnap.exists) throw new ApiError(404, "Request not found");
      const w = wSnap.data()!;
      if (w.status !== "pending") {
        throw new ApiError(409, "Already processed");
      }

      if (body.action === "reject") {
        tx.update(wRef, {
          status: "rejected",
          processedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const uid = w.userId as string;
      const amount = Number(w.amount) || 0;
      const userRef = db.collection("roulette_users").doc(uid);
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists) throw new ApiError(400, "User wallet missing");
      const bal = Number(uSnap.data()?.balance) || 0;
      if (bal < amount) throw new ApiError(400, "User balance too low");

      const txLog = db.collection("roulette_transactions").doc();
      tx.update(userRef, { balance: bal - amount });
      tx.set(txLog, {
        userId: uid,
        type: "withdraw",
        amount: -amount,
        balanceAfter: bal - amount,
        withdrawalId: id,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(wRef, {
        status: "approved",
        processedAt: FieldValue.serverTimestamp(),
      });
    });

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    const msg = e instanceof Error ? e.message : "Failed";
    return jsonError(500, msg);
  }
}
