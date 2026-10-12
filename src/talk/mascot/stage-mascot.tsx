import { useRef } from "react";

import { useFrame } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";

import type { Act } from "./actions";
import { poseAt } from "./actions";
import type { MascotHandle } from "./apply";
import { stepMascot } from "./driver";
import { Mascot } from "./mascot";

type Props = { acts: readonly Act[]; className?: string; title?: string };

/** Stage-driven mascot: pose from τ (acts) and w (ambient), drawn on twos. */
export function StageMascot({ acts, className, title }: Props) {
  const handle = useRef<MascotHandle>(null);
  const key = useRef<number | null>(null);
  useFrame((frame) => {
    key.current = stepMascot(key.current, frame, acts, handle.current);
  }, PRIORITY.dom);
  return <Mascot ref={handle} pose={poseAt(acts, 0, 0)} className={className} title={title} />;
}
