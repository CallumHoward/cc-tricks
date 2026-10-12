import "./kit-motion.css";
import { useRef } from "react";

import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { num, put } from "./dom";
import { flapAt, flapChar, type FlapOpts } from "./schedule";

type Cell = { id: string; to: string; delay: number; seed: number };

/** Pads rows to equal width and assigns each cell its stagger delay. */
function flapCells(
  rows: readonly string[],
  { rowStagger, colStagger }: { rowStagger: number; colStagger: number },
): { cols: number; cells: Cell[] } {
  const cols = Math.max(0, ...rows.map((r) => Array.from(r).length));
  const cells: Cell[] = [];
  rows.forEach((row, r) => {
    const chars = Array.from(row.padEnd(cols, " "));
    chars.forEach((ch, c) => {
      cells.push({
        id: `c${r}-${c}`,
        to: ch,
        delay: r * rowStagger + c * colStagger,
        seed: r * 131 + c,
      });
    });
  });
  return { cols, cells };
}

type FlapEls = { top: HTMLElement; bot: HTMLElement; leaf: HTMLElement; face: HTMLElement };

const setTextIfChanged = (el: HTMLElement, text: string) => {
  if (el.textContent !== text) el.textContent = text;
};

/** One cell at a flap step: static halves show the current glyph, the leaf flips to the next. */
function paintCell(
  el: FlapEls,
  cell: { to: string; seed: number },
  { step, phase }: { step: number; phase: number },
  flips: number,
) {
  const cur = flapChar(" ", cell.to, step, flips, cell.seed);
  const nxt = flapChar(" ", cell.to, step + 1, flips, cell.seed);
  const flipping = phase > 0;
  setTextIfChanged(el.top, flipping ? nxt : cur);
  setTextIfChanged(el.bot, cur);
  put(el.leaf, "visibility", flipping ? "visible" : "hidden");
  if (!flipping) return;
  const first = phase < 0.5;
  setTextIfChanged(el.face, first ? cur : nxt);
  put(el.leaf, "transform", `rotateX(${num(first ? -phase * 180 : 180 - phase * 180, 1)}deg)`);
  el.leaf.dataset.half = first ? "top" : "bottom";
}

/**
 * Split-flap board in mono cells; each cell flips through seeded glyphs and lands on its target.
 * Lands at `start + rowStagger·(rows−1) + colStagger·(cols−1) + flips·flipDur`.
 */
export function SplitFlap({
  rows,
  start,
  rowStagger = 0.16,
  colStagger = 0.04,
  flips = 5,
  flipDur = 0.07,
}: {
  rows: readonly string[];
  start: number;
  rowStagger?: number;
  colStagger?: number;
  flips?: number;
  flipDur?: number;
}) {
  const { cols, cells } = flapCells(rows, { rowStagger, colStagger });
  const opts: FlapOpts = { start, stagger: 0, flips, flipDur };
  const els = useRef<(FlapEls | null)[]>([]);

  useFrame((frame: Frame) => {
    cells.forEach((cell, i) => {
      const el = els.current[i];
      if (!el) return;
      paintCell(el, cell, flapAt(frame.tau, cell.delay, opts), flips);
    });
  });

  return (
    <div
      className="km-flap-board type-code"
      style={{ gridTemplateColumns: `repeat(${cols}, 1.15em)` }}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.id}
          className="km-flap"
          ref={(el) => {
            if (!el) {
              els.current[i] = null;
              return;
            }
            const q = (s: string) => el.querySelector<HTMLElement>(s) as HTMLElement;
            els.current[i] = {
              top: q(".km-flap-top > span"),
              bot: q(".km-flap-bot > span"),
              leaf: q(".km-flap-leaf"),
              face: q(".km-flap-leaf > span"),
            };
          }}
        >
          <div className="km-flap-top">
            <span> </span>
          </div>
          <div className="km-flap-bot">
            <span> </span>
          </div>
          <div className="km-flap-leaf" data-half="top">
            <span> </span>
          </div>
        </div>
      ))}
    </div>
  );
}
