import { clientBetKey } from "@/lib/roulette/types";
import type { BetType } from "@/lib/roulette/types";

export type PlacedLine = {
  type: BetType;
  selection?: number;
  selectionStr?: string;
  amount: number;
};

function lineKey(b: PlacedLine): string {
  return clientBetKey(b.type, b.selection, b.selectionStr);
}

/** Merge bet lines by layout key (same as staging / Firestore aggregation). */
export function mergePlacedLines(existing: PlacedLine[], additions: PlacedLine[]): PlacedLine[] {
  const m = new Map<string, PlacedLine>();
  for (const b of existing) {
    m.set(lineKey(b), { ...b });
  }
  for (const b of additions) {
    const k = lineKey(b);
    const cur = m.get(k);
    if (cur) {
      m.set(k, { ...cur, amount: cur.amount + b.amount });
    } else {
      m.set(k, { ...b });
    }
  }
  return [...m.values()];
}
