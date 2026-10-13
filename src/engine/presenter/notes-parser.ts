/** Inline content of one line of notes. */
export type NoteInline =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "em"; children: NoteInline[] }
  | { type: "strong"; children: NoteInline[] }
  | { type: "link"; href: string; children: NoteInline[] }
  | { type: "break" };

/** `value` is the author's number on an ordered item; `blocks` are its tab-indented children. */
export type NoteListItem = { value?: number; children: NoteInline[]; blocks: NoteBlock[] };

export type NoteBlock =
  /** `level` counts the hashes, 1 to 3 */
  | { type: "heading"; level: number; children: NoteInline[] }
  | { type: "paragraph"; children: NoteInline[] }
  | { type: "image"; caption: NoteInline[] }
  | { type: "code"; lang: string; text: string }
  | { type: "list"; ordered: boolean; items: NoteListItem[] };

type Line = { depth: number } & (
  | { kind: "item"; ordered: boolean; item: NoteListItem }
  | { kind: "block"; block: NoteBlock }
);

const FENCE = /^```([^`]*)$/;
const ORDERED = /^(\d+)\.(?:\s+|$)(.*)$/;
const BULLET = /^[-*+](?:\s+|$)(.*)$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const IMAGE = /^!\[(.*?)\]\(.*\)$/;

/**
 * Parses the Notion-flavored markdown subset the notes use. One block per line, leading tabs nest
 * under the previous shallower list item, and anything unrecognised stays plain text.
 */
export function parseNotes(md: string): NoteBlock[] {
  const root: NoteBlock[] = [];
  const open: { depth: number; item: NoteListItem }[] = [];
  for (const line of noteLines(md)) {
    while ((open.at(-1)?.depth ?? -1) >= line.depth) open.pop();
    const parent = open.at(-1)?.item.blocks ?? root;
    if (line.kind === "block") parent.push(line.block);
    else open.push({ depth: line.depth, item: appendItem(parent, line.ordered, line.item) });
  }
  return root;
}

function appendItem(parent: NoteBlock[], ordered: boolean, item: NoteListItem): NoteListItem {
  const last = parent.at(-1);
  if (last?.type === "list" && last.ordered === ordered) last.items.push(item);
  else parent.push({ type: "list", ordered, items: [item] });
  return item;
}

/** Notion exports a fence's body unindented, so a fence runs to the next bare ``` line. */
function noteLines(md: string): Line[] {
  const rows = md.split(/\r?\n/);
  const lines: Line[] = [];
  let at = 0;
  while (at < rows.length) {
    const row = rows[at];
    const fence = FENCE.exec(row.trim());
    const end = fence ? closingFence(rows, at + 1) : at;
    if (fence) {
      const text = rows.slice(at + 1, end).join("\n");
      lines.push({
        depth: depthOf(row),
        kind: "block",
        block: { type: "code", lang: fence[1].trim(), text },
      });
    } else if (row.trim()) lines.push(classify(depthOf(row), row.trim()));
    at = end + 1;
  }
  return lines;
}

function closingFence(rows: readonly string[], from: number): number {
  const offset = rows.slice(from).findIndex((row) => row.trim() === "```");
  return offset === -1 ? rows.length : from + offset;
}

const depthOf = (row: string) => row.length - row.replace(/^\t+/, "").length;

function classify(depth: number, text: string): Line {
  const ordered = ORDERED.exec(text);
  if (ordered) {
    const item = { value: Number(ordered[1]), children: parseInline(ordered[2]), blocks: [] };
    return { depth, kind: "item", ordered: true, item };
  }
  const bullet = BULLET.exec(text);
  if (bullet) {
    return {
      depth,
      kind: "item",
      ordered: false,
      item: { children: parseInline(bullet[1]), blocks: [] },
    };
  }
  return { depth, kind: "block", block: leafBlock(text) };
}

function leafBlock(text: string): NoteBlock {
  const heading = HEADING.exec(text);
  if (heading)
    return { type: "heading", level: heading[1].length, children: parseInline(heading[2]) };
  const image = IMAGE.exec(text);
  if (image) return { type: "image", caption: parseInline(image[1].trim()) };
  return { type: "paragraph", children: parseInline(text) };
}

type Match = { node: NoteInline; length: number };
type Rule = (rest: string) => Match | null;

const rule =
  (pattern: RegExp, toNode: (match: RegExpExecArray) => NoteInline): Rule =>
  (rest) => {
    const match = pattern.exec(rest);
    return match ? { node: toNode(match), length: match[0].length } : null;
  };

/** Link text allows escapes; the URL allows one level of balanced parentheses. */
const LINK = /^\[((?:\\[\s\S]|[^\\\]])*)\]\(((?:[^()\s]|\([^()\s]*\))*)\)/;

/**
 * Tried in order at each position; escapes and code spans come first so their contents stay
 * literal.
 */
const RULES: readonly Rule[] = [
  rule(/^\\([!-/:-@[-`{-~])/, (m) => ({ type: "text", text: m[1] })),
  rule(/^(`+)(?!`)([\s\S]*?[^`])\1(?!`)/, (m) => ({ type: "code", text: m[2] })),
  rule(/^<br\s*\/?>/i, () => ({ type: "break" })),
  rule(/^<mention-page url="([^"]*)">([\s\S]*?)<\/mention-page>/, (m) => ({
    type: "link",
    href: m[1],
    children: [{ type: "text", text: m[2] }],
  })),
  rule(LINK, (m) => ({ type: "link", href: m[2], children: parseInline(m[1]) })),
  emphasis,
];

/**
 * A run of plain text, else a lone special character (a whole backtick run, so it never opens
 * code).
 */
const PLAIN = /^(?:[^\\`*[<]+|`+|[\s\S])/;

function parseInline(src: string): NoteInline[] {
  const nodes: NoteInline[] = [];
  let rest = src;
  while (rest) {
    const { node, length } = firstMatch(rest);
    const last = nodes.at(-1);
    if (last?.type === "text" && node.type === "text") last.text += node.text;
    else nodes.push(node);
    rest = rest.slice(length);
  }
  return nodes;
}

function firstMatch(rest: string): Match {
  for (const tryRule of RULES) {
    const match = tryRule(rest);
    if (match) return match;
  }
  const text = PLAIN.exec(rest)?.[0] ?? rest;
  return { node: { type: "text", text }, length: text.length };
}

/** `*em*`, `**strong**` or `***both***`, closed by the next star run of the same length. */
function emphasis(rest: string): Match | null {
  const run = /^\*+/.exec(rest)?.[0].length ?? 0;
  const body = rest.slice(run);
  if (run === 0 || run > 3 || !/^\S/.test(body)) return null;
  const end = closingRun(body, run);
  if (end === -1) return null;
  const children = parseInline(body.slice(0, end));
  const strong: NoteInline = { type: "strong", children };
  const node: NoteInline =
    run === 2 ? strong : { type: "em", children: run === 1 ? children : [strong] };
  return { node, length: run * 2 + end };
}

/** Skips escapes and code spans, whose stars never close emphasis. */
const STAR_SCAN = /\\[\s\S]|(`+)[\s\S]*?\1|\*+/g;

function closingRun(body: string, run: number): number {
  for (const match of body.matchAll(STAR_SCAN)) {
    const [token] = match;
    const closes = token.startsWith("*") && token.length === run;
    if (closes && /\S/.test(body.charAt(match.index - 1))) return match.index;
  }
  return -1;
}
