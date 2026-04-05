import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse } from "@/components/LegalProse";

export const metadata: Metadata = {
  title: "Legal Warning (India)",
  description:
    "Important India legal notice: state-dependent gambling laws, affiliate publishing, 18+ requirement, and no direct wagering on RoyalBetHub.",
};

export default function LegalWarningPage() {
  return (
    <LegalProse>
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">
        Legal warning (India) <span aria-hidden>⚠️</span>
      </h1>
      <p className="text-[var(--text-secondary)]">
        Important — please read carefully. Last updated: April 2026.
      </p>

      <h2>1. State-dependent laws</h2>
      <p>
        In India, regulation of real-money games and betting is <strong>not uniform</strong>. Some
        states have enacted or amended rules that restrict or prohibit certain online activities.
        Other states are less specific. Laws can change.
      </p>
      <p>
        <strong>You are responsible</strong> for confirming what applies where you live before
        participating in any real-money gambling or betting product offered by third parties.
      </p>

      <h2>2. What RoyalBetHub does (and does not) do</h2>
      <ul>
        <li>
          We do <strong>not</strong> take bets, operate games, or hold balances.
        </li>
        <li>
          We publish <strong>editorial comparisons</strong> and may link to independent operators.
        </li>
        <li>
          Outbound links may include <strong>affiliate tracking</strong> so operators can attribute
          signups.
        </li>
      </ul>

      <h2>3. Affiliate promotion &amp; “gray area”</h2>
      <p>
        Affiliate marketing is widespread. In India, promoting offshore or domestic brands can sit
        in legally sensitive territory depending on format, targeting, and state rules. We aim to
        reduce risk by:
      </p>
      <ul>
        <li>avoiding claims of guaranteed winnings;</li>
        <li>disclosing the affiliate relationship (see Disclaimer);</li>
        <li>using clear <strong>18+</strong> warnings;</li>
        <li>not instructing users to break the law.</li>
      </ul>
      <p>This is not legal advice. Consult a qualified lawyer for compliance questions.</p>

      <h2>4. Age restriction</h2>
      <p>
        Gambling products are for <strong>adults only (18+)</strong> or the higher age required in
        your jurisdiction. Do not use this site if you are underage.
      </p>

      <h2>5. Responsible play</h2>
      <p>
        If gambling stops being fun, pause and seek help. Many operators provide self-exclusion and
        limit tools—use them.
      </p>

      <p className="pt-4">
        <Link href="/disclaimer" className="text-amber-400 hover:underline">
          Full disclaimer
        </Link>{" "}
        ·{" "}
        <Link href="/" className="text-amber-400 hover:underline">
          Home
        </Link>
      </p>
    </LegalProse>
  );
}
