/**
 * Cluster glyph: the Fleet Manager container as a 5×5 dot cell (storyboard "Shared elements").
 */
import { PALETTE } from '../config';
import type { FrameCtx } from '../engine/types';
import { dot } from './dots';
import { clamp01, framesSince } from './time';

export type GlyphState = 'unmanaged' | 'drift' | 'member' | 'updated' | 'match' | 'dim';
export const GLYPH_STATES: readonly GlyphState[] = ['unmanaged', 'drift', 'member', 'updated', 'match', 'dim'];

type Part = 'ring' | 'bar' | 'fill';
/** Cell role at [row][col]: outer ring, the two inner bars (cols 1, 3 · rows 1–3), and the centre column. */
const ROLE: Part[][] = [0, 1, 2, 3, 4].map((r) =>
  [0, 1, 2, 3, 4].map((c): Part => (r === 0 || r === 4 || c === 0 || c === 4 ? 'ring' : c === 2 ? 'fill' : 'bar')),
);

/** [colour, alpha] per part and state; null = part not drawn. */
const STYLE: Record<GlyphState, Record<Part, readonly [string, number] | null>> = {
  unmanaged: { ring: [PALETTE.dotOff, 1], bar: [PALETTE.dotOff, 1], fill: null },
  drift: { ring: [PALETTE.drift, 1], bar: [PALETTE.drift, 0.5], fill: null },
  member: { ring: [PALETTE.fleetLight, 1], bar: [PALETTE.fleetPale, 1], fill: null },
  updated: { ring: [PALETTE.azure, 1], bar: [PALETTE.azureLight, 1], fill: null },
  match: { ring: [PALETTE.fleet, 1], bar: [PALETTE.fleetPale, 1], fill: [PALETTE.fleetLight, 1] },
  dim: { ring: [PALETTE.dotOff, 1], bar: [PALETTE.dotOff, 1], fill: [PALETTE.dotOff, 1] },
};
const UNLIT = [PALETTE.dotOff, 1] as const;

export interface GlyphOpts {
  /** Build-in progress 0..1: rows power on top→bottom, 1 f apart, each 40 % → 100 %. Default 1. Use `glyphBuild(t0, t)`. */
  build?: number;
  /** Overall alpha multiplier (background clusters: 0.5–0.6). Default 1. */
  alpha?: number;
  /** Vertical offset in px (wave bob). Default 0. */
  bob?: number;
  /** Glow strength on fc.glow for lit states. Default 1; 0 = none. Doubled on a row's 40 % power-on frame. */
  glow?: number;
}

/**
 * `build` value for a glyph that starts powering on at `t0` (6 f total: row r is at 40 % on frame r
 * and 100 % from frame r+1). 0 before t0, 1 from frame 5 on.
 */
export function glyphBuild(t0: number, t: number): number {
  const k = framesSince(t0, t);
  return k < 0 ? 0 : clamp01((k + 1) / 6);
}

/**
 * Draw a cluster glyph with its top-left at (x, y); dot pitch `p` (12 → 60 px glyph, 24 → 120 px hero,
 * 8 → background, 6 → globe markers). Dots are 0.8·p across; corner dots 50 % size.
 * States: unmanaged (dim outline, 60 %), drift, member, updated, match, dim.
 */
export function clusterGlyph(fc: FrameCtx, x: number, y: number, p: number, state: GlyphState, opts: GlyphOpts = {}): void {
  const { build = 1, alpha = 1, bob = 0, glow = 1 } = opts;
  if (build <= 0 || alpha <= 0) return;
  const u = clamp01(build) * 6;
  const style = STYLE[state];
  const d = 0.8 * p;
  const lit = state !== 'unmanaged' && state !== 'dim';
  const a0 = state === 'unmanaged' ? 0.6 * alpha : alpha;
  const { g } = fc;
  for (let r = 0; r < 5; r++) {
    const level = u >= r + 2 ? 1 : u >= r + 1 ? 0.4 : 0;
    if (!level) continue;
    for (let c = 0; c < 5; c++) {
      // unlit cells (fill: null) stay visible as dotOff, like the idle field
      const s = style[ROLE[r][c]] ?? UNLIT;
      const corner = (r === 0 || r === 4) && (c === 0 || c === 4);
      const dd = corner ? d * 0.5 : d;
      const cx = x + (c + 0.5) * p;
      const cy = y + (r + 0.5) * p + bob;
      dot(g, cx, cy, dd, s[0], s[1] * a0 * level);
      if (state === 'unmanaged' && ROLE[r][c] !== 'fill') {
        const prev = g.globalAlpha;
        g.globalAlpha = prev * a0 * level;
        g.strokeStyle = PALETTE.mute;
        g.lineWidth = Math.max(1, p / 12);
        g.beginPath();
        g.arc(cx, cy, dd / 2, 0, Math.PI * 2);
        g.stroke();
        g.globalAlpha = prev;
      }
      if (lit && glow > 0 && ROLE[r][c] !== 'fill') dot(fc.glow, cx, cy, dd * 1.1, s[0], Math.min(1, 0.4 * glow * s[1] * alpha * (level < 1 ? 2.5 : 1)));
    }
  }
}
