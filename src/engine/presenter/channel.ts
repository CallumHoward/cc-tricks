import type { Stage } from "#/engine/stage/stage";
import type { NavAction } from "#/engine/types";

export const PRESENTER_CHANNEL = "cc-tricks-presenter";

export type StateMessage = {
  type: "state";
  target: number;
  stopId: string;
  tau: number;
  v: number;
  /** Epoch ms of the first navigation, or null before the talk starts */
  startedAt: number | null;
  stopIds: readonly string[];
};

export type PresenterMessage =
  | StateMessage
  | { type: "nav"; action: NavAction }
  | { type: "hello" }
  | { type: "reset-timer" };

/** The slice of BroadcastChannel we use, so tests can inject a fake. */
export type Port = {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  close?(): void;
};

const NAV_TYPES = new Set(["next", "prev", "goto", "first", "last"]);

export function isPresenterMessage(data: unknown): data is PresenterMessage {
  if (typeof data !== "object" || data === null || !("type" in data)) return false;
  switch (data.type) {
    case "hello":
    case "reset-timer":
      return true;
    case "state":
      return "target" in data && "stopId" in data && "tau" in data;
    case "nav": {
      const action = (data as { action?: { type?: unknown } }).action;
      return typeof action?.type === "string" && NAV_TYPES.has(action.type);
    }
    default:
      return false;
  }
}

export function openPort(): Port | undefined {
  return typeof BroadcastChannel === "undefined"
    ? undefined
    : new BroadcastChannel(PRESENTER_CHANNEL);
}

/** Publishes stage state and applies console navigation; returns a disposer. */
export function bridgeStage(
  stage: Stage,
  port: Port,
  stopIds: readonly string[],
  { now = Date.now, intervalMs = 500 }: { now?: () => number; intervalMs?: number } = {},
): () => void {
  let startedAt: number | null = null;
  const publish = () => {
    const { tau, v } = stage.frame();
    const { target, stopId } = stage.getSnapshot();
    const message: StateMessage = { type: "state", target, stopId, tau, v, startedAt, stopIds };
    port.postMessage(message);
  };
  const markStarted = () => {
    startedAt ??= now();
  };
  const onMessage = (event: MessageEvent) => {
    const data: unknown = event.data;
    if (!isPresenterMessage(data)) return;
    if (data.type === "nav") {
      markStarted();
      stage.dispatch(data.action);
    } else if (data.type === "reset-timer") {
      startedAt = now();
    }
    if (data.type !== "state") publish();
  };
  let lastTarget = stage.getSnapshot().target;
  const unsubscribe = stage.subscribe(() => {
    const { target } = stage.getSnapshot();
    if (target !== lastTarget) markStarted();
    lastTarget = target;
    publish();
  });
  port.addEventListener("message", onMessage);
  const interval = setInterval(publish, intervalMs);
  publish();
  return () => {
    clearInterval(interval);
    unsubscribe();
    port.removeEventListener("message", onMessage);
  };
}
