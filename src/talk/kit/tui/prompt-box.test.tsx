import { cleanup } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";

import { PromptBox, type PromptBoxProps } from "./prompt-box";

const CASES: Record<string, PromptBoxProps> = {
  typed: { text: "1. Use subagents", typeAt: 1, cps: 20 },
  submitted: { text: "/effort", typeAt: 1, cps: 20, submitAt: 1.6 },
  ghost: {
    text: "fix",
    typeAt: 1,
    cps: 20,
    ghost: "fix the flaky test",
    ghostAt: 1.3,
    acceptAt: 1.9,
  },
};

const TAUS = [0.5, 1.05, 1.2, 1.35, 1.65, 1.75, 1.95, 2.4];

describe("PromptBox", () => {
  it.each(Object.entries(CASES))(
    "should write the %s prompt's DOM exactly as pinned across its timeline",
    (_, props) => {
      const frames = TAUS.flatMap((tau) =>
        [1, -1].map((v) => {
          const { container } = renderAt(tau, <PromptBox {...props} />, v);
          const html = container.innerHTML.replace(/<svg.*?<\/svg>/g, "<svg />");
          cleanup();
          return `${tau}@${v} ${html}`;
        }),
      );
      expect(frames).toMatchSnapshot("prompt box DOM per τ");
    },
  );
});
