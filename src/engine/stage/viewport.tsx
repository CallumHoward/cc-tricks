import { createContext, use, useSyncExternalStore, type ReactNode } from "react";

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

/** Largest scale at which the logical stage fits the box. */
export function fitScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  return Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
}

const subscribeResize = (listener: () => void) => {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
};
const windowScale = () => fitScale(window.innerWidth, window.innerHeight);
const serverScale = () => 1;

const ScaleContext = createContext(1);

/** Stage px per CSS px, for converting pointer coordinates into logical stage space. */
export function useViewportScale(): number {
  return use(ScaleContext);
}

/** Fixed 1920×1080 logical stage, letterboxed and scaled to fit the window. */
export function Viewport({ children }: { children: ReactNode }) {
  const scale = useSyncExternalStore(subscribeResize, windowScale, serverScale);
  return (
    <div className="stage-letterbox">
      <div
        className="stage-surface"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <ScaleContext value={scale}>{children}</ScaleContext>
      </div>
    </div>
  );
}
