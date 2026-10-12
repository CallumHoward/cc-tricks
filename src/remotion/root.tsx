import { Composition, Still } from "remotion";

import { TALK_DURATION, TalkFilm } from "#/remotion/talk-film";

const FPS = 60;

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="talk"
        component={TalkFilm}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={Math.ceil(TALK_DURATION * FPS)}
        defaultProps={{ tauStart: 0 }}
      />
      <Still
        id="frame"
        component={TalkFilm}
        width={1920}
        height={1080}
        defaultProps={{ tau: 0, w: 0 }}
      />
    </>
  );
}
