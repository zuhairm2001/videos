# Motion Language

## Principles
- **Grid-snapped.** Positions quantise to the ASCII cell grid (12×20 px). Smooth easing underneath, stepped on output → a slightly "typed" feel.
- **Typed, not faded.** Text and objects appear by character reveal / scramble-resolve (random glyphs settle into the final ones), ~18 chars per frame.
- **Dissolve through density.** Entrances and exits move through the ASCII ramp (`@ → # → + → . → space`) instead of opacity.
- **Frame rate texture.** Render at 30 fps; ASCII layer updates on 2s (15 fps) for a hand-made step, while camera and packets stay at 30.

## Timing
| Action | Duration | Ease |
|---|---|---|
| Glyph scramble-resolve | 8–12 frames | linear, stepped |
| Packet hop (node → node) | 10–14 frames | easeInOutCubic |
| Camera push between beats | 20–30 frames | easeInOutQuart |
| Section-number slam | 4 frames in, 2 frame overshoot | easeOutBack |
| Glitch transition | 3–6 frames | none (hard cuts) |

## Signature moves
1. **Scramble-resolve** — for URLs, IPs, headlines.
2. **Packet trail** — magenta packet leaves a fading dotted trail along blue links.
3. **Registration slip** — on impacts, the blue layer offsets 4–8 px from the black/paper layer for 2 frames.
4. **Scanline wipe** — horizontal scanline bands (ref 12) as scene transitions.

## Don't
- No motion blur, no soft fades longer than 6 frames, no 3D spinning globes.
