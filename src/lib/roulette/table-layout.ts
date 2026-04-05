/** European racetrack grid: row 0 top = 3,6,…,36 — row 2 bottom = 1,4,…,34 */

export const GRID_ROWS = 3;
export const GRID_COLS = 12;

export function rcToNum(r: number, c: number): number {
  return (3 - r) + 3 * c;
}

export function numToRC(n: number): { r: number; c: number } | null {
  if (n < 1 || n > 36) return null;
  const c = Math.floor((n - 1) / 3);
  const rowFromBottom = (n - 1) % 3;
  const r = 2 - rowFromBottom;
  return { r, c };
}

/** Sorted "a-b" with a<b, or null if not adjacent (incl. 0–1, 0–2, 0–3). */
export function normalizeSplitKey(a: number, b: number): string | null {
  let x = a;
  let y = b;
  if (x > y) [x, y] = [y, x];
  if (x < 0 || y > 36 || x === y) return null;
  if (x === 0) {
    if (y === 1 || y === 2 || y === 3) return `0-${y}`;
    return null;
  }
  const ra = numToRC(x);
  const rb = numToRC(y);
  if (!ra || !rb) return null;
  const horiz = ra.r === rb.r && Math.abs(ra.c - rb.c) === 1;
  const vert = ra.c === rb.c && Math.abs(ra.r - rb.r) === 1;
  if (horiz || vert) return `${x}-${y}`;
  return null;
}

export function parseSplitKey(key: string): [number, number] | null {
  const m = /^(\d+)-(\d+)$/.exec(key.trim());
  if (!m) return null;
  const a = parseInt(m[1]!, 10);
  const b = parseInt(m[2]!, 10);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return [a, b];
}

export function isValidSplitKey(key: string): boolean {
  const p = parseSplitKey(key);
  if (!p) return false;
  return normalizeSplitKey(p[0], p[1]) === key;
}

/** 2×2 block top-left (r,c); r∈{0,1}, c∈{0..10} */
export function cornerKeyFromRC(r: number, c: number): string | null {
  if (r < 0 || r > 1 || c < 0 || c > 10) return null;
  const nums = [
    rcToNum(r, c),
    rcToNum(r, c + 1),
    rcToNum(r + 1, c),
    rcToNum(r + 1, c + 1),
  ];
  return [...nums].sort((a, b) => a - b).join("-");
}

export function isValidCornerKey(key: string): boolean {
  const parts = key.split("-").map((s) => parseInt(s, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  for (let r = 0; r <= 1; r++) {
    for (let c = 0; c <= 10; c++) {
      if (cornerKeyFromRC(r, c) === key) return true;
    }
  }
  return false;
}

/** Column 1: 1,4,7,… — 2: 2,5,8,… — 3: 3,6,9,… (0 loses). */
export function columnIndex(n: number): 1 | 2 | 3 | null {
  if (n === 0) return null;
  const r = n % 3;
  if (r === 1) return 1;
  if (r === 2) return 2;
  return 3;
}

export function dozenIndex(n: number): 1 | 2 | 3 | null {
  if (n === 0) return null;
  if (n <= 12) return 1;
  if (n <= 24) return 2;
  return 3;
}

export const SPIN_ANIMATION_MS = 5400;
