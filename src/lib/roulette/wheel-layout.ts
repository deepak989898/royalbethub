/** European wheel pocket order (clockwise from zero). */
export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

const STEP = 360 / EUROPEAN_WHEEL_ORDER.length;

export function pocketIndex(n: number): number {
  const i = EUROPEAN_WHEEL_ORDER.indexOf(n as (typeof EUROPEAN_WHEEL_ORDER)[number]);
  return i >= 0 ? i : 0;
}

/** Degrees to rotate the wheel (CW positive) so pocket `n` settles at the top pointer. */
export function targetRotationDegrees(n: number, fullSpins: number, currentDeg: number): number {
  const idx = pocketIndex(n);
  const pocketAngle = idx * STEP;
  const normalized = ((currentDeg % 360) + 360) % 360;
  const align = (360 - pocketAngle) % 360;
  const delta = align - normalized;
  const extra = delta <= 0 ? delta + 360 : delta;
  return currentDeg + fullSpins * 360 + extra;
}
