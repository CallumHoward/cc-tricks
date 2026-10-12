import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/newsreader/opsz-italic.css";
import "#/talk/tokens.css";
import "#/talk/talk.css";
import { useState } from "react";

import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";
import { Viewport } from "#/engine/stage/viewport";
import { createExternalClock } from "#/remotion/external-clock";
import { RemotionTimeHost } from "#/remotion/time-host";
import { TALK_END, TALK_STOPS, TalkScene } from "#/talk/talk-scene";

export const TALK_DURATION = TALK_END;

type FilmProps = { tau?: number; tauStart?: number; w?: number };

/** One Stage per composition instance, frozen at the τ Remotion asks for. */
export function TalkFilm({ tau, tauStart, w }: FilmProps) {
  const [clock] = useState(() => createExternalClock(TALK_STOPS, tau ?? tauStart ?? 0));
  const [stage] = useState(() => createStage({ clock, stops: TALK_STOPS }));
  return (
    <StageProvider stage={stage}>
      <RemotionTimeHost stage={stage} clock={clock} tau={tau} tauStart={tauStart} w={w}>
        <Viewport>
          <div className="stage-world">
            <TalkScene />
          </div>
        </Viewport>
      </RemotionTimeHost>
    </StageProvider>
  );
}
