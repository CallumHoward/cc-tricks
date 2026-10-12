import { useState } from "react";

import { useStage } from "#/engine/stage/react";
import { PRICING, type ModelId } from "#/talk/data/pricing";
import { columnValueAt, fmtTimes, fmtTokens, fmtUSD } from "#/talk/kit/data/logic";
import { PriceColumns, type PriceColumn } from "#/talk/kit/data/price-columns";

import { sliderToTokens, tokensToSlider, turnPrices } from "./logic";
import { Range, WidgetShell } from "./widget-shell";

const STAGGER = 0.06;

function columnsFor(model: ModelId, tokens: number): PriceColumn[] {
  const p = turnPrices(model, tokens);
  return [
    { id: "base", label: "base", value: p.base, tone: "base" },
    { id: "write5m", label: "5m write", value: p.write5m, tone: "paid" },
    { id: "write1h", label: "1h write", value: p.write1h, tone: "paid" },
    { id: "hit", label: "hit", value: p.hit, tone: "cached" },
  ];
}

/** W1: pick a model and a context size; see a warm turn against a cold one. */
export function PriceOfATurn({ width = 1100 }: { width?: number }) {
  const stage = useStage();
  const [model, setModel] = useState<ModelId>("opus-5.5");
  const [slider, setSlider] = useState(() => tokensToSlider(100_000));
  const [anim, setAnim] = useState(() => ({ at: stage.frame().w, from: [0, 0, 0, 0] as number[] }));
  const tokens = sliderToTokens(slider);
  const columns = columnsFor(model, tokens);
  const p = turnPrices(model, tokens);

  const retarget = (nextModel: ModelId, nextSlider: number) => {
    const w = stage.frame().w;
    const shown = columns.map((c, i) =>
      columnValueAt(w - anim.at, i, anim.from[i] ?? 0, c.value, STAGGER),
    );
    setAnim({ at: w, from: shown });
    setModel(nextModel);
    setSlider(nextSlider);
  };

  return (
    <WidgetShell label="Price of a turn">
      <fieldset className="wg-row wg-fieldset" aria-label="Model">
        {PRICING.map((m) => (
          <button
            key={m.id}
            type="button"
            className="wg-chip type-label"
            aria-pressed={m.id === model}
            onClick={() => retarget(m.id, slider)}
          >
            {m.name}
          </button>
        ))}
      </fieldset>
      <Range
        label="Context"
        value={slider}
        min={0}
        max={1000}
        display={fmtTokens(tokens)}
        onChange={(v) => retarget(model, v)}
      />
      <PriceColumns
        columns={columns}
        start={anim.at}
        from={anim.from}
        stagger={STAGGER}
        clock="w"
        width={width}
        height={380}
      />
      <div className="wg-readout type-label">
        <span>
          Warm <b>{fmtUSD(p.hit)}</b>
        </span>
        <span>
          Cold, 1h write <b>{fmtUSD(p.write1h)}</b>
        </span>
        <span className="wg-hot">{fmtTimes(p.write1h / p.hit)} more cold</span>
      </div>
    </WidgetShell>
  );
}
