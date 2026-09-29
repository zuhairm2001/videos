/**
 * Terminal chrome: the URL bar and the Enter keycap (S01, S02, S03, S15).
 */
import { PALETTE, font } from '../config';
import type { Box } from './guide';
import { scrambleText } from './scramble';
import { drawText } from './text';

export interface UrlBarOpts {
  /** Text size in px (64 in S01/S15, 48 in the shrunk S03–S04 bar). */
  px?: number;
  /** Block cursor after the text (caller controls blinking). */
  cursor?: boolean;
  /** Invert the border (paper frame on an inkDeep bar) — the 0.50 s "submit" flash. */
  invert?: boolean;
  /** Spinner step (|/-\ index, e.g. floor(frame/2)); omit for none. Drawn 48 px ink at `spinnerX`. */
  spinner?: number;
  /** Spinner x (default box right − 48). */
  spinnerX?: number;
  /** Scramble-resolve the text from `t0` over `frames` (else drawn plain). */
  scramble?: { t0: number; t: number; frames?: number };
  /** Draw the blocky title strip above the bar (default true). */
  titleStrip?: boolean;
}

const SPINNER = '|/-\\';

/**
 * VHS/Minitel URL bar: 3 px ink border, blocky title strip, magnifier glyph, inkDeep URL text.
 * S01 layout: box {x:120, y:900, w:468, h:96}; magnifier 48 px at x+12; text from x+72.
 */
export function urlBar(ctx: CanvasRenderingContext2D, box: Box, text: string, opts: UrlBarOpts = {}): void {
  const px = opts.px ?? 64;
  const { x, y, w, h } = box;
  ctx.save();
  ctx.fillStyle = opts.invert ? PALETTE.inkDeep : PALETTE.paper;
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = opts.invert ? PALETTE.paper : PALETTE.ink;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  if (opts.titleStrip ?? true) {
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(x, y - 14, w, 10);
    ctx.fillStyle = PALETTE.paper;
    for (let i = 0; i < 3; i++) ctx.fillRect(x + w - 16 - i * 16, y - 12, 8, 6);
  }
  const textColor = opts.invert ? PALETTE.paper : PALETTE.inkDeep;
  // magnifier ⌕ (vector, 48 px box)
  const ms = Math.round(px * 0.75);
  const mx = x + 12;
  const my = y + (h - ms) / 2;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = Math.max(3, ms / 10);
  ctx.beginPath();
  ctx.arc(mx + ms * 0.42, my + ms * 0.42, ms * 0.3, 0, Math.PI * 2);
  ctx.moveTo(mx + ms * 0.64, my + ms * 0.64);
  ctx.lineTo(mx + ms * 0.95, my + ms * 0.95);
  ctx.stroke();

  const tx = x + 12 + ms + 12;
  const ty = y + (h - px) / 2;
  const f = font('glyph', px);
  const tw = opts.scramble
    ? scrambleText(ctx, text, tx, ty, f, textColor, opts.scramble.t0, opts.scramble.t, opts.scramble.frames ?? 10)
    : drawText(ctx, text, tx, ty, { px, color: textColor });
  if (opts.cursor) {
    ctx.fillStyle = textColor;
    ctx.fillRect(tx + tw + px * 0.06, ty + px * 0.1, px * 0.5, px * 0.8);
  }
  if (opts.spinner !== undefined) {
    drawText(ctx, SPINNER[((opts.spinner % 4) + 4) % 4], opts.spinnerX ?? x + w - 48, y + (h - 48) / 2, { px: 48, color: PALETTE.ink });
  }
  ctx.restore();
}

/**
 * Enter keycap `⏎`: ink block with paper return-arrow glyph and an 8 px ink drop-shadow.
 * `press` 0..1 moves the cap down/right into its shadow by up to 8 px.
 * S01 layout: box {x:612, y:900, w:168, h:96}.
 */
export function enterKey(ctx: CanvasRenderingContext2D, box: Box, press = 0): void {
  const d = Math.round(8 * Math.max(0, Math.min(1, press)));
  const { x, y, w, h } = box;
  ctx.save();
  // shadow: hatched ink block (distinct from the solid cap)
  ctx.fillStyle = PALETTE.ink;
  for (let yy = y + 8; yy < y + h + 8; yy += 4) ctx.fillRect(x + 8, yy, w, 2);
  const cx = x + d;
  const cy = y + d;
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(cx - 3, cy - 3, w + 6, h + 6);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(cx, cy, w, h);
  // ⏎ glyph, display-64-sized, pixel strokes
  const g = 64;
  const gx = cx + (w - g) / 2;
  const gy = cy + (h - g) / 2;
  const s = 8;
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(gx + g - s - 4, gy + 6, s, g * 0.55); // down stroke
  ctx.fillRect(gx + 14, gy + 6 + g * 0.55 - s, g - s - 14, s); // left stroke
  // arrow head (stepped)
  const ax = gx + 4;
  const ay = gy + 6 + g * 0.55 - s / 2;
  for (let i = 0; i < 4; i++) ctx.fillRect(ax + i * 4, ay - 4 - i * 4, 4, 8 + i * 8);
  ctx.restore();
}
