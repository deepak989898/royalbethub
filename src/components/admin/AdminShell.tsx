"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc as fsDoc, getDoc as fsGetDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type GateState = "loading" | "ok" | "no-auth" | "not-admin";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#0c0a12] px-4 py-20 text-center text-zinc-400">
        <p>
          Add Firebase keys to <code className="text-amber-400">.env.local</code> to use the admin
          panel.
        </p>
        <Link href="/" className="mt-4 inline-block text-amber-400 hover:underline">
          Home
        </Link>
      </div>
    );
  }

  if (isLogin) {
    return <>{children}</>;
  }

  return <RequireAdmin>{children}</RequireAdmin>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState("no-auth");
        router.replace("/admin/login");
        return;
      }
      const ref = fsDoc(getDb(), "admins", user.uid);
      const adminSnap = await fsGetDoc(ref);
      if (!adminSnap.exists()) {
        setState("not-admin");
        return;
      }
      setState("ok");
    });
  }, [router]);

  if (state === "loading" || state === "no-auth") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0a12] text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" aria-hidden />
      </div>
    );
  }

  if (state === "not-admin") {
    return (
      <div className="min-h-screen bg-[#0c0a12] px-4 py-20 text-center">
        <p className="text-zinc-300">This account is not an admin.</p>
        <p className="mt-2 text-sm text-zinc-500">
          In Firebase Console → Firestore, create <code className="text-amber-600">admins/&lt;your
          user uid&gt;</code> (empty map is fine).
        </p>
        <Link href="/" className="mt-6 inline-block text-amber-400 hover:underline">
          Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
