/**
 * S11 · 04 Arrival, "a nearby copy" (31.60–34.90 s, frames 948–1046).
 * Push-in to E (zoom 2): the edge node assembles into the server rack, the request dissolves into
 * it, labels resolve, the origin ghost appears, the page prints and slices into 13 cards, #01 is tracked.
 * Visual beats follow the timeline captions ('the server' 32.696, 'is a nearby copy.' 33.397).
 */
import {
  PALETTE,
  cloudField,
  easeInOutQuart,
  font,
  framesSince,
  hudStopwatch,
  lerp,
  link,
  packetCard,
  progress,
  rampIn,
  rampOut,
  scrambleText,
  sectionHeader,
  trackedPacket,
  asciiRamp,
  type Point,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';
import {
  ARROW_R1,
  ARROW_R2,
  ARROW_R3,
  MESH_LINKS,
  NODES,
  TAG_OFF,
  drawBleed,
  drawNode,
  nextHopArrow,
  R4_TO_R5B,
  nodeLabel,
  plateText,
  rampBox,
  ttlTag,
  viewOf,
  type NodeId,
  type View,
} from './S09';

const START = 31.6;
const END = 34.9;
const PUSH = 31.6; // 24 f
const HEAD = 31.65;
const MESH_OUT = 31.7;
const ABSORB = 32.3;
const SERVER = 32.7;
const COPY = 33.4;
const PRINT = 34.0;
const TRACK = 34.8;

/* ---- shared with S12 */
/** Rack centre on screen at zoom 2 (rack x 120–480, y 600–800). */
export const RACK_S: Point = { x: 300, y: 700 };
/** Camera at push progress u (0 = wide identity, 1 = zoom 2 on E). */
export function camAt(u: number): { view: View; zoom: number } {
  const E = NODES.E;
  const z = lerp(1, 2, u);
  return { view: viewOf(E, { x: lerp(E.x, RACK_S.x, u), y: lerp(E.y, RACK_S.y, u) }, z), zoom: z };
}
/** E cluster size: 10×4 (wide) → 30×10 cells = 360×200 rack at zoom 2. */
export function rackSize(u: number): { cols: number; rows: number } {
  return { cols: Math.round(lerp(10, 30, u)), rows: Math.round(lerp(4, 10, u)) };
}
export const CARD_W = 130;
export const CARD_H = 40;
/** Card i (0-based) centre on screen at zoom 2: 3 × 5 grid in x 530–956, y 590–800. */
export function cardScreen(i: number): Point {
  return { x: 530 + (i % 3) * 148 + CARD_W / 2, y: 590 + Math.floor(i / 3) * 42 + CARD_H / 2 };
}
/** Card i centre in world coords (inverse of the zoom-2 camera). */
export function cardWorld(i: number): Point {
  const s = cardScreen(i);
  return { x: NODES.E.x + (s.x - RACK_S.x) / 2, y: NODES.E.y + (s.y - RACK_S.y) / 2 };
}
export const cardId = (i: number): string => `#${String(i + 1).padStart(2, '0')}/13`;
/** Tracked #01 size at TRACK (grows 2 cells, 4 f). */
export const TRACK_W = 154;
export const TRACK_H = 80;

/** S11 screen labels (also ramped out by S12). */
export const S11_LABELS = [
  { x: 116, y: 440, w: 330, h: 48 },
  { x: 116, y: 496, w: 488, h: 36 },
  { x: 586, y: 540, w: 376, h: 36 },
  { x: 116, y: 804, w: 680, h: 36 },
];
export const GHOST = { x: 720, y: 440, w: 240, h: 90 };

/** Origin ghost: paperShade glyph cloud, density ×k. */
export function originGhost(fc: FrameCtx, t: number, k: number): void {
  if (k <= 0) return;
  cloudField(fc.ascii, GHOST, t, { seed: 7, scale: 60, density: k, threshold: 0.2, drift: 6, mode: 'ascii', rgb: [0xe2, 0xda, 0xca], feather: 16 });
}

/** Draw the 13-card grid (final state) with optional scramble start for labels. */
export function cardGrid(c: CanvasRenderingContext2D, t: number, labelT0: number, skip: (i: number) => boolean = () => false): void {
  const g = font('glyph', 36);
  for (let i = 0; i < 13; i++) {
    if (skip(i)) continue;
    const p = cardScreen(i);
    packetCard(c, { x: p.x - CARD_W / 2, y: p.y - CARD_H / 2, w: CARD_W, h: CARD_H });
    scrambleText(c, cardId(i), p.x - CARD_W / 2 + 1, p.y - 18, g, PALETTE.inkDeep, labelT0, t, 6);
  }
}

function draw(fc: FrameCtx): void {
  const t = fc.t;
  const c = fc.crisp;
  const u = easeInOutQuart(progress(PUSH, t, 24));
  const { view } = camAt(u);

  /* ---- mesh ramps out as the camera pushes in */
  const vis = rampOut(MESH_OUT, t, 6);
  const meshOn = vis >= 1;
  const pos = (id: NodeId): Point => view(NODES[id]);
  if (vis >= 0) drawBleed(fc, pos, view, vis >= 1 ? 1 : vis);
  if (meshOn) {
    for (const [a, b] of MESH_LINKS) {
      const key = `${a}-${b}`;
      if (key === 'R4-R5a') link(c, pos(a), pos(b), { state: 'dead' });
      else if (key === 'R5a-E') link(c, pos(a), pos(b));
      else link(c, pos(a), pos(b), { fill: 1, width: 2 });
    }
  }
  for (const id of ['D', 'R1', 'R2', 'R3', 'R4', 'R5a', 'R5b'] as NodeId[]) drawNode(fc, id, pos(id), { vis: vis >= 1 ? 1 : vis });
  if (meshOn) {
    for (const id of ['D', 'R1', 'R2', 'R3', 'R4', 'R5a'] as NodeId[]) nodeLabel(c, id, t);
    nodeLabel(c, 'R5b', t, true);
    nodeLabel(c, 'E', t, true);
    for (const ar of [ARROW_R1, ARROW_R2, ARROW_R3, R4_TO_R5B]) nextHopArrow(c, view(ar.c), ar.angle);
  }

  /* ---- rack (E assembles into it) */
  const { cols, rows } = rackSize(u);
  const ka = framesSince(ABSORB, t);
  const kp = framesSince(PRINT, t);
  let pulse = ka >= 0 && ka < 12 ? 1 - ka / 12 : 0;
  if (kp >= 0 && kp < 10) pulse = Math.max(pulse, 0.6 * (1 - kp / 10));
  drawNode(fc, 'E', pos('E'), { cols, rows, pulse, halo: lerp(0.28, 0.45, u) });

  /* ---- request block: docked, then ramp-dissolves into the rack */
  const pe = pos('E');
  const pOut = rampOut(ABSORB, t, 8);
  if (pOut >= 1) {
    if (meshOn) ttlTag(c, pe.x + TAG_OFF.right.x, pe.y + TAG_OFF.right.y, 'ttl 59', -1, t);
    trackedPacket(c, () => pe, t, { trail: false });
  } else rampBox(fc.ascii, { x: pe.x - 48, y: pe.y - 32, w: 96, h: 64 }, pOut, PALETTE.signal);

  /* ---- labels */
  plateText(c, 'edge server', 120, 440, t, { role: 'display', px: 48, t0: SERVER, frames: 8 });
  plateText(c, '203.0.113.10 · AS64511', 120, 496, t, { t0: SERVER, frames: 8 });
  const gr = asciiRamp(rampIn(COPY, t, 8));
  originGhost(fc, t, gr.resolved ? 1 : gr.density);
  plateText(c, 'origin: not asked', 590, 540, t, { t0: COPY, frames: 10, typed: true });
  plateText(c, 'copy of example.com · cache HIT', 120, 804, t, { t0: COPY, frames: 10, typed: true });

  /* ---- page prints out of the rack and slices into 13 cards */
  if (kp >= 0) {
    if (kp < 5) {
      const w = Math.round((426 * (kp + 1)) / 5 / 12) * 12;
      c.save();
      // feed from the rack edge
      c.fillStyle = PALETTE.ink;
      for (let y = 600; y < 800; y += 20) c.fillRect(484, y + 8, 42, 4);
      packetCard(c, { x: 530, y: 590, w, h: 210 }, { border: 3 });
      c.beginPath();
      c.rect(530, 590, w, 210);
      c.clip();
      c.fillStyle = PALETTE.inkDeep;
      c.fillRect(530, 590, 426, 44);
      c.font = font('glyph', 36);
      c.fillStyle = PALETTE.paper;
      c.textBaseline = 'middle';
      c.fillText('index.html · 18 KB', 542, 612);
      c.fillStyle = PALETTE.ink;
      for (let y = 650; y < 790; y += 20) c.fillRect(542, y, 400 - ((y * 7) % 120), 6);
      c.restore();
    } else {
      cardGrid(c, t, PRINT + 5 / 30, (i) => i === 0 && t >= TRACK);
    }
  }

  /* ---- #01 becomes tracked */
  const kt = framesSince(TRACK, t);
  if (kt >= 0) {
    const g = Math.min(1, (kt + 1) / 4);
    const p = cardScreen(0);
    trackedPacket(c, () => p, t, { w: Math.round(lerp(CARD_W, TRACK_W, g)), h: Math.round(lerp(CARD_H, TRACK_H, g)), trail: false, id: g >= 1 ? cardId(0) : undefined });
  }

  sectionHeader(c, '04', 'arrival', HEAD, t, { mode: 'typed' });
  hudStopwatch(c, t);
}

const scene: Scene = { id: 'S11', start: START, end: END, draw: (fc) => draw(fc) };
export default scene;
