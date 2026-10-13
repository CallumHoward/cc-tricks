import { chromium, type Browser, type Page } from "@playwright/test";

/** A 1080p page for capturing the stage, logging page errors to stderr. */
export async function openStagePage(): Promise<{ browser: Browser; page: Page }> {
  // New headless Chrome gets a real GPU adapter (WebGPU + WebGL); headless-shell renders black.
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => console.error(`[page] ${error.message}`));
  return { browser, page };
}
