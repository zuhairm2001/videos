/**
 * Scramble-resolve and typed text (motion.md signature move #1).
 */
import { fontPx } from './text';
import { framesSince } from './easing';
import { hash32, seedOf } from './noise';

/** Glyph pool used for scramble frames (ASCII only, present in every project font). */
export const SCRAMBLE_GLYPHS = '#%&*+=-/\\<>[]{}?!0123456789abcdefxyz@$';

/** Scrambled stand-in for character `i` of `text` on frame `k` (deterministic). */
export function scrambleChar(text: string, i: number, k: number): string {
  return SCRAMBLE_GLYPHS[hash32(seedOf(text), i, k) % SCRAMBLE_GLYPHS.length];
}

/**
 * Characters of `text` as they appear `k` frames into a scramble-resolve of length `frames`.
 * Characters appear left→right at ~18 chars/frame, show random glyphs, then settle left→right
 * so that everything is final at k ≥ frames. Returns null before the start (k < 0).
 */
export function scrambleState(text: string, k: number, frames = 10): string[] | null {
  if (k < 0) return null;
  const n = text.length;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    const appear = Math.floor(i / 18);
    if (k < appear) break;
    const resolve = Math.min(frames, Math.round(frames * (0.4 + (0.6 * (i + 1)) / n)));
    out.push(ch === ' ' || k >= resolve ? ch : scrambleChar(text, i, k));
  }
  return out;
}

function drawChars(ctx: CanvasRenderingContext2D, chars: string[], x: number, y: number, font: string, color: string): number {
  const px = fontPx(font);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const adv = ctx.measureText('M').width;
  for (let i = 0; i < chars.length; i++) if (chars[i] !== ' ') ctx.fillText(chars[i], x + i * adv, y + px / 2);
  return chars.length * adv;
}

/**
 * Draw `text` scramble-resolving: random glyphs settle into the final string over `frames` frames
 * starting at `t0` (s). Nothing is drawn before `t0`; the final text is drawn after.
 * Monospace layout (char i at x + i·advance). `y` is the top of the line box.
 * @param font CSS font shorthand, e.g. font('glyph', 48)
 * @param t0 start time (s), same timebase as `t`
 * @returns drawn width (px)
 */
export function scrambleText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  t0: number,
  t: number,
  frames = 10,
): number {
  const chars = scrambleState(text, framesSince(t0, t), frames);
  return chars ? drawChars(ctx, chars, x, y, font, color) : 0;
}

/**
 * Typed text: characters appear left→right over `frames` frames from `t0`; the newest character
 * shows a scramble glyph for its first frame. Optional block cursor after the last character.
 * @returns drawn width (px)
 */
export function typeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  t0: number,
  t: number,
  frames = 10,
  cursor = false,
): number {
  const k = framesSince(t0, t);
  if (k < 0) return 0;
  const shown = Math.min(text.length, Math.ceil((text.length * (k + 1)) / Math.max(1, frames)));
  const chars = text.slice(0, shown).split('');
  if (shown < text.length && shown > 0 && chars[shown - 1] !== ' ') chars[shown - 1] = scrambleChar(text, shown - 1, k);
  const w = drawChars(ctx, chars, x, y, font, color);
  if (cursor) {
    const px = fontPx(font);
    ctx.fillRect(x + w + px * 0.05, y + px * 0.1, px * 0.5, px * 0.8);
  }
  return w;
}
