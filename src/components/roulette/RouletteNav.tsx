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
] as const;

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
    <header className="sticky top-0 z-40 border-b border-amber-900/40 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/roulette"
          className="shrink-0 text-xs font-semibold tracking-wide text-amber-400 transition hover:text-amber-300 sm:text-sm"
        >
          <span className="sm:hidden">RR</span>
          <span className="hidden sm:inline">Royal Roulette</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-hidden py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1.5 sm:text-sm ${
                  active
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <Link
            href="/"
            className="shrink-0 rounded-md px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 sm:rounded-full sm:px-3 sm:py-1.5 sm:text-sm"
          >
            <span className="sm:hidden">Exit</span>
            <span className="hidden sm:inline">Exit hub</span>
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {userEmail ? (
            <>
              <span className="hidden max-w-[120px] truncate text-[10px] text-zinc-500 md:inline lg:max-w-[140px]">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                title="Sign out"
                className="inline-flex items-center gap-0.5 rounded-md border border-zinc-700 px-1.5 py-1 text-[10px] text-zinc-300 hover:border-amber-600/50 hover:text-amber-200 sm:gap-1 sm:rounded-full sm:px-3 sm:py-1.5 sm:text-xs"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                <span>Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/roulette/login"
              className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-600 to-amber-500 px-2.5 py-1 text-[10px] font-semibold text-black hover:from-amber-500 hover:to-amber-400 sm:rounded-full sm:px-4 sm:py-2 sm:text-xs"
            >
              <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
