/**
 * S02 · Promise "race a blink" (2.50–5.50 s, frames 75–164).
 * Same layout as S01 (URL bar + spinner, keycap, header). Hero stopwatch dial on the right;
 * at 5.30 it shrinks and flies into the HUD box (x 640–960, y 280–420), handing off to the S03 HUD.
 */
import {
  PALETTE,
  asciiInk,
  drawGuide,
  drawText,
  easeInOutQuart,
  enterKey,
  font,
  framesSince,
  lerp,
  link,
  progress,
  rampDensity,
  scrambleText,
  typeText,
  urlBar,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';
import { GUIDE_BOX, KEY_BOX, SPINNER_X, URL_BOX, URL_PX, drawHeadline, spinnerStep, topBleedBand } from './S01';

const DIAL_CX = 756;
const DIAL_CY = 620;
const DIAL_R = 160; // ASCII ring centre radius (ring spans 576–936 × 440–800 with its 40 px width)
const FLY_T0 = 5.3;
const FLY_FRAMES = 6;

/** ASCII dial ring (ascii layer) + thin crisp ink rim, drawn clockwise from 12 o'clock over 12 f from 2.50. */
function drawDial(fc: FrameCtx, t: number, fly: number, flyK: number): void {
  const sweep = progress(2.5, t, 12);
  if (sweep <= 0) return;
  // 4.40: density pulse @ ↔ # over 6 f
  const pk = framesSince(4.4, t);
  let ch = pk >= 0 && pk < 6 && ((pk >> 1) & 1) === 0 ? '#' : '@';
  // fly-out: ring dissolves back down the ramp while the plate takes over
  if (flyK >= 0) ch = ['#', '+', '.', ' ', ' ', ' '][Math.min(5, flyK)];
  const a0 = -Math.PI / 2;
  const a1 = a0 + sweep * Math.PI * 2;
  if (ch !== ' ') {
    const { ascii } = fc;
    ascii.save();
    ascii.strokeStyle = asciiInk(rampDensity(ch));
    ascii.lineWidth = 40;
    ascii.beginPath();
    ascii.arc(DIAL_CX, DIAL_CY, DIAL_R, a0, a1);
    ascii.stroke();
    ascii.restore();
  }
  if (fly > 0) return;
  const { crisp } = fc;
  crisp.save();
  crisp.strokeStyle = PALETTE.ink;
  crisp.lineWidth = 3;
  crisp.beginPath();
  crisp.arc(DIAL_CX, DIAL_CY, 128, a0, a1);
  crisp.stroke();
  // 12 minute ticks inside the rim, revealed with the sweep
  crisp.fillStyle = PALETTE.ink;
  for (let i = 0; i < 12; i++) {
    if (i / 12 > sweep) break;
    const a = a0 + (i / 12) * Math.PI * 2;
    crisp.save();
    crisp.translate(DIAL_CX + Math.cos(a) * 116, DIAL_CY + Math.sin(a) * 116);
    crisp.rotate(a);
    crisp.fillRect(-6, -2, i % 3 === 0 ? 16 : 10, 4);
    crisp.restore();
  }
  crisp.restore();
}

/** Eye glyph `(◉)` in ink 48 px at x 830–926, y 460–508; blinks over 4 f at 3.75. */
function drawEyeGlyph(ctx: CanvasRenderingContext2D, t: number, x: number, y: number, s: number): void {
  const px = 48 * s;
  drawText(ctx, '(', x, y, { px, color: PALETTE.ink });
  drawText(ctx, ')', x + px * 1.2, y, { px, color: PALETTE.ink });
  const cx = x + px * 0.9;
  const cy = y + px / 2;
  const bk = framesSince(3.75, t);
  const open = bk < 0 || bk >= 4 ? 1 : bk === 0 || bk === 3 ? 0.4 : 0;
  ctx.save();
  ctx.fillStyle = PALETTE.ink;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3 * s;
  if (open > 0) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16 * s, 16 * s * open, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 8 * s, 8 * s * open, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(cx - 18 * s, cy - 2 * s, 36 * s, 4 * s);
  }
  ctx.restore();
}

/**
 * Local helper: close the pointing pose's eyes for the 4.77 blink (4 f). The guide art has no
 * blink frame, so paper patches cover both eyes and ink lids are drawn over them.
 * Eye rects are in pointing.png pixels (810×762), mapped through the same contain-fit as drawGuide.
 */
function drawGuideBlink(fc: FrameCtx, t: number): void {
  const k = framesSince(4.77, t);
  if (k < 0 || k >= 4) return;
  const art = fc.assets.guide.pointing;
  const s = Math.min(GUIDE_BOX.w / art.width, GUIDE_BOX.h / art.height);
  const ox = GUIDE_BOX.x + (GUIDE_BOX.w - art.width * s) / 2;
  const oy = GUIDE_BOX.y + GUIDE_BOX.h - art.height * s;
  const { crisp } = fc;
  crisp.save();
  for (const [x0, y0, x1, y1] of [
    [408, 283, 462, 320],
    [518, 236, 564, 278],
  ]) {
    const X0 = ox + x0 * s;
    const Y0 = oy + y0 * s;
    const W = (x1 - x0) * s;
    const H = (y1 - y0) * s;
    crisp.fillStyle = PALETTE.paper;
    crisp.fillRect(X0, Y0, W, H);
    crisp.strokeStyle = PALETTE.ink;
    crisp.lineWidth = 3;
    crisp.beginPath();
    crisp.moveTo(X0 + 1, Y0 + H * 0.45);
    crisp.quadraticCurveTo(X0 + W / 2, Y0 + H * 0.95, X0 + W - 1, Y0 + H * 0.4);
    crisp.stroke();
  }
  crisp.restore();
}

const scene: Scene = {
  id: 'S02',
  start: 2.5,
  end: 5.5,
  draw(fc) {
    const { crisp, t } = fc;
    topBleedBand(fc, t);

    // guide: surprised (from S01 1.40) → pointing at 2.90; blink 4.77; ramp exit 5.10–5.37
    if (t < 2.9) drawGuide(fc, 'surprised', GUIDE_BOX, 0, Infinity, t);
    else {
      const stage = drawGuide(fc, 'pointing', GUIDE_BOX, 0, 5.1, t);
      if (stage === 'resolved') drawGuideBlink(fc, t);
    }

    // 2.90: dotted path stub grows 0→160 px down-left from the URL bar's left edge (12 f)
    const stub = progress(2.9, t, 12) * 160;
    if (stub > 0) {
      const a = { x: URL_BOX.x, y: URL_BOX.y + URL_BOX.h / 2 };
      link(crisp, a, { x: a.x - stub * Math.SQRT1_2, y: a.y + stub * Math.SQRT1_2 }, { fill: 0 });
    }

    urlBar(crisp, URL_BOX, 'example.com', { px: URL_PX, spinner: spinnerStep(t), spinnerX: SPINNER_X });
    enterKey(crisp, KEY_BOX, 0);
    drawHeadline(crisp, t);

    // ---- hero stopwatch, flying into the HUD box from 5.30 (6 f, easeInOutQuart)
    const flyK = framesSince(FLY_T0, t);
    const fly = easeInOutQuart(progress(FLY_T0, t, FLY_FRAMES));
    drawDial(fc, t, fly, flyK);
    if (fly > 0) {
      // plate grows from the dial's box into the HUD plate
      const x = lerp(576, 640, fly);
      const y = lerp(440, 280, fly);
      const w = lerp(360, 320, fly);
      const h = lerp(360, 140, fly);
      crisp.fillStyle = PALETTE.paper;
      crisp.fillRect(x, y, w, h);
      crisp.strokeStyle = PALETTE.ink;
      crisp.lineWidth = 3;
      crisp.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      typeText(crisp, 't · slow-mo', x + 16, y + 4, font('glyph', 36), PALETTE.inkDeep, FLY_T0 + 2 / 30, t, 3);
    } else {
      // paper plates keep digits and label clear of the dial texture
      crisp.fillStyle = PALETTE.paper;
      if (t >= 2.5) crisp.fillRect(583, 572, 346, 96);
      if (t >= 3.93) crisp.fillRect(600, 700, 317, 48);
    }
    const dpx = Math.round(lerp(96, 48, fly));
    scrambleText(crisp, '000 ms', lerp(583, 656, fly), lerp(572, 326, fly), font('display', dpx), PALETTE.inkDeep, 2.5, t, 10);
    const lpx = Math.round(lerp(48, 36, fly));
    const lfont = fly > 0 ? font('glyph', lpx) : font('display', lpx);
    scrambleText(crisp, 'vs. a blink', lerp(600, 656, fly), lerp(700, 380, fly), lfont, PALETTE.inkDeep, 3.93, t, 8);
    // eye glyph appears with the stopwatch; shrinks away during the fly
    if (framesSince(2.5, t) >= 4 && flyK < 3) {
      const s = 1 - fly;
      drawEyeGlyph(crisp, t, lerp(830, 900, fly), lerp(460, 290, fly), Math.max(0.3, s));
    }
  },
};
export default scene;
