import { outCubic, prog } from "#/engine/motion/ease";
import { sampleKeys } from "#/engine/motion/track";
import { ambientTime } from "#/engine/stage/stage";
import { ExtLink } from "#/talk/kit/ext-link";
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
  ticketCopy,
  ticketOutX,
  ticketRunKeys,
  type TicketCopy,
} from "./tracks";

const SCRIPT = scriptFor("t10-offers");
const HEADLINE = SCRIPT.headline ?? "";
const CARDS = SCRIPT.cards.map(ticketCopy);

/** Show-notes links, in card order: limit resets, API credits, the cloud credit, the promotion. */
const HREFS = [
  "https://support.claude.com/en/articles/17007452-what-is-a-limit-reset",
  "https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans",
  "https://www.reddit.com/r/ClaudeAI/comments/1woiotv/anthropic_offering_100_in_credits_for_cloud/",
  "https://support.claude.com/en/articles/17274727-artifact-usage-promotion",
] as const;

/**
 * Board geometry: two rails of two tickets at 0.94 (mono ≥ 28 px). The right column is wider so
 * each kept row fits one line; the bottom rail ends above the lower corner boxes.
 */
const BOARD = Object.freeze({
  scale: 0.94,
  left: 140,
  gap: 28,
  railTops: [396, 636] as const,
  colW: [643, 1071] as const,
  ticket: { h: 220, stub: 100 },
});
const ROW_H = BOARD.ticket.h * BOARD.scale;
const colW = (col: number) => BOARD.colW[col % 2] ?? 0;
const colX = (col: number) => BOARD.left + (col % 2) * (colW(0) * BOARD.scale + BOARD.gap);
/** The headline sits above the board, left-aligned to it and clear of the top corner box. */
const HEAD = { top: 196, scale: 0.54 };
/** Stamp centres as fractions of their ticket's rendered box, inside its body. */
const STAMP_AT: Readonly<Record<number, { x: number; y: number }>> = {
  1: { x: 0.68, y: 0.79 },
  2: { x: 0.5, y: 0.8 },
};

const PEEK_ACTS: readonly Act[] = [
  { kind: "surprised", at: T10.peekAt + 0.3, dur: 0.3 },
  { kind: "look", at: T10.peekAt + 0.2, dur: Number.POSITIVE_INFINITY, x: -1, y: 0.9 },
];

function TicketBody({ copy, href, closed }: { copy: TicketCopy; href: string; closed: boolean }) {
  return (
    <>
      <ExtLink
        href={href}
        className="type-body"
        style={{
          display: "inline-block",
          color: closed ? "var(--muted)" : "var(--text)",
          lineHeight: 1.1,
        }}
      >
        {copy.headline}
      </ExtLink>
      {copy.rows.map((row, i) => (
        <div
          key={row}
          className="type-label"
          style={{ color: i === 0 ? "var(--soft)" : "var(--muted)", marginTop: i === 0 ? 18 : 6 }}
        >
          {row}
        </div>
      ))}
    </>
  );
}

/** The date punch sits on the artifact ticket's `Ends …` row; its stub glyph moves above it. */
const PUNCH_Y = 0.66;

/** The stub's ✳, always turning on ambient time so the board never reads as frozen. */
function StubGlyph({ closed, top = 0.5, rate }: { closed: boolean; top?: number; rate: number }) {
  return (
    <Layer
      style={{
        position: "absolute",
        left: "50%",
        top: `${top * 100}%`,
        width: 64,
        height: 64,
      }}
      write={(el, frame) =>
        put(
          el,
          "transform",
          `translate(-50%, -50%) rotate(${num(ambientTime(frame) * rate, 2)}deg)`,
        )
      }
    >
      <svg viewBox="0 0 100 100" aria-hidden style={{ display: "block", width: 64, height: 64 }}>
        <path d={GLYPH_PATHS["✳"]} fill={closed ? "var(--muted)" : "var(--clay)"} />
      </svg>
    </Layer>
  );
}

function BoardTicket({ index }: { index: number }) {
  const copy = CARDS[index] as TicketCopy;
  const closed = copy.stamp === "CLOSED";
  const punched = index === 3;
  const run = ticketRunKeys(index);
  return (
    <Layer
      style={{ position: "absolute", left: colX(index), top: 0, transformOrigin: "0 0" }}
      write={(el, frame) => {
        const x = sampleKeys(run, frame.tau) + ticketOutX(index, frame.tau);
        put(el, "transform", `translate3d(${num(x, 2)}px, 0, 0) scale(${BOARD.scale})`);
      }}
    >
      <OfferTicket
        width={colW(index)}
        height={BOARD.ticket.h}
        padding="26px 28px"
        stubWidth={BOARD.ticket.stub}
        punchAt={punched ? T10.punchAt : undefined}
        punchY={PUNCH_Y}
        stub={
          <StubGlyph
            closed={closed}
            top={punched ? 0.3 : undefined}
            rate={closed ? 0 : 50 + 12 * index}
          />
        }
      >
        <TicketBody copy={copy} href={HREFS[index] ?? ""} closed={closed} />
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
          left: 80,
          top: top + ROW_H / 2 - 2,
          width: 1760,
          height: 4,
          borderRadius: 2,
          background: "var(--hairline)",
          transformOrigin: "0 50%",
        }}
        write={(el, frame) => {
          const draw = prog(
            frame.tau,
            T10.railDrawAt + row * 0.1,
            T10.railDrawAt + 0.45 + row * 0.1,
            outCubic,
          );
          const out = T10.exit.ticketsOutAt + 0.2 + row * 0.07;
          const gone = prog(frame.tau, out, out + 0.4, outCubic);
          put(el, "transform", `scaleX(${num(draw * (1 - gone), 4)})`);
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
          <Layer
            key={index}
            style={FILL}
            write={(el, frame) =>
              put(el, "transform", `translate3d(${num(ticketOutX(index, frame.tau), 2)}px, 0, 0)`)
            }
          >
            <Stamp
              text={CARDS[index]?.stamp ?? ""}
              settleBy={index === 1 ? T10.notCcSettle : T10.closedSettle}
              rotate={index === 1 ? -4 : 6}
              seed={index + 2}
              style={{
                left: colX(col) + colW(col) * BOARD.scale * (STAMP_AT[index]?.x ?? 0.6),
                top: ROW_H * (STAMP_AT[index]?.y ?? 0.7),
              }}
            />
          </Layer>
        ))}
      </Layer>
    </>
  );
}

/** Stop 28: the offers board, live and closed together, under "Offers come and go." */
export function OffersBoard() {
  return (
    <div style={FILL}>
      <div
        style={{
          position: "absolute",
          left: 1330,
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
          left: BOARD.left + 60,
          top: HEAD.top,
          transform: `scale(${HEAD.scale})`,
          transformOrigin: "0 0",
        }}
      >
        <RuleRise
          text={HEADLINE.replace(". ", ".\n")}
          settleBy={T10.headSettle}
          exit={T10.exit.ticketsOutAt}
        />
      </div>
    </div>
  );
}
