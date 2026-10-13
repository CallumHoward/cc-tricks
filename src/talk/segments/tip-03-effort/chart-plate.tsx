import { clamp, outCubic, prog } from "#/engine/motion/ease";
import { ExtLink } from "#/talk/kit/ext-link";
import { LINKS } from "#/talk/script";

import { Live, Wiped } from "./bracket";
import { onShot, Shot, shotBox, type ShotPose } from "./shot";
import { T3 } from "./timing";
import type { Pt } from "./tracks";

export const AA_SHOT = Object.freeze({
  src: "/talk/refs/aa-chart.webp",
  alt: "Artificial Analysis chart of Intelligence Index against cost per task for Claude Opus 5.5 and Sonnet 5.5 at each effort level",
  size: { w: 2306, h: 948 },
});
const SOURCE = "Artificial Analysis";

const AA_BOX = shotBox(80, 176, 1760, AA_SHOT.size);
const K = AA_BOX.w / AA_SHOT.size.w;

/** Centres of the Opus 5.5 dots in the screenshot (image px), low → max. */
export const OPUS_DOTS = [
  { x: 496.1, y: 548.0 },
  { x: 1028.9, y: 353.9 },
  { x: 1215.5, y: 302.9 },
  { x: 1600.9, y: 250.8 },
  { x: 1930.2, y: 215.1 },
] as const;

/** The card lies flat from here on, so `onShot` (which ignores tilt) is exact for the dots. */
export const CHART_LAND = 142.35;

/**
 * The card swings down from above as the dial sinks (the camera tilting up), lands flat, floats on
 * ambient time and pushes in through the hold.
 */
export function chartPose(tau: number, rho: number): ShotPose {
  const u = prog(tau, CHART_LAND - 1, CHART_LAND, outCubic);
  const float = prog(tau, CHART_LAND, CHART_LAND + 1.2);
  const push = clamp((tau - T3.aa.at) / 2.5);
  return {
    x: float * 4 * Math.sin(rho * 0.45 + 1),
    y: (u - 1) * 260 + float * 5 * Math.sin(rho * 0.8),
    scale: (0.9 + 0.1 * u) * (1 + 0.015 * push),
    opacity: clamp(u * 2),
    rx: (u - 1) * 12,
    ry: 0,
  };
}

/** Centre of Opus dot `i` (low → max) on stage at (τ, ρ); the bot's feet and the glyphs land here. */
export function dotAt(i: number, tau: number, rho: number): Pt {
  const q = OPUS_DOTS[i] ?? OPUS_DOTS[0];
  return onShot(AA_BOX, chartPose(tau, rho), { x: AA_BOX.x + q.x * K, y: AA_BOX.y + q.y * K });
}

/** T3-aa: the real Artificial Analysis chart floats in, dimmed, and the dial's glyphs land in it. */
export function ChartPlate() {
  return (
    <Live from={CHART_LAND - 1} to={T3.aa.holdEnd + 0.6}>
      <Shot src={AA_SHOT.src} alt={AA_SHOT.alt} box={AA_BOX} pose={chartPose} dim={0.82} card />
      <Wiped
        at={CHART_LAND}
        className="type-label seg-soft seg-abs"
        style={{ left: AA_BOX.x + 8, top: AA_BOX.y + AA_BOX.h + 26 }}
      >
        <ExtLink href={LINKS.aa}>{SOURCE}</ExtLink>
      </Wiped>
    </Live>
  );
}
