import { repeatedLines } from "#/engine/presenter/notes-repeats";
import { FAVICON_HOSTS } from "#/talk/favicon-hosts";
import { NOTES } from "#/talk/notes";
import { SHOWNOTES, type ShownoteTip } from "#/talk/shownotes-data";
import { STOPS } from "#/talk/timeline-data";

export type Link = { label: string; href: string };

/**
 * Speaker-facing data for one stage stop (ids match the timeline's stops). `repeated` holds the
 * notes lines an earlier stop already said; `interactive` hints at what to demo on the slide.
 */
export type StopContent = {
  id: string;
  title: string;
  notes?: string;
  target?: number;
  repeated?: ReadonlySet<string>;
  interactive?: string;
};

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

/** Stops whose slide has something to play with live (widgets, not plain links). */
const INTERACTIVE: Readonly<Record<string, string>> = {
  "t3-aa": "click a model's point",
  "t5-chain": "drag the pins, toggle routines",
};

/** A notes link's favicon from public/talk/favicons (fetched by `pnpm favicons`). */
export function faviconFor(href: string): string | undefined {
  const host = URL.canParse(href) ? new URL(href).host : undefined;
  return host && FAVICON_HOSTS.has(host) ? `/talk/favicons/${host}.png` : undefined;
}

function withNotesContext(stops: readonly StopContent[]): StopContent[] {
  const repeated = repeatedLines(stops.map((stop) => stop.notes));
  return stops.map((stop, i) => ({
    ...stop,
    repeated: repeated[i],
    interactive: INTERACTIVE[stop.id],
  }));
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
  stops: withNotesContext([
    { id: "start", title: "Ready", notes: "Press → to play the cold open." },
    ...STOPS.map((stop) => ({
      id: stop.id,
      title: stop.title,
      notes: NOTES.get(stop.id),
      target: stop.speakSeconds,
    })),
  ]),
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
