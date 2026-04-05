import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { ApiError, jsonError, jsonOk, requireAdmin } from "@/lib/roulette/api-auth";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import type { RouletteStateDoc } from "@/lib/roulette/server-state";

export async function PATCH(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    await requireAdmin(request);
    const body = (await request.json()) as {
      spinDurationSec?: number;
      rtpMode?: "auto" | "manual";
      manualNextNumber?: number | null;
    };

    const db = getAdminDb();
    const ref = db.collection("roulette_state").doc(ROULETTE_STATE_DOC);
    const snap = await ref.get();
    if (!snap.exists) {
      return jsonError(503, "Roulette state missing — call ensure-state first");
    }

    const updates: Partial<RouletteStateDoc> = {};
    if (body.spinDurationSec != null) {
      const n = Number(body.spinDurationSec);
      if (!Number.isFinite(n) || n < 5 || n > 120) {
        throw new ApiError(400, "spinDurationSec must be 5–120");
      }
      updates.spinDurationSec = Math.floor(n);
    }
    if (body.rtpMode === "auto" || body.rtpMode === "manual") {
      updates.rtpMode = body.rtpMode;
    }
    if (body.manualNextNumber !== undefined) {
      if (body.manualNextNumber === null) {
        updates.manualNextNumber = null;
      } else {
        const m = Number(body.manualNextNumber);
        if (!Number.isInteger(m) || m < 0 || m > 36) {
          throw new ApiError(400, "manualNextNumber must be 0–36 or null");
        }
        updates.manualNextNumber = m;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No valid fields");
    }

    await ref.update(updates);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    const msg = e instanceof Error ? e.message : "Update failed";
    return jsonError(500, msg);
  }
}
