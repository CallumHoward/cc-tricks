import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import { Kbd } from "#/components/kbd";
import { QrCode } from "#/components/qr-code";
import { TRICKS } from "#/components/tricks";
import type { Media, Trick } from "#/components/tricks";

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

// title + tricks + outro
const TOTAL = TRICKS.length + 2;

function isVideo(src: string) {
  return /\.(mp4|webm|mov)$/.test(src);
}

function SlideMedia({ media }: { media: Media }) {
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
        <p className="slides-welcome-sub">
          {TRICKS.length} tricks × {SLIDE_SECONDS}s, pechakucha style
        </p>
        <p className="slides-welcome-author">Callum Howard</p>
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
      {trick.media && (
        // keyed so the delayed fade-in restarts on every slide change
        <div key={trick.n} className="slides-media-row">
          {trick.media.map((media) => (
            <SlideMedia key={media.src} media={media} />
          ))}
        </div>
      )}
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
    </>
  );
}

const subscribeNoop = () => () => {};

function OutroSlide() {
  // origin is only knowable client-side; SSR renders the frame without the QR
  const origin = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => undefined,
  );
  const shownotesUrl = origin ? `${origin}/shownotes` : undefined;

  return (
    <div className="slides-outro">
      <div className="slides-outro-info">
        <p className="slides-outro-heading">
          <span className="slides-asterisk">✳</span> shownotes
        </p>
        {shownotesUrl && (
          <a className="slides-link slides-outro-url" href="/shownotes">
            {shownotesUrl.replace(/^https?:\/\//, "")}
          </a>
        )}
        <div className="slides-outro-bio">
          <p className="slides-outro-name">Callum Howard</p>
          <p className="slides-outro-role">Frontend Software Engineer @ Checkbox</p>
          <a className="slides-link" href="https://callumhoward.com">
            callumhoward.com
          </a>
        </div>
      </div>
      {shownotesUrl && (
        <div className="slides-qr-card">
          <QrCode value={shownotesUrl} className="slides-qr" />
        </div>
      )}
    </div>
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

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

function TimerChip({ secondsLeft, paused }: { secondsLeft: number; paused: boolean }) {
  const timerClass = [
    "slides-timer",
    paused ? "slides-timer-paused" : "",
    !paused && secondsLeft <= 5 ? "slides-timer-low" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={timerClass}>
      <span className="slides-asterisk slides-pulse">✳</span> {secondsLeft}s
    </span>
  );
}

function Statusline({
  index,
  secondsLeft,
  paused,
}: {
  index: number;
  secondsLeft: number;
  paused: boolean;
}) {
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
        {index > 0 && <TimerChip secondsLeft={secondsLeft} paused={paused} />}
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

/* functional traffic lights: red restarts, yellow pauses the timer, green fullscreens */
function Titlebar({
  paused,
  onRestart,
  onTogglePause,
}: {
  paused: boolean;
  onRestart: () => void;
  onTogglePause: () => void;
}) {
  return (
    <header className="slides-titlebar">
      <div className="slides-lights">
        <button
          type="button"
          className="slides-light slides-light-close"
          aria-label="Go to first slide"
          title="First slide"
          onClick={(event) => {
            onRestart();
            event.currentTarget.blur();
          }}
        />
        <button
          type="button"
          className="slides-light slides-light-min"
          aria-label={paused ? "Resume timer" : "Pause timer"}
          title={paused ? "Resume timer" : "Pause timer"}
          onClick={(event) => {
            onTogglePause();
            event.currentTarget.blur();
          }}
        />
        <button
          type="button"
          className="slides-light slides-light-max"
          aria-label="Toggle fullscreen"
          title="Fullscreen"
          onClick={(event) => {
            toggleFullscreen();
            event.currentTarget.blur();
          }}
        />
      </div>
      <span className="slides-title">Claude Code — ~/git/cc-tricks</span>
    </header>
  );
}

function SlideContent({ index }: { index: number }) {
  if (index === 0) return <TitleSlide />;
  const trick = TRICKS.at(index - 1);
  if (trick) return <TrickSlide trick={trick} />;
  return <OutroSlide />;
}

/** Directional view transition + hash update for a slide change */
function startSlideTransition(current: number, next: number, commit: () => void) {
  document.documentElement.dataset.slideDir = next > current ? "fwd" : "back";
  document.startViewTransition(() => {
    flushSync(commit);
  });
  window.history.replaceState(null, "", next === 0 ? window.location.pathname : `#${next}`);
}

/** Deep-link: /slides#7 opens at trick 7 */
function useHashDeepLink(goTo: (next: number) => boolean) {
  useEffect(() => {
    const fromHash = Number.parseInt(window.location.hash.slice(1), 10);
    // eslint-disable-next-line no-effect/no-pass-data-to-parent -- one-shot sync from the URL hash
    if (Number.isInteger(fromHash) && fromHash >= 1 && fromHash < TOTAL) goTo(fromHash);
  }, [goTo]);
}

/**
 * PechaKucha-style countdown: idle on the title slide, restarts on every slide change,
 * auto-advances at zero (and parks at 0s on the final slide)
 */
function useCountdown({
  index,
  paused,
  goTo,
  indexRef,
  secondsRef,
  setSecondsLeft,
}: {
  index: number;
  paused: boolean;
  goTo: (next: number) => boolean;
  indexRef: React.RefObject<number>;
  secondsRef: React.RefObject<number>;
  setSecondsLeft: (seconds: number) => void;
}) {
  useEffect(() => {
    if (index === 0 || paused) return;
    const tick = () => {
      const next = Math.max(0, secondsRef.current - 1);
      secondsRef.current = next;
      if (next === 0) {
        if (!goTo(indexRef.current + 1)) setSecondsLeft(0);
      } else {
        setSecondsLeft(next);
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [index, paused, goTo, indexRef, secondsRef, setSecondsLeft]);
}

function useSlideKeys(goTo: (next: number) => boolean, indexRef: React.RefObject<number>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = KEY_TARGETS.get(event.key);
      if (!target) return;
      event.preventDefault();
      goTo(target(indexRef.current));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, indexRef]);
}

function SlidesDeck() {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SLIDE_SECONDS);
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(0);
  const secondsRef = useRef(SLIDE_SECONDS);

  const goTo = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, 0), TOTAL - 1);
    const current = indexRef.current;
    if (clamped === current) return false;
    indexRef.current = clamped;
    secondsRef.current = SLIDE_SECONDS;
    startSlideTransition(current, clamped, () => {
      setIndex(clamped);
      setSecondsLeft(SLIDE_SECONDS);
    });
    return true;
  }, []);

  useHashDeepLink(goTo);
  useCountdown({ index, paused, goTo, indexRef, secondsRef, setSecondsLeft });
  useSlideKeys(goTo, indexRef);

  return (
    <div className="cc-theme slides-root">
      <Titlebar
        paused={paused}
        onRestart={() => goTo(0)}
        onTogglePause={() => setPaused((wasPaused) => !wasPaused)}
      />

      <main className="slides-stage" aria-live="polite">
        <SlideContent index={index} />
      </main>

      <Statusline index={index} secondsLeft={secondsLeft} paused={paused} />
    </div>
  );
}
