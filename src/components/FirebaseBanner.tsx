"use client";

import { isFirebaseConfigured } from "@/lib/firebase";

export function FirebaseBanner() {
  if (isFirebaseConfigured()) return null;
  return (
    <div className="border-b border-amber-500/40 bg-amber-100 px-4 py-3 text-center text-sm text-amber-950 dark:bg-amber-950/90 dark:text-amber-100">
      <strong className="text-amber-800 dark:text-amber-300">Setup:</strong> Copy{" "}
      <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-black/30">
        env.local.example
      </code>{" "}
      to{" "}
      <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-black/30">.env.local</code>{" "}
      and add your Firebase web app keys. Deploy{" "}
      <code className="text-xs dark:bg-black/30">firestore.rules</code> in the Firebase console.
    </div>
  );
}
