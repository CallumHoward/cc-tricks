import { createFileRoute } from "@tanstack/react-router";

import { content } from "#/talk/content";

export const Route = createFileRoute("/shownotes")({
  head: () => ({ meta: [{ title: `Show notes · ${content.title}` }] }),
  component: Shownotes,
});

function Shownotes() {
  return (
    <main className="w-full max-w-3xl px-4 pb-16">
      <h1 className="mb-2 text-4xl font-semibold">{content.title}</h1>
      {content.subtitle ? (
        <p className="mb-8 text-lg text-muted-foreground">
          {content.subtitle} · {content.speaker}
        </p>
      ) : null}
      {content.shownotes.map((section) => (
        <section key={section.id} id={section.id} className="mb-10">
          <h2 className="mb-3 text-2xl font-semibold">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="mb-3 leading-relaxed">
              {paragraph}
            </p>
          ))}
          {section.code?.map((snippet) => (
            <figure key={snippet.text} className="mb-4">
              {snippet.label ? (
                <figcaption className="mb-1 font-mono text-sm text-muted-foreground">
                  {snippet.label}
                </figcaption>
              ) : null}
              <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-sm">
                <code>{snippet.text}</code>
              </pre>
            </figure>
          ))}
          {section.links && section.links.length > 0 ? (
            <ul className="list-disc pl-6">
              {section.links.map((link) => (
                <li key={link.href}>
                  <a className="underline underline-offset-4" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </main>
  );
}
