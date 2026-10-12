const caches = new WeakMap<Element, Record<string, string>>();

/** Writes a style property only when its string changes. */
export function put(el: HTMLElement | SVGElement | null | undefined, prop: string, value: string) {
  if (!el) return;
  let cache = caches.get(el);
  if (!cache) caches.set(el, (cache = {}));
  if (cache[prop] === value) return;
  cache[prop] = value;
  el.style.setProperty(prop, value);
}

/** Writes an attribute only when it changes. */
export function attr(el: Element | null | undefined, name: string, value: string) {
  if (!el) return;
  let cache = caches.get(el);
  if (!cache) caches.set(el, (cache = {}));
  const key = `@${name}`;
  if (cache[key] === value) return;
  cache[key] = value;
  el.setAttribute(name, value);
}

export const num = (v: number, d = 3): string => {
  const r = Number(v.toFixed(d));
  return Object.is(r, -0) ? "0" : String(r);
};

/** `useId` output made safe for `url(#…)` references. */
export const cssId = (id: string): string => `km${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
