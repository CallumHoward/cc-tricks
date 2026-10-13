import NOTES_MD from "./notes.md?raw";

const MARKER = /^<!-- stop: ([\w-]+) -->$/;

/** Splits the notes file into each stop's markdown, keyed by the id in its `stop:` marker. */
export function parseNoteSections(md: string): ReadonlyMap<string, string> {
  const sections = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of md.split("\n")) {
    const id = MARKER.exec(line)?.[1];
    if (id) sections.set(id, (current = []));
    else current?.push(line);
  }
  return new Map(
    [...sections].map(([id, lines]) => [id, lines.join("\n").replace(/^\n+|\n+$/g, "")]),
  );
}

/** Speaker notes per stop id, verbatim from the Notion show notes. */
export const NOTES = parseNoteSections(NOTES_MD);
