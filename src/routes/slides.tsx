import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import slidesCss from "../slides.css?url";

export const Route = createFileRoute("/slides")({
  head: () => ({
    meta: [{ title: "Claude Code tricks" }],
    links: [
      { rel: "stylesheet", href: slidesCss },
      { rel: "icon", href: "/cc-asterisk.svg", type: "image/svg+xml" },
    ],
  }),
  component: SlidesDeck,
});

const SLIDE_SECONDS = 15;
const BAR_CELLS = 14;

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="slides-kbd">{children}</kbd>;
}

function Dot() {
  return <span className="slides-dim"> · </span>;
}

type Trick = {
  n: number;
  input: React.ReactNode;
  points: React.ReactNode[];
  /**
   * Screenshot (.png/.jpg/.webp) or video (.mp4/.webm/.mov), served from public/, e.g.
   * "/slides/worktree.mp4"
   */
  media?: { src: string; alt: string };
};

const TRICKS: Trick[] = [
  { n: 1, input: "/recap", points: [] },
  {
    n: 2,
    input: (
      <>
        <Kbd>esc</Kbd> <Kbd>esc</Kbd>
      </>
    ),
    points: ["rewind the conversation"],
  },
  { n: 3, input: "--worktree", points: ["Claude-managed git worktrees"] },
  {
    n: 4,
    input: (
      <>
        /color
        <Dot />
        /rename
      </>
    ),
    points: [],
  },
  {
    n: 5,
    input: "!",
    points: ["run a shell command and add the output to Claude’s context"],
  },
  {
    n: 6,
    input: (
      <>
        <Kbd>←</Kbd> <span className="slides-dim">or</span> --agents
      </>
    ),
    points: ["for agents"],
  },
  { n: 7, input: "/resume", points: [] },
  {
    n: 8,
    input: "/statusline",
    points: [
      <>
        or <code className="slides-code">npx -y ccstatusline@latest</code>
      </>,
    ],
  },
  { n: 9, input: "auto mode", points: [] },
  {
    n: 10,
    input: (
      <>
        <Kbd>ctrl</Kbd>+<Kbd>t</Kbd>
      </>
    ),
    points: ["tasks"],
  },
  {
    n: 11,
    input: (
      <>
        <Kbd>ctrl</Kbd>+<Kbd>s</Kbd>
      </>
    ),
    points: ["stash"],
  },
  {
    n: 12,
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
  },
  {
    n: 13,
    input: "/ide",
    points: ["also shortcuts to share files or line ranges"],
  },
  {
    n: 14,
    input: (
      <>
        /remote
        <Dot />
        /teleport
      </>
    ),
    points: [],
  },
  { n: 15, input: "/advisor", points: [] },
  { n: 16, input: "/insights", points: [] },
  {
    n: 17,
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
  },
  {
    n: 18,
    input: "/tui fullscreen",
    points: ["expand “Ran shell command”", "sticky prompt header"],
  },
  {
    n: 19,
    input: "/goal",
    points: [
      <a key="goal-docs" className="slides-link" href="https://code.claude.com/docs/en/goal">
        keep Claude working toward a goal — docs
      </a>,
    ],
  },
  {
    n: 20,
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
  },
];

const TOTAL = TRICKS.length + 1;

function isVideo(src: string) {
  return /\.(mp4|webm|mov)$/.test(src);
}

function SlideMedia({ media }: { media: NonNullable<Trick["media"]> }) {
  if (isVideo(media.src)) {
    // key forces a reload (and autoplay) when the slide changes
    return (
      <video
        key={media.src}
        className="slides-media"
        src={media.src}
        aria-label={media.alt}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }
  return <img className="slides-media" src={media.src} alt={media.alt} />;
}

function TitleSlide() {
  return (
    <>
      <div className="slides-welcome">
        <p className="slides-welcome-heading">
          <span className="slides-asterisk">✳</span> Claude Code tricks
        </p>
        <p className="slides-welcome-sub">20 tricks × {SLIDE_SECONDS}s, pechakucha style</p>
      </div>
      <p className="slides-hint">
        press <Kbd>→</Kbd> to begin
      </p>
    </>
  );
}

function TrickSlide({ trick }: { trick: Trick }) {
  return (
    <>
      <h1 className="slides-prompt">
        <span className="slides-prompt-caret">❯</span>
        <span>
          <span className="slides-num">{trick.n}.</span> {trick.input}
          <span className="slides-cursor" aria-hidden />
        </span>
      </h1>
      {trick.points.length > 0 && (
        <ul className="slides-points">
          {trick.points.map((point, i) => (
            // eslint-disable-next-line react/no-array-index-key -- static slide content
            <li key={i} className="slides-point">
              <span className="slides-point-dot" aria-hidden>
                ⏺
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
      {trick.media && <SlideMedia media={trick.media} />}
    </>
  );
}

const KEY_TARGETS = new Map<string, (current: number) => number>([
  ["ArrowRight", (current) => current + 1],
  ["PageDown", (current) => current + 1],
  [" ", (current) => current + 1],
  ["ArrowLeft", (current) => current - 1],
  ["PageUp", (current) => current - 1],
  ["Home", () => 0],
  ["End", () => TOTAL - 1],
]);

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <button
      type="button"
      className="slides-fullscreen"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      onClick={(event) => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
        // return focus to the deck so space/enter keep navigating slides
        event.currentTarget.blur();
      }}
    >
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {isFullscreen ? (
          <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" />
        ) : (
          <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
        )}
      </svg>
    </button>
  );
}

function Statusline({ index, secondsLeft }: { index: number; secondsLeft: number }) {
  const filled = Math.round(((index + 1) / TOTAL) * BAR_CELLS);

  return (
    <footer className="slides-statusline">
      <div className="slides-statusline-group">
        <span>
          <span className="slides-asterisk">✳</span> Fable 5
        </span>
        <span>~/git/cc-tricks</span>
        <span>⎇ main</span>
      </div>
      <div className="slides-statusline-group">
        {index > 0 && (
          <span className={secondsLeft <= 5 ? "slides-timer slides-timer-low" : "slides-timer"}>
            <span className="slides-asterisk slides-pulse">✳</span> {secondsLeft}s
          </span>
        )}
        <span aria-hidden>
          <span className="slides-bar-fill">{"█".repeat(filled)}</span>
          <span className="slides-bar-rest">{"░".repeat(BAR_CELLS - filled)}</span>
        </span>
        <span>
          {index + 1}/{TOTAL}
        </span>
        <span className="slides-nav-hint">← → to navigate</span>
      </div>
    </footer>
  );
}

function SlidesDeck() {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SLIDE_SECONDS);
  const indexRef = useRef(0);
  const secondsRef = useRef(SLIDE_SECONDS);

  const goTo = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, 0), TOTAL - 1);
    const current = indexRef.current;
    if (clamped === current) return false;
    indexRef.current = clamped;
    secondsRef.current = SLIDE_SECONDS;
    document.documentElement.dataset.slideDir = clamped > current ? "fwd" : "back";
    document.startViewTransition(() => {
      flushSync(() => {
        setIndex(clamped);
        setSecondsLeft(SLIDE_SECONDS);
      });
    });
    window.history.replaceState(null, "", clamped === 0 ? window.location.pathname : `#${clamped}`);
    return true;
  }, []);

  // Deep-link: /slides#7 opens at trick 7
  useEffect(() => {
    const fromHash = Number.parseInt(window.location.hash.slice(1), 10);
    if (Number.isInteger(fromHash) && fromHash >= 1 && fromHash < TOTAL) goTo(fromHash);
  }, [goTo]);

  // PechaKucha-style countdown: paused on the title slide, restarts on every slide
  // change, auto-advances at zero (and parks at 0s on the final slide)
  useEffect(() => {
    if (index === 0) return;
    const id = setInterval(() => {
      const next = Math.max(0, secondsRef.current - 1);
      secondsRef.current = next;
      if (next === 0) {
        if (!goTo(indexRef.current + 1)) setSecondsLeft(0);
      } else {
        setSecondsLeft(next);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [index, goTo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = KEY_TARGETS.get(event.key);
      if (!target) return;
      event.preventDefault();
      goTo(target(indexRef.current));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo]);

  const trick = index > 0 ? TRICKS[index - 1] : undefined;

  return (
    <div className="slides-root">
      <header className="slides-titlebar">
        <div className="slides-lights" aria-hidden>
          <span className="slides-light slides-light-close" />
          <span className="slides-light slides-light-min" />
          <span className="slides-light slides-light-max" />
        </div>
        <span className="slides-title">Claude Code — ~/git/cc-tricks</span>
        <FullscreenButton />
      </header>

      <main className="slides-stage" aria-live="polite">
        {trick ? <TrickSlide trick={trick} /> : <TitleSlide />}
      </main>

      <Statusline index={index} secondsLeft={secondsLeft} />
    </div>
  );
}
