import { describe, expect, it } from "vitest";

import { STAGE_HEIGHT, STAGE_WIDTH } from "#/engine/stage/viewport";

import { CELL_SCALE, cellRect, gridBottom, GRID, moveSelection } from "./layout";

const COUNT = 36;

describe("cellRect", () => {
  it("should keep every cell at the stage's aspect ratio", () => {
    const { w, h } = cellRect(0);

    expect(w / h).toBeCloseTo(STAGE_WIDTH / STAGE_HEIGHT, 9);
    expect(STAGE_WIDTH * CELL_SCALE).toBeCloseTo(w, 9);
  });

  it("should center the grid and keep every stop on the stage", () => {
    const first = cellRect(0);
    const last = cellRect(COUNT - 1);

    expect(first.x).toBeCloseTo(STAGE_WIDTH - (last.x + last.w), 9);
    expect(gridBottom(COUNT)).toBe(last.y + last.h);
    expect(gridBottom(COUNT)).toBeLessThan(STAGE_HEIGHT - 80);
  });
});

describe("moveSelection", () => {
  it.each([
    ["ArrowRight", 7, 8],
    ["ArrowLeft", 7, 6],
    ["ArrowDown", 7, 7 + GRID.cols],
    ["ArrowUp", 7, 7 - GRID.cols],
    ["ArrowRight", 5, 6],
    ["Home", 20, 0],
    ["End", 3, COUNT - 1],
  ])("should move %s from cell %d to cell %d", (key, from, to) => {
    expect(moveSelection(from, key, COUNT)).toBe(to);
  });

  it.each([
    ["ArrowLeft", 0],
    ["ArrowRight", COUNT - 1],
    ["ArrowUp", 2],
    ["ArrowDown", COUNT - 2],
    ["x", 9],
  ])("should stay put on %s at the edge of the grid from cell %d", (key, from) => {
    expect(moveSelection(from, key, COUNT)).toBe(from);
  });

  it("should not move down into an empty cell of a short last row", () => {
    expect(moveSelection(28, "ArrowDown", 32)).toBe(28);
  });
});
