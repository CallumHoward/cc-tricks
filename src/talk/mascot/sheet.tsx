import { useEffect, useId, useRef, type ReactNode } from "react";

import type { Act } from "./actions";
import { HOP, boilIndex, poseAt, twosKey } from "./actions";
import type { MascotHandle } from "./apply";
import { drawMascot, type DrawOptions } from "./draw";
import { EXPRESSION_NAMES, applyExpression, type ExpressionName } from "./expressions";
import { Mascot, MascotGroup, MascotSvg } from "./mascot";
import type { Pose } from "./pose";
import { restPose } from "./pose";
import { BODY_TOP, LIMITS, PALETTE, PIVOTS, RIG } from "./rig";

const still = (acts: readonly Act[], tau: number) => poseAt(acts, tau, 0, { ambient: false });

function withPose(edit: (p: Pose) => void): Pose {
  const p = restPose();
  edit(p);
  return p;
}

const HOP_ACT: Act[] = [{ kind: "hop", at: 0 }];
const A = HOP.anticipation;

const POSES: { label: string; pose: Pose }[] = [
  { label: "idle", pose: restPose() },
  { label: "anticipation · sq 0.8", pose: still(HOP_ACT, A) },
  { label: "stretch · sq 1.16", pose: still(HOP_ACT, A + 0.02) },
  { label: "apex", pose: still(HOP_ACT, A + HOP.air / 2) },
  { label: "impact · sq 0.72", pose: still(HOP_ACT, A + HOP.air + 0.05) },
  { label: "wave", pose: still([{ kind: "wave", at: 0, dur: 2 }], 0.6) },
  { label: "point", pose: still([{ kind: "point", at: 0, dur: 2, angle: -20 }], 0.8) },
  { label: "shrug", pose: still([{ kind: "shrug", at: 0, dur: 2 }], 0.8) },
  { label: "celebrate", pose: still([{ kind: "celebrate", at: 0, dur: 3 }], 0.62) },
  { label: "surprised", pose: still([{ kind: "surprised", at: 0, dur: 2 }], 0.15) },
  { label: "sleepy", pose: still([{ kind: "sleepy", at: 0, dur: 4 }], 2.2) },
  { label: "carry", pose: still([{ kind: "carry", at: 0, dur: 2 }], 1) },
  {
    label: "push",
    pose: still(
      [
        { kind: "turn", at: 0, dur: 0.01, to: 35 },
        { kind: "push", at: 0, dur: 2 },
      ],
      1.05,
    ),
  },
  { label: "typing", pose: still([{ kind: "type", at: 0, dur: 2 }], 1.02) },
  {
    label: "sweat",
    pose: still(
      [
        { kind: "sweat", at: 0, dur: 2 },
        { kind: "face", at: 0, dur: 2, expr: "worried" },
      ],
      0.6,
    ),
  },
  { label: "look left", pose: still([{ kind: "look", at: 0, dur: 2, x: -1, y: 0 }], 1) },
];

const TURN = [
  { label: "front · 0°", yaw: 0 },
  { label: "¾ · 35°", yaw: 35 },
  { label: "side · 90°", yaw: 90 },
  { label: "¾ back · 145°", yaw: 145 },
  { label: "back · 180°", yaw: 180 },
];

const WALK_DRAWINGS = 6;
const walkAt = (yaw: number, i: number) =>
  still(
    [
      { kind: "turn", at: 0, dur: 0.001, to: yaw },
      { kind: "walk", at: 0, dur: 10, dx: 0, stepRate: 4 },
    ],
    1 + i / 12,
  );

const SILHOUETTES = [
  POSES[0],
  POSES[1],
  POSES[3],
  POSES[5],
  POSES[7],
  POSES[8],
  POSES[11],
  POSES[12],
];

const DEMO: Act[] = [
  { kind: "face", at: 0.4, dur: 1.4, expr: "happy" },
  { kind: "wave", at: 0.5, dur: 1.4 },
  { kind: "hop", at: 2.2 },
  { kind: "turn", at: 3.1, dur: 0.35, to: 70 },
  { kind: "walk", at: 3.4, dur: 1.5, dx: 120 },
  { kind: "turn", at: 4.9, dur: 0.35, to: -70 },
  { kind: "walk", at: 5.2, dur: 1.5, dx: -120 },
  { kind: "turn", at: 6.7, dur: 0.3, to: 0 },
  { kind: "surprised", at: 7.2, dur: 1 },
  { kind: "shrug", at: 8.5, dur: 1.2 },
  { kind: "celebrate", at: 10, dur: 1.6 },
  { kind: "sleepy", at: 12, dur: 2.4 },
];
const DEMO_LENGTH = 15;

const clean: DrawOptions = { boil: 0 };

function Figure({
  pose,
  label,
  options = clean,
  size = 180,
}: {
  pose: Pose;
  label?: string;
  options?: DrawOptions;
  size?: number;
}) {
  return (
    <figure className="m-0 flex flex-col items-center gap-1">
      <MascotSvg
        drawing={drawMascot(pose, 0, options)}
        viewBox="-165 -250 330 275"
        className="block"
        title={label}
      />
      {label && <figcaption style={{ ...caption, width: size }}>{label}</figcaption>}
    </figure>
  );
}

const caption = {
  fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
  fontSize: 13,
  color: PALETTE.muted,
  textAlign: "center",
} as const;

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="flex flex-col gap-4" aria-labelledby={id}>
      <header className="flex items-baseline gap-4">
        <h2
          id={id}
          style={{
            fontFamily: "'Newsreader Variable', serif",
            fontSize: 34,
            fontWeight: 500,
            margin: 0,
            color: PALETTE.ivory,
          }}
        >
          {title}
        </h2>
        {note && <p style={{ ...caption, textAlign: "left", margin: 0 }}>{note}</p>}
      </header>
      {children}
    </section>
  );
}

function Grid({ min = 170, children }: { min?: number; children: ReactNode }) {
  return (
    <div
      className="grid gap-x-4 gap-y-6"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}
    >
      {children}
    </div>
  );
}

function LivePreview() {
  const handle = useRef<MascotHandle>(null);
  useEffect(() => {
    let raf = 0;
    let key: number | null = null;
    const start = performance.now();
    const tick = (now: number) => {
      const w = (now - start) / 1000;
      const tau = w % DEMO_LENGTH;
      const next = twosKey(tau, w, 1);
      if (next !== key && handle.current) {
        key = next;
        handle.current.render(poseAt(DEMO, tau, w), boilIndex(w));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <Mascot
      ref={handle}
      viewBox="-260 -300 520 330"
      className="block w-full max-w-[560px]"
      title="live rig preview"
    />
  );
}

function PivotOverlay() {
  const drawing = drawMascot(restPose(), 0, clean);
  return (
    <div className="flex flex-wrap items-start gap-10">
      <svg viewBox="-200 -230 400 260" className="block w-full max-w-[520px]" aria-hidden>
        <g opacity={0.45}>
          <MascotGroup drawing={drawing} />
        </g>
        <line x1={-190} x2={190} y1={0} y2={0} stroke={PALETTE.muted} strokeDasharray="4 6" />
        <line
          x1={-190}
          x2={190}
          y1={BODY_TOP}
          y2={BODY_TOP}
          stroke={PALETTE.muted}
          strokeDasharray="4 6"
        />
        {PIVOTS.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={5} fill={PALETTE.ivory} />
            <circle cx={p.x} cy={p.y} r={10} fill="none" stroke={PALETTE.ivory} strokeWidth={1.5} />
          </g>
        ))}
        <path
          d={`M${-(RIG.bodyW / 2 - RIG.shoulderInset)} ${RIG.shoulderY}m-${RIG.armLen * 1.6} 0a${RIG.armLen * 1.6} ${RIG.armLen * 1.6} 0 0 1 ${RIG.armLen * 1.6 * 0.74} -${RIG.armLen * 1.6 * 0.67}`}
          fill="none"
          stroke={PALETTE.blush}
          strokeWidth={2}
          strokeDasharray="3 4"
        />
      </svg>
      <table
        style={{ ...caption, textAlign: "left", borderSpacing: "28px 6px", color: PALETTE.soft }}
      >
        <tbody>
          {PIVOTS.map((p) => (
            <tr key={p.id}>
              <td style={{ color: PALETTE.ivory }}>{p.label}</td>
              <td>{p.range}</td>
            </tr>
          ))}
          <tr>
            <td style={{ color: PALETTE.ivory }}>volume rule</td>
            <td>sx = 1/√sq · sy = sq (sx²·sy = 1)</td>
          </tr>
          <tr>
            <td style={{ color: PALETTE.ivory }}>eyes</td>
            <td>
              open {LIMITS.eyeOpen.join("–")} · slant ±1 · size {LIMITS.eyeSize.join("–")}
            </td>
          </tr>
          <tr>
            <td style={{ color: PALETTE.ivory }}>line</td>
            <td>{RIG.line}px ink, constant under squash · boil 1.2px × 3 drawings @ 12/s</td>
          </tr>
          <tr>
            <td style={{ color: PALETTE.ivory }}>proportions</td>
            <td>
              body {RIG.bodyW}×{RIG.bodyH}×{RIG.bodyD} · legs {RIG.legW}×{RIG.legH} · eyes{" "}
              {RIG.eyeX * 2} apart
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function expressionPose(name: ExpressionName): Pose {
  return withPose((p) => applyExpression(p, name, 1));
}

/** Dev character sheet: every view is drawn by the production rig. */
export function CharacterSheet() {
  return (
    <main
      className="flex w-full flex-col gap-14 px-4 pb-24 sm:px-10"
      style={{ background: "#262624", color: PALETTE.ivory, maxWidth: 1600 }}
    >
      <header className="flex flex-col gap-2 pt-6">
        <h1
          style={{
            fontFamily: "'Newsreader Variable', serif",
            fontSize: 64,
            fontWeight: 450,
            margin: 0,
            lineHeight: 1,
          }}
        >
          Clawdlet, model sheet
        </h1>
        <p style={{ ...caption, textAlign: "left", fontSize: 15 }}>
          flat vector · ink line {RIG.line}px · boil on twos · one light, top left · all views from
          the live rig
        </p>
      </header>

      <Section title="Live" note="τ = wall time, 15 s demo loop, drawn on twos">
        <LivePreview />
      </Section>

      <Section title="Turnaround" note="yaw 0 → 180°, body depth shows as the side tone">
        <Grid min={200}>
          {TURN.map((v) => (
            <Figure key={v.yaw} label={v.label} pose={withPose((p) => (p.yaw = v.yaw))} />
          ))}
        </Grid>
      </Section>

      <Section title="Expressions" note="eyes carry the emotion: lid, crescent, slant, size, glyph">
        <Grid min={150}>
          {EXPRESSION_NAMES.map((name) => (
            <Figure key={name} label={name} pose={expressionPose(name)} size={150} />
          ))}
        </Grid>
      </Section>

      <Section title="Poses" note="pure pose functions sampled at τ">
        <Grid min={170}>
          {POSES.map((p) => (
            <Figure key={p.label} label={p.label} pose={p.pose} />
          ))}
        </Grid>
      </Section>

      <Section
        title="Walk cycle"
        note="eighth-note steps · 6 drawings per cycle on twos · diagonal pairs"
      >
        <Grid min={150}>
          {Array.from({ length: WALK_DRAWINGS }, (_, i) => (
            <Figure key={`side-${i}`} label={`side ${i + 1}`} pose={walkAt(90, i)} size={150} />
          ))}
          {Array.from({ length: WALK_DRAWINGS }, (_, i) => (
            <Figure key={`front-${i}`} label={`¾ ${i + 1}`} pose={walkAt(35, i)} size={150} />
          ))}
        </Grid>
      </Section>

      <Section title="Pivots and limits">
        <PivotOverlay />
      </Section>

      <Section title="Silhouettes" note="black-fill readability">
        <Grid min={150}>
          {SILHOUETTES.map((p) => (
            <Figure
              key={p.label}
              label={p.label}
              pose={p.pose}
              options={{ boil: 0, silhouette: "#0d0c0b" }}
              size={150}
            />
          ))}
        </Grid>
      </Section>

      <Section title="Boil" note="three drawings, cycled at 12/s on wall time">
        <Grid min={170}>
          {[0, 1, 2].map((i) => (
            <figure key={i} className="m-0 flex flex-col items-center gap-1">
              <MascotSvg
                drawing={drawMascot(restPose(), i, { boil: 1.2 })}
                viewBox="-165 -250 330 275"
                title={`drawing ${i + 1}`}
              />
              <figcaption style={caption}>drawing {i + 1}</figcaption>
            </figure>
          ))}
        </Grid>
      </Section>

      <Section title="Swatches">
        <div className="flex flex-wrap gap-4">
          {Object.entries(PALETTE).map(([name, hex]) => (
            <div key={name} className="flex flex-col gap-2">
              <div
                style={{
                  width: 96,
                  height: 64,
                  background: hex,
                  borderRadius: 12,
                  outline: `1px solid ${PALETTE.muted}`,
                }}
              />
              <span style={{ ...caption, textAlign: "left" }}>
                {name} {hex}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
