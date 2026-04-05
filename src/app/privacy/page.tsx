import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse } from "@/components/LegalProse";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How RoyalBetHub handles analytics events, optional bonus lead forms, and third-party services like Firebase.",
};

export default function PrivacyPage() {
  return (
    <LegalProse>
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
      <p className="text-[var(--text-secondary)]">Last updated: April 2026</p>
      <h2>Who we are</h2>
      <p>
        RoyalBetHub operates this website as a comparison hub. Contact paths are published on the
        site footer as you configure them.
      </p>
      <h2>Data we may collect</h2>
      <ul>
        <li>
          <strong>Analytics events</strong> such as page visits and outbound partner clicks (via
          Firebase/Firestore when configured).
        </li>
        <li>
          <strong>Bonus enquiry forms</strong> (name, email, phone) when you voluntarily submit
          them.
        </li>
        <li>
          <strong>Technical data</strong> from standard server/CDN logs (IP, user agent) as handled
          by your hosting provider (e.g. Vercel).
        </li>
      </ul>
      <h2>Purpose</h2>
      <p>
        We use data to operate the site, measure performance, improve content, and (for forms)
        respond to bonus eligibility requests you initiate.
      </p>
      <h2>Sharing</h2>
      <p>
        We use infrastructure providers (e.g. Google Firebase, Vercel). We do not sell your
        personal data. Operators you join are independent controllers of data you give them.
      </p>
      <h2>Retention</h2>
      <p>
        Retention depends on admin settings and provider defaults. You may request deletion of form
        submissions where applicable law requires it.
      </p>
      <h2>Your choices</h2>
      <p>
        You can use browser controls to limit cookies where applicable. Do not submit forms if you
        do not want us to store those details.
      </p>
      <p>
        <Link href="/terms" className="text-amber-400 hover:underline">
          Terms
        </Link>
      </p>
    </LegalProse>
  );
}
