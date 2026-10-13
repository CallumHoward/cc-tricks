import { Fragment, type ReactNode } from "react";

import { parseNotes, type NoteBlock, type NoteInline, type NoteListItem } from "./notes-parser";

/** A stop's notes, rendered from the Notion-flavored markdown they are written in. */
export function NotesMarkdown({ text }: { text: string }) {
  return <div className="presenter-notes">{each(parseNotes(text), renderBlock)}</div>;
}

function each<T>(nodes: readonly T[], render: (node: T) => ReactNode): ReactNode[] {
  // oxlint-disable-next-line react/no-array-index-key -- parsed nodes are positional and may repeat
  return nodes.map((node, i) => <Fragment key={i}>{render(node)}</Fragment>);
}

/** The stop title is the page's h1, so the notes' own headings start at h2. */
const HEADINGS = ["h2", "h3", "h4"] as const;

function renderBlock(block: NoteBlock): ReactNode {
  switch (block.type) {
    case "heading": {
      const Heading = HEADINGS[block.level - 1];
      return <Heading>{each(block.children, renderInline)}</Heading>;
    }
    case "paragraph":
      return <p>{each(block.children, renderInline)}</p>;
    case "image":
      return (
        <p className="presenter-notes__image">
          <em>🖼 {block.caption.length > 0 ? each(block.caption, renderInline) : "image"}</em>
        </p>
      );
    case "code":
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List>{each(block.items, renderItem)}</List>;
    }
  }
}

function renderItem(item: NoteListItem): ReactNode {
  return (
    <li value={item.value}>
      {each(item.children, renderInline)}
      {each(item.blocks, renderBlock)}
    </li>
  );
}

function renderInline(node: NoteInline): ReactNode {
  switch (node.type) {
    case "text":
      return node.text;
    case "code":
      return <code>{node.text}</code>;
    case "em":
      return <em>{each(node.children, renderInline)}</em>;
    case "strong":
      return <strong>{each(node.children, renderInline)}</strong>;
    case "link":
      return (
        <a className="talk-link" href={node.href} target="_blank" rel="noreferrer">
          {each(node.children, renderInline)}
        </a>
      );
    case "break":
      return <br />;
  }
}
