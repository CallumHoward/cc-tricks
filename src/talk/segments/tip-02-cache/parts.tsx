import type { CSSProperties, ReactNode } from "react";

import { inOutCubic, inQuad, outExpo, prog } from "#/engine/motion/ease";
import { ambientTime } from "#/engine/stage/stage";
import type { CodeLang } from "#/engine/text/highlight";
import { HighlightedLine } from "#/engine/text/highlighted-line";
import type { Frame } from "#/engine/types";
import { setStyle, typeClip, useFrameRef } from "#/talk/kit/tui/use-frame-ref";

import { ambientView, project, viewAt } from "./scene";

const fmt = (n: number, d = 2) => n.toFixed(d);

/** Visible only for τ in [from, to). */
export function During({
  from,
  to,
  children,
  style,
}: {
  from: number;
  to: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    setStyle(el, "display", frame.tau >= from && frame.tau < to ? "block" : "none");
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, display: "none", ...style }}>
      {children}
    </div>
  );
}

/** A full-stage layer written from the eased progress `u` of `at → at + dur`. */
function Eased({
  at,
  dur,
  write,
  children,
}: {
  at: number;
  dur: number;
  write: (el: HTMLDivElement, u: number) => void;
  children: ReactNode;
}) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    write(el, inOutCubic(prog(frame.tau, at, at + dur)));
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {children}
    </div>
  );
}

/** Exit for a whole plate body: lifts 24 px while a clip wipes it up over `at → at + dur`. */
export function Leave({
  at,
  dur = 0.35,
  children,
}: {
  at: number;
  dur?: number;
  children: ReactNode;
}) {
  return (
    <Eased
      at={at}
      dur={dur}
      write={(el, u) => {
        setStyle(el, "transform", u > 0 ? `translateY(${fmt(-24 * u, 1)}px)` : "none");
        setStyle(el, "clip-path", u > 0 ? `inset(0 0 ${fmt(u * 100, 1)}% 0)` : "none");
        setStyle(el, "visibility", u >= 1 ? "hidden" : "visible");
      }}
    >
      {children}
    </Eased>
  );
}

/** Mask rise: content rises from behind its own baseline at `at`, sinks out at `out`. */
export function Rise({
  at,
  out,
  children,
  style,
  className,
}: {
  at: number;
  out?: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const up = outExpo(prog(frame.tau, at, at + 0.55));
    const down = out === undefined ? 0 : inQuad(prog(frame.tau, out, out + 0.35));
    const y = (1 - up) * 112 - down * 112;
    const inner = el.firstElementChild;
    setStyle(el, "visibility", up <= 0 || down >= 1 ? "hidden" : "visible");
    setStyle(inner, "transform", `translate3d(0, ${fmt(y)}%, 0)`);
  });
  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "absolute", overflow: "hidden", paddingBottom: 6, ...style }}
    >
      <div>{children}</div>
    </div>
  );
}

/** Text typed on τ in whole monospace cells, syntax-highlighted when given a `lang`. */
export function Typed({
  text,
  at,
  cps = 50,
  out,
  lang,
  className = "type-label",
  style,
}: {
  text: string;
  at: number;
  cps?: number;
  out?: number;
  lang?: CodeLang;
  className?: string;
  style?: CSSProperties;
}) {
  const total = Array.from(text).length;
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const n = Math.max(0, Math.min(total, Math.floor((frame.tau - at) * cps)));
    const gone = out !== undefined && frame.tau >= out;
    setStyle(el, "visibility", n > 0 && !gone ? "visible" : "hidden");
    setStyle(el, "clip-path", typeClip(n, total));
  });
  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "absolute", whiteSpace: "pre", visibility: "hidden", ...style }}
    >
      {lang ? <HighlightedLine line={text} lang={lang} /> : text}
    </div>
  );
}

/** Positions its child at a scene point projected through the current GL view. */
export function Anchor({
  x,
  y,
  z = 0,
  dx = 0,
  dy = 0,
  children,
}: {
  x: number | ((tau: number) => number);
  y: number;
  z?: number | ((tau: number) => number);
  dx?: number;
  dy?: number;
  children: ReactNode;
}) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const px = typeof x === "function" ? x(frame.tau) : x;
    const pz = typeof z === "function" ? z(frame.tau) : z;
    const view = ambientView(viewAt(frame.tau), frame.tau, ambientTime(frame));
    const p = project(view, px, y, pz);
    setStyle(el, "transform", `translate3d(${fmt(p.x + dx, 1)}px, ${fmt(p.y + dy, 1)}px, 0)`);
  });
  return (
    <div ref={ref} style={{ position: "absolute", left: 0, top: 0 }}>
      {children}
    </div>
  );
}

/** A camera track: eased vertical move over `at → at + dur`, no blur, landing exactly. */
export function Pan({
  at,
  dur,
  distance,
  children,
}: {
  at: number;
  dur: number;
  distance: number;
  children: ReactNode;
}) {
  return (
    <Eased
      at={at}
      dur={dur}
      write={(el, u) =>
        setStyle(el, "transform", u > 0 ? `translate3d(0, ${fmt(distance * u, 1)}px, 0)` : "none")
      }
    >
      {children}
    </Eased>
  );
}
