import { outCubic, prog } from "#/engine/motion/ease";
import { keys } from "#/engine/motion/track";
import { ContextBar, RuleRise, Stamp } from "#/talk/kit/motion";
import { num, put } from "#/talk/kit/motion/dom";
import { GLYPH_PATHS, HOME, Pile, PromptBox, ReturnGlyph, SpinnerLine } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { BOT_HOME, HOME_ZONES } from "#/talk/segments/shared/home";
import { During, Echo, FILL, Layer } from "#/talk/segments/tip-09-suggestions/parts";
import { ResetButton } from "#/talk/widgets/reset-button";

import "./resets.css";

import { OfferTicket } from "./offer-ticket";
import {
  bankedX,
  diveAt,
  instantX,
  mixRect,
  panelDrift,
  pileCount,
  pileHop,
  resetsEchoScale,
  resetsScrollY,
  splitLead,
  T10,
  type Rect,
} from "./tracks";

const SCRIPT = scriptFor("t10-resets");
const L1 = SCRIPT.lines[0] ?? "";
const [BANKED = "", INSTANT = ""] = SCRIPT.labels;
const STAMP = SCRIPT.stamps[0] ?? "";

const CH = 20.4;
/** The ⏎ that pops after the typed prompt (prompt text origin + text + 0.6 ch margin). */
const RETURN: Rect = {
  x: HOME.left + 40 + 2 * CH + T10.prompt.length * CH + 0.6 * CH,
  y: HOME.promptTop + 40,
  w: CH,
  h: 40,
};
const PANEL: Rect = { x: 200, y: 360, w: 940, h: 520 };
const TICKET = { x: 1190, w: 550, h: 220, stub: 100 };

const BOT_SPOT = { left: 1470, top: 390 - 180 };
/** The pile hops onto the panel's lid, clear of the tickets and the bot (bottom-centre anchor). */
const PILE_SPOT = { x: 1060, y: PANEL.y - 2 };
/** COMMUNITY TERMS lands across the instant ticket's lower edge, under both labels. */
const STAMP_AT = { left: 1395, top: 868 };

const RESETS_BOT_ACTS: readonly Act[] = [
  { kind: "look", at: T10.diveAt, dur: 1, x: -0.8, y: 0.6 },
  { kind: "hop", at: T10.botHopAt, height: 70 },
  { kind: "point", at: T10.pointAt, dur: 4.1, angle: 40, side: "L" },
];

function UsageBar({ label, fill, top }: { label: string; fill: number; top: number }) {
  return (
    <div style={{ position: "absolute", left: 40, top, width: PANEL.w - 80 }}>
      <div className="type-label" style={{ color: "var(--soft)" }}>
        {label}
      </div>
      <div
        style={{
          position: "relative",
          height: 16,
          marginTop: 10,
          borderRadius: 8,
          background: "var(--hairline)",
          overflow: "hidden",
        }}
      >
        <Layer
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            background: "var(--clay)",
            transformOrigin: "0 50%",
          }}
          write={(el, frame) => {
            const u = prog(frame.tau, T10.barsAt, T10.barsAt + 0.8, outCubic);
            put(el, "transform", `scaleX(${num(fill * u, 4)})`);
          }}
        />
      </div>
    </div>
  );
}

/** Settings › Usage, opened out of the ⏎ (a clip morph from the glyph's box to the panel). */
function UsagePanel() {
  return (
    <Layer
      style={{
        position: "absolute",
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: PANEL.h,
        borderRadius: 24,
        background: "var(--panel)",
        boxShadow: "0 30px 80px rgb(0 0 0 / 35%)",
      }}
      write={(el, frame) => {
        const u = diveAt(frame.tau);
        put(el, "visibility", u > 0 ? "visible" : "hidden");
        put(el, "transform", `translate3d(${num(panelDrift(frame.tau), 2)}px, 0, 0)`);
        if (u >= 1) {
          put(el, "clip-path", "none");
          return;
        }
        const r = mixRect(RETURN, PANEL, u);
        const top = r.y - PANEL.y;
        const left = r.x - PANEL.x;
        const right = PANEL.x + PANEL.w - (r.x + r.w);
        const bottom = PANEL.y + PANEL.h - (r.y + r.h);
        put(
          el,
          "clip-path",
          `inset(${num(top, 1)}px ${num(right, 1)}px ${num(bottom, 1)}px ${num(left, 1)}px round ${num(10 + 14 * u, 1)}px)`,
        );
      }}
    >
      <Layer
        style={{ ...FILL, borderRadius: 24, background: "var(--clay)", pointerEvents: "none" }}
        write={(el, frame) => {
          const u = diveAt(frame.tau);
          put(el, "opacity", num(Math.max(0, 1 - u * 1.6), 3));
        }}
      />
      <div style={{ position: "absolute", left: 40, top: 30, overflow: "hidden" }}>
        <Layer
          className="type-label"
          style={{ color: "var(--muted)", letterSpacing: "0.04em" }}
          write={(el, frame) => {
            const u = prog(frame.tau, T10.diveAt + 0.35, T10.diveAt + 0.7, outCubic);
            put(el, "transform", `translate3d(0, ${num((1 - u) * 110, 2)}%, 0)`);
          }}
        >
          {"Settings › Usage"}
        </Layer>
      </div>
      <UsageBar label="Current session" fill={0.62} top={86} />
      <UsageBar label="Current week" fill={0.88} top={164} />
      <RuleRise
        text={L1}
        settleBy={T10.resetsCopySettle}
        className="type-body"
        rule={false}
        style={{ position: "absolute", left: 40, top: 240 }}
      />
      <Layer
        className="t10-reset-row"
        style={{ position: "absolute", left: 40, top: 310, width: PANEL.w - 80 }}
        write={(el, frame) => {
          const u = prog(frame.tau, T10.rowAt, T10.rowAt + T10.rowDur);
          const cells = Math.round(u * 48) / 48;
          put(
            el,
            "clip-path",
            cells >= 1 ? "none" : `inset(-8px ${num((1 - cells) * 100, 2)}% -60px 0)`,
          );
        }}
      >
        <ResetButton />
      </Layer>
    </Layer>
  );
}

/** The clay ⏎ that dives open into the panel. */
function DiveGlyph() {
  return (
    <Layer
      style={{ position: "absolute", left: 0, top: 0, width: RETURN.w, height: RETURN.h * 2 }}
      write={(el, frame) => {
        const u = diveAt(frame.tau);
        const shown = frame.tau >= T10.submitAt && u < 0.7;
        put(el, "visibility", shown ? "visible" : "hidden");
        const r = mixRect(RETURN, PANEL, u);
        const s = 1 + 9 * u;
        put(
          el,
          "transform",
          `translate3d(${num(r.x + r.w / 2 - RETURN.w / 2, 1)}px, ${num(r.y + r.h / 2 - RETURN.h, 1)}px, 0) scale(${num(s, 3)})`,
        );
        put(el, "opacity", num(1 - u / 0.7, 3));
      }}
    >
      <div className="tui type-code" style={{ color: "var(--clay)" }}>
        <ReturnGlyph />
      </div>
    </Layer>
  );
}

function Stub({ live }: { live: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top: "64%",
        width: 54,
        height: 54,
        transform: "translate(-50%, -50%)",
      }}
    >
      <path d={GLYPH_PATHS["✳"]} fill={live ? "var(--clay)" : "var(--muted)"} />
    </svg>
  );
}

function ResetTicket({
  label,
  top,
  x,
}: {
  label: string;
  top: number;
  x: (tau: number) => number;
}) {
  const [lead, rest] = splitLead(label);
  return (
    <Layer
      style={{ position: "absolute", left: TICKET.x - PANEL.x - PANEL.w, top }}
      write={(el, frame) => put(el, "transform", `translate3d(${num(x(frame.tau), 2)}px, 0, 0)`)}
    >
      <OfferTicket width={TICKET.w} height={TICKET.h} stubWidth={TICKET.stub} stub={<Stub live />}>
        <div className="type-body" style={{ color: "var(--text)", lineHeight: 1.1 }}>
          {lead}
        </div>
        <div
          className="type-label"
          style={{ color: "var(--soft)", marginTop: 12, whiteSpace: "normal" }}
        >
          {rest.trim()}
        </div>
      </OfferTicket>
    </Layer>
  );
}

/** Stop 27: `10. Anthropic extra offers` dives through ⏎ into Settings › Usage and two tickets. */
export function ResetsPlate() {
  return (
    <div style={FILL}>
      <During from={T10.start - 1} to={T10.diveAt + T10.diveDur}>
        <ContextBar zones={HOME_ZONES} />
        <PromptBox
          style={{ position: "absolute", left: HOME.left, top: HOME.promptTop }}
          text={T10.prompt}
          typeAt={T10.typeAt}
          cps={T10.cps}
          submitAt={T10.submitAt}
        />
      </During>
      <Layer
        style={FILL}
        write={(el, frame) =>
          put(el, "transform", `translate3d(0, ${num(resetsScrollY(frame.tau), 2)}px, 0)`)
        }
      >
        <Layer
          style={{
            position: "absolute",
            left: 0,
            top: HOME.echoY,
            transformOrigin: `${HOME.textX}px 0`,
          }}
          write={(el, frame) =>
            put(el, "transform", `scale(${num(resetsEchoScale(frame.tau), 4)})`)
          }
        >
          <Echo
            text={T10.prompt}
            at={T10.submitAt + 0.2}
            style={{ top: 0, transform: "translateY(-50%)" }}
          />
        </Layer>
        <SpinnerLine
          className="type-label"
          style={{
            position: "absolute",
            left: HOME.textX,
            top: HOME.spinnerY,
            transform: "translateY(-50%)",
          }}
          verb="Razzle-dazzling"
          at={T10.spinnerAt}
          tokens={keys([T10.spinnerAt, 0], [T10.resetsAt, 2600], [T10.resetsHoldEnd, 2900])}
          elapsed={keys([T10.spinnerAt, 0], [T10.resetsHoldEnd, 40])}
        />
      </Layer>
      <Layer
        style={{ ...FILL, zIndex: 2, pointerEvents: "none" }}
        write={(el, frame) => {
          const u = pileHop(frame.tau);
          const dx = (PILE_SPOT.x - HOME.pileX) * u;
          const dy = (PILE_SPOT.y - HOME.pileY) * u - 70 * Math.sin(Math.PI * u);
          put(el, "transform", `translate3d(${num(dx, 2)}px, ${num(dy, 2)}px, 0)`);
        }}
      >
        <Pile count={pileCount} x={HOME.pileX} y={HOME.pileY} />
      </Layer>
      <div
        style={{
          position: "absolute",
          left: PANEL.x + PANEL.w,
          top: PANEL.y,
          width: 1920 - PANEL.x - PANEL.w,
          height: PANEL.h + 20,
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <ResetTicket label={BANKED} top={30} x={bankedX} />
        <ResetTicket label={INSTANT} top={280} x={instantX} />
      </div>
      <UsagePanel />
      <DiveGlyph />
      <Stamp
        text={STAMP}
        settleBy={T10.stampSettle}
        rotate={-8}
        style={{ ...STAMP_AT, zIndex: 2 }}
      />
      <Layer
        style={{
          position: "absolute",
          left: BOT_HOME.left,
          top: BOT_HOME.top,
          width: BOT_HOME.width,
          height: BOT_HOME.height,
          zIndex: 2,
        }}
        write={(el, frame) => {
          const u = prog(frame.tau, T10.botHopAt + 0.16, T10.botHopAt + 0.58);
          const dx = (BOT_SPOT.left - BOT_HOME.left) * u;
          const dy = (BOT_SPOT.top - BOT_HOME.top) * u - 90 * Math.sin(Math.PI * u);
          put(el, "transform", `translate3d(${num(dx, 2)}px, ${num(dy, 2)}px, 0)`);
        }}
      >
        <StageMascot acts={RESETS_BOT_ACTS} title="the bot" />
      </Layer>
    </div>
  );
}
