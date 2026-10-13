import type { Clock } from "#/engine/clock/clock";
import type { Frame, FrameCallback, MountWindow, NavAction, Stop } from "#/engine/types";

/** Update order within a tick; lower runs first. */
export const PRIORITY = Object.freeze({
  clock: 0,
  dom: 10,
  three: 20,
  shaders: 30,
  overlay: 40,
});

/** Story seconds a segment stays mounted before and after its window. */
const MOUNT_ROLL = 1;

/** Coarse state for React; identity only changes when a field changes. */
export type StageSnapshot = {
  readonly target: number;
  readonly stopId: string;
  readonly mountedSegments: readonly string[];
};

/** Non-navigation intents from keys or chrome; the host decides what each does. */
export type StageCommand =
  | { type: "blackout" }
  | { type: "fullscreen" }
  | { type: "overview" }
  | { type: "presenter" };

type Scheduler = {
  request(cb: () => void): number;
  cancel(id: number): void;
};

export type StageOptions = {
  clock: Clock;
  /** Used to resolve `stopId` from the clock's target */
  stops?: readonly Stop[];
  segments?: readonly { id: string; window: MountWindow }[];
  /** Wall seconds */
  now?: () => number;
  scheduler?: Scheduler;
  /** Resolves when web fonts are ready (stills wait for it) */
  fontsReady?: () => Promise<unknown>;
};

export type Stage = {
  readonly clock: Clock;
  /** Registers a per-tick callback; equal priorities run in registration order */
  onFrame: (cb: FrameCallback, priority?: number) => () => void;
  /** Last rendered frame */
  frame: () => Frame;
  start: () => void;
  stop: () => void;
  /** Stops the loop and renders `tau` once; sets `window.__stageReady` once settled */
  freeze: (at: { tau: number; w: number }) => void;
  readonly frozen: boolean;
  /** Delays readiness of a frozen frame until the returned release is called */
  hold: (label: string) => () => void;
  dispatch: (action: NavAction) => void;
  registerSegment: (id: string, window: MountWindow) => () => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => StageSnapshot;
  emit: (command: StageCommand) => void;
  onCommand: (listener: (command: StageCommand) => void) => () => void;
  dispose: () => void;
};

declare global {
  interface Window {
    __stageReady?: boolean;
  }
}

export function inMountWindow(window: MountWindow, tau: number, roll = MOUNT_ROLL): boolean {
  return tau >= window.start - roll && tau <= window.end + roll;
}

/** Ids of the windows mounted at τ, in registration order without duplicates. */
export function mountedAt(
  windows: Iterable<{ id: string; window: MountWindow }>,
  tau: number,
  roll = MOUNT_ROLL,
): string[] {
  const ids: string[] = [];
  for (const { id, window } of windows) {
    if (inMountWindow(window, tau, roll) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

const browserScheduler: Scheduler = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
};

const defaultNow = () => performance.now() / 1000;

const defaultFontsReady = () =>
  typeof document === "undefined" || !("fonts" in document)
    ? Promise.resolve()
    : document.fonts.ready;

/** Slowest rate ambient time ever runs forward: stops read as slo-mo, never as a freeze. */
export const AMBIENT_FLOOR = 0.08;

/** Ambient time rate for a playhead velocity: follows rewinds, floors forward motion. */
export function ambientRate(v: number): number {
  return v < 0 ? v : Math.max(v, AMBIENT_FLOOR);
}

/** Below this playhead speed the stage is holding at a stop. */
const HOLDING_SPEED = 0.2;
/** How fast (per second) ambient time eases back onto story time while travelling. */
const REANCHOR = 2.5;

/**
 * Ambient time for the next frame. It runs ahead of story time only while holding, then eases back
 * onto it in transit (never reversing), so drift that keys off it stays bounded by one hold.
 */
function nextAmbient(prev: Frame, tau: number, v: number, dt: number): number {
  const rho = ambientTime(prev) + ambientRate(v) * dt;
  if (Math.abs(v) < HOLDING_SPEED) return rho;
  const eased = tau + (ambientTime(prev) - prev.tau) * Math.exp(-REANCHOR * dt);
  const minStep = 0.5 * v * dt;
  return v > 0
    ? Math.max(eased, ambientTime(prev) + minStep)
    : Math.min(eased, ambientTime(prev) + minStep);
}

/** Ambient ramped time for a frame (`tau` when the producer predates `rho`). */
export function ambientTime(frame: Frame): number {
  return frame.rho ?? frame.tau;
}

export function createStage({
  clock,
  stops = [],
  segments = [],
  now = defaultNow,
  scheduler = browserScheduler,
  fontsReady = defaultFontsReady,
}: StageOptions): Stage {
  const epoch = now();
  const wall = () => now() - epoch;
  const callbacks: { cb: FrameCallback; priority: number; seq: number }[] = [];
  const listeners = new Set<() => void>();
  const commandListeners = new Set<(command: StageCommand) => void>();
  const windows = new Map<symbol, { id: string; window: MountWindow }>();
  for (const s of segments) windows.set(Symbol(s.id), s);

  let seq = 0;
  let raf = 0;
  let running = false;
  let frozen = false;
  let freezeToken = 0;
  let holds = 0;
  let drained: (() => void) | undefined;
  let last: Frame = { tau: clock.sample(0).tau, v: 0, w: 0, dt: 0 };

  const snapshotFor = (tau: number): StageSnapshot => ({
    target: clock.target,
    stopId: stops[clock.target]?.id ?? "",
    mountedSegments: mountedAt(windows.values(), tau),
  });
  let snapshot = snapshotFor(last.tau);

  const refresh = () => {
    const next = snapshotFor(last.tau);
    if (
      next.target === snapshot.target &&
      next.stopId === snapshot.stopId &&
      next.mountedSegments.join("\n") === snapshot.mountedSegments.join("\n")
    ) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const render = (frame: Frame) => {
    last = frame;
    for (const { cb } of callbacks) {
      try {
        cb(frame);
      } catch (error) {
        console.error(error);
      }
    }
    refresh();
  };

  const tick = () => {
    if (!running) return;
    const w = wall();
    const { tau, v } = clock.sample(w);
    const dt = Math.max(0, w - last.w);
    render({ tau, v, w, dt, rho: nextAmbient(last, tau, v, dt) });
    raf = scheduler.request(tick);
  };

  const nextFrame = () => new Promise<void>((resolve) => scheduler.request(() => resolve()));
  const holdsDrained = () =>
    holds === 0
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          drained = resolve;
        });

  const unsubscribeClock = clock.subscribe(refresh);

  const stop = () => {
    running = false;
    scheduler.cancel(raf);
  };

  return {
    clock,
    onFrame(cb, priority = PRIORITY.dom) {
      const entry = { cb, priority, seq: seq++ };
      callbacks.push(entry);
      callbacks.sort((a, b) => a.priority - b.priority || a.seq - b.seq);
      return () => {
        const i = callbacks.indexOf(entry);
        if (i >= 0) callbacks.splice(i, 1);
      };
    },
    frame: () => last,
    start() {
      if (running || frozen) return;
      running = true;
      raf = scheduler.request(tick);
    },
    stop,
    freeze({ tau, w }) {
      stop();
      frozen = true;
      const token = ++freezeToken;
      const frame = { tau, v: 0, w, dt: 0, rho: tau };
      render(frame);
      void (async () => {
        await fontsReady();
        // Segments mount through React after the first render, so keep waiting until no hold appears for a few frames
        for (let quiet = 0; quiet < 3; ) {
          await nextFrame();
          if (holds === 0) {
            quiet++;
            continue;
          }
          quiet = 0;
          await holdsDrained();
          render(frame);
        }
        await fontsReady();
        if (token !== freezeToken) return;
        render(frame);
        await nextFrame();
        await nextFrame();
        if (token === freezeToken && typeof window !== "undefined") window.__stageReady = true;
      })();
    },
    get frozen() {
      return frozen;
    },
    hold() {
      holds++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        holds--;
        if (holds === 0) drained?.();
      };
    },
    dispatch(action) {
      if (frozen) return;
      clock.dispatch(action, wall());
    },
    registerSegment(id, window) {
      const key = Symbol(id);
      windows.set(key, { id, window });
      refresh();
      return () => {
        windows.delete(key);
        refresh();
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    emit(command) {
      for (const listener of commandListeners) listener(command);
    },
    onCommand(listener) {
      commandListeners.add(listener);
      return () => {
        commandListeners.delete(listener);
      };
    },
    dispose() {
      stop();
      freezeToken++;
      unsubscribeClock();
      callbacks.length = 0;
      listeners.clear();
      commandListeners.clear();
    },
  };
}
