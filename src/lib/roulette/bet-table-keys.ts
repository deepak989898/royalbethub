/**
 * Parse inside-bet total keys from `clientBetKey` / `aggregate()` (straight uses `s-{n}`).
 * Returns numbers on the main grid (incl. 0) covered by that key; null for outside bets.
 */
export function numbersInBetTotalKey(key: string): number[] | null {
  if (key.startsWith("s-")) {
    const v = parseInt(key.slice(2), 10);
    return Number.isNaN(v) ? null : [v];
  }
  if (key.startsWith("corner-")) {
    const parts = key.slice(7).split("-").map((p) => parseInt(p, 10));
    return parts.some((x) => Number.isNaN(x)) ? null : parts;
  }
  if (key.startsWith("street-")) {
    const parts = key.slice(7).split("-").map((p) => parseInt(p, 10));
    return parts.some((x) => Number.isNaN(x)) ? null : parts;
  }
  return null;
}
