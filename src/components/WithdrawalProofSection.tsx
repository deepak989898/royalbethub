import { BadgeCheck } from "lucide-react";

const EXAMPLES = [
  {
    title: "UPI withdrawal",
    detail: "Typical review window 24–72h after KYC — varies by operator.",
  },
  {
    title: "Bank transfer",
    detail: "Larger cashouts may need extra compliance checks.",
  },
  {
    title: "E-wallet",
    detail: "Often faster once account is verified; limits apply.",
  },
];

export function WithdrawalProofSection() {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 sm:p-8 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-[var(--text-primary)]">
        <BadgeCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <h2 className="text-xl font-semibold">Withdrawal transparency (trust)</h2>
      </div>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        We don&apos;t publish private user receipts. Below is educational guidance on what healthy
        operators communicate. Always screenshot your own confirmations for disputes.
      </p>
      <ul className="mt-6 space-y-4">
        {EXAMPLES.map((x) => (
          <li
            key={x.title}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)] dark:bg-black/20"
          >
            <strong className="text-[var(--text-primary)]">{x.title}</strong>
            <span className="mt-1 block text-[var(--text-tertiary)]">{x.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
