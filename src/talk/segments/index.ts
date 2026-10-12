import type { ComponentType } from "react";

import type { MountWindow } from "#/engine/types";
import { SEGMENTS } from "#/talk/timeline-data";

import AfterwordSegment from "./afterword/view";
import BonusLayaSegment from "./bonus-laya/view";
import ForewordSegment from "./foreword/view";
import OutroSegment from "./outro/view";
import Tip01SubagentsSegment from "./tip-01-subagents/view";
import Tip02CacheSegment from "./tip-02-cache/view";
import Tip03EffortSegment from "./tip-03-effort/view";
import Tip04SuperpowersSegment from "./tip-04-superpowers/view";
import Tip05ProcSegment from "./tip-05-proc/view";
import Tip06CliAgentsSegment from "./tip-06-cli-agents/view";
import Tip07HeadroomRtkSegment from "./tip-07-headroom-rtk/view";
import Tip08FableCursorSegment from "./tip-08-fable-cursor/view";
import Tip09SuggestionsSegment from "./tip-09-suggestions/view";
import Tip10OffersSegment from "./tip-10-offers/view";
import TitleSegment from "./title/view";

/** Story seconds after a segment's last hold in which it performs its own exit (fold, pocket, whip). */
const EXIT_TAIL = 1.4;

/** The first segment is also visible before τ 0, so the pre-roll stop shows its empty prompt. */
const PRE_ROLL = 1;

const VIEWS: Record<string, ComponentType> = {
  title: TitleSegment,
  foreword: ForewordSegment,
  "tip-01-subagents": Tip01SubagentsSegment,
  "tip-02-cache": Tip02CacheSegment,
  "tip-03-effort": Tip03EffortSegment,
  "tip-04-superpowers": Tip04SuperpowersSegment,
  "tip-05-proc": Tip05ProcSegment,
  "tip-06-cli-agents": Tip06CliAgentsSegment,
  "tip-07-headroom-rtk": Tip07HeadroomRtkSegment,
  "tip-08-fable-cursor": Tip08FableCursorSegment,
  "tip-09-suggestions": Tip09SuggestionsSegment,
  "tip-10-offers": Tip10OffersSegment,
  "bonus-laya": BonusLayaSegment,
  afterword: AfterwordSegment,
  outro: OutroSegment,
};

export type SegmentEntry = { id: string; window: MountWindow; View: ComponentType };

/** Segments tile story time; each owns its exit tail, so the next one starts `EXIT_TAIL` later. */
export const SEGMENT_ENTRIES: readonly SegmentEntry[] = SEGMENTS.map((segment, i) => {
  const next = SEGMENTS[i + 1];
  const View = VIEWS[segment.id];
  if (!View) throw new Error(`No view for segment ${segment.id}`);
  return {
    id: segment.id,
    window: {
      start: i === 0 ? segment.start - PRE_ROLL : segment.start + EXIT_TAIL,
      end: next ? next.start + EXIT_TAIL : segment.end,
    },
    View,
  };
});
