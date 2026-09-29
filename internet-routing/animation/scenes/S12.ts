/**
 * S12 · 04 Arrival, "snap into order" (34.90–38.00 s, frames 1047–1139).
 * Pull-back from the rack to the wide map; the 13 cards stream back E→R5b→R4→R3→R2→R1 and lock
 * into the tray slots 01–13; the HUD freezes at 36.95 (hudStopwatch defaults).
 */
import {
  PALETTE,
  asciiInk,
  easeInOutCubic,
  easeInOutQuart,
  easeOutBack,
  font,
  framesSince,
  hash01,
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
  typeText,
  drawText,
  type Point,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';
import { MESH_LINKS, NODES, drawBleed, drawNode, nodeLabel, rampBox, type NodeId } from './S09';
import { CARD_H, CARD_W, S11_LABELS, TRACK_H, TRACK_W, camAt, cardId, cardWorld, originGhost, rackSize } from './S11';

const START = 34.9;
const END = 38.0;
const PULL = 34.9; // 21 f
const MESH_IN = 34.95; // 8 f ramp
const HOPS = [34.95, 35.28, 35.62, 35.95, 36.28, 36.62];
const HOP_F = 10;
const GAP = 2 / 30; // card spacing in the train
const TRAY = 35.6;
const TRAY_LABEL = 37.9;

const ROUTE: NodeId[] = ['R5b', 'R4', 'R3', 'R2', 'R1'];
const SLOT_W = 48;
const SLOT_H = 60;
const slotX = (i: number): number => 288 + i * 52;
const slotCentre = (i: number): Point => ({ x: slotX(i) + SLOT_W / 2, y: 440 + SLOT_H / 2 });
const TRAIN_W = 48;
const TRAIN_H = 40;

/** Camera push progress (1 = zoom 2 on E, 0 = wide). */
const camU = (t: number): number => 1 - easeInOutQuart(progress(PULL, t, 21));

interface CardState {
  world: Point;
  /** Screen-space override (after the camera is wide, the tray is screen = world). */
  hop: number; // −1 before departure, 0..5 during/after hop j
  u: number; // progress of the current hop 0..1
  landed: boolean;
  landK: number; // frames since landing
}

function cardState(i: number, t: number): CardState {
  const d = i * GAP;
  const pts: Point[] = [cardWorld(i), ...ROUTE.map((id) => NODES[id]), slotCentre(i)];
  let hop = -1;
  for (let j = 0; j < HOPS.length; j++) if (framesSince(HOPS[j] + d, t) >= 0) hop = j;
  if (hop < 0) return { world: pts[0], hop, u: 0, landed: false, landK: -1 };
  const u = progress(HOPS[hop] + d, t, HOP_F);
  const a = pts[hop];
  const b = pts[hop + 1];
  let e: number;
  if (hop === HOPS.length - 1) {
    // last hop into the slot: ≈1-cell (12–20 px) overshoot
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    e = easeOutBack(u, Math.min(1.70158, (1.70158 * 16) / (0.1 * dist)));
  } else e = easeInOutCubic(u);
  const landK = hop === HOPS.length - 1 ? framesSince(HOPS[hop] + d + HOP_F / 30, t) : -1;
  return { world: { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) }, hop, u, landed: landK >= 0, landK };
}

function draw(fc: FrameCtx): void {
  const t = fc.t;
  const c = fc.crisp;
  const cu = camU(t);
  const { view, zoom } = camAt(cu);
  const pos = (id: NodeId): Point => view(NODES[id]);

  /* ---- S11 labels + ghost ramp out */
  const lo = rampOut(PULL, t, 6);
  if (lo >= 0 && lo < 1) for (const b of S11_LABELS) rampBox(fc.ascii, b, lo);
  if (lo >= 0) originGhost(fc, t, lo >= 1 ? 1 : lo);

  /* ---- mesh ramps back in */
  const vis = rampIn(MESH_IN, t, 8);
  const meshOn = vis >= 1;
  drawBleed(fc, pos, view, Math.max(0, Math.min(1, vis)));
  const s01 = cardState(0, t);
  if (meshOn) {
    // return path fills behind #01
    const PATH: NodeId[] = ['E', ...ROUTE, 'D'];
    const onPath = (from: NodeId, to: NodeId): boolean => PATH[PATH.indexOf(from) + 1] === to;
    const fillOf = (from: NodeId): number => {
      const j = PATH.indexOf(from);
      return s01.hop > j ? 1 : s01.hop === j ? s01.u : 0;
    };
    for (const [a, b] of MESH_LINKS) {
      if (a === 'R4' && b === 'R5a') link(c, pos(a), pos(b), { state: 'dead' });
      else if (onPath(b, a)) link(c, pos(b), pos(a), { fill: fillOf(b) });
      else if (onPath(a, b)) link(c, pos(a), pos(b), { fill: fillOf(a) });
      else link(c, pos(a), pos(b));
    }
  }
  const trainPulse = (id: NodeId): number => {
    const j = ROUTE.indexOf(id);
    if (j < 0) return 0;
    // pulse while the train passes through (#01 arrives … #13 leaves)
    const a = HOPS[j] + HOP_F / 30;
    const b = HOPS[j + 1] + 12 * GAP;
    return t >= a && t < b ? 0.6 + 0.4 * hash01(fc.frame, j) : 0;
  };
  for (const id of ['D', 'R1', 'R2', 'R3', 'R4', 'R5a', 'R5b'] as NodeId[]) drawNode(fc, id, pos(id), { vis: meshOn ? 1 : vis, pulse: trainPulse(id) });
  const { cols, rows } = rackSize(cu);
  drawNode(fc, 'E', pos('E'), { cols, rows, halo: lerp(0.28, 0.45, cu), pulse: t < HOPS[1] ? 0.5 : 0 });
  if (cu <= 0) for (const id of ['D', 'R1', 'R2', 'R3', 'R4', 'R5a', 'R5b', 'E'] as NodeId[]) nodeLabel(c, id, t, false, PULL + 21 / 30);

  /* ---- tray */
  const kt = framesSince(TRAY, t);
  if (kt >= 0) {
    const g = font('glyph', 36);
    c.save();
    c.strokeStyle = PALETTE.ink;
    c.lineWidth = 2;
    c.setLineDash([4, 4]);
    for (let i = 0; i < 13; i++) {
      if (kt < Math.floor(i / 3)) continue; // slots appear left→right as the scramble runs
      c.strokeRect(slotX(i) + 1, 441, SLOT_W - 2, SLOT_H - 2);
    }
    c.setLineDash([]);
    for (let i = 0; i < 13; i++) scrambleText(c, String(i + 1).padStart(2, '0'), slotX(i) + 3, 452, g, PALETTE.inkDeep, TRAY, t, 8);
    c.restore();
  }
  if (t >= TRAY_LABEL) {
    const txt = '13/13 · 18,431 B';
    c.font = font('glyph', 36);
    const w = c.measureText(txt).width;
    typeText(c, txt, 960 - w, 506, font('glyph', 36), PALETTE.inkDeep, TRAY_LABEL, t, 3);
  }

  /* ---- the train (drawn back to front: #13 first, #01 on top) */
  for (let i = 12; i >= 0; i--) {
    const s = i === 0 ? s01 : cardState(i, t);
    const sp = view(s.world);
    if (s.landed) {
      // locked in its slot: ink frame, number
      const box = { x: Math.round(sp.x - SLOT_W / 2), y: Math.round(sp.y - SLOT_H / 2), w: SLOT_W, h: SLOT_H };
      packetCard(c, box, { border: 3 });
      drawText(c, String(i + 1).padStart(2, '0'), box.x + SLOT_W / 2, box.y + 12, { px: 36, align: 'center' });
      continue;
    }
    // size: grid card (scaled with the camera) → train card → slot card
    const gw = (CARD_W * zoom) / 2;
    const gh = (CARD_H * zoom) / 2;
    if (i === 0) {
      let w = (TRACK_W * zoom) / 2;
      let h = (TRACK_H * zoom) / 2;
      let id = cardId(0);
      if (s.hop === 0) { w = lerp(w, TRACK_W, s.u); h = lerp(h, 64, s.u); }
      else if (s.hop > 0) { w = TRACK_W; h = 64; }
      if (s.hop === HOPS.length - 1) { w = lerp(TRACK_W, 96, Math.min(1, s.u * 2)); id = '01'; }
      trackedPacket(c, (tt) => view(cardState(0, tt).world), t, { w: Math.round(w), h: Math.round(h), id, trail: s.hop >= 0 });
      continue;
    }
    let w = gw;
    let h = gh;
    if (s.hop === 0) { w = lerp(gw, TRAIN_W, s.u); h = lerp(gh, TRAIN_H, s.u); }
    else if (s.hop > 0) { w = TRAIN_W; h = s.hop === HOPS.length - 1 ? lerp(TRAIN_H, SLOT_H, s.u) : TRAIN_H; }
    const box = { x: Math.round(sp.x - w / 2), y: Math.round(sp.y - h / 2), w: Math.round(w), h: Math.round(h) };
    if (s.hop >= 0) {
      // train shimmer in the ascii layer
      fc.ascii.save();
      fc.ascii.fillStyle = asciiInk(0.12 + 0.3 * hash01(fc.frame >> 1, i, 5));
      fc.ascii.fillRect(box.x - 24, box.y - 20, box.w + 48, box.h + 40);
      fc.ascii.restore();
      packetCard(c, box);
    } else {
      packetCard(c, box);
      if (zoom > 1.6) scrambleText(c, cardId(i), box.x + 1, box.y + box.h / 2 - 18, font('glyph', 36), PALETTE.inkDeep, 0, t, 1);
    }
  }

  sectionHeader(c, '04', 'arrival', 31.65, t, { mode: 'typed' });
  hudStopwatch(c, t);
}

const scene: Scene = { id: 'S12', start: START, end: END, draw: (fc) => draw(fc) };
export default scene;
