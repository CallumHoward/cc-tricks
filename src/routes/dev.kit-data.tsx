import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import type { Clock } from "#/engine/clock/clock";
import { SPRINGS } from "#/engine/motion/spring";
import { keys } from "#/engine/motion/track";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";
import { LAYA_BARS } from "#/talk/data/laya";
import { ROUTINES } from "#/talk/data/routines";
import { DayRuler } from "#/talk/kit/data/day-ruler";
import { PriceColumns } from "#/talk/kit/data/price-columns";
import { ProbBars } from "#/talk/kit/data/prob-bars";
import { QrGrow } from "#/talk/kit/data/qr-grow";
import { RingTimer } from "#/talk/kit/data/ring-timer";
import { ScatterChart } from "#/talk/kit/data/scatter-chart";
import { WeeklyBars } from "#/talk/kit/data/weekly-bars";
import { EffortPicker } from "#/talk/widgets/effort-picker";
import { IdleTtl } from "#/talk/widgets/idle-ttl";
import { PingChain } from "#/talk/widgets/ping-chain";
import { PredictReveal } from "#/talk/widgets/predict-reveal";
import { PriceOfATurn } from "#/talk/widgets/price-of-a-turn";
import { ResetButton } from "#/talk/widgets/reset-button";
import { SuggestionToggle } from "#/talk/widgets/suggestion-toggle";

export const Route = createFileRoute("/dev/kit-data")({
  ssr: false,
  component: KitDataGallery,
});

/** Dev clock: τ is whatever the slider says; wall time keeps running for widgets. */
function manualClock(initial: number) {
  let tau = initial;
  const listeners = new Set<() => void>();
  const clock = {
    sample: () => ({ tau, v: 0 }),
    dispatch: () => {},
    target: 0,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    plan: () => ({ segments: [] }),
  } as unknown as Clock;
  return { clock, set: (t: number) => (tau = t) };
}

const COLUMNS = [
  { id: "base", label: "base", value: 0.4, tone: "base" },
  { id: "write5m", label: "5m write", value: 0.5, tone: "paid" },
  { id: "write1h", label: "1h write", value: 0.8, tone: "paid" },
  { id: "hit", label: "hit", value: 0.02, tone: "cached" },
] as const;

const WEEKLY = [
  {
    id: "all",
    label: "All models",
    sub: "Resets in 6 min",
    used: keys([1, 0], [2.6, 0.88, SPRINGS.COUNT]),
  },
  {
    id: "fable",
    label: "Fable",
    sub: "Resets in 6 min",
    used: keys([1.3, 0], [2.9, 0.95, SPRINGS.COUNT]),
  },
];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        display: "grid",
        gap: 24,
        padding: "48px 0",
        borderTop: "1px solid var(--hairline)",
      }}
    >
      <h2
        className="type-label"
        style={{
          margin: 0,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function KitDataGallery() {
  const initial = Number(new URLSearchParams(window.location.search).get("t") ?? "6");
  const [{ stage, set }] = useState(() => {
    const m = manualClock(initial);
    return { stage: createStage({ clock: m.clock }), set: m.set };
  });
  const [tau, setTau] = useState(initial);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("freeze")) {
      stage.freeze({ tau: initial, w: initial });
    } else stage.start();
    return () => stage.stop();
  }, [stage, initial]);

  useEffect(() => {
    if (!playing) return;
    return stage.onFrame((f) => {
      const next = (tau + f.dt) % 7;
      set(next);
      setTau(next);
    }, 0);
  }, [playing, stage, set, tau]);

  return (
    <StageProvider stage={stage}>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
          padding: "0 160px 160px",
        }}
      >
        <div
          data-interactive
          className="type-label"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            gap: 24,
            alignItems: "center",
            padding: "24px 0",
            background: "var(--bg)",
          }}
        >
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            style={{ minWidth: 64, minHeight: 64 }}
          >
            {playing ? "pause" : "play"}
          </button>
          <input
            type="range"
            aria-label="Story time"
            min={0}
            max={7}
            step={0.01}
            value={tau}
            style={{ flex: 1 }}
            onChange={(e) => {
              const t = Number(e.currentTarget.value);
              set(t);
              setTau(t);
            }}
          />
          <output style={{ minWidth: 160 }}>τ {tau.toFixed(2)}</output>
        </div>

        <Panel title="PriceColumns · start 1">
          <PriceColumns columns={COLUMNS} start={1} />
        </Panel>
        <Panel title="RingTimer · 1h burns 2→10 · 5m burns 2→4">
          <div style={{ display: "flex", gap: 48 }}>
            <RingTimer label="1h" start={1} burn={{ start: 2, end: 10 }} tone="cached" size={220} />
            {[0, 1, 2, 3, 4].map((i) => (
              <RingTimer
                key={i}
                label="5m"
                start={1.2 + i * 0.08}
                burn={{ start: 2, end: 4 + i * 0.3 }}
                size={160}
              />
            ))}
          </div>
        </Panel>
        <Panel title="ScatterChart · start 1">
          <ScatterChart start={1} />
        </Panel>
        <Panel title="DayRuler · start 1">
          <DayRuler start={1} pins={ROUTINES.map((r) => r.at)} />
        </Panel>
        <Panel title="ProbBars · start 1 · quiver urgency">
          <ProbBars bars={LAYA_BARS} start={1} quiverIndex={1} />
        </Panel>
        <Panel title="WeeklyBars">
          <WeeklyBars bars={WEEKLY} />
        </Panel>
        <Panel title="QrGrow · 1→3">
          <QrGrow value="https://cc-tricks.example/shownotes" start={1} end={3} />
        </Panel>
        <Panel title="W1 PriceOfATurn">
          <PriceOfATurn />
        </Panel>
        <Panel title="W2 IdleTtl">
          <IdleTtl />
        </Panel>
        <Panel title="W3 EffortPicker">
          <EffortPicker start={1} />
        </Panel>
        <Panel title="W4 PingChain">
          <PingChain start={1} />
        </Panel>
        <Panel title="W5 SuggestionToggle">
          <SuggestionToggle />
        </Panel>
        <Panel title="W6 PredictReveal">
          <PredictReveal />
        </Panel>
        <Panel title="W7 ResetButton">
          <ResetButton />
        </Panel>
      </div>
    </StageProvider>
  );
}
