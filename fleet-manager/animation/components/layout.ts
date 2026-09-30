/**
 * Composite components: glyph labels, the split-layout block, section slam, wave ripple,
 * construction geometry, dot pictograms, camera.
 */
import { font, H, PALETTE, W } from '../config';
import type { FrameCtx } from '../engine/types';
import { dot, powerOff } from './dots';
import { chip, headlineRise, measure, text, typeOn, type Align } from './text';
import { easeInOutCubic, easeOutBack, framesSince, tween } from './time';

/* ---------------------------------------------------------------- labels */

/**
 * Mono label lines under a glyph (default mono 18 `mute`, centred on x, line height 1.3·px).
 * `y` is the top of the first line. `alpha` multiplies. Returns the bottom y.
 */
export function glyphLabel(
  fc: FrameCtx,
  x: number,
  y: number,
  lines: readonly string[],
  { color = PALETTE.mute, px = 18, align = 'center', alpha = 1 }: { color?: string; px?: number; align?: Align; alpha?: number } = {},
): number {
  const lh = Math.round(px * 1.3);
  lines.forEach((l, i) => text(fc.g, l, x, y + i * lh, { font: font('mono', px), color, align, tracking: 0.04, alpha }));
  return y + lines.length * lh;
}

/* ---------------------------------------------------------------- split layout */

export interface SplitBlockOpts {
  /** Section chip text, e.g. '01 · SAFE UPDATES' (mono 700 22 `fleetLight` at (96, 180)). */
  chip: string;
  /** Headline lines (Inter Tight 800 84, top y 230, autofit to 648 px, min 72). */
  headline: readonly string[];
  /** Sub-lines (mono 28 `mute`, top = headline bottom + 40, line height 38, ≤ 38 chars). */
  sub: readonly string[];
  t0Chip: number;
  t0Headline: number;
  t0Sub: number;
  /** Exit start: headline masks down, chip and sub power off (2 f). */
  outT?: number;
}

/**
 * The composition.md split-layout left block (columns 1–5, x 96–744). Sub-lines type on one after
 * another at 3 chars/f. Returns `{ headlineBottom, subBottom }`.
 */
export function splitBlock(fc: FrameCtx, o: SplitBlockOpts): { headlineBottom: number; subBottom: number } {
  const t = fc.t;
  const off = o.outT === undefined ? 1 : powerOff(o.outT, t);
  const { g } = fc;
  const hl = headlineRise(fc, o.headline, 96, 230, { px: 84, maxWidth: 648, t0: o.t0Headline, t, outT: o.outT });
  g.save();
  g.globalAlpha = off;
  if (off > 0) chip(fc, o.chip, 96, 180, { color: PALETTE.fleetLight, px: 22, t0: o.t0Chip, t });
  const top = hl.bottom + 40;
  const lh = 38;
  let start = o.t0Sub;
  if (off > 0) {
    o.sub.forEach((line, i) => {
      typeOn(fc, line, 96, top + i * lh, font('mono', 28), PALETTE.mute, start, t);
      start += Math.ceil(line.length / 3) / 30;
    });
  }
  g.restore();
  return { headlineBottom: hl.bottom, subBottom: top + o.sub.length * lh };
}

/* ---------------------------------------------------------------- section slam */

/**
 * S04/S06/S08 section card. At `t0`: numeral (Doto 900 240 `fleetLight`, left 96, top 360) slams
 * from scale 1.25 → 1 over 4 f + 3 f settle (easeOutBack 1.4). At t0 + 0.15: label (mono 700 44
 * `paper`, tracking 0.12, x 440, top 470) types on over 8 f and a `rule` hairline draws
 * x 440 → 1824 at y 540 over 10 f. At `outT`: all slide 48 px left over 8 f with stepped alpha.
 */
export function sectionSlam(fc: FrameCtx, num: string, label: string, t0: number, outT: number): void {
  const t = fc.t;
  const k = framesSince(t0, t);
  if (k < 0) return;
  const kOut = framesSince(outT, t);
  if (kOut >= 8) return;
  const alpha = kOut < 0 ? 1 : 1 - 0.25 * Math.floor(kOut / 2 + 1);
  const dx = kOut < 0 ? 0 : -48 * easeInOutCubic((kOut + 1) / 8);
  const { g, glow } = fc;
  const nf = font('dot', 240, 900);
  const nw = measure(g, num, nf);
  const s = 1.25 + (1 - 1.25) * easeOutBack(k / 7, 1.4);
  const cx = 96 + nw / 2;
  const cy = 360 + 120;
  for (const ctx of [g, glow]) {
    ctx.save();
    ctx.translate(cx + dx, cy);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
    text(ctx, num, 96, 360, { font: nf, color: PALETTE.fleetLight, alpha: ctx === g ? alpha : 0.3 * alpha });
    ctx.restore();
  }
  const tl = t0 + 0.15;
  if (framesSince(tl, t) < 0) return;
  g.save();
  g.translate(dx, 0);
  g.globalAlpha = alpha;
  const lf = font('mono', 44, 700);
  const cps = (label.length / 8) * 30;
  typeOn(fc, label, 440, 470, lf, PALETTE.paper, tl, t, cps, 0.12);
  const u = tween(tl, t, 10, easeInOutCubic);
  g.fillStyle = PALETTE.rule;
  g.fillRect(440, 539.25, (1824 - 440) * u, 1.5);
  g.restore();
}

/* ---------------------------------------------------------------- wave ripple */

/**
 * Wave ripple (signature 4): an `azureLight` halftone band (`rows` rows of dots, 12 px pitch,
 * 8 px row gap) centred on `y` sweeps x0 → x1. The front crosses from x0 − 240 to x1 + 240 in 30 f
 * from `t0`; displacement amp·env·sin, dot size ∝ envelope (halftone). Drawn on g and glow.
 * @returns bobAt(x): the glyph bob (px, |bob| ≤ 6) at column x for this frame; 0 outside the pass
 */
export function waveRipple(
  fc: FrameCtx,
  y: number,
  x0: number,
  x1: number,
  t0: number,
  t: number,
  { amp = 12, rows = 3 }: { amp?: number; rows?: number } = {},
): (x: number) => number {
  const k = framesSince(t0, t);
  if (k < 0 || k > 30) return () => 0;
  const front = x0 - 240 + ((x1 - x0 + 480) * k) / 30;
  const env = (x: number) => Math.exp(-(((x - front) / 180) ** 2));
  const phase = (x: number) => Math.sin(((x - front) / 240) * Math.PI * 2);
  for (let x = x0; x <= x1; x += 12) {
    const e = env(x);
    if (e < 0.03) continue;
    for (let r = 0; r < rows; r++) {
      const rowOff = (r - (rows - 1) / 2) * 8;
      const yy = y + rowOff + amp * e * phase(x + rowOff * 3);
      const d = (1.5 + 4.5 * e) * (1 - 0.25 * Math.abs(rowOff / 8));
      dot(fc.g, x, yy, d, PALETTE.azureLight, Math.min(1, 0.35 + e));
      dot(fc.glow, x, yy, d * 1.2, PALETTE.azureLight, 0.6 * e);
    }
  }
  return (x: number) => -6 * env(x) * phase(x);
}

/* ---------------------------------------------------------------- construction */

/** Construction circles (`rule`, 1.5 px) around (cx, cy) drawing on over 18 f (easeInOutCubic) from `t0`. */
export function constructionCircles(fc: FrameCtx, cx: number, cy: number, radii: readonly number[], t0: number, t: number): void {
  const u = tween(t0, t, 18, easeInOutCubic);
  if (u <= 0) return;
  const { g } = fc;
  g.strokeStyle = PALETTE.rule;
  g.lineWidth = 1.5;
  for (const r of radii) {
    g.beginPath();
    g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2);
    g.stroke();
  }
}

/** Full-width and full-height 1 px `rule` hairlines through (cx, cy). */
export function crosshairLines(fc: FrameCtx, cx: number, cy: number, alpha = 0.4): void {
  const { g } = fc;
  g.globalAlpha = alpha;
  g.fillStyle = PALETTE.rule;
  g.fillRect(0, Math.round(cy) - 0.5, W, 1);
  g.fillRect(Math.round(cx) - 0.5, 0, 1, H);
  g.globalAlpha = 1;
}

/* ---------------------------------------------------------------- pictograms */

export type PictogramName = 'check' | 'quota' | 'netpol' | 'rbac' | 'monitor' | 'dns' | 'upgrade' | 'globe';

/** Dot-matrix icons ('#' = lit). 7×7 except monitor, dns, globe (9×7). */
export const PICTOGRAMS: Record<PictogramName, readonly string[]> = {
  check: ['.......', '......#', '.....#.', '#...#..', '.#.#...', '..#....', '.......'],
  quota: ['......#', '....#.#', '....#.#', '..#.#.#', '..#.#.#', '#.#.#.#', '#######'],
  netpol: ['#######', '...#...', '#######', '.#...#.', '#######', '...#...', '#######'],
  rbac: ['..###..', '..###..', '...#...', '.#####.', '#.###.#', '..#.#..', '..#.#..'],
  monitor: ['#########', '#.......#', '#..#....#', '#.#.#.#.#', '#....#..#', '#########', '...###...'],
  dns: ['...###...', '...###...', '....#....', '.#######.', '.#.....#.', '###...###', '###...###'],
  upgrade: ['...#...', '..###..', '.#.#.#.', '#..#..#', '...#...', '...#...', '.#####.'],
  globe: ['..#####..', '.#..#..#.', '#..#.#..#', '#########', '#..#.#..#', '.#..#..#.', '..#####..'],
};

/**
 * Dot pictogram with its top-left at (x, y), dot pitch `p`, dot diameter 0.75·p. Unlit cells are not
 * drawn. `glow` (0..1) also paints lit dots on fc.glow (leave 0 on paper plates).
 */
export function pictogram(fc: FrameCtx, name: PictogramName, x: number, y: number, p: number, color: string, { glow = 0, alpha = 1 }: { glow?: number; alpha?: number } = {}): void {
  PICTOGRAMS[name].forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      const cx = x + (c + 0.5) * p;
      const cy = y + (r + 0.5) * p;
      dot(fc.g, cx, cy, 0.75 * p, color, alpha);
      if (glow > 0) dot(fc.glow, cx, cy, 0.8 * p, color, glow * alpha);
    }
  });
}

/* ---------------------------------------------------------------- camera */

export interface Camera {
  /** World point shown at the screen anchor. */
  x: number;
  y: number;
  zoom: number;
  /** Screen anchor (default the frame centre 960, 540). Set sx = x, sy = y to scale about a pivot. */
  sx?: number;
  sy?: number;
}

/** Run `fn` with both fc.g and fc.glow transformed so world (x, y) lands on (sx, sy) at `zoom`. */
export function withCamera(fc: FrameCtx, cam: Camera, fn: () => void): void {
  const sx = cam.sx ?? W / 2;
  const sy = cam.sy ?? H / 2;
  for (const c of [fc.g, fc.glow]) {
    c.save();
    c.transform(cam.zoom, 0, 0, cam.zoom, sx - cam.x * cam.zoom, sy - cam.y * cam.zoom);
  }
  try {
    fn();
  } finally {
    fc.g.restore();
    fc.glow.restore();
  }
}
