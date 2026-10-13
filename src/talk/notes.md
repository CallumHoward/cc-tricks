<!--
Speaker notes for the presenter console, copied verbatim from the Notion show notes
(enhanced markdown, tab-indented lists). Each stop's slice follows its `stop:` marker.
-->

<!-- stop: title -->
# 💸 10 tips for saving tokens

<!-- stop: spoiler -->
Spoiler: It’s basically all about *context management*

<!-- stop: fw-chatbox -->
# Foreword
![]()
Q: Everyone (more-or-less) has access to the same chat box, so what distinguishes you and me from the next random person off the street?

<!-- stop: fw-taste -->
# Foreword
A: 
1. Your superior ability to make decisions and know what you want – “taste”. You ask the right questions. You know when to doubt. You choose the words to go into the box.
2. Your care for your craft and for the product we’re building, something that can only truly come with physical agency and *being* in our world. 

<!-- stop: fw-invest -->
# Foreword
If you care for your craft, then you are surely interested in investing in the tools of the trade. That investment means effort, pausing to learn something that can increase your speed or effectiveness in the next task.
Anyway, you’re here for a CC tips listicle, not to hear me wax philosophical, nor are you here for existential interrogation. But I do hope that these tips might help you on your journey of continual improvement. Let’s get into it.

<!-- stop: t1-agents -->
# The tips
1. Use subagents \[screenshot\]
	1. See my previous talk <mention-page url="https://app.notion.com/p/3648183ab6f6805f947cc12560e59549">🎶 Orchestrating Parallel Agents</mention-page> 

<!-- stop: t1-model-effort -->
1. Use subagents \[screenshot\]
	2. Specify model (default inherits)
	3. Specify effort (taken as suggestion)

<!-- stop: t1-advisor -->
1. Use subagents \[screenshot\]
	4. Consider `/advisor` (or manual prompting)
	5. Subagents for images
	6. Subagents for exploring, reading large logs

<!-- stop: t2-stateless -->
2. Keep the cache warm
	1. What is the cache? \[explainer\]
		1. Recall, LLMs are stateless. They take the context (chat history) as input and output the next text response.
		2. When hitting ‘send’, most of the context is the same as the last turn. It makes sense to cache the parts that didn’t change (the “prefix”). 

<!-- stop: t2-kv -->
2. Keep the cache warm
	1. What is the cache? \[explainer\]
		3. If a new request starts with an identical prefix, the server can skip loading that prefix’s K/V tensors and run prefill only on the new suffix.

<!-- stop: t2-price -->
2. Keep the cache warm
	1. What is the cache? \[explainer\]
		4. The LLM server still needs to perform work on the prefix, even on a cache hit, so it’s discounted, but not free. Prices are different per model.

<!-- stop: t2-ttl -->
2. Keep the cache warm
	2. 1H cache TTL on main session (on subscription)
	3. Tip: Change 5m TTL subagent
		1. `"subagentPromptCacheTtl": "1h",` in `~/.claude/settings.json` (global)<br>[Claude Code sub-agents have a 5m prompt cache. Long commands can burn your 5-hour window.](https://www.reddit.com/r/ClaudeCode/comments/1wkpm2i/claude_code_subagents_have_a_5m_prompt_cache_long/)[Sub-agents burning your Claude Code 5-hour window? Check their 5-minute prompt cache](https://www.reddit.com/r/ClaudeAI/comments/1wj4gs0/subagents_burning_your_claude_code_5hour_window/)
		2. `ENABLE_PROMPT_CACHING_1H=1` – better as it can be overridden
			```json
{
  "env": {
    "ENABLE_PROMPT_CACHING_1H": "1"
  }
}
			```
		3. This can apply to `cbdev` tests and static checks that may run longer than 5m on the monorepo
		4. If different cache TTLs are often needed, set up agents with different `cacheTtl` in `.claude/agents/<name>.md` and give it frontmatter like
			```yaml
---
name: repo-auditor
description: Audits a large repository and reports what it finds
experimental:
  cacheTtl: 1h
---
			```

<!-- stop: t2-idle -->
2. Keep the cache warm
	4. Avoid hourly check-ins
		1. CC cloud likes to do this for PRs by default
		2. New setting “Compacted while idle”<br>[Just noticed this wonderful gem in my CLI window(s) today, “Compacted while idle, before the prompt cache expired”!](https://www.reddit.com/r/ClaudeCode/comments/1x2vc7g/just_noticed_this_wonderful_gem_in_my_cli_windows/)
		3. [https://github.com/ARahim3/cachebeat](https://github.com/ARahim3/cachebeat)

<!-- stop: t2-switch -->
2. Keep the cache warm
	5. Switch effort levels but not models
	6. Rewind is cache safe

<!-- stop: t3-then -->
3. Manage effort levels
	1. Opus 5 low was cheaper and better than Sonnet 5 high (dependant on the task)

<!-- stop: t3-aa -->
3. Manage effort levels
	2. Check the current gen crossover benchmark charts \[screenshot\]

<!-- stop: t4-superpowers -->
4. Only use superpowers for tasks that need it.
	1. Only really needed for larger tasks with models less capable than Opus

<!-- stop: t5-routines -->
5. Proc the 5h window \[screenshot\]
	1. [Tip: How to automate "Hi Haiku" daily early morning](https://www.reddit.com/r/ClaudeAI/comments/1wxon4e/tip_how_to_automate_hi_haiku_daily_early_morning/?share_id=CHsQLCLAbcv4Iw8_LSSZ9&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=1)

<!-- stop: t5-chain -->
5. Proc the 5h window \[screenshot\]

<!-- stop: t6-kiro -->
6. Use `kiro-cli`, `cursor-agent`, `copilot` as your ‘subagent’ from CC
	1. `kiro-cli --v3 chat --no-interactive --trust-all-tools --model claude-sonnet-5.5 --effort high "prompt"`
		1. Checkbox engineering have \~two more months of trial quota from AWS for Kiro, including Opus 5.5 and Sonnet 5.5

<!-- stop: t6-others -->
6. Use `kiro-cli`, `cursor-agent`, `copilot` as your ‘subagent’ from CC
	2. `cursor-agent -p --force --model 'claude-sonnet-5-5[effort=high]' "prompt"`
	3. `copilot -p "prompt" --allow-all-tools --model gpt-5.4 --reasoning-effort medium` 
	4. `codex exec -m <model> --sandbox workspace-write "prompt" -c model_reasoning_effort=high` 
	5. Consider `/prompt-master` ([GitHub](https://github.com/nidhinjs/prompt-master)) for other models

<!-- stop: t7-rtk -->
7. Use Headroom or RTK
	1. [RTK](https://github.com/rtk-ai/rtk) uses hooks
		1. It can fight with your agent – when output format is unexpected

<!-- stop: t7-headroom -->
7. Use Headroom or RTK
	2. [Headroom](https://github.com/headroomlabs-ai/headroom) wraps Claude with a proxy
		1. `headroom wrap claude --1m -- --enable-auto-mode --ide --model 'claude-opus-5-5[1m]'`
		2. Not compatible with Claude Code remote
		3. Dashboard \[screenshot\]

<!-- stop: t8-cache -->
8. Token usage: Fable in CC != Fable in Cursor, Perplexity, etc.
	1. Cache is not the same (1.25x vs 2x write)<br>[Understanding Write Cache](https://forum.cursor.com/t/understanding-write-cache/156915/5)
	2. Only cache TTL 5m is available
	3. Cursor pays API token pricing, Anthropic essentially subsidises subscription

<!-- stop: t8-18x -->
8. Token usage: Fable in CC != Fable in Cursor, Perplexity, etc.
	3. Cursor pays API token pricing, Anthropic essentially subsidises subscription
		1. Up to \~18x more tokens in CC for Fable for the equivalent price \[anecdotal\]

<!-- stop: t9-suggestions -->
9. `promptSuggestionEnabled: false` – 4-10% uses same model<br>[PSA - Claude Code: Turn off Prompt Suggestions, save \~10% of your limits/spend](https://www.reddit.com/r/ClaudeAI/comments/1wm8adm/psa_claude_code_turn_off_prompt_suggestions_save/)

<!-- stop: t10-resets -->
10. Anthropic extra offers
	1. Occasional weekly limit resets
		1. ‘Banked’ vs ‘instant’
		2. Currently there is one ‘banked’ reset given (expires 23 Oct)

<!-- stop: t10-offers -->
10. Anthropic extra offers
	2. Monthly additional Claude Platform API credits<br>[New perk free \$100 Monthly API Credit a month!!](https://www.reddit.com/r/ClaudeAI/comments/1x0f9gu/new_perk_free_100_monthly_api_credit_a_month/)
		1. Org admin needs to enable it, and it’s org pooled
	3. Cloud sessions credit (expired 7 Oct)<br>[Anthropic offering \$100 in credits for cloud sessions](https://www.reddit.com/r/ClaudeAI/comments/1woiotv/anthropic_offering_100_in_credits_for_cloud/)
	4. Artifact usage promotion (expires 15 Oct)
		1. When you create or edit an artifact in Claude or Claude Cowork, part of the work that follows uses 50% less of your five-hour session limit (excludes CC)
		2. [Artifact usage promotion \| Claude Help Center](https://support.claude.com/en/articles/17274727-artifact-usage-promotion)

<!-- stop: b-system-one -->
Bonus tip: Use [Laya-ultrafast](https://github.com/ipenywis/laya-ultrafast) for browser use \[screenshot\]
- What is a *System One* model? (Jev/Laya)
	- *Thinking, fast and slow*

<!-- stop: b-laya -->
Bonus tip: Use [Laya-ultrafast](https://github.com/ipenywis/laya-ultrafast) for browser use \[screenshot\]
- What is a *System One* model? (Jev/Laya)
	- Text in, classified probabilistic options out
		- Contrast with LLM
	- Fast and cheap, can even run locally

<!-- stop: b-browser -->
Bonus tip: Use [Laya-ultrafast](https://github.com/ipenywis/laya-ultrafast) for browser use \[screenshot\]
- Browser use
	- Uses LLM for planning, System One for executing

<!-- stop: aft-limits -->
# Afterword
![Me going absolutely all out with parallel Fable as default model before Opus 5.5 came out]()
I thought of sharing my strategy here when Fable was still my default model for everything. I’m a pretty heavy user, but with these tips it was a real challenge to reach the quota limit each week. Since Opus 5.5 was released, and then Sonnet 5.5 shortly after, I have found that these models can handle all but the most complex reasoning tasks. 

<!-- stop: aft-wanted -->
# Afterword
Now defaulting to these new 5.5 generation models I’m nowhere near reaching my quota limit. If you follow (at least some of) these tips and you are able to reach your CC quota, I’d like to learn from you how you are managing to achieve that.

<!-- stop: outro-thesis -->
Spoiler: It’s basically all about *context management*

<!-- stop: outro-qr -->
# Additional References
- [How I use Claude Code subagents to make my Claude Pro limits last longer](https://www.andreagrandi.it/posts/claude-code-subagents-to-save-usage/)
- <mention-page url="https://app.notion.com/p/3648183ab6f6805f947cc12560e59549">🎶 Orchestrating Parallel Agents</mention-page> 
- ["15 Claude Code tricks in 5 mins" - Callum Howard (Snow Gum Summit 2026)](https://www.youtube.com/watch?v=_NdFTCUk-t4&feature=youtu.be)
