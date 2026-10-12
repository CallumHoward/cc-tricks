import { useState } from "react";

import { outCubic, prog } from "#/engine/motion/ease";
import { AA_POINTS, aaLabel } from "#/talk/data/aa";
import { fmtTokens, fmtUSD } from "#/talk/kit/data/logic";
import { ScatterChart } from "#/talk/kit/data/scatter-chart";
import { effortGlyph } from "#/talk/kit/data/scatter-layout";
import { RuleRise } from "#/talk/kit/motion";
import { scriptFor } from "#/talk/script";
import { WidgetShell } from "#/talk/widgets/widget-shell";

import { Layer, Live, Wiped } from "./bracket";
import { CHART, T3 } from "./timing";

const script = scriptFor("t3-aa");
const [CALLOUT_A = "", CALLOUT_B = ""] = script.labels;
const [AA_FOOT = "", DEADPAN = ""] = script.footnotes;
const SETTLE = T3.aa.at - 0.8;
/** The callout cards name the points, so the chart itself carries no labels. */
const CHART_CALLOUTS: readonly string[] = [];
const family = (ui: string | undefined) => (ui ?? "").replace(/ low$/, "");
/** The chart's key: model by colour, effort by glyph. */
const KEY = [
  { label: family(script.ui[0]), stroke: "var(--clay)", width: 6 },
  { label: family(script.ui[5]), stroke: "var(--text)", width: 3.5 },
  { label: script.ui[10] ?? "", stroke: null, width: 0 },
] as const;
/** "✢ low" → "low" (the glyph is drawn, not set in the mono face). */
const effortWord = (ui: string | undefined) => (ui ?? "").replace(/^\S+ /, "");
const [EFFORT_LOW, , , , EFFORT_MAX] = scriptFor("t3-then").ui;

function EffortMark({ effort }: { effort: "low" | "max" }) {
  return (
    <svg viewBox="-20 -20 40 40" width={40} height={40} aria-hidden>
      <path
        d={effortGlyph(effort, 16)}
        stroke="var(--soft)"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** "A · B · C" → ["A", "B · C"] so the long source line breaks at its first dot. */
export function splitFirst(text: string, sep: string): [string, string] {
  const i = text.indexOf(sep);
  return i < 0 ? [text, ""] : [text.slice(0, i), text.slice(i + sep.length)];
}

/** "Opus 5.5 high 54 · $1.82 beats Sonnet 5.5 xhigh" → the claim and its comparison. */
export function splitCallout(text: string): [string, string] {
  if (text.includes(" | ")) return splitFirst(text, " | ");
  const i = text.indexOf(" beats ");
  return i < 0 ? [text, ""] : [text.slice(0, i), text.slice(i + 1)];
}

function Callout({ text, at, top }: { text: string; at: number; top: number }) {
  const [a, b] = splitCallout(text);
  return (
    <Wiped
      at={at}
      dur={0.5}
      className="seg-card type-label"
      style={{ left: 1240, top, width: 520, display: "grid", gap: 6 }}
    >
      <span className="seg-hi" aria-label={text}>
        {a}
      </span>
      <span className="seg-soft">{b}</span>
    </Wiped>
  );
}

/** The chart's ticks have no entrance of their own: wipe the chart up as its axes draw. */
const reveal = (tau: number) => {
  const u = prog(tau, T3.aa.chartStart + 0.2, T3.aa.chartStart + 0.75, outCubic);
  return { clipTop: (1 - u) * 100 };
};

function ChartKey() {
  return (
    <div className="t3-key type-label">
      {KEY.map(({ label, stroke, width }) => (
        <div key={label} className="t3-key__row">
          <svg viewBox="-20 -20 40 40" width={40} height={40} aria-hidden>
            {stroke ? (
              <path
                d={effortGlyph("xhigh", 16)}
                stroke={stroke}
                strokeWidth={width}
                strokeLinecap="round"
              />
            ) : (
              <circle r={9} fill="var(--muted)" />
            )}
          </svg>
          <span className={stroke ? "seg-text" : "seg-soft"}>{label}</span>
        </div>
      ))}
      <div className="t3-key__row seg-soft">
        <EffortMark effort="low" />
        <span>{effortWord(EFFORT_LOW)}</span>
        <span className="seg-muted">→</span>
        <EffortMark effort="max" />
        <span>{effortWord(EFFORT_MAX)}</span>
      </div>
    </div>
  );
}

/** W3 with the film's entrance: the τ-driven ScatterChart plus a wall-clock readout. */
function Picker() {
  const [slug, setSlug] = useState<string | null>(null);
  const point = AA_POINTS.find((p) => p.slug === slug);
  return (
    <WidgetShell label="Effort picker" className="seg-fill">
      <Layer track={reveal}>
        <div className="seg-abs" style={{ left: CHART.x, top: CHART.y }}>
          <ScatterChart
            start={T3.aa.chartStart}
            frontier={T3.aa.frontier}
            callouts={CHART_CALLOUTS}
            selected={slug}
            onSelect={setSlug}
            width={CHART.w}
            height={CHART.h}
          />
        </div>
      </Layer>
      <Wiped at={SETTLE - 0.6} className="seg-abs" style={{ left: 1240, top: 196, width: 520 }}>
        {point ? (
          <div className="wg-card wg-readout type-label" aria-live="polite">
            <div style={{ display: "grid", gap: 6 }}>
              <b>{aaLabel(point)}</b>
              <span>
                Index <b>{point.intelligenceIndex.toFixed(1)}</b> ·{" "}
                <b>{fmtUSD(point.costPerTaskUSD)}</b>
              </span>
              <span>
                <b className="wg-hot">{fmtTokens(point.outputTokens)}</b> output tokens
              </span>
            </div>
          </div>
        ) : (
          <ChartKey />
        )}
      </Wiped>
    </WidgetShell>
  );
}

/** T3-aa: the dial's glyphs become the current-gen points; the bot walks the frontier. */
export function ChartPlate() {
  const [src1, src2] = splitFirst(AA_FOOT, " · ");
  return (
    <Live from={T3.aa.chartStart - 0.1} to={T3.winEnd}>
      <div className="seg-abs" style={{ left: 160, top: 196, scale: 0.62, transformOrigin: "0 0" }}>
        <RuleRise text={"Check the current gen\ncrossover benchmark charts"} settleBy={142.9} />
      </div>
      <Picker />
      <Callout text={CALLOUT_A} at={145.0} top={420} />
      <Callout text={CALLOUT_B} at={145.25} top={568} />
      <Wiped
        at={145.5}
        className="type-label seg-text seg-abs"
        style={{ left: 1240, top: 724, width: 520 }}
      >
        {DEADPAN}
      </Wiped>
      <Wiped
        at={145.4}
        className="type-label seg-muted seg-abs"
        style={{ left: CHART.x + 96, top: 924 }}
      >
        <div>{src1}</div>
        <div>{src2}</div>
      </Wiped>
    </Live>
  );
}
