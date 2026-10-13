import { useEffect, useState, type ReactNode } from "react";

import { createClock } from "#/engine/clock/clock";
import type { Tuning } from "#/engine/clock/planner";
import { useNavKeys } from "#/engine/input/use-nav-keys";
import { bridgeStage, openPort } from "#/engine/presenter/channel";
import type { MountWindow, Stop } from "#/engine/types";

import { StageProvider, useStageSnapshot } from "./react";
import { createStage, type Stage, type StageCommand } from "./stage";
import { parseStageUrl, type StageStart } from "./url";
import { Viewport } from "./viewport";

type Props = {
  stops: readonly Stop[];
  segments?: readonly { id: string; window: MountWindow }[];
  tuning?: Partial<Tuning>;
  children: ReactNode;
};

function boot({ stops, segments, tuning }: Omit<Props, "children">) {
  const start = parseStageUrl(window.location.search, window.location.hash, stops);
  const clock = createClock({
    stops,
    tuning,
    start: start.kind === "frozen" ? { tau: start.tau } : { index: start.index },
  });
  return { start, stage: createStage({ clock, stops, segments }) };
}

function openPresenterWindow(): void {
  window.open("/presenter", "cc-tricks-presenter", "popup,width=1280,height=800");
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

/** Client-only talk host: clock, stage loop, viewport, keys, presenter bridge and deep links. */
export function StageHost({ children, ...options }: Props) {
  const [{ start, stage }] = useState(() => boot(options));
  const [blackout, setBlackout] = useState(false);

  useEffect(() => {
    if (start.kind === "frozen") stage.freeze({ tau: start.tau, w: start.w });
    else stage.start();
    return () => stage.stop();
  }, [stage, start]);

  useEffect(
    () =>
      stage.onCommand((command: StageCommand) => {
        if (command.type === "blackout") setBlackout((b) => !b);
        else if (command.type === "fullscreen") toggleFullscreen();
        else if (command.type === "presenter") openPresenterWindow();
      }),
    [stage],
  );

  useEffect(() => {
    if (start.kind === "frozen") return;
    const port = openPort();
    const unbridge = port
      ? bridgeStage(
          stage,
          port,
          options.stops.map((s) => s.id),
        )
      : undefined;
    syncHash(stage);
    const unhash = stage.subscribe(() => syncHash(stage));
    return () => {
      unbridge?.();
      port?.close?.();
      unhash();
    };
  }, [stage, start, options.stops]);

  return (
    <StageProvider stage={stage}>
      <Viewport>
        <StageSurface stage={stage} start={start}>
          {children}
        </StageSurface>
      </Viewport>
      {blackout ? <div className="stage-blackout" data-testid="blackout" /> : null}
    </StageProvider>
  );
}

function syncHash(stage: Stage) {
  const { stopId } = stage.getSnapshot();
  if (stopId && window.location.hash !== `#${stopId}`) {
    window.history.replaceState(window.history.state, "", `#${stopId}`);
  }
}

function StageSurface({
  stage,
  start,
  children,
}: {
  stage: Stage;
  start: StageStart;
  children: ReactNode;
}) {
  const { target, stopId } = useStageSnapshot();
  useNavKeys(stage);
  return (
    <main
      className="stage-world"
      data-stage
      data-target={target}
      data-stop={stopId}
      data-frozen={start.kind === "frozen" || undefined}
      aria-label="Talk stage"
    >
      {children}
    </main>
  );
}
