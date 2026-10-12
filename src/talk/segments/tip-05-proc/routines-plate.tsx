import { prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useTrack } from "#/engine/stage/react";
import { ROUTINES } from "#/talk/data/routines";
import { RuleRise } from "#/talk/kit/motion";
import { springFrom } from "#/talk/kit/motion/schedule";
import { scriptFor } from "#/talk/script";
import { Layer, Live, Wiped } from "#/talk/segments/tip-03-effort/bracket";
import { inCubic, type Pt } from "#/talk/segments/tip-03-effort/tracks";

import { cardFold, pinStart, T5 } from "./timing";

const script = scriptFor("t5-routines");
const SETTLE = T5.routines.at - 0.8;
const EXIT = T5.routines.holdEnd;

export const CARD = Object.freeze({ x: 1000, y: 200, w: 720, h: 160, gap: 12 });

/** Card `i`'s three UI strings (prompt, name, schedule) from the script's `ui` triples. */
export function cardCopy(i: number) {
  const [prompt = "", name = "", status = ""] = script.ui.slice(i * 3, i * 3 + 3);
  return { prompt, name, status, tag: script.ui[9] ?? "Cloud" };
}

/** Card `i`: lands from the right, then folds into the pin it becomes. */
export function cardAt(i: number, tau: number) {
  const k = springFrom(tau, 163.3 + i * 0.2 - 0.25, SPRINGS.LAND);
  const center: Pt = { x: CARD.x + CARD.w / 2, y: CARD.y + i * (CARD.h + CARD.gap) + CARD.h / 2 };
  const routine = ROUTINES[i];
  const pin = pinStart(routine?.at ?? 330);
  const f = cardFold(i, tau);
  const shown = tau >= 163.05 + i * 0.2 && f < 1;
  return {
    x: (1 - k) * 220 + (pin.x - center.x) * f,
    y: (pin.y - center.y) * f,
    scale: shown ? (0.9 + 0.1 * k) * (1 - 0.97 * f) : 0,
    scaleY: 1 - 0.6 * f,
  };
}

function RoutineCard({ i }: { i: number }) {
  const ref = useTrack((tau: number) => cardAt(i, tau));
  const c = cardCopy(i);
  return (
    <div
      ref={ref}
      className="seg-card t5-card"
      data-tui-replica
      style={{ left: CARD.x, top: CARD.y + i * (CARD.h + CARD.gap), width: CARD.w, height: CARD.h }}
    >
      <div className="t5-card__row">
        <span className="type-label seg-text">{c.name}</span>
        <span className="type-label t5-tag">{c.tag}</span>
      </div>
      <div className="type-label seg-soft">{c.prompt}</div>
      <div className="type-label seg-muted">{c.status}</div>
    </div>
  );
}

const sink = (tau: number) => {
  const u = prog(tau, EXIT, EXIT + 0.4, inCubic);
  return { y: u * 300, opacity: 1 - prog(tau, EXIT + 0.1, EXIT + 0.4) };
};

/** T5-routines: three Cloud routines land beside the rising sun; the bot sleeps through 05:30. */
export function RoutinesPlate() {
  return (
    <>
      <Live from={T5.leave} to={EXIT + 0.5}>
        <div className="seg-abs" style={{ left: 160, top: 196 }}>
          <RuleRise text={"5. Proc the\n5h window"} settleBy={SETTLE - 0.2} exit={EXIT} />
        </div>
        <Layer track={sink}>
          <Wiped
            at={164.0}
            dur={0.55}
            className="type-body seg-text seg-abs"
            style={{ left: 160, top: 504, width: 780 }}
          >
            {script.lines[0]}
          </Wiped>
          <Wiped
            at={164.2}
            className="type-label seg-muted seg-abs"
            style={{ left: 400, top: 868 }}
          >
            {script.footnotes[0]}
          </Wiped>
        </Layer>
      </Live>
      <Live from={163.0} to={T5.chain.pinsAt + 1.0}>
        {ROUTINES.map((r, i) => (
          <RoutineCard key={r.id} i={i} />
        ))}
      </Live>
    </>
  );
}
