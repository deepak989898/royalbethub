import { RouletteHistoryClient } from "@/components/roulette/RouletteHistoryClient";

export default function RouletteHistoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-100">Bet &amp; wallet history</h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-500">
        Ledger entries for deposits and withdrawals. Individual roulette bets are stored per round on
        the server; this view shows your account movements.
      </p>
      <div className="mt-8">
        <RouletteHistoryClient />
      </div>
    </div>
  );
}
