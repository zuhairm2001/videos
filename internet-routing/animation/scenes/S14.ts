/**
 * S14 · Payoff, "Faster than a blink!" (41.00–42.50 s, frames 1230–1274).
 * The breakdown scramble-swaps into a VHS-bar comparison chart (0–400 ms → 380 px): the magenta
 * 38 ms bar extends at 41.13, the blink range bar at 41.74 (guide → satisfied, eye glyph in),
 * and eye glyph + guide blink together at 42.20 (4 f). Transition out: scanline wipe (in S15).
 */
import {
  PALETTE,
  asciiInk,
  asciiRamp,
  drawGuide,
  font,
  framesSince,
  rampIn,
  scrambleChar,
  scrambleText,
} from '../components';
import type { Scene } from '../engine/types';
import { PAYOFF, T, breakdownX, drawFootnote, drawHalo, drawHeadline } from './S13';

const SWAP = T(41.0);
const BAR1 = T(41.13);
const BAR2 = T(41.74);
const BLINK = T(42.2);

/** Chart at x 560–960, y 700–832; scale 0–400 ms → 380 px. */
const CHART = {
  x: 560,
  label1: { text: 'first reply 38 ms', y: 700 },
  bar1: { y: 742, h: 20, w: 36 },
  label2: { text: 'blink 100–400 ms', y: 772 },
  bar2: { x0: 655, x1: 940, y: 812, h: 20 },
};
/** Eye glyph `(◉)`, ink, 48 px box at x 880–928, y 640–688. */
const EYE = { cx: 904, cy: 664 };

/** Old breakdown line scrambling away: half its glyphs scrambled on f0, all on f1, gone from f2. */
function scrambleOut(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, k: number): void {
  if (k >= 2) return;
  ctx.font = font('glyph', 36);
  ctx.fillStyle = PALETTE.inkDeep;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const adv = ctx.measureText('M').width;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;
    const ch = k === 1 || i % 2 === 0 ? scrambleChar(text, i, k + 7) : text[i];
    ctx.fillText(ch, x + i * adv, y + 18);
  }
}

/** Vector eye glyph `(◉)`; `lid` 0 = open, 0.5 = half, 1 = closed. */
function eyeGlyph(ctx: CanvasRenderingContext2D, lid: number): void {
  const { cx, cy } = EYE;
  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.arc(cx, cy, 22, Math.PI - 0.9, Math.PI + 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 22, -0.9, 0.9);
  ctx.stroke();
  if (lid >= 1) {
    ctx.fillRect(cx - 12, cy - 1.5, 24, 3);
  } else {
    const ry = 11 * (1 - lid);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 11, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 5, Math.min(5, ry), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const scene: Scene = {
  id: 'S14',
  start: 41.0,
  end: 42.5,
  draw(fc) {
    const { crisp, t } = fc;
    const h = PAYOFF.halo;
    drawHalo(fc.ascii, h.cx, h.cy, 1);
    drawHeadline(crisp);
    drawFootnote(crisp, t);

    // Breakdown → chart labels (8 f): old lines scramble out over 2 f, labels resolve over 6 f.
    const ks = framesSince(SWAP, t);
    PAYOFF.breakdown.forEach((line, i) => scrambleOut(crisp, line, breakdownX(line), PAYOFF.breakdownY[i], ks));
    const f36 = font('glyph', 36);
    scrambleText(crisp, CHART.label1.text, CHART.x, CHART.label1.y, f36, PALETTE.inkDeep, SWAP + 2 / 30, t, 6);
    scrambleText(crisp, CHART.label2.text, CHART.x, CHART.label2.y, f36, PALETTE.inkDeep, SWAP + 2 / 30, t, 6);

    // Axis tick at 0 ms (ink) once the chart is up.
    if (ks >= 2) {
      crisp.fillStyle = PALETTE.ink;
      crisp.fillRect(CHART.x - 6, CHART.bar1.y - 4, 3, CHART.bar2.y + CHART.bar2.h + 4 - (CHART.bar1.y - 4));
    }

    // Magenta 38 ms bar: 36 px over 12 f, stepped per 12 px cell.
    const k1 = framesSince(BAR1, t);
    if (k1 >= 0) {
      const cells = Math.min(3, Math.ceil(((k1 + 1) * 3) / 12));
      crisp.fillStyle = PALETTE.signal;
      crisp.fillRect(CHART.x, CHART.bar1.y, cells * 12, CHART.bar1.h);
    }

    // Blink range bar 100–400 ms: hatched ink ASCII bar, 285 px over 12 f, stepped per cell.
    const k2 = framesSince(BAR2, t);
    if (k2 >= 0) {
      const { x0, x1, y, h: bh } = CHART.bar2;
      const cells = Math.min(Math.ceil((x1 - x0) / 12), Math.ceil(((k2 + 1) * (x1 - x0)) / 12 / 12));
      const w = Math.min(x1 - x0, cells * 12);
      crisp.save();
      crisp.beginPath();
      crisp.rect(x0, y, w, bh);
      crisp.clip();
      crisp.font = font('glyph', 20, 700);
      crisp.fillStyle = PALETTE.ink;
      crisp.textAlign = 'left';
      crisp.textBaseline = 'middle';
      for (let i = 0; i < cells; i++) crisp.fillText('/', x0 + i * 12, y + bh / 2 + 1);
      crisp.restore();
      crisp.strokeStyle = PALETTE.ink;
      crisp.lineWidth = 2;
      crisp.strokeRect(x0 + 1, y + 1, w - 2, bh - 2);
    }

    // Eye glyph: ASCII ramp in with the blink bar (4 f), then crisp; blinks at 42.20 (4 f).
    const kb = framesSince(BLINK, t);
    const blinking = kb >= 0 && kb < 4;
    const r = asciiRamp(rampIn(BAR2, t, 4));
    if (r.resolved) {
      eyeGlyph(crisp, blinking ? (kb === 0 || kb === 3 ? 0.5 : 1) : 0);
    } else if (r.density > 0) {
      fc.ascii.fillStyle = asciiInk(r.density);
      fc.ascii.fillRect(EYE.cx - 24, EYE.cy - 24, 48, 48);
    }

    // Guide: surprised → satisfied at 41.74; blink = 4 px nod for 4 f (her satisfied eyes are already closed).
    const box = PAYOFF.guideBox;
    const satisfied = t >= BAR2 - 1e-6;
    const b = blinking ? { ...box, y: box.y + 4 } : box;
    drawGuide(fc, satisfied ? 'satisfied' : 'surprised', b, 0, Infinity, t);
  },
};
export default scene;
