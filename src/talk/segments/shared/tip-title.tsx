import { RuleRise } from "#/talk/kit/motion";

/** Display size of a tip title relative to `.type-headline` (120 px → 96 px). */
const SCALE = 0.8;

/** Top of a tip title: just below the 18% corner box. */
export const TIP_TITLE_TOP = 196;

/** Height of one title line at 96 px, rule padding included. */
export const TIP_TITLE_LINE = 112;

/**
 * The anchor every tip lands at its first stop: "N. Title" in display serif over a clay rule.
 * `text` takes `\n` line breaks like `RuleRise`.
 */
export function TipTitle({
  text,
  settleBy,
  exit,
  left = 200,
  top = TIP_TITLE_TOP,
}: {
  text: string;
  settleBy: number;
  exit?: number;
  left?: number;
  top?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: `scale(${SCALE})`,
        transformOrigin: "0 0",
      }}
    >
      <RuleRise text={text} settleBy={settleBy} exit={exit} />
    </div>
  );
}
