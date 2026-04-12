/** European roulette red numbers (0 is green). */
export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function isRed(n: number): boolean {
  return RED_NUMBERS.has(n);
}

export function isBlack(n: number): boolean {
  return n !== 0 && !RED_NUMBERS.has(n);
}

export function colorOf(n: number): "green" | "red" | "black" {
  if (n === 0) return "green";
  return isRed(n) ? "red" : "black";
}

/** Payout multiplier (total return includes stake where applicable). */
export function straightMultiplier(): number {
  return 35;
}

export function evenMoneyMultiplier(): number {
  return 2;
}

/** 8:1 → return ×9. */
export function cornerMultiplier(): number {
  return 8;
}

/** Column / dozen 2:1 → return ×3. */
export function columnDozenMultiplier(): number {
  return 2;
}

/** Street 11:1 → return ×12. */
export function streetMultiplier(): number {
  return 11;
}
