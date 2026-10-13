import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";

import { ShadersLayer } from "#/engine/gl/shaders-layer";
import type { SpringCfg } from "#/engine/motion/spring";
import { useFrame, useStage, useStageSnapshot } from "#/engine/stage/react";
import { PRIORITY, type StageCommand } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import { cursorField } from "./field";
import { cellDistance, cellRect, gridBottom, moveSelection } from "./layout";
import {
  cellGoal,
  clamp01,
  keyIntent,
  liveStyle,
  resting,
  step,
  stepRing,
  type Spring,
} from "./motion";
import { THUMBS } from "./thumbs";

import "./overview.css";

export type OverviewStop = { id: string; title: string };

/** Zoom between the live stage and its cell: a touch of overshoot opening, none closing. */
const ZOOM_OUT: SpringCfg = { zeta: 0.8, omega: 11 };
const ZOOM_IN: SpringCfg = { zeta: 0.92, omega: 13 };
/** Neighbor cells pop in staggered outward from the live cell. */
const CELL_IN: SpringCfg = { zeta: 0.68, omega: 15 };
const CELL_OUT: SpringCfg = { zeta: 1, omega: 22 };
const RING_PAD = 7;

const thumbUrl = (id: string) => `/talk/overview/${id}.webp`;

/** Steps every cell toward its staggered goal and paints it; true once all have settled. */
function stepCells(
  cells: Spring[],
  els: readonly (HTMLElement | null)[],
  { open, anchor, elapsed, dt }: { open: boolean; anchor: number; elapsed: number; dt: number },
) {
  const far = Math.max(...cells.map((_, i) => cellDistance(i, anchor)));
  let settled = true;
  for (const [i, cell] of cells.entries()) {
    const d = cellDistance(i, anchor);
    step(cell, cellGoal(open, elapsed, d, far), open ? CELL_IN : CELL_OUT, dt);
    settled &&= resting(cell, open ? 1 : 0);
    const el = els[i];
    if (el) {
      el.style.opacity = String(clamp01(cell.x));
      el.style.transform = `scale(${0.8 + 0.2 * cell.x})`;
    }
  }
  return settled;
}

type Chrome = {
  ring: HTMLElement | null;
  fades: readonly (HTMLElement | null)[];
  live: HTMLElement | null;
};

/** Applies the zoom fade, ring position and live-stage transform to the overview chrome. */
function paintChrome(
  { ring, fades, live }: Chrome,
  pose: { zoom: number; ring: { x: number; y: number }; anchor: number; closed: boolean },
) {
  const fade = String(clamp01(pose.zoom));
  for (const el of [ring, ...fades]) {
    if (el) el.style.opacity = fade;
  }
  if (ring)
    ring.style.transform = `translate(${pose.ring.x - RING_PAD}px, ${pose.ring.y - RING_PAD}px)`;
  if (live) Object.assign(live.style, liveStyle(pose.zoom, cellRect(pose.anchor), pose.closed));
}

/**
 * Reveal-style overview: M or O zooms the live stage down into its cell of a grid of every stop;
 * arrows move the selection, Enter or a click cuts to that stop and zooms back in.
 */
export function Overview({
  stops,
  children,
}: {
  stops: readonly OverviewStop[];
  children: ReactNode;
}) {
  const stage = useStage();
  const { target } = useStageSnapshot();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [selected, setSelected] = useState(0);

  const live = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const cells = useRef<(HTMLElement | null)[]>([]);
  const anim = useRef({
    open: false,
    since: 0,
    anchor: 0,
    selected: 0,
    zoom: { x: 0, v: 0 },
    cells: stops.map(() => ({ x: 0, v: 0 })),
    ring: { x: 0, y: 0, vx: 0, vy: 0 },
    active: false,
  });

  const select = (index: number) => {
    anim.current.selected = index;
    anim.current.active = true;
    setSelected(index);
  };

  const toggle = (next: boolean) => {
    const a = anim.current;
    if (a.open === next) return;
    a.open = next;
    a.since = stage.frame().w;
    a.active = true;
    if (next) {
      const current = stage.getSnapshot().target;
      a.anchor = current;
      a.selected = current;
      const r = cellRect(current);
      a.ring = { x: r.x, y: r.y, vx: 0, vy: 0 };
      setSelected(current);
      setShown(true);
    }
    setOpen(next);
  };

  const jump = (index: number) => {
    if (index !== stage.getSnapshot().target) {
      stage.dispatch({ type: "goto", index, cut: true });
      // The live stage now shows the chosen stop, so it zooms back in from that cell
      anim.current.anchor = index;
    }
    toggle(false);
  };

  const onCommand = useEffectEvent((command: StageCommand) => {
    if (command.type === "overview") toggle(!anim.current.open);
  });
  useEffect(() => stage.onCommand(onCommand), [stage]);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const intent = keyIntent(event);
    if (intent === null) return;
    const a = anim.current;
    if (intent === "close" && !event.repeat) toggle(false);
    if (intent === "jump" && !event.repeat) jump(a.selected);
    if (intent === "move") select(moveSelection(a.selected, event.key, stops.length));
    event.preventDefault();
    event.stopPropagation();
  });
  useEffect(() => {
    if (!open) return;
    // Capture phase on window runs before the stage's nav keys and stops them reaching it
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener, { capture: true });
    return () => window.removeEventListener("keydown", listener, { capture: true });
  }, [open]);

  useFrame((frame: Frame) => {
    const a = anim.current;
    if (!a.active) return;
    const dt = Math.min(frame.dt, 0.1);
    const goal = a.open ? 1 : 0;

    step(a.zoom, goal, a.open ? ZOOM_OUT : ZOOM_IN, dt);
    const cellsSettled = stepCells(a.cells, cells.current, {
      open: a.open,
      anchor: a.anchor,
      elapsed: frame.w - a.since,
      dt,
    });
    const settled = resting(a.zoom, goal) && cellsSettled;

    a.ring = stepRing(a.ring, cellRect(a.selected), dt);
    paintChrome(
      { ring: ring.current, fades: [backdrop.current, captionRef.current], live: live.current },
      { zoom: a.zoom.x, ring: a.ring, anchor: a.anchor, closed: settled && !a.open },
    );

    if (settled) {
      a.active = false;
      if (!a.open) setShown(false);
    }
  }, PRIORITY.overlay);

  return (
    <div className="ov-root" data-overview={open ? "open" : "closed"}>
      <div
        ref={live}
        className="ov-live"
        style={shown ? { pointerEvents: "none" } : undefined}
        inert={shown || undefined}
      >
        {children}
      </div>
      <dialog aria-label="Slide overview" className="ov-chrome" open={shown}>
        <div ref={backdrop} className="ov-backdrop">
          {shown ? <ShadersLayer nodes={cursorField} clock="wall" fallback="transparent" /> : null}
        </div>
        <ol className="ov-grid">
          {stops.map((stop, i) => {
            const r = cellRect(i);
            return (
              <li
                key={stop.id}
                className="ov-slot"
                style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
              >
                <button
                  ref={(el) => {
                    cells.current[i] = el;
                  }}
                  type="button"
                  tabIndex={-1}
                  className="ov-cell"
                  aria-label={`${i + 1}. ${stop.title}`}
                  aria-current={i === target ? "step" : undefined}
                  data-selected={i === selected || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerEnter={() => select(i)}
                  onClick={() => jump(i)}
                >
                  <Thumb id={stop.id} title={stop.title} />
                  <span className="ov-num" aria-hidden>
                    {i + 1}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div
          ref={ring}
          className="ov-ring"
          style={{ width: cellRect(0).w + 2 * RING_PAD, height: cellRect(0).h + 2 * RING_PAD }}
        />
        <p
          ref={captionRef}
          className="ov-caption"
          style={{ top: gridBottom(stops.length) + 34 }}
          aria-live="polite"
        >
          <span className="ov-caption-n">{selected + 1}</span>
          {stops[selected]?.title}
        </p>
      </dialog>
    </div>
  );
}

/** Pre-rendered still of the stop, over a title card shown until (or unless) it loads. */
function Thumb({ id, title }: { id: string; title: string }) {
  const [ready, setReady] = useState(false);
  return (
    <span className="ov-thumb" data-thumb={ready ? "ready" : undefined}>
      <span className="ov-card" aria-hidden>
        {title}
      </span>
      {THUMBS.has(id) ? (
        <img
          src={thumbUrl(id)}
          alt=""
          decoding="async"
          draggable={false}
          onLoad={() => setReady(true)}
        />
      ) : null}
    </span>
  );
}
