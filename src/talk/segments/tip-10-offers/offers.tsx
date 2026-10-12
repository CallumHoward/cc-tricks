import { outCubic, prog } from "#/engine/motion/ease";
import { sampleKeys } from "#/engine/motion/track";
import { RuleRise, Stamp } from "#/talk/kit/motion";
import { num, put } from "#/talk/kit/motion/dom";
import { GLYPH_PATHS } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { FILL, Layer } from "#/talk/segments/tip-09-suggestions/parts";

import { OfferTicket } from "./offer-ticket";
import {
  peekY,
  railDrift,
  T10,
  tearProgress,
  ticketCopy,
  ticketRunKeys,
  type TicketCopy,
} from "./tracks";

const SCRIPT = scriptFor("t10-offers");
const HEADLINE = SCRIPT.headline ?? "";
const CARDS = SCRIPT.cards.map(ticketCopy);

/** Board geometry: four 760×300 tickets at 0.78 on two rails, clear of the corner boxes. */
const BOARD = Object.freeze({
  scale: 0.78,
  left: 352,
  gap: 30,
  railTops: [400, 660] as const,
  ticket: { w: 760, h: 300, stub: 120 },
});
const COL_W = BOARD.ticket.w * BOARD.scale;
const ROW_H = BOARD.ticket.h * BOARD.scale;
const colX = (col: number) => BOARD.left + col * (COL_W + BOARD.gap);

const PEEK_ACTS: readonly Act[] = [
  { kind: "surprised", at: T10.peekAt + 0.3, dur: 0.3 },
  { kind: "look", at: T10.peekAt + 0.2, dur: Number.POSITIVE_INFINITY, x: -1, y: 0.9 },
];

function TicketBody({ copy, closed }: { copy: TicketCopy; closed: boolean }) {
  return (
    <>
      <div
        className="type-body"
        style={{ color: closed ? "var(--ink-muted)" : "var(--ink)", lineHeight: 1.1 }}
      >
        {copy.headline}
      </div>
      <div
        className="type-label"
        style={{ color: "var(--ink-soft)", marginTop: 16, whiteSpace: "normal" }}
      >
        {copy.line}
      </div>
      {copy.meta ? (
        <div
          className="type-label"
          style={{ color: "var(--ink-muted)", marginTop: 10, whiteSpace: "normal" }}
        >
          {copy.meta}
        </div>
      ) : null}
    </>
  );
}

function StubGlyph({ closed }: { closed: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top: "66%",
        width: 64,
        height: 64,
        transform: "translate(-50%, -50%)",
      }}
    >
      <path d={GLYPH_PATHS["✳"]} fill={closed ? "var(--ink-muted)" : "var(--clay)"} />
    </svg>
  );
}

function BoardTicket({ index }: { index: number }) {
  const copy = CARDS[index] as TicketCopy;
  const closed = copy.stamp === "CLOSED";
  const run = ticketRunKeys(index);
  return (
    <Layer
      style={{ position: "absolute", left: colX(index % 2), top: 0, transformOrigin: "0 0" }}
      write={(el, frame) =>
        put(
          el,
          "transform",
          `translate3d(${num(sampleKeys(run, frame.tau), 2)}px, 0, 0) scale(${BOARD.scale})`,
        )
      }
    >
      <OfferTicket
        width={BOARD.ticket.w}
        height={BOARD.ticket.h}
        stubWidth={BOARD.ticket.stub}
        tear={closed ? tearProgress : undefined}
        punchAt={index === 3 ? T10.punchAt : undefined}
        stub={<StubGlyph closed={closed} />}
      >
        <TicketBody copy={copy} closed={closed} />
      </OfferTicket>
    </Layer>
  );
}

function Rail({ row, rate }: { row: 0 | 1; rate: number }) {
  const top = BOARD.railTops[row];
  const stamps = [0, 1]
    .map((col) => ({ col, index: row * 2 + col }))
    .filter(({ index }) => CARDS[index]?.stamp);
  return (
    <>
      <Layer
        style={{
          position: "absolute",
          left: 160,
          top: top + ROW_H / 2 - 2,
          width: 1600,
          height: 4,
          borderRadius: 2,
          background: "var(--ink-rule)",
          transformOrigin: "0 50%",
        }}
        write={(el, frame) => {
          const u = prog(
            frame.tau,
            T10.railDrawAt + row * 0.1,
            T10.railDrawAt + 0.45 + row * 0.1,
            outCubic,
          );
          put(el, "transform", `scaleX(${num(u, 4)})`);
        }}
      />
      <Layer
        style={{ position: "absolute", left: 0, top, width: 1920, height: ROW_H }}
        write={(el, frame) =>
          put(el, "transform", `translate3d(${num(railDrift(frame.tau, rate), 2)}px, 0, 0)`)
        }
      >
        <BoardTicket index={row * 2} />
        <BoardTicket index={row * 2 + 1} />
        {stamps.map(({ col, index }) => (
          <Stamp
            key={index}
            text={CARDS[index]?.stamp ?? ""}
            settleBy={index === 1 ? T10.notCcSettle : T10.closedSettle}
            rotate={index === 1 ? -9 : 8}
            seed={index + 2}
            style={{ left: colX(col) + COL_W * 0.6, top: ROW_H * 0.74 }}
          />
        ))}
      </Layer>
    </>
  );
}

/** Stop 28: one bone board of offers, live and closed together, under "Offers come and go." */
export function OffersBoard() {
  return (
    <div style={FILL}>
      <div
        style={{
          position: "absolute",
          left: 1250,
          top: 150,
          width: 260,
          height: BOARD.railTops[0] - 150,
          overflow: "hidden",
        }}
      >
        <Layer
          style={{ position: "absolute", left: 10, top: 120, width: 240, height: 200 }}
          write={(el, frame) =>
            put(el, "transform", `translate3d(0, ${num(peekY(frame.tau), 2)}px, 0)`)
          }
        >
          <StageMascot acts={PEEK_ACTS} title="the bot, peeking" />
        </Layer>
      </div>
      <Rail row={0} rate={10} />
      <Rail row={1} rate={7} />
      <div
        style={{
          position: "absolute",
          left: BOARD.left,
          top: 160,
          transform: `scale(${BOARD.scale})`,
          transformOrigin: "0 0",
        }}
      >
        <RuleRise text={HEADLINE.replace(". ", ".\n")} settleBy={T10.headSettle} />
      </div>
    </div>
  );
}
