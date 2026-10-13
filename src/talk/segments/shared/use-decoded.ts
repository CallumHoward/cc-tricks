import { useLayoutEffect } from "react";

import { useStage } from "#/engine/stage/react";

/** Holds frozen stills until the screenshot has decoded, so a still never shows an empty frame. */
export function useDecoded(src: string) {
  const stage = useStage();
  useLayoutEffect(() => {
    const release = stage.hold(`decode ${src}`);
    const img = new Image();
    img.src = src;
    if (typeof img.decode === "function")
      void img
        .decode()
        .catch(() => undefined)
        .finally(release);
    else release();
    return release;
  }, [stage, src]);
}
