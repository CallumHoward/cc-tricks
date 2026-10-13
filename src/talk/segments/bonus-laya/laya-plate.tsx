import { useRef } from "react";

import { clamp, inOutCubic, inQuad, outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { ExtLink } from "#/talk/kit/ext-link";
import { num, put } from "#/talk/kit/motion/dom";
import { springFrom, staggerStarts } from "#/talk/kit/motion/schedule";
import { LINKS } from "#/talk/script";
import { Live } from "#/talk/segments/tip-03-effort/bracket";
import { Shot, shotBox, type ShotPose } from "#/talk/segments/tip-03-effort/shot";

import { TB } from "./timing";

const EXIT = TB.laya.holdEnd;
export const LAYA_NAME = "laya-ultrafast";

export const LAYA_SHOT = Object.freeze({
  src: "/talk/refs/laya.webp",
  alt: "Laya playground: a support ticket classified into calibrated answer probabilities",
  size: { w: 1920, h: 1247 },
});
const LAYA_BOX = shotBox(760, 280, 1080, LAYA_SHOT.size);
const K = LAYA_BOX.w / LAYA_SHOT.size.w;

/** The window lands flat by `LAND`, when the flicker bars settle into its answer bars. */
export const LAND = 256.2;

/** Four answer bars in the screenshot (image px: track start, width, centre line). */
const BARS_PX = [1245, 272, [379, 677, 906, 1075]] as const;

/** Answer bar `i`'s track on stage once the window has landed. */
export function answerBar(i: number) {
  const [x, w, ys] = BARS_PX;
  return { x: LAYA_BOX.x + x * K, y: LAYA_BOX.y + (ys[i] ?? 0) * K, w: w * K };
}

/** The playground window rises in tilted, lands, floats on ambient time, then dollies away. */
function layaPose(tau: number, rho: number): ShotPose {
  const u = prog(tau, TB.one.holdEnd + 0.15, LAND, outCubic);
  const e = prog(tau, EXIT, EXIT + 0.6, inOutCubic);
  const float = prog(tau, LAND + 0.4, LAND + 1.4) * (1 - e);
  const push = clamp((tau - TB.laya.at) / 2.5) * (1 - e);
  return {
    x: 0,
    y: (1 - u) * 160 + float * 5 * Math.sin(rho * 0.8) - e * 160,
    scale: (0.9 + 0.1 * u) * (1 + 0.02 * push) * (1 - 0.1 * e),
    opacity: clamp(u * 2) * (1 - prog(tau, EXIT, EXIT + 0.4, outCubic)),
    rx: (1 - u) * 14 + float * 0.8 * Math.sin(rho * 0.5),
    ry: float * 1.4 * Math.sin(rho * 0.35 + 2),
  };
}

const LETTERS = Array.from(LAYA_NAME);
const STARTS = staggerStarts(LETTERS.length, TB.laya.at - 1.0, 0.035, SPRINGS.LAND);

/** Letter lift (1 = hidden below the mask) and the underline's draw, per τ. */
function nameAt(tau: number) {
  const sink = prog(tau, EXIT, EXIT + 0.45, inQuad);
  const first = STARTS[0] ?? 0;
  return {
    rule: prog(tau, first - 0.3, first + 0.25, outCubic) * (1 - sink),
    letters: STARTS.map(
      (s, k) => 1 - springFrom(tau, s, SPRINGS.LAND) + clamp(sink * 1.4 - k * 0.03),
    ),
  };
}

/** The repo name rises letter by letter through a mask over a clay underline; it links to the repo. */
function LayaName() {
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const rule = useRef<HTMLSpanElement>(null);
  useFrame((frame: Frame) => {
    const s = nameAt(frame.tau);
    s.letters.forEach((y, k) => {
      put(letters.current[k], "transform", `translate3d(0, ${num(y * 140, 2)}%, 0)`);
    });
    put(rule.current, "transform", `scaleX(${num(s.rule, 4)})`);
  });
  return (
    <div className="seg-abs b2-name" style={{ left: 200, top: 196 }}>
      <ExtLink href={LINKS.laya} className="type-headline b2-name__link">
        <span className="b2-name__mask" aria-label={LAYA_NAME}>
          {LETTERS.map((ch, k) => (
            <span
              // oxlint-disable-next-line no-array-index-key -- letters repeat; position is identity
              key={k}
              ref={(el) => {
                letters.current[k] = el;
              }}
              className="b2-name__ch"
              aria-hidden
            >
              {ch}
            </span>
          ))}
        </span>
        <span ref={rule} className="b2-name__rule" aria-hidden />
      </ExtLink>
    </div>
  );
}

/** B-laya: demo placeholder. The real playground floats in, dimmed; Callum switches to the live tab. */
export function LayaPlate() {
  return (
    <Live from={TB.one.holdEnd - 0.1} to={EXIT + 0.6}>
      <Shot src={LAYA_SHOT.src} alt={LAYA_SHOT.alt} box={LAYA_BOX} pose={layaPose} dim={0.72} />
      <LayaName />
    </Live>
  );
}
