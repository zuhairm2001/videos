/**
 * Shared S02/S03 layout: the seeded sprawl scatter (S02) and the fleet formation it snaps into (S03).
 * S02 draws its glyphs at `sprawl().glyphs[i]` and S03 flies them from exactly those positions,
 * so the hard cut at 8.00 is continuous. Everything here is a pure, cached function of constants
 * (plus text metrics, which are deterministic once the fonts are loaded).
 */
import { font, hash01, measure, PALETTE, seedOf, typeOn } from '../../components';
import { MONO_ADVANCE } from '../../config';
import type { GlyphState } from '../../components';
import type { FrameCtx } from '../../engine/types';

/* ---------------------------------------------------------------- fixed geometry */

/** S01 hero: p 24 glyph, top-left (900, 300). */
export const HERO_S01 = { x: 900, y: 300, p: 24 } as const;
/**
 * S02 hero rest: p 12 at (240, 120). The storyboard asks for (240, 180), but a 60 px glyph there
 * (y 180–240) overlaps the headline plate (top 214); one grid row higher it clears it.
 */
export const HERO_S02 = { x: 240, y: 120, p: 12 } as const;
export const HERO_LABEL = ['aks-prod-eastus', 'v1.31 · eastus'] as const;

/** S02 headline / sub-line / counter. */
export const S02_HEADLINE = 'Dozens is a different story.';
export const S02_SUB = ['regions · subscriptions · clouds · on-prem', 'each one drifting on its own'] as const;
export const HEADLINE = { x: 96, y: 230, px: 84 } as const;
export const SUB_PX = 28;
export const HL_BOTTOM = HEADLINE.y + Math.round(HEADLINE.px * 1.05);
export const SUB_LH = 38;
export const COUNTER = { x: 96, y: 760, px: 200 } as const;

/** S03 hub: p 24 `match` glyph centred on (960, 300). */
export const HUB = { cx: 960, cy: 300, p: 24, x: 900, y: 240 } as const;
/**
 * S03 formation: 16 × 3 glyphs at p 12, 96 px column pitch, row tops 468/552/636. Starts at x 204
 * (spans 204–1704) so it is centred under the hub; the storyboard's 192 left it 18 px off-axis.
 */
export const FORM = { cols: 16, x0: 204, pitch: 96, rows: [468, 552, 636] as const, p: 12 } as const;
/** Hull rule / wave band span (storyboard: x 192–1728). */
export const HULL = { x0: 192, x1: 1728 } as const;

/* ---------------------------------------------------------------- sprawl */

const NAMES = [
  'eastus',
  'westeurope',
  'southeastasia',
  'japaneast',
  'uksouth',
  'australiaeast',
  'brazilsouth',
  'centralindia',
  'canadacentral',
  'on-prem · dc-02',
  'edge · store-114',
  'other-cloud · arc',
  'sub: payments-prod',
  'sub: data-dev',
] as const;
export const VERSIONS = ['v1.29', 'v1.30', 'v1.31'] as const;

/** Doubling counts (1, 2, 4, 8, 16, 32, 48) at cues s02.double.1 … 7. */
export const DOUBLINGS = [1, 2, 4, 8, 16, 32, 48] as const;
export const N = 48;

/** Label type (mono 18, tracking 0.04, line height 23) under a glyph: top = glyph bottom + 8. */
export const LABEL_PX = 18;
export const LABEL_TRACK = 0.04;
export const LABEL_LH = Math.round(LABEL_PX * 1.3);
export const monoWidth = (s: string, px: number, track = 0): number => (s.length ? s.length * px * (MONO_ADVANCE + track) - track * px : 0);

export interface SprawlGlyph {
  i: number;
  x: number;
  y: number;
  /** 12 = foreground, 8 = background (50 % alpha). */
  p: number;
  alpha: number;
  state: GlyphState;
  /** [name, version] or null. */
  label: readonly [string, string] | null;
  /** Doubling group 0..6 and pop delay in frames after that group's cue. */
  group: number;
  delayF: number;
}

type Rect = { x0: number; y0: number; x1: number; y1: number };

export interface Sprawl {
  glyphs: SprawlGlyph[];
  /** Zones kept clear of glyphs (for debugging / checks). */
  zones: Rect[];
  headlineW: number;
  counterW: number;
}

let cached: Sprawl | null = null;

/** Footprint of a glyph + its label (for placement). */
function footprint(x: number, y: number, p: number, label: readonly [string, string] | null): Rect {
  const s = 5 * p;
  if (!label) return { x0: x, y0: y, x1: x + s, y1: y + s };
  const lw = Math.max(monoWidth(label[0], LABEL_PX, LABEL_TRACK), monoWidth(label[1], LABEL_PX, LABEL_TRACK));
  const w = Math.max(s, lw);
  const cx = x + s / 2;
  return { x0: cx - w / 2, y0: y, x1: cx + w / 2, y1: y + s + 8 + 2 * LABEL_LH };
}

/**
 * The 48 sprawl glyphs (index 0 = the hero) with seeded off-grid positions that avoid the hero,
 * headline, sub-line, counter and the S03 hub zones. `g` is only used to measure text once.
 */
export function sprawl(g: CanvasRenderingContext2D): Sprawl {
  if (cached) return cached;
  const seed = seedOf('S02.sprawl');
  const headlineW = measure(g, S02_HEADLINE, font('display', HEADLINE.px, 800), -0.025);
  const counterW = measure(g, '48', font('dot', COUNTER.px, 900));
  const subW = Math.max(...S02_SUB.map((s) => monoWidth(s, SUB_PX)));
  const subTop = HL_BOTTOM + 40;
  const heroLabelW = Math.max(...HERO_LABEL.map((s) => monoWidth(s, LABEL_PX, LABEL_TRACK)));
  const pad = 16;
  const zones: Rect[] = [
    // hero glyph + its right-hand label
    { x0: HERO_S02.x, y0: HERO_S02.y, x1: HERO_S02.x + 60 + 16 + heroLabelW, y1: HERO_S02.y + 60 },
    // headline on its 16 px ground plate
    { x0: HEADLINE.x - 16, y0: HEADLINE.y - 16, x1: HEADLINE.x + headlineW + 16, y1: HL_BOTTOM + 16 },
    // sub-line
    { x0: HEADLINE.x, y0: subTop, x1: HEADLINE.x + subW, y1: subTop + S02_SUB.length * SUB_LH },
    // counter numeral + "clusters" label
    { x0: COUNTER.x, y0: COUNTER.y, x1: COUNTER.x + counterW + 24 + monoWidth('clusters', 24), y1: COUNTER.y + COUNTER.px },
    // S03 hub + halo (so the hub never powers on over a sprawl glyph)
    { x0: HUB.cx - 84, y0: HUB.cy - 84, x1: HUB.cx + 84, y1: HUB.cy + 84 },
  ];

  // attributes: indices 1..47 → 14 background (≈30 %), 19 drift (≈40 %), labels on 28 fg (+ hero ≈ 60 %)
  const others = Array.from({ length: N - 1 }, (_, k) => k + 1);
  const byHash = (salt: number) => [...others].sort((a, b) => hash01(seed, a, salt) - hash01(seed, b, salt));
  const bg = new Set(byHash(1).slice(0, 14));
  const drift = new Set(byHash(2).slice(0, 19));
  const fg = others.filter((i) => !bg.has(i));
  const labelled = new Set([...fg].sort((a, b) => hash01(seed, a, 3) - hash01(seed, b, 3)).slice(0, 28));
  const nameOrder = [...others].sort((a, b) => hash01(seed, a, 4) - hash01(seed, b, 4));

  const glyphs: SprawlGlyph[] = [
    { i: 0, x: HERO_S02.x, y: HERO_S02.y, p: 12, alpha: 1, state: 'updated', label: null, group: 0, delayF: 0 },
  ];
  const attrs = others.map((i) => {
    const group = DOUBLINGS.findIndex((n) => i < n);
    const n0 = DOUBLINGS[group - 1];
    const n = DOUBLINGS[group] - n0;
    const label: readonly [string, string] | null = labelled.has(i)
      ? [NAMES[nameOrder.indexOf(i) % NAMES.length], VERSIONS[Math.floor(hash01(seed, i, 5) * 3)]]
      : null;
    return {
      i,
      p: bg.has(i) ? 8 : 12,
      alpha: bg.has(i) ? 0.5 : 1,
      state: (drift.has(i) ? 'drift' : 'unmanaged') as GlyphState,
      label,
      group,
      // new glyphs of a doubling pop within 8 f of the beat
      delayF: Math.floor(((i - n0) * 8) / n),
    };
  });

  // place the biggest footprints first; best-candidate sampling keeps them evenly spread
  const placed: Rect[] = [...zones];
  const order = [...attrs].sort((a, b) => (b.label ? 2 : b.p === 12 ? 1 : 0) - (a.label ? 2 : a.p === 12 ? 1 : 0) || a.i - b.i);
  const gap = 10;
  for (const a of order) {
    let best: { x: number; y: number; score: number; label: typeof a.label } | null = null;
    // if a labelled glyph finds no room, it goes unlabelled rather than overlapping anything
    for (const label of a.label ? [a.label, null] : [null]) {
      for (let k = 0; k < 4000 && !(best && k > 60); k++) {
        const probe = footprint(0, 0, a.p, label);
        const fx = 96 + hash01(seed, a.i, k, 10) * (1824 - 96 - (probe.x1 - probe.x0));
        const fy = 96 + hash01(seed, a.i, k, 11) * (984 - 96 - (probe.y1 - probe.y0));
        const x = Math.round(fx - probe.x0);
        const y = Math.round(fy);
        const r = footprint(x, y, a.p, label);
        if (placed.some((z) => r.x0 - gap < z.x1 && z.x0 < r.x1 + gap && r.y0 - gap < z.y1 && z.y0 < r.y1 + gap)) continue;
        // clearance to the nearest placed rect (larger = better spread)
        let score = Infinity;
        for (const z of placed) {
          const dx = Math.max(z.x0 - r.x1, r.x0 - z.x1, 0);
          const dy = Math.max(z.y0 - r.y1, r.y0 - z.y1, 0);
          score = Math.min(score, Math.hypot(dx, dy));
        }
        if (!best || score > best.score) best = { x, y, score, label };
      }
      if (best) break;
    }
    if (!best) throw new Error(`opening-layout: no room for sprawl glyph ${a.i}`);
    placed.push(footprint(best.x, best.y, a.p, best.label));
    glyphs.push({ ...a, x: best.x, y: best.y, label: best.label });
  }
  glyphs.sort((a, b) => a.i - b.i);
  cached = { glyphs, zones, headlineW, counterW };
  return cached;
}

/* ---------------------------------------------------------------- formation */

/**
 * Formation slot (col, row) for each sprawl glyph: sort by start x into 16 columns of 3, each
 * column by start y, so flights stay short and rarely cross. Returns [i] → { x, y } top-left.
 */
export function formationSlots(g: CanvasRenderingContext2D): { x: number; y: number; col: number; row: number }[] {
  const s = sprawl(g);
  const cx = (q: SprawlGlyph) => q.x + 2.5 * q.p;
  const cy = (q: SprawlGlyph) => q.y + 2.5 * q.p;
  const byX = [...s.glyphs].sort((a, b) => cx(a) - cx(b) || a.i - b.i);
  const slots: { x: number; y: number; col: number; row: number }[] = new Array(N);
  for (let c = 0; c < FORM.cols; c++) {
    const col = byX.slice(c * 3, c * 3 + 3).sort((a, b) => cy(a) - cy(b) || a.i - b.i);
    col.forEach((q, r) => (slots[q.i] = { x: FORM.x0 + c * FORM.pitch, y: FORM.rows[r], col: c, row: r }));
  }
  return slots;
}

/* ---------------------------------------------------------------- shared drawing */

/** Pop time (s) of sprawl glyph `q`: its doubling cue + its in-group delay. */
export function popTime(fc: FrameCtx, q: SprawlGlyph): number {
  return fc.cue(`s02.double.${q.group + 1}`) + q.delayF / 30;
}

/** Glyph labels (mono 18 mute) centred under a sprawl glyph; `version` overrides the second line. */
export function drawSprawlLabel(fc: FrameCtx, q: SprawlGlyph, x: number, y: number, t0: number, version?: (s: string, x: number, y: number) => void): void {
  if (!q.label) return;
  const lf = font('mono', LABEL_PX);
  const cx = x + 2.5 * q.p;
  const top = y + 5 * q.p + 8;
  const [name, ver] = q.label;
  typeOn(fc, name, cx - monoWidth(name, LABEL_PX, LABEL_TRACK) / 2, top, lf, PALETTE.mute, t0, fc.t, 90, LABEL_TRACK);
  const vx = cx - monoWidth(ver, LABEL_PX, LABEL_TRACK) / 2;
  if (version) version(ver, vx, top + LABEL_LH);
  else typeOn(fc, ver, vx, top + LABEL_LH, lf, PALETTE.mute, t0 + Math.ceil(name.length / 3) / 30, fc.t, 90, LABEL_TRACK);
}

/** The S02 hero's label, set beside it (right of the glyph) so it clears the headline plate. */
export function drawHeroLabel(fc: FrameCtx, t0: number, dy = 0): void {
  const lf = font('mono', LABEL_PX);
  const x = HERO_S02.x + 60 + 16;
  const y = HERO_S02.y + 7 + dy;
  typeOn(fc, HERO_LABEL[0], x, y, lf, PALETTE.mute, t0, fc.t, 90, LABEL_TRACK);
  typeOn(fc, HERO_LABEL[1], x, y + LABEL_LH, lf, PALETTE.mute, t0 + 5 / 30, fc.t, 90, LABEL_TRACK);
}

