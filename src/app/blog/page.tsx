import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog — casino apps, betting & withdrawals (India SEO)",
  description:
    "Guides on best casino apps in India, online betting real money, withdrawals, legality, and operator reviews for search-friendly long-form content.",
  keywords: [
    "best casino apps in India",
    "online betting real money India",
    "1xbet review India",
    "how to withdraw betting India",
    "is online betting legal India",
  ],
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">RoyalBetHub blog</h1>
      <p className="mt-4 text-[var(--text-secondary)]">
        Long-form articles aimed at helpful SEO coverage: apps, payments, legality, and reviews.
        18+ only; informational—not legal advice.
      </p>
      <ul className="mt-10 space-y-6">
        {BLOG_POSTS.map((p) => (
          <li
            key={p.slug}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-sm transition hover:border-amber-500/40 dark:shadow-none dark:hover:border-amber-500/30"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              {p.publishedAt}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              <Link href={`/blog/${p.slug}`} className="hover:text-amber-600 dark:hover:text-amber-300">
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.description}</p>
            <Link
              href={`/blog/${p.slug}`}
              className="mt-3 inline-block text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              Read article →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
