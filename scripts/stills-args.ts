export type StillFrame = { tau: number; label: string };

export type StillsArgs = {
  frames: StillFrame[];
  out: string;
  cols: number;
  baseUrl: string;
  path: string;
  w: number;
  thumb: number;
};

type Timeline = {
  stops?: readonly { id: string; at: number }[];
  beats?: readonly { id: string; start: number; end: number }[];
};

export const DEFAULT_BASE_URL = "http://localhost:3102";

export function linspace(from: number, to: number, n: number): number[] {
  if (n <= 1) return [from];
  return Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));
}

const round = (x: number) => Math.round(x * 1000) / 1000;
export const tauLabel = (tau: number) => `τ=${tau.toFixed(2)}`;

/** One frame per beat midpoint and per stop `at`, sorted, duplicates merged. */
export function timelineFrames(timeline: Timeline): StillFrame[] {
  const byTau = new Map<number, string[]>();
  const add = (tau: number, id: string) => {
    const key = round(tau);
    byTau.set(key, [...(byTau.get(key) ?? []), id]);
  };
  for (const s of timeline.stops ?? []) add(s.at, `stop:${s.id}`);
  for (const b of timeline.beats ?? []) add((b.start + b.end) / 2, b.id);
  return [...byTau.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tau, ids]) => ({ tau, label: `${tauLabel(tau)}  ${ids.join(" · ")}` }));
}

function number(flag: string, raw: string | undefined): number {
  const n = Number(raw);
  if (raw === undefined || raw.trim() === "" || !Number.isFinite(n))
    throw new Error(`${flag} needs a number, got ${raw}`);
  return n;
}

function parseFlags(argv: readonly string[]): Map<string, string> {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const [key = "", inline] = arg.slice(2).split("=", 2);
    flags.set(key, inline ?? argv[++i] ?? "");
  }
  return flags;
}

function tauListFrames(raw: string): StillFrame[] {
  return raw.split(",").map((t) => {
    const tau = number("--taus", t);
    return { tau, label: tauLabel(tau) };
  });
}

function rangeFrames(flags: Map<string, string>): StillFrame[] {
  const n = Math.max(1, Math.round(number("--n", flags.get("n") ?? "12")));
  const from = number("--from", flags.get("from"));
  const to = number("--to", flags.get("to"));
  return linspace(from, to, n).map((t) => ({ tau: round(t), label: tauLabel(t) }));
}

function framesFrom(flags: Map<string, string>, readFile: (path: string) => string): StillFrame[] {
  if (flags.has("beats"))
    return timelineFrames(JSON.parse(readFile(flags.get("beats") ?? "")) as Timeline);
  if (flags.has("taus")) return tauListFrames(flags.get("taus") ?? "");
  if (flags.has("from") || flags.has("to")) return rangeFrames(flags);
  throw new Error("Pass --taus a,b,c | --from A --to B [--n N] | --beats timeline.json");
}

const atLeast = (min: number, flag: string, raw: string) =>
  Math.max(min, Math.round(number(flag, raw)));

export function parseStillsArgs(
  argv: readonly string[],
  readFile: (path: string) => string,
): StillsArgs {
  const flags = parseFlags(argv);
  const frames = framesFrom(flags, readFile);
  if (frames.length === 0) throw new Error("No frames to capture");
  const base = flags.get("base") ?? process.env["STILLS_BASE_URL"] ?? DEFAULT_BASE_URL;
  return {
    frames,
    out: flags.get("out") ?? "stills",
    cols: atLeast(1, "--cols", flags.get("cols") ?? "4"),
    baseUrl: base.replace(/\/$/, ""),
    path: flags.get("path") ?? "/",
    w: number("--w", flags.get("w") ?? "1"),
    thumb: atLeast(64, "--thumb", flags.get("thumb") ?? "480"),
  };
}

export function stillUrl(args: Pick<StillsArgs, "baseUrl" | "path" | "w">, tau: number): string {
  const url = new URL(args.path, `${args.baseUrl}/`);
  url.searchParams.set("t", String(tau));
  url.searchParams.set("w", String(args.w));
  return url.toString();
}

export function frameFileName(index: number, tau: number): string {
  return `frame-${String(index).padStart(3, "0")}-t${tau.toFixed(3).replace("-", "m")}.png`;
}
