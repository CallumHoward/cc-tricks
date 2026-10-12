import "./kit-motion.css";
import { useRef } from "react";

import { inOutCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { noise1 } from "#/engine/util/random";

import { num, put } from "./dom";
import { splitWords, springFrom, staggerStarts } from "./schedule";

/** Forward-only impact shake (px) decaying over 0.3 τ-s after each hit. */
export function shakeAt(tau: number, hits: readonly number[], v: number, amp = 10) {
  if (v <= 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const t = tau - h;
    if (t < 0 || t > 0.3) continue;
    const k = amp * (1 - t / 0.3) ** 2;
    x += noise1(t * 60 + h) * k;
    y += noise1(t * 60 + h + 31.7) * k;
  }
  return { x, y };
}

/**
 * The one full clay field: hard cut at `cut`, words slam (POP) so the last settles by `settleBy`,
 * then optionally irises down into `iris.to` (stage px) between `iris.start` and `iris.end`.
 */
export function ClayField({
  text,
  cut,
  settleBy,
  iris,
  className = "type-headline type-headline--xl",
}: {
  text: string;
  cut: number;
  settleBy: number;
  iris?: { start: number; end: number; to: { x: number; y: number } };
  className?: string;
}) {
  const { lines, words } = splitWords(text);
  const starts = staggerStarts(words.length, settleBy, 0.16, SPRINGS.POP);
  const field = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const wordEls = useRef<(HTMLSpanElement | null)[]>([]);

  useFrame((frame: Frame) => {
    const { tau } = frame;
    const shown = tau >= cut && (!iris || tau < iris.end);
    put(field.current, "visibility", shown ? "visible" : "hidden");
    if (!shown) return;
    const r = iris ? 1 - prog(tau, iris.start, iris.end, inOutCubic) : 1;
    put(
      field.current,
      "clip-path",
      r >= 1 ? "none" : `circle(${num(r * 2300, 1)}px at ${iris?.to.x}px ${iris?.to.y}px)`,
    );
    const s = shakeAt(tau, [cut, ...starts], frame.v);
    put(inner.current, "transform", `translate3d(${num(s.x, 1)}px, ${num(s.y, 1)}px, 0)`);
    starts.forEach((start, i) => {
      const el = wordEls.current[i];
      const k = springFrom(tau, start, SPRINGS.POP);
      put(el, "visibility", tau >= start ? "visible" : "hidden");
      put(el, "transform", `scale(${num(1.9 - 0.9 * k, 4)})`);
    });
  });

  return (
    <div ref={field} className="km-clay-field">
      <div ref={inner} className={`km-clay-text ${className}`}>
        {lines.map((line) => (
          <div key={line[0]?.id ?? "l"}>
            {line.map((w) => (
              <span
                key={w.id}
                className="km-clay-word"
                ref={(el) => {
                  wordEls.current[w.index] = el;
                }}
              >
                {w.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
