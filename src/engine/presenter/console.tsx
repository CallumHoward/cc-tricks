import { useState, useSyncExternalStore } from "react";

import type { NavAction } from "#/engine/types";

import { isPresenterMessage, openPort, type Port, type StateMessage } from "./channel";
import { formatClock, pace } from "./console-model";

export type ConsoleStop = { id: string; title: string; notes?: string };

type Received = { state: StateMessage | null; stopSince: number };

/** Holds the latest stage state from the channel plus when the current stop began. */
export function createStateStore(port: Port, now: () => number = Date.now) {
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
    send: (message: { type: "nav"; action: NavAction } | { type: "reset-timer" }) =>
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
  port: injected,
}: {
  stops: readonly ConsoleStop[];
  /** Seconds */
  budget: number;
  port?: Port;
}) {
  const [store] = useState<Store | null>(() => {
    const port = injected ?? openPort();
    return port ? createStateStore(port) : null;
  });
  if (!store) return <p className="presenter-waiting">BroadcastChannel is unavailable.</p>;
  return <ConsoleView store={store} stops={stops} budget={budget} />;
}

function ConsoleView({
  store,
  stops,
  budget,
}: {
  store: Store;
  stops: readonly ConsoleStop[];
  budget: number;
}) {
  const { state, stopSince } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const now = useSyncExternalStore(subscribeTick, getTick, getTick);
  if (!state)
    return <p className="presenter-waiting">Waiting for the stage… (open / in another window)</p>;

  const byId = (id: string | undefined): ConsoleStop | undefined => stops.find((s) => s.id === id);
  const current = byId(state.stopId);
  const nextId: string | undefined = state.stopIds[state.target + 1];
  const next = byId(nextId);
  const elapsed = state.startedAt === null || now === 0 ? 0 : now - state.startedAt;
  const onStop = now === 0 ? 0 : Math.max(0, now - stopSince);
  const status = pace(elapsed, state.target, state.stopIds.length, budget);
  const nav = (action: NavAction) => store.send({ type: "nav", action });

  return (
    <div className="presenter" data-target={state.target}>
      <header className="presenter-clock">
        <span className="type-label" data-pace={status}>
          {formatClock(elapsed)} / {formatClock(budget * 1000)}
        </span>
        <span className="type-label">stop {formatClock(onStop)}</span>
        <span className="type-label">
          {state.target + 1} of {state.stopIds.length}
        </span>
      </header>
      <section aria-label="Current stop" className="presenter-current">
        <h1 className="presenter-title">{current?.title ?? state.stopId}</h1>
        <p className="presenter-notes">{current?.notes ?? ""}</p>
      </section>
      <section aria-label="Next stop" className="presenter-next">
        <h2 className="type-label">Next: {next?.title ?? nextId ?? "end"}</h2>
      </section>
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
    </div>
  );
}
