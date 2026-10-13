import { useRef, useState } from "react";

import { inOutCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame, useTrack } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { chainLabel, chainWindows, hhmm, ROUTINES } from "#/talk/data/routines";
import { DayRuler, movePin } from "#/talk/kit/data/day-ruler";
import { put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { scriptFor } from "#/talk/script";
import { Live, Typed, Wiped } from "#/talk/segments/tip-03-effort/bracket";
import { WidgetShell } from "#/talk/widgets/widget-shell";

import { SHOT } from "./routines-plate";
import { HORIZON, minuteToX, RULER_BOX, T5 } from "./timing";

const script = scriptFor("t5-chain");
const SETTLE = T5.chain.at - 0.8;
const FIRST_MESSAGE = 9 * 60;
const C = T5.chain;
/** The reset schedule, top left where the tip title stood. */
const LIST = Object.freeze({ x: 200, y: 214, row: 58 });

/** Pin `i` shows once its card has folded into it (the pin's drop start). */
const pinShown = (i: number, tau: number): boolean => tau >= C.pinsAt + i * C.pinStagger - 0.02;

function HaikuTile({ i }: { i: number }) {
  const m = ROUTINES[i]?.at ?? 330;
  const ref = useTrack((tau: number) => ({
    scale: springFrom(tau, C.pinsAt + i * C.pinStagger + 0.18, SPRINGS.SNAP),
  }));
  return (
    <div
      ref={ref}
      className="type-label t5-haiku seg-abs"
      style={{ left: minuteToX(m) + 26, top: HORIZON - 132, transformOrigin: "0 100%" }}
    >
      Haiku
    </div>
  );
}

/** The ruler stops short of the Routines window, then wipes out to full width as the window leaves. */
const rulerReveal = (tau: number) => {
  const u = prog(tau, T5.routines.holdEnd, T5.routines.holdEnd + 0.7, inOutCubic);
  return { clipRight: (1 - u) * ((1920 - SHOT.x) / 1920) * 100 };
};

/** W4 (local copy of PingChain so the film can time the ruler, pins and bands). */
function Chain() {
  const [pins, setPins] = useState<number[]>(() => ROUTINES.map((r) => r.at));
  const [on, setOn] = useState(true);
  const shown = on ? pins : [FIRST_MESSAGE];
  const windows = chainWindows(shown);
  const ruler = useRef<HTMLDivElement>(null);
  const reveal = useTrack(rulerReveal);
  useFrame((frame: Frame) => {
    for (let i = 0; i < 3; i++) {
      put(ruler.current, `--p${i + 1}`, pinShown(i, frame.tau) ? "visible" : "hidden");
    }
  });
  return (
    <WidgetShell label="Ping chain" className="seg-fill">
      <div ref={reveal} className="seg-abs" style={{ inset: 0 }}>
        <div
          ref={ruler}
          className="t5-ruler seg-abs"
          style={{ left: RULER_BOX.x, top: RULER_BOX.y }}
        >
          <DayRuler
            start={T5.rulerStart}
            pins={shown}
            pinsAt={C.pinsAt}
            pinStagger={C.pinStagger}
            bandsAt={C.bandsAt}
            bandDur={C.bandDur}
            bandLabels={false}
            width={RULER_BOX.w}
            onPinChange={on ? movePin(setPins) : undefined}
          />
        </div>
      </div>
      <Live from={C.bandsAt} to={T5.winEnd}>
        <Typed
          text={script.ui[3] ?? "AEDT"}
          at={C.bandsAt + 1.0}
          className="type-label seg-muted seg-abs"
          style={{ left: LIST.x, top: LIST.y }}
        />
        {windows.map((w, i) =>
          on && i < 3 ? (
            <Typed
              key={w.ping}
              text={chainLabel(w)}
              at={C.bandsAt + 0.7 + i * 0.2}
              cps={50}
              className="type-code seg-text seg-abs"
              style={{ left: LIST.x, top: LIST.y + 56 + i * LIST.row }}
            />
          ) : (
            <div
              key={w.ping}
              className="type-code seg-text seg-abs"
              style={{ left: LIST.x, top: LIST.y + 56 + i * LIST.row }}
            >
              {`${hhmm(w.ping)} message → resets ${hhmm(w.end)}`}
            </div>
          ),
        )}
        <Wiped at={SETTLE - 0.9} className="seg-abs" style={{ left: 420, top: 876 }}>
          <div className="wg-row">
            <button
              type="button"
              className="wg-chip type-label"
              aria-pressed={on}
              onClick={() => setOn((v) => !v)}
            >
              {on ? "Routines on" : "Routines off"}
            </button>
            <span className="type-label seg-muted">
              {on
                ? "Drag a pin"
                : `No pings: your first message at ${hhmm(FIRST_MESSAGE)} starts the clock`}
            </span>
          </div>
        </Wiped>
      </Live>
    </WidgetShell>
  );
}

/**
 * T5-chain: the glowing routines become pins, the sun greets Haiku at each, the 5h windows tile the
 * day.
 */
export function ChainPlate() {
  return (
    <Live from={T5.rulerStart} to={T5.winEnd}>
      <Chain />
      {ROUTINES.map((r, i) => (
        <Live key={r.id} from={C.pinsAt + i * C.pinStagger} to={T5.winEnd}>
          <HaikuTile i={i} />
        </Live>
      ))}
    </Live>
  );
}
