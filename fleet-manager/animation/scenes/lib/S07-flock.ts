/**
 * S07 flock (signature 3): ~40 dot-arrows form one big arrow right of the hub, then split into 6 streams
 * (2 progressive waves of 3 targets). Pure geometry, computed once and cached.
 */

type Pt = { x: number; y: number };

export interface FlockTarget {
  /** member grid (col, row) */
  c: number;
  r: number;
  wave: 1 | 2;
  /** glyph top-left */
  gx: number;
  gy: number;
}

export interface FlockArrow {
  /** formation slot (centre) */
  home: Pt;
  wave: 1 | 2;
  target: number;
  /** delay (frames) from the wave start */
  delay: number;
  /** flight (frames) */
  frames: number;
  /** delay (frames) of the form-up from the formation start */
  formDelay: number;
  path: Path;
}

/** Dense polyline with an arc-length table. */
export interface Path {
  pts: Pt[];
  cum: number[];
  len: number;
}

/** Formation: shaft 5 cols × 3 rows, head 5 cols with half-heights 4,3,2,1,0 → 15 + 25 = 40 arrows. */
export const FORM_X0 = 920;
export const FORM_CY = 540;
export const FORM_DX = 28;
export const FORM_DY = 36;
const HALF = [1, 1, 1, 1, 1, 4, 3, 2, 1, 0];

/** Stream waypoints between the launch point and the glyph (lanes run through the gaps between rows/columns). */
function via(t: FlockTarget): Pt[] {
  const cy = t.gy + 30;
  const approach = (laneY: number): Pt[] => [
    { x: 1190, y: laneY },
    { x: t.gx - 70, y: laneY },
    { x: t.gx - 44, y: cy },
  ];
  // (0,0) comes up from below-left: the policy panel's corner (1160, 350) blocks the straight approach
  if (t.c === 0) return [t.r === 0 ? { x: 1172, y: 404 } : { x: t.gx - 56, y: cy }];
  if (t.r === 0) return [{ x: 1190, y: 470 }, { x: t.gx - 50, y: 460 }, { x: t.gx - 38, y: cy }];
  if (t.r === 1) return approach(470);
  return approach(660);
}

/** Centripetal Catmull-Rom (Barry–Goldman): no loops or cusps when control points are unevenly spaced. */
function catmull(p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt {
  const knot = (a: Pt, b: Pt) => Math.max(1e-3, Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y)));
  const t1 = knot(p0, p1);
  const t2 = t1 + knot(p1, p2);
  const t3 = t2 + knot(p2, p3);
  const t = t1 + (t2 - t1) * u;
  const mix = (a: Pt, b: Pt, ta: number, tb: number): Pt => {
    const w = (t - ta) / (tb - ta);
    return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w };
  };
  const a1 = mix(p0, p1, 0, t1);
  const a2 = mix(p1, p2, t1, t2);
  const a3 = mix(p2, p3, t2, t3);
  return mix(mix(a1, a2, 0, t2), mix(a2, a3, t1, t3), t1, t2);
}

function buildPath(ctrl: Pt[]): Path {
  const pts: Pt[] = [];
  // phantom end points continue the first/last segment straight on
  const n = ctrl.length;
  const ext = [
    { x: 2 * ctrl[0].x - ctrl[1].x, y: 2 * ctrl[0].y - ctrl[1].y },
    ...ctrl,
    { x: 2 * ctrl[n - 1].x - ctrl[n - 2].x, y: 2 * ctrl[n - 1].y - ctrl[n - 2].y },
  ];
  for (let i = 1; i < ext.length - 2; i++) {
    for (let k = 0; k < 16; k++) pts.push(catmull(ext[i - 1], ext[i], ext[i + 1], ext[i + 2], k / 16));
  }
  pts.push(ctrl[ctrl.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}

/** Point and heading (radians) at arc length `s`. */
export function pathAt(p: Path, s: number): { x: number; y: number; a: number } {
  const { pts, cum } = p;
  s = Math.max(0, Math.min(p.len, s));
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const u = (s - cum[lo]) / seg;
  const a = pts[lo];
  const b = pts[hi];
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, a: Math.atan2(b.y - a.y, b.x - a.x) };
}

let cache: { arrows: FlockArrow[]; targets: FlockTarget[] } | null = null;

/**
 * Arrows + targets for the given matched targets (wave 1 first). Each wave gets 20 arrows (alternating
 * cells in column-major order, so the waiting half still reads as an arrow), chunked 7/7/6 by y onto the
 * wave's targets sorted by (y, x).
 */
export function flock(targets: FlockTarget[]): { arrows: FlockArrow[]; targets: FlockTarget[] } {
  if (cache) return cache;
  const cells: { home: Pt; col: number }[] = [];
  HALF.forEach((h, col) => {
    for (let row = -h; row <= h; row++) cells.push({ home: { x: FORM_X0 + col * FORM_DX, y: FORM_CY + row * FORM_DY }, col });
  });
  const arrows: FlockArrow[] = [];
  const tip = { x: FORM_X0 + 9 * FORM_DX, y: FORM_CY };
  for (const wave of [1, 2] as const) {
    const mine = cells.filter((_, i) => (i % 2 === 0) === (wave === 1)).sort((a, b) => a.home.y - b.home.y || a.home.x - b.home.x);
    const tIdx = targets
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.wave === wave)
      .sort((a, b) => a.t.gy - b.t.gy || a.t.gx - b.t.gx);
    const sizes = [7, 7, mine.length - 14];
    let k = 0;
    tIdx.forEach(({ t, i }, s) => {
      const group = mine.slice(k, k + sizes[s]);
      k += sizes[s];
      // the arrows nearest the tip leave first: 2 f apart along the stream
      group.sort((a, b) => Math.hypot(a.home.x - tip.x, a.home.y - tip.y) - Math.hypot(b.home.x - tip.x, b.home.y - tip.y));
      group.forEach((cell, n) => {
        const end = { x: t.gx - 10, y: t.gy + 30 };
        const path = buildPath([cell.home, { x: cell.home.x + 30, y: cell.home.y }, ...via(t), end]);
        arrows.push({ home: cell.home, wave, target: i, delay: n * 2, frames: 0, formDelay: 0, path });
      });
    });
  }
  const maxLen = Math.max(...arrows.map((a) => a.path.len));
  const hub = { x: 844, y: 540 };
  for (const a of arrows) {
    // ≤ 12 f delay + ≤ 24 f flight = the 36 f wave window
    a.frames = Math.round(14 + 10 * (a.path.len / maxLen));
    a.formDelay = Math.round((0.5 * Math.hypot(a.home.x - hub.x, a.home.y - hub.y)) / 24);
  }
  cache = { arrows, targets };
  return cache;
}
