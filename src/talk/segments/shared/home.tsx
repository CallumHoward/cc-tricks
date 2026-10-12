import { useVisibleWindow } from "#/engine/stage/react";
import { ContextBar } from "#/talk/kit/motion";
import { HOME, Pile, PromptBox } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";

/** Where the bot stands at home: on the prompt box's top rule, left of the pile (1920×1080 px). */
export const BOT_HOME = Object.freeze({ left: 1360, top: 380, width: 240, height: 200 });

/** Zones of the context bar in the home shot (system → tools → CLAUDE.md → messages). */
export const HOME_ZONES = [
  { id: "system", size: 18, state: "cached" as const },
  { id: "tools", size: 22, state: "cached" as const },
  { id: "claude-md", size: 10, state: "cached" as const },
  { id: "messages", size: 30, state: "paid" as const },
];

const IDLE: readonly Act[] = [];

/**
 * The home shot at rest: an empty prompt box, the context bar, the token pile and the bot. Every
 * segment boundary shows exactly this frame, so adjacent segments match-cut. Visible only in [from,
 * to).
 */
export function HomeRest({
  pile,
  from,
  to,
  acts = IDLE,
  bot = true,
}: {
  pile: number;
  from: number;
  to: number;
  acts?: readonly Act[];
  bot?: boolean;
}) {
  const ref = useVisibleWindow<HTMLDivElement>(from, to);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}>
      <PromptBox
        className="type-code"
        style={{ position: "absolute", left: HOME.left, top: HOME.promptTop }}
      />
      <ContextBar zones={HOME_ZONES} />
      <Pile count={pile} x={HOME.pileX} y={HOME.pileY} />
      {bot ? (
        <div
          style={{
            position: "absolute",
            left: BOT_HOME.left,
            top: BOT_HOME.top,
            width: BOT_HOME.width,
            height: BOT_HOME.height,
          }}
        >
          <StageMascot acts={acts} title="the bot" />
        </div>
      ) : null}
    </div>
  );
}
