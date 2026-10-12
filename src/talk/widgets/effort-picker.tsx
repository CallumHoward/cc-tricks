import { useState } from "react";

import { AA_POINTS, aaLabel } from "#/talk/data/aa";
import { fmtTokens, fmtUSD } from "#/talk/kit/data/logic";
import { ScatterChart } from "#/talk/kit/data/scatter-chart";

import { WidgetShell } from "./widget-shell";

/** W3: click any point for its index, cost per task and output tokens per task. */
export function EffortPicker({
  start,
  width = 1400,
  height = 760,
}: {
  start: number;
  width?: number;
  height?: number;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const point = AA_POINTS.find((p) => p.slug === slug);

  return (
    <WidgetShell label="Effort picker">
      <ScatterChart
        start={start}
        selected={slug}
        onSelect={setSlug}
        width={width}
        height={height}
      />
      <div className="wg-card wg-readout type-label" aria-live="polite">
        {point ? (
          <>
            <b>{aaLabel(point)}</b>
            <span>
              Index <b>{point.intelligenceIndex.toFixed(1)}</b>
            </span>
            <span>
              <b>{fmtUSD(point.costPerTaskUSD)}</b> per task
            </span>
            <span>
              <b className="wg-hot">{fmtTokens(point.outputTokens)}</b> output tokens per task
            </span>
          </>
        ) : (
          <span>Pick a point</span>
        )}
      </div>
    </WidgetShell>
  );
}
