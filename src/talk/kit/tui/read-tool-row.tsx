import "#/talk/tokens.css";
import "./tui.css";
import type { CSSProperties } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import type { CodeLang } from "#/engine/text/highlight";
import { HighlightedLine } from "#/engine/text/highlighted-line";
import type { Frame } from "#/engine/types";

import { ToolDot } from "./icons";
import { setStyle, useFrameRef } from "./use-frame-ref";

export type ToolOutputLine =
  | string
  | { text: string; kind?: "plain" | "add" | "del"; lang?: CodeLang };

export type ReadToolRowProps = {
  /** `Read`, `Bash`, `Update`, … */
  tool: string;
  arg: string;
  output?: readonly ToolOutputLine[];
  /** `running` blinks the ⏺ on wall time; `done` is the replica's green */
  status?: "done" | "running";
  /** τ the call line appears (omit: already there) */
  at?: number;
  /** τ the first output line appears; later lines follow every `stagger` */
  outputAt?: number;
  stagger?: number;
  className?: string;
  style?: CSSProperties;
};

const LINE_RISE = 0.14;

/** Absolute τ each output line lands at. */
const outputTimes = (count: number, outputAt: number, stagger: number): number[] =>
  Array.from({ length: count }, (_, i) => outputAt + i * stagger);

const lineOf = (line: ToolOutputLine) =>
  typeof line === "string" ? { text: line, kind: "plain" as const } : line;

function rise(el: Element | undefined, tau: number, at: number | undefined) {
  if (at === undefined) return;
  const u = prog(tau, at, at + LINE_RISE, outExpo);
  setStyle(el, "transform", `translate3d(0, ${((1 - u) * 100).toFixed(2)}%, 0)`);
}

/** `⏺ Read(path)` with `⎿` output, as in Claude Code's transcript. */
export function ReadToolRow({
  tool,
  arg,
  output = [],
  status = "done",
  at,
  outputAt,
  stagger = 0.06,
  className,
  style,
}: ReadToolRowProps) {
  const lines = output.map(lineOf);
  const start = outputAt ?? at;
  const times = start === undefined ? [] : outputTimes(lines.length, start, stagger);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const { tau, w } = frame;
    const [head, ...rest] = root.querySelectorAll(".tui-tool-line > span");
    rise(head, tau, at);
    rest.forEach((el, i) => rise(el, tau, times[i]));
    const blink = status === "running" && Math.floor(w / 0.5) % 2 === 1;
    setStyle(root.querySelector(".tui-tool-dot"), "visibility", blink ? "hidden" : "visible");
  });
  return (
    <div ref={ref} className={`tui type-code ${className ?? ""}`} style={style} data-tui-replica>
      <div className="tui-tool-line">
        <span className="tui-line">
          <span
            className="tui-tool-dot"
            style={{ color: status === "done" ? "var(--tui-green)" : "var(--tui-dim)" }}
          >
            <ToolDot />
          </span>
          <span className="tui-cell" />
          <span className="tui-strong">{tool}</span>
          <span className="tui-text">{`(${arg})`}</span>
        </span>
      </div>
      {lines.map((line, i) => (
        // oxlint-disable-next-line react/no-array-index-key -- output lines are positional and may repeat
        <div key={i} className="tui-tool-line">
          <span className="tui-tool-out">
            {i === 0 ? <span className="tui-hook" /> : <span className="tui-tool-indent" />}
            <span
              className={
                line.kind === "add"
                  ? "tui-diff--add"
                  : line.kind === "del"
                    ? "tui-diff--del"
                    : "tui-dim"
              }
            >
              <HighlightedLine line={line.text} lang={line.lang} />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
