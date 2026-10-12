import { useState } from "react";

import { fmtTokens, fmtUSD } from "#/talk/kit/data/logic";

import { sliderToTokens, suggestionCost, tokensToSlider } from "./logic";
import { Range, WidgetShell } from "./widget-shell";

/**
 * W5: each suggestion is a background call that re-reads your context (estimate at Opus 5.5 list
 * price).
 */
export function SuggestionToggle() {
  const [enabled, setEnabled] = useState(true);
  const [slider, setSlider] = useState(() => tokensToSlider(200_000));
  const tokens = sliderToTokens(slider);
  const each = suggestionCost("opus-5.5", tokens);

  return (
    <WidgetShell label="Prompt suggestion toggle">
      <div className="wg-row">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          className="wg-chip type-code"
          onClick={() => setEnabled((v) => !v)}
        >
          {`"promptSuggestionEnabled": ${enabled}`}
        </button>
      </div>
      <Range
        label="Context"
        value={slider}
        min={0}
        max={1000}
        display={fmtTokens(tokens)}
        onChange={setSlider}
      />
      <div className="wg-readout type-label" aria-live="polite">
        <span>
          Per suggestion{" "}
          <b className={enabled ? "wg-hot" : undefined}>{enabled ? fmtUSD(each) : "$0"}</b>
        </span>
        <span>
          Per 100 <b>{enabled ? fmtUSD(each * 100) : "$0"}</b>
        </span>
        <span style={{ color: "var(--muted)" }}>estimate: cached read at Opus 5.5 list price</span>
      </div>
    </WidgetShell>
  );
}
