import "#/talk/tokens.css";
import "./tui.css";
import type { Frame } from "#/engine/types";

import { GLYPH_PATHS } from "./glyph-data";
import { pileTiles, resolveCount, type CountSource } from "./tui-math";
import { setStyle, useFrameRef } from "./use-frame-ref";

export type PileProps = {
  /** Tiles pocketed over τ; a fractional count hops the newest tile in (see `pocketKeys`) */
  count: CountSource;
  /** Bottom-centre anchor in the parent's px (home shot: 1600, 560) */
  x: number;
  y: number;
  size?: number;
  max?: number;
};

/** Pocketed clay ✳ tiles: one saved token per tip. */
export function Pile({ count, x, y, size = 34, max = 12 }: PileProps) {
  const fn = resolveCount(count);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const tiles = pileTiles(fn(frame.tau), max, size);
    const els = root.children;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      const el = els[i];
      if (!t || !el) continue;
      setStyle(el, "visibility", t.visible ? "visible" : "hidden");
      setStyle(
        el,
        "transform",
        `translate3d(${(t.x - size / 2).toFixed(2)}px, ${(t.y - size / 2).toFixed(2)}px, 0) rotate(${t.rotate.toFixed(2)}deg) scale(${t.scale.toFixed(3)})`,
      );
    }
  });
  return (
    <div ref={ref} className="tui-pile" style={{ left: x, top: y }} aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <div key={`tile-${i + 1}`} className="tui-tile" style={{ width: size, height: size }}>
          <svg viewBox="0 0 100 100">
            <path d={GLYPH_PATHS["✳"]} fill="currentColor" />
          </svg>
        </div>
      ))}
    </div>
  );
}
