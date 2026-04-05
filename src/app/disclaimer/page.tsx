import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse } from "@/components/LegalProse";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "RoyalBetHub affiliate disclaimer: no wagering, no guarantees, 18+ only, and third-party operator terms apply.",
};

export default function DisclaimerPage() {
  return (
    <LegalProse>
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">Disclaimer</h1>
      <p className="text-[var(--text-secondary)]">Last updated: April 2026</p>
      <p>
        RoyalBetHub (“we”, “us”) is an <strong>independent affiliate information website</strong>.
        We do not operate gambling services, accept bets, or hold player funds.
      </p>
      <h2>Editorial &amp; affiliate relationship</h2>
      <p>
        Pages may contain <strong>affiliate links</strong>. If you register or deposit through those
        links, we may receive a commission from the operator at no extra cost to you. Commercial
        relationships can influence <em>placement or prominence</em> of listings but should not be
        mistaken for a guarantee of outcomes, odds, or bonus eligibility.
      </p>
      <h2>No promises of profit</h2>
      <p>
        Gambling involves risk. Past performance of a brand, game, or promotion does not predict
        future results. We do not provide financial, legal, or tax advice.
      </p>
      <h2>Accuracy</h2>
      <p>
        Offers, games, payment methods, and terms change frequently. Always confirm details on the
        operator&apos;s official site before depositing.
      </p>
      <p>
        <Link href="/legal-warning" className="text-amber-400 hover:underline">
          Legal warning (India)
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="text-amber-400 hover:underline">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="text-amber-400 hover:underline">
          Privacy
        </Link>
      </p>
    </LegalProse>
  );
}
