import { describe, expect, it } from "vitest";

import { NOTION_SHOWNOTES, shownotesLabel, shownotesUrl } from "./shownotes-url";

describe("shownotes url", () => {
  it("should default to the Notion shownotes", () => {
    expect(shownotesUrl(undefined)).toBe(NOTION_SHOWNOTES);
  });

  it("should use a hosted override when it is an http url", () => {
    expect(shownotesUrl("https://talk.example.com/shownotes")).toBe(
      "https://talk.example.com/shownotes",
    );
  });

  it("should ignore an override that is not a url", () => {
    expect(shownotesUrl("shownotes")).toBe(NOTION_SHOWNOTES);
  });

  it("should label Notion links by title and other links by host and path", () => {
    expect(shownotesLabel(NOTION_SHOWNOTES)).toBe("Notion · 10 tips for saving tokens");
    expect(shownotesLabel("https://talk.example.com/shownotes")).toBe("talk.example.com/shownotes");
  });
});
