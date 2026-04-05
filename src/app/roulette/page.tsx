import { RouletteGameClient } from "@/components/roulette/RouletteGameClient";

export default function RoulettePage() {
  return (
    <div>
      <h1 className="text-center text-3xl font-bold tracking-tight text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text sm:text-4xl">
        European Roulette
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-500">
        Live rounds, shared timer, server-side outcomes. Sign in to bet with your hub wallet balance.
      </p>
      <div className="mt-10">
        <RouletteGameClient />
      </div>
    </div>
  );
}
