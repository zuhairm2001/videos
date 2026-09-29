/**
 * Global constants for the "How the Internet Routes a Request" renderer.
 * Values mirror creative/design/{palette,typography,composition}.json/md.
 */

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const DURATION = 45;
/** Total frame count (frames 0 … FRAMES-1). */
export const FRAMES = Math.round(DURATION * FPS);

/** ASCII texture cell (px). 90 columns × 96 rows. */
export const CELL_W = 12;
export const CELL_H = 20;
/** Hero ASCII cell (px) used by the `asciiHero` source layer. 45 × 48 cells. */
export const HERO_CELL_W = 24;
export const HERO_CELL_H = 40;
/** Pixel size of one 1-bit Bayer-dither dot. */
export const DITHER_PX = 4;
/** Density ramp, index 0 = empty, 9 = densest. */
export const RAMP = ' .:-=+*#%@';

/** Palette "Printed Terminal" (palette.json). */
export const PALETTE = {
  paper: '#F2EDE1',
  paperShade: '#E2DACA',
  ink: '#1F3FE0',
  inkDeep: '#0B1A7A',
  skyTint: '#9DB4F2',
  signal: '#E6168A',
  error: '#E0331F',
} as const;
export type PaletteName = keyof typeof PALETTE;

/** CSS font-family names registered by the asset loader. */
export const FONTS = {
  /** IBM Plex Mono 400/700: ASCII atlas, IPs, logs, captions. */
  glyph: 'IBM Plex Mono',
  /** Departure Mono: oversized pixel headlines, section numbers. */
  display: 'Departure Mono',
  /** DotGothic16: decorative Japanese accents. */
  jp: 'DotGothic16',
} as const;
export type FontRole = keyof typeof FONTS;

/** Advance width of one monospace glyph as a fraction of font size (Plex Mono and Departure Mono are both 0.6 em). */
export const MONO_ADVANCE = 0.6;

/**
 * Build a CSS font shorthand.
 * @example font('glyph', 36) → '400 36px "IBM Plex Mono"'
 */
export function font(role: FontRole, px: number, weight: 400 | 700 = 400): string {
  return `${weight} ${px}px "${FONTS[role]}"`;
}

/** Safe areas (composition.md). */
export const SAFE = { x0: 120, x1: 960, y0: 270, y1: 1245, notchX: 780, notchY: 840 } as const;

/** Caption spec (storyboard global conventions). */
export const CAPTION = {
  px: 64,
  lineH: 76,
  x: 120,
  plateX: 108,
  plateY: 1080,
  line1Y: 1090,
  pad: 12,
  maxChars: 17,
  maxLines: 2,
  promptX: 72,
  resolveFrames: 4,
  /** No caption is drawn on frames < noneBefore or > noneAfter (loop match). */
  noneBefore: 6,
  noneAfter: 1345,
} as const;
