"use client";

import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";

const NAV = [
  { href: "/#compare", label: "Casinos" },
  { href: "/bonus-offers", label: "Bonuses" },
  { href: "/blog", label: "Blog" },
  { href: "/legal-warning", label: "Legal" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0a12]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-white" onClick={() => setOpen(false)}>
          <BrandLogo priority />
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/#bonus"
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 font-medium text-[#1a1005] shadow-md shadow-amber-900/30 transition hover:from-amber-400 hover:to-amber-500"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            50% extra
          </Link>
          <Link
            href="/admin/login"
            className="rounded-full border border-white/15 px-3 py-1.5 text-zinc-300 transition hover:border-amber-500/50 hover:text-amber-200"
          >
            Admin
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex rounded-lg border border-white/15 p-2 text-zinc-200 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#0c0a12] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-2 text-zinc-200 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/#bonus"
              className="rounded-lg bg-amber-500 px-3 py-2 font-medium text-[#1a1005]"
              onClick={() => setOpen(false)}
            >
              50% extra bonus
            </Link>
            <Link
              href="/admin/login"
              className="rounded-lg border border-white/15 px-3 py-2 text-zinc-300"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
