import { outCubic, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { useTrack } from "#/engine/stage/react";
import { GLYPH_PATHS } from "#/talk/kit/tui";
import { Live } from "#/talk/segments/tip-03-effort/bracket";
import { SPIN_AT } from "#/talk/segments/tip-03-effort/timing";
import { arcPoint, inCubic } from "#/talk/segments/tip-03-effort/tracks";

import { HORIZON, SUN_SIZE, sunAt, sunMinute, T5 } from "./timing";

const SET_AT = T5.chain.holdEnd;

/** The ✳: leaves the spinner, rises as the sun, sweeps the day, then sets into the ✻. */
export function sunPose(tau: number): StyleValues {
  const rest = sunAt(sunMinute(tau));
  const u = prog(tau, T5.leave, T5.leave + 1.15, outCubic);
  const set = prog(tau, SET_AT, SET_AT + 0.3, inCubic);
  const p = set > 0 ? arcPoint(rest, SPIN_AT, set, -60) : arcPoint(SPIN_AT, rest, u, 260);
  const size = set > 0 ? SUN_SIZE + (36 - SUN_SIZE) * set : 36 + (SUN_SIZE - 36) * u;
  return { x: p.x - 50, y: p.y - 50, scale: size / 100, rotate: (1 - u) * -200 + set * 120 };
}

/** Below the horizon the sun is hidden: the ruler's axis is the ground. */
const HORIZON_CLIP = { clipPath: `inset(0 0 ${1080 - HORIZON}px 0)` } as const;

export function Sun() {
  const pose = useTrack(sunPose);
  return (
    <Live from={T5.leave} to={SET_AT + 0.3}>
      <div className="seg-abs" style={{ inset: 0, ...HORIZON_CLIP }}>
        <svg
          ref={pose}
          className="seg-abs seg-clay"
          viewBox="0 0 100 100"
          width={100}
          height={100}
          style={{ left: 0, top: 0, overflow: "visible" }}
          aria-hidden
        >
          <circle cx={50} cy={50} r={70} fill="var(--clay-wash-20)" />
          <path d={GLYPH_PATHS["✳"]} fill="currentColor" />
        </svg>
      </div>
    </Live>
  );
}
