import { tokenizeLine, type CodeLang } from "./highlight";

/** One line of code as highlight spans (`hl-<kind>` classes); plain text without a language. */
export function HighlightedLine({ line, lang }: { line: string; lang?: CodeLang }) {
  if (!lang) return line;
  let offset = 0;
  return tokenizeLine(line, lang).map((token) => {
    const key = offset;
    offset += token.text.length;
    return token.kind === "plain" ? (
      token.text
    ) : (
      <span key={key} className={`hl-${token.kind}`}>
        {token.text}
      </span>
    );
  });
}
