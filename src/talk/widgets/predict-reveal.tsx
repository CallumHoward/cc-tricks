import { useState } from "react";

import { LAYA_BARS, LAYA_INPUT } from "#/talk/data/laya";
import { ProbBars } from "#/talk/kit/data/prob-bars";

import { type Guess, GuessChips } from "./guess-chips";
import { WidgetShell } from "./widget-shell";

/** W6: the room guesses the department, then Laya's typed probabilities spring in. */
export function PredictReveal({ width = 1300 }: { width?: number }) {
  const [guess, setGuess] = useState<Guess | null>(null);

  return (
    <WidgetShell label="Predict, then reveal">
      <div className="type-code">{LAYA_INPUT}</div>
      <div className="wg-row">
        <span className="type-label" style={{ color: "var(--soft)" }}>
          Billing or technical?
        </span>
        <GuessChips guess={guess} onGuess={setGuess} />
        {guess ? (
          <button type="button" className="wg-button type-label" onClick={() => setGuess(null)}>
            Ask again
          </button>
        ) : null}
      </div>
      {guess ? (
        <ProbBars
          key={guess.at}
          bars={LAYA_BARS}
          start={guess.at}
          stagger={0.2}
          clock="w"
          width={width}
        />
      ) : null}
    </WidgetShell>
  );
}
