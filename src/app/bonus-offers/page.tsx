import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { BonusLeadForm } from "@/components/BonusLeadForm";

export const metadata: Metadata = {
  title: "Bonus offers — welcome & no-deposit style deals",
  description:
    "Welcome offers, no-deposit style promotions (where available), and hub-exclusive bonus eligibility for Indian players. 18+ affiliate hub.",
  keywords: [
    "casino welcome bonus India",
    "no deposit bonus India",
    "online betting bonus India",
  ],
};

export default function BonusOffersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
          <Gift className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Bonus offers hub</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Welcome packs, reload promos, and no-deposit style credits when operators run them.
          </p>
        </div>
      </div>

      <section className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-zinc-300">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-amber-400" aria-hidden />
          How to read bonuses
        </h2>
        <p>
          <strong className="text-zinc-100">Welcome offers</strong> usually match a percentage of
          your first deposit up to a cap. Wagering (rollover), game weighting, and time limits
          decide real value—always read the operator T&amp;Cs.
        </p>
        <p>
          <strong className="text-zinc-100">No-deposit bonuses</strong> appear rarely and often
          carry strict verification or win caps. We list them when partners provide stable public
          wording; availability changes by region and compliance.
        </p>
        <p>
          Browse live partner cards on the{" "}
          <Link href="/#compare" className="text-amber-400 hover:underline">
            homepage listings
          </Link>{" "}
          — promo codes appear on cards when configured in admin.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-center text-xl font-semibold text-white">Hub-exclusive 50% uplift</h2>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Submit your details after using our partner links; see form disclaimer for timing and
          eligibility.
        </p>
        <div className="mt-8">
          <BonusLeadForm />
        </div>
      </section>
    </div>
  );
}
