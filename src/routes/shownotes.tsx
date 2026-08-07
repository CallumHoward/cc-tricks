import { createFileRoute } from "@tanstack/react-router";

import { TRICKS } from "#/components/tricks";

import slidesCss from "../slides.css?url";

export const Route = createFileRoute("/shownotes")({
  head: () => ({
    meta: [{ title: "Claude Code tricks — shownotes" }],
    links: [
      { rel: "stylesheet", href: slidesCss },
      { rel: "icon", href: "/cc-asterisk.svg", type: "image/svg+xml" },
    ],
  }),
  component: Shownotes,
});

function Shownotes() {
  return (
    <div className="cc-theme shownotes-root">
      <main className="shownotes-main">
        <header className="shownotes-header">
          <h1 className="shownotes-heading">
            <span className="slides-asterisk">✳</span> Claude Code tricks
          </h1>
          <p className="shownotes-byline">
            Callum Howard · Frontend Software Engineer @ Checkbox ·{" "}
            <a className="slides-link" href="https://callumhoward.com">
              callumhoward.com
            </a>
          </p>
        </header>

        <ol className="shownotes-list">
          {TRICKS.map((trick) => (
            <li key={trick.n} className="shownotes-item">
              <h2 className="shownotes-cmd">
                <span className="slides-num">{trick.n}.</span>{" "}
                <span className="slides-prompt-caret">❯</span> {trick.input}
              </h2>
              {trick.summary && <p className="shownotes-summary">{trick.summary}</p>}
              {trick.points.length > 0 && (
                <ul className="shownotes-points">
                  {trick.points.map((point, i) => (
                    // eslint-disable-next-line react/no-array-index-key -- static content
                    <li key={i} className="slides-point">
                      <span className="slides-point-dot" aria-hidden>
                        ⏺
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              {trick.docs && (
                <p className="shownotes-docs">
                  <span className="slides-dim">docs: </span>
                  {trick.docs.map((doc, i) => (
                    <span key={doc.href}>
                      {i > 0 && <span className="slides-dim"> · </span>}
                      <a className="slides-link" href={doc.href}>
                        {doc.label}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>

        <footer className="shownotes-footer">
          <a className="slides-link" href="/slides">
            back to the slides
          </a>
        </footer>
      </main>
    </div>
  );
}
