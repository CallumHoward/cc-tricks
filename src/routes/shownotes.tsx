import { createFileRoute } from "@tanstack/react-router";

import { content, type ShownoteSection } from "#/talk/content";

export const Route = createFileRoute("/shownotes")({
  head: () => ({ meta: [{ title: `Show notes · ${content.title}` }] }),
  component: Shownotes,
});

const display = { fontFamily: "var(--font-display)" } as const;

function Shownotes() {
  return (
    <main className="w-full max-w-3xl px-5 pb-20">
      <header className="mb-12">
        <h1 className="mb-3 text-5xl leading-tight" style={display}>
          {content.title}
        </h1>
        {content.subtitle ? (
          <p className="text-lg text-muted-foreground">{content.subtitle}</p>
        ) : null}
      </header>
      {content.shownotes.map((section) => (
        <section key={section.id} id={section.id} className="mb-12 scroll-mt-8">
          <h2 className="mb-4 text-3xl" style={display}>
            {section.heading}
          </h2>
          <SectionBody section={section} />
          <SectionCode code={section.code} />
          <SectionLinks links={section.links} />
        </section>
      ))}
    </main>
  );
}

/** Multi-point sections read as a list; the prose bookends and single points as paragraphs. */
function SectionBody({ section }: { section: ShownoteSection }) {
  const isList = section.body.length > 1 && section.id !== "foreword" && section.id !== "afterword";
  if (isList) {
    return (
      <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-[#d97757]">
        {section.body.map((point) => (
          <li key={point} className="leading-relaxed">
            {point}
          </li>
        ))}
      </ul>
    );
  }
  return section.body.map((paragraph) => (
    <p key={paragraph} className="mb-4 text-lg leading-relaxed" style={display}>
      {paragraph}
    </p>
  ));
}

function SectionCode({ code = [] }: { code?: ShownoteSection["code"] }) {
  return code.map((snippet) => (
    <figure key={snippet.text} className="mb-4">
      {snippet.label ? (
        <figcaption className="mb-1 font-mono text-sm text-muted-foreground">
          {snippet.label}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm leading-relaxed">
        <code>{snippet.text}</code>
      </pre>
    </figure>
  ));
}

function SectionLinks({ links = [] }: { links?: ShownoteSection["links"] }) {
  if (links.length === 0) return null;
  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={link.href}>
          <a
            className="text-[#c6613f] underline decoration-[#d97757]/50 underline-offset-4 hover:decoration-[#d97757] dark:text-[#eb9f7f]"
            href={link.href}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
