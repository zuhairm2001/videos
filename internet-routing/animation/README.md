# animation/ — frame renderer + component library

Deterministic WebGL2 renderer for the 45 s, 1080×1920, 30 fps video (frames 0–1349).
Every frame is a pure function of its frame number. Scenes plug in as modules.

```
npm run dev                                   # preview at http://localhost:5173 (?f=600 to start at a frame)
npx tsx animation/render/render-frames.ts     # all frames → render/frames/%05d.png
    [--from 0] [--to 1349] [--step 1] [--workers 6] [--out render/frames] [--gpu]
```

Preview keys: space = play/pause, ←/→ = ±1 frame, shift+←/→ = ±30 frames.
The default render uses SwiftShader (CPU WebGL). It is deterministic: rendering the same frame twice gives an identical PNG. Speed is ≈0.17 s/frame wall with 6 workers on 16 cores, so all 1350 frames take ≈4 min.
`--gpu` uses the hardware GPU. It is ≈6× faster, but its output is **not** bit-identical between runs, so use it only for previews.

## Pipeline

| Order | Layer | What you paint | Rendered as |
|---|---|---|---|
| 1 | paper ground | — | `paper` #F2EDE1 + static ±1.5 % grain |
| 2 | `ascii` source | density (see paint rules) | 12×20 ASCII cells, ramp ` .:-=+*#%@`, + 4 px Bayer dither |
| 3 | `asciiHero` source | density | 24×40 ASCII cells + 4 px Bayer dither |
| 4 | `crisp` | normal Canvas2D (lines, cards, text, packets) | as painted |
| 5 | captions | — (the engine draws them from `timeline.captions`) | crisp layer |
| 6 | global fx | `fc.fx` | ink re-colour, registration slip, scanline wipe |

**15 fps ASCII.** The ascii/asciiHero layers update on 2s. On odd frame *n* the engine calls your `draw` twice:
- once at frame *n−1*: only the ascii layers are kept, and crisp goes to a throwaway canvas;
- once at frame *n*: only crisp is kept, and the ascii layers go to throwaway canvases.

On even frames it calls `draw` once. So `draw` **must be a pure function of `fc.frame`/`fc.t`**: no state kept across calls, no `Math.random`, no `Date`. Use `hash01`/`fbm` from `components/noise`.

**Paint rules for `ascii` / `asciiHero`.** Density = alpha.
- **Black** (`asciiInk(d)` → `rgba(0,0,0,d)`) → ASCII glyphs in the layer tint (default `ink`).
- **White** (`ditherInk(d)`) → 1-bit Bayer-dither dots (4 px) in the layer tint.
- **Grey** is a mix: its black share becomes glyphs and its white share becomes dither.
- **Any other colour** (`asciiColor(hex, d)`) → glyphs in that colour (e.g. skyTint, paperShade).
- A fully covered cell picks glyph `RAMP[floor(d·10)]`. Use `rampDensity('#')` to hit an exact glyph. The ASCII layers are texture only and never carry meaning.

**Global fx** (`fc.fx`) is reset every frame. Scenes write to it, and the last write wins (the crisp pass runs last):
- `slip` (px): every **ink**-coloured pixel, in all layers, shifts right and down by `slip`. Storyboard: 6 px for 2 frames.
- `scanlineWipe` (0..1, 0 = off): reveals the frame top→bottom behind inkDeep scanline bands. Drive it over 5 f, e.g. `progress(t0, fc.t, 5)`, and keep it > 0 on the first frame.
- `inkOverride`: re-inks every `ink` pixel (S10: `PALETTE.inkDeep`). Slip still applies.
- `asciiTint` / `heroTint`: the tint for black/white paint in each layer.

**Coordinates.** Screen px, top-left origin. Text helpers are **top-anchored**: `y` is the top of a `px`-tall line box, which matches storyboard ranges such as "display 96 at y 290–386". For camera moves, wrap your drawing in `save()`/`restore()` and call `applyCamera(cam, fc.ascii, fc.asciiHero, fc.crisp)`.

## Scene contract (`engine/types.ts`)

```ts
export interface FrameCtx { frame: number; t: number; /* global s = frame/30 */ ascii: CanvasRenderingContext2D; asciiHero: CanvasRenderingContext2D; crisp: CanvasRenderingContext2D; fx: FxState; assets: Assets; timeline: Timeline; }
export interface FxState { slip: number; scanlineWipe: number; asciiTint?: string; heroTint?: string; inkOverride?: string }
export interface Scene { id: string; start: number; end: number; draw(ctx: FrameCtx, lt: number /* s since scene start */): void }
```

- One file per scene: `scenes/SNN.ts` with `const scene: Scene = {…}; export default scene;`. `scenes/index.ts` registers S01…S15 in order. The files that ship now are placeholders built with `engine/placeholder.ts`; replace their contents.
- A scene is active for `start ≤ t < end`. Keep `start`/`end` equal to `timeline/timeline.json`; if they differ, the module wins and a warning is logged. Boundaries: S09/S10 = **28.80**, all others as in the storyboard.
- All three contexts start each pass cleared, with identity transform and default state. The engine resets the transform, alpha, composite op and filter after `draw`, but you should still balance your own `save()`/`restore()` calls.
- **Scenes never draw captions.** The engine renders `timeline.captions` on top of the crisp layer every frame.
- `fc.assets.guide[pose]`: `{ width, height, line, silhouette, shade, contour, placeholder }` canvases. Use them through `drawGuide`.
- Colours: `PALETTE.{paper, paperShade, ink, inkDeep, skyTint, signal, error}`. Fonts: `font(role, px, weight?)`, where role is `'glyph'` (IBM Plex Mono 400/700), `'display'` (Departure Mono) or `'jp'` (DotGothic16).

## Components (`import { … } from '../components'`)

All components are pure functions of their arguments. Times are seconds in the same timebase as `t`; normally pass `fc.t` and global event times from the storyboard/script.

### Time, easing, grid, noise
```ts
clamp01(x); lerp(a, b, u)
linear | easeInCubic | easeOutCubic | easeInOutCubic | easeInQuart | easeOutQuart | easeInOutQuart (u) → number
easeOutBack(u, s = 1.70158)
framesSince(t0, t): number                          // whole frames since t0 (floor)
progress(t0, t, frames): number                     // 0..1, stepped per frame
tween(t0, t, frames, ease = easeInOutCubic): number
keyframes([[t, v], …], t): number                   // piecewise linear
snapX(x) / snapY(y) / snap({x, y}) / col(x) / row(y)   // 12×20 grid
hash32(a, b?, c?, d?) / hash01(…) / seedOf(str) / valueNoise(x, y, seed) / fbm(x, y, seed, octaves = 3)
```

### Text
```ts
drawText(ctx, text, x, y, { role = 'glyph', px = 36, weight = 400, color = inkDeep, align = 'left', invert?, invertText = paper, pad = 0 }): width
advance(px)                // monospace advance (0.6 em)
asciiInk(d) / ditherInk(d) / asciiColor(hex, d)   // ascii-layer paints
scrambleText(ctx, text, x, y, font, color, t0, t, frames = 10): width
    // scramble-resolve: chars appear ~18/frame, show random glyphs, settle left→right; final at t0 + frames
typeText(ctx, text, x, y, font, color, t0, t, frames = 10, cursor = false): width
scrambleState(text, k, frames) / scrambleChar(text, i, k)   // low-level
```

### Density ramp
```ts
RAMP = ' .:-=+*#%@';  RAMP_STAGES = [' ', '.', '+', '#', '@']
rampDensity(ch): number                  // alpha giving exactly that glyph
asciiRamp(progress): { stage, density, resolved }   // progress 0..1; ≥1 → 'resolved'
rampIn(t0, t, frames = 8) / rampOut(t0, t, frames = 8)   // → progress for asciiRamp (<0 = hidden)
```
Example: dissolve a block in:
```ts
const r = asciiRamp(rampIn(t0, fc.t));
if (!r.resolved && r.density > 0) { fc.ascii.fillStyle = asciiInk(r.density); fc.ascii.fillRect(x, y, w, h); } else if (r.resolved) { /* draw crisp */ }
```

### Guide
```ts
drawGuide(fc, pose: 'curious'|'pointing'|'surprised'|'satisfied', box: {x, y, w, h}, enterT, exitT, t,
          { frames = 8, stage?, flip?, shade = 1, contour = 1, align = 'center' }): stage | null
```
- The art is fitted (contain) into `box` and bottom-aligned.
- **Entrance:** from `enterT`, the silhouette ramps `space . + # @` in asciiHero over `frames`, then resolves.
- **Resolved:** crisp ink line art over dither shading and soft hero-ASCII contours.
- **Exit:** from `exitT`, the reverse ramp. Pass `Infinity` for no exit.
- `stage: '#'` forces a stage (the S15→S01 loop hold). For S01 frame 0 at `#`, use `enterT = -5/30`.
- The pointing pose points down-left. Use `flip` to mirror.

### Terminal chrome
```ts
urlBar(ctx, box, text, { px = 64, cursor?, invert?, spinner?: stepIndex, spinnerX?, scramble?: { t0, t, frames }, titleStrip = true })
    // 3 px ink border, blocky ink title strip above, vector ⌕, inkDeep text at x+72. S01 box {120, 900, 468, 96}
enterKey(ctx, box, press = 0..1)     // ink cap, paper ⏎, hatched 8 px shadow; press moves it 8 px. S01 box {612, 900, 168, 96}
sectionHeader(ctx, num, label, t0, t, { mode: 'slam' | 'typed' = 'slam', hidden? })
    // number display 96 ink @ (120, 290); label display 64 inkDeep @ (260, 306).
    // slam = 4 f in + 2 f easeOutBack overshoot, label scrambles 8 f. typed = number 4 f then label 8 f.
hudStopwatch(ctx, t, { value?, label?, invertLabel?, digitsPx?, digitsColor?, dx?, dy?, scale? })
    // plate x 640–960, y 280–420. Defaults follow the storyboard HUD table: dns/handshake/request/reply,
    // 15 fps ticks, lap inversion 4 f at 12.90, and at 36.95 it freezes at 038 ms, grows 48→72 px,
    // turns signal and shows an inverted 'first reply'. Draw it every frame in S03–S12.
hudValueAt(t) / hudPhaseAt(t) / HUD_VALUE_KEYS
```

### Network
```ts
packetCard(ctx, box, { label?, header?, lines?, px = 36, border = 2, borderColor = ink, fill = paper })
    // header = inkDeep strip with paper 36 px text; label centred 36 px inkDeep (e.g. '#01/13', 130×40)
trackedPacket(ctx, posAt: (t) => {x, y}, t, { w = 96, h = 64, halo = 12, trail = true, trailFrames = 16, id? })
    // solid signal block + 12 px paper halo; dotted signal trail sampled from posAt over the last 16 f,
    // dots shrink with age; `id` → 12 px signal frame around a paper plate with inkDeep 36 px text
routerNode(fc, cx, cy, { seed?, cols = 10, rows = 4, pulse = 0..1, label?, labelAt?: {x, y}, color = ink, halo = 0.28 })
    // pixel-block cluster 120×80 on the grid (crisp) + ASCII density halo (ascii layer) + optional label
    // (default label at cx−60, cy+44). Use halo 0.14 for decorative bleed nodes.
link(ctx, a, b, { fill = 0..1, state: 'idle' | 'error' | 'dead' = 'idle', width = 3, pitch = 12, color = ink })
    // dotted idle, solid from a up to `fill`; error = solid red; dead = paperShade dotted
```

### Texture and camera
```ts
cloudField(ctx /* fc.ascii */, box, t, { seed = 1, scale = 180, density = 0.6, threshold = 0.42, drift = 18 px/s,
           mode: 'dither' | 'ascii' = 'dither', rgb?, feather = 40 })
    // deterministic fBm clouds at 4 px resolution. For skyTint dither clouds set fc.fx.asciiTint = PALETTE.skyTint
    // (this also tints black paint in that layer; paint other ascii texture with asciiColor(PALETTE.ink, d)).
applyCamera({ x, y, zoom, sx = 540, sy = 960 }, ...ctxs)   // world (x, y) → screen (sx, sy)
```

### Captions (engine-only)
`captionRenderer(ctx, timeline.captions, frame)` draws the caption that is active on that frame. The frame range is `round(start·30) ≤ frame < round(end·30)`; no caption is drawn on frames 0–5 or 1346–1349.
- `\n` in the text forces a line break; otherwise lines wrap at 17 chars (max 2 lines).
- Words in `emphasis[]` or `[brackets]` are inverted (paper on inkDeep).
- Style: Plex Mono 64 px on a paper plate, a `>` prompt in ink, and a 4-frame scramble resolve.

## Files
- `config.ts`: sizes, palette, fonts, caption spec.
- `engine/types.ts`: the contract above.
- `engine/engine.ts`: scene selection, the two passes, captions.
- `engine/gl.ts`: the WebGL2 ASCII/dither/composite shaders and glyph atlases.
- `engine/assets.ts`: loads fonts, `timeline.json` (served at `/project/timeline/timeline.json`; if it is missing, an empty timeline is used) and the guide poses. Silhouettes and shading are derived from the line art; if a PNG is missing, a placeholder silhouette is used.
- `assets/fonts/`: IBM Plex Mono, Departure Mono, DotGothic16 (OFL; licences are next to the font files).
- `render/render-frames.ts`: the CLI above.
