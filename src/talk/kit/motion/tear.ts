import { hash1 } from "#/engine/util/random";

export type TearGeom = { width: number; height: number; perf: number; seed?: number };

const STEP = 14;

/** Jagged x offsets down the perforation for the torn length `progress·height`. */
export function tearEdge(progress: number, { height, seed = 1 }: TearGeom): [number, number][] {
  const torn = Math.max(0, Math.min(1, progress)) * height;
  const pts: [number, number][] = [];
  for (let y = 0; y < torn; y += STEP) pts.push([(hash1(seed * 977 + y) - 0.5) * 6, y]);
  if (torn > 0) pts.push([0, torn]);
  return pts;
}

const pct = (v: number, of: number) => `${Number(((v / of) * 100).toFixed(3))}%`;

/** Clip-path polygons for the ticket body and its stub at tear progress p. */
export function tearClips(progress: number, geom: TearGeom): { body: string; stub: string } {
  const { width: w, height: h, perf } = geom;
  const edge = tearEdge(progress, geom);
  const at = (dx: number, y: number) => `${pct(perf + dx, w)} ${pct(y, h)}`;
  const down = edge.map(([dx, y]) => at(dx, y));
  const body = ["0% 0%", ...(down.length ? down : [at(0, 0)]), at(0, h), "0% 100%"];
  const stub = [...(down.length ? down : [at(0, 0)]), at(0, h), "100% 100%", "100% 0%"];
  return { body: `polygon(${body.join(", ")})`, stub: `polygon(${stub.join(", ")})` };
}

/** Stub swing: rotates about the tear tip, growing with progress. */
export function stubSwing(progress: number, maxDeg = 9): number {
  const p = Math.max(0, Math.min(1, progress));
  return maxDeg * p * p;
}
