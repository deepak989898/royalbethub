import { RouletteGameClient } from "@/components/roulette/RouletteGameClient";

export default function RoulettePage() {
  return (
    <div role="main" aria-label="European Roulette">
      <h1 className="hidden text-center text-3xl font-bold leading-tight tracking-tight text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text sm:block lg:text-4xl">
        European Roulette
      </h1>
      <div className="mt-0 sm:mt-[10px] lg:mt-[10px]">
        <RouletteGameClient />
      </div>
    </div>
  );
}
