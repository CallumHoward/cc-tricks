import { useRef } from "react";

import { inOutCubic, inQuad, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { ContextBar, World, shotTrack } from "#/talk/kit/motion";
import { num, put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { HOME, PromptBox } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";
import { Mover, Rig, Rise, Typed, Win } from "#/talk/segments/title/lib";

import {
  COMPOSER,
  F,
  FLOOR_Y,
  FW_SHOTS,
  HOPS,
  MENU,
  PROMPT_UP,
  botAt,
  cloneX,
  composerDy,
  composerRect,
  crowdCells,
  crowdDrift,
  highlightOffset,
  rectClip,
  shadowAt,
} from "./tracks";

const chat = scriptFor("fw-chatbox");
const taste = scriptFor("fw-taste");
const invest = scriptFor("fw-invest");
const [placeholder = "", model = "", effort = ""] = chat.ui;

const camera = shotTrack(FW_SHOTS);
const CELLS = crowdCells();

const BOT_ACTS: readonly Act[] = [
  { kind: "hop", at: HOPS[0], height: 80 },
  { kind: "look", at: 27.4, dur: 3.2, x: 0.9, y: 0.1 },
  { kind: "hop", at: HOPS[1], height: 120 },
  { kind: "look", at: 35.3, dur: 1.4, x: 0.5, y: 0.9 },
  { kind: "look", at: 36.9, dur: 3.4, x: 0, y: 0 },
  { kind: "hop", at: HOPS[2], height: 120 },
  { kind: "hop", at: HOPS[3], height: 90 },
  { kind: "carry", at: 42.7, dur: 3.2 },
  { kind: "hop", at: HOPS[4], height: 120 },
];

const W = BOT_HOME.width;
const H = BOT_HOME.height;

function botPlace(tau: number) {
  const b = botAt(tau);
  return { x: b.cx - (W / 2) * b.s, y: b.feet - H * 0.9 * b.s, s: b.s };
}

function shadowPlace(tau: number) {
  const b = botAt(tau);
  const { len, skew } = shadowAt(tau);
  const f = len;
  const k = Math.tan((skew * Math.PI) / 180);
  return {
    x: b.cx - (W / 2) * b.s + k * b.s * f * 0.9 * H,
    y: b.feet + b.s * f * 0.9 * H,
    s: b.s,
    sy: -f,
    skew,
    o: 0.55,
    hidden: f <= 0.01,
  };
}

/** Our composer: morphs out of the context bar, later flattens into the prompt box. */
function Composer() {
  const border = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const zones = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const { tau } = frame;
    const r = composerRect(tau);
    const flat = prog(tau, F.toPrompt.start, F.toPrompt.end);
    put(border.current, "clip-path", rectClip(r, 3));
    put(fill.current, "clip-path", rectClip(r));
    put(zones.current, "clip-path", rectClip(r));
    put(content.current, "clip-path", rectClip(r));
    put(zones.current, "opacity", num(1 - prog(tau, F.morph.start + 0.1, F.morph.start + 0.7), 3));
    const lit = prog(tau, 32.4, 33.2);
    put(border.current, "background", lit > 0.5 ? "var(--clay-hi)" : "var(--muted)");
    put(border.current, "opacity", num(1 - flat, 3));
    put(fill.current, "opacity", num(1 - flat, 3));
    const blink = Math.floor(frame.w / 0.53) % 2 === 0 && tau >= F.placeholderAt;
    put(caret.current, "visibility", blink ? "inherit" : "hidden");
  });
  return (
    <Win from={F.handover} to={F.toPrompt.end + 0.05}>
      <div ref={border} className="fw-composer fw-composer-border" />
      <div ref={fill} className="fw-composer fw-composer-fill" />
      <div
        ref={zones}
        className="fw-composer"
        style={{
          background: "linear-gradient(90deg, var(--clay-wash-55) 0 62.5%, var(--clay) 62.5%)",
        }}
      />
      <div ref={content} className="so-fill">
        <Mover
          place={(tau: number) => ({
            y: COMPOSER.y + composerDy(tau),
            x: COMPOSER.x,
            o: 1 - prog(tau, F.toPrompt.start, F.toPrompt.start + 0.25),
          })}
          style={{ width: COMPOSER.w, height: COMPOSER.h, overflow: "hidden" }}
        >
          <div ref={caret} className="fw-caret" style={{ left: 40, top: 34, height: 52 }} />
          <Typed
            text={placeholder}
            at={F.placeholderAt}
            cps={32}
            className="fw-placeholder type-body"
            style={{ left: 54, top: 30 }}
          />
          <Mover
            place={(tau: number) => ({
              x: -380 * (1 - outExpo(prog(tau, F.chipsAt, F.chipsAt + 0.7))),
              y: 104,
              hidden: tau < F.chipsAt,
            })}
          >
            <span className="fw-chip type-label" style={{ left: 600, whiteSpace: "nowrap" }}>
              {model}
            </span>
            <span className="fw-chip type-label" style={{ left: 840, whiteSpace: "nowrap" }}>
              {effort}
            </span>
          </Mover>
          <Mover
            place={(tau: number) => {
              const s = springFrom(tau, F.chipsAt + 0.3, SPRINGS.SNAP);
              return { x: 1000 + 32 * (1 - s), y: 96 + 32 * (1 - s), s, hidden: s <= 0 };
            }}
          >
            <div className="fw-send">
              <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
                <path
                  d="M15 25V6M6 14l9-9 9 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Mover>
        </Mover>
      </div>
    </Win>
  );
}

/** A stand-in composer (the clone and every member of the crowd share this look). */
function Cell({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="fw-crowd-cell"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)`, visibility: "inherit" }}
    >
      <div className="fw-crowd-fill" />
      <div className="fw-crowd-line" />
      <div className="fw-crowd-chip" />
      <div className="fw-crowd-caret" />
    </div>
  );
}

function Crowd() {
  const root = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const fills = useRef<(HTMLDivElement | null)[]>([]);
  useFrame((frame: Frame) => {
    const { tau } = frame;
    const drift = crowdDrift(tau);
    put(root.current, "transform", `translate3d(${num(drift, 2)}px, ${num(drift * 0.6, 2)}px, 0)`);
    const blink = Math.floor(frame.w / 0.53) % 2 === 0 ? "a" : "b";
    if (root.current && root.current.dataset.blink !== blink) root.current.dataset.blink = blink;
    CELLS.forEach((c, i) => {
      const el = cells.current[i];
      const s = springFrom(tau, c.popAt, SPRINGS.SNAP);
      put(el, "visibility", s > 0 ? "inherit" : "hidden");
      if (s <= 0) return;
      put(el, "transform", `translate3d(${c.x}px, ${c.y}px, 0) scale(${num(s, 4)})`);
      put(fills.current[i], "opacity", num(1 - prog(tau, c.dimAt, c.dimAt + 0.5), 3));
    });
  });
  return (
    <Win from={30.6} to={F.toPrompt.end}>
      <div ref={root} className="so-fill" data-blink="a">
        {CELLS.map((c, i) => (
          <div
            key={c.id}
            className="fw-crowd-cell"
            ref={(el) => {
              cells.current[i] = el;
            }}
          >
            <div
              className="fw-crowd-fill"
              ref={(el) => {
                fills.current[i] = el;
              }}
            />
            <div className="fw-crowd-line" />
            <div className="fw-crowd-chip" />
            <div className="fw-crowd-caret" />
          </div>
        ))}
      </div>
    </Win>
  );
}

const MENU_ROWS = invest.ui;

function Menu() {
  const rows = useRef<(HTMLSpanElement | null)[]>([]);
  useFrame((frame: Frame) => {
    const { tau } = frame;
    rows.current.forEach((el, i) => {
      const land = springFrom(tau, F.menuAt + 0.05 * i, SPRINGS.LAND);
      const lift = inQuad(
        prog(
          tau,
          F.exit + 0.02 * (MENU_ROWS.length - i),
          F.exit + 0.3 + 0.02 * (MENU_ROWS.length - i),
        ),
      );
      put(el, "transform", `translate3d(0, ${num((-1 + land - lift) * 110, 2)}%, 0)`);
    });
  });
  return (
    <>
      <Mover
        place={(tau: number) => ({
          x: MENU.x,
          y: MENU.y + highlightOffset(tau),
          sx: outExpo(prog(tau, 42.2, 42.5)),
          hidden: tau < 42.2 || tau > F.exit + 0.25,
        })}
        className="fw-highlight"
        style={{ width: MENU.w }}
      />
      {MENU_ROWS.map((label, i) => (
        <div
          key={label}
          className="fw-menu-row type-label"
          style={{ left: MENU.x, top: MENU.y + i * MENU.row, width: MENU.w }}
        >
          <span
            ref={(el) => {
              rows.current[i] = el;
            }}
          >
            <i>{String(i + 1).padStart(2, "0")}</i>
            {label}
          </span>
        </div>
      ))}
    </>
  );
}

function TasteLines() {
  const [a1 = "", a2 = ""] = taste.lines;
  const [before = a2, after = ""] = a2.split("being");
  const cps = 130;
  const t2 = F.a2At;
  const t2b = t2 + before.length / cps;
  const t2c = t2b + 5 / cps;
  return (
    <Win from={F.a1At - 0.1} to={F.toPrompt.start + 0.3}>
      <Mover
        place={(tau: number) => ({
          y: -60 * inQuad(prog(tau, F.tasteHoldEnd, F.tasteHoldEnd + 0.35)),
          clip: `inset(-40px -40px ${num(100 * inQuad(prog(tau, F.tasteHoldEnd, F.tasteHoldEnd + 0.35)), 2)}% -40px)`,
        })}
        style={{ left: 200, top: 700, width: 1500 }}
      >
        <p className="type-body" style={{ margin: 0, color: "var(--text)" }}>
          <Typed text={a1} at={F.a1At} cps={cps} />
        </p>
        <p className="type-body" style={{ margin: "18px 0 0", color: "var(--text)" }}>
          <Typed text={before} at={t2} cps={cps} />
          <em>
            <Typed text="being" at={t2b} cps={cps} />
          </em>
          <Typed text={after} at={t2c} cps={cps} />
        </p>
      </Mover>
    </Win>
  );
}

function ForewordWorld() {
  return (
    <World camera={camera}>
      <Crowd />
      <Win from={F.cloneAt} to={30.9}>
        <Mover place={(tau: number) => ({ x: cloneX(tau), y: COMPOSER.y })}>
          <Cell x={0} y={0} />
        </Mover>
      </Win>
      <Win from={F.floor.start} to={F.toPrompt.start + 0.4}>
        <Mover
          place={(tau: number) => {
            const show = inOutCubic(prog(tau, F.floor.start, F.floor.end));
            const hide = inQuad(prog(tau, F.toPrompt.start, F.toPrompt.start + 0.4));
            return {
              clip: `inset(${num((1 - show + hide) * 100, 2)}% 0 0 0)`,
              x: -9000,
              y: FLOOR_Y,
            };
          }}
          className="fw-floor"
          style={{ width: 20000, height: 3000 }}
        />
        <Mover
          place={(tau: number) => ({
            x: 300,
            y:
              FLOOR_Y +
              260 -
              520 * inOutCubic(prog(tau, 34.6, 36.9)) -
              40 * prog(tau, F.tasteAt, F.tasteHoldEnd),
            o: prog(tau, 34.6, 35.2) * (1 - prog(tau, F.tasteHoldEnd, F.tasteHoldEnd + 0.3)),
          })}
          className="fw-light"
        />
        <Mover place={shadowPlace} style={{ width: W, height: H }}>
          <Rig acts={BOT_ACTS} silhouette />
        </Mover>
      </Win>
      <Composer />
      <Win from={F.handover} to={30.9}>
        <Rise
          text={"Everyone has the\nsame chat box."}
          settleBy={F.headSettle}
          exit={F.chatHoldEnd}
          style={{ position: "absolute", left: COMPOSER.x, top: 212 }}
        />
        <Mover
          place={(tau: number) => ({
            x: COMPOSER.x,
            y: 726,
            clip: `inset(-20px ${num(100 * inQuad(prog(tau, F.chatHoldEnd, F.chatHoldEnd + 0.35)), 2)}% -20px -20px)`,
          })}
        >
          <Typed
            text={chat.lines[0] ?? ""}
            at={F.lineAt}
            cps={50}
            className="type-body text-soft"
          />
        </Mover>
      </Win>
      <Win from={F.toPrompt.end - 0.1} to={F.end}>
        <Mover
          place={(tau: number) => ({
            x: PROMPT_UP.x,
            y:
              PROMPT_UP.y +
              (HOME.promptTop - PROMPT_UP.y) * inOutCubic(prog(tau, F.exit + 0.3, F.exit + 0.9)),
          })}
        >
          <PromptBox
            text="/tips"
            typeAt={F.tipsAt}
            cps={12.5}
            submitAt={F.exit + 0.05}
            className="type-code"
          />
        </Mover>
        <Menu />
        <Rise
          text={"Invest in the\ntools of the trade."}
          settleBy={F.investSettle}
          exit={F.exit}
          style={{ position: "absolute", left: 200, top: 372 }}
        />
        <Rise
          text={"Pause to learn something that\nmakes the next task faster."}
          className="type-body text-soft"
          settleBy={F.investSettle}
          stagger={0.03}
          exit={F.exit}
          style={{ position: "absolute", left: 200, top: 672 }}
        />
        <Rise
          text={invest.lines[1] ?? ""}
          className="type-body text-clay"
          settleBy={F.investSettle}
          exit={F.exit}
          style={{ position: "absolute", left: 200, top: 806 }}
        />
        <Mover
          place={(tau: number) => ({
            clip: `inset(-30px ${num(100 * (1 - inOutCubic(prog(tau, F.exit + 0.5, F.exit + 1.0))), 2)}% -60px 0)`,
          })}
          style={{ width: 1920, height: 1080 }}
        >
          <ContextBar zones={HOME_ZONES} />
        </Mover>
      </Win>
      <Mover place={botPlace} style={{ width: W, height: H }}>
        <Rig acts={BOT_ACTS} />
      </Mover>
    </World>
  );
}

/** Foreword: bar → composer, the crowd of identical composers, taste and care, invest. */
export default function ForewordSegment() {
  return (
    <>
      <HomeRest pile={0} from={F.start} to={F.handover} />
      <Win from={F.handover} to={F.homeAt}>
        <Win from={F.handover} to={F.morph.start + 0.4}>
          <Mover
            place={(tau: number) => {
              const u = 50 * inOutCubic(prog(tau, F.handover, F.handover + 0.35));
              return { clip: `inset(-20px ${num(u, 2)}% -20px ${num(u, 2)}%)` };
            }}
            style={{ left: HOME.left, top: HOME.promptTop }}
          >
            <PromptBox className="type-code" />
          </Mover>
        </Win>
        <ForewordWorld />
        <TasteLines />
      </Win>
      <HomeRest pile={0} from={F.homeAt} to={F.end} />
    </>
  );
}
