import {
  cornerKeyFromRC,
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

  /** Former split zones → straight on the number in this cell. */
  if (y < EDGE && r > 0 && x >= CORNER && x <= 1 - CORNER) {
    return { type: "straight", selection: n };
  }
  if (y > 1 - EDGE && r < 2 && x >= CORNER && x <= 1 - CORNER) {
    return { type: "straight", selection: n };
  }
  if (x < EDGE && c > 0 && y >= CORNER && y <= 1 - CORNER) {
    return { type: "straight", selection: n };
  }
  if (x > 1 - EDGE && c < 11 && y >= CORNER && y <= 1 - CORNER) {
    return { type: "straight", selection: n };
  }

  return { type: "straight", selection: n };
}

/** Click on the zero cell; x,y normalized in [0,1] (left→right, top→bottom). */
export function resolveZeroCellClick(x: number, y: number): GridClickBet {
  if (x > 0.62) {
    if (y < 0.34) return { type: "straight", selection: 3 };
    if (y < 0.67) return { type: "straight", selection: 2 };
    return { type: "straight", selection: 1 };
  }
  return { type: "straight", selection: 0 };
}
