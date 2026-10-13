export type AaEffort = "low" | "medium" | "high" | "xhigh" | "max";

export type AaPoint = {
  model: string;
  effort: AaEffort;
  slug: string;
  intelligenceIndex: number;
  costPerTaskUSD: number;
  outputTokens: number;
  reasoningTokens: number;
  answerTokens: number;
};

/** Captured from the rendered Artificial Analysis charts; full precision, round only for display. */
export const AA_POINTS: readonly AaPoint[] = [
  {
    model: "Claude Opus 5.5",
    effort: "low",
    slug: "claude-opus-5-5-low",
    intelligenceIndex: 42.3077781466168,
    costPerTaskUSD: 0.551180473909146,
    outputTokens: 10151.276275623324,
    reasoningTokens: 3376.0272567172387,
    answerTokens: 6775.2490189060845,
  },
  {
    model: "Claude Opus 5.5",
    effort: "medium",
    slug: "claude-opus-5-5-medium",
    intelligenceIndex: 51.2434931792768,
    costPerTaskUSD: 1.3360093438976588,
    outputTokens: 25745.286895441168,
    reasoningTokens: 11695.71199538513,
    answerTokens: 14049.574900056037,
  },
  {
    model: "Claude Opus 5.5",
    effort: "high",
    slug: "claude-opus-5-5-high",
    intelligenceIndex: 53.5831959822067,
    costPerTaskUSD: 1.822504718771704,
    outputTokens: 35584.058877984105,
    reasoningTokens: 18236.5871060743,
    answerTokens: 17347.4717719098,
  },
  {
    model: "Claude Opus 5.5",
    effort: "xhigh",
    slug: "claude-opus-5-5-xhigh",
    intelligenceIndex: 55.9873505840139,
    costPerTaskUSD: 3.459110175822289,
    outputTokens: 65667.3950659979,
    reasoningTokens: 40314.73065457981,
    answerTokens: 25352.66441141809,
  },
  {
    model: "Claude Opus 5.5",
    effort: "max",
    slug: "claude-opus-5-5",
    intelligenceIndex: 57.6223698102963,
    costPerTaskUSD: 5.982012019521066,
    outputTokens: 119166.01575731623,
    reasoningTokens: 83929.08191267242,
    answerTokens: 35236.93384464381,
  },
  {
    model: "Claude Sonnet 5.5",
    effort: "low",
    slug: "claude-sonnet-5-5-low",
    intelligenceIndex: 35.8681594577587,
    costPerTaskUSD: 0.3451610270666562,
    outputTokens: 14253.222854129013,
    reasoningTokens: 4588.167154662398,
    answerTokens: 9665.055699466615,
  },
  {
    model: "Claude Sonnet 5.5",
    effort: "medium",
    slug: "claude-sonnet-5-5-medium",
    intelligenceIndex: 40.838652287929,
    costPerTaskUSD: 0.48326378260543096,
    outputTokens: 20937.627614580473,
    reasoningTokens: 8190.173061281517,
    answerTokens: 12747.454553298958,
  },
  {
    model: "Claude Sonnet 5.5",
    effort: "high",
    slug: "claude-sonnet-5-5-high",
    intelligenceIndex: 46.7533528066958,
    costPerTaskUSD: 0.8844498581005511,
    outputTokens: 37327.39301363091,
    reasoningTokens: 18725.78874258922,
    answerTokens: 18601.604271041695,
  },
  {
    model: "Claude Sonnet 5.5",
    effort: "xhigh",
    slug: "claude-sonnet-5-5-xhigh",
    intelligenceIndex: 51.8955544183089,
    costPerTaskUSD: 2.0120345801545785,
    outputTokens: 74809.64840807533,
    reasoningTokens: 47953.30350339135,
    answerTokens: 26856.34490468398,
  },
  {
    model: "Claude Sonnet 5.5",
    effort: "max",
    slug: "claude-sonnet-5-5",
    intelligenceIndex: 56.0001286580794,
    costPerTaskUSD: 5.4608525948098325,
    outputTokens: 197430.37161011933,
    reasoningTokens: 146633.4888002458,
    answerTokens: 50796.88280987353,
  },
  {
    model: "GPT-6 Astra",
    effort: "max",
    slug: "gpt-6-astra",
    intelligenceIndex: 52.673669395513,
    costPerTaskUSD: 3.2575003134834164,
    outputTokens: 27205.50491647014,
    reasoningTokens: 16691.238044704474,
    answerTokens: 10514.266871765667,
  },
];

/** "Opus 5.5 xhigh", "GPT-6 Astra" (single-effort models drop the effort). */
export function aaLabel(p: AaPoint): string {
  const name = p.model.replace(/^Claude /, "");
  return p.model.startsWith("Claude ") ? `${name} ${p.effort}` : name;
}
