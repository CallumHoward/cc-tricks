import { LINKS } from "#/talk/script";

export type ShownoteLink = { label: string; href: string };

export type ShownoteSnippet = {
  lang: "sh" | "json" | "yaml";
  label?: string;
  code: string;
};

export type ShownoteTip = {
  id: string;
  /** Tip number; the bonus has none */
  n?: number;
  title: string;
  /** Key lines, in the order they are told */
  points: string[];
  snippets: ShownoteSnippet[];
  links: ShownoteLink[];
};

export type ShownotesData = {
  title: string;
  byline: string;
  spoiler: string;
  foreword: { question: string; answers: string[]; summary: string[] };
  tips: ShownoteTip[];
  bonus: ShownoteTip;
  afterword: string[];
  references: ShownoteLink[];
};

const link = (label: string, href: string): ShownoteLink => ({ label, href });

export const SHOWNOTES: ShownotesData = {
  title: "10 tips for saving tokens",
  byline: "Callum Howard · Checkbox",
  spoiler: "It's basically all about context management",
  foreword: {
    question:
      "Everyone (more-or-less) has access to the same chat box, so what distinguishes you and me from the next random person off the street?",
    answers: [
      'Your superior ability to make decisions and know what you want – "taste".',
      "Your care for your craft and for the product we're building, something that can only truly come with physical agency and being in our world.",
    ],
    summary: [
      "If you care for your craft, then you are surely interested in investing in the tools of the trade. That investment means effort, pausing to learn something that can increase your speed or effectiveness in the next task.",
      "Anyway, you're here for a CC tips listicle, not to hear me wax philosophical, nor are you here for existential interrogation. But I do hope that these tips might help you on your journey of continual improvement. Let's get into it.",
    ],
  },
  tips: [
    {
      id: "subagents",
      n: 1,
      title: "Use subagents",
      points: [
        'See my previous talk "Orchestrating Parallel Agents"',
        "Each subagent starts with a fresh context window; only its summary comes back",
        "Specify model (default inherits)",
        "Specify effort (a signal, not a hard token budget)",
        'Consider /advisor (or manual prompting): "consult the advisor before you continue"',
        "Subagents for images",
        "Subagents for exploring, reading large logs",
      ],
      snippets: [
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
      links: [
        link("Orchestrating Parallel Agents (previous talk)", LINKS.previousTalk),
        link("Create custom subagents", LINKS.subAgents),
        link("Effort", "https://platform.claude.com/docs/en/build-with-claude/effort"),
        link("Advisor", "https://code.claude.com/docs/en/advisor"),
        link("How I use Claude Code subagents · Andrea Grandi", LINKS.grandi),
      ],
    },
    {
      id: "cache",
      n: 2,
      title: "Keep the cache warm",
      points: [
        "What is the cache?",
        "Recall, LLMs are stateless. They take the context (chat history) as input and output the next text response.",
        "When hitting 'send', most of the context is the same as the last turn. It makes sense to cache the parts that didn't change (the 'prefix').",
        "If a new request starts with an identical prefix, the server can reuse that prefix's stored K/V tensors instead of recomputing them, and run prefill only on the new suffix.",
        "The LLM server still needs to perform work on the prefix, even on a cache hit, so it's discounted, but not free. Prices are different per model.",
        "Cache hit per million tokens: Fable 5.1 $0.25, Opus 5.5 $0.20, Sonnet 5.5 $0.10, Haiku 5.5 $0.01. Writes cost 1.25× input (5m) or 2× (1h).",
        "1H cache TTL on main session (on subscription); subagents get 5m",
        "Tip: Change 5m TTL subagent",
        "subagentPromptCacheTtl: 1h in ~/.claude/settings.json (global), needs Claude Code v2.1.243+",
        "ENABLE_PROMPT_CACHING_1H=1 – better as it can be overridden",
        "This can apply to cbdev tests and static checks that may run longer than 5m on the monorepo",
        "If different cache TTLs are often needed, set up agents with different cacheTtl in .claude/agents/<name>.md (v2.1.248+, inside the experimental map)",
        "Avoid hourly check-ins",
        "CC cloud likes to do this for PRs by default",
        "New setting 'Compacted while idle'",
        "cachebeat",
        "Switch effort levels but not models",
        "Rewind is cache safe",
      ],
      snippets: [
        { lang: "json", label: "~/.claude/settings.json", code: '"subagentPromptCacheTtl": "1h",' },
        { lang: "json", code: '{ "env": { "ENABLE_PROMPT_CACHING_1H": "1" } }' },
        {
          lang: "yaml",
          label: ".claude/agents/repo-auditor.md",
          code: [
            "---",
            "name: repo-auditor",
            "description: Audits a large repository and reports what it finds",
            "experimental:",
            "  cacheTtl: 1h",
            "---",
          ].join("\n"),
        },
      ],
      links: [
        link("Prompt caching in Claude Code", LINKS.promptCaching),
        link("Prompt caching (API)", LINKS.apiPromptCaching),
        link("Pricing", LINKS.pricing),
        link("Settings reference", LINKS.settings),
        link(
          "vLLM automatic prefix caching",
          "https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/",
        ),
        link(
          "Efficient memory management for LLM serving (PagedAttention)",
          "https://arxiv.org/abs/2312.07104",
        ),
        link(
          "Claude Code sub-agents have a 5m prompt cache. Long commands can burn your 5-hour window.",
          "https://www.reddit.com/r/ClaudeCode/comments/1wkpm2i/claude_code_subagents_have_a_5m_prompt_cache_long/",
        ),
        link(
          "Sub-agents burning your Claude Code 5-hour window? Check their 5-minute prompt cache",
          "https://www.reddit.com/r/ClaudeAI/comments/1wj4gs0/subagents_burning_your_claude_code_5hour_window/",
        ),
        link(
          "Just noticed this wonderful gem in my CLI window(s) today, 'Compacted while idle, before the prompt cache expired'!",
          "https://www.reddit.com/r/ClaudeCode/comments/1x2vc7g/just_noticed_this_wonderful_gem_in_my_cli_windows/",
        ),
        link("ARahim3/cachebeat", "https://github.com/ARahim3/cachebeat"),
        link("Checkpointing", "https://code.claude.com/docs/en/checkpointing"),
      ],
    },
    {
      id: "effort",
      n: 3,
      title: "Manage effort levels",
      points: [
        "Opus 5 low was cheaper and better than Sonnet 5 high (dependent on the task)",
        "Last gen, Artificial Analysis Intelligence Index: Opus 5 low 39 at $1.10 per task, Sonnet 5 high 32 at $1.79 per task",
        "Check the current gen crossover benchmark charts",
        "Current gen, cost per task at API list prices (13 Oct 2026): Opus 5.5 xhigh 56 at $3.46, Sonnet 5.5 max 56 at $5.46",
      ],
      snippets: [],
      links: [
        link(
          "Opus 5 low vs Sonnet 5 high · Artificial Analysis",
          "https://artificialanalysis.ai/models/comparisons/claude-opus-5-low-vs-claude-sonnet-5-high",
        ),
        link("Live crossover chart · Artificial Analysis", LINKS.aa),
      ],
    },
    {
      id: "superpowers",
      n: 4,
      title: "Only use superpowers for tasks that need it",
      points: [
        "Only really needed for larger tasks with models less capable than Opus",
        "Every plan task: an implementer plus two reviewer subagents",
      ],
      snippets: [],
      links: [
        link("obra/superpowers", LINKS.superpowers),
        link("pcvelz/superpowers", "https://github.com/pcvelz/superpowers"),
        link(
          "Superpowers debugging skill audit",
          "https://github.com/sjh9714/skill-receipts/blob/main/docs/audits/superpowers-debugging.md",
        ),
      ],
    },
    {
      id: "proc",
      n: 5,
      title: "Proc the 5h window",
      points: [
        'Tip: How to automate "Hi Haiku" daily early morning',
        "Three Cloud routines: 'good morning' at 5:30 AM, 'good afternoon' at 10:40 AM, 'good evening' at 3:50 PM (AEDT)",
        "Each ping opens a fresh window right after the last one ends: resets 10:30, 15:40, 20:50",
      ],
      snippets: [],
      links: [
        link(
          'Tip: How to automate "Hi Haiku" daily early morning',
          "https://www.reddit.com/r/ClaudeAI/comments/1wxon4e/tip_how_to_automate_hi_haiku_daily_early_morning/",
        ),
        link("Desktop scheduled tasks", "https://code.claude.com/docs/en/desktop-scheduled-tasks"),
        link("Usage limits", "https://support.claude.com/en/articles/11647753"),
      ],
    },
    {
      id: "other-clis",
      n: 6,
      title: "Use kiro-cli, cursor-agent, copilot as your 'subagent' from CC",
      points: [
        "Checkbox engineering have ~two more months of trial quota from AWS for Kiro, including Opus 5.5 and Sonnet 5.5",
        "Consider /prompt-master for other models",
      ],
      snippets: [
        {
          lang: "sh",
          code: 'kiro-cli --v3 chat --no-interactive --trust-all-tools --model claude-sonnet-5.5 --effort high "prompt"',
        },
        {
          lang: "sh",
          code: `cursor-agent -p --force --model 'claude-sonnet-5-5[effort=high]' "prompt"`,
        },
        {
          lang: "sh",
          code: 'copilot -p "prompt" --allow-all-tools --model gpt-5.4 --reasoning-effort medium',
        },
        {
          lang: "sh",
          code: 'codex exec -m <model> --sandbox workspace-write "prompt" -c model_reasoning_effort=high',
        },
      ],
      links: [link("nidhinjs/prompt-master", "https://github.com/nidhinjs/prompt-master")],
    },
    {
      id: "headroom-rtk",
      n: 7,
      title: "Use Headroom or RTK",
      points: [
        "RTK uses hooks: it rewrites Bash commands and trims their output",
        "It can fight with your agent – when output format is unexpected",
        "Headroom wraps Claude with a proxy",
        "Not compatible with Claude Code remote (Remote Control): the proxy sets ANTHROPIC_BASE_URL",
        "Dashboard: 95% cache hit rate, saved by compression 1.4M, lost to cache busts 1.1M, net +247.3k",
      ],
      snippets: [
        {
          lang: "sh",
          code: "headroom wrap claude --1m -- --permission-mode auto --ide --model 'claude-opus-5-5[1m]'",
        },
      ],
      links: [
        link("rtk-ai/rtk", LINKS.rtk),
        link(
          "RTK #617: output truncation causes re-runs",
          "https://github.com/rtk-ai/rtk/issues/617",
        ),
        link("RTK #236: find flag handling", "https://github.com/rtk-ai/rtk/issues/236"),
        link("headroomlabs-ai/headroom", LINKS.headroom),
        link("Remote Control", "https://code.claude.com/docs/en/remote-control"),
      ],
    },
    {
      id: "fable-cursor",
      n: 8,
      title: "Token usage: Fable in CC ≠ Fable in Cursor, Perplexity, etc.",
      points: [
        "Cache is not the same (1.25x vs 2x write)",
        "Cursor: only the 5m cache TTL is available; Claude Code on a subscription: 1h on the main session",
        "Cursor pays API token pricing; Anthropic essentially subsidizes subscription",
        "Up to ~18x more tokens in CC for Fable for the equivalent price [anecdotal]",
      ],
      snippets: [],
      links: [
        link(
          "Understanding write cache · Cursor forum",
          "https://forum.cursor.com/t/understanding-write-cache/156915/5",
        ),
        link(
          "Anthropic models prompt cache · Cursor forum",
          "https://forum.cursor.com/t/anthropic-models-prompt-cache/171871/5",
        ),
        link("Cursor models and pricing", "https://cursor.com/docs/models-and-pricing"),
        link("Anthropic pricing", LINKS.pricing),
      ],
    },
    {
      id: "suggestions",
      n: 9,
      title: "promptSuggestionEnabled: false",
      points: [
        "~3–10% of usage, per user reports [anecdotal]: each suggestion is a background call to the same model",
        "Anthropic's docs call the cost small",
      ],
      snippets: [{ lang: "json", code: '"promptSuggestionEnabled": false' }],
      links: [
        link(
          "PSA - Claude Code: Turn off Prompt Suggestions, save ~10% of your limits/spend",
          "https://www.reddit.com/r/ClaudeAI/comments/1wm8adm/psa_claude_code_turn_off_prompt_suggestions_save/",
        ),
        link("Settings reference", LINKS.settings),
        link("Interactive mode", "https://code.claude.com/docs/en/interactive-mode"),
      ],
    },
    {
      id: "offers",
      n: 10,
      title: "Anthropic extra offers",
      points: [
        "Occasional weekly limit resets: 'banked' vs 'instant'",
        "Currently there is one 'banked' reset given (expires 23 Oct)",
        "Monthly additional Claude Platform API credits: Team $20 per Standard seat, $100 per Premium seat, pooled and capped at $500 a month",
        "A Team owner links a Console org, and it's org pooled (API only, not Claude Code)",
        "Cloud sessions credit (claim window closed 7 Oct)",
        "Artifact usage promotion (ends Friday 16 Oct, 5:59 PM AEDT)",
        "When you create or edit an artifact in Claude or Claude Cowork, part of the work that follows uses 50% less of your five-hour session limit (excludes CC)",
      ],
      snippets: [],
      links: [
        link(
          "What is a limit reset?",
          "https://support.claude.com/en/articles/17007452-what-is-a-limit-reset",
        ),
        link("Claude Opus 5.5", "https://www.anthropic.com/news/claude-opus-5-5"),
        link(
          "Monthly API credits for Max and Team plans",
          "https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans",
        ),
        link(
          "API credits for subscribers",
          "https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers",
        ),
        link(
          "New perk: free $100 Monthly API Credit a month!!",
          "https://www.reddit.com/r/ClaudeAI/comments/1x0f9gu/new_perk_free_100_monthly_api_credit_a_month/",
        ),
        link(
          "Anthropic offering $100 in credits for cloud sessions",
          "https://www.reddit.com/r/ClaudeAI/comments/1woiotv/anthropic_offering_100_in_credits_for_cloud/",
        ),
        link("Promotion credit terms", "https://www.anthropic.com/legal/promotion-credit-terms"),
        link(
          "Artifact usage promotion",
          "https://support.claude.com/en/articles/17274727-artifact-usage-promotion",
        ),
      ],
    },
  ],
  bonus: {
    id: "laya",
    title: "Bonus tip: Use Laya-ultrafast for browser use",
    points: [
      "What is a System One model? (Jev/Laya)",
      "Thinking, Fast and Slow (Daniel Kahneman, 2011)",
      "Text in, classified probabilistic options out; contrast with an LLM",
      "Fast and cheap, can even run locally",
      "Browser use: uses an LLM for planning, System One for executing",
    ],
    snippets: [],
    links: [
      link("ipenywis/laya-ultrafast", LINKS.laya),
      link("browser-use/jev-ultrafast", "https://github.com/browser-use/jev-ultrafast"),
      link("mizorewww/laya-mlx", "https://github.com/mizorewww/laya-mlx"),
      link("System One · TypeSafe docs", "https://docs.typesafe.ai/concepts/system-one.md"),
    ],
  },
  afterword: [
    "I thought of sharing my strategy here when Fable was still my default model for everything. I'm a pretty heavy user, but with these tips it was a real challenge to reach the quota limit each week. Since Opus 5.5 was released, and then Sonnet 5.5 shortly after, I have found that these models can handle all but the most complex reasoning tasks.",
    "Now defaulting to these new 5.5 generation models I'm nowhere near reaching my quota limit. If you follow (at least some of) these tips and you are able to reach your CC quota, I'd like to learn from you how you are managing to achieve that.",
  ],
  references: [
    link("How I use Claude Code subagents to make my Claude Pro limits last longer", LINKS.grandi),
    link('"Orchestrating Parallel Agents" (previous talk)', LINKS.previousTalk),
    link(
      '"15 Claude Code tricks in 5 mins" · Callum Howard · Snow Gum Summit 2026',
      LINKS.tricksTalk,
    ),
  ],
};
