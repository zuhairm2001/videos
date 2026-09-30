# animation/ — frame renderer + component library

Deterministic WebGL2 renderer for the 60 s, 1920×1080, 30 fps Fleet Manager promo (frames 0–1799).
Every frame is a pure function of its frame number. Scenes plug in as modules.

```
npm run dev                                     # preview at http://localhost:5173 (?f=900 to start at a frame)
                                                # http://localhost:5173/?gallery (dev-only component gallery, ←/→ = page)
npx tsx animation/render/render-frames.ts       # all frames → render/frames/%05d.png
    [--from 0] [--to 1799] [--step 1] [--workers 6] [--out render/frames] [--gpu]
npx tsx animation/render/render-frames.ts --gallery [out.png]   # gallery pages stacked → creative/references/animation/component-gallery.png
```

Preview keys: space = play/pause, ←/→ = ±1 frame, shift+←/→ = ±30 frames.
The default render uses SwiftShader (CPU WebGL) and is deterministic: rendering the same frame twice, or with a different worker count, gives a byte-identical PNG. Steady state is ≈0.46 s/frame per worker and ≈0.085 s/frame wall with 6 workers on 16 cores, so all 1800 frames take ≈2.5–3 min (placeholder scenes; real scenes will cost more). More than 6 workers doesn't help.
`--gpu` uses the hardware GPU. It is faster, but its output is not guaranteed bit-identical, so use it only for previews.

## Pipeline

| Order | What | Who draws it |
|---|---|---|
| 1 | `ground` fill | engine |
| 2 | idle dot field: 80×45 dots, 4 px `dotOff`, centres at 12 + 24·i | engine |
| 3 | chrome: corner crosshairs, top spec strip, bottom strip | engine |
| 4 | the active scene's `draw(fc, lt)` on `fc.g` (main) and `fc.glow` | you |
| 5 | WebGL composite: `g` + bloom(`glow`), static grain (±1 %), vignette (8 % at the corners) | engine |

**Glow layer.** `fc.glow` starts each frame transparent. Anything drawn there is **not shown directly**. It is blurred (a tight ≈6 px bloom and a wide ≈16 px bloom) and **added** to the main layer. To make something glow, draw it on `g` and draw it again on `glow`, usually at alpha 0.3–0.6. Alpha on `glow` scales the light. Don't paint large areas at full alpha, because they wash out to white. The components already do this for lit dots (glyphs, wave, `dotNumber({glow})`, `pictogram({glow})`, the section numeral).

**Chrome (engine-only).** Scenes never draw it.
- Crosshairs are centred 48 px in from each corner, with ±12 px arms of 1.5 px `rule`.
- Top strip (mono 18 `mute`, tracking 0.16, baseline y 60): `AZURE KUBERNETES FLEET MANAGER` at x 96, and `SPEC 0N / …` right-aligned to 1824. The section text comes from `SECTION_BY_SCENE` in `engine/chrome.ts` (S01–S03 FLEET, S04–S05 SAFE UPDATES, S06–S07 PLACEMENT, S08–S09 GOVERNANCE, S10 REACH, S11 GET STARTED). Both halves type on over 0.00–0.40 s. At the first scene of each later section, the right half scramble-resolves over 6 f.
- Bottom strip (baseline y 1040): `MM:SS:FF   F 0000` on the left and `[ FLEET ]` on the right.

**Determinism.** `draw` must be a pure function of `fc.frame` / `fc.t`: no `Math.random`, no `Date`, and no state carried across frames. Use `hash01(...ints)` / `seedOf(str)`. Caches of pure values are fine.

**Coordinates.** Screen px with a top-left origin, 1920×1080. Glyphs, pictograms and plates are placed by their **top-left**. Dots and arrows are placed by their **centre**. Text helpers are **top-anchored**: `y` is the top of a `px`-tall line box. For scenes that move the camera, use `withCamera`.

## Scene contract (`engine/types.ts`)

```ts
interface FrameCtx {
  frame: number;                      // 0 … 1799
  t: number;                          // global seconds = frame / 30
  g: CanvasRenderingContext2D;        // main layer (already has ground, field, chrome)
  glow: CanvasRenderingContext2D;     // bloom source, transparent each frame
  cue(id: string): number;            // timeline.cues[id] in seconds; throws on an unknown id
  timeline: Timeline;                 // timeline/timeline.json (scenes, cues, music, audio.sfx)
  assets: {
    icon: CanvasImageSource;          // fleet-manager-icon.svg rasterised at 576×576
    iconDots(cols, rows): (string | null)[][];  // [row][col] → icon fill hex ('#0078D4' …, upper-case) or null (transparent); cached
  };
}
interface Scene { id: string; start: number; end: number; draw(fc: FrameCtx, lt: number /* s since scene start */): void }
```

- Use one file per scene, `scenes/SNN.ts`, ending in `export default scene;`. `scenes/index.ts` registers S01…S11 in order. The shipped files are placeholders built with `engine/placeholder.ts` (a small `PLACEHOLDER · id · beat` label plus a component demo). Replace a file's whole contents, and delete `engine/placeholder.ts` once no scene uses it.
- Take `start`/`end` from the timeline instead of hard-coding them: `const { start, end } = sceneSpan('S05')` (from `engine/timeline`). A scene is active for `start ≤ t < end`, and the last scene also owns t = 60.
- Read every event time with `fc.cue('s05.stage1.sweep')` and pass `fc.t` as `t`. All component times are **global seconds**, in the same timebase as `fc.t`.
- The engine resets the transform, alpha, composite op, filter and letterSpacing on both layers before and after `draw`. Balance your own `save()`/`restore()` calls.
- Every draw helper **multiplies** by the context's current `globalAlpha`. So `g.globalAlpha = 0.4; clusterGlyph(…)` dims the whole glyph, which is how to do a power-off.
- `config.ts`: `W=1920, H=1080, FPS=30, DURATION=60, FRAMES=1800, GRID=24, MARGIN=96`; `PALETTE.{ground, dotOff, rule, paper, mute, azure, azureLight, fleet, fleetLight, fleetPale, drift}`.
  - `font(role, px, weight?)` returns a CSS font string. Roles and default weights: `'display'` = Inter Tight, 800 (variable, so any weight works; use 600/700/800). `'mono'` = IBM Plex Mono, 400 (400 or 700 only). `'dot'` = Doto, 900 (variable; use 700/900).
  - Doto is loaded from `assets/fonts/Doto-Rond100.ttf`, an instance of `Doto-Variable.ttf` pinned to `ROND=100` (round dots) with fonttools `varLib.instancer`. Canvas can't set `font-variation-settings`, and the default `ROND=0` draws square pixels.

## Components (`import { … } from '../components'`)

All components are pure. `fc` components draw on `fc.g` (plus `fc.glow` where noted); `ctx` components draw on whatever context you pass.

### Time, easing, hashing
```ts
clamp01(x); lerp(a, b, u)
linear | easeOutCubic | easeInOutCubic | easeOutQuart | easeInOutQuart (u) → number
easeOutBack(u, s = 1.70158)                     // motion.md slam uses s = 1.4
framesSince(t0, t): number                      // whole frames since t0 (floor, negative before)
progress(t0, t, frames): 0..1                   // stepped per frame; 0 before t0, 1 from t0 + frames
tween(t0, t, frames, ease = easeInOutCubic)     // ease(progress(…))
keyframes([[t, v], …], t)                       // piecewise linear, held outside
hash32(...ints) → uint32; hash01(...ints) → [0, 1); seedOf(str) → uint32
```

### Dots
```ts
dot(ctx, x, y, diam, color, alpha = 1)          // filled circle centred on (x, y)
powerOn(t0, t) → 0 | 0.4 | 1                    // motion.md power-on: 40 % on frame 0, 100 % from frame 1
powerOff(t0, t) → 1 | 0.4 | 0                   // the reverse
dotLine(ctx, a, b, { pitch = 6, diam = 1.5, color, fill = 1, alpha = 1 })
    // dots every `pitch` px from a toward b; `fill` 0..1 draws only the first part (draw-on).
    // Membership links: { pitch: 6, diam: 1.5, color: fleetLight, fill: tween(t0, t, 12) }
dotArrow(ctx, x, y, p, color, dir = 'right', alpha = 1)
    // 3×5-dot solid triangle ▶ centred on (x, y), dots 0.8·p. dir: 'right'|'left'|'up'|'down'|radians.
    // Flock arrows: p = 6. Draw it again on fc.glow at ~0.5 alpha for a lit trail.
```

### Cluster glyph
```ts
clusterGlyph(fc, x, y, p, state, { build = 1, alpha = 1, bob = 0, glow = 1 })
glyphBuild(t0, t) → build value for a glyph powering on at t0 (6 f: row r is at 40 % on frame r, then 100 %)
GLYPH_STATES = ['unmanaged', 'drift', 'member', 'updated', 'match', 'dim']
```
- The glyph is 5×5 dots at pitch `p` with its top-left at (x, y), so it is 5p square: p 24 → 120 px hero, 12 → 60 px, 8 → 40 px background (use `alpha: 0.5`), 6 → 30 px globe markers. Dots are 0.8·p across and the four corner dots are 50 % size.
- Cells: the outer **ring**; the **bars** (cols 1 and 3, rows 1–3); the **centre** column (col 2, rows 1–3).

| state | ring | bars | centre | glow |
|---|---|---|---|---|
| unmanaged | `dotOff` + 1 px `mute` outline | same | `dotOff` | none; whole glyph at 60 % |
| drift | `drift` | `drift` 50 % | `dotOff` | yes |
| member | `fleetLight` | `fleetPale` | `dotOff` | yes |
| updated | `azure` | `azureLight` | `dotOff` | yes |
| match | `fleet` | `fleetPale` | `fleetLight` (filled) | yes |
| dim | `dotOff` | `dotOff` | `dotOff` | none |

- `build` (0..1) powers rows on top→bottom. On a row's 40 % frame its glow is 2.5× (the "overshoot glow"). Pass `glyphBuild(fc.cue('s01.glyph'), fc.t)`. `build ≤ 0` draws nothing.
- `bob` offsets y in px (see `waveRipple`). `glow` scales the bloom (0 = off).

```ts
glyphLabel(fc, x, y, lines, { color = mute, px = 18, align = 'center', alpha = 1 }) → bottom y
    // mono labels under a glyph, tracking 0.04, line height 1.3·px. Centre them on the glyph: x = gx + 2.5·p, y = gy + 5p + 8
```

### Type
Mono helpers use a fixed monospace advance of `px · (0.6 + tracking)`.
```ts
text(ctx, s, x, y, { font, color = paper, align = 'left', tracking = 0 /* em */, alpha = 1 }) → width
measure(ctx, s, font, tracking = 0) → width;  fontPx(font) → px
headlineRise(fc, lines, x, y, { px = 84, maxWidth?, align = 'left', color = paper, weight = 800, t0, t, outT? })
    → { px, lineH, bottom }
    // Inter Tight, tracking −0.025 em, line height 1.05·px. Masked rise: each line's mask wipes open
    // from the bottom while the text slides up 24 px over 10 f (easeOutQuart), 3 f between lines.
    // outT: mask-down (slide down 24 px + mask closes) over 8 f. maxWidth autofits every line together,
    // stepping 1 px at a time down to 72 px (or down to `px` if that is smaller); it never goes below that.
    // The layout is returned even before t0, so you can place a sub-line at bottom + 40.
    // Hero titles: { px: 120 | 96, align: 'center', x: 960 }.
typeOn(fc, s, x, y, font, color, t0, t, cps = 90, tracking = 0) → width
    // 3 chars/frame by default, the newest char flashes a scramble glyph, block cursor while typing
scramble(fc, s, x, y, font, color, t0, t, frames = 6, tracking = 0) → width
    // random glyphs settle left→right; final from t0 + frames. Version flips: scramble('1.31', …, frames: 4)
chip(fc, s, x, y, { fill?, color = paper, px = 22, invert?, scaleY = 1, t0?, t? }) → box
    // mono 700, tracking 0.1. Text is drawn as given, so include the brackets yourself: '[ PASS ]'.
    // fill → plate (0.5 em / 0.3 em padding, 4 px corners). invert → plate in `color`, text in ground:
    //   [ PASS ]      { invert: true, color: PALETTE.azure, px: 24 }
    //   [ APPROVED ]  { invert: true, color: PALETTE.fleetLight }  flip: scaleY: progress(t0, t, 3)
    // t0 → the text types on
plate(fc, box, color, radius = 8, alpha = 1)     // filled rounded rect (policy panel, stamps, CTA, tiles)
dotNumber(fc, value, x, y, px, color, align = 'left', { weight = 900, glow = 0 }) → width
    // Doto numerals/strings. Counter: (…, 200, paper); S05 counter: (…, 64, paper, 'right', { weight: 700 })
```

### Layout blocks
```ts
splitBlock(fc, { chip, headline, sub, t0Chip, t0Headline, t0Sub, outT? }) → { headlineBottom, subBottom }
    // composition.md left block: chip at (96, 180) mono 700 22 fleetLight (types on);
    // headline at (96, 230), 84 px autofit to 648; sub mono 28 mute at headline bottom + 40,
    // 38 px lines typed one after another. outT: headline masks down, chip + sub power off.
sectionSlam(fc, num, label, t0, outT)
    // S04/S06/S08 in full: numeral Doto 900 240 fleetLight at (96, 360) scales 1.25 → 1 (4 f + 3 f settle,
    // easeOutBack 1.4) with glow; label mono 700 44 paper, tracking 0.12, at (440, 470) types over 8 f from
    // t0 + 0.15; rule hairline x 440 → 1824 at y 540 over 10 f; outT: everything slides 48 px left over 8 f
    // with stepped alpha. Usage: sectionSlam(fc, '01', 'SAFE UPDATES', fc.cue('s04.slam'), fc.cue('s04.out'))
```

### Signature helpers
```ts
waveRipple(fc, y, x0, x1, t0, t, { amp = 12, rows = 3 }) → bobAt(x)
    // azureLight halftone band (dots every 12 px, rows 8 px apart) centred on y. The front crosses from
    // x0 − 240 to x1 + 240 in 30 f from t0; dot size and displacement follow a gaussian envelope around the
    // front. Drawn on g + glow. Nothing is drawn outside the 30 f pass.
    // bobAt(x) → the glyph offset (|bob| ≤ 6 px) at x for this frame, 0 outside the pass. Call it
    // BEFORE drawing the glyphs: const bobAt = waveRipple(…); clusterGlyph(fc, gx, gy, 12, 'member', { bob: bobAt(gx + 30) })
constructionCircles(fc, cx, cy, radii, t0, t)    // rule 1.5 px arcs drawing from 12 o'clock over 18 f (easeInOutCubic)
crosshairLines(fc, cx, cy, alpha = 0.4)          // full-width + full-height 1 px rule lines
pictogram(fc, name, x, y, p, color, { glow = 0, alpha = 1 })
    // dot icon, top-left (x, y), dots 0.75·p. 7×7: check, quota, netpol, rbac, upgrade; 9×7: monitor, dns, globe.
    // Stamps: p = 6 on a paper plate (no glow). Bento tiles: p = 6–8 azureLight. Bitmaps are in PICTOGRAMS.
withCamera(fc, { x, y, zoom, sx = 960, sy = 540 }, fn)
    // transforms g AND glow so world (x, y) lands on screen (sx, sy). To scale about a pivot, use sx = x, sy = y:
    // S10 pull-back: withCamera(fc, { x: 1300, y: 480, zoom: lerp(1, 0.25, tween(t0, fc.t, 24, easeInOutQuart)), sx: 1300, sy: 480 }, () => drawS09(…))
```

### Icon
`fc.assets.iconDots(18, 18)` returns the S11 target grid (use a 16 px pitch centred at (960, 400): cell (c, r) is centred at (824 + 16c, 264 + 16r)). `fc.g.drawImage(fc.assets.icon, 816, 256, 288, 288)` draws the crisp vector at the same place.

## Notes for scene authors
- IBM Plex Mono has no `✓`. The browser falls back to a different font (it looks like `√`), although the fixed-advance layout still holds. Use `pictogram(fc, 'check', …)` next to the text instead.
- The S07 policy panel spec (360 px wide, mono 20) is too narrow for `kind: ClusterResourcePlacement` (30 ch × 12 px + padding). Make the plate ≥ 392 px wide or set that line at 18 px.

## Files
- `config.ts`: sizes, palette, fonts.
- `engine/types.ts`: the contract. `engine/timeline.ts`: `TIMELINE`, `cue(id)`, `sceneSpan(id)` (static import of `timeline/timeline.json`; Vite reloads on change).
- `engine/engine.ts`: scene selection, layers, `renderFrame(n)`, `renderWith(n, draw)` (used by the gallery).
- `engine/chrome.ts`: dot field + chrome + `SECTION_BY_SCENE`. `engine/gl.ts`: bloom/grain/vignette compositor (bloom constants at the top). `engine/assets.ts`: fonts, icon, `iconDots`.
- `engine/placeholder.ts`: placeholder scene helper (delete once all scenes are real).
- `components/`: `time.ts`, `dots.ts`, `glyph.ts`, `text.ts`, `layout.ts`, barrel `index.ts`.
- `gallery.ts`: the dev-only gallery pages. `main.ts` + `index.html`: preview, `?render`, `?gallery`.
- `render/render-frames.ts`: the CLI above.
