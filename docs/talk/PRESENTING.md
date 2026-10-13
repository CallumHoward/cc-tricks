# Presenting "10 tips for saving tokens"

## Run it

```sh
pnpm install
pnpm dev            # http://localhost:3000
```

Use Chrome (WebGL and WebGPU layers). Open `/`, press `F` for fullscreen and `P` for the presenter window.

The page opens on a blinking prompt, a pre-roll stop before the film. The first press plays the cold open into the
title. There is no sound: the room hears only you.

The presenter window shows the notes for the current stop, the next stop, the elapsed time against the 20-minute
budget, and how long you have been on the current stop against its speaking target (`0:42 / 0:55`).

The outro QR and the show notes link point at the Notion show notes. To point them somewhere else, set
`VITE_SHOWNOTES_URL=https://…` when running `pnpm dev` or `pnpm build`. `/shownotes` renders the same notes locally.

## Keys

| Key                    | Action                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `→` `Space` `PageDown` | Next stop: the film speeds up, plays, then brakes into slo-mo |
| `←` `PageUp`           | Back: the film rewinds to the previous stop                   |
| `Home` / `End`         | First / last stop                                             |
| digits then `Enter`    | Jump to stop N (1-based)                                      |
| `M` or `O`             | Overview of every stop                                        |
| `B` or `.`             | Blackout                                                      |
| `F`                    | Fullscreen                                                    |
| `P`                    | Presenter window (notes, current/next, timer)                 |

The same keys work in the presenter window, which forwards them to the stage; there `F` fullscreens the presenter
window itself.

In the overview the live stage zooms out into its cell. Arrows move the selection and `Enter` or a click cuts
straight to that stop. `M`, `O` or `Esc` zooms back into the current stop. Cells are numbered like digits + `Enter`.

Clicks never navigate, so links and widgets (sliders, drag a pin) take the mouse freely. Keys go to a focused widget
until you click outside it. Clickers that send `PageUp`/`PageDown` work.

A thin progress bar along the bottom edge tracks story time through the whole film.

## How it works

Every frame is a pure function of story time τ. A planner moves τ: 1× through the motion, a brake into ~0.07×
slo-mo at each stop (the hold keeps creeping and eases off near the end of its window however long you talk), a burst
back to 1× on the next press, and a fast rewind on back. Ambient motion (camera drift, particles) runs on ambient
time ρ, which follows the playhead but never drops below 0.08× at a stop, so a held frame is never fully still.

- `src/engine/` — planner, clock, stage loop, tracks, springs, GL post chain, shaders host, presenter channel
- `src/talk/` — tokens, kit (TUI, motion, data viz, widgets), mascot, script (copy + notes), timeline data, segments
- `src/talk/segments/<id>/` — one folder per segment. Each owns a τ window, including its exit tail. Every
  boundary is a match cut on the empty home prompt (`shared/home.tsx`).
- `docs/talk/COPY.md`, `docs/talk/FACTS.md` — reviewed copy and the fact table with sources

## Stills and renders

- `/?t=<τ>&w=<w>` freezes a frame (the progress bar is hidden in stills and renders); `/#<stopId>` deep-links to a
  stop.
- `pnpm overview:thumbs --base http://localhost:3000` refreshes the overview thumbnails
  (`public/talk/overview/<stopId>.webp`, 480×270) and their list in `src/talk/overview/thumbs.ts`. Run it after visual
  changes; stops without a thumbnail show a numbered title card.
- `pnpm stills --taus 1,12,20 --out stills` (Playwright + Chrome) writes PNGs and a contact sheet; set
  `STILLS_BASE_URL` if the dev server isn't on port 3102.
- Remotion: `pnpm remotion:studio` (port 3001) to scrub the film, `pnpm remotion:still frame out.png --props='{"tau":12,"w":1}'`
  for a still, `pnpm remotion:render talk out.mp4` for the whole film at 1×.
