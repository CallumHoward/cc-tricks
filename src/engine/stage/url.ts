import type { Stop } from "#/engine/types";

export type StageStart =
  | { kind: "frozen"; tau: number; w: number }
  | { kind: "stop"; index: number };

const finite = (raw: string | null) => {
  if (raw === null || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** `?t=<τ>&w=<w>` freezes a frame; otherwise `#<stopId>` picks the starting stop. */
export function parseStageUrl(search: string, hash: string, stops: readonly Stop[]): StageStart {
  const params = new URLSearchParams(search);
  const tau = finite(params.get("t"));
  if (tau !== undefined) return { kind: "frozen", tau, w: finite(params.get("w")) ?? tau };
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const index = stops.findIndex((s) => s.id === id);
  return { kind: "stop", index: Math.max(0, index) };
}
