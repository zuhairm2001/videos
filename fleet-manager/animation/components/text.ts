/**
 * Type: masked headline rise, mono type-on, scramble-resolve, chips, plates, dot numerals.
 * All text helpers are TOP-anchored: `y` is the top of a `px`-tall line box.
 */
import { font as fontOf, FONTS, MONO_ADVANCE, PALETTE } from '../config';
import type { FrameCtx } from '../engine/types';
import { easeOutQuart, framesSince, hash32, seedOf } from './time';

export type Align = 'left' | 'center' | 'right';
export type Box = { x: number; y: number; w: number; h: number };

/** Pixel size parsed from a CSS font shorthand. */
export function fontPx(font: string): number {
  const m = /(\d+(?:\.\d+)?)px/.exec(font);
  return m ? Number(m[1]) : 16;
}

/** Set font, colour, tracking (em) and a middle baseline on `ctx`. */
function setText(ctx: CanvasRenderingContext2D, font: string, color: string, trackingEm = 0): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.letterSpacing = `${trackingEm * fontPx(font)}px`;
}

/** Width of `text` in `font` with tracking (em), without the trailing letter-space. */
export function measure(ctx: CanvasRenderingContext2D, text: string, font: string, trackingEm = 0): number {
  setText(ctx, font, '#000', trackingEm);
  const w = ctx.measureText(text).width - (text.length ? trackingEm * fontPx(font) : 0);
  ctx.letterSpacing = '0px';
  return w;
}

/** Plain text, top-anchored. Returns the drawn width. */
export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  { font, color = PALETTE.paper, align = 'left', tracking = 0, alpha = 1 }: { font: string; color?: string; align?: Align; tracking?: number; alpha?: number },
): number {
  const w = measure(ctx, s, font, tracking);
  const px = fontPx(font);
  const x0 = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  setText(ctx, font, color, tracking);
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.fillText(s, x0, y + px / 2);
  ctx.globalAlpha = prev;
  ctx.letterSpacing = '0px';
  return w;
}

/* ---------------------------------------------------------------- headline */

export interface HeadlineOpts {
  /** Start size (px). Default 84 (headline); 96/120 for hero titles. */
  px?: number;
  /** Autofit: if any line is wider, all lines step down 1 px at a time to ≥ 72 px (or `px` if smaller). */
  maxWidth?: number;
  align?: Align;
  color?: string;
  /** Font weight. Default 800. */
  weight?: number;
  t0: number;
  t: number;
  /** Mask-down start (s): lines slide down 24 px behind the mask over 8 f. */
  outT?: number;
}

/**
 * Inter Tight headline, masked rise (motion.md): each line slides up 24 px from behind its mask
 * over 10 f (easeOutQuart), 3 f between lines. Tracking −0.025 em, line height 1.05.
 * `x` is the left edge / centre / right edge per `align`; `y` is the top of line 1.
 * @returns layout `{ px, lineH, bottom }` (bottom = y + lines·lineH), valid even before t0
 */
export function headlineRise(fc: FrameCtx, lines: readonly string[], x: number, y: number, o: HeadlineOpts): { px: number; lineH: number; bottom: number } {
  const { g } = fc;
  const weight = o.weight ?? 800;
  const tracking = -0.025;
  let px = o.px ?? 84;
  const minPx = Math.min(px, 72);
  if (o.maxWidth) {
    while (px > minPx && Math.max(...lines.map((l) => measure(g, l, fontOf('display', px, weight), tracking))) > o.maxWidth) px--;
  }
  const lineH = Math.round(px * 1.05);
  const f = fontOf('display', px, weight);
  const layout = { px, lineH, bottom: y + lines.length * lineH };
  const kOut = o.outT === undefined ? -1 : framesSince(o.outT, o.t);
  lines.forEach((line, i) => {
    const k = framesSince(o.t0, o.t) - 3 * i;
    if (k < 0) return;
    const rise = easeOutQuart((k + 1) / 10);
    const fall = kOut < 0 ? 0 : easeOutQuart((kOut + 1) / 8);
    if (fall >= 1) return;
    const top = y + i * lineH;
    // mask = the line box (plus descender room); its visible part grows with the rise and shrinks with the fall
    const boxH = lineH + Math.round(px * 0.12);
    const shown = boxH * rise * (1 - fall);
    const dy = 24 * (1 - rise) + 24 * fall;
    g.save();
    g.beginPath();
    g.rect(0, top + (kOut < 0 ? boxH - shown : 0) - px * 0.1, fc.g.canvas.width, shown + px * 0.1);
    g.clip();
    text(g, line, x, top + dy + (lineH - px) / 2, { font: f, color: o.color ?? PALETTE.paper, align: o.align ?? 'left', tracking });
    g.restore();
  });
  return layout;
}

/* ---------------------------------------------------------------- mono type */

/** Glyph pool for scramble frames (ASCII, present in every project font). */
export const SCRAMBLE_GLYPHS = '#%&*+=-/<>[]{}?!0123456789abcdefxyz@$';

function scrambleChar(s: string, i: number, k: number): string {
  return SCRAMBLE_GLYPHS[hash32(seedOf(s), i, k) % SCRAMBLE_GLYPHS.length];
}

/** Draw characters at a fixed monospace advance (Plex Mono 0.6 em + tracking). Returns width. */
function drawMono(ctx: CanvasRenderingContext2D, chars: readonly string[], x: number, y: number, font: string, color: string, trackingEm: number): number {
  const px = fontPx(font);
  const adv = px * (MONO_ADVANCE + trackingEm);
  setText(ctx, font, color);
  ctx.letterSpacing = '0px';
  for (let i = 0; i < chars.length; i++) if (chars[i] !== ' ') ctx.fillText(chars[i], x + i * adv, y + px / 2);
  return chars.length ? chars.length * adv - trackingEm * px : 0;
}

/**
 * Mono label typing on at `cps` chars/s (90 = 3 chars/frame) from `t0`, with a block cursor while
 * typing; the newest character flashes a scramble glyph for one frame. Nothing before t0.
 * `font` should be a mono font (monospace layout). `tracking` in em.
 * @returns drawn width (px)
 */
export function typeOn(fc: FrameCtx, s: string, x: number, y: number, font: string, color: string, t0: number, t: number, cps = 90, tracking = 0): number {
  const k = framesSince(t0, t);
  if (k < 0) return 0;
  const shown = Math.min(s.length, Math.ceil(((k + 1) * cps) / 30));
  const chars = s.slice(0, shown).split('');
  const typing = shown < s.length;
  if (typing && shown > 0 && chars[shown - 1] !== ' ') chars[shown - 1] = scrambleChar(s, shown - 1, k);
  const w = drawMono(fc.g, chars, x, y, font, color, tracking);
  if (typing) {
    const px = fontPx(font);
    fc.g.fillStyle = color;
    fc.g.fillRect(x + shown * px * (MONO_ADVANCE + tracking), y + px * 0.1, px * 0.55, px * 0.85);
  }
  return w;
}

/**
 * Scramble-resolve: random glyphs settle left→right into `s` over `frames` frames from `t0`
 * (final from t0 + frames on). Nothing before t0. Mono layout. Returns drawn width.
 */
export function scramble(fc: FrameCtx, s: string, x: number, y: number, font: string, color: string, t0: number, t: number, frames = 6, tracking = 0): number {
  const k = framesSince(t0, t);
  if (k < 0) return 0;
  const n = s.length;
  const chars: string[] = [];
  for (let i = 0; i < n; i++) {
    const settle = Math.round(frames * (0.35 + (0.65 * (i + 1)) / n));
    chars.push(s[i] === ' ' || k >= settle ? s[i] : scrambleChar(s, i, k));
  }
  return drawMono(fc.g, chars, x, y, font, color, tracking);
}

/* ---------------------------------------------------------------- plates & chips */

/** Filled rounded rect on fc.g. */
export function plate(fc: FrameCtx, box: Box, color: string, radius = 8, alpha = 1): void {
  const { g } = fc;
  const prev = g.globalAlpha;
  g.globalAlpha = prev * alpha;
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(box.x, box.y, box.w, box.h, radius);
  g.fill();
  g.globalAlpha = prev;
}

export interface ChipOpts {
  /** Plate colour; omit for a bare label. */
  fill?: string;
  /** Text colour (default paper). With `invert`, the plate takes this colour and the text is `ground`. */
  color?: string;
  /** Mono size (default 22). Bold, tracking 0.1 em. */
  px?: number;
  invert?: boolean;
  /** Vertical scale 0..1 about the chip's centre (the gate "flip"). Default 1. */
  scaleY?: number;
  /** When set, the text types on from t0 (needs `t`). */
  t0?: number;
  t?: number;
}

/**
 * Mono bold chip, top-left at (x, y). Text is drawn as given: include brackets yourself (`[ PASS ]`).
 * Plate padding: 0.5 em horizontal, 0.3 em vertical, radius 4.
 * @returns the chip box (plate box, or text box when there is no plate)
 */
export function chip(fc: FrameCtx, s: string, x: number, y: number, o: ChipOpts = {}): Box {
  const px = o.px ?? 22;
  const tracking = 0.1;
  const f = fontOf('mono', px, 700);
  const textW = s.length * px * (MONO_ADVANCE + tracking) - tracking * px;
  const plateCol = o.invert ? (o.color ?? PALETTE.paper) : o.fill;
  const textCol = o.invert ? PALETTE.ground : (o.color ?? PALETTE.paper);
  const padX = plateCol ? Math.round(px * 0.5) : 0;
  const padY = plateCol ? Math.round(px * 0.3) : 0;
  const box = { x, y, w: textW + 2 * padX, h: px + 2 * padY };
  const sy = o.scaleY ?? 1;
  if (sy <= 0) return box;
  const { g } = fc;
  g.save();
  if (sy !== 1) {
    const cy = y + box.h / 2;
    g.translate(0, cy);
    g.scale(1, sy);
    g.translate(0, -cy);
  }
  if (plateCol) plate(fc, box, plateCol, 4);
  if (o.t0 !== undefined) typeOn(fc, s, x + padX, y + padY, f, textCol, o.t0, o.t ?? fc.t, 90, tracking);
  else drawMono(g, s.split(''), x + padX, y + padY, f, textCol, tracking);
  g.restore();
  return box;
}

/* ---------------------------------------------------------------- dot numerals */

/**
 * Doto dot-matrix numeral/string, top-anchored. `glow` (0..1) also paints it on fc.glow.
 * Counters: 900 at 200 px; section numbers 900 at 240 px; small counters 700 at 64 px.
 * Returns the drawn width.
 */
export function dotNumber(
  fc: FrameCtx,
  value: number | string,
  x: number,
  y: number,
  px: number,
  color: string,
  align: Align = 'left',
  { weight = 900, glow = 0 }: { weight?: number; glow?: number } = {},
): number {
  const s = String(value);
  const f = `${weight} ${px}px "${FONTS.dot}"`;
  const w = text(fc.g, s, x, y, { font: f, color, align });
  if (glow > 0) text(fc.glow, s, x, y, { font: f, color, align, alpha: glow });
  return w;
}
