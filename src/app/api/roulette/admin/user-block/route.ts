import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { ApiError, jsonError, jsonOk, requireAdmin } from "@/lib/roulette/api-auth";

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    await requireAdmin(request);
    const body = (await request.json()) as { uid?: string; blocked?: boolean };
    const uid = body.uid?.trim();
    if (!uid || typeof body.blocked !== "boolean") {
      throw new ApiError(400, "uid and blocked boolean required");
    }

    const db = getAdminDb();
    const ref = db.collection("roulette_users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new ApiError(404, "User not in roulette_users");
    }
    await ref.update({ blocked: body.blocked });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    const msg = e instanceof Error ? e.message : "Failed";
    return jsonError(500, msg);
  }
}
