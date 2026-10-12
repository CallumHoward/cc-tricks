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

/**
 * Board geometry: two rails of two tickets at 0.84 (mono ≥ 25 px). The right column is wider so
 * every script line fits one row; the bottom rail ends above the lower corner boxes.
 */
const BOARD = Object.freeze({
  scale: 0.84,
  left: 226,
  gap: 28,
  railTops: [380, 635] as const,
  colW: [643, 1071] as const,
  ticket: { h: 280, stub: 100 },
});
const ROW_H = BOARD.ticket.h * BOARD.scale;
const colW = (col: number) => BOARD.colW[col % 2] ?? 0;
const colX = (col: number) => BOARD.left + (col % 2) * (colW(0) * BOARD.scale + BOARD.gap);
/** The headline sits above the board, left-aligned to it and clear of the top corner box. */
const HEAD = { top: 196, scale: 0.62 };
/** Stamp centres as fractions of their ticket's rendered box. */
const STAMP_AT: Readonly<Record<number, { x: number; y: number }>> = {
  1: { x: 0.71, y: 0.9 },
  2: { x: 0.64, y: 0.86 },
};

const PEEK_ACTS: readonly Act[] = [
  { kind: "surprised", at: T10.peekAt + 0.3, dur: 0.3 },
  { kind: "look", at: T10.peekAt + 0.2, dur: Number.POSITIVE_INFINITY, x: -1, y: 0.9 },
];

/** A two-sentence row wraps between its sentences rather than mid-phrase. */
const sentenceBreaks = (text: string) => text.replace(/\. (?=\S)/g, ".\n");

const ROW_COLOR = { line: "var(--ink-soft)", label: "var(--ink-soft)", foot: "var(--ink-muted)" };

function TicketBody({ copy, closed }: { copy: TicketCopy; closed: boolean }) {
  return (
    <>
      <div
        className="type-body"
        style={{ color: closed ? "var(--ink-muted)" : "var(--ink)", lineHeight: 1.1 }}
      >
        {copy.headline}
      </div>
      {copy.rows.map((row, i) => (
        <div
          key={row.text}
          className="type-label"
          style={{
            color: ROW_COLOR[row.tone],
            marginTop: i === 0 ? 16 : 6,
            whiteSpace: "pre-line",
          }}
        >
          {sentenceBreaks(row.text)}
        </div>
      ))}
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
      style={{ position: "absolute", left: colX(index), top: 0, transformOrigin: "0 0" }}
      write={(el, frame) =>
        put(
          el,
          "transform",
          `translate3d(${num(sampleKeys(run, frame.tau), 2)}px, 0, 0) scale(${BOARD.scale})`,
        )
      }
    >
      <OfferTicket
        width={colW(index)}
        height={BOARD.ticket.h}
        padding="26px 28px"
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
            rotate={index === 1 ? -6 : 8}
            seed={index + 2}
            style={{
              left: colX(col) + colW(col) * BOARD.scale * (STAMP_AT[index]?.x ?? 0.6),
              top: ROW_H * (STAMP_AT[index]?.y ?? 0.74),
            }}
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
          top: BOARD.railTops[0] - 250,
          width: 260,
          height: 250,
          overflow: "hidden",
        }}
      >
        <Layer
          style={{ position: "absolute", left: 10, top: 70, width: 240, height: 200 }}
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
          top: HEAD.top,
          transform: `scale(${HEAD.scale})`,
          transformOrigin: "0 0",
        }}
      >
        <RuleRise text={HEADLINE.replace(". ", ".\n")} settleBy={T10.headSettle} />
      </div>
    </div>
  );
}
