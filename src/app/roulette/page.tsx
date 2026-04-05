import { RouletteGameClient } from "@/components/roulette/RouletteGameClient";

export default function RoulettePage() {
  return (
    <div>
      <h1 className="text-center text-lg font-bold leading-tight tracking-tight text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text sm:text-3xl lg:text-4xl">
        European Roulette
      </h1>
      <div className="mt-3 sm:mt-8 lg:mt-10">
        <RouletteGameClient />
      </div>
    </div>
  );
}
