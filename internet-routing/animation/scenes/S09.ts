/**
 * S09 · 03 Routing, "no route is reserved" (24.30–28.80 s, frames 729–863).
 * Starts in S08's schematic macro column (R2 at 270,700, R3 straight below), hops R2→R3, then
 * pulls back (24.70–25.50) into the wide network map. Ripple of next-hop arrows, R3 decision,
 * hop R3→R4, R4 label + ttl 60, R4 re-decides (28.30), 3 f glitch cut into S10.
 *
 * Also exports the wide-map helpers shared by S10–S12 (same author).
 */
import {
  PALETTE,
  asciiInk,
  asciiRamp,
  drawText,
  easeInOutCubic,
  easeInOutQuart,
  font,
  framesSince,
  hash01,
  hudStopwatch,
  lerp,
  progress,
  rampDensity,
  rampIn,
  routerNode,
  link,
  scrambleText,
  sectionHeader,
  trackedPacket,
  typeText,
  type Point,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';

/* ================================================================ shared map */

export type NodeId = 'D' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5a' | 'R5b' | 'E';

/** Wide network map node centres (storyboard global conventions). */
export const NODES: Record<NodeId, Point> = {
  D: { x: 200, y: 480 },
  R1: { x: 420, y: 540 },
  R2: { x: 240, y: 640 },
  R3: { x: 480, y: 720 },
  R4: { x: 300, y: 810 },
  R5a: { x: 640, y: 780 },
  R5b: { x: 200, y: 950 },
  E: { x: 520, y: 990 },
};

/** Hop tag, active (IP) label and label top-left for each node (placed to avoid collisions). */
export const LABELS: Record<NodeId, { tag: string; ip: string; at: Point }> = {
  D: { tag: 'you', ip: 'you · 192.0.2.23', at: { x: 120, y: 520 } },
  R1: { tag: '1', ip: '1 · 192.0.2.1', at: { x: 360, y: 584 } },
  R2: { tag: '2', ip: '2 · 198.51.100.1', at: { x: 180, y: 684 } },
  R3: { tag: '3', ip: '3 · 198.51.100.45', at: { x: 552, y: 702 } },
  R4: { tag: '4', ip: '4 · 198.51.100.77', at: { x: 366, y: 824 } },
  R5a: { tag: 'ix', ip: 'ix · 203.0.113.129', at: { x: 712, y: 762 } },
  R5b: { tag: '5', ip: '5 · 198.51.100.140 · AS64500', at: { x: 120, y: 880 } },
  E: { tag: 'edge', ip: 'edge 203.0.113.10', at: { x: 400, y: 1024 } },
};

export const MESH_LINKS: readonly (readonly [NodeId, NodeId])[] = [
  ['D', 'R1'],
  ['R1', 'R2'],
  ['R2', 'R3'],
  ['R3', 'R4'],
  ['R4', 'R5a'],
  ['R5a', 'E'],
  ['R4', 'R5b'],
  ['R5b', 'E'],
];
const DECO_LINKS: readonly (readonly [NodeId, NodeId])[] = [
  ['R1', 'R3'],
  ['R2', 'R4'],
  ['R3', 'R5a'],
];
/** Decorative bleed nodes beyond x 960 / above y 270 (texture only). */
const BLEED: readonly Point[] = [
  { x: 1030, y: 520 },
  { x: 1010, y: 680 },
  { x: 1040, y: 820 },
  { x: 1050, y: 1010 },
  { x: 1020, y: 1180 },
  { x: 1060, y: 380 },
  { x: 150, y: 200 },
  { x: 400, y: 160 },
  { x: 650, y: 210 },
  { x: 880, y: 150 },
  { x: 300, y: 50 },
  { x: 760, y: 40 },
];
const BLEED_LINKS: readonly (readonly [number, number])[] = [
  [0, 5], [0, 1], [1, 2], [2, 3], [3, 4], [6, 7], [7, 8], [8, 9], [7, 10], [9, 11],
];
/** Mesh node → bleed node links. */
const BLEED_MESH: readonly (readonly [NodeId, number])[] = [
  ['R1', 0],
  ['R5a', 2],
  ['E', 3],
];

/** Screen mapping for world points (camera). */
export type View = (p: Point) => Point;
/** View that places world `c` at screen `s` with zoom `z`. */
export const viewOf = (c: Point, s: Point, z: number): View => (p) => ({ x: s.x + (p.x - c.x) * z, y: s.y + (p.y - c.y) * z });

/** ASCII-layer line (texture): a band of glyph density. */
function asciiLine(a: CanvasRenderingContext2D, p: Point, q: Point, d: number): void {
  a.save();
  a.strokeStyle = asciiInk(d);
  a.lineWidth = 10;
  a.beginPath();
  a.moveTo(p.x, p.y);
  a.lineTo(q.x, q.y);
  a.stroke();
  a.restore();
}

/**
 * Decorative texture: bleed nodes, their links and the decorative mesh links, all in the ascii
 * layer at ≈50% density × k.
 */
export function drawBleed(fc: FrameCtx, pos: (id: NodeId) => Point, view: View, k = 1): void {
  if (k <= 0) return;
  const a = fc.ascii;
  const bp = BLEED.map(view);
  for (const [i, j] of BLEED_LINKS) asciiLine(a, bp[i], bp[j], 0.3 * k);
  for (const [id, j] of BLEED_MESH) asciiLine(a, pos(id), bp[j], 0.3 * k);
  for (const [i, j] of DECO_LINKS) asciiLine(a, pos(i), pos(j), 0.3 * k);
  a.save();
  for (let n = 0; n < bp.length; n++) {
    const x0 = Math.round((bp[n].x - 60) / 12) * 12;
    const y0 = Math.round((bp[n].y - 40) / 20) * 20;
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 10; i++) {
        if (hash01(n + 91, i, j) > 0.62) continue;
        a.fillStyle = asciiInk(0.5 * k);
        a.fillRect(x0 + i * 12, y0 + j * 20, 12, 20);
      }
  }
  a.restore();
}

/** Deterministic cluster seed per node (stable while the node moves). */
const SEEDS: Record<NodeId, number> = { D: 11, R1: 23, R2: 37, R3: 41, R4: 53, R5a: 67, R5b: 71, E: 83 };

/**
 * Router cluster with a density entrance/exit: `vis` < 0 hidden, 0..1 ASCII ramp stage, ≥ 1 crisp.
 * Seeds are fixed per node (same values S08 uses for D/R1/R2/R3), so patterns stay stable while moving.
 */
export function drawNode(
  fc: FrameCtx,
  id: NodeId,
  p: Point,
  o: { cols?: number; rows?: number; vis?: number; pulse?: number; halo?: number; seed?: number } = {},
): void {
  const vis = o.vis ?? 1;
  const cols = o.cols ?? 10;
  const rows = o.rows ?? 4;
  if (vis < 0) return;
  if (vis < 1) {
    const r = asciiRamp(vis);
    if (r.density <= 0) return;
    fc.ascii.save();
    fc.ascii.fillStyle = asciiInk(r.density);
    fc.ascii.fillRect(Math.round(p.x - cols * 6), Math.round(p.y - rows * 10), cols * 12, rows * 20);
    fc.ascii.restore();
    return;
  }
  routerNode(fc, p.x, p.y, { cols, rows, pulse: o.pulse ?? 0, halo: o.halo, seed: o.seed ?? SEEDS[id] });
}

/** Text on a paper plate; scramble-resolves from t0 over `frames` if t0 given. */
export function plateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  t: number,
  o: { px?: number; t0?: number; frames?: number; color?: string; role?: 'glyph' | 'display'; typed?: boolean } = {},
): void {
  const px = o.px ?? 36;
  const k = o.t0 === undefined ? 1e9 : framesSince(o.t0, t);
  if (k < 0) return;
  const f = font(o.role ?? 'glyph', px);
  const color = o.color ?? PALETTE.inkDeep;
  ctx.save();
  ctx.font = f;
  const w = ctx.measureText(text).width;
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(x - 4, y, w + 8, px);
  if (o.t0 === undefined) drawText(ctx, text, x, y, { px, role: o.role, color });
  else if (o.typed) typeText(ctx, text, x, y, f, color, o.t0, t, o.frames ?? 8);
  else scrambleText(ctx, text, x, y, f, color, o.t0, t, o.frames ?? 8);
  ctx.restore();
}

/** Node hop tag / IP label at its standard position (active → IP). */
export function nodeLabel(ctx: CanvasRenderingContext2D, id: NodeId, t: number, active = false, t0?: number): void {
  const L = LABELS[id];
  plateText(ctx, active ? L.ip : L.tag, L.at.x, L.at.y, t, { t0 });
}

/** Next-hop arrow on a 36×36 paper plate, pointing along `angle` (rad). `squash` 0..1 = flip phase. */
export function nextHopArrow(ctx: CanvasRenderingContext2D, c: Point, angle: number, squash = 1): void {
  ctx.save();
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(Math.round(c.x - 18), Math.round(c.y - 18), 36, 36);
  ctx.translate(c.x, c.y);
  ctx.rotate(angle);
  ctx.scale(1, Math.max(0.15, squash));
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(4, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(1, -10);
  ctx.lineTo(1, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Arrow anchor just outside node `a` on the link toward `b`, and the pointing angle. */
export function arrowAt(a: NodeId, b: NodeId, extra = 30): { c: Point; angle: number } {
  const p = NODES[a];
  const q = NODES[b];
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const edge = Math.min(Math.abs(ux) > 1e-6 ? 60 / Math.abs(ux) : 1e9, Math.abs(uy) > 1e-6 ? 40 / Math.abs(uy) : 1e9);
  const d = edge + extra;
  return { c: { x: p.x + ux * d, y: p.y + uy * d }, angle: Math.atan2(dy, dx) };
}

/**
 * Arrow that flips from `from` to `to` angle over 4 f starting at t0: frames 0–1 squash the old
 * direction closed, 2–3 open the new one.
 */
export function flippingArrow(ctx: CanvasRenderingContext2D, c: Point, from: number, to: number, t0: number, t: number): void {
  const k = framesSince(t0, t);
  if (k < 0) nextHopArrow(ctx, c, from, 1);
  else if (k < 2) nextHopArrow(ctx, c, from, 1 - (k + 1) / 2.2);
  else if (k < 4) nextHopArrow(ctx, c, to, (k - 1) / 3);
  else nextHopArrow(ctx, c, to, 1);
}

/** ttl tag box size (glyph 36 'ttl 62' + 12 px padding). */
export const TAG_W = 154;
export const TAG_H = 44;
/** Tag offsets (tag top-left relative to the packet centre). */
export const TAG_OFF = {
  below: { x: -77, y: 48 },
  left: { x: -222, y: -22 },
  above: { x: -77, y: -100 },
  right: { x: 68, y: -22 },
} as const;

/** ttl tag riding with the packet: paper plate, glyph 36 inkDeep; scrambles 8 f on change at t0. */
export function ttlTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, t0: number, t: number): void {
  ctx.save();
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(Math.round(x), Math.round(y), TAG_W, TAG_H);
  scrambleText(ctx, text, Math.round(x) + 12, Math.round(y) + 4, font('glyph', 36), PALETTE.inkDeep, t0, t, 8);
  ctx.restore();
}

/** Density ramp over a box in an ascii layer (`p` from rampIn/rampOut); returns true while ramping. */
export function rampBox(a: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, p: number, color?: string): boolean {
  if (p < 0 || p >= 1) return false;
  const r = asciiRamp(p);
  if (r.density > 0) {
    a.save();
    a.fillStyle = color ? hexA(color, r.density) : asciiInk(r.density);
    a.fillRect(box.x, box.y, box.w, box.h);
    a.restore();
  }
  return true;
}
function hexA(hex: string, d: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${d})`;
}

/** Hard glitch: shift a few horizontal crisp bands (pure function of the frame). */
export function glitchBands(ctx: CanvasRenderingContext2D, frame: number, bands = 4): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  for (let i = 0; i < bands; i++) {
    const y = Math.floor(hash01(frame, i, 7) * (H / 20)) * 20;
    const h = 20 * (2 + Math.floor(hash01(frame, i, 8) * 6));
    const dx = Math.round((hash01(frame, i, 9) - 0.5) * 96 / 12) * 12;
    if (dx === 0) continue;
    const img = ctx.getImageData(0, y, W, Math.min(h, H - y));
    ctx.putImageData(img, dx, y);
  }
}

/* ================================================================== S09 */

const T0 = 24.3;
const HOP1 = 24.3; // R2→R3 (schematic)
const PULL = 24.7; // pull-back 24 f
const RIPPLE = 25.6;
const TTL61 = 26.0;
const DECIDE = 26.38;
const HOP2 = 27.25; // R3→R4
const R4LABEL = 27.8;
const TTL60 = 28.1;
const REDECIDE = 28.3;
const END = 28.8;

/** S08 schematic column world y (scroll-relative); x = 270. */
const SCHEM_Y: Partial<Record<NodeId, number>> = { D: 700, R1: 960, R2: 1220, R3: 1480, R4: 1740 };
const COL_X = 270;

const scroll = (t: number): number => 520 + 260 * easeInOutQuart(progress(HOP1 + 2 / 30, t, 14));
const morph = (t: number): number => easeInOutQuart(progress(PULL, t, 24));

function schemPos(id: NodeId, t: number): Point {
  const y = SCHEM_Y[id];
  if (y !== undefined) return { x: COL_X, y: y - scroll(t) };
  // Off-column nodes: where they'd sit at zoom 2 around R3 (anchored at 270,700).
  const n = NODES[id];
  return { x: COL_X + (n.x - NODES.R3.x) * 2, y: 700 + (n.y - NODES.R3.y) * 2 };
}

export function s09Pos(id: NodeId, t: number): Point {
  const u = morph(t);
  if (u >= 1) return NODES[id];
  const s = schemPos(id, t);
  return { x: lerp(s.x, NODES[id].x, u), y: lerp(s.y, NODES[id].y, u) };
}

/** Tracked packet centre (screen) at global time t. */
function packetAt(t: number): Point {
  if (t < HOP1) return s09Pos('R2', t);
  if (t < HOP2) {
    const u = easeInOutCubic(progress(HOP1, t, 12));
    const a = s09Pos('R2', t);
    const b = s09Pos('R3', t);
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
  }
  const u = easeInOutCubic(progress(HOP2, t, 12));
  return { x: lerp(NODES.R3.x, NODES.R4.x, u), y: lerp(NODES.R3.y, NODES.R4.y, u) };
}

function tagOffset(t: number): Point {
  if (t < HOP2) {
    const u = morph(t);
    return { x: lerp(TAG_OFF.below.x, TAG_OFF.left.x, u), y: lerp(TAG_OFF.below.y, TAG_OFF.left.y, u) };
  }
  const u = easeInOutCubic(progress(HOP2, t, 12));
  return { x: lerp(TAG_OFF.left.x, TAG_OFF.above.x, u), y: lerp(TAG_OFF.left.y, TAG_OFF.above.y, u) };
}

const ARROW_R1 = arrowAt('R1', 'R2');
const ARROW_R2 = arrowAt('R2', 'R3');
const ARROW_R3 = arrowAt('R3', 'R4', 17);
const ARROW_R4 = arrowAt('R4', 'R5a');
export const R4_TO_R5A = ARROW_R4;
export const R4_TO_R5B = arrowAt('R4', 'R5b', 11);
export { ARROW_R1, ARROW_R2, ARROW_R3 };

function draw(fc: FrameCtx): void {
  const t = fc.t;
  const c = fc.crisp;
  const u = morph(t);
  const pos = (id: NodeId): Point => s09Pos(id, t);
  const clipTop = lerp(560, 0, u);
  const clipBot = lerp(1060, 1920, u);

  /* ---- ascii: S08 '.' grid (fades with the pull-back), bleed + decorative mesh (fade in) */
  if (u < 0.5) {
    const a = fc.ascii;
    a.save();
    a.fillStyle = asciiInk(rampDensity('.'));
    const off = 40 - (scroll(t) % 80);
    const z = lerp(1, 0.5, u);
    for (let y = off; y < 1920; y += 80 * z)
      for (let x = 36; x < 1080; x += 96 * z) a.fillRect(Math.round(x), Math.round(y), 12, 20);
    a.restore();
  }
  drawBleed(fc, pos, (p) => {
    // bleed nodes glide in from outside while the map settles
    const s = { x: 540 + (p.x - 540) * (2 - u), y: 960 + (p.y - 960) * (2 - u) };
    return s;
  }, u);

  c.save();
  fc.ascii.save();
  if (clipTop > 0) {
    for (const ctx of [c, fc.ascii]) {
      ctx.beginPath();
      ctx.rect(0, clipTop, 1080, clipBot - clipTop);
      ctx.clip();
    }
  }

  /* ---- links */
  const hop1 = progress(HOP1, t, 12);
  const hop2 = progress(HOP2, t, 12);
  const offCol = (id: NodeId): number => (SCHEM_Y[id] !== undefined ? 1 : rampIn(PULL, t, 8));
  for (const [a, b] of MESH_LINKS) {
    if (offCol(a) < 1 || offCol(b) < 1) continue;
    const key = `${a}-${b}`;
    let fill = 0;
    let width = 3;
    if (key === 'D-R1' || key === 'R1-R2') { fill = 1; width = u < 0.5 ? 3 : 2; }
    else if (key === 'R2-R3') { fill = hop1; width = hop1 < 1 || u < 0.5 ? 3 : 2; }
    else if (key === 'R3-R4') { fill = hop2; width = hop2 < 1 ? 3 : 2; }
    link(c, pos(a), pos(b), { fill, width });
  }

  /* ---- nodes */
  const cols = Math.round(lerp(15, 10, u));
  const rows = Math.round(lerp(6, 4, u));
  const ripplePulse = (i: number): number => {
    const k = framesSince(RIPPLE + (i * 3) / 30, t);
    return k >= 0 && k < 4 ? 1 - k / 4 : 0;
  };
  const r3Arrive = framesSince(HOP1 + 12 / 30, t);
  const r4Arrive = framesSince(R4LABEL, t);
  const redecide = framesSince(REDECIDE, t);
  for (const id of ['D', 'R1', 'R2', 'R3', 'R4', 'R5a', 'R5b', 'E'] as NodeId[]) {
    let pulse = 0;
    if (id === 'R1') pulse = ripplePulse(0);
    if (id === 'R2') pulse = ripplePulse(1);
    if (id === 'R3') pulse = Math.max(ripplePulse(2), r3Arrive >= 0 && r3Arrive < 6 ? 1 - r3Arrive / 6 : 0);
    if (id === 'R4') {
      pulse = ripplePulse(3);
      if (r4Arrive >= 0 && r4Arrive < 8) pulse = Math.max(pulse, 1 - r4Arrive / 8);
      // R4 decides again for this packet (28.30 → end): slow breathing pulse
      if (redecide >= 0) pulse = Math.max(pulse, 0.35 + 0.35 * Math.sin(redecide * 0.6));
    }
    drawNode(fc, id, pos(id), { cols, rows, vis: offCol(id), pulse });
  }
  c.restore();
  fc.ascii.restore();

  /* ---- labels (after the pull-back) */
  if (u >= 1) {
    const tagT0 = PULL + 24 / 30;
    for (const id of ['D', 'R1', 'R2', 'R3', 'R4', 'R5a', 'R5b', 'E'] as NodeId[]) {
      if (id === 'R3') nodeLabel(c, id, t, t < HOP2, tagT0);
      else if (id === 'R4') nodeLabel(c, id, t, t >= R4LABEL, t >= R4LABEL ? R4LABEL : tagT0);
      else nodeLabel(c, id, t, false, tagT0);
    }
    // R3 decision label (placed above R3 so the 24-char line stays inside x ≤ 960)
    if (t >= DECIDE) plateText(c, 'next hop → 198.51.100.77', 440, 636, t, { t0: DECIDE, typed: true, frames: 8 });

    // next-hop arrows: appear with the tags, ripple-flip 3 f apart (4 f each)
    const arrows = [ARROW_R1, ARROW_R2, ARROW_R3, ARROW_R4];
    arrows.forEach((ar, i) => {
      const t0 = RIPPLE + (i * 3) / 30;
      if (i === 3 && t >= REDECIDE) flippingArrow(c, ar.c, ar.angle + Math.PI / 2, ar.angle, REDECIDE, t);
      else flippingArrow(c, ar.c, ar.angle + Math.PI / 2, ar.angle, t0, t);
    });
  }

  /* ---- S08 macro overlays: label block + ↓ arrow (until the pull-back), readout → ttl tag */
  if (t < PULL) {
    drawText(c, 'hop 2 · bras1.isp.example', 400, 640, { px: 36 });
    drawText(c, '198.51.100.1 · AS64496', 400, 684, { px: 36 });
    drawText(c, 'next hop → 198.51.100.45', 400, 740, { px: 36 });
    if (hop1 < 0.5) drawText(c, '↓', 250, 780, { px: 48, color: PALETTE.ink });
  } else {
    rampBox(fc.ascii, { x: 396, y: 640, w: 528, h: 136 }, 1 - (framesSince(PULL, t) + 1) / 6);
  }

  const p = packetAt(t);
  const off = tagOffset(t);
  const m = easeInOutCubic(progress(PULL, t, 8));
  if (m < 1) {
    // readout plate morphs into the ttl tag
    const bx = lerp(120, p.x + off.x, m);
    const by = lerp(440, p.y + off.y, m);
    const bw = lerp(500, TAG_W, m);
    const bh = lerp(120, TAG_H, m);
    c.save();
    c.fillStyle = PALETTE.paper;
    c.fillRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
    const bord = Math.round(lerp(3, 0, m));
    if (bord > 0) {
      c.strokeStyle = PALETTE.ink;
      c.lineWidth = bord;
      c.strokeRect(Math.round(bx) + bord / 2, Math.round(by) + bord / 2, Math.round(bw) - bord, Math.round(bh) - bord);
    }
    if (m <= 0) drawText(c, 'dst 203.0.113.10', 136, 448, { px: 48 });
    drawText(c, 'ttl 62', bx + lerp(16, 12, m), by + lerp(60, 4, m), { px: Math.round(lerp(48, 36, m)) });
    c.restore();
  } else {
    const [txt, t0] = t >= TTL60 ? ['ttl 60', TTL60] : t >= TTL61 ? ['ttl 61', TTL61] : ['ttl 62', -1];
    ttlTag(c, p.x + off.x, p.y + off.y, txt as string, t0 as number, t);
  }

  /* ---- tracked packet */
  c.save();
  if (clipTop > 0) {
    c.beginPath();
    c.rect(0, clipTop, 1080, clipBot - clipTop);
    c.clip();
  }
  trackedPacket(c, packetAt, t);
  c.restore();

  /* ---- chrome */
  sectionHeader(c, '03', 'routing', 20.0, t);
  hudStopwatch(c, t);

  /* ---- hard glitch cut into S10 (last 3 f) */
  const toEnd = framesSince(t, END);
  if (toEnd >= 1 && toEnd <= 3) glitchBands(c, fc.frame, 3 + (3 - toEnd));
}

const scene: Scene = { id: 'S09', start: T0, end: END, draw: (fc) => draw(fc) };
export default scene;
