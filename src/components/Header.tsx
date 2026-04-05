"use client";

import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/#compare", label: "Casinos" },
  { href: "/bonus-offers", label: "Bonuses" },
  { href: "/blog", label: "Blog" },
  { href: "/legal-warning", label: "Legal" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <BrandLogo priority />
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/#bonus"
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 font-medium text-[#1a1005] shadow-md shadow-amber-900/20 transition hover:from-amber-400 hover:to-amber-500 dark:shadow-amber-900/30"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            50% extra
          </Link>
          <ThemeToggle />
          <Link
            href="/admin/login"
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[var(--text-secondary)] transition hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-200"
          >
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex rounded-lg border border-[var(--border)] p-2 text-[var(--text-primary)]"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
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
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)]"
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
