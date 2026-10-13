export type CodeBlock = {
  lang: "sh" | "json" | "yaml";
  /** File name or heading shown above the code */
  label?: string;
  /** Short line shown beside or below the code */
  caption?: string;
  code: string;
  /** False when the block lives in a widget or the shownotes instead of the stage */
  onStage?: boolean;
};

export type ScriptTable = { head: string[]; rows: string[][] };

export type Ref = { label: string; href: string };

export type ScriptCard = {
  headline: string;
  lines: string[];
  labels: string[];
  footnotes: string[];
  stamps: string[];
};

/** Everything one stop shows and says, by region. Region strings are at most 16 words (code exempt). */
export type StopScript = {
  kicker?: string;
  headline?: string;
  lines: string[];
  labels: string[];
  code: CodeBlock[];
  tables: ScriptTable[];
  /** Parallel panels, e.g. the tickets on the offers board */
  cards: ScriptCard[];
  footnotes: string[];
  stamps: string[];
  /** Text inside rebuilt UI replicas and widgets, exactly as it appears there */
  ui: string[];
  refs: Ref[];
  /** Substrings rendered in italic wherever they occur on this stop */
  emphasis: string[];
  sources: string[];
};

export const LINKS = {
  promptCaching: "https://code.claude.com/docs/en/prompt-caching",
  apiPromptCaching: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching",
  subAgents: "https://code.claude.com/docs/en/sub-agents",
  settings: "https://code.claude.com/docs/en/settings-reference",
  pricing: "https://platform.claude.com/docs/en/about-claude/pricing",
  superpowers: "https://github.com/obra/superpowers",
  headroom: "https://github.com/headroomlabs-ai/headroom",
  rtk: "https://github.com/rtk-ai/rtk",
  laya: "https://github.com/ipenywis/laya-ultrafast",
  grandi: "https://www.andreagrandi.it/posts/claude-code-subagents-to-save-usage/",
  previousTalk: "https://app.notion.com/p/3648183ab6f6805f947cc12560e59549",
  tricksTalk: "https://www.youtube.com/watch?v=_NdFTCUk-t4",
  aa: "https://artificialanalysis.ai/?models=claude-opus-5-5%2Cclaude-opus-5-5-xhigh%2Cclaude-opus-5-5-high%2Cclaude-opus-5-5-medium%2Cclaude-opus-5-5-low%2Cclaude-sonnet-5-5%2Cclaude-sonnet-5-5-xhigh%2Cclaude-sonnet-5-5-high%2Cclaude-sonnet-5-5-medium%2Cclaude-sonnet-5-5-low%2Cgpt-6-astra",
} as const;

const stop = (s: Partial<StopScript>): StopScript => ({
  lines: [],
  labels: [],
  code: [],
  tables: [],
  cards: [],
  footnotes: [],
  stamps: [],
  ui: [],
  refs: [],
  emphasis: [],
  sources: [],
  ...s,
});

const ttlSetting: CodeBlock = {
  lang: "json",
  label: "~/.claude/settings.json",
  caption: "subagents only",
  code: '"subagentPromptCacheTtl": "1h",',
};

const ttlEnv: CodeBlock = {
  lang: "json",
  caption: "every request; a per-agent cacheTtl can still override it",
  code: '{ "env": { "ENABLE_PROMPT_CACHING_1H": "1" } }',
};

const agentTtl: CodeBlock = {
  lang: "yaml",
  label: ".claude/agents/repo-auditor.md",
  caption: "Needs v2.1.248+",
  onStage: false,
  code: [
    "---",
    "name: repo-auditor",
    "description: Audits a large repository and reports what it finds",
    "experimental:",
    "  cacheTtl: 1h",
    "---",
  ].join("\n"),
};

const subagentRows = [
  "○ general-purpose · 171.9k tokens",
  "○ general-purpose · 150.5k tokens",
  "○ general-purpose · 217.6k tokens",
  "○ general-purpose · 162.9k tokens",
  "○ general-purpose · 231.2k tokens",
];

export const SCRIPT = {
  title: stop({
    headline: "10 tips for saving tokens",
    lines: ["Callum Howard · Checkbox"],
    ui: ["fix the typo in README", "✢ Bloviating… (0s · ↓ 1.03M tokens)", ...subagentRows],
  }),

  spoiler: stop({
    headline: "Spoiler: it's basically all about context management",
    emphasis: ["context management"],
    labels: ["system", "tools", "CLAUDE.md", "messages", "tool results"],
  }),

  "fw-chatbox": stop({
    headline: "Everyone has the same chat box.",
    lines: ["So what sets you apart from the next person off the street?"],
    ui: ["Write a message…", "Sonnet 5.5", "Medium"],
  }),

  "fw-taste": stop({
    lines: [
      "1. Taste: deciding well and knowing what you want",
      "2. Care for your craft, which comes from being in our world",
    ],
    emphasis: ["being"],
  }),

  "fw-invest": stop({
    headline: "Invest in the tools of the trade.",
    lines: ["Pause to learn something that makes the next task faster.", "Let's get into it."],
    ui: [
      "subagents",
      "cache",
      "effort",
      "superpowers",
      "5h window",
      "other CLIs",
      "headroom / rtk",
      "cursor ≠ cc",
      "suggestions",
      "offers",
      "bonus",
    ],
  }),

  "t1-agents": stop({
    headline: "1. Use subagents",
    lines: ["Each subagent starts with a fresh context window."],
    labels: ["See: Orchestrating Parallel Agents (previous talk)"],
    ui: ["✶ Onioning… (29m 29s · ↓ 97.3k tokens)", "● main", ...subagentRows],
    sources: [LINKS.subAgents, LINKS.grandi, LINKS.previousTalk],
  }),

  "t1-model-effort": stop({
    headline: "Pick the model and effort",
    code: [
      {
        lang: "yaml",
        label: ".claude/agents/log-reader.md",
        code: [
          "---",
          "name: log-reader",
          "description: Reads large logs and reports what matters",
          "model: haiku",
          "effort: low",
          "---",
        ].join("\n"),
      },
    ],
    labels: [
      "model: defaults to your main session's model",
      "effort: a signal, not a hard token budget",
    ],
    sources: [LINKS.subAgents, "https://platform.claude.com/docs/en/build-with-claude/effort"],
  }),

  "t1-advisor": stop({
    headline: "Get a second opinion: /advisor opus",
    lines: [
      'Or ask: "consult the advisor before you continue"',
      "Hand off to subagents: images, exploring, large logs",
    ],
    sources: ["https://code.claude.com/docs/en/advisor", LINKS.promptCaching],
  }),

  "t2-stateless": stop({
    kicker: "2. Keep the cache warm",
    headline: "LLMs are stateless.",
    lines: ["Each turn sends the whole chat history and gets one response."],
    labels: ["Most of the context didn't change. Cache that part: the prefix.", "memory"],
    sources: [LINKS.promptCaching, LINKS.apiPromptCaching],
  }),

  "t2-kv": stop({
    headline: "Same prefix? Reuse its stored K/V tensors.",
    lines: ["Run prefill only on the new suffix."],
    footnotes: ["A cache hit skips recomputing the prefix, not loading it."],
    labels: ["K", "V", "recompute"],
    sources: [
      "https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/",
      "https://arxiv.org/abs/2312.07104",
    ],
  }),

  "t2-price": stop({
    headline: "Discounted, not free.",
    tables: [
      {
        head: ["Model", "Hit", "× input"],
        rows: [
          ["Fable 5.1", "$0.25", "0.025×"],
          ["Opus 5.5", "$0.20", "0.05×"],
          ["Sonnet 5.5", "$0.10", "0.05×"],
          ["Haiku 5.5", "$0.01", "0.1×"],
        ],
      },
    ],
    labels: ["Cache hit, per million tokens", "Cache writes cost more: 1.25× input (5m), 2× (1h)"],
    ui: ["100k-token Opus 5.5 context", "Warm $0.02", "Cold, 1h write $0.80", "40× more cold"],
    sources: [LINKS.pricing],
  }),

  "t2-ttl": stop({
    headline: "Main session: 1h cache. Subagents: 5m.",
    lines: ["Cold is 25–80× the price of warm."],
    code: [ttlSetting, ttlEnv, agentTtl],
    footnotes: [
      "5m or 1h write ÷ hit · Opus/Sonnet 5.5 25–40× · Fable 5.1 50–80× · Haiku 5.5 12.5–20×",
      "Needs Claude Code v2.1.243+",
    ],
    ui: ["subagentPromptCacheTtl", "agent experimental.cacheTtl", "ENABLE_PROMPT_CACHING_1H"],
    sources: [
      LINKS.promptCaching,
      LINKS.settings,
      LINKS.subAgents,
      "https://www.reddit.com/r/ClaudeCode/comments/1wkpm2i/claude_code_subagents_have_a_5m_prompt_cache_long/",
      "https://www.reddit.com/r/ClaudeAI/comments/1wj4gs0/subagents_burning_your_claude_code_5hour_window/",
    ],
  }),

  "t2-idle": stop({
    headline: "Avoid hourly check-ins",
    lines: [
      "A check-in after the cache expires re-reads the whole context, uncached.",
      "CC cloud likes to do this for PRs by default",
    ],
    labels: ["New setting 'Compacted while idle'", "Keep it warm: ARahim3/cachebeat"],
    ui: ["Compacted while idle, before the prompt cache expired"],
    sources: [
      "https://code.claude.com/docs/en/claude-code-on-the-web",
      "https://code.claude.com/docs/en/scheduled-tasks",
      "https://www.reddit.com/r/ClaudeCode/comments/1x2vc7g/just_noticed_this_wonderful_gem_in_my_cli_windows/",
      "https://github.com/ARahim3/cachebeat",
    ],
  }),

  "t2-switch": stop({
    headline: "Switch effort levels, not models.",
    lines: [
      "/model → the next request re-reads everything uncached",
      "/effort → keeps the cache on 5.5 models and Fable 5.1",
      "Rewind (Esc Esc) is cache safe. Summarize isn't.",
    ],
    ui: ["◀◀ /rewind · cache hit", "Moonwalking…"],
    sources: [LINKS.promptCaching, "https://code.claude.com/docs/en/checkpointing"],
  }),

  "t3-then": stop({
    headline: "3. Manage effort levels",
    lines: [
      "Opus 5 low was cheaper and better than Sonnet 5 high (dependent on the task)",
      "Last gen, Artificial Analysis Intelligence Index:",
      "Opus 5 low: 39 · $1.10/task",
      "Sonnet 5 high: 32 · $1.79/task",
    ],
    footnotes: ["Opus 5 low used ~3× fewer output tokens."],
    stamps: ["CHEAPER AND BETTER (THEN)"],
    ui: ["✢ low", "✳ medium", "✶ high", "✻ xhigh", "✽ max"],
    sources: [
      "https://artificialanalysis.ai/models/comparisons/claude-opus-5-low-vs-claude-sonnet-5-high",
    ],
  }),

  "t3-aa": stop({
    headline: "Check the current gen crossover benchmark charts",
    labels: [
      "Opus 5.5 xhigh 56 · $3.46 | Sonnet 5.5 max 56 · $5.46",
      "Opus 5.5 high 54 · $1.82 beats Sonnet 5.5 xhigh",
    ],
    footnotes: [
      "Artificial Analysis Intelligence Index v4.3.2 · cost per task at API list prices · 13 Oct 2026",
      "Sonnet 5.5 max is on the frontier by 0.01 points.",
    ],
    ui: [
      "Opus 5.5 low",
      "Opus 5.5 medium",
      "Opus 5.5 high",
      "Opus 5.5 xhigh",
      "Opus 5.5 max",
      "Sonnet 5.5 low",
      "Sonnet 5.5 medium",
      "Sonnet 5.5 high",
      "Sonnet 5.5 xhigh",
      "Sonnet 5.5 max",
      "GPT-6 Astra (max)",
    ],
    sources: [LINKS.aa],
  }),

  "t4-superpowers": stop({
    headline: "4. Only use superpowers for tasks that need it.",
    lines: [
      "Every plan task: an implementer plus two reviewer subagents.",
      "10 tasks → 30+ subagent dispatches.",
    ],
    footnotes: ["Mostly needed for larger tasks, on models less capable than Opus."],
    ui: ["superpowers", "fix the typo in README"],
    sources: [
      LINKS.superpowers,
      "https://github.com/pcvelz/superpowers",
      "https://github.com/sjh9714/skill-receipts/blob/main/docs/audits/superpowers-debugging.md",
    ],
  }),

  "t5-routines": stop({
    headline: "5. Proc the 5h window",
    lines: ["Your 5-hour window starts with your first message."],
    footnotes: ["Cloud routines run on Anthropic's servers, so your Mac can sleep."],
    ui: [
      "Say 'good morning' to Haiku daily",
      "Good morning",
      "Active · Daily at 5:30 AM",
      "Say 'good afternoon' to Haiku daily",
      "Good afternoon",
      "Active · Daily at 10:40 AM",
      "Say 'good evening' to Haiku daily",
      "Good evening",
      "Active · Daily at 3:50 PM",
      "Cloud",
    ],
    sources: [
      "https://www.reddit.com/r/ClaudeAI/comments/1wxon4e/tip_how_to_automate_hi_haiku_daily_early_morning/",
      "https://code.claude.com/docs/en/desktop-scheduled-tasks",
      "https://support.claude.com/en/articles/11647753",
    ],
  }),

  "t5-chain": stop({
    headline: "Line the resets up with your day.",
    footnotes: ["It moves when your 5h bucket refills. Your weekly limit stays the same."],
    ui: [
      "05:30 ping → resets 10:30",
      "10:40 ping → resets 15:40",
      "15:50 ping → resets 20:50",
      "AEDT",
    ],
    sources: [
      "https://www.reddit.com/r/ClaudeAI/comments/1wxon4e/tip_how_to_automate_hi_haiku_daily_early_morning/",
      "https://code.claude.com/docs/en/desktop-scheduled-tasks",
      "https://support.claude.com/en/articles/11647753",
    ],
  }),

  "t6-kiro": stop({
    headline: "6. Use kiro-cli, cursor-agent, copilot as your 'subagent' from CC",
    code: [
      {
        lang: "sh",
        code: 'kiro-cli --v3 chat --no-interactive --trust-all-tools --model claude-sonnet-5.5 --effort high "prompt"',
      },
    ],
    labels: [
      "Checkbox: ~2 more months of AWS trial quota for Kiro, incl. Opus 5.5 and Sonnet 5.5",
      "Kiro preview: Sonnet 5.5 1.30× credits, Opus 5.5 2.00×",
    ],
  }),

  "t6-others": stop({
    code: [
      {
        lang: "sh",
        code: "cursor-agent -p --force --model 'claude-sonnet-5-5[effort=high]' …",
      },
      {
        lang: "sh",
        code: "copilot -p … --allow-all-tools --model gpt-5.4 --reasoning-effort medium",
      },
      {
        lang: "sh",
        code: "codex exec -m <model> --sandbox workspace-write … -c model_reasoning_effort=high",
      },
    ],
    lines: ["Other models? Try /prompt-master."],
    sources: ["https://github.com/nidhinjs/prompt-master"],
  }),

  "t7-rtk": stop({
    headline: "7. Use Headroom or RTK",
    lines: [
      "RTK: a hook rewrites shell commands and trims their output.",
      "Bash tool only. Read, Grep and Glob bypass it.",
      "Trim too hard and the agent re-runs the command, or the rewrite breaks.",
    ],
    ui: ["⏺ Bash(git status)", "+17 more"],
    sources: [
      LINKS.rtk,
      "https://github.com/rtk-ai/rtk/issues/617",
      "https://github.com/rtk-ai/rtk/issues/236",
    ],
  }),

  "t7-headroom": stop({
    headline: "Compression vs the cache",
    lines: ["Headroom wraps Claude with a proxy."],
    code: [
      {
        lang: "sh",
        code: "headroom wrap claude --1m -- --permission-mode auto --ide --model 'claude-opus-5-5[1m]'",
      },
    ],
    labels: ["95% hit rate · 163.2M tokens read from cache"],
    footnotes: [
      "It sets ANTHROPIC_BASE_URL, which turns off Remote Control.",
      "My dashboard, one proxy process [anecdotal]",
    ],
    stamps: ["NET POSITIVE (BARELY)"],
    ui: ["Saved by compression 1.4M", "Lost to cache busts 1.1M", "Net +247.3k"],
    sources: [LINKS.headroom, "https://code.claude.com/docs/en/remote-control"],
  }),

  "t8-cache": stop({
    headline: "8. Fable in CC ≠ Fable in Cursor",
    tables: [
      {
        head: ["Cursor", "Claude Code, subscription"],
        rows: [
          ["5m cache only", "1h cache, main session"],
          ["writes 1.25× input", "writes 2× input"],
          ["billed at API list price", "flat-rate plan"],
        ],
      },
    ],
    sources: [
      "https://forum.cursor.com/t/anthropic-models-prompt-cache/171871/5",
      "https://forum.cursor.com/t/understanding-write-cache/156915/5",
      "https://cursor.com/docs/models-and-pricing",
    ],
  }),

  "t8-18x": stop({
    headline: "Up to ~18× more Fable tokens in CC for the same price",
    stamps: ["ANECDOTAL"],
    footnotes: ["Fable 5.1 on the API: $10 in, $50 out per million tokens"],
    sources: [LINKS.pricing],
  }),

  "t9-suggestions": stop({
    headline: "9. Turn off prompt suggestions",
    code: [{ lang: "json", code: '"promptSuggestionEnabled": false' }],
    lines: [
      "Each suggestion is a background call to your session's model.",
      "~3–10% of usage, per user reports",
    ],
    stamps: ["ANECDOTAL"],
    footnotes: ['Anthropic\'s docs call the cost "small".'],
    ui: ["9. Turn off prompt suggestions"],
    sources: [
      "https://www.reddit.com/r/ClaudeAI/comments/1wm8adm/psa_claude_code_turn_off_prompt_suggestions_save/",
      LINKS.settings,
      "https://code.claude.com/docs/en/interactive-mode",
    ],
  }),

  "t10-resets": stop({
    headline: "10. Anthropic extra offers",
    lines: ["Occasional weekly limit resets"],
    labels: [
      "Banked: saved in Settings › Usage. You press it.",
      "Instant: Anthropic resets everyone at once.",
    ],
    stamps: ["COMMUNITY TERMS"],
    ui: ["Full reset", "Expires Oct 23", "Reset for free"],
    sources: [
      "https://support.claude.com/en/articles/17007452-what-is-a-limit-reset",
      "https://www.anthropic.com/news/claude-opus-5-5",
    ],
  }),

  "t10-offers": stop({
    headline: "Offers come and go. Keep an eye out.",
    cards: [
      {
        headline: "Full reset",
        lines: ["Saved in Settings › Usage"],
        labels: ["Expires Oct 23"],
        footnotes: [],
        stamps: [],
      },
      {
        headline: "Monthly API credits",
        lines: [
          "Team: $20 per Standard seat, $100 per Premium seat",
          "Pooled across the org, capped at $500 a month",
          "A Team owner links a Console org. API only, not Claude Code.",
        ],
        labels: [],
        footnotes: [],
        stamps: ["NOT CLAUDE CODE"],
      },
      {
        headline: "Cloud sessions credit",
        lines: ["Claim window closed 7 Oct."],
        labels: ["Pro and Max only"],
        footnotes: [],
        stamps: ["CLOSED"],
      },
      {
        headline: "Artifact usage promotion",
        lines: ["Artifact work uses 50% less of your 5-hour limit."],
        labels: ["Claude and Cowork · not Claude Code · not weekly"],
        footnotes: ["Ends Friday 16 Oct, 5:59 PM AEDT"],
        stamps: [],
      },
    ],
    sources: [
      "https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans",
      "https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers",
      "https://www.reddit.com/r/ClaudeAI/comments/1x0f9gu/new_perk_free_100_monthly_api_credit_a_month/",
      "https://www.reddit.com/r/ClaudeAI/comments/1woiotv/anthropic_offering_100_in_credits_for_cloud/",
      "https://www.anthropic.com/legal/promotion-credit-terms",
      "https://support.claude.com/en/articles/17274727-artifact-usage-promotion",
    ],
  }),

  "b-system-one": stop({
    headline: "Bonus: Laya-ultrafast for browser use",
    lines: ["What is a System One model?"],
    labels: ["System 1: fast, automatic", "System 2: slow, deliberate"],
    ui: ["Thinking, Fast and Slow", "Daniel Kahneman", "2011"],
    sources: [
      "https://docs.typesafe.ai/concepts/system-one.md",
      "https://docs.typesafe.ai/introduction",
      LINKS.laya,
    ],
  }),

  "b-laya": stop({
    headline: "Text in, probabilities out.",
    lines: ["An LLM writes text. A System One model picks an option."],
    footnotes: ["Laya: 421M parameters, ~33 ms per decision, runs locally on Apple Silicon"],
    ui: [
      "Duplicate charge on invoice #4411",
      "department: billing 96.5%",
      "urgency: critical 55.6%",
      "churn risk: yes 82.5%",
      "refund requested: yes 84.3%",
    ],
    sources: [LINKS.laya, "https://github.com/mizorewww/laya-mlx"],
  }),

  "b-browser": stop({
    headline: "LLM plans. System One clicks.",
    lines: [
      "One LLM call per task turns the goal into steps.",
      "Laya decides each step locally. No per-step API cost.",
    ],
    footnotes: ["Port of browser-use/jev-ultrafast, which uses Jev hosted instead."],
    sources: [LINKS.laya, "https://github.com/browser-use/jev-ultrafast"],
  }),

  "aft-limits": stop({
    kicker: "Afterword",
    lines: [
      "Me going absolutely all out with parallel Fable as default model before Opus 5.5 came out",
    ],
    ui: ["All models", "Resets in 6 min", "88% used", "Fable", "Resets in 6 min", "95% used"],
  }),

  "aft-wanted": stop({
    kicker: "SIGHTINGS WANTED",
    headline: "On the 5.5 models, I'm nowhere near my quota.",
    lines: ["Still hitting yours with these tips? Teach me how."],
  }),

  "outro-thesis": stop({
    headline: "It's basically all about context management.",
    emphasis: ["context management"],
  }),

  "outro-qr": stop({
    lines: ["Shownotes, links and every source"],
    ui: ["✻ Cooked for {elapsed} · ↓ ≈3k tokens", "/shownotes"],
    refs: [
      { label: "How I use Claude Code subagents · Andrea Grandi", href: LINKS.grandi },
      { label: "Orchestrating Parallel Agents", href: LINKS.previousTalk },
      { label: "15 Claude Code tricks in 5 mins · Snow Gum Summit 2026", href: LINKS.tricksTalk },
    ],
    sources: [LINKS.grandi, LINKS.previousTalk, LINKS.tricksTalk],
  }),
} satisfies Record<string, StopScript>;

export function scriptFor(id: string): StopScript {
  const script = (SCRIPT as Record<string, StopScript | undefined>)[id];
  if (!script) throw new Error(`No script for stop "${id}"`);
  return script;
}
