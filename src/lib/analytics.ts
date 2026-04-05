"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";

const SESSION_KEY = "rbh_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function logVisit(path: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await addDoc(collection(getDb(), "analytics_events"), {
      type: "visit",
      createdAt: serverTimestamp(),
      path,
      sessionId: getOrCreateSessionId(),
    });
  } catch {
    /* non-blocking */
  }
}

export async function logClick(siteSlug: string, path?: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await addDoc(collection(getDb(), "analytics_events"), {
      type: "click",
      createdAt: serverTimestamp(),
      siteSlug,
      path: path ?? (typeof window !== "undefined" ? window.location.pathname : ""),
      sessionId: getOrCreateSessionId(),
    });
  } catch {
    /* non-blocking */
  }
}
