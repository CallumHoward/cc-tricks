// Contact sheets of the live stage: `pnpm stills --taus 0,1.5,12 | --from 0 --to 60 --n 24 | --beats timeline.json`
// Options: --out dir (stills) --cols 4 --w 1 --thumb 480 --base http://localhost:3102 --path /
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

import { frameFileName, parseStillsArgs, stillUrl, type StillFrame } from "./stills-args.ts";

const args = parseStillsArgs(process.argv.slice(2), (path) => readFileSync(path, "utf8"));
const out = resolve(args.out);
mkdirSync(join(out, "labels"), { recursive: true });

// New headless Chrome gets a real GPU adapter (WebGPU + WebGL); headless-shell renders black.
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (error) => console.error(`[page] ${error.message}`));

const shots: string[] = [];
for (const [i, frame] of args.frames.entries()) {
  const file = join(out, frameFileName(i, frame.tau));
  await page.goto(stillUrl(args, frame.tau), { waitUntil: "load" });
  await page.waitForFunction(() => window.__stageReady === true, undefined, { timeout: 60_000 });
  await page.screenshot({ path: file });
  shots.push(file);
  console.log(`${frame.label} → ${file}`);
}

async function renderLabels(frames: readonly StillFrame[]): Promise<string[]> {
  const files: string[] = [];
  await page.setViewportSize({ width: args.thumb, height: 36 });
  for (const [i, frame] of frames.entries()) {
    const label = frame.label.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
    await page.setContent(
      `<body style="margin:0;background:#1f1e1d;color:#c9c7bc;font:500 16px/36px ui-monospace,Menlo,monospace;padding:0 10px;white-space:nowrap;overflow:hidden">${label}</body>`,
    );
    const file = join(out, "labels", `label-${String(i).padStart(3, "0")}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  }
  return files;
}

const labels = await renderLabels(args.frames);
await browser.close();

// drawtext is missing from common ffmpeg builds, so labels are rendered by the browser and stacked.
const rows = Math.ceil(shots.length / args.cols);
const inputs = shots.flatMap((shot, i) => ["-i", shot, "-i", labels[i] ?? ""]);
const cells = shots
  .map((_, i) => `[${2 * i}:v]scale=${args.thumb}:-2[s${i}];[s${i}][${2 * i + 1}:v]vstack[c${i}]`)
  .join(";");
const concat = `${shots.map((_, i) => `[c${i}]`).join("")}concat=n=${shots.length}:v=1:a=0`;
const filter = `${cells};${concat},tile=${args.cols}x${rows}:padding=8:margin=8:color=0x1f1e1d`;
const sheet = join(out, "contact.png");
execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    ...inputs,
    "-filter_complex",
    filter,
    "-frames:v",
    "1",
    sheet,
  ],
  {
    stdio: "inherit",
  },
);
console.log(`contact sheet → ${sheet}`);
