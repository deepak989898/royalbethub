import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth, getAdminDb, getFirebaseAdminApp } from "@/lib/firebase-admin";

export async function verifyIdTokenFromRequest(
  request: Request
): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token) return null;
  try {
    getFirebaseAdminApp();
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(request: Request): Promise<DecodedIdToken> {
  const decoded = await verifyIdTokenFromRequest(request);
  if (!decoded) {
    throw new ApiError(401, "Unauthorized");
  }
  return decoded;
}

export async function requireAdmin(request: Request): Promise<DecodedIdToken> {
  const decoded = await requireUser(request);
  const snap = await getAdminDb().collection("admins").doc(decoded.uid).get();
  if (!snap.exists) {
    throw new ApiError(403, "Admin only");
  }
  return decoded;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function handleRouteError(e: unknown): Response {
  if (e instanceof ApiError) {
    return jsonError(e.status, e.message);
  }
  const msg = e instanceof Error ? e.message : "Internal error";
  return jsonError(500, msg);
}
