import { ClientOnly, createFileRoute } from "@tanstack/react-router";

import { PresenterConsole } from "#/engine/presenter/console";
import { content, faviconFor } from "#/talk/content";

export const Route = createFileRoute("/presenter")({
  head: () => ({ meta: [{ title: `Presenter · ${content.title}` }] }),
  component: Presenter,
});

function Presenter() {
  return (
    <div className="talk-page" data-page="presenter">
      <ClientOnly fallback={null}>
        <PresenterConsole stops={content.stops} budget={content.budget} faviconFor={faviconFor} />
      </ClientOnly>
    </div>
  );
}
