import { expect, test } from "@playwright/test";

test.describe("talk stage", () => {
  test("mounts, navigates with the keyboard and keeps the console clean", async ({ page }) => {
    const consoleErrors: Array<string> = [];
    const pageErrors: Array<string> = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");

    // The stage is client-only, so this also waits for hydration.
    const stage = page.locator("[data-stage]");
    await expect(stage).toHaveAttribute("data-target", "0");

    await page.keyboard.press("ArrowRight");

    await expect(stage).toHaveAttribute("data-target", "1");
    await expect(page).toHaveURL(/#\S+$/);

    expect(pageErrors, "uncaught page exceptions").toEqual([]);
    expect(consoleErrors, "browser console errors").toEqual([]);
  });

  test("freezes a still frame from the query and flags readiness", async ({ page }) => {
    await page.goto("/?t=1&w=0");

    await page.waitForFunction(() => window.__stageReady === true);
    await expect(page.locator("[data-stage]")).toHaveAttribute("data-frozen", "true");
  });
});

test.describe("show notes", () => {
  test("renders the talk content", async ({ page }) => {
    await page.goto("/shownotes");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
