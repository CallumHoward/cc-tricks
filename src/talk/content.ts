import { scriptFor, type StopScript } from "#/talk/script";
import { SHOWNOTES, type ShownoteTip } from "#/talk/shownotes-data";
import { STOPS } from "#/talk/timeline-data";

export type Link = { label: string; href: string };

/** Speaker-facing data for one stage stop (ids match the timeline's stops). */
export type StopContent = { id: string; title: string; notes?: string };

/** One section of the static show notes page. */
export type ShownoteSection = {
  id: string;
  heading: string;
  body: readonly string[];
  code?: readonly { label?: string; text: string }[];
  links?: readonly Link[];
};

export type TalkContent = {
  title: string;
  subtitle?: string;
  speaker: string;
  /** Talk length budget in seconds */
  budget: number;
  stops: readonly StopContent[];
  shownotes: readonly ShownoteSection[];
};

const NOTE_PREFIX = { verbatim: "", point: "• ", say: "› ", careful: "⚠ " } as const;

/** Presenter notes: verbatim prose as written, prompts as bullets. */
export function notesText(script: Pick<StopScript, "notes">): string {
  return script.notes.map((note) => `${NOTE_PREFIX[note.kind]}${note.text}`).join("\n\n");
}

function tipSection(tip: ShownoteTip): ShownoteSection {
  return {
    id: tip.id,
    heading: tip.n === undefined ? `Bonus: ${tip.title}` : `${tip.n}. ${tip.title}`,
    body: tip.points,
    code: tip.snippets.map((snippet) => ({ label: snippet.label, text: snippet.code })),
    links: tip.links,
  };
}

export const content: TalkContent = {
  title: SHOWNOTES.title,
  subtitle: SHOWNOTES.byline,
  speaker: "Callum Howard",
  budget: 20 * 60,
  stops: [
    { id: "start", title: "Ready", notes: "Press → to play the cold open." },
    ...STOPS.map((stop) => ({
      id: stop.id,
      title: stop.title,
      notes: notesText(scriptFor(stop.id)),
    })),
  ],
  shownotes: [
    { id: "spoiler", heading: "Spoiler", body: [SHOWNOTES.spoiler] },
    {
      id: "foreword",
      heading: "Foreword",
      body: [
        SHOWNOTES.foreword.question,
        ...SHOWNOTES.foreword.answers,
        ...SHOWNOTES.foreword.summary,
      ],
    },
    ...SHOWNOTES.tips.map(tipSection),
    tipSection(SHOWNOTES.bonus),
    { id: "afterword", heading: "Afterword", body: SHOWNOTES.afterword },
    { id: "references", heading: "Additional references", body: [], links: SHOWNOTES.references },
  ],
};

export function stopContent(id: string): StopContent | undefined {
  return content.stops.find((s) => s.id === id);
}
