import { modelPricing, pricesFor, type ModelId } from "#/talk/data/pricing";

/** Slider 0–1000 ↔ context tokens on a log scale from 10k to 1M. */
export const CONTEXT_MIN = 10_000;
export const CONTEXT_MAX = 1_000_000;

export function sliderToTokens(s: number): number {
  const u = Math.min(1000, Math.max(0, s)) / 1000;
  const raw = CONTEXT_MIN * (CONTEXT_MAX / CONTEXT_MIN) ** u;
  const step = raw >= 100_000 ? 10_000 : 1000;
  return Math.round(raw / step) * step;
}

export function tokensToSlider(tokens: number): number {
  return Math.round((Math.log(tokens / CONTEXT_MIN) / Math.log(CONTEXT_MAX / CONTEXT_MIN)) * 1000);
}

export type TurnPrice = { base: number; write5m: number; write1h: number; hit: number };

/** Input cost of one turn re-sending `tokens` of context, for each cache outcome. */
export function turnPrices(id: ModelId, tokens: number): TurnPrice {
  const p = pricesFor(modelPricing(id), tokens);
  const m = tokens / 1_000_000;
  return { base: p.input * m, write5m: p.write5m * m, write1h: p.write1h * m, hit: p.hit * m };
}

export type Ttl = "5m" | "1h";
export const TTL_MINUTES: Record<Ttl, number> = { "5m": 5, "1h": 60 };

export type Rung = { id: "setting" | "pin" | "env"; code: string; value: Ttl; note: string };

/** Highest first: the first enabled rung decides a subagent's TTL. */
export const LADDER: readonly Rung[] = [
  { id: "setting", code: '"subagentPromptCacheTtl": "1h"', value: "1h", note: "subagents only" },
  {
    id: "pin",
    code: "experimental:\n  cacheTtl: 5m",
    value: "5m",
    note: "one agent's frontmatter",
  },
  { id: "env", code: '"ENABLE_PROMPT_CACHING_1H": "1"', value: "1h", note: "every request" },
];

export function subagentTtl(enabled: ReadonlySet<Rung["id"]>): {
  ttl: Ttl;
  winner: Rung["id"] | null;
} {
  const rung = LADDER.find((r) => enabled.has(r.id));
  return rung ? { ttl: rung.value, winner: rung.id } : { ttl: "5m", winner: null };
}

/** 0–1 left on a TTL ring after `idle` minutes; 0 means the next turn is a full re-write. */
export const ttlLeft = (idleMinutes: number, ttl: Ttl) =>
  Math.max(0, 1 - idleMinutes / TTL_MINUTES[ttl]);

/** Demo estimate: one prompt suggestion re-reads the cached context at the model's hit price. */
export function suggestionCost(id: ModelId, contextTokens: number, outputTokens = 30): number {
  const p = pricesFor(modelPricing(id), contextTokens);
  return (p.hit * contextTokens + p.output * outputTokens) / 1_000_000;
}

/** Characters typed after `t` seconds at `cps`. */
export const typedAt = (text: string, t: number, cps = 24) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor(t * cps))));
