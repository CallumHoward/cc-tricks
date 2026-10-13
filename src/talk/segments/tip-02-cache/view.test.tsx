import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderAt as renderStageAt } from "#/engine/stage/render-at";
import { LINKS, scriptFor } from "#/talk/script";

import { AGENT_TTL, IDLE, KV, PRICE, STATELESS, SWITCH, TTL } from "./timing";
import Tip02CacheSegment from "./view";

vi.mock("#/engine/gl/three-layer", () => ({ useThreeLayer: () => {} }));
vi.mock("#/talk/mascot/stage-mascot", () => ({ StageMascot: () => null }));

const renderAt = (tau: number) => renderStageAt(tau, <Tip02CacheSegment />);
const STOPS = [STATELESS, KV, PRICE, TTL, AGENT_TTL, IDLE, SWITCH];

describe("tip 2 segment", () => {
  it("should show the real pricing screenshot at the price stop", () => {
    renderAt(PRICE.at);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/talk/refs/pricing.webp");
  });

  it("should link the pricing window to the pricing page", () => {
    renderAt(PRICE.at);
    expect(screen.getByRole("link")).toHaveAttribute("href", LINKS.pricing);
  });

  it("should link the settings read to the settings reference at the ttl stop", () => {
    renderAt(TTL.at);
    expect(screen.getByRole("link")).toHaveAttribute("href", LINKS.settings);
  });

  it("should highlight the settings key as JSON at the ttl stop", () => {
    renderAt(TTL.at);
    expect(screen.getByText('"subagentPromptCacheTtl"')).toHaveClass("hl-key");
  });

  it("should show the agent frontmatter with its cacheTtl key at the agent ttl stop", () => {
    renderAt(AGENT_TTL.at);
    expect(screen.getByText(".claude/agents/repo-auditor.md")).toBeVisible();
    expect(screen.getByText("cacheTtl")).toHaveClass("hl-key");
  });

  it("should link cachebeat to its repo at the idle stop", () => {
    renderAt(IDLE.at);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://github.com/ARahim3/cachebeat",
    );
  });

  it("should leave every prose line and footnote to the speaker at each stop", () => {
    for (const stop of STOPS) {
      const { unmount } = renderAt(stop.at);
      const { lines, footnotes } = scriptFor(stop.id);
      for (const prose of [...lines, ...footnotes]) expect(screen.queryByText(prose)).toBeNull();
      unmount();
    }
  });
});
