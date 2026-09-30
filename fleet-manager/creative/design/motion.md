# Motion Language

## Principles
- **Power on, don't fade.** Dots come on in two steps: a frame at 40 % brightness with a small overshoot glow, then full. They go off the same way in reverse. The only true fades are glows and bands, and none lasts longer than 8 frames (01, 05).
- **Grid-snapped rest, eased travel.** Anything moving uses a smooth ease, but every resting position lands on the 24 px dot pitch.
- **Many move as one.** Group motion is always staggered along a field. Each dot's start is delayed by its distance from a source point (hub, wave front, or the left edge of a stage). Staggers use 0.6–1.2 frames per grid step (04, 12, 13).
- **Type resolves like a readout.** Mono labels type on at about 3 characters per frame with a block cursor. Headlines use a masked rise instead: each line slides up 24 px from behind a mask over 10 frames with easeOutQuart. Dot numerals count up or down one step per frame (17, 28).
- **Stepped at 30 fps.** There is no motion blur. The camera moves at 30 fps with easeInOutQuart.

## Timing
| Action | Duration | Ease |
|---|---|---|
| Dot power-on (per dot) | 2 f (40 % → 100 %) | stepped |
| Cluster glyph build (25 dots) | 6 f, row stagger 1 f | stepped |
| Membership link draw | 10–14 f | easeInOutCubic |
| Stage fill (row of clusters) | 30–45 f | linear sweep, dots power on as sweep passes |
| Headline line reveal | 10 f, 3 f between lines | easeOutQuart |
| Mono label type-on | ~3 chars/f | linear |
| Section slam (`01`) | 4 f in from scale 1.25 + 3 f settle | easeOutBack(1.4) |
| Camera push / pull | 24–40 f | easeInOutQuart |
| Wave ripple pass | 30 f across frame | sine phase, linear |
| Hard cut transitions | 0 f, on bar lines | — |

## Signature moves
1. **Snap to fleet.** Scattered, off-grid clusters fly to grid positions on one shared baseline. The order they land in is set by a wave front that sweeps outward from the hub, and each lands with a 1-dot overshoot (04, 16).
2. **Stage sweep.** An azure dot front sweeps along each stage row. A `PASS` chip types on, then an `[ APPROVED ]` gate chip flips before the next stage starts (08, 09, 17).
3. **Flock.** Many small dot-arrows fly in formation from the hub and split toward the matched clusters (12). The trails are dotted and fade over 12 f.
4. **Wave ripple.** An `azureLight` halftone wave passes under the fleet, and every glyph bobs 0–6 px with a sine phase that follows its x position (04, 14). Used at 3 moments only: joining at 8 s, the end of placement at 34 s, and the final lock at 54 s.
5. **Dot collapse.** At the CTA, every dot on screen collapses into the icon's container positions (the dot vortex in reverse, 13). The final icon then cross-steps to crisp vector.

## Don't
- No motion blur, no bounce larger than 1 dot, and no fade longer than 8 frames. No fast 3D spins: the only sustained rotation is the S10 globe's 6°/s meridian drift.
- Don't move more than two things independently at once. Anything more must move as a field.
