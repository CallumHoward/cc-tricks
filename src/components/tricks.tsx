import { Dot, Kbd } from "#/components/kbd";
import type { Surface } from "#/components/support-icons";

/** Screenshot (.png/.jpg/.webp) or video (.mp4/.webm/.mov), served from public/slides/ */
export type Media = { src: string; alt: string };

export type Trick = {
  n: number;
  input: React.ReactNode;
  points: React.ReactNode[];
  /** Surfaces where the trick works or a close equivalent exists (fixed render order) */
  support: readonly Surface[];
  media?: Media[];
  /** One-liner shown on /shownotes when the slide itself has no points */
  summary?: string;
  /** Relevant documentation links, listed on /shownotes */
  docs?: { label: string; href: string }[];
};

export const TRICKS: Trick[] = [
  {
    n: 1,
    support: ["claude-term", "claude-app", "codex-term"],
    input: "/recap",
    points: [],
    media: [
      { src: "/slides/recap.png", alt: "/recap summarising the session in the terminal" },
      { src: "/slides/recap-desktop.png", alt: "/recap in the Claude Code desktop app" },
    ],
    summary: "summarise the session so far",
    docs: [{ label: "Checkpointing", href: "https://code.claude.com/docs/en/checkpointing" }],
  },
  {
    n: 2,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: (
      <>
        <Kbd>esc</Kbd> <Kbd>esc</Kbd>
      </>
    ),
    points: ["rewind the conversation"],
    media: [{ src: "/slides/rewind.png", alt: "the rewind picker after pressing esc esc" }],
    docs: [
      { label: "Checkpointing", href: "https://code.claude.com/docs/en/checkpointing" },
      { label: "Interactive mode", href: "https://code.claude.com/docs/en/interactive-mode" },
    ],
  },
  {
    n: 3,
    support: ["claude-term", "claude-app", "codex-app"],
    input: "--worktree",
    points: ["Claude-managed git worktrees"],
    docs: [{ label: "Worktrees", href: "https://code.claude.com/docs/en/worktrees" }],
  },
  {
    n: 4,
    support: ["claude-term", "codex-term", "codex-app"],
    input: (
      <>
        /color
        <Dot />
        /rename
      </>
    ),
    points: [],
    media: [{ src: "/slides/color-rename.png", alt: "/color and /rename in action" }],
    summary: "set the prompt bar colour · name the session",
    docs: [
      { label: "Commands reference", href: "https://code.claude.com/docs/en/commands" },
      { label: "Manage sessions", href: "https://code.claude.com/docs/en/sessions" },
    ],
  },
  {
    n: 5,
    support: ["claude-term", "codex-term"],
    input: "!",
    points: ["run a shell command and add the output to Claude’s context"],
    media: [{ src: "/slides/inline-shell.png", alt: "a ! shell command and its output inline" }],
    docs: [{ label: "Interactive mode", href: "https://code.claude.com/docs/en/interactive-mode" }],
  },
  {
    n: 6,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: (
      <>
        <Kbd>←</Kbd> <span className="slides-dim">or</span> --agents
      </>
    ),
    points: ["for agents"],
    media: [{ src: "/slides/agents.png", alt: "the agents panel" }],
    docs: [
      { label: "Run agents in parallel", href: "https://code.claude.com/docs/en/agents" },
      { label: "Agent view", href: "https://code.claude.com/docs/en/agent-view" },
    ],
  },
  {
    n: 7,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: "/resume",
    points: [],
    media: [{ src: "/slides/resume.png", alt: "the /resume session picker" }],
    summary: "pick up a previous session",
    docs: [{ label: "Manage sessions", href: "https://code.claude.com/docs/en/sessions" }],
  },
  {
    n: 8,
    support: ["claude-term"],
    input: "/statusline",
    points: [
      <>
        or <code className="slides-code">npx -y ccstatusline@latest</code>
      </>,
    ],
    media: [{ src: "/slides/statusline.png", alt: "a customised statusline" }],
    docs: [
      { label: "Customise your status line", href: "https://code.claude.com/docs/en/statusline" },
      { label: "ccstatusline", href: "https://www.npmjs.com/package/ccstatusline" },
    ],
  },
  {
    n: 9,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: "auto mode",
    points: [],
    summary: "let Claude work without permission prompts",
    docs: [
      {
        label: "Permission modes",
        href: "https://code.claude.com/docs/en/permissions#permission-modes",
      },
    ],
  },
  {
    n: 10,
    support: ["claude-term"],
    input: (
      <>
        <Kbd>ctrl</Kbd>+<Kbd>s</Kbd>
      </>
    ),
    points: ["stash"],
    docs: [{ label: "Interactive mode", href: "https://code.claude.com/docs/en/interactive-mode" }],
  },
  {
    n: 11,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: (
      <>
        <Kbd>opt</Kbd>+<Kbd>p</Kbd>
      </>
    ),
    points: [
      <>
        models — e.g. for changing models with <code className="slides-code">/model</code>
      </>,
    ],
    media: [{ src: "/slides/select-model.png", alt: "the model picker" }],
    docs: [{ label: "Model configuration", href: "https://code.claude.com/docs/en/model-config" }],
  },
  {
    n: 12,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: (
      <>
        /remote
        <Dot />
        /teleport
      </>
    ),
    points: [],
    summary: "continue a session from any device · pull a cloud session into your terminal",
    docs: [
      { label: "Remote Control", href: "https://code.claude.com/docs/en/remote-control" },
      {
        label: "Claude Code on the web",
        href: "https://code.claude.com/docs/en/claude-code-on-the-web",
      },
    ],
  },
  {
    n: 13,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: "/advisor",
    points: [],
    summary: "a second model reviews the work at key moments",
    docs: [{ label: "Advisor", href: "https://code.claude.com/docs/en/advisor" }],
  },
  {
    n: 14,
    support: ["claude-term", "claude-app"],
    input: "/insights",
    points: [],
    summary: "a report on your sessions: project areas, patterns, friction points",
    docs: [{ label: "Commands reference", href: "https://code.claude.com/docs/en/commands" }],
  },
  {
    n: 15,
    support: ["claude-term", "claude-app", "codex-term", "codex-app"],
    input: (
      <>
        /btw
        <Dot />
        /fork
      </>
    ),
    points: [
      <>
        <code className="slides-code">/btw</code> is async and imports context
      </>,
    ],
    docs: [
      {
        label: "Side questions with /btw",
        href: "https://code.claude.com/docs/en/interactive-mode#side-questions-with-/btw",
      },
      {
        label: "Copy the session with /fork",
        href: "https://code.claude.com/docs/en/agent-view#copy-the-session-with-/fork",
      },
    ],
  },
  {
    n: 16,
    support: ["claude-term", "codex-term"],
    input: "readline",
    points: [
      <>
        <Kbd>ctrl</Kbd>+<Kbd>x</Kbd> <Kbd>ctrl</Kbd>+<Kbd>e</Kbd> — edit the prompt in $EDITOR
      </>,
      <>
        <Kbd>ctrl</Kbd>+<Kbd>a</Kbd> / <Kbd>ctrl</Kbd>+<Kbd>e</Kbd> — jump to start / end of line
      </>,
      <>
        <Kbd>ctrl</Kbd>+<Kbd>r</Kbd> — search prompt history
      </>,
      <>
        map <Kbd>shift</Kbd>+<Kbd>enter</Kbd>
      </>,
      <a
        key="readline-sheet"
        className="slides-link"
        href="https://readline.kablamo.org/emacs.html"
      >
        readline cheat sheet
      </a>,
    ],
    docs: [
      { label: "Readline cheat sheet", href: "https://readline.kablamo.org/emacs.html" },
      { label: "Keybindings", href: "https://code.claude.com/docs/en/keybindings" },
    ],
  },
];
