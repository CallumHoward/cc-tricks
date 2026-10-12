# Presenting "10 tips for saving tokens"

## Run it

```sh
pnpm install
pnpm dev            # http://localhost:3000
```

Use Chrome (WebGL and WebGPU layers). Open `/`, press `F` for fullscreen and `P` for the presenter window.

## Keys

| Key                          | Action                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| `→` `Space` `PageDown` click | Next stop: the film speeds up, plays, then brakes into slo-mo |
| `←` `PageUp`                 | Back: the film rewinds to the previous stop                   |
| `Home` / `End`               | First / last stop                                             |
| digits then `Enter`          | Jump to stop N (1-based)                                      |
| `B` or `.`                   | Blackout                                                      |
| `F`                          | Fullscreen                                                    |
| `M`                          | Mute sound                                                    |
| `P`                          | Presenter window (notes, current/next, timer)                 |

Clickers that send `PageUp`/`PageDown` work. Widgets in the slides take mouse input; click outside them (or press
`Esc`) to give the arrow keys back to navigation.

## How it works

Every frame is a pure function of story time τ. A planner moves τ: 1× through the motion, a brake into ~0.035×
slo-mo at each stop (the hold keeps creeping however long you talk), a burst back to 1× on the next press, and a fast
rewind on back. Sound cues are synthesized on the fly from the storyboard's cue list and are silent during holds; the
first key press unlocks audio.

- `src/engine/` — planner, clock, stage loop, tracks, springs, GL post chain, shaders host, audio, presenter channel
- `src/talk/` — tokens, kit (TUI, motion, data viz, widgets), mascot, script (copy + notes), timeline data, segments
- `docs/talk/COPY.md`, `docs/talk/FACTS.md` — reviewed copy and the fact table with sources

## Stills and renders

- `/?t=<τ>&w=<w>` freezes a frame; `/#<stopId>` deep-links to a stop.
- `pnpm stills --taus 1,12,20 --out stills` (Playwright + Chrome) writes PNGs and a contact sheet; set
  `STILLS_BASE_URL` if the dev server isn't on port 3102.
- Remotion: `pnpm remotion:studio` (port 3001) to scrub the film, `pnpm remotion:still frame out.png --props='{"tau":12,"w":1}'`
  for a still, `pnpm remotion:render talk out.mp4` for the whole film at 1×.
