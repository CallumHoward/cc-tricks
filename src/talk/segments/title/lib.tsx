import "./open.css";
import { useRef, type CSSProperties, type ReactNode } from "react";

import { clamp, inQuad, prog } from "#/engine/motion/ease";
import { SPRINGS, type SpringCfg } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { num, put } from "#/talk/kit/motion/dom";
import { springFrom, staggerStarts } from "#/talk/kit/motion/schedule";
import { charLength, sliceChars, typedChars } from "#/talk/kit/tui/tui-math";
import type { Act } from "#/talk/mascot/actions";
import { poseAt } from "#/talk/mascot/actions";
import type { MascotHandle } from "#/talk/mascot/apply";
import { stepMascot } from "#/talk/mascot/driver";
import { Mascot } from "#/talk/mascot/mascot";

/** Rendered only while from ≤ τ < to (display, so kit children forcing `visibility` stay hidden). */
export function Win({
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
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    put(ref.current, "display", frame.tau >= from && frame.tau < to ? "block" : "none");
  });
  return (
    <div ref={ref} className="so-fill" style={{ display: "none", ...style }}>
      {children}
    </div>
  );
}

export type Place = {
  x?: number;
  y?: number;
  s?: number;
  sx?: number;
  sy?: number;
  r?: number;
  skew?: number;
  o?: number;
  clip?: string;
  hidden?: boolean;
};

/** An absolutely placed box whose transform, opacity and clip are a pure function of the frame. */
export function Mover({
  place,
  style,
  className,
  children,
}: {
  place: (tau: number, frame: Frame) => Place;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const el = ref.current;
    if (!el) return;
    const p = place(frame.tau, frame);
    put(el, "display", p.hidden ? "none" : "block");
    if (p.hidden) return;
    const sx = (p.s ?? 1) * (p.sx ?? 1);
    const sy = (p.s ?? 1) * (p.sy ?? 1);
    put(
      el,
      "transform",
      `translate3d(${num(p.x ?? 0, 2)}px, ${num(p.y ?? 0, 2)}px, 0) rotate(${num(p.r ?? 0, 3)}deg) skewX(${num(p.skew ?? 0, 3)}deg) scale(${num(sx, 5)}, ${num(sy, 5)})`,
    );
    put(el, "opacity", num(p.o ?? 1, 3));
    put(el, "clip-path", p.clip ?? "none");
  });
  return (
    <div ref={ref} className={["so-abs", className].filter(Boolean).join(" ")} style={style}>
      {children}
    </div>
  );
}

export type RiseWord = { id: string; node: ReactNode; em?: boolean };

const toWords = (line: string, offset: number, emphasis: ReadonlySet<string>): RiseWord[] =>
  line
    .split(" ")
    .filter(Boolean)
    .map((w, i) => ({ id: `w${offset + i}`, node: w, em: emphasis.has(w.replace(/[.,:]$/, "")) }));

/** Splits display copy into masked words; `\n` breaks lines, `lead` prepends a node to line 1. */
function riseLines(text: string, emphasis: readonly string[] = [], lead?: RiseWord): RiseWord[][] {
  const em = new Set(emphasis.flatMap((e) => e.split(" ")));
  let n = 0;
  return text.split("\n").map((line, li) => {
    const words = toWords(line, n, em);
    n += words.length;
    return li === 0 && lead ? [lead, ...words] : words;
  });
}

/** Word lift (1 = hidden below the mask) for a staggered rise and an optional sink. */
function riseAt(
  tau: number,
  starts: readonly number[],
  spring: SpringCfg,
  exit?: number,
): number[] {
  const sink = exit === undefined ? 0 : prog(tau, exit, exit + 0.45, inQuad);
  return starts.map((s, i) => 1 - springFrom(tau, s, spring) + clamp(sink * 1.3 - i * 0.04) * 1.2);
}

/** Back-solve launches so the last word settles by `settleBy`, or launch the first at `startAt`. */
type RiseTiming = { settleBy: number; startAt?: never } | { startAt: number; settleBy?: never };

/** Display copy rising word by word from behind its line's mask. */
export function Rise({
  text,
  emphasis,
  lead,
  settleBy,
  startAt,
  stagger = 0.08,
  exit,
  spring = SPRINGS.LAND,
  className = "type-headline",
  style,
}: {
  text: string;
  emphasis?: readonly string[];
  lead?: RiseWord;
  stagger?: number;
  exit?: number;
  spring?: SpringCfg;
  className?: string;
  style?: CSSProperties;
} & RiseTiming) {
  const lines = riseLines(text, emphasis, lead);
  const count = lines.reduce((a, l) => a + l.length, 0);
  const starts =
    startAt === undefined
      ? staggerStarts(count, settleBy, stagger, spring)
      : Array.from({ length: count }, (_, i) => startAt + i * stagger);
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  useFrame((frame: Frame) => {
    const lifts = riseAt(frame.tau, starts, spring, exit);
    lifts.forEach((y, i) => {
      put(els.current[i], "transform", `translate3d(0, ${num(y * 115, 2)}%, 0)`);
    });
  });
  let index = 0;
  return (
    <div className={`so-rise ${className}`} style={style}>
      {lines.map((line) => (
        <span key={line[0]?.id ?? "empty"} className="so-rise-line">
          {line.map((w) => {
            const i = index++;
            return (
              <span
                key={w.id}
                className="so-rise-word"
                ref={(el) => {
                  els.current[i] = el;
                }}
              >
                {w.em ? <em>{w.node}</em> : w.node}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}

/** Text typed in whole characters on τ (backspaces in reverse for free). */
export function Typed({
  text,
  at,
  cps = 40,
  until,
  className,
  style,
}: {
  text: string;
  at: number;
  cps?: number;
  /** τ from which it backspaces at the same speed */
  until?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const len = charLength(text);
  const ref = useRef<HTMLSpanElement>(null);
  useFrame((frame: Frame) => {
    const el = ref.current;
    if (!el) return;
    let n = typedChars(frame.tau, at, cps, len);
    if (until !== undefined) n = Math.min(n, len - typedChars(frame.tau, until, cps * 2, len));
    const next = sliceChars(text, n);
    if (el.textContent !== next) el.textContent = next;
  });
  return <span ref={ref} className={className} style={style} aria-label={text} />;
}

const SILHOUETTE = Object.freeze({ silhouette: "#141413" });

/** The bot (or its silhouette) drawn from τ-keyed acts on twos; fills its parent box. */
export function Rig({ acts, silhouette = false }: { acts: readonly Act[]; silhouette?: boolean }) {
  const handle = useRef<MascotHandle>(null);
  const key = useRef<number | null>(null);
  useFrame((frame: Frame) => {
    key.current = stepMascot(key.current, frame, acts, handle.current);
  });
  return (
    <Mascot
      ref={handle}
      pose={poseAt(acts, 0, 0)}
      options={silhouette ? SILHOUETTE : undefined}
      className="so-bot-svg"
      title={silhouette ? undefined : "the bot"}
    />
  );
}
