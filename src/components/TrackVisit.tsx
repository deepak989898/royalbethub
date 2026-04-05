"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { logVisit } from "@/lib/analytics";

const FLAG = "rbh_visit_logged";

export function TrackVisit() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseConfigured() || !pathname) return;
    if (pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/go/")) return;
    const key = `${FLAG}:${pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void logVisit(pathname);
  }, [pathname]);

  return null;
}
