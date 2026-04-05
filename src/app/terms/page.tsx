import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse } from "@/components/LegalProse";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of use for RoyalBetHub: acceptable use, disclaimers, and limitation of liability.",
};

export default function TermsPage() {
  return (
    <LegalProse>
      <h1 className="text-3xl font-bold text-white">Terms &amp; Conditions</h1>
      <p className="text-zinc-400">Last updated: April 2026</p>
      <h2>1. Agreement</h2>
      <p>
        By accessing RoyalBetHub you agree to these Terms. If you disagree, do not use the site.
      </p>
      <h2>2. Eligibility</h2>
      <p>
        You must be <strong>at least 18 years old</strong> (or the legal age in your jurisdiction,
        whichever is higher). We may block access where required.
      </p>
      <h2>3. Not a gambling operator</h2>
      <p>
        We publish comparisons and links. All real-money play happens on third-party platforms
        under their rules, licences (if any), and risk controls.
      </p>
      <h2>4. Acceptable use</h2>
      <ul>
        <li>No scraping that harms site performance; no attempts to bypass security.</li>
        <li>No unlawful, harassing, or fraudulent activity tied to our brand or forms.</li>
      </ul>
      <h2>5. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, RoyalBetHub and its operators are not liable for
        losses arising from your use of third-party gambling services, bonus disputes, or site
        downtime.
      </p>
      <h2>6. Changes</h2>
      <p>We may update these Terms; continued use means acceptance of the revised Terms.</p>
      <p>
        <Link href="/privacy" className="text-amber-400 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </LegalProse>
  );
}
