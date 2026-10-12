import { useCallback } from "react";

import { useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";

import { DEFAULT_OVERLAY, grainPixels, overlayState, type OverlayOptions } from "./overlay-state";

const layer = { position: "absolute", inset: 0, pointerEvents: "none" } as const;

const rewindBackground = [
  "linear-gradient(to bottom, transparent 0, rgb(250 249 245 / 0.10) 48%, rgb(217 119 87 / 0.10) 52%, transparent 100%) 0 var(--band, 0px) / 100% 140px no-repeat",
  "repeating-linear-gradient(to bottom, rgb(250 249 245 / 0.05) 0 2px, transparent 2px 5px)",
].join(", ");

function grainTileUrl(size: number, seed: number): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.putImageData(new ImageData(grainPixels(size, seed), size, size), 0, 0);
  return canvas.toDataURL("image/png");
}

/** Full-stage film grain and rewind tracking over the DOM; ambient, keyed to wall time. */
export function GrainOverlay({ options = DEFAULT_OVERLAY }: { options?: OverlayOptions }) {
  const stage = useStage();
  const ref = useCallback(
    (root: HTMLDivElement | null) => {
      if (!root) return;
      const grain = root.firstElementChild as HTMLElement | null;
      const rewind = grain?.nextElementSibling as HTMLElement | null | undefined;
      if (!grain || !rewind) return;
      const url = grainTileUrl(options.tile, 1);
      if (url) grain.style.backgroundImage = `url(${url})`;
      let last = "";
      return stage.onFrame((frame) => {
        const s = overlayState(frame, options);
        const key = `${s.x},${s.y},${s.grain},${s.rewind},${s.band}`;
        if (key === last) return;
        last = key;
        grain.style.backgroundPosition = `${s.x}px ${s.y}px`;
        grain.style.opacity = String(s.grain);
        rewind.style.opacity = String(s.rewind * 0.8);
        rewind.style.setProperty("--band", `${s.band}px`);
      }, PRIORITY.overlay);
    },
    [stage, options],
  );

  return (
    <div ref={ref} aria-hidden data-testid="grain-overlay" style={layer}>
      <div style={{ ...layer, mixBlendMode: "overlay", opacity: 0, backgroundRepeat: "repeat" }} />
      <div style={{ ...layer, mixBlendMode: "screen", opacity: 0, background: rewindBackground }} />
    </div>
  );
}
