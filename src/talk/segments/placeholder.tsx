import { keys } from "#/engine/motion/track";
import { useTrack } from "#/engine/stage/react";
import { RuleRise } from "#/talk/kit/motion";
import { scriptFor } from "#/talk/script";
import { STOPS, type StopData } from "#/talk/timeline-data";

function holdEnd(stop: StopData) {
  return stop.at + stop.holdSpan;
}

function PlaceholderStop({ stop }: { stop: StopData }) {
  const script = scriptFor(stop.id);
  const visible = useTrack({
    opacity: keys(
      [stop.leadIn.start - 0.01, 0],
      [stop.leadIn.start, 1],
      [holdEnd(stop) + 0.6, 1],
      [holdEnd(stop) + 0.61, 0],
    ),
  });
  return (
    <div
      ref={visible}
      data-placeholder-stop={stop.id}
      style={{ position: "absolute", left: 200, top: 300, width: 1500 }}
    >
      {script.kicker ? <p className="type-label text-clay">{script.kicker}</p> : null}
      <RuleRise
        text={script.headline ?? stop.title}
        settleBy={stop.at - 0.8}
        exit={holdEnd(stop) + 0.05}
      />
      {script.lines.slice(0, 2).map((line) => (
        <p key={line} className="type-body text-soft" style={{ margin: "32px 0 0" }}>
          {line}
        </p>
      ))}
    </div>
  );
}

/** Stand-in for a segment whose plates are not built yet: each stop's headline and lines. */
export function PlaceholderSegment({ id }: { id: string }) {
  return (
    <>
      {STOPS.filter((stop) => stop.segment === id).map((stop) => (
        <PlaceholderStop key={stop.id} stop={stop} />
      ))}
    </>
  );
}
