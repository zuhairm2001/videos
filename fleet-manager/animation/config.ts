/**
 * Global constants for the Azure Kubernetes Fleet Manager promo renderer.
 * Values mirror creative/design/{palette.json, typography.json, composition.md}.
 */

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 60;
/** Total frame count (frames 0 … FRAMES-1). */
export const FRAMES = Math.round(DURATION * FPS);
/** Dot-grid pitch (px). Dot centres sit at 12 + 24·i. */
export const GRID = 24;
/** Title-safe margin (px) on all sides. */
export const MARGIN = 96;

/** Palette "Fleet Spec Sheet" (palette.json), keys identical. */
export const PALETTE = {
  ground: '#0B0F17',
  dotOff: '#1F2A3A',
  rule: '#34425A',
  paper: '#EEECE2',
  mute: '#8894A8',
  azure: '#0078D4',
  azureLight: '#83B9F9',
  fleet: '#773ADC',
  fleetLight: '#A67AF4',
  fleetPale: '#B796F9',
  drift: '#F5600A',
} as const;
export type PaletteName = keyof typeof PALETTE;

/** CSS font families registered by the asset loader (typography.json). */
export const FONTS = {
  /** Inter Tight (variable 100–900): headlines, product name. Use 600/800. */
  display: 'Inter Tight',
  /** IBM Plex Mono 400/700: spec strip, labels, chips, sub-lines. */
  mono: 'IBM Plex Mono',
  /** Doto (variable 100–900): dot-matrix numerals. Use 700/900. */
  dot: 'Doto',
} as const;
export type FontRole = keyof typeof FONTS;

/** Default weight per role (display 800, mono 400, dot 900). */
const DEFAULT_WEIGHT: Record<FontRole, number> = { display: 800, mono: 400, dot: 900 };

/** Advance of one IBM Plex Mono glyph as a fraction of the font size. */
export const MONO_ADVANCE = 0.6;

/**
 * CSS font shorthand for a role.
 * @example font('mono', 20) → '400 20px "IBM Plex Mono"'
 */
export function font(role: FontRole, px: number, weight: number = DEFAULT_WEIGHT[role]): string {
  return `${weight} ${px}px "${FONTS[role]}"`;
}
