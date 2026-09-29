/**
 * Text drawing and paint helpers shared by components.
 * Text boxes are top-anchored: `y` is the top of a line box that is `px` tall
 * (matches storyboard ranges such as "display 96 px at y 290–386").
 */
import { FONTS, MONO_ADVANCE, PALETTE, type FontRole } from '../config';

export interface TextOpts {
  /** Font role (default 'glyph' = IBM Plex Mono). */
  role?: FontRole;
  /** Font size in px (default 36). */
  px?: number;
  weight?: 400 | 700;
  /** Fill colour (default inkDeep). */
  color?: string;
  align?: 'left' | 'center' | 'right';
  /** Draw inverted: `color` becomes the plate, text in `invertText` (default paper). */
  invert?: boolean;
  invertText?: string;
  /** Plate padding in px when inverted (default 0 horizontal, plate spans the line box). */
  pad?: number;
}

/** Monospace advance (px) for a font size. Both Plex Mono and Departure Mono use 0.6 em. */
export const advance = (px: number): number => px * MONO_ADVANCE;

/** Parse the px size out of a CSS font shorthand ('700 36px "IBM Plex Mono"' → 36). */
export function fontPx(font: string): number {
  const m = /(\d+(?:\.\d+)?)px/.exec(font);
  return m ? Number(m[1]) : 16;
}

/**
 * Draw a single line of text with a top-anchored line box.
 * @returns the drawn width in px.
 */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: TextOpts = {}): number {
  const px = opts.px ?? 36;
  const color = opts.color ?? PALETTE.inkDeep;
  ctx.font = `${opts.weight ?? 400} ${px}px "${FONTS[opts.role ?? 'glyph']}"`;
  const w = ctx.measureText(text).width;
  const align = opts.align ?? 'left';
  const left = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  if (opts.invert) {
    const pad = opts.pad ?? 0;
    ctx.fillStyle = color;
    ctx.fillRect(left - pad, y, w + pad * 2, px);
  }
  ctx.fillStyle = opts.invert ? (opts.invertText ?? PALETTE.paper) : color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left, y + px / 2);
  return w;
}

/* ----------------------------------------------------- ASCII-layer paints */

/** Paint for the ascii/asciiHero sources: black at alpha `d` → ASCII glyphs of density d in the layer tint. */
export const asciiInk = (d: number): string => `rgba(0,0,0,${d})`;
/** Paint for the ascii/asciiHero sources: white at alpha `d` → 1-bit Bayer dither of density d in the layer tint. */
export const ditherInk = (d: number): string => `rgba(255,255,255,${d})`;
/** Paint for the ascii/asciiHero sources: ASCII glyphs of density `d` in an explicit colour (hex). */
export function asciiColor(hex: string, d: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${d})`;
}
