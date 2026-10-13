import { STAGE_WIDTH } from "#/engine/stage/viewport";

/** Overview grid geometry in logical stage px: 6 × 6 cells hold all 36 stops. */
export const GRID = Object.freeze({
  cols: 6,
  cellW: 240,
  cellH: 135,
  gapX: 22,
  gapY: 18,
  top: 44,
});

type CellRect = { x: number; y: number; w: number; h: number };

const gridWidth = GRID.cols * GRID.cellW + (GRID.cols - 1) * GRID.gapX;

export function cellRect(index: number): CellRect {
  const col = index % GRID.cols;
  const row = Math.floor(index / GRID.cols);
  return {
    x: (STAGE_WIDTH - gridWidth) / 2 + col * (GRID.cellW + GRID.gapX),
    y: GRID.top + row * (GRID.cellH + GRID.gapY),
    w: GRID.cellW,
    h: GRID.cellH,
  };
}

/** Bottom edge of the last row, for placing the caption under the grid. */
export function gridBottom(count: number): number {
  const rows = Math.ceil(count / GRID.cols);
  return GRID.top + rows * GRID.cellH + (rows - 1) * GRID.gapY;
}

/** Scale that shrinks the full stage into one cell. */
export const CELL_SCALE = GRID.cellW / STAGE_WIDTH;

/** Distance between two cells in grid units, for staggering the reveal outward. */
export function cellDistance(a: number, b: number): number {
  const dx = (a % GRID.cols) - (b % GRID.cols);
  const dy = Math.floor(a / GRID.cols) - Math.floor(b / GRID.cols);
  return Math.hypot(dx, dy);
}

/** Grid-aware selection move; returns the same index when the key doesn't move it. */
export function moveSelection(index: number, key: string, count: number): number {
  const last = count - 1;
  const clamp = (i: number) => Math.min(last, Math.max(0, i));
  switch (key) {
    case "ArrowRight":
    case "PageDown":
    case " ":
      return clamp(index + 1);
    case "ArrowLeft":
    case "PageUp":
      return clamp(index - 1);
    case "ArrowDown":
      return index + GRID.cols <= last ? index + GRID.cols : index;
    case "ArrowUp":
      return index - GRID.cols >= 0 ? index - GRID.cols : index;
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return index;
  }
}
