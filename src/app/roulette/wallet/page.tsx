import { RouletteWalletClient } from "@/components/roulette/RouletteWalletClient";

export default function RouletteWalletPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-100">Wallet</h1>
      <p className="mt-2 text-sm text-zinc-500">Simulated credits — not real money.</p>
      <div className="mt-8">
        <RouletteWalletClient />
      </div>
    </div>
  );
}
