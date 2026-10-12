import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const TuiGallery = lazy(() => import("#/talk/kit/tui/gallery"));

export const Route = createFileRoute("/dev/kit-tui")({
  component: KitTui,
});

function KitTui() {
  return (
    <div className="talk-page">
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <TuiGallery />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
