import "./kit-motion.css";
import { Fragment, useMemo, useRef, type CSSProperties } from "react";

import { clamp, inOutCubic, inQuad, outCubic, prog } from "#/engine/motion/ease";
import { settleTime, SPRINGS } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import { num, put } from "./dom";
import { splitWords, springFrom, staggerStarts } from "./schedule";

const LETTER = SPRINGS.SNAP;
const NUMERAL = SPRINGS.RELEASE;
const RULE = SPRINGS.TOAST;
/** Gap between the numeral's punch and the first letter of the title. */
const NUMERAL_LEAD = 0.06;
/** Extra tracking per character (em) the line starts with before it tightens. */
const TRACK = 0.07;
/** Exit: span of the left-to-right fold wave and each letter's own fold (τ-s). */
const EXIT_WAVE = 0.22;
const EXIT_FOLD = 0.26;
/** Ambient seconds per rule glint cycle; the glint sweeps during the first `GLINT_SWEEP` of it. */
const GLINT_PERIOD = 4.5;
const GLINT_SWEEP = 0.55;

/** One animated glyph run: the "N." numeral as a whole, or a single letter. */
export type RiseUnit = {
  readonly text: string;
  readonly word: number;
  readonly line: number;
  /** Characters before this unit on its line, spaces included (drives the tracking squeeze). */
  readonly col: number;
  readonly start: number;
  readonly numeral: boolean;
};

export type RisePlan = {
  readonly units: readonly RiseUnit[];
  readonly first: number;
  readonly ruleStart: number;
  readonly settleBy: number;
};

const isNumeral = (word: string) => /^\d+\.$/.test(word);

/**
 * Launch schedule: the first unit launches when the word-staggered rise used to (so segments that
 * clear space for it keep their timing), the "N." numeral punches first, then letters ripple in and
 * the last one settles exactly at `settleBy`.
 */
export function planRise(text: string, settleBy: number, stagger = 0.07): RisePlan {
  const { words } = splitWords(text);
  const first = staggerStarts(words.length, settleBy, stagger, SPRINGS.LAND)[0] ?? settleBy;
  const lastLetter = settleBy - settleTime(LETTER);
  const hasNumeral = isNumeral(words[0]?.text ?? "");
  const letterFirst = Math.min(lastLetter, hasNumeral ? first + NUMERAL_LEAD : first);

  const cols = new Map<number, number>();
  const raw: Omit<RiseUnit, "start">[] = [];
  for (const w of words) {
    let col = cols.get(w.line) ?? 0;
    const numeral = hasNumeral && w.index === 0;
    for (const g of numeral ? [w.text] : Array.from(w.text)) {
      raw.push({ text: g, word: w.index, line: w.line, col, numeral });
      col += Array.from(g).length;
    }
    cols.set(w.line, col + 1);
  }

  const letters = raw.filter((u) => !u.numeral).length;
  const step = letters > 1 ? (lastLetter - letterFirst) / (letters - 1) : 0;
  let k = 0;
  const units = raw.map((u) => ({
    ...u,
    start: u.numeral ? Math.min(first, settleBy - settleTime(NUMERAL)) : letterFirst + step * k++,
  }));

  return {
    units,
    first,
    ruleStart: Math.min(first - 0.3, settleBy - settleTime(RULE)),
    settleBy,
  };
}

type UnitPose = { x: number; y: number; rx: number; rz: number; s: number };

const REST: UnitPose = Object.freeze({ x: 0, y: 0, rx: 0, rz: 0, s: 1 });

/**
 * Pose of every unit and the rule at `tau`. `x` is em, `y` a fraction of the glyph height (1 =
 * below the mask), rotations in degrees. Exactly at rest from `settleBy` until `exit`.
 */
export function riseAt(tau: number, plan: RisePlan, exit?: number) {
  const n = plan.units.length;
  const squeeze = 1 - prog(tau, plan.first, plan.settleBy, outCubic);
  const out = exit === undefined ? 0 : prog(tau, exit, exit + EXIT_WAVE + EXIT_FOLD);
  const units = plan.units.map((u, i): UnitPose => {
    if (tau >= plan.settleBy && out === 0) return REST;
    const r = springFrom(tau, u.start, u.numeral ? NUMERAL : LETTER);
    const delay = n > 1 ? (EXIT_WAVE * i) / (n - 1) : 0;
    const fold = exit === undefined ? 0 : inQuad(clamp((tau - exit - delay) / EXIT_FOLD));
    const lift = 1 - r;
    return u.numeral
      ? { x: 0, y: lift * 0.6 + fold * 1.15, rx: fold * 80, rz: -lift * 8, s: 0.25 + 0.75 * r }
      : {
          x: u.col * TRACK * squeeze,
          y: lift * 1.12 + fold * 1.15,
          rx: fold * 80,
          rz: lift * 12,
          s: 1,
        };
  });
  const draw = springFrom(tau, plan.ruleStart, RULE);
  const retract = exit === undefined ? 0 : prog(tau, exit + 0.08, exit + 0.5, inOutCubic);
  return { units, rule: { draw, retract }, glint: clamp((tau - plan.settleBy) / 0.3) * (1 - out) };
}

const poseTransform = (p: UnitPose): string =>
  p === REST || (p.x === 0 && p.y === 0 && p.rx === 0 && p.rz === 0 && p.s === 1)
    ? "none"
    : `translate3d(${num(p.x, 3)}em, ${num(p.y * 100, 2)}%, 0) perspective(6em) rotateX(${num(p.rx, 2)}deg) rotate(${num(p.rz, 2)}deg) scale(${num(p.s, 4)})`;

/** Glint position along the rule (fraction of the glint's own width) or null between sweeps. */
export function glintAt(rho: number): number | null {
  const phase = (((rho / GLINT_PERIOD) % 1) + 1) % 1;
  return phase > GLINT_SWEEP ? null : phase / GLINT_SWEEP;
}

/**
 * Display text that rises letter by letter from behind a clay rule, every letter settled by
 * `settleBy`: a leading "N." numeral punches in, the letters spring up with a slight tilt while the
 * tracking tightens, and `exit` folds them away left to right. `\n` in `text` sets line breaks.
 */
export function RuleRise({
  text,
  settleBy,
  stagger = 0.07,
  exit,
  className = "type-headline",
  rule = true,
  style,
}: {
  text: string;
  settleBy: number;
  stagger?: number;
  exit?: number;
  className?: string;
  rule?: boolean;
  style?: CSSProperties;
}) {
  const plan = useMemo(() => planRise(text, settleBy, stagger), [text, settleBy, stagger]);
  const { lines } = useMemo(() => splitWords(text), [text]);
  const unitEls = useRef<(HTMLSpanElement | null)[]>([]);
  const ruleEls = useRef<(HTMLSpanElement | null)[]>([]);
  const glintEls = useRef<(HTMLSpanElement | null)[]>([]);

  useFrame((frame: Frame) => {
    const s = riseAt(frame.tau, plan, exit);
    s.units.forEach((p, i) => put(unitEls.current[i], "transform", poseTransform(p)));
    const { draw, retract } = s.rule;
    const ruleT = `translateX(${num(retract * 100, 2)}%) scaleX(${num(draw * (1 - retract), 4)})`;
    for (const el of ruleEls.current) put(el, "transform", ruleT);
    const g = glintAt(ambientTime(frame));
    for (const el of glintEls.current) {
      put(el, "opacity", g === null ? "0" : num(s.glint * Math.sin(Math.PI * g), 3));
      put(el, "transform", `translateX(${num((g ?? 0) * 560 - 100, 2)}%)`);
    }
  });

  const unitsByWord = new Map<number, number[]>();
  plan.units.forEach((u, i) => unitsByWord.set(u.word, [...(unitsByWord.get(u.word) ?? []), i]));

  return (
    <div className={`km-rr ${className}`} style={style}>
      {lines.map((line, li) => {
        const lineId = line[0]?.id ?? "empty";
        return (
          <span key={lineId} className="km-rr-line">
            <span className="km-rr-mask">
              {line.map((w, i) => (
                // Real spaces keep each font's own word spacing (a full cell in mono)
                <Fragment key={w.id}>
                  {i > 0 ? " " : null}
                  <span className="km-rr-word">
                    {(unitsByWord.get(w.index) ?? []).map((ui) => (
                      <span
                        key={ui}
                        className={
                          plan.units[ui]?.numeral ? "km-rr-glyph km-rr-numeral" : "km-rr-glyph"
                        }
                        ref={(el) => {
                          unitEls.current[ui] = el;
                        }}
                      >
                        {plan.units[ui]?.text}
                      </span>
                    ))}
                  </span>
                </Fragment>
              ))}
            </span>
            {rule && li === lines.length - 1 ? (
              <span
                className="km-rr-rule"
                ref={(el) => {
                  ruleEls.current[li] = el;
                }}
              >
                <span
                  className="km-rr-glint"
                  ref={(el) => {
                    glintEls.current[li] = el;
                  }}
                />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
