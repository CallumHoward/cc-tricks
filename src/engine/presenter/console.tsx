import { useEffect, useState, useSyncExternalStore } from "react";

import type { NavAction } from "#/engine/types";

import {
  isPresenterMessage,
  openPort,
  type Port,
  type PresenterMessage,
  type StateMessage,
} from "./channel";
import { formatClock, pace, presenterKeyAction } from "./console-model";
import { NotesMarkdown, type FaviconFor } from "./notes-markdown";

export type ConsoleStop = {
  id: string;
  title: string;
  notes?: string;
  /** Speaking target for this stop, in seconds */
  target?: number;
  /** Notes lines an earlier stop already said, shown muted */
  repeated?: ReadonlySet<string>;
  /** What the audience can play with on this slide */
  interactive?: string;
};

type Received = { state: StateMessage | null; stopSince: number };

/** Holds the latest stage state from the channel plus when the current stop began. */
function createStateStore(port: Port, now: () => number = Date.now) {
  let received: Received = { state: null, stopSince: now() };
  const listeners = new Set<() => void>();
  const onMessage = (event: MessageEvent) => {
    const data: unknown = event.data;
    if (!isPresenterMessage(data) || data.type !== "state") return;
    const changed = data.stopId !== received.state?.stopId;
    received = { state: data, stopSince: changed ? now() : received.stopSince };
    for (const listener of listeners) listener();
  };
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (listeners.size === 1) {
        port.addEventListener("message", onMessage);
        port.postMessage({ type: "hello" });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) port.removeEventListener("message", onMessage);
      };
    },
    getSnapshot: () => received,
    send: (message: Extract<PresenterMessage, { type: "nav" | "key" | "reset-timer" }>) =>
      port.postMessage(message),
  };
}

type Store = ReturnType<typeof createStateStore>;

let tickNow = 0;
const subscribeTick = (listener: () => void) => {
  const id = setInterval(() => {
    tickNow = Date.now();
    listener();
  }, 250);
  return () => clearInterval(id);
};
const getTick = () => tickNow;

/** Client-only: opens the BroadcastChannel on first render. */
export function PresenterConsole({
  stops,
  budget,
  faviconFor,
  port: injected,
}: {
  stops: readonly ConsoleStop[];
  /** Seconds */
  budget: number;
  faviconFor?: FaviconFor;
  port?: Port;
}) {
  const [store] = useState<Store | null>(() => {
    const port = injected ?? openPort();
    return port ? createStateStore(port) : null;
  });
  if (!store) return <p className="presenter-waiting">BroadcastChannel is unavailable.</p>;
  return <ConsoleView store={store} stops={stops} budget={budget} faviconFor={faviconFor} />;
}

function ConsoleClock({
  elapsed,
  budget,
  onStop,
  current,
  state,
}: {
  elapsed: number;
  budget: number;
  onStop: number;
  current: ConsoleStop | undefined;
  state: StateMessage;
}) {
  const status = pace(elapsed, state.target, state.stopIds.length, budget);
  const target = current?.target;
  return (
    <header className="presenter-clock">
      <span className="type-label" data-pace={status}>
        {formatClock(elapsed)} / {formatClock(budget * 1000)}
      </span>
      <span
        className="type-label"
        data-pace={target && onStop > target * 1000 ? "behind" : undefined}
      >
        stop {formatClock(onStop)}
        {target ? ` / ${formatClock(target * 1000)}` : ""}
      </span>
      <span className="type-label">
        {state.target + 1} of {state.stopIds.length}
      </span>
    </header>
  );
}

function ConsoleNav({ store }: { store: Store }) {
  const nav = (action: NavAction) => store.send({ type: "nav", action });
  return (
    <nav className="presenter-buttons" aria-label="Stage navigation">
      <button type="button" onClick={() => nav({ type: "prev" })}>
        ← Back
      </button>
      <button type="button" onClick={() => nav({ type: "next" })}>
        Next →
      </button>
      <button type="button" onClick={() => store.send({ type: "reset-timer" })}>
        Reset timer
      </button>
    </nav>
  );
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

/** Drives the stage with the talk's keys from this window; fullscreen can't cross windows. */
function useForwardKeys(store: Store): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = presenterKeyAction(event);
      if (!action) return;
      event.preventDefault();
      if (action === "fullscreen") toggleFullscreen();
      else store.send({ type: "key", key: event.key });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);
}

/** Talk time since the first navigation; zero before the talk starts or the tick runs. */
const elapsedSince = (startedAt: number | null, now: number) =>
  startedAt === null || now === 0 ? 0 : now - startedAt;

function CurrentStop({
  stop,
  fallbackTitle,
  faviconFor,
}: {
  stop: ConsoleStop | undefined;
  fallbackTitle: string;
  faviconFor?: FaviconFor;
}) {
  const { title = fallbackTitle, notes = "", repeated, interactive } = stop ?? {};
  return (
    <section aria-label="Current stop" className="presenter-current">
      <h1 className="presenter-title">
        {title}
        {interactive && (
          <span className="presenter-interactive" title={`Interactive: ${interactive}`}>
            <span aria-hidden>☝</span> {interactive}
          </span>
        )}
      </h1>
      <NotesMarkdown text={notes} repeated={repeated} faviconFor={faviconFor} />
    </section>
  );
}

function StopPanels({
  state,
  current,
  stops,
  faviconFor,
}: {
  state: StateMessage;
  current: ConsoleStop | undefined;
  stops: readonly ConsoleStop[];
  faviconFor?: FaviconFor;
}) {
  const nextId: string | undefined = state.stopIds[state.target + 1];
  const next = stops.find((s) => s.id === nextId);
  return (
    <>
      <CurrentStop
        key={state.stopId}
        stop={current}
        fallbackTitle={state.stopId}
        faviconFor={faviconFor}
      />
      <section aria-label="Next stop" className="presenter-next">
        <h2 className="type-label">Next: {next?.title ?? nextId ?? "end"}</h2>
      </section>
    </>
  );
}

function ConsoleView({
  store,
  stops,
  budget,
  faviconFor,
}: {
  store: Store;
  stops: readonly ConsoleStop[];
  budget: number;
  faviconFor?: FaviconFor;
}) {
  const { state, stopSince } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const now = useSyncExternalStore(subscribeTick, getTick, getTick);
  useForwardKeys(store);
  if (!state)
    return <p className="presenter-waiting">Waiting for the stage… (open / in another window)</p>;

  const current = stops.find((s) => s.id === state.stopId);
  const onStop = now === 0 ? 0 : Math.max(0, now - stopSince);

  return (
    <div className="presenter" data-target={state.target}>
      <ConsoleClock
        elapsed={elapsedSince(state.startedAt, now)}
        budget={budget}
        onStop={onStop}
        current={current}
        state={state}
      />
      <StopPanels state={state} current={current} stops={stops} faviconFor={faviconFor} />
      <ConsoleNav store={store} />
    </div>
  );
}
