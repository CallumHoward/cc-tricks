import { Fragment, type ReactNode } from "react";

import { codeLang } from "#/engine/text/highlight";
import { HighlightedLine } from "#/engine/text/highlighted-line";

import { parseNotes, type NoteBlock, type NoteInline, type NoteListItem } from "./notes-parser";

/** Resolves a link's favicon URL, or nothing for a host without one. */
export type FaviconFor = (href: string) => string | undefined;

/**
 * A stop's notes, rendered from the Notion-flavored markdown they are written in. Lines in
 * `repeated` (an earlier stop said them) are muted.
 */
export function NotesMarkdown({
  text,
  repeated,
  faviconFor = () => undefined,
}: {
  text: string;
  repeated?: ReadonlySet<string>;
  faviconFor?: FaviconFor;
}) {
  const render = renderers(faviconFor);
  return <div className="presenter-notes">{each(parseNotes(text, repeated), render.block)}</div>;
}

function each<T>(nodes: readonly T[], render: (node: T) => ReactNode): ReactNode[] {
  // oxlint-disable-next-line react/no-array-index-key -- parsed nodes are positional and may repeat
  return nodes.map((node, i) => <Fragment key={i}>{render(node)}</Fragment>);
}

/** The stop title is the page's h1, so the notes' own headings start at h2. */
const HEADINGS = ["h2", "h3", "h4"] as const;

const REPEATED = "presenter-notes__repeated";
const repeatedClass = (node: { repeated?: true }) => (node.repeated ? REPEATED : undefined);

function CodeBlock({ text, lang }: { text: string; lang: string }) {
  const language = codeLang(lang);
  return (
    <pre>
      <code>
        {text.split("\n").map((line, i) => (
          // oxlint-disable-next-line react/no-array-index-key -- lines are positional and may repeat
          <Fragment key={i}>
            {i > 0 && "\n"}
            <HighlightedLine line={line} lang={language} />
          </Fragment>
        ))}
      </code>
    </pre>
  );
}

const plainText = (nodes: readonly NoteInline[]): string =>
  nodes
    .map((node) => {
      if (node.type === "text" || node.type === "code") return node.text;
      return node.type === "break" ? " " : plainText(node.children);
    })
    .join("");

function renderers(faviconFor: FaviconFor) {
  const inline = (node: NoteInline): ReactNode => {
    switch (node.type) {
      case "text":
        return node.text;
      case "code":
        return <code>{node.text}</code>;
      case "em":
        return <em>{each(node.children, inline)}</em>;
      case "strong":
        return <strong>{each(node.children, inline)}</strong>;
      case "link": {
        const icon = faviconFor(node.href);
        return (
          <a
            className="talk-link presenter-link"
            href={node.href}
            target="_blank"
            rel="noreferrer"
            title={`${plainText(node.children)}\n${node.href}`}
          >
            {icon ? (
              <img className="presenter-link__icon" src={icon} alt="" />
            ) : (
              <span className="presenter-link__icon" aria-hidden>
                🔗
              </span>
            )}
            <span className="presenter-link__text">{each(node.children, inline)}</span>
          </a>
        );
      }
      case "break":
        return <br />;
    }
  };

  const item = (it: NoteListItem): ReactNode => (
    <li value={it.value} data-repeated={it.repeated}>
      {it.repeated ? (
        <span className={REPEATED}>{each(it.children, inline)}</span>
      ) : (
        each(it.children, inline)
      )}
      {each(it.blocks, block)}
    </li>
  );

  const block = (b: NoteBlock): ReactNode => {
    switch (b.type) {
      case "heading": {
        const Heading = HEADINGS[b.level - 1];
        return <Heading className={repeatedClass(b)}>{each(b.children, inline)}</Heading>;
      }
      case "paragraph":
        return <p className={repeatedClass(b)}>{each(b.children, inline)}</p>;
      case "image":
        return (
          <p className="presenter-notes__image">
            <em>🖼 {b.caption.length > 0 ? each(b.caption, inline) : "image"}</em>
          </p>
        );
      case "code":
        return <CodeBlock text={b.text} lang={b.lang} />;
      case "list": {
        const List = b.ordered ? "ol" : "ul";
        return <List>{each(b.items, item)}</List>;
      }
    }
  };

  return { block };
}
