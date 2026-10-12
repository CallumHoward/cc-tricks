import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { StateMessage } from "./channel";
import { PresenterConsole } from "./console";
import { fakePort } from "./fake-port";

describe("PresenterConsole", () => {
  const STOPS = [
    { id: "a", title: "Opening", notes: "Say hello", target: 25 },
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

  it("should ask the stage for its state when it opens", () => {
    const { port, sent } = fakeConsolePort();

    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);

    expect(sent).toEqual([{ type: "hello" }]);
  });

  it("should show the current stop's notes and the next stop", () => {
    const { port, receive } = fakeConsolePort();
    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);

    receive(state(0));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Opening");
    expect(screen.getByText("Say hello")).toBeVisible();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Caching");
  });

  it("should send navigation to the stage from the buttons", async () => {
    const user = userEvent.setup();
    const { port, sent, receive } = fakeConsolePort();
    render(<PresenterConsole stops={STOPS} budget={1200} port={port} />);
    receive(state(0));

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
});
