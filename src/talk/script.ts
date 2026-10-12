export type NoteKind = "verbatim" | "point" | "say" | "careful";

export type Note = { kind: NoteKind; text: string };

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
  notes: Note[];
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

const verbatim = (text: string): Note => ({ kind: "verbatim", text });
const point = (text: string): Note => ({ kind: "point", text });
const say = (text: string): Note => ({ kind: "say", text });
const careful = (text: string): Note => ({ kind: "careful", text });

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
  notes: [],
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
    notes: [
      say(
        "20 minutes, 10 tips, one bonus, all for Claude Code on the Team plan (and a bit of Cursor).",
      ),
      say("Everything with a number has a source on the shownotes page (QR at the end)."),
      say(
        "The cold open is staged: the prompt is invented, the counter numbers are real (main 97.3k plus five subagents, 1.03M).",
      ),
    ],
  }),

  spoiler: stop({
    headline: "Spoiler: it's basically all about context management",
    emphasis: ["context management"],
    labels: ["system", "tools", "CLAUDE.md", "messages", "tool results"],
    notes: [
      verbatim("Spoiler: It's basically all about *context management*"),
      say(
        "Every tip either keeps context small, keeps the cached part of it reusable, or gets someone else to pay for it.",
      ),
    ],
  }),

  "fw-chatbox": stop({
    headline: "Everyone has the same chat box.",
    lines: ["So what sets you apart from the next person off the street?"],
    ui: ["Write a message…", "Sonnet 5.5", "Medium"],
    notes: [
      verbatim(
        "Q: Everyone (more-or-less) has access to the same chat box, so what distinguishes you and me from the next random person off the street?",
      ),
    ],
  }),

  "fw-taste": stop({
    lines: [
      "1. Taste: deciding well and knowing what you want",
      "2. Care for your craft, which comes from being in our world",
    ],
    emphasis: ["being"],
    notes: [
      verbatim(
        [
          "A:",
          '1. Your superior ability to make decisions and know what you want – "taste".',
          "2. Your care for your craft and for the product we're building, something that can only truly come with physical agency and *being* in our world.",
        ].join("\n"),
      ),
    ],
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
    notes: [
      verbatim(
        "If you care for your craft, then you are surely interested in investing in the tools of the trade. That investment means effort, pausing to learn something that can increase your speed or effectiveness in the next task.",
      ),
      verbatim(
        "Anyway, you're here for a CC tips listicle, not to hear me wax philosophical, nor are you here for existential interrogation. But I do hope that these tips might help you on your journey of continual improvement. Let's get into it.",
      ),
    ],
  }),

  "t1-agents": stop({
    headline: "1. Use subagents",
    lines: ["Each subagent starts with a fresh context window."],
    labels: ["See: Orchestrating Parallel Agents (previous talk)"],
    ui: ["✶ Onioning… (29m 29s · ↓ 97.3k tokens)", "● main", ...subagentRows],
    notes: [
      point('See my previous talk "Orchestrating Parallel Agents"'),
      say(
        "A subagent gets its own clean context. Only its summary comes back, so the main session stays small.",
      ),
      say(
        "Andrea Grandi keeps Opus in the main session to plan and review, a Sonnet subagent writes code, Haiku subagents scope and ship. He reports about 40% less per PR [anecdotal].",
      ),
      say(
        "The screenshot is mine: 29 minutes, five subagents at 150k to 231k tokens each, none of it in my main context.",
      ),
    ],
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
    notes: [
      point("Specify model (default inherits)"),
      point("Specify effort (taken as suggestion)"),
      say(
        "If you don't set model, the subagent runs on your main model. Explore used to be Haiku; since v2.1.198 it inherits too (capped at Opus).",
      ),
      say(
        "effort in the agent file overrides your session effort; only CLAUDE_CODE_EFFORT_LEVEL beats it. You can also ask Claude to run a subagent at an effort level (v2.1.292+), but it only does that when told.",
      ),
      say(
        'The model treats effort as a target for how much to think, not a hard cap. Anthropic: "a behavioral signal, not a strict token budget."',
      ),
    ],
    sources: [LINKS.subAgents, "https://platform.claude.com/docs/en/build-with-claude/effort"],
  }),

  "t1-advisor": stop({
    headline: "Get a second opinion: /advisor opus",
    lines: [
      'Or ask: "consult the advisor before you continue"',
      "Hand off to subagents: images, exploring, large logs",
    ],
    notes: [
      point("Consider /advisor (or manual prompting)"),
      point("Subagents for images"),
      point("Subagents for exploring, reading large logs"),
      say(
        "The advisor is a stronger model Claude consults at decision points. It reads the full conversation each time, and that read isn't cached, so each call costs.",
      ),
      say(
        "Turning it on or off doesn't break your main cache. Experimental, Anthropic API only (not Bedrock or Vertex).",
      ),
      say(
        "Images pile up in context and Claude Code drops the oldest in batches, which costs a slow turn. A subagent looks at them and returns text.",
      ),
      say(
        "Same for exploring and big logs: the subagent reads 200k tokens, you get the 2k that matter.",
      ),
    ],
    sources: ["https://code.claude.com/docs/en/advisor", LINKS.promptCaching],
  }),

  "t2-stateless": stop({
    kicker: "2. Keep the cache warm",
    headline: "LLMs are stateless.",
    lines: ["Each turn sends the whole chat history and gets one response."],
    labels: ["Most of the context didn't change. Cache that part: the prefix.", "memory"],
    notes: [
      say(
        "This is the big one. Most of what you spend in a long session is the cache, warm or cold.",
      ),
      point(
        "Recall, LLMs are stateless. They take the context (chat history) as input and output the next text response.",
      ),
      point(
        "When hitting 'send', most of the context is the same as the last turn. It makes sense to cache the parts that didn't change (the 'prefix').",
      ),
      say(
        "Claude doesn't remember your last message. Claude Code re-sends the system prompt, project context, every message and tool result, plus your new message.",
      ),
      say(
        "New content is only ever appended at the end. Change anything earlier, and everything after it is recomputed.",
      ),
    ],
    sources: [LINKS.promptCaching, LINKS.apiPromptCaching],
  }),

  "t2-kv": stop({
    headline: "Same prefix? Reuse its stored K/V tensors.",
    lines: ["Run prefill only on the new suffix."],
    footnotes: ["A cache hit skips recomputing the prefix, not loading it."],
    labels: ["K", "V", "recompute"],
    notes: [
      point(
        "If a new request starts with an identical prefix, the server can reuse that prefix's stored K/V tensors instead of recomputing them, and run prefill only on the new suffix.",
      ),
      say(
        "K/V are the attention keys and values for every token. Prefill is the pass over your input before the first output token.",
      ),
      say(
        "Anthropic doesn't publish its internals; this is the standard prefix-caching technique (vLLM, SGLang). Hence 'can'.",
      ),
    ],
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
    notes: [
      point(
        "The LLM server still needs to perform work on the prefix, even on a cache hit, so it's discounted, but not free. Prices are different per model.",
      ),
      say("A hit is 2.5% to 10% of the input price depending on the model."),
      say(
        "A cold return pays a cache write, at 1.25× or 2× input. On Opus 5.5 that's 25× to 40× the warm price.",
      ),
      say(
        "Switching just this once from a 100k Opus session to Sonnet costs $0.25 to $0.40 in writes vs $0.02 to stay put.",
      ),
    ],
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
    notes: [
      point("1H cache TTL on main session (on subscription)"),
      point("subagentPromptCacheTtl: 1h in ~/.claude/settings.json (global)"),
      point("ENABLE_PROMPT_CACHING_1H=1 – better as it can be overridden"),
      point(
        "This can apply to cbdev tests and static checks that may run longer than 5m on the monorepo",
      ),
      point(
        "If different cache TTLs are often needed, set up agents with different cacheTtl in .claude/agents/<name>.md",
      ),
      say(
        "On a subscription the hour is within plan usage; on usage credits the main session drops to 5m too.",
      ),
      say(
        "The hour is measured from the start of the last request that read or wrote the cache, not the end of the response.",
      ),
      say(
        "Subagents, workflows, compaction and session titles all sit in the 5-minute bucket by default. A subagent that waits 6 minutes on a test run comes back cold and re-writes its whole context.",
      ),
      say(
        "Precedence, top wins: FORCE_PROMPT_CACHING_5M, the bucket env var, the bucket setting, an agent's cacheTtl, then ENABLE_PROMPT_CACHING_1H. That's why the env var is the friendlier default.",
      ),
      say(
        "subagentPromptCacheTtl works in any settings file, not only global. cacheTtl has to sit inside the experimental map. The setting outranks the pin, so don't combine them.",
      ),
      say(
        "One user on Max 5x saw about 75% fewer cache writes after switching subagents to 1h [anecdotal].",
      ),
      say(
        "1h writes cost 2× instead of 1.25×, so it only pays when a subagent sits idle past 5 minutes, like our cbdev test runs.",
      ),
    ],
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
    notes: [
      point("CC cloud likes to do this for PRs by default"),
      point("New setting 'Compacted while idle'"),
      point("cachebeat"),
      say(
        "That one is my own observation: cloud sessions check in on PRs on their own. Each check-in past the TTL pays a full re-read.",
      ),
      say(
        "In the CLI, on a long session (200k+ tokens) Claude Code may compact while you're idle, just before the 1h cache expires. The opt-out key is idleCompaction: false.",
      ),
      say(
        "cachebeat is a small third-party skill: a hook sends a heartbeat every 50 minutes to keep the cache warm. Its README's 0.1× reads figure is out of date for the 5.5 models.",
      ),
    ],
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
    notes: [
      point("Switch effort levels but not models"),
      point("Rewind is cache safe"),
      say(
        "Every model has its own cache. opusplan, model fallback, and skills that name another model all count as switches.",
      ),
      say(
        "Effort changes keep the cache on Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1, via subscription or API key. Not on Bedrock or Vertex, and not on older models.",
      ),
      say(
        "Rewind truncates back to a prefix that's already cached. Summarize works like /compact and builds a new one.",
      ),
      careful(
        "Rewind demo: say watch first, press back and let it land, press forward, never double-tap.",
      ),
    ],
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
    notes: [
      point("Opus 5 low was cheaper and better than Sonnet 5 high (dependent on the task)"),
      say(
        "Opus costs 2.5× more per token, but Sonnet 5 high wrote about 3× the tokens (44k vs 15k per task).",
      ),
      say("Depends on the task: Sonnet 5 high still won SciCode, 54% vs 49%."),
    ],
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
    notes: [
      point("Check the current gen crossover benchmark charts"),
      say(
        "This gen it flips at the bottom: Opus 5.5 low (42, $0.55) is cheaper than Sonnet 5.5 high (47, $0.88) but scores lower.",
      ),
      say(
        "Higher up, Opus wins. Same score as Sonnet max at 63% of the cost, because Sonnet max writes 197k output tokens per task vs Opus xhigh's 66k.",
      ),
      say("Opus max adds about 2 points over xhigh for 1.7× the cost. Diminishing returns."),
      say("These are API prices; on a subscription it's quota, but the token counts drive both."),
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
    notes: [
      point("Only really needed for larger tasks with models less capable than Opus"),
      say(
        "superpowers chains brainstorm, plan, then per task an implementer and two reviewers, all on your session model by default (pcvelz fork README).",
      ),
      say(
        'The maintainer agrees it costs more by design: "doing additional review and TDD is going to be more expensive". v7.0.0 (10 Oct) cut planning to about a third of the tokens.',
      ),
      say(
        "One small third-party benchmark: the debugging skill alone raised cost per run 80% with no accuracy change [anecdotal, n=20].",
      ),
    ],
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
    notes: [
      point('Tip: How to automate "Hi Haiku" daily early morning'),
      say(
        "The Reddit tip is one scheduled hi to Haiku early each morning, so a window is already running when you start. Chaining three is my extension.",
      ),
      say(
        "These are Cloud routines: Desktop, Code, Routines, New routine, Cloud. Cloud needs a repo and runs at most hourly. Times are AEDT.",
      ),
      say(
        "In practice the window starts with your first message; the consumer docs only say it resets every five hours.",
      ),
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
    notes: [
      say(
        "Each ping lands 10 minutes after the previous window ends, so it opens a fresh one: 5:30 to 10:30, 10:40 to 15:40, 15:50 to 20:50.",
      ),
      say("No extra quota. It only helps if you actually hit the 5-hour cap."),
      say(
        "If you send a real message in the 10-minute gap, nothing breaks; the next ping still lands after.",
      ),
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
    notes: [
      say("Claude Code runs these as plain shell commands, so the work lands on another quota."),
      say(
        "Kiro model ids use dots (claude-sonnet-5.5), unlike the API's claude-sonnet-5-5. Both models are labeled Experimental preview in Kiro.",
      ),
      say("--v3 opts in to the next-gen agent; v2 is still the default in kiro-cli 2.29.1."),
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
    notes: [
      point("Consider /prompt-master for other models"),
      say(
        "-p plus --force is what lets cursor-agent write files; without it changes are only proposed.",
      ),
      say(
        "Model names drift, so cursor-agent --list-models is the quick check if one is rejected.",
      ),
      say(
        "prompt-master is a skill that writes prompts tuned for each target tool. It's about 8k tokens itself when loaded.",
      ),
    ],
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
    notes: [
      point("RTK uses hooks"),
      point("It can fight with your agent – when output format is unexpected"),
      say("git status becomes rtk git status before it runs."),
      say("RTK says up to 90% of the bash output, and also says that's not 90% off your bill."),
      say(
        "Real issues: grep capped at 10 matches per file made Claude search again and cost more (#617); rtk find rejected normal find flags (#236).",
      ),
    ],
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
    notes: [
      point("Headroom wraps Claude with a proxy"),
      point("Not compatible with Claude Code remote"),
      point("Dashboard"),
      say(
        "Compression runs locally; in its default cache mode it only compresses the newest turn so the cached prefix stays byte-identical.",
      ),
      say(
        "--1m keeps the 1M context window; behind a proxy Claude Code would otherwise cap at 200k.",
      ),
      say(
        "Remote Control (/rc) refuses a custom base LINKS. Cloud sessions are unaffected; they never touch your proxy.",
      ),
      say(
        "Compression only pays if it doesn't break the cache. Here it barely won. The cache itself saved $593.69 at API prices; compression saved $9.64.",
      ),
    ],
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
    notes: [
      point("Cache is not the same (1.25x vs 2x write)"),
      point("Only cache TTL 5m is available"),
      point("Cursor pays API token pricing"),
      say(
        "Cursor staff, Sep 2026: they tested 1h writes at 2× and the extra cost slightly outweighed the savings, so no plans to change.",
      ),
      say("Cursor refreshes the 5 minutes on every hit, so it only hurts when you step away."),
      say(
        "Same idea for Perplexity and other API-priced tools. That one is an aside, I haven't checked their pricing.",
      ),
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
    notes: [
      point("Anthropic essentially subsidizes subscription"),
      say(
        "The ~18× comes from a Reddit post (I don't have the link), hence anecdotal. Anthropic doesn't publish plan limits in tokens, so nobody can check it exactly.",
      ),
      say("Subsidizes is my read of it, not an Anthropic statement."),
    ],
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
    notes: [
      point("PSA - Claude Code: Turn off Prompt Suggestions, save ~10% of your limits/spend"),
      say(
        "It's mostly cache reads of your whole context, so it grows with context size. The PSA author measured 10.7% of spend over 14 days on 355k-token Fable sessions; a commenter saw 3–4%.",
      ),
      say(
        "Exact key is promptSuggestionEnabled (singular). One commenter's mis-cased key did nothing. Restart after changing it; /config has a toggle too.",
      ),
    ],
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
    notes: [
      point("'Banked' vs 'instant'"),
      point("Currently there is one 'banked' reset given (expires 23 Oct)"),
      say(
        'The Opus 5.5 launch gave subscribers "a rate limit reset, which you can now save and use whenever you choose".',
      ),
      say(
        "A full reset refills both your 5-hour and weekly limits. It doesn't move your weekly reset day. Downgrade or cancel first and you lose it.",
      ),
      say(
        "The button is on web and Desktop, not in the Claude Code terminal, but limits are account-wide.",
      ),
    ],
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
    notes: [
      point("Org admin needs to enable it, and it's org pooled"),
      point("Cloud sessions credit (expired 7 Oct)"),
      point("Artifact usage promotion (expires 15 Oct)"),
      say(
        "Monthly API credits cover the API, Batches, Playground, Agent SDK. Interactive Claude Code isn't covered; claude -p only if you run it with a key from the linked org.",
      ),
      say(
        "Unused credits expire each billing cycle. No rollover. For Max it's $100 (5x) or $200 (20x) a month.",
      ),
      say("If you claimed the cloud credit, it runs until 5 Nov."),
      say(
        "The artifact discount covers the next 10 messages after you create or edit an artifact in a chat, and doesn't touch the weekly limit. It ends 15 Oct 11:59 PM Pacific, which is Friday 5:59 PM in Sydney.",
      ),
      verbatim(
        "When you create or edit an artifact in Claude or Claude Cowork, part of the work that follows uses 50% less of your five-hour session limit (excludes CC)",
      ),
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
    notes: [
      point("What is a System One model? (Jev/Laya)"),
      point("Thinking, fast and slow"),
      say(
        "System One is TypeSafe's term for models that \"return typed answers and probabilities rather than generated text\", named after Kahneman's System 1.",
      ),
      say(
        "Jev is TypeSafe's hosted System One model. Laya is a separate open-weight model; the laya-ultrafast port swaps Jev for Laya running locally.",
      ),
    ],
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
    notes: [
      point("Text in, classified probabilistic options out"),
      point("Contrast with LLM"),
      point("Fast and cheap, can even run locally"),
      say("No generated text at all: 348 input tokens, 0 output tokens."),
      say(
        "The number to trust is answer_confidence; the playground says its other confidence field isn't calibrated. Calibration is measured across many answers; it doesn't promise any single answer is right.",
      ),
      careful(
        "~33 ms is one local decision. The playground's full request took 15.76 s round trip, so don't call a live playground demo fast.",
      ),
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
    notes: [
      point("Uses LLM for planning, System One for executing"),
      say(
        "That's exactly how laya-ultrafast works. In the original jev-ultrafast, Jev picks each action and a small LLM only types text.",
      ),
      say(
        "jev-ultrafast's own demo: Zurich to London on Google Flights in about 7 seconds. Their caveat: not a general reliability benchmark.",
      ),
    ],
    sources: [LINKS.laya, "https://github.com/browser-use/jev-ultrafast"],
  }),

  "aft-limits": stop({
    kicker: "Afterword",
    lines: [
      "Me going absolutely all out with parallel Fable as default model before Opus 5.5 came out",
    ],
    ui: ["All models", "Resets in 6 min", "88% used", "Fable", "Resets in 6 min", "95% used"],
    notes: [
      verbatim(
        "I thought of sharing my strategy here when Fable was still my default model for everything. I'm a pretty heavy user, but with these tips it was a real challenge to reach the quota limit each week. Since Opus 5.5 was released, and then Sonnet 5.5 shortly after, I have found that these models can handle all but the most complex reasoning tasks.",
      ),
    ],
  }),

  "aft-wanted": stop({
    kicker: "SIGHTINGS WANTED",
    headline: "On the 5.5 models, I'm nowhere near my quota.",
    lines: ["Still hitting yours with these tips? Teach me how."],
    notes: [
      verbatim(
        "Now defaulting to these new 5.5 generation models I'm nowhere near reaching my quota limit. If you follow (at least some of) these tips and you are able to reach your CC quota, I'd like to learn from you how you are managing to achieve that.",
      ),
    ],
  }),

  "outro-thesis": stop({
    headline: "It's basically all about context management.",
    emphasis: ["context management"],
    notes: [say("The spoiler again, because it held up.")],
  }),

  "outro-qr": stop({
    lines: ["Shownotes, links and every source"],
    ui: ["✻ Cooked for {elapsed} · ↓ ≈3k tokens", "/shownotes"],
    refs: [
      { label: "How I use Claude Code subagents · Andrea Grandi", href: LINKS.grandi },
      { label: "Orchestrating Parallel Agents", href: LINKS.previousTalk },
      { label: "15 Claude Code tricks in 5 mins · Snow Gum Summit 2026", href: LINKS.tricksTalk },
    ],
    notes: [say("Every claim in this talk links to its source on the shownotes page.")],
    sources: [LINKS.grandi, LINKS.previousTalk, LINKS.tricksTalk],
  }),
} satisfies Record<string, StopScript>;

export function scriptFor(id: string): StopScript {
  const script = (SCRIPT as Record<string, StopScript | undefined>)[id];
  if (!script) throw new Error(`No script for stop "${id}"`);
  return script;
}
