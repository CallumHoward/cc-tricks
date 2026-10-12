import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const StageRoot = lazy(() => import("#/talk/stage-root"));

export const Route = createFileRoute("/")({
  component: Talk,
});

function Talk() {
  return (
    <div className="talk-page" data-page="talk">
      <ClientOnly fallback={<div className="stage-letterbox" />}>
        <Suspense fallback={<div className="stage-letterbox" />}>
          <StageRoot />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
