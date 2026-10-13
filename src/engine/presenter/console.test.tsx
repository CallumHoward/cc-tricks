import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { StateMessage } from "./channel";
import { PresenterConsole } from "./console";
import { fakePort } from "./fake-port";

describe("PresenterConsole", () => {
  const STOPS = [
    {
      id: "a",
      title: "Opening",
      notes: "Say hello\n- [Docs](https://example.com/docs)",
      target: 25,
    },
    { id: "b", title: "Caching" },
  ];

  function fakeConsolePort() {
    const { port, sent, receive } = fakePort();
    return { port, sent, receive: (data: StateMessage) => act(() => receive(data)) };
  }

  const state = (target: number): StateMessage => ({
    type: "state",
    target,
    stopId: STOPS[target]?.id ?? "",
    tau: 0,
    v: 0,
    startedAt: null,
    stopIds: STOPS.map((s) => s.id),
  });

  /** Renders the console after the stage reports its first stop. */
  function renderOnFirstStop() {
    const user = userEvent.setup();
    const { port, sent, receive } = fakeConsolePort();
    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);
    receive(state(0));
    return { user, sent };
  }

  it("should ask the stage for its state when it opens", () => {
    const { port, sent } = fakeConsolePort();

    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);

    expect(sent).toEqual([{ type: "hello" }]);
  });

  it("should show the current stop's notes as formatted markdown and the next stop", () => {
    const { port, receive } = fakeConsolePort();
    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);

    receive(state(0));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Opening");
    expect(screen.getByText("Say hello")).toBeVisible();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "https://example.com/docs",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Caching");
  });

  it("should flag a stop with something interactive to demo, with a hint", () => {
    const { port, receive } = fakeConsolePort();
    const stops = [{ ...STOPS[0], interactive: "drag the pins" }, STOPS[1]];
    render(<PresenterConsole stops={stops} budget={1200} port={port} />);

    receive(state(0));

    expect(screen.getByTitle("Interactive: drag the pins")).toBeVisible();
  });

  it("should not flag a stop without anything interactive", () => {
    renderOnFirstStop();

    expect(screen.queryByTitle(/^Interactive/)).not.toBeInTheDocument();
  });

  it("should send navigation to the stage from the buttons", async () => {
    const { user, sent } = renderOnFirstStop();

    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(sent.slice(1)).toEqual([
      { type: "nav", action: { type: "next" } },
      { type: "nav", action: { type: "prev" } },
    ]);
  });

  it("should show the current stop's speaking target beside the stop timer", () => {
    const { port, receive } = fakeConsolePort();
    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);

    receive(state(0));

    expect(screen.getByText(/^stop .* \/ 0:25$/)).toBeVisible();
  });

  it("should forward the talk's keys to the stage", async () => {
    const user = userEvent.setup();
    const { port, sent } = fakeConsolePort();
    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);

    await user.keyboard("{ArrowRight}m4{Enter}");

    expect(sent.slice(1)).toEqual([
      { type: "key", key: "ArrowRight" },
      { type: "key", key: "m" },
      { type: "key", key: "4" },
      { type: "key", key: "Enter" },
    ]);
  });

  it("should not forward modified keys, keys the talk ignores or typing in a text field", async () => {
    const user = userEvent.setup();
    const { port, sent } = fakeConsolePort();
    render(
      <>
        <input aria-label="Search" />
        <PresenterConsole stops={STOPS} budget={1200} port={port} />
      </>,
    );

    await user.keyboard("{Meta>}m{/Meta}{Control>}{ArrowRight}{/Control}xp");
    await user.type(screen.getByRole("textbox"), "m {ArrowRight}");

    expect(sent.slice(1)).toEqual([]);
  });

  it("should leave Enter and Space to a focused console button", async () => {
    const { user, sent } = renderOnFirstStop();

    await user.click(screen.getByRole("button", { name: /reset timer/i }));
    await user.keyboard("{Enter} {ArrowRight}");

    expect(sent.slice(1)).toEqual([
      { type: "reset-timer" },
      { type: "reset-timer" },
      { type: "reset-timer" },
      { type: "key", key: "ArrowRight" },
    ]);
  });
});
