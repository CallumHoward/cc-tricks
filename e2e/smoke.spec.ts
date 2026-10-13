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

  test("never navigates when the stage is clicked", async ({ page }) => {
    await page.goto("/");
    const stage = page.locator("[data-stage]");
    await expect(stage).toHaveAttribute("data-target", "0");

    await stage.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(300);

    await expect(stage).toHaveAttribute("data-target", "0");
  });

  test("opens the overview with M and jumps to the stop picked with Enter", async ({ page }) => {
    await page.goto("/");
    const stage = page.locator("[data-stage]");
    await expect(stage).toHaveAttribute("data-target", "0");

    await page.keyboard.press("m");
    const overview = page.getByRole("dialog", { name: "Slide overview" });
    await expect(overview).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(stage).toHaveAttribute("data-target", "7");
    await expect(overview).toBeHidden();
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
