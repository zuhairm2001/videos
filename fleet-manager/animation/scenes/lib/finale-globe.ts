/**
 * S10 / S11 shared geometry: the S10 reach globe (dots, markers, hub arcs) and the S10 right block.
 * S10 draws from these; S11 recomputes S10's last frame from the same functions so the dot collapse
 * starts from the truthful dot positions.
 */
import {
  PALETTE,
  clamp01,
  dot,
  dotLine,
  easeInOutCubic,
  font,
  framesSince,
  headlineRise,
  pictogram,
  powerOn,
  typeOn,
  type PictogramName,
} from '../../components';
import type { FrameCtx } from '../../engine/types';

/* ------------------------------------------------------------------ globe */

export const GLOBE = { cx: 560, cy: 560, r: 360 } as const;
/** North pole tipped toward the viewer so the hub reads. */
const TILT = (20 * Math.PI) / 180;
const DEG = Math.PI / 180;
/** Longitude facing the viewer at the S10 pull-back cue; drifts west at 6°/s. */
const CENTRE_LON0 = 12;
const DRIFT = 6;

/** A dot to be drawn: position, diameter, colour, alpha. */
export interface LitDot {
  x: number;
  y: number;
  d: number;
  color: string;
  alpha: number;
}

/** Rotation (deg) added to every longitude at time t (global s). */
export function globeRot(fc: FrameCtx, t: number): number {
  return -CENTRE_LON0 + DRIFT * (t - fc.cue('s10.pull.start'));
}

/** Orthographic projection of (lat, lon) at radius factor `k`. z > 0 faces the viewer. */
export function project(lat: number, lon: number, rot: number, k = 1): { x: number; y: number; z: number } {
  const p = lat * DEG;
  const l = (lon + rot) * DEG;
  const x0 = Math.cos(p) * Math.sin(l);
  const y0 = Math.sin(p);
  const z0 = Math.cos(p) * Math.cos(l);
  const y = y0 * Math.cos(TILT) - z0 * Math.sin(TILT);
  const z = z0 * Math.cos(TILT) + y0 * Math.sin(TILT);
  return { x: GLOBE.cx + GLOBE.r * k * x0, y: GLOBE.cy - GLOBE.r * k * y, z };
}

const MERIDIANS = Array.from({ length: 12 }, (_, i) => i * 30);
const PARALLELS = [-67.5, -45, -22.5, 0, 22.5, 45, 67.5];

/** Globe lattice (lat, lon) points: 12 meridians + 7 parallels, a dot every 4°. Pure, cached. */
export const LATTICE: readonly { lat: number; lon: number }[] = (() => {
  const pts: { lat: number; lon: number }[] = [];
  for (const lon of MERIDIANS) for (let lat = -84; lat <= 84; lat += 4) pts.push({ lat, lon });
  for (const lat of PARALLELS) for (let lon = 0; lon < 360; lon += 4) {
    if (lon % 30 === 0) continue; // meridian already has a dot near here
    pts.push({ lat, lon });
  }
  return pts;
})();

/** Resting globe lattice dots at time t: 5 px `rule`, back face at 30 %. Same order as LATTICE. */
export function latticeDots(fc: FrameCtx, t: number): LitDot[] {
  const rot = globeRot(fc, t);
  return LATTICE.map(({ lat, lon }) => {
    const p = project(lat, lon, rot);
    return { x: p.x, y: p.y, d: 5, color: PALETTE.rule, alpha: p.z >= 0 ? 1 : 0.3 };
  });
}

/* ------------------------------------------------------------------ markers */

export interface Marker {
  label: string;
  lat: number;
  lon: number;
  /** Label side (fixed per marker so it never jumps). */
  side: 'left' | 'right';
  /** Leader goes up (default) or down from the marker. */
  down?: boolean;
}

/** AKS regions at their datacentre coordinates; Arc sites are illustrative. */
export const MARKERS: readonly Marker[] = [
  { label: 'AKS · eastus', lat: 37.37, lon: -79.82, side: 'right' },
  { label: 'AKS · westeurope', lat: 52.37, lon: 4.9, side: 'right' },
  { label: 'AKS · japaneast', lat: 35.68, lon: 139.77, side: 'left' },
  { label: 'AKS · australiaeast', lat: -33.86, lon: 151.21, side: 'left' },
  { label: 'Arc · on-prem (preview)', lat: -23.55, lon: -46.63, side: 'right' },
  { label: 'Arc · other cloud (preview)', lat: 25.2, lon: 55.27, side: 'left', down: true },
  { label: 'Arc · edge (preview)', lat: -1.29, lon: 36.82, side: 'left' },
];

/** Readout like `37.37° N  79.82° W`. */
export function coordText(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
}

/** Facing threshold for markers (a little inside the limb so glyphs never sit on the rim). */
const FACE_Z = 0.18;
/** Markers start appearing this many frames after the globe has formed, staggered by index. */
const MARKER_T0_CUE = 's10.pull.end';

export interface MarkerState {
  m: Marker;
  x: number;
  y: number;
  /** Consecutive frames the marker has been visible (0 = first frame, −1 = hidden); capped at 30. */
  k: number;
}

function markerVisible(fc: FrameCtx, m: Marker, i: number, t: number): boolean {
  if (framesSince(fc.cue(MARKER_T0_CUE), t) < 16 + 3 * i) return false;
  return project(m.lat, m.lon, globeRot(fc, t)).z > FACE_Z;
}

export function markerStates(fc: FrameCtx, t: number): MarkerState[] {
  return MARKERS.map((m, i) => {
    const p = project(m.lat, m.lon, globeRot(fc, t));
    let k = -1;
    for (let j = 0; j <= 30; j++) {
      if (!markerVisible(fc, m, i, t - j / 30)) break;
      k = j;
    }
    return { m, x: p.x, y: p.y, k };
  });
}

/** North-pole hub position. */
export function hubPos(fc: FrameCtx, t: number): { x: number; y: number } {
  return project(90, 0, globeRot(fc, t));
}

export const HUB_D = 16;

/** Dotted arc from the pole hub to a marker: great circle lifted above the surface. Draw-on `fill`. */
export function arcDots(fc: FrameCtx, t: number, m: Marker, fill: number): LitDot[] {
  const rot = globeRot(fc, t);
  const out: LitDot[] = [];
  const N = 44;
  const n = Math.floor(N * clamp01(fill));
  for (let i = 2; i <= Math.min(n, N - 3); i++) {
    const s = i / N;
    const lat = 90 + (m.lat - 90) * s;
    const lift = 1 + 0.1 * Math.sin(Math.PI * s);
    const p = project(lat, m.lon, rot, lift);
    out.push({ x: p.x, y: p.y, d: 3, color: PALETTE.fleetLight, alpha: 1 });
  }
  return out;
}

/** Marker glyph (p = 6, `member`) dots, top-left = centre − 15. Ring fleetLight, bars fleetPale. */
export function markerGlyphDots(x: number, y: number, level: number): LitDot[] {
  const out: LitDot[] = [];
  const p = 6;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const ring = r === 0 || r === 4 || c === 0 || c === 4;
    if (!ring && c === 2) continue;
    const corner = (r === 0 || r === 4) && (c === 0 || c === 4);
    out.push({
      x: x - 15 + (c + 0.5) * p,
      y: y - 15 + (r + 0.5) * p,
      d: 0.8 * p * (corner ? 0.5 : 1),
      color: ring ? PALETTE.fleetLight : PALETTE.fleetPale,
      alpha: level,
    });
  }
  return out;
}

/** Every lit globe dot at time t (lattice, arcs, hub, markers): the S11 collapse sources. */
export function globeLitDots(fc: FrameCtx, t: number): LitDot[] {
  const dots = latticeDots(fc, t);
  const hub = hubPos(fc, t);
  for (const s of markerStates(fc, t)) {
    if (s.k < 0) continue;
    dots.push(...arcDots(fc, t, s.m, arcFill(s.k)));
    dots.push(...markerGlyphDots(s.x, s.y, s.k === 0 ? 0.4 : 1));
  }
  dots.push({ x: hub.x, y: hub.y, d: HUB_D, color: PALETTE.fleet, alpha: 1 });
  return dots;
}

export const arcFill = (k: number): number => easeInOutCubic(clamp01((k + 1) / 12));

/* ------------------------------------------------------------------ labels */

const LABEL_FONT = font('mono', 18);
const MONO_W = 18 * 0.6;

/** Leader + label + readout for a visible marker; types on with the marker's visible frame count. */
export function drawMarkerLabel(fc: FrameCtx, s: MarkerState, t: number): void {
  if (s.k < 0) return;
  const { g } = fc;
  const dir = s.m.side === 'right' ? 1 : -1;
  const up = s.m.down ? -1 : 1;
  const a = { x: s.x + dir * 17, y: s.y - up * 17 };
  const b = { x: s.x + dir * 37, y: s.y - up * 37 };
  const c = { x: s.x + dir * 53, y: s.y - up * 37 };
  const lf = clamp01((s.k + 1) / 5);
  dotLine(g, a, b, { pitch: 4, diam: 1.5, color: PALETTE.fleetLight, fill: Math.min(1, lf * 2) });
  if (lf > 0.5) dotLine(g, b, c, { pitch: 4, diam: 1.5, color: PALETTE.fleetLight, fill: lf * 2 - 1 });
  if (s.k < 3) return;
  const label = s.m.label;
  const coord = coordText(s.m.lat, s.m.lon);
  const w = Math.max(label.length, coord.length) * MONO_W;
  const lx = dir > 0 ? c.x + 8 : c.x - 8 - w;
  // ground backing tag so labels stay legible over the lattice
  g.fillStyle = PALETTE.ground;
  g.globalAlpha = 0.85;
  g.fillRect(lx - 6, c.y - 14, w + 12, 50);
  g.globalAlpha = 1;
  const t0 = t - (s.k - 3) / 30;
  typeOn(fc, label, lx, c.y - 10, LABEL_FONT, PALETTE.fleetLight, t0, t, 180);
  typeOn(fc, coord, lx, c.y + 13, LABEL_FONT, PALETTE.mute, t0 + 3 / 30, t, 180);
}

/* ------------------------------------------------------------------ right block */

export const RIGHT_X = 1040;
export const TILE = { y: 560, w: 240, h: 180, gap: 16 } as const;
const TILES: { cue: string; picto: PictogramName; lines: string[] }[] = [
  { cue: 's10.tile1', picto: 'monitor', lines: ['Centralized', 'monitoring'] },
  { cue: 's10.tile2', picto: 'dns', lines: ['DNS load', 'balancing', '(preview)'] },
  { cue: 's10.tile3', picto: 'upgrade', lines: ['Auto-upgrade', 'profiles'] },
];

/** Headline, sub-line and the three bento tiles as of time t. */
export function drawReachRight(fc: FrameCtx, t: number): void {
  const hl = headlineRise(fc, ['Every cluster.', 'One control plane.'], RIGHT_X, 200, { px: 84, maxWidth: 784, t0: fc.cue('s10.headline'), t });
  const subF = font('mono', 28);
  const subY = hl.bottom + 40;
  const l1 = 'AKS across regions and subscriptions,';
  const l2 = 'plus Arc-enabled clusters (preview).';
  const s0 = fc.cue('s10.sub');
  typeOn(fc, l1, RIGHT_X, subY, subF, PALETTE.mute, s0, t);
  typeOn(fc, l2, RIGHT_X, subY + 38, subF, PALETTE.mute, s0 + Math.ceil(l1.length / 3) / 30, t);
  TILES.forEach((tile, i) => drawTile(fc, t, i, tile));
}

function drawTile(fc: FrameCtx, t: number, i: number, tile: (typeof TILES)[number]): void {
  const t0 = fc.cue(tile.cue);
  const pw = powerOn(t0, t);
  if (!pw) return;
  const { g } = fc;
  const x = RIGHT_X + i * (TILE.w + TILE.gap);
  const y = TILE.y;
  g.globalAlpha = pw;
  g.fillStyle = PALETTE.ground;
  g.beginPath();
  g.roundRect(x, y, TILE.w, TILE.h, 8);
  g.fill();
  g.strokeStyle = PALETTE.rule;
  g.lineWidth = 1.5;
  g.stroke();
  g.globalAlpha = 1;
  const pp = powerOn(t0 + 2 / 30, t);
  if (pp) {
    const w = tile.picto === 'upgrade' ? 7 : 9;
    pictogram(fc, tile.picto, x + 20 + (9 - w) * 3.5, y + 24, 7, PALETTE.azureLight, { glow: 0.5, alpha: pp });
  }
  const f = font('mono', 20);
  let tt = t0 + 3 / 30;
  tile.lines.forEach((l, j) => {
    typeOn(fc, l, x + 20, y + 96 + j * 26, f, PALETTE.paper, tt, t);
    tt += Math.ceil(l.length / 3) / 30;
  });
  const k = framesSince(t0 + 6 / 30, t);
  if (k >= 0) sparkline(fc, i, x + 136, y + 26, t, k);
}

/** Tiny animated dot charts in the tile's top-right corner (x0, y0 = top-left of an 84×44 box). */
function sparkline(fc: FrameCtx, i: number, x0: number, y0: number, t: number, k: number): void {
  const { g } = fc;
  const on = k === 0 ? 0.4 : 1;
  const lit = (x: number, y: number, d = 4) => {
    dot(g, x, y, d, PALETTE.azureLight, on);
    dot(fc.glow, x, y, d, PALETTE.azureLight, 0.35 * on);
  };
  if (i === 0) {
    // monitoring: a scrolling line graph, 12 samples
    for (let c = 0; c < 12; c++) {
      const s = c + t * 6;
      const v = 0.5 + 0.3 * Math.sin(s * 0.9) + 0.15 * Math.sin(s * 2.3 + 1);
      const yy = y0 + 40 - 36 * clamp01(v);
      dot(g, x0 + 4 + c * 7, y0 + 42, 2, PALETTE.dotOff);
      lit(x0 + 4 + c * 7, Math.round(yy));
    }
  } else if (i === 1) {
    // DNS load balancing: three endpoint bars sharing traffic
    const ph = t * 1.4;
    const raw = [1 + 0.35 * Math.sin(ph), 1 + 0.35 * Math.sin(ph + 2.1), 1 + 0.35 * Math.sin(ph + 4.2)];
    const sum = raw[0] + raw[1] + raw[2];
    raw.forEach((v, r) => {
      const n = Math.round((v / sum) * 3 * 7);
      for (let c = 0; c < 12; c++) {
        const x = x0 + 4 + c * 7;
        const y = y0 + 8 + r * 14;
        if (c < n) lit(x, y, 5);
        else dot(g, x, y, 5, PALETTE.dotOff);
      }
    });
  } else {
    // auto-upgrade: dot columns stepping up, one at a time
    const step = Math.floor(t * 5) % 16;
    for (let c = 0; c < 8; c++) {
      const h = 1 + ((c * 3 + 2) % 5);
      const active = c <= step % 8;
      for (let r = 0; r < 6; r++) {
        const x = x0 + 6 + c * 10;
        const y = y0 + 40 - r * 7;
        if (r < h && active) lit(x, y, 5);
        else dot(g, x, y, 5, PALETTE.dotOff);
      }
    }
  }
}
