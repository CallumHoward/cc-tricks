import type { TrackValues } from "#/engine/motion/track";

/** Sampled channels plus optional SVG path data. Clip channels are percentages, blur is px. */
export type StyleValues = TrackValues & { d?: string };

/** Last strings written per property, used to skip unchanged writes. */
export type AppliedCache = Record<string, string>;

const fmt = (n: number, digits = 3) => {
  const r = Number(n.toFixed(digits));
  return Object.is(r, -0) ? "0" : String(r);
};

export function composeTransform(values: TrackValues): string | undefined {
  const { x, y, scale, scaleX, scaleY, rotate } = values;
  if (
    x === undefined &&
    y === undefined &&
    scale === undefined &&
    scaleX === undefined &&
    scaleY === undefined &&
    rotate === undefined
  ) {
    return undefined;
  }
  const s = scale ?? 1;
  const sx = s * (scaleX ?? 1);
  const sy = s * (scaleY ?? 1);
  return `translate3d(${fmt(x ?? 0)}px, ${fmt(y ?? 0)}px, 0) scale(${fmt(sx, 4)}, ${fmt(sy, 4)}) rotate(${fmt(rotate ?? 0)}deg)`;
}

export function composeClip(values: TrackValues): string | undefined {
  const { clipTop: t, clipRight: r, clipBottom: b, clipLeft: l } = values;
  if (t === undefined && r === undefined && b === undefined && l === undefined) return undefined;
  return `inset(${fmt(t ?? 0)}% ${fmt(r ?? 0)}% ${fmt(b ?? 0)}% ${fmt(l ?? 0)}%)`;
}

/** Style strings for the channels present; absent channels are left untouched. */
export function styleStrings(values: StyleValues): Record<string, string> {
  const out: Record<string, string> = {};
  const transform = composeTransform(values);
  if (transform !== undefined) out.transform = transform;
  if (values.opacity !== undefined) out.opacity = fmt(Math.min(1, Math.max(0, values.opacity)), 4);
  const clip = composeClip(values);
  if (clip !== undefined) out["clip-path"] = clip;
  if (values.blur !== undefined) out.filter = `blur(${fmt(Math.max(0, values.blur), 2)}px)`;
  for (const key in values) {
    if (key.startsWith("--")) out[key] = fmt(values[key as `--${string}`] as number, 4);
  }
  return out;
}

/** Writes sampled values to an element, skipping properties whose string is unchanged. */
export function applyStyle(
  el: HTMLElement | SVGElement,
  values: StyleValues,
  prev: AppliedCache = {},
): AppliedCache {
  const next = styleStrings(values);
  for (const prop in next) {
    const value = next[prop] as string;
    if (prev[prop] === value) continue;
    el.style.setProperty(prop, value);
    prev[prop] = value;
  }
  if (values.d !== undefined && prev.d !== values.d) {
    el.setAttribute("d", values.d);
    prev.d = values.d;
  }
  return prev;
}
