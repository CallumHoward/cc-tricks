import { noteSourceLines } from "./notes-parser";

/**
 * For each stop's notes in talk order, the lines an earlier stop already contained. A stop whose
 * every line is a repeat gets none, so a recap stays readable.
 */
export function repeatedLines(notes: readonly (string | undefined)[]): ReadonlySet<string>[] {
  const seen = new Set<string>();
  return notes.map((md) => {
    const lines = noteSourceLines(md ?? "");
    const repeated = new Set(lines.filter((line) => seen.has(line)));
    for (const line of lines) seen.add(line);
    return repeated.size === new Set(lines).size ? new Set() : repeated;
  });
}
