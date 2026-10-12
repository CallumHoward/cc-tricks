import "#/talk/tokens.css";
import "./tui.css";
import { useState, type ReactNode } from "react";

import type { Clock } from "#/engine/clock/clock";
import { inOutCubic, outCubic } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { keys } from "#/engine/motion/track";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";
import { Viewport } from "#/engine/stage/viewport";

import { AgentRow } from "./agent-row";
import { CodeBlock } from "./code-block";
import { CompletionLine } from "./completion-line";
import { Counter } from "./counter";
import { Pile } from "./pile";
import { PromptBox } from "./prompt-box";
import { ReadToolRow } from "./read-tool-row";
import { ScrollbackRecap } from "./scrollback-whip";
import { SpinnerLine } from "./spinner-line";
import { pocketKeys } from "./tui-math";
import { Turn } from "./turn";

type Control = { tau: number; v: number; playing: boolean; base: number; t0: number };

function createGallery(tau: number, v: number) {
  const ctl: Control = { tau, v, playing: false, base: 0, t0: 0 };
  const clock: Clock = {
    sample: (t) => {
      if (ctl.playing) ctl.tau = ctl.base + (t - ctl.t0) * ctl.v;
      return { tau: ctl.tau, v: ctl.v };
    },
    dispatch: () => {},
    target: 0,
    subscribe: () => () => {},
    plan: () => [],
  };
  const stage = createStage({ clock });
  stage.start();
  return {
    stage,
    seek(next: number) {
      ctl.tau = next;
      ctl.playing = false;
    },
    flip() {
      ctl.v = -ctl.v;
      ctl.base = ctl.tau;
      ctl.t0 = stage.frame().w;
    },
    togglePlay() {
      ctl.playing = !ctl.playing;
      ctl.base = ctl.tau;
      ctl.t0 = stage.frame().w;
    },
  };
}

const abs = (left: number, top: number) => ({ position: "absolute" as const, left, top });

const SUBAGENTS = [
  { action: "Normalizing voice gains in synth.py", tokens: 171_900, s: 1198 },
  { action: "Reading _measure.js and stills.mjs", tokens: 150_500, s: 801 },
  { action: "Removing clip paths from s3-room-call.js", tokens: 217_600, s: 1102 },
  { action: "Writing S5 bars in s5-format.js", tokens: 162_900, s: 955 },
  { action: "Inspecting s7-plane.js fold shading", tokens: 231_200, s: 1310 },
];

function PartsBoard() {
  return (
    <>
      <SpinnerLine
        className="type-label"
        style={abs(160, 120)}
        verb="Bloviating"
        at={0.2}
        tokens={keys(
          [0.7, 0],
          [1.3, 1200],
          [1.7, 97_300, inOutCubic],
          [2.4, 1_031_400, inOutCubic],
        )}
      />
      <CompletionLine
        className="type-label"
        style={abs(160, 180)}
        pastVerb="Churned"
        duration="1m 30s"
        at={1}
      />
      <AgentRow
        style={{ ...abs(160, 250), width: 1600 }}
        main
        name="main"
        tokens={keys([1.2, 0], [2.5, 97_300, outCubic])}
      />
      {SUBAGENTS.map((a, i) => (
        <AgentRow
          key={a.action}
          style={{ ...abs(160, 300 + i * 44), width: 1600 }}
          name="general-purpose"
          action={a.action}
          actionAt={1.6 + i * 0.08}
          enterAt={1.3 + i * 0.08}
          elapsed={keys([1.3, 0], [3, a.s, outCubic])}
          tokens={keys([1.4 + i * 0.08, 0], [3.2, a.tokens, SPRINGS.COUNT])}
        />
      ))}
      <ReadToolRow
        style={abs(160, 560)}
        tool="Bash"
        arg="rtk gain"
        at={2.2}
        outputAt={2.4}
        output={[
          "Tokens saved: 41.2k (63%)",
          { text: "+ compressed 214 tool results", kind: "add" },
          { text: "- raw output 65.4k", kind: "del" },
        ]}
      />
      <CodeBlock
        style={abs(1000, 560)}
        label="settings.json"
        at={2.6}
        lines={["{", '  "promptSuggestionEnabled": false', "}"]}
        highlight={{ line: 1, at: 3.4 }}
      />
      <div className="type-hero tui tui-text" style={abs(1260, 120)}>
        <Counter value={keys([0.5, 0], [3, 10, inOutCubic])} format="int" minDigits={2} slots={2} />
      </div>
      <Pile count={keys([0.5, 0], [8, 10])} x={1600} y={1000} />
    </>
  );
}

function TurnBoard() {
  return (
    <Turn
      out={{ pastVerb: "Churned", duration: "1m 30s", at: 0.5, whipAt: 1.4 }}
      in={{
        prompt: "2. Keep the cache warm",
        verb: "Simmering",
        typeAt: 2.2,
        cps: 22,
        tokens: keys([3.6, 0], [6, 48_200, outCubic]),
      }}
      pile={pocketKeys(0.9, 1)}
    />
  );
}

const RECAP = [
  ["Churned", "1m 30s"],
  ["Brewed", "3m 30s"],
  ["Cogitated", "1m 30s"],
  ["Crunched", "45s"],
  ["Baked", "1m 15s"],
  ["Worked", "1m 15s"],
  ["Sautéed", "1m 15s"],
  ["Churned", "1m"],
  ["Crunched", "45s"],
  ["Worked", "1m 15s"],
  ["Cogitated", "1m 15s"],
] as const;

function RecapBoard() {
  return (
    <>
      <ScrollbackRecap
        lines={RECAP.map(([pastVerb, duration]) => ({ pastVerb, duration }))}
        at={0.5}
        dur={3}
        y={400}
      />
      <PromptBox
        style={abs(160, 760)}
        ghost="9. Turn off prompt suggestions"
        ghostAt={4}
        acceptAt={5}
        submitAt={5.6}
      />
    </>
  );
}

const BOARDS: Record<string, () => ReactNode> = {
  parts: PartsBoard,
  turn: TurnBoard,
  recap: RecapBoard,
};

function readParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    tau: Number(p.get("t") ?? 2),
    v: Number(p.get("v") ?? 1),
    board: p.get("board") ?? "parts",
  };
}

export default function TuiGallery() {
  const [init] = useState(readParams);
  const [gallery] = useState(() => createGallery(init.tau, init.v));
  const [tau, setTau] = useState(init.tau);
  const [board, setBoard] = useState(init.board);
  const Board = BOARDS[board] ?? PartsBoard;

  return (
    <StageProvider stage={gallery.stage}>
      <Viewport>
        <Board />
      </Viewport>
      <div
        className="type-label"
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 12,
          display: "flex",
          gap: 16,
          zIndex: 10,
        }}
      >
        <select aria-label="board" value={board} onChange={(e) => setBoard(e.target.value)}>
          {Object.keys(BOARDS).map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <input
          aria-label="tau"
          type="range"
          min={0}
          max={8}
          step={0.01}
          value={tau}
          style={{ flex: 1 }}
          onChange={(e) => {
            const next = Number(e.target.value);
            gallery.seek(next);
            setTau(next);
          }}
        />
        <button type="button" onClick={() => gallery.flip()}>
          v±
        </button>
        <button type="button" onClick={() => gallery.togglePlay()}>
          play
        </button>
      </div>
    </StageProvider>
  );
}
