/**
 * S13 · Payoff, the number (38.00–41.00 s, frames 1140–1229).
 * Push-in from the S12 wide map: the map ramps out (6 f) while the frozen HUD `038 ms` flies and
 * re-typesets 72 → 180 px into the headline `38 ms`; registration slip at 38.20; guide (surprised)
 * ramps in at 38.90; breakdown scramble-resolves at 39.28; footnote types at 40.10.
 * Also exports the payoff layout shared with S14/S15.
 */
import {
  PALETTE,
  applyCamera,
  asciiInk,
  drawGuide,
  drawText,
  easeInOutQuart,
  font,
  framesSince,
  lerp,
  progress,
  rampDensity,
  scrambleText,
  typeText,
  type Box,
} from '../components';
import type { FrameCtx, FxState, Scene } from '../engine/types';
import S12 from './S12';

/** Event time snapped to its storyboard frame round(t × 30). */
export const T = (s: number): number => Math.round(s * 30) / 30;

export const PAYOFF = {
  /** Headline `38 ms`, display 180 signal, x 300–840, y 450–630. */
  num: { text: '38 ms', x: 300, y: 450, px: 180 },
  /** `first reply`, display 48 inkDeep, x 523–840, y 640–688. */
  label: { text: 'first reply', x: 523, y: 640, px: 48 },
  /** Dither halo behind the number (ink, 20 % density). */
  halo: { cx: 570, cy: 530, rx: 380, ry: 150, d: 0.2 },
  /** Breakdown, glyph 36 inkDeep, right-aligned to x 960, y 700–830. */
  breakdown: ['dns            12 ms', 'handshake    + 17 ms', 'request→reply + 9 ms'],
  breakdownRight: 960,
  breakdownY: [700, 747, 794],
  /** Footnote, glyph 36 inkDeep, x 120–682, y 1010–1046. */
  footnote: { text: 'first reply, not full page', x: 120, y: 1010, t0: T(40.1), frames: 8 },
  /** Guide box (surprised / satisfied), x 120–528, y 650–1000. */
  guideBox: { x: 120, y: 650, w: 408, h: 350 } as Box,
  guideEnter: T(38.9),
} as const;

/** Left x of a right-aligned glyph-36 breakdown line. */
export const breakdownX = (line: string): number => PAYOFF.breakdownRight - line.length * 36 * 0.6;

/** Ink dither halo (ascii layer, white paint → Bayer dots in the layer tint), scaled by `s`. */
export function drawHalo(ascii: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  const { rx, ry, d } = PAYOFF.halo;
  if (s <= 0) return;
  ascii.save();
  ascii.translate(cx, cy);
  ascii.scale(rx * s, ry * s);
  const g = ascii.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(255,255,255,${d})`);
  g.addColorStop(0.55, `rgba(255,255,255,${d})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ascii.fillStyle = g;
  ascii.fillRect(-1, -1, 2, 2);
  ascii.restore();
}

/** Final headline number + `first reply` label (crisp). */
export function drawHeadline(crisp: CanvasRenderingContext2D): void {
  const { num, label } = PAYOFF;
  drawText(crisp, num.text, num.x, num.y, { role: 'display', px: num.px, color: PALETTE.signal });
  labelPlate(crisp);
  drawText(crisp, label.text, label.x, label.y, { role: 'display', px: label.px, color: PALETTE.inkDeep });
}

/** Paper plate behind `first reply` so it reads over the halo dither. */
function labelPlate(crisp: CanvasRenderingContext2D): void {
  const { label } = PAYOFF;
  crisp.fillStyle = PALETTE.paper;
  crisp.fillRect(label.x - 8, label.y, label.text.length * label.px * 0.6 + 16, label.px);
}

/** Footnote typing in at 40.10 (8 f), then held. */
export function drawFootnote(crisp: CanvasRenderingContext2D, t: number): void {
  const f = PAYOFF.footnote;
  typeText(crisp, f.text, f.x, f.y, font('glyph', 36), PALETTE.inkDeep, f.t0, t, f.frames);
}

/* ------------------------------------------------ S12 hand-off (push-in) */

const S12_LAST = 1139;
const T0 = 38.0;
/** HUD row 2 / row 3 at the end of S12 (hudStopwatch defaults after the 36.95 freeze). */
const HUD_DIGITS = { x: 656, y: 326, px: 72 };
const HUD_LABEL = { x: 656, y: 404, px: 36 };

let off: { a: CanvasRenderingContext2D; h: CanvasRenderingContext2D; c: CanvasRenderingContext2D; m: CanvasRenderingContext2D } | null = null;
function offscreen() {
  if (!off) {
    const mk = (w: number, h: number) => {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      return cv.getContext('2d', { willReadFrequently: w < 200 })!;
    };
    off = { a: mk(1080, 1920), h: mk(1080, 1920), c: mk(1080, 1920), m: mk(90, 96) };
  }
  for (const k of ['a', 'h', 'c', 'm'] as const) {
    const ctx = off[k];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  return off;
}

/** Render S12 frozen at `frame` into the given contexts (the others get throwaway targets). */
function renderS12(fc: FrameCtx, frame: number, ascii: CanvasRenderingContext2D, hero: CanvasRenderingContext2D, crisp: CanvasRenderingContext2D): FxState {
  const fx: FxState = { slip: 0, scanlineWipe: 0 };
  const t = frame / 30;
  for (const c of [ascii, hero, crisp]) c.save();
  S12.draw({ ...fc, frame, t, ascii, asciiHero: hero, crisp, fx }, t - S12.start);
  for (const c of [ascii, hero, crisp]) c.restore();
  return fx;
}

/** Push-in camera: zoom 1 → 3 toward the HUD over 24 f (easeInOutQuart). */
function pushCam(t: number) {
  const p = easeInOutQuart(progress(T0, t, 24));
  return { p, cam: { x: lerp(540, 800, p), y: lerp(960, 362, p), zoom: 1 + 2 * p } };
}

/**
 * The S12 map at 38.00 (resolved), then ramping out through ASCII density: '@' then '+' (on the
 * 15 fps ASCII steps), gone at 38.20. Stage is keyed to the ASCII frame so both passes agree.
 */
function drawS12Remnant(fc: FrameCtx, t: number): void {
  const kA = framesSince(T0, (fc.frame - (fc.frame % 2)) / 30);
  if (kA < 0 || kA >= 6) return;
  const { cam } = pushCam(t);
  const o = offscreen();
  // ASCII layers of S12's last shown frame (1138), crisp of 1139. Unused targets go to the small
  // mask canvas as a sink, cleared again before it is used.
  const fxA = renderS12(fc, S12_LAST - 1, o.a, o.h, o.m);
  renderS12(fc, S12_LAST, o.m, o.m, o.c);
  o.m.clearRect(0, 0, 90, 96);
  if (fxA.asciiTint) fc.fx.asciiTint = fxA.asciiTint;
  if (fxA.heroTint) fc.fx.heroTint = fxA.heroTint;
  // The HUD digits and label leave the plate: paper over them in the frozen image (redrawn by us).
  o.c.fillStyle = PALETTE.paper;
  o.c.fillRect(HUD_DIGITS.x - 2, HUD_DIGITS.y, 300, HUD_DIGITS.px + 2);
  o.c.fillRect(HUD_LABEL.x - 5, HUD_LABEL.y, 280, HUD_LABEL.px);

  const asciiAlpha = kA === 0 ? 1 : kA === 2 ? 0.6 : 0.3;
  for (const [src, dst] of [[o.a, fc.ascii], [o.h, fc.asciiHero]] as const) {
    dst.save();
    dst.globalAlpha = asciiAlpha;
    applyCamera(cam, dst);
    dst.drawImage(src.canvas, 0, 0);
    dst.restore();
  }
  if (kA === 0) {
    fc.crisp.save();
    applyCamera(cam, fc.crisp);
    fc.crisp.drawImage(o.c.canvas, 0, 0);
    fc.crisp.restore();
    return;
  }
  // Crisp map → per-cell ink mask → ASCII glyph silhouette at the ramp stage density.
  const density = rampDensity(kA === 2 ? '@' : '+');
  const m = o.m;
  m.save();
  m.imageSmoothingEnabled = true;
  m.imageSmoothingQuality = 'high';
  m.scale(1 / 12, 1 / 20);
  applyCamera(cam, m);
  m.drawImage(o.c.canvas, 0, 0);
  m.restore();
  const px = m.getImageData(0, 0, 90, 96).data;
  const [pr, pg, pb] = [0xf2, 0xed, 0xe1];
  const lumP = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
  for (let j = 0; j < 96; j++) {
    for (let i = 0; i < 90; i++) {
      const q = (j * 90 + i) * 4;
      const a = px[q + 3] / 255;
      if (a <= 0) continue;
      // un-premultiplied colour composited over paper
      const r = px[q] * a + pr * (1 - a);
      const g = px[q + 1] * a + pg * (1 - a);
      const b = px[q + 2] * a + pb * (1 - a);
      const dark = Math.max(0, 1 - (0.2126 * r + 0.7152 * g + 0.0722 * b) / lumP);
      const mask = Math.min(1, dark * 4);
      if (mask < 0.08) continue;
      fc.ascii.fillStyle = asciiInk(density * mask);
      fc.ascii.fillRect(i * 12, j * 20, 12, 20);
    }
  }
}

/* ------------------------------------------------------------------ scene */

const scene: Scene = {
  id: 'S13',
  start: 38.0,
  end: 41.0,
  draw(fc) {
    const { crisp, t } = fc;
    const { num, label, halo } = PAYOFF;

    drawS12Remnant(fc, t);

    // Number flight: HUD `038 ms` 72 px → headline 180 px, lands 38.20 (6 f).
    const k = framesSince(T0, t);
    const u = easeInOutQuart(progress(T0, t, 6));
    const { p } = pushCam(t);
    const tx = lerp(HUD_DIGITS.x, num.x - num.px * 0.6, u); // '38' of '038' lands on x 300
    const ty = lerp(HUD_DIGITS.y, num.y, u);
    const npx = lerp(HUD_DIGITS.px, num.px, u);
    // Halo appears once the map is gone (38.20) and keeps growing with the push-in to 38.80.
    if (k >= 6) drawHalo(fc.ascii, halo.cx, halo.cy, lerp(0.55, 1, p));

    if (k < 6) {
      drawText(crisp, '038 ms', tx, ty, { role: 'display', px: npx, color: PALETTE.signal });
      drawText(crisp, label.text, lerp(HUD_LABEL.x, label.x, u), lerp(HUD_LABEL.y, label.y, u), {
        px: lerp(HUD_LABEL.px, label.px, u),
        invert: true,
        pad: 4,
      });
    } else {
      drawText(crisp, num.text, num.x, num.y, { role: 'display', px: num.px, color: PALETTE.signal });
      labelPlate(crisp);
      scrambleText(crisp, label.text, label.x, label.y, font('display', label.px), PALETTE.inkDeep, T(38.2), t, 6);
    }
    // Registration slip: blue plate offset 6 px for 2 f as the number lands.
    const ks = framesSince(T(38.2), t);
    if (ks >= 0 && ks < 2) fc.fx.slip = 6;

    drawGuide(fc, 'surprised', PAYOFF.guideBox, PAYOFF.guideEnter, Infinity, t);

    // Breakdown: scramble-resolve 10 f each, staggered 4 f, from 39.28.
    PAYOFF.breakdown.forEach((line, i) => {
      scrambleText(crisp, line, breakdownX(line), PAYOFF.breakdownY[i], font('glyph', 36), PALETTE.inkDeep, T(39.28) + (4 * i) / 30, t, 10);
    });

    drawFootnote(crisp, t);
  },
};
export default scene;
