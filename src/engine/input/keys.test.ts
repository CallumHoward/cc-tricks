import { describe, expect, it } from "vitest";

import { INITIAL_KEY_STATE, isInteractiveTarget, reduceKey, type KeyState } from "./keys";

describe("reduceKey", () => {
  const press = (key: string, state: KeyState = INITIAL_KEY_STATE, mods = {}) =>
    reduceKey(state, { key, ...mods });

  it.each([
    ["ArrowRight", "next"],
    [" ", "next"],
    ["PageDown", "next"],
    ["ArrowLeft", "prev"],
    ["PageUp", "prev"],
    ["Home", "first"],
    ["End", "last"],
  ])("should map %j to the %s nav action", (key, type) => {
    expect(press(key).intent).toEqual({ type: "nav", action: { type } });
  });

  it.each([
    ["b", "blackout"],
    ["B", "blackout"],
    [".", "blackout"],
    ["f", "fullscreen"],
    ["m", "overview"],
    ["O", "overview"],
    ["p", "presenter"],
  ])("should map %j to the %s command", (key, type) => {
    expect(press(key).intent).toEqual({ type });
  });

  it("should go to a 1-based stop number typed before Enter", () => {
    const one = press("1");
    const twelve = press("2", one.state);

    expect(twelve.intent).toBeUndefined();
    expect(press("Enter", twelve.state)).toEqual({
      state: INITIAL_KEY_STATE,
      intent: { type: "nav", action: { type: "goto", index: 11 } },
    });
  });

  it("should ignore Enter without digits or with stop zero", () => {
    expect(press("Enter").intent).toBeUndefined();
    expect(press("Enter", { digits: "0" }).intent).toBeUndefined();
  });

  it("should clear typed digits on any other key", () => {
    expect(press("x", { digits: "4" }).state).toEqual(INITIAL_KEY_STATE);
  });

  it("should leave browser shortcuts alone", () => {
    expect(press("ArrowRight", INITIAL_KEY_STATE, { metaKey: true }).intent).toBeUndefined();
    expect(press("f", INITIAL_KEY_STATE, { ctrlKey: true }).intent).toBeUndefined();
  });

  it("should treat form controls and marked widgets as interactive", () => {
    document.body.innerHTML = `<button>b</button><div data-interactive><span>s</span></div><p>p</p>`;
    const [button, span, p] = ["button", "span", "p"].map((s) => document.querySelector(s));

    expect(isInteractiveTarget(button)).toBe(true);
    expect(isInteractiveTarget(span)).toBe(true);
    expect(isInteractiveTarget(p)).toBe(false);
    expect(isInteractiveTarget(null)).toBe(false);
  });
});
