/** European wheel pocket order (clockwise from zero). */
export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const WHEEL_STEP_DEG = 360 / EUROPEAN_WHEEL_ORDER.length;

export function pocketIndex(n: number): number {
  const i = EUROPEAN_WHEEL_ORDER.indexOf(n as (typeof EUROPEAN_WHEEL_ORDER)[number]);
  return i >= 0 ? i : 0;
}

/**
 * Clockwise degrees from 12 o'clock to the **center** of the pocket for `n` on a static wheel
 * (first divider at top; pocket 0 is the first slice below that edge).
 */
export function pocketCenterAngleDegreesFromTop(n: number): number {
  const idx = pocketIndex(n);
  return (idx + 0.5) * WHEEL_STEP_DEG;
}

/**
 * Framer-motion `rotate` for a ball arm pinned at wheel center: ball sits at top when angle is 0°;
 * positive = clockwise. Target angle so the ball rests over the pocket center.
 */
export function ballArmTargetDegrees(n: number, fullSpins: number, currentDeg: number): number {
  const thetaFinal = pocketCenterAngleDegreesFromTop(n);
  const normalized = ((currentDeg % 360) + 360) % 360;
  let delta = thetaFinal - normalized;
  if (delta < 0) delta += 360;
  return currentDeg + fullSpins * 360 + delta;
}

/** Wheel spins counter-clockwise (negative CSS degrees) while ball goes clockwise. */
export function wheelSpinTargetDegrees(fullSpins: number, currentDeg: number): number {
  const jitter = 15 + Math.random() * 25;
  return currentDeg - fullSpins * 360 - jitter;
}

/**
 * Ball is in the fixed overlay; wheel rotates underneath. Final ball angle (deg, CW from top)
 * must match pocket center on the wheel plus wheel rotation so the ball sits in the pocket.
 */
export function ballArmTargetWorldDegrees(
  n: number,
  fullSpins: number,
  currentBallDeg: number,
  finalWheelRotationDeg: number
): number {
  const L = pocketCenterAngleDegreesFromTop(n);
  const worldTarget = L + finalWheelRotationDeg;
  const normalized = ((currentBallDeg % 360) + 360) % 360;
  const tgt = ((worldTarget % 360) + 360) % 360;
  let delta = tgt - normalized;
  if (delta < 0) delta += 360;
  return currentBallDeg + fullSpins * 360 + delta;
}
