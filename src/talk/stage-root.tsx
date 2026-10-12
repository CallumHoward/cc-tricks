import { useEffect } from "react";

import { createAudio } from "#/engine/audio/synth";
import { useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import { StageHost } from "#/engine/stage/stage-host";
import type { Beat } from "#/engine/types";
import { TALK_STOPS, TalkScene } from "#/talk/talk-scene";
import { BEATS } from "#/talk/timeline-data";

/** One audio beat per storyboard cue, fired when the playhead crosses its τ. */
export const AUDIO_BEATS: readonly Beat[] = BEATS.flatMap((beat) =>
  beat.cues.map((cue, i) => ({
    id: `${beat.id}:${i}`,
    start: cue.tau,
    end: cue.tau,
    summary: beat.id,
    cue: cue.cue,
  })),
);

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
