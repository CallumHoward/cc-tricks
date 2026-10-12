import { expect, test } from "@playwright/test";

test.describe("theme", () => {
  test("server renders the class from the theme cookie (no JS required)", async ({
    baseURL,
    context,
    page,
  }) => {
    await context.addCookies([{ name: "theme", value: "dark", url: baseURL }]);

    const response = await page.goto("/shownotes");
    const html = (await response?.text()) ?? "";

    // The class must be in the server HTML itself, before hydration, so there
    // is no flash and it works with JS disabled.
    expect(html).toMatch(/<html[^>]*class="[^"]*\bdark\b/);
  });

  test("system mode resolves from the OS preference via CSS", async ({
    baseURL,
    context,
    page,
  }) => {
    await context.addCookies([{ name: "theme", value: "system", url: baseURL }]);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/shownotes");

    await expect(page.locator("html")).toHaveClass(/system/);
    await expect(page.locator("body")).toHaveCSS("color-scheme", "light dark");
  });

  test("toggling updates the document class (JS-enhanced, no reload)", async ({ page }) => {
    await page.goto("/shownotes");

    // Wait for hydration so the click is handled client-side; a pre-hydration
    // click would fall through to a form POST (full navigation) instead.
    await page.waitForFunction(() =>
      Object.keys(document.querySelector('button[name="theme"]') ?? {}).some((key) =>
        key.startsWith("__reactProps$"),
      ),
    );

    // Tag the window; a full-page reload (the no-JS form POST) would wipe this.
    await page.evaluate(() => {
      (globalThis as { __noReload?: boolean }).__noReload = true;
    });

    await page.locator('button[value="dark"]').click();

    await expect(page.locator("html")).toHaveClass(/dark/);
    const survived = await page.evaluate(() => (globalThis as { __noReload?: boolean }).__noReload);
    expect(survived, "client-side switch should not reload the page").toBe(true);
  });
});

test.describe("theme without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the toggle still switches theme via a form POST", async ({ page }) => {
    await page.goto("/shownotes");

    // With JS disabled, clicking submits the form to the server function, which
    // sets the cookie and redirects back — the reloaded page is server-rendered
    // with the new class.
    await page.locator('button[value="dark"]').click();

    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
