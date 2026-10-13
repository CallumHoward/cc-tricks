import { StageHost } from "#/engine/stage/stage-host";
import { content } from "#/talk/content";
import { Overview } from "#/talk/overview/overview";
import { ProgressBar } from "#/talk/progress-bar";
import { TALK_STOPS, TalkScene } from "#/talk/talk-scene";

export default function StageRoot() {
  return (
    <StageHost stops={TALK_STOPS}>
      <Overview stops={content.stops}>
        <TalkScene />
      </Overview>
      <ProgressBar />
    </StageHost>
  );
}
