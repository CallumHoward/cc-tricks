# Copy deck: "10 tips for saving tokens"

Status: draft for Callum's review (13 Oct 2026). Feeds the typed content source (D17): stage copy, presenter notes, `/shownotes`.
Facts behind every number are in `FACTS.md` (ids like `T2.1.3` below point there).

## How to read this

- One block per proposed stop. Stop ids `S00`–`S39` are proposals; the storyboard assigns `at`/`holdSpan` and motion.
- **On screen** regions: `H` headline, `L1..` supporting lines, `Label`, `Foot` (footnote), `Code` (exact, not word-counted),
  `UI` (text inside a rebuilt UI replica, copied exactly from the screenshot). `(Nw)` = word count (separators like `·` and `→` not counted); the cap is 16 per region. Max in this deck: 16.
- **Notes** = presenter console. Where Callum wrote prose it is kept verbatim (marked _verbatim_). Where he wrote dot points,
  his point comes first, then 2–4 "say" prompts with verified facts.
- **Δ** = every change from the shownotes and why. "none" means the on-screen text is his wording, at most shortened.
- Spelling is US (repo rule). His verbatim prose keeps his punctuation, including en dashes.
- `[anecdotal]` is his marker; it is reused for every single-user or self-reported number.

Stop count: 40 (title + spoiler 2, foreword 3, tips 29, bonus 3, afterword 2, outro 1). Merge candidates if the
storyboard needs fewer: S09+S10, S14+S15, S25+S26, S32+S33.

---

## Title and spoiler

### S00 · Title

**On screen**

- H (5w): 10 tips for saving tokens
- L1 (4w): Callum Howard · Checkbox engineering

**Notes** (no prose in shownotes; prompts)

- 20 minutes, 10 tips, one bonus, all for Claude Code on the Team plan (and a bit of Cursor).
- Everything with a number has a source on the shownotes page (QR at the end).

**Δ** Dropped the 💸 emoji from the on-screen title (Newsreader has no emoji glyph; see Needs Callum). Added the byline.
**Sources** none

### S01 · Spoiler

**On screen**

- H (7w): Spoiler: it's basically all about context management

**Notes** _verbatim_: "Spoiler: It's basically all about _context management_"

- Say: every tip either keeps context small, keeps the cached part of it reusable, or gets someone else to pay for it.

**Δ** Sentence case ("it's"). The italic on "context management" stays as emphasis (italic Newsreader).
**Sources** none

---

## Foreword

### S02 · The same chat box

**On screen**

- UI: composer replica. Placeholder `Write a message…`, footer `Sonnet 5.5` `Medium`
- H (6w): Everyone has the same chat box.
- L1 (12w): So what sets you apart from the next person off the street?

**Notes** _verbatim_: "Q: Everyone (more-or-less) has access to the same chat box, so what distinguishes you and me from the next random person off the street?"

**Δ** On-screen is a condensed version of the question; the full question is in the notes. "(more-or-less)" moved to speech only.
**Sources** refs/foreword.png (F.1)

### S03 · Taste and care

**On screen**

- A1 (9w): 1. Taste: deciding well and knowing what you want
- A2 (12w): 2. Care for your craft, which comes from _being_ in our world

**Notes** _verbatim_:
"A:

1. Your superior ability to make decisions and know what you want – "taste".
2. Your care for your craft and for the product we're building, something that can only truly come with physical agency and _being_ in our world."

**Δ** Each answer shortened to fit one region; wording kept close. The full answers are spoken.
**Sources** none (opinion, F.2/F.3)

### S04 · Invest in the tools

**On screen**

- H (7w): Invest in the tools of the trade.
- L1 (10w): Pause to learn something that makes the next task faster.
- L2 (4w): Let's get into it.

**Notes** _verbatim_:
"If you care for your craft, then you are surely interested in investing in the tools of the trade. That investment means effort, pausing to learn something that can increase your speed or effectiveness in the next task.

Anyway, you're here for a CC tips listicle, not to hear me wax philosophical, nor are you here for existential interrogation. But I do hope that these tips might help you on your journey of continual improvement. Let's get into it."

**Δ** H and L1 are lifted from his paragraph; L2 is his last line.
**Sources** none

---

## Tip 1 · Use subagents

### S05 · Use subagents

**On screen**

- H (3w): 1. Use subagents
- UI: TUI replica from the screenshot: `✶ Onioning… (29m 29s · ↓ 97.3k tokens)`, agent list: main + 5 general-purpose subagents (150k–231k tokens each). Statusline and project name dropped.
- L1 (8w): Each subagent starts with a fresh context window.
- Label (6w): See: Orchestrating Parallel Agents (previous talk)

**Notes** his point: "See my previous talk 'Orchestrating Parallel Agents'"

- Say: a subagent gets its own clean context. Only its summary comes back, so the main session stays small (T1.5).
- Say: Andrea Grandi keeps Opus in the main session to plan and review, a Sonnet subagent writes code, Haiku subagents scope and ship. He reports about 40% less per PR [anecdotal] (R.1).
- Say: the screenshot is mine: 29 minutes, five subagents at 150k–231k tokens each, none of it in my main context.

**Δ** L1 is new (the "why" behind the tip, from the docs). Label condenses his first sub-point.
**Sources** https://code.claude.com/docs/en/sub-agents · https://www.andreagrandi.it/posts/claude-code-subagents-to-save-usage/ · Orchestrating Parallel Agents (Notion URL needed)

### S06 · Pick the model and effort

**On screen**

- H (5w): Pick the model and effort
- Code (illustrative agent file, `.claude/agents/log-reader.md`):
  ```yaml
  ---
  name: log-reader
  description: Reads large logs and reports what matters
  model: haiku
  effort: low
  ---
  ```
- Label (7w): model: defaults to your main session's model
- Label (8w): effort: a signal, not a hard token budget

**Notes** his points: "Specify model (default inherits)", "Specify effort (taken as suggestion)"

- Say: if you don't set `model`, the subagent runs on your main model. Explore used to be Haiku; since v2.1.198 it inherits too (capped at Opus) (T1.2).
- Say: `effort` in the agent file overrides your session effort; only `CLAUDE_CODE_EFFORT_LEVEL` beats it. You can also ask Claude to run a subagent at an effort level (v2.1.292+), but it only does that when told (T1.3).
- Say: the model treats effort as a target for how much to think, not a hard cap. Anthropic: "a behavioral signal, not a strict token budget."

**Δ** New illustrative code block (his notes had none). "taken as suggestion" → "a signal, not a hard token budget": the harness applies the level strictly; only the model's use of it is soft (T1.3).
**Sources** https://code.claude.com/docs/en/sub-agents · https://platform.claude.com/docs/en/build-with-claude/effort

### S07 · Advisor, and what to hand off

**On screen**

- H (6w): Get a second opinion: `/advisor opus`
- L1 (8w): Or ask: "consult the advisor before you continue"
- L2 (8w): Hand off to subagents: images, exploring, large logs

**Notes** his points: "Consider `/advisor` (or manual prompting)", "Subagents for images", "Subagents for exploring, reading large logs"

- Say: the advisor is a stronger model Claude consults at decision points. It reads the full conversation each time, and that read isn't cached, so each call costs (T1.4).
- Say: turning it on or off doesn't break your main cache. Experimental, Anthropic API only (not Bedrock/Vertex).
- Say: images pile up in context and Claude Code drops the oldest in batches, which costs a slow turn. A subagent looks at them and returns text.
- Say: same for exploring and big logs: the subagent reads 200k tokens, you get the 2k that matter.

**Δ** "manual prompting" shown as the documented prompt phrase. Images/exploring/logs merged into one line.
**Sources** https://code.claude.com/docs/en/advisor · https://code.claude.com/docs/en/prompt-caching

---

## Tip 2 · Keep the cache warm (explainer)

### S08 · Keep the cache warm

**On screen**

- H (5w): 2. Keep the cache warm
- L1 (4w): What is the cache?

**Notes**

- Say: this is the big one. Most of what you "spend" in a long session is the cache, warm or cold.

**Δ** none
**Sources** none

### S09 · Stateless

**On screen**

- H (3w): LLMs are stateless.
- L1 (11w): Each turn sends the whole chat history and gets one response.

**Notes** his point (near verbatim): "Recall, LLMs are stateless. They take the context (chat history) as input and output the next text response."

- Say: Claude doesn't remember your last message. Claude Code re-sends the system prompt, project context, every message and tool result, plus your new message (T2.1.1).

**Δ** none in meaning; shortened.
**Sources** https://code.claude.com/docs/en/prompt-caching

### S10 · The prefix

**On screen**

- H (6w): Most of the context didn't change.
- L1 (5w): Cache that part: the prefix.

**Notes** his point (near verbatim): "When hitting 'send', most of the context is the same as the last turn. It makes sense to cache the parts that didn't change (the 'prefix')."

- Say: new content is only ever appended at the end. Change anything earlier, and everything after it is recomputed (T2.1.2).

**Δ** none
**Sources** https://code.claude.com/docs/en/prompt-caching · https://platform.claude.com/docs/en/build-with-claude/prompt-caching

### S11 · K/V reuse

**On screen**

- H (7w): Same prefix? Reuse its stored K/V tensors.
- L1 (7w): Run prefill only on the new suffix.
- Foot (10w): A cache hit skips recomputing the prefix, not loading it.

**Notes** his point, corrected: "If a new request starts with an identical prefix, the server can reuse that prefix's stored K/V tensors instead of recomputing them, and run prefill only on the new suffix."

- Say: K/V = the attention keys and values for every token. Prefill = the pass over your input before the first output token.
- Say: Anthropic doesn't publish its internals; this is the standard prefix-caching technique (vLLM, SGLang). Hence "can".

**Δ** "skip loading that prefix's K/V tensors" → "reuse … instead of recomputing". On a hit the server loads the stored tensors and skips computing them; "skip loading" says the opposite (T2.1.3).
**Sources** https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/ · https://arxiv.org/abs/2312.07104

### S12 · Discounted, not free

**On screen**

- H (3w): Discounted, not free.
- UI table "Cache hit, per million tokens":
  | Model | Hit | × input |
  |---|---|---|
  | Fable 5.1 | $0.25 | 0.025× |
  | Opus 5.5 | $0.20 | 0.05× |
  | Sonnet 5.5 | $0.10 | 0.05× |
  | Haiku 5.5 | $0.01 | 0.1× |
- Label (9w): Cache writes cost more: 1.25× input (5m), 2× (1h)
- Widget (wall-clock, optional): 100k-token Opus 5.5 context. Warm: `$0.02`. Cold, 1h write: `$0.80`. Label (3w): 40× more cold.

**Notes** his point (near verbatim): "The LLM server still needs to perform work on the prefix, even on a cache hit, so it's discounted, but not free. Prices are different per model."

- Say: a hit is 2.5% to 10% of the input price depending on the model (T2.1.4, T2.1.5).
- Say: a cold return pays a cache _write_, at 1.25× or 2× input. On Opus 5.5 that's 25× to 40× the warm price.
- Say: switching "just this once" from a 100k Opus session to Sonnet costs $0.25–$0.40 in writes vs $0.02 to stay put.

**Δ** Numbers added (live pricing page, 13 Oct). Widget is new.
**Sources** https://platform.claude.com/docs/en/about-claude/pricing

### S13 · Which TTL you get

**On screen**

- H (6w): Main session: 1h cache. Subagents: 5m.
- L1 (6w): On a subscription, within plan usage.
- Foot (12w): Once you're on usage credits, the main session drops to 5m too.

**Notes** his point: "1H cache TTL on main session (on subscription)"

- Say: the hour is measured from the start of the last request that read or wrote the cache, not the end of the response (T2.2).
- Say: subagents, workflows, compaction and session titles all sit in the 5-minute bucket by default (T2.3).
- Say: so a subagent that waits 6 minutes on a test run comes back cold and re-writes its whole context.

**Δ** Added the usage-credits caveat (docs).
**Sources** https://code.claude.com/docs/en/prompt-caching

### S14 · Give subagents the hour

**On screen**

- H (5w): Give subagents the hour too
- Code A, label `~/.claude/settings.json`:
  ```json
  "subagentPromptCacheTtl": "1h",
  ```
- Code B:
  ```json
  { "env": { "ENABLE_PROMPT_CACHING_1H": "1" } }
  ```
- Label A (2w): subagents only
- Label B (9w): every request; a per-agent cacheTtl can still override it
- Foot (4w): Needs Claude Code v2.1.243+

**Notes** his points: "`subagentPromptCacheTtl: 1h` in `~/.claude/settings.json` (global)"; "`ENABLE_PROMPT_CACHING_1H=1` – better as it can be overridden"; "This can apply to `cbdev` tests and static checks that may run longer than 5m on the monorepo"

- Say: precedence, top wins: `FORCE_PROMPT_CACHING_5M`, the bucket env var, the bucket setting, an agent's `cacheTtl`, then `ENABLE_PROMPT_CACHING_1H`. That's why the env var is the friendlier default (T2.3.2).
- Say: `subagentPromptCacheTtl` works in any settings file, not only global.
- Say: one user on Max 5x saw about 75% fewer cache writes after switching subagents to 1h [anecdotal] (T2.3.1a).
- Say: 1h writes cost 2× instead of 1.25×, so it only pays when a subagent sits idle past 5 minutes, like our cbdev test runs.

**Δ** Labels explain the difference his note implies. Version floor added (changelog lists 2.1.243; docs say 2.1.242).
**Sources** https://code.claude.com/docs/en/prompt-caching · https://code.claude.com/docs/en/settings-reference · https://www.reddit.com/r/ClaudeCode/comments/1wkpm2i/claude_code_subagents_have_a_5m_prompt_cache_long/ · https://www.reddit.com/r/ClaudeAI/comments/1wj4gs0/subagents_burning_your_claude_code_5hour_window/

### S15 · Per-agent TTL

**On screen**

- H (4w): Different TTLs per agent
- Code, label `.claude/agents/repo-auditor.md`:
  ```yaml
  ---
  name: repo-auditor
  description: Audits a large repository and reports what it finds
  experimental:
    cacheTtl: 1h
  ---
  ```
- Foot (11w): Skip subagentPromptCacheTtl if you pin agents: the setting outranks the pin.
- Label (2w): Needs v2.1.248+

**Notes** his point: "If different cache TTLs are often needed, set up agents with different `cacheTtl` in `.claude/agents/<name>.md`"

- Say: `cacheTtl` has to sit inside the `experimental` map; at the top level it's ignored (T2.3.4).
- Say: pins are ignored while your subscription is on usage credits.

**Δ** Footnote added: the settings key beats the frontmatter pin, so combining them silently disables the pins.
**Sources** https://code.claude.com/docs/en/sub-agents

### S16 · Avoid hourly check-ins

**On screen**

- H (3w): Avoid hourly check-ins
- L1 (11w): A check-in after the cache expires re-reads the whole context, uncached.
- UI: TUI notice replica: `Compacted while idle, before the prompt cache expired`
- Label (4w): Opt out: `"idleCompaction": false`
- Label (4w): Keep it warm: ARahim3/cachebeat

**Notes** his points: "CC cloud likes to do this for PRs by default"; "New setting 'Compacted while idle'"; cachebeat

- Say: in my experience, cloud sessions check in on PRs on their own [my observation]. The docs describe PR auto-fix as event-driven, and `/goal` check-ins back off at 30 min, 1 h, then 2 h. Each one past the TTL pays a full re-read (T2.4.1).
- Say: new in the CLI: on a long session (200k+ tokens) Claude Code may compact while you're idle, just before the 1h cache expires. It's a behavior rolled out by server flag, not a setting you turn on (T2.4.2).
- Say: cachebeat is a small third-party skill: a hook sends a heartbeat every 50 minutes to keep the cache warm. Its README's "0.1× reads" figure is out of date for the 5.5 models (T2.4.3).

**Δ** "CC cloud likes to do this for PRs by default" moved to notes as his observation (docs don't support a default schedule). "New setting" → behavior with an opt-out key.
**Sources** https://code.claude.com/docs/en/claude-code-on-the-web · https://code.claude.com/docs/en/scheduled-tasks · https://www.reddit.com/r/ClaudeCode/comments/1x2vc7g/just_noticed_this_wonderful_gem_in_my_cli_windows/ · https://github.com/ARahim3/cachebeat

### S17 · Effort, not models. Rewind.

**On screen**

- H (5w): Switch effort levels, not models.
- L1 (7w): `/model` → the next request re-reads everything uncached
- L2 (10w): `/effort` → keeps the cache on 5.5 models and Fable 5.1
- L3 (8w): Rewind (Esc Esc) is cache safe. Summarize isn't.

**Notes** his points: "Switch effort levels but not models"; "Rewind is cache safe"

- Say: every model has its own cache. `opusplan`, model fallback, and skills that name another model all count as switches (T2.5).
- Say: effort changes keep the cache on Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1, via subscription or API key. Not on Bedrock/Vertex, and not on older models.
- Say: rewind truncates back to a prefix that's already cached. Summarize works like `/compact` and builds a new one (T2.6).

**Δ** Scope added to the effort claim (true only on current models). "Summarize isn't" added from the docs.
**Sources** https://code.claude.com/docs/en/prompt-caching · https://code.claude.com/docs/en/checkpointing

---

## Tip 3 · Manage effort levels

### S18 · Last gen

**On screen**

- H (4w): 3. Manage effort levels
- L1 (6w): Last gen, Artificial Analysis Intelligence Index:
- L2 (5w): Opus 5 low: 39 · $1.10/task
- L3 (5w): Sonnet 5 high: 32 · $1.79/task
- Foot (12w): Opus 5 low used ~3× fewer output tokens. Depends on the task.

**Notes** his point: "Opus 5 low was cheaper and better than Sonnet 5 high (dependent on the task)"

- Say: Opus costs 2.5× more per token, but Sonnet 5 high wrote about 3× the tokens (44k vs 15k per task) (T3.1).
- Say: "depends on the task": Sonnet 5 high still won SciCode, 54% vs 49%.

**Δ** "dependant" → "dependent" (US). Numbers and attribution added.
**Sources** https://artificialanalysis.ai/models/comparisons/claude-opus-5-low-vs-claude-sonnet-5-high

### S19 · Current gen crossover

**On screen**

- H (4w): Check the current-gen crossover.
- UI: rebuilt scatter, x = cost per task (log, $0.30–$10), y = AA index. 10 Claude points + GPT-6 Astra from `data-capture/aa.json`. Point labels: `Opus 5.5 low` … `max`, `Sonnet 5.5 low` … `max`, `GPT-6 Astra (max)`.
- Callout A (10w): Opus 5.5 xhigh 56 · $3.46 | Sonnet 5.5 max 56 · $5.46
- Callout B (9w): Opus 5.5 high 54 · $1.82 beats Sonnet 5.5 xhigh
- Foot (15w): Artificial Analysis Intelligence Index v4.3.2 · cost per task at API list prices · 13 Oct 2026

**Notes** his point: "Check the current gen crossover benchmark charts"

- Say: this gen it flips at the bottom: Opus 5.5 low (42, $0.55) is cheaper than Sonnet 5.5 high (47, $0.88) but scores lower (T3.2).
- Say: higher up, Opus wins. Same score as Sonnet max at 63% of the cost, because Sonnet max writes 197k output tokens per task vs Opus xhigh's 66k.
- Say: Opus max adds about 2 points over xhigh for 1.7× the cost. Diminishing returns.
- Say: these are API prices; on a subscription it's quota, but the token counts drive both.

**Δ** Labels taken from the data, not the screenshot: on the AA chart the "Opus 5.5 (xhigh)" and "Sonnet 5.5 (max)" labels sit over each other's dots. AA's "with fallback" suffix dropped from labels; noted in the footnote on `/shownotes`.
**Sources** https://artificialanalysis.ai/?models=claude-opus-5-5%2Cclaude-opus-5-5-xhigh%2Cclaude-opus-5-5-high%2Cclaude-opus-5-5-medium%2Cclaude-opus-5-5-low%2Cclaude-sonnet-5-5%2Cclaude-sonnet-5-5-xhigh%2Cclaude-sonnet-5-5-high%2Cclaude-sonnet-5-5-medium%2Cclaude-sonnet-5-5-low%2Cgpt-6-astra

---

## Tip 4 · Superpowers

### S20 · Only when needed

**On screen**

- H (9w): 4. Only use superpowers for tasks that need it.
- L1 (9w): Every plan task: an implementer plus two reviewer subagents.
- L2 (5w): 10 tasks → 30+ subagent dispatches.
- Foot (11w): Mostly needed for larger tasks, on models less capable than Opus.

**Notes** his point: "Only really needed for larger tasks with models less capable than Opus"

- Say: superpowers chains brainstorm, plan, then per task an implementer and two reviewers, all on your session model by default (pcvelz fork README) (T4.1).
- Say: the maintainer agrees it costs more by design: "doing additional review and TDD is going to be more expensive". v7.0.0 (10 Oct) cut planning to about a third of the tokens.
- Say: one small third-party benchmark: the debugging skill alone raised cost per run 80% with no accuracy change [anecdotal, n=20].

**Δ** L1/L2 added (verified mechanism). Foot is his opinion, kept as his.
**Sources** https://github.com/obra/superpowers · https://github.com/pcvelz/superpowers · https://github.com/sjh9714/skill-receipts/blob/main/docs/audits/superpowers-debugging.md

---

## Tip 5 · Proc the 5h window

### S21 · Routines

**On screen**

- H (5w): 5. Proc the 5h window
- UI: Routines replica (exact copy from screenshot):
  - `Say 'good morning' to Haiku daily` / `Good morning` / `Active · Daily at 5:30 AM`
  - `Say 'good afternoon' to Haiku daily` / `Good afternoon` / `Active · Daily at 10:35 AM`
  - `Say 'good evening' to Haiku daily` / `Good evening` / `Active · Daily at 3:40 PM`
- L1 (8w): Your 5-hour window starts with your first message.
- Foot (14w): Local routines only fire while the app is open and the Mac is awake.

**Notes** his link: "Tip: How to automate "Hi Haiku" daily early morning"

- Say: the Reddit tip is one scheduled "hi" to Haiku early each morning, so a window is already running when you start. Chaining three is my extension (T5.2).
- Say: Desktop → Code → Routines → New routine. Local or Cloud; Cloud needs a repo and runs at most hourly (T5.3).
- Say (deadpan): yes, "good afternoon" fires at 10:35 AM.

**Δ** L1 is new and softened to "in practice" in speech: the consumer docs only say "resets every five hours" (T5.1). Foot added.
**Sources** https://www.reddit.com/r/ClaudeAI/comments/1wxon4e/tip_how_to_automate_hi_haiku_daily_early_morning/ · https://code.claude.com/docs/en/desktop-scheduled-tasks · https://support.claude.com/en/articles/11647753

### S22 · The chain

**On screen**

- H (7w): Line the resets up with your day.
- UI timeline (mono labels):
  - `05:30 ping → resets 10:30`
  - `10:35 ping → resets 15:35`
  - `15:40 ping → resets 20:40`
- Foot (13w): It moves when your 5h bucket refills. Your weekly limit stays the same.

**Notes**

- Say: each ping lands 5 minutes after the previous window ends, so it opens a fresh one (T5.4).
- Say: no extra quota. It only helps if you actually hit the 5-hour cap.
- Say: if you send a real message in the 5-minute gap, nothing breaks; the next ping still lands after.

**Δ** New stop (derived from his three times).
**Sources** same as S21

---

## Tip 6 · Other CLIs as subagents

### S23 · kiro-cli

**On screen**

- H (10w): 6. Use kiro-cli, cursor-agent, copilot as your 'subagent' from CC
- Code:
  ```sh
  kiro-cli --v3 chat --no-interactive --trust-all-tools --model claude-sonnet-5.5 --effort high "prompt"
  ```
- Label (16w): Checkbox: ~2 more months of AWS trial quota for Kiro, incl. Opus 5.5 and Sonnet 5.5
- Label (9w): Kiro preview: Sonnet 5.5 1.30× credits, Opus 5.5 2.00×

**Notes**

- Say: Claude Code runs these as plain shell commands, so the work lands on another quota.
- Say: Kiro model ids use dots (`claude-sonnet-5.5`), unlike the API's `claude-sonnet-5-5`. Both models are labeled "Experimental preview" in Kiro (T6.1).
- Say: `--v3` opts in to the next-gen agent; v2 is still the default in kiro-cli 2.29.1.

**Δ** Credit multipliers added (from `--list-models`). Kiro quota line is his, unverified (T6.1a).
**Sources** local `kiro-cli --help` (2.29.1)

### S24 · cursor-agent, copilot, codex

**On screen**

- Code:
  ```sh
  cursor-agent -p --force --model 'claude-sonnet-5-5[effort=high]' "prompt"
  copilot -p "prompt" --allow-all-tools --model gpt-5.4 --reasoning-effort medium
  codex exec -m <model> --sandbox workspace-write "prompt" -c model_reasoning_effort=high
  ```
- Label (4w): Check names: `cursor-agent --list-models`
- L1 (4w): Other models? Try `/prompt-master`.

**Notes**

- Say: `-p` plus `--force` is what lets cursor-agent write files; without it changes are only proposed (T6.2).
- Say: the bracket form is in cursor-agent's own help, but Cursor staff said in June it wasn't wired up yet. Check `--list-models` first.
- Say: prompt-master is a skill that writes prompts tuned for each target tool. It's about 8k tokens itself when loaded.

**Δ** codex added to the headline list in speech only (it's in his commands). Label added because of the Cursor syntax risk (Needs Callum).
**Sources** https://forum.cursor.com/t/cursor-cli-agent-doesnt-support-square-bracket-model-name-variants/163905 · https://github.com/nidhinjs/prompt-master

---

## Tip 7 · Headroom or RTK

### S25 · RTK

**On screen**

- H (5w): 7. Use Headroom or RTK
- L1 (10w): RTK: a hook rewrites shell commands and trims their output.
- L2 (9w): Bash tool only. Read, Grep and Glob bypass it.
- L3 (13w): Trim too hard and the agent re-runs the command, or the rewrite breaks.

**Notes** his points: "RTK uses hooks"; "It can fight with your agent – when output format is unexpected"

- Say: `git status` becomes `rtk git status` before it runs (T7.1).
- Say: RTK says "up to 90% of the bash output", and also says that's not 90% off your bill.
- Say: real issues: grep capped at 10 matches per file made Claude search again and cost more (#617); `rtk find` rejected normal find flags (#236).

**Δ** "fight with your agent" made concrete with the two failure modes from the issue tracker.
**Sources** https://github.com/rtk-ai/rtk · https://github.com/rtk-ai/rtk/issues/617 · https://github.com/rtk-ai/rtk/issues/236

### S26 · Headroom

**On screen**

- L1 (6w): Headroom wraps Claude with a proxy.
- Code:
  ```sh
  headroom wrap claude --1m -- --enable-auto-mode --ide --model 'claude-opus-5-5[1m]'
  ```
- Foot (8w): It sets ANTHROPIC_BASE_URL, which turns off Remote Control.

**Notes** his points: wraps Claude with a proxy; "Not compatible with Claude Code remote"

- Say: compression runs locally; in its default cache mode it only compresses the newest turn so the cached prefix stays byte-identical (T7.6).
- Say: `--1m` keeps the 1M context window; behind a proxy Claude Code would otherwise cap at 200k.
- Say: Remote Control (`/rc`) refuses a custom base URL. Cloud sessions are unaffected; they never touch your proxy (T7.5).

**Δ** "Claude Code remote" → "Remote Control" (the specific feature). Command kept exactly; `--enable-auto-mode` is deprecated in 2.1.296 (Needs Callum).
**Sources** https://github.com/headroomlabs-ai/headroom · https://code.claude.com/docs/en/remote-control

### S27 · Compression vs the cache

**On screen**

- H (4w): Compression vs the cache
- UI stat row: `Saved by compression 1.4M` · `Lost to cache busts 1.1M` · `Net +247.3k`
- Label (8w): 95% hit rate · 163.2M tokens read from cache
- Foot (6w): My dashboard, one proxy process [anecdotal]

**Notes** his point: "Dashboard"

- Say: compression only pays if it doesn't break the cache. Here it barely won (T7.6).
- Say: the cache itself saved $593.69 at API prices; compression saved $9.64.

**Δ** Rebuilt as vectors from his screenshot's numbers (headroom 0.39.0).
**Sources** refs/Headroom_Screenshot_2026-10-11_at_3.40.52_pm.png · data-capture/headroom_cards.json

---

## Tip 8 · Fable in CC ≠ Fable in Cursor

### S28 · Not the same cache

**On screen**

- H (7w): 8. Fable in CC ≠ Fable in Cursor
- Column "Cursor" (3 labels): `5m cache only` (3w) · `writes 1.25× input` (3w) · `billed at API list price` (4w)
- Column "Claude Code, subscription" (3 labels): `1h cache, main session` (4w) · `writes 2× input` (3w) · `flat-rate plan` (2w)

**Notes** his points: "Cache is not the same (1.25x vs 2x write)"; "Only cache TTL 5m is available"; "Cursor pays API token pricing"

- Say: Cursor staff, Sep 2026: they tested 1h writes at 2× and the extra cost "slightly outweighed the savings", so no plans to change (T8.1, T8.2).
- Say: Cursor refreshes the 5 minutes on every hit, so it only hurts when you step away.
- Say: same idea for Perplexity and other API-priced tools [unchecked: nobody verified Perplexity's pricing; cut or keep as his aside].

**Δ** "Only cache TTL 5m" scoped to Cursor (it's wrong for Claude Code). "Cursor pays API token pricing" → "billed at API list price" (your included pool is charged at list price). "Perplexity, etc." moved to speech. Forum citation switched to the post that actually states 1.25×/2×.
**Sources** https://forum.cursor.com/t/anthropic-models-prompt-cache/171871/5 · https://forum.cursor.com/t/understanding-write-cache/156915/5 · https://cursor.com/docs/models-and-pricing

### S29 · ~18×

**On screen**

- H (12w): Up to ~18× more Fable tokens in CC for the same price
- Label (1w): [anecdotal]
- Foot (12w): Fable 5.1 on the API: $10 in, $50 out per million tokens

**Notes** his point: "Anthropic essentially subsidizes subscription"

- Say: that's my estimate; Anthropic doesn't publish plan limits in tokens, so nobody can check it exactly (T8.4).
- Say: "subsidizes" is my read of it, not an Anthropic statement (T8.3).

**Δ** "subsidises" → "subsidizes" (US) and kept to speech, marked opinion. Foot added for scale.
**Sources** https://platform.claude.com/docs/en/about-claude/pricing

---

## Tip 9 · Prompt suggestions

### S30 · Turn them off

**On screen**

- H (5w): 9. Turn off prompt suggestions
- Code:
  ```json
  "promptSuggestionEnabled": false
  ```
- L1 (10w): Each suggestion is a background call to your session's model.
- L2 (7w): ~3–10% of usage, per user reports [anecdotal]
- Foot (6w): Anthropic's docs call the cost "small".

**Notes** his link: "PSA - Claude Code: Turn off Prompt Suggestions, save ~10% of your limits/spend"

- Say: it's mostly cache reads of your whole context, so it grows with context size. The PSA author measured 10.7% of spend over 14 days on 355k-token Fable sessions; a commenter saw 3–4% (T9.2).
- Say: exact key is `promptSuggestionEnabled` (singular). One commenter's mis-cased key did nothing. Restart after changing it; `/config` has a toggle too (T9.1).

**Δ** "4-10%" → "~3–10% [anecdotal]": the post says ~10%, the lowest reply says 3–4%. "uses same model" kept as L1.
**Sources** https://www.reddit.com/r/ClaudeAI/comments/1wm8adm/psa_claude_code_turn_off_prompt_suggestions_save/ · https://code.claude.com/docs/en/settings-reference · https://code.claude.com/docs/en/interactive-mode

---

## Tip 10 · Anthropic extra offers

### S31 · Limit resets

**On screen**

- H (4w): 10. Anthropic extra offers
- L1 (4w): Occasional weekly limit resets
- UI: replica row `Full reset` / `Expires Oct 23` / button `Reset for free`
- Label (9w): Banked: saved in Settings › Usage. You press it.
- Label (6w): Instant: Anthropic resets everyone at once.
- Foot (2w): [community terms]

**Notes** his points: "'Banked' vs 'instant'"; "Currently there is one 'banked' reset given (expires 23 Oct)"

- Say: the Opus 5.5 launch gave subscribers "a rate limit reset, which you can now save and use whenever you choose" (T10.1.1).
- Say: a full reset refills both your 5-hour and weekly limits. It doesn't move your weekly reset day. Downgrade or cancel first and you lose it (T10.1).
- Say: the button is on web and Desktop, not in the Claude Code terminal, but limits are account-wide.

**Δ** "banked"/"instant" labeled as community terms (not Anthropic's). Expiry date shown as the UI shows it; spoken form depends on talk date (Needs Callum).
**Sources** https://support.claude.com/en/articles/17007452-what-is-a-limit-reset · https://www.anthropic.com/news/claude-opus-5-5

### S32 · Monthly API credits

**On screen**

- H (3w): Monthly API credits
- L1 (9w): Team: $20 per Standard seat, $100 per Premium seat
- L2 (9w): Pooled across the org, capped at $500 a month
- L3 (12w): A Team owner links a Console org. API only, not Claude Code.

**Notes** his points: "Org admin needs to enable it, and it's org pooled"

- Say: covers the API, Batches, Playground, Agent SDK. Interactive Claude Code isn't covered; `claude -p` only if you run it with a key from the linked org (T10.2).
- Say: unused credits expire each billing cycle. No rollover.
- Say: for Max it's $100 (5x) or $200 (20x) a month.

**Δ** "Org admin needs to enable it" → "A Team owner links a Console org" (Primary Owner or Owner). Amounts and the $500 cap added.
**Sources** https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans · https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers

### S33 · Expired and expiring

**On screen**

- Card A H (3w): Cloud sessions credit
- Card A L1 (5w): Claim window closed 7 Oct.
- Card A Label (4w): Pro and Max only
- Card B H (3w): Artifact usage promotion
- Card B L1 (9w): Artifact work uses 50% less of your 5-hour limit.
- Card B Label (8w): Claude and Cowork · not Claude Code · not weekly
- Card B Foot (talk before 16 Oct 5:59 PM AEDT) (6w): Ends Friday 16 Oct, 5:59 PM
- Card B Foot (talk after) (5w): Ended 15 Oct (US time)

**Notes** his points: "Cloud sessions credit (expired 7 Oct)"; "Artifact usage promotion (expires 15 Oct)" + his description

- Say: if you claimed the cloud credit, it runs until 5 Nov (T10.3).
- Say: the artifact discount covers the next 10 messages after you create or edit an artifact in a chat, and doesn't touch the weekly limit (T10.4).
- His sentence (verbatim, for speech): "When you create or edit an artifact in Claude or Claude Cowork, part of the work that follows uses 50% less of your five-hour session limit (excludes CC)"

**Δ** "expired 7 Oct" → "claim window closed 7 Oct" (claimed credits are still live). Promo end shown in Sydney time, since 15 Oct is US Pacific. "Pro and Max only" added (Team wasn't eligible per the banner).
**Sources** https://www.reddit.com/r/ClaudeAI/comments/1woiotv/anthropic_offering_100_in_credits_for_cloud/ · https://www.anthropic.com/legal/promotion-credit-terms · https://support.claude.com/en/articles/17274727-artifact-usage-promotion

---

## Bonus · Laya-ultrafast

### S34 · System One

**On screen**

- H (5w): Bonus: Laya-ultrafast for browser use
- L1 (6w): What is a System One model?
- UI: book cover card `Thinking, Fast and Slow` · `Daniel Kahneman` · `2011`
- Label (4w): System 1: fast, automatic
- Label (4w): System 2: slow, deliberate

**Notes** his points: "What is a _System One_ model? (Jev/Laya)"; "_Thinking, fast and slow_"

- Say: "System One" is TypeSafe's term for models that "return typed answers and probabilities rather than generated text", named after Kahneman's System 1 (B.2).
- Say: Jev is TypeSafe's hosted System One model. Laya is a separate open-weight model; the laya-ultrafast port swaps Jev for Laya running locally.

**Δ** Book title in its published case. Jev and Laya separated (they're different models from different groups).
**Sources** https://docs.typesafe.ai/concepts/system-one.md · https://docs.typesafe.ai/introduction

### S35 · Text in, probabilities out

**On screen**

- H (4w): Text in, probabilities out.
- UI widget from my Laya run: input `Duplicate charge on invoice #4411`; outputs
  - `department: billing 96.5%`
  - `urgency: critical 55.6%`
  - `churn risk: yes 82.5%`
  - `refund requested: yes 84.3%`
- L1 (11w): An LLM writes text. A System One model picks an option.
- Foot (12w): Laya: 421M parameters, ~33 ms per decision, runs locally on Apple Silicon

**Notes** his points: "Text in, classified probabilistic options out"; "Contrast with LLM"; "Fast and cheap, can even run locally"

- Say: no generated text at all: 348 input tokens, 0 output tokens.
- Say: the number to trust is `answer_confidence`; the playground says its other `confidence` field isn't calibrated (B.1).
- Say: calibration is measured across many answers; it doesn't promise any single answer is right.
- Careful: "~33 ms" is one local decision. The playground's full request took 15.76 s round trip, so don't call a live playground demo fast.

**Δ** Widget values from a fresh capture (`laya_run.json`) rather than the screenshot. "~33 ms" is the README's M1 Max median.
**Sources** https://github.com/ipenywis/laya-ultrafast · https://github.com/mizorewww/laya-mlx

### S36 · Browser use

**On screen**

- H (5w): LLM plans. System One clicks.
- L1 (10w): One LLM call per task turns the goal into steps.
- L2 (9w): Laya decides each step locally. No per-step API cost.
- Foot (8w): Port of browser-use/jev-ultrafast, which uses Jev hosted instead.

**Notes** his point: "Uses LLM for planning, System One for executing"

- Say: that's exactly how laya-ultrafast works. In the original jev-ultrafast, Jev picks each action and a small LLM only types text (B.6).
- Say: jev-ultrafast's own demo: Zurich to London on Google Flights in about 7 seconds. Their caveat: "not a general reliability benchmark".

**Δ** Scoped to the laya-ultrafast port (the original splits work differently).
**Sources** https://github.com/ipenywis/laya-ultrafast · https://github.com/browser-use/jev-ultrafast

---

## Afterword

### S37 · All out

**On screen**

- H (1w): Afterword
- UI: weekly limits replica: `All models` `Resets in 6 min` `88% used` · `Fable` `Resets in 6 min` `95% used` (bars in clay tints, not the screenshot's yellow/red)
- Caption, his (16w): Me going absolutely all out with parallel Fable as default model before Opus 5.5 came out
- Caption, proposed (16w): Me going absolutely all out with parallel Fable as my default model (week ending 28 Sep)

**Notes** _verbatim_: "I thought of sharing my strategy here when Fable was still my default model for everything. I'm a pretty heavy user, but with these tips it was a real challenge to reach the quota limit each week. Since Opus 5.5 was released, and then Sonnet 5.5 shortly after, I have found that these models can handle all but the most complex reasoning tasks."

**Δ** Caption date conflict: the screenshot is from 28 Sep, six days after Opus 5.5 shipped (A.2). Pick one (Needs Callum).
**Sources** refs/Limits_Screenshot_2026-09-28_at_11.54.34_am.png

### S38 · Nowhere near

**On screen**

- H (9w): On the 5.5 models, I'm nowhere near my quota.
- L1 (9w): Still hitting yours with these tips? Teach me how.

**Notes** _verbatim_: "Now defaulting to these new 5.5 generation models I'm nowhere near reaching my quota limit. If you follow (at least some of) these tips and you are able to reach your CC quota, I'd like to learn from you how you are managing to achieve that."

**Δ** On-screen lines condense his paragraph.
**Sources** none

---

## Outro

### S39 · Shownotes and references

**On screen**

- H (6w): It's basically all about context management.
- UI: QR code → `/shownotes`
- L1 (5w): Shownotes, links and every source
- Ref 1 (8w): How I use Claude Code subagents · Andrea Grandi
- Ref 2 (3w): Orchestrating Parallel Agents
- Ref 3 (11w): 15 Claude Code tricks in 5 mins · Snow Gum Summit 2026

**Notes**

- Say: the spoiler again, because it held up.
- Say: every claim in this talk links to its source on the shownotes page.

**Δ** H is a callback to the spoiler (new). References shortened to titles; full links on `/shownotes`.
**Sources** https://www.andreagrandi.it/posts/claude-code-subagents-to-save-usage/ · https://www.youtube.com/watch?v=_NdFTCUk-t4 · Orchestrating Parallel Agents (Notion URL needed)
