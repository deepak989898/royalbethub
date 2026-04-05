import Link from "next/link";

const LEGAL = [
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/legal-warning", label: "Legal Warning" },
];

const MORE = [
  { href: "/blog", label: "Blog" },
  { href: "/bonus-offers", label: "Bonus offers" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--footer-bg)] py-10 text-sm text-[var(--text-secondary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="max-w-3xl leading-relaxed text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">18+ only.</strong> Gambling can be addictive.
          Play responsibly. RoyalBetHub compares operator offers for information only. Offers, terms,
          and availability vary by region and operator—always read the site&apos;s terms before
          depositing.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Legal
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-amber-600 dark:hover:text-amber-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Explore
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {MORE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-amber-600 dark:hover:text-amber-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-[var(--text-tertiary)]">
          © {new Date().getFullYear()} RoyalBetHub. Independent comparison site. Not a gambling
          operator.
        </p>
      </div>
    </footer>
  );
}
