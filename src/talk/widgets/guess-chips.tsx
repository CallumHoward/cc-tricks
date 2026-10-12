import { useStage } from "#/engine/stage/react";

const GUESSES = ["billing", "technical"] as const;

export type Guess = { pick: string; at: number };

/** The room's department guess for Laya's input, stamped with the wall time it was made. */
export function GuessChips({
  guess,
  onGuess,
}: {
  guess: Guess | null;
  onGuess: (guess: Guess) => void;
}) {
  const stage = useStage();
  return GUESSES.map((g) => (
    <button
      key={g}
      type="button"
      className="wg-chip type-label"
      aria-pressed={guess?.pick === g}
      onClick={() => onGuess({ pick: g, at: stage.frame().w })}
    >
      {g}
    </button>
  ));
}
