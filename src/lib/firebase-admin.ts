import * as admin from "firebase-admin";

let initAttempted = false;

function parseServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getFirebaseAdminApp(): admin.app.App {
  if (!initAttempted) {
    initAttempted = true;
    if (!admin.apps.length) {
      const sa = parseServiceAccount();
      if (sa) {
        admin.initializeApp({
          credential: admin.credential.cert(sa as admin.ServiceAccount),
        });
      }
    }
  }
  if (!admin.apps.length) {
    throw new Error("Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON in .env.local.");
  }
  return admin.app();
}

export function getAdminDb(): admin.firestore.Firestore {
  return getFirebaseAdminApp().firestore();
}

export function getAdminAuth(): admin.auth.Auth {
  return getFirebaseAdminApp().auth();
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}
