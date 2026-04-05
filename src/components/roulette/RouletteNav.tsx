"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, History, LogIn, LogOut, Wallet } from "lucide-react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const links = [
  { href: "/roulette", label: "Table", icon: Dices },
  { href: "/roulette/wallet", label: "Wallet", icon: Wallet },
  { href: "/roulette/history", label: "History", icon: History },
];

export function RouletteNav({
  userEmail,
  onSignOut,
}: {
  userEmail: string | null;
  onSignOut?: () => void;
}) {
  const pathname = usePathname();

  async function logout() {
    await signOut(getFirebaseAuth());
    onSignOut?.();
  }

  return (
    <header className="border-b border-amber-900/40 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/roulette"
          className="font-semibold tracking-wide text-amber-400 transition hover:text-amber-300"
        >
          Royal Roulette
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                  active
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-zinc-500 hover:text-zinc-300"
          >
            Exit hub
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {userEmail ? (
            <>
              <span className="hidden max-w-[140px] truncate text-xs text-zinc-500 sm:inline">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-amber-600/50 hover:text-amber-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                Out
              </button>
            </>
          ) : (
            <Link
              href="/roulette/login"
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-xs font-semibold text-black hover:from-amber-500 hover:to-amber-400"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
