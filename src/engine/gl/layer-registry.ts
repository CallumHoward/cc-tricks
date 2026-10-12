import type { Frame } from "#/engine/types";

import type { PostParams } from "./post-params";

/**
 * What a segment hands the GPU host: an object to show, a per-frame update and optional post
 * overrides.
 */
export type Layer<O> = {
  object?: O;
  /** Lower updates first; ties keep insertion order */
  order?: number;
  update?(frame: Frame): void;
  post?(frame: Frame): Partial<PostParams> | undefined;
  dispose?(): void;
};

export type LayerTarget<O> = { attach(object: O): void; detach(object: O): void };

export type LayerRegistry<O> = {
  add(layer: Layer<O>): () => void;
  /** Connects a scene; existing objects attach immediately, `null` detaches them all */
  bind(target: LayerTarget<O> | null): void;
  /** Runs every layer's update and returns their post overrides in order */
  update(frame: Frame): Partial<PostParams>[];
  readonly size: number;
  clear(): void;
};

export function createLayerRegistry<O>(): LayerRegistry<O> {
  const entries: { layer: Layer<O>; seq: number }[] = [];
  let target: LayerTarget<O> | null = null;
  let seq = 0;
  const overrides: Partial<PostParams>[] = [];

  const remove = (layer: Layer<O>) => {
    const i = entries.findIndex((e) => e.layer === layer);
    if (i < 0) return;
    entries.splice(i, 1);
    if (layer.object !== undefined) target?.detach(layer.object);
    layer.dispose?.();
  };

  return {
    add(layer) {
      entries.push({ layer, seq: seq++ });
      entries.sort((a, b) => (a.layer.order ?? 0) - (b.layer.order ?? 0) || a.seq - b.seq);
      if (layer.object !== undefined) target?.attach(layer.object);
      return () => remove(layer);
    },
    bind(next) {
      if (target)
        for (const { layer } of entries)
          if (layer.object !== undefined) target.detach(layer.object);
      target = next;
      if (target)
        for (const { layer } of entries)
          if (layer.object !== undefined) target.attach(layer.object);
    },
    update(frame) {
      overrides.length = 0;
      for (const { layer } of entries) {
        layer.update?.(frame);
        const o = layer.post?.(frame);
        if (o) overrides.push(o);
      }
      return overrides;
    },
    get size() {
      return entries.length;
    },
    clear() {
      while (entries[0]) remove(entries[0].layer);
    },
  };
}
