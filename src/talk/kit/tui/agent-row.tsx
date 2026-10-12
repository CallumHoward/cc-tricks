import "#/talk/tokens.css";
import "./tui.css";
import type { CSSProperties } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";

import { Counter } from "./counter";
import { Bullet } from "./icons";
import {
  charLength,
  formatElapsed,
  resolveCount,
  sliceChars,
  typedChars,
  type CountSource,
} from "./tui-math";
import { setStyle, setText, useFrameRef } from "./use-frame-ref";

export type AgentRowProps = {
  /** `main` gets a filled ● and bold ivory; subagents a hollow ○ */
  main?: boolean;
  name: string;
  action?: string;
  /** τ the action starts typing */
  actionAt?: number;
  cps?: number;
  /** Elapsed seconds over τ (omit to hide) */
  elapsed?: CountSource;
  tokens?: CountSource;
  /** τ the row rolls up into place like a slot reel (omit for a row that is already there) */
  enterAt?: number;
  className?: string;
  style?: CSSProperties;
};

const ROW_ENTER = 0.42;

/** `○ general-purpose Reading files… 19m 58s · ↓ 171.9k tokens` */
export function AgentRow({
  main = false,
  name,
  action = "",
  actionAt,
  cps = 60,
  elapsed,
  tokens,
  enterAt,
  className,
  style,
}: AgentRowProps) {
  const elapsedAt = elapsed === undefined ? undefined : resolveCount(elapsed);
  const len = charLength(action);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const { tau } = frame;
    const inner = root.firstElementChild as HTMLElement | null;
    if (enterAt !== undefined) {
      const u = prog(tau, enterAt, enterAt + ROW_ENTER, outExpo);
      setStyle(inner, "transform", `translate3d(0, ${((1 - u) * 110).toFixed(2)}%, 0)`);
      setStyle(inner, "filter", u > 0 && u < 0.85 ? `blur(${((1 - u) * 3).toFixed(2)}px)` : "none");
    }
    const n = actionAt === undefined ? len : typedChars(tau, actionAt, cps, len);
    setText(root.querySelector(".tui-agent-action"), sliceChars(action, n));
    if (elapsedAt) setText(root.querySelector(".tui-elapsed"), formatElapsed(elapsedAt(tau)));
  });
  return (
    <div
      ref={ref}
      className={`tui type-label tui-agent ${className ?? ""}`}
      style={style}
      data-tui-replica
    >
      <div className="tui-agent-inner">
        <span className={main ? "tui-text" : "tui-dim"}>
          <Bullet filled={main} />
        </span>
        <span className="tui-cell" />
        <span className={`tui-agent-name ${main ? "tui-strong" : "tui-dim"}`}>{name}</span>
        <span className="tui-agent-action tui-dim" />
        {tokens === undefined ? null : (
          <span className="tui-agent-stats tui-dim">
            {elapsedAt ? (
              <>
                <span className="tui-elapsed" />
                {" · "}
              </>
            ) : null}
            {"↓ "}
            <Counter value={tokens} />
            {" tokens"}
          </span>
        )}
      </div>
    </div>
  );
}
