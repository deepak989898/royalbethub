import {
  cornerKeyFromRC,
  normalizeSplitKey,
  rcToNum,
  streetKeyFromCol,
} from "./table-layout";
import type { BetType } from "./types";

/** Payload from interpreting a click on the inside grid (numbers + zero). */
export type GridClickBet = {
  type: BetType;
  selection?: number;
  selectionStr?: string;
};

const CORNER = 0.2;
const EDGE = 0.18;
/** Bottom band on the lowest row of numbers → street (three in column). */
const STREET_Y = 0.82;

function splitOrNull(a: number, b: number): GridClickBet | null {
  const key = normalizeSplitKey(a, b);
  if (!key) return null;
  return { type: "split", selectionStr: key };
}

/**
 * Click inside a number cell (r,c). (x,y) are normalized to [0,1] within the cell
 * (left→right, top→bottom).
 */
export function resolveNumberCellClick(
  r: 0 | 1 | 2,
  c: number,
  x: number,
  y: number
): GridClickBet {
  const n = rcToNum(r, c);
  const inTopLeft = x < CORNER && y < CORNER;
  const inTopRight = x > 1 - CORNER && y < CORNER;
  const inBottomLeft = x < CORNER && y > 1 - CORNER;
  const inBottomRight = x > 1 - CORNER && y > 1 - CORNER;

  if (inTopLeft && r >= 1 && c >= 1) {
    const k = cornerKeyFromRC(r - 1, c - 1);
    if (k) return { type: "corner", selectionStr: k };
  }
  if (inTopRight && r >= 1 && c <= 10) {
    const k = cornerKeyFromRC(r - 1, c);
    if (k) return { type: "corner", selectionStr: k };
  }
  if (inBottomLeft && c >= 1) {
    const br = r <= 1 ? r : 1;
    const k = cornerKeyFromRC(br, c - 1);
    if (k) return { type: "corner", selectionStr: k };
  }
  if (inBottomRight && c <= 10) {
    const br = r <= 1 ? r : 1;
    const k = cornerKeyFromRC(br, c);
    if (k) return { type: "corner", selectionStr: k };
  }

  if (r === 2 && y >= STREET_Y && x >= CORNER && x <= 1 - CORNER) {
    const sk = streetKeyFromCol(c);
    if (sk) return { type: "street", selectionStr: sk };
  }

  if (y < EDGE && r > 0 && x >= CORNER && x <= 1 - CORNER) {
    const s = splitOrNull(rcToNum((r - 1) as 0 | 1 | 2, c), n);
    if (s) return s;
  }
  if (y > 1 - EDGE && r < 2 && x >= CORNER && x <= 1 - CORNER) {
    const s = splitOrNull(n, rcToNum((r + 1) as 0 | 1 | 2, c));
    if (s) return s;
  }
  if (x < EDGE && c > 0 && y >= CORNER && y <= 1 - CORNER) {
    const s = splitOrNull(rcToNum(r, c - 1), n);
    if (s) return s;
  }
  if (x > 1 - EDGE && c < 11 && y >= CORNER && y <= 1 - CORNER) {
    const s = splitOrNull(n, rcToNum(r, c + 1));
    if (s) return s;
  }

  return { type: "straight", selection: n };
}

/** Click on the zero cell; x,y normalized in [0,1] (left→right, top→bottom). */
export function resolveZeroCellClick(x: number, y: number): GridClickBet {
  if (x > 0.62) {
    if (y < 0.34) return { type: "split", selectionStr: "0-3" };
    if (y < 0.67) return { type: "split", selectionStr: "0-2" };
    return { type: "split", selectionStr: "0-1" };
  }
  return { type: "straight", selection: 0 };
}
