/** Anthropic API list prices, $ per million tokens (platform.claude.com pricing page, 13 Oct 2026). */
export type PriceRow = {
  input: number;
  write5m: number;
  write1h: number;
  hit: number;
  output: number;
};

export type ModelId = "fable-5.1" | "opus-5.5" | "sonnet-5.5" | "haiku-5.5";

export type ModelPricing = {
  id: ModelId;
  name: string;
  /** Hit price as a fraction of base input */
  hitMultiplier: number;
  rows: PriceRow;
  /** Haiku 5.5 switches to these prices above `tierAbove` prompt tokens */
  tier?: { above: number; rows: PriceRow };
};

export const PRICING: readonly ModelPricing[] = [
  {
    id: "fable-5.1",
    name: "Fable 5.1",
    hitMultiplier: 0.025,
    rows: { input: 10, write5m: 12.5, write1h: 20, hit: 0.25, output: 50 },
  },
  {
    id: "opus-5.5",
    name: "Opus 5.5",
    hitMultiplier: 0.05,
    rows: { input: 4, write5m: 5, write1h: 8, hit: 0.2, output: 20 },
  },
  {
    id: "sonnet-5.5",
    name: "Sonnet 5.5",
    hitMultiplier: 0.05,
    rows: { input: 2, write5m: 2.5, write1h: 4, hit: 0.1, output: 10 },
  },
  {
    id: "haiku-5.5",
    name: "Haiku 5.5",
    hitMultiplier: 0.1,
    rows: { input: 0.1, write5m: 0.125, write1h: 0.2, hit: 0.01, output: 0.5 },
    tier: {
      above: 100_000,
      rows: { input: 0.5, write5m: 0.625, write1h: 1, hit: 0.05, output: 2.5 },
    },
  },
];

export const PRICING_SOURCE = "https://platform.claude.com/docs/en/about-claude/pricing";

export const WRITE_MULTIPLIER = { "5m": 1.25, "1h": 2 } as const;

export function modelPricing(id: ModelId): ModelPricing {
  const found = PRICING.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown model ${id}`);
  return found;
}

export function pricesFor(model: ModelPricing, promptTokens: number): PriceRow {
  return model.tier && promptTokens > model.tier.above ? model.tier.rows : model.rows;
}

export type TurnKind = "base" | "write5m" | "write1h" | "hit";

/** $ to send a prompt of `tokens` input tokens, priced as one kind (no output). */
export function turnCost(id: ModelId, tokens: number, kind: TurnKind): number {
  const rows = pricesFor(modelPricing(id), tokens);
  const perMTok = kind === "base" ? rows.input : rows[kind];
  return (perMTok * tokens) / 1_000_000;
}

/** How many warm (cache hit) turns one cold turn costs. */
export function coldToWarm(id: ModelId, ttl: "5m" | "1h", tokens = 100_000): number {
  return turnCost(id, tokens, ttl === "5m" ? "write5m" : "write1h") / turnCost(id, tokens, "hit");
}
