"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0a12]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 shadow-lg shadow-amber-900/40">
            <Crown className="h-5 w-5 text-[#1a1005]" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight">
            Royal Bet <span className="text-amber-400">Hub</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/#compare"
            className="hidden rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white sm:inline"
          >
            Compare sites
          </Link>
          <Link
            href="/#bonus"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 font-medium text-[#1a1005] shadow-md shadow-amber-900/30 transition hover:from-amber-400 hover:to-amber-500"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            50% extra bonus
          </Link>
          <Link
            href="/admin/login"
            className="rounded-full border border-white/15 px-3 py-1.5 text-zinc-300 transition hover:border-amber-500/50 hover:text-amber-200"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
