import { useEffect } from "react";

import { createAudio } from "#/engine/audio/synth";
import { useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import { StageHost } from "#/engine/stage/stage-host";
import type { Beat } from "#/engine/types";
import { audioBeats, type CueAt } from "#/talk/cues";
import { SEGMENT_ENTRIES } from "#/talk/segments";
import { TALK_STOPS, TalkScene } from "#/talk/talk-scene";
import { BEATS } from "#/talk/timeline-data";

// Segments may ship `cues.ts` (export const CUES) to own the sound timing of their window
const OVERRIDES = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ CUES: readonly CueAt[] }>("./segments/*/cues.ts", { eager: true }),
  ).map(([path, mod]) => [path.split("/").at(-2) ?? path, mod.CUES]),
);

/** One audio beat per cue, fired when the playhead crosses its τ. */
const AUDIO_BEATS: readonly Beat[] = audioBeats(BEATS, SEGMENT_ENTRIES, OVERRIDES);

function TalkAudio() {
  const stage = useStage();
  useEffect(() => {
    if (stage.frozen) return;
    const audio = createAudio({ beats: AUDIO_BEATS, plan: () => stage.clock.plan() });
    const offFrame = stage.onFrame(audio.frame, PRIORITY.audio);
    const offCommand = stage.onCommand((command) => {
      if (command.type === "mute") audio.toggleMute();
    });
    const unbind = audio.bindUnlock();
    return () => {
      offFrame();
      offCommand();
      unbind();
      audio.dispose();
    };
  }, [stage]);
  return null;
}

export default function StageRoot() {
  return (
    <StageHost stops={TALK_STOPS}>
      <TalkScene />
      <TalkAudio />
    </StageHost>
  );
}
