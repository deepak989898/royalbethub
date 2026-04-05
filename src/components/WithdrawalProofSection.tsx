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
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center gap-2 text-white">
        <BadgeCheck className="h-6 w-6 text-emerald-400" aria-hidden />
        <h2 className="text-xl font-semibold">Withdrawal transparency (trust)</h2>
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        We don&apos;t publish private user receipts. Below is educational guidance on what healthy
        operators communicate. Always screenshot your own confirmations for disputes.
      </p>
      <ul className="mt-6 space-y-4">
        {EXAMPLES.map((x) => (
          <li
            key={x.title}
            className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-zinc-300"
          >
            <strong className="text-zinc-100">{x.title}</strong>
            <span className="mt-1 block text-zinc-500">{x.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
