import "./kit-motion.css";
import { Fragment, useRef, type CSSProperties } from "react";

import { clamp, inQuad, prog } from "#/engine/motion/ease";
import { SPRINGS, type SpringCfg } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { num, put } from "./dom";
import { splitWords, springFrom, staggerStarts } from "./schedule";

/** Word lift (fraction of line height, 1 = hidden below the rule) and rule draw (0..1). */
export function ruleRiseAt(
  tau: number,
  starts: readonly number[],
  { spring = SPRINGS.LAND, exit }: { spring?: SpringCfg; exit?: number } = {},
) {
  const first = starts[0] ?? 0;
  const rule = prog(tau, first - 0.35, first + 0.15, (u) => 1 - (1 - u) ** 3);
  const sink = exit === undefined ? 0 : prog(tau, exit, exit + 0.45, inQuad);
  const words = starts.map((s, i) => {
    const up = springFrom(tau, s, spring);
    const out = exit === undefined ? 0 : clamp(sink * 1.3 - i * 0.05);
    return 1 - up + out * 1.15;
  });
  return { rule: exit === undefined ? rule : rule * (1 - sink), words };
}

/**
 * Display text that rises word by word from behind a rule, every word settled by `settleBy`. `\n`
 * in `text` sets the line breaks (≤ 4 words per line).
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
  const { lines, words } = splitWords(text);
  const starts = staggerStarts(words.length, settleBy, stagger, SPRINGS.LAND);
  const wordEls = useRef<(HTMLSpanElement | null)[]>([]);
  const ruleEls = useRef<(HTMLSpanElement | null)[]>([]);

  useFrame((frame: Frame) => {
    const s = ruleRiseAt(frame.tau, starts, { exit });
    s.words.forEach((y, i) => {
      put(wordEls.current[i], "transform", `translate3d(0, ${num(y * 112, 2)}%, 0)`);
    });
    for (const el of ruleEls.current) put(el, "transform", `scaleX(${num(s.rule, 4)})`);
  });

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
                  <span
                    className="km-rr-word"
                    ref={(el) => {
                      wordEls.current[w.index] = el;
                    }}
                  >
                    {w.text}
                  </span>
                </Fragment>
              ))}
            </span>
            {rule && li === lines.length - 1 ? (
              <span
                className="km-rr-rule"
                ref={(el) => {
                  ruleEls.current[w0(line)] = el;
                }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

const w0 = (line: readonly { line: number }[]) => line[0]?.line ?? 0;
