/**
 * S10 · 03 Routing, the link failure and reroute (28.80–31.60 s, frames 864–947). The only red.
 * Event times: S10 remap [28.30,31.60]→[28.80,31.60] combined with the v10 VO shift (+0.47 s),
 * matched to the placed SFX (crunch 28.80, tick 30.02, blip5 30.71, chirp 31.447).
 */
import {
  PALETTE,
  drawText,
  easeInOutCubic,
  easeOutBack,
  font,
  framesSince,
  hudStopwatch,
  lerp,
  link,
  progress,
  rampOut,
  scrambleChar,
  sectionHeader,
  trackedPacket,
  typeText,
  type Point,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';
import {
  ARROW_R1,
  ARROW_R2,
  ARROW_R3,
  MESH_LINKS,
  NODES,
  R4_TO_R5A,
  R4_TO_R5B,
  TAG_OFF,
  drawBleed,
  drawNode,
  flippingArrow,
  nextHopArrow,
  nodeLabel,
  plateText,
  rampBox,
  ttlTag,
  type NodeId,
} from './S09';

const START = 28.8;
const END = 31.6;
const FAIL = 28.8; // link snaps red, slip, ✕
const LINKDOWN = 29.07; // 'link down' scramble (8 f)
const PANEL = 29.37; // table panel drops (6 f), then types (10 f)
const STRIKE = 29.77; // /24 strike (6 f)
const CHOOSE = 30.02; // /16 inverts + ▶ (SFX tick)
const FLIP = 30.37; // R4 arrow R5a → R5b (4 f)
const HOP5 = 30.71; // R4 → R5b (10 f, SFX blip5)
const HOP5_F = 10;
const RESTORE = HOP5 + HOP5_F / 30; // error → dead link; panel + link down ramp out (6 f)
const INK_BACK = RESTORE + 6 / 30; // ink restored once the red label has ramped out
const R5B_LABEL = INK_BACK; // R5b label types (after link down exits)
const HOP6 = 31.12; // R5b → E
const DOCK = 31.447; // SFX chirp
const HOP6_F = Math.round((DOCK - HOP6) * 30);

const X_AT: Point = { x: 470, y: 795 };

function packetAt(t: number): Point {
  const R4 = NODES.R4;
  const R5b = NODES.R5b;
  const E = NODES.E;
  if (t < START) {
    // tail of S09's hop R3→R4 (for the trail only)
    const u = easeInOutCubic(progress(27.25, t, 12));
    return { x: lerp(NODES.R3.x, R4.x, u), y: lerp(NODES.R3.y, R4.y, u) };
  }
  if (t < HOP6) {
    const u = easeInOutCubic(progress(HOP5, t, HOP5_F));
    return { x: lerp(R4.x, R5b.x, u), y: lerp(R4.y, R5b.y, u) };
  }
  const u = easeInOutCubic(progress(HOP6, t, HOP6_F));
  return { x: lerp(R5b.x, E.x, u), y: lerp(R5b.y, E.y, u) };
}

function tagOffset(t: number): Point {
  const u = easeInOutCubic(progress(HOP5, t, HOP5_F));
  return { x: lerp(TAG_OFF.above.x, TAG_OFF.right.x, u), y: lerp(TAG_OFF.above.y, TAG_OFF.right.y, u) };
}

/** Error ✕ (vector, error colour, 66 px glyph box) with a 4 f scramble-resolve lead-in. */
function errorX(c: CanvasRenderingContext2D, t: number): void {
  const k = framesSince(FAIL, t);
  if (k < 0) return;
  c.save();
  c.fillStyle = PALETTE.paper;
  c.fillRect(X_AT.x - 30, X_AT.y - 33, 60, 66);
  if (k < 4) {
    drawText(c, scrambleChar('x', 0, k), X_AT.x, X_AT.y - 33, { px: 66, color: PALETTE.error, align: 'center' });
  } else {
    c.strokeStyle = PALETTE.error;
    c.lineWidth = 8;
    c.lineCap = 'square';
    c.beginPath();
    c.moveTo(X_AT.x - 18, X_AT.y - 18);
    c.lineTo(X_AT.x + 18, X_AT.y + 18);
    c.moveTo(X_AT.x + 18, X_AT.y - 18);
    c.lineTo(X_AT.x - 18, X_AT.y + 18);
    c.stroke();
  }
  c.restore();
}

/** R4 routing-table panel (x 120–900, y 430–590). */
function tablePanel(fc: FrameCtx, t: number): void {
  const c = fc.crisp;
  const kd = framesSince(PANEL, t);
  if (kd < 0) return;
  const out = rampOut(RESTORE, t, 6);
  if (out < 0) return;
  const box = { x: 120, y: 430, w: 780, h: 160 };
  if (out < 1) {
    rampBox(fc.ascii, box, out);
    return;
  }
  const y0 = Math.round(lerp(390, 430, easeOutBack(progress(PANEL, t, 6), 2.2)));
  const dy = y0 - 430;
  const g = font('glyph', 36);
  c.save();
  c.fillStyle = PALETTE.paper;
  c.fillRect(box.x, y0, box.w, box.h);
  c.strokeStyle = PALETTE.inkDeep;
  c.lineWidth = 3;
  c.strokeRect(box.x + 1.5, y0 + 1.5, box.w - 3, box.h - 3);
  const typeT0 = PANEL + 6 / 30;
  const l1 = 'route to 203.0.113.10';
  const l2 = '203.0.113.0/24 via 203.0.113.129';
  const l3 = '203.0.0.0/16   via 198.51.100.140';
  const tx = 156;
  const chosen = framesSince(CHOOSE, t) >= 0;
  if (chosen) {
    c.fillStyle = PALETTE.inkDeep;
    c.fillRect(box.x + 3, 536 + dy, box.w - 6, 36);
    // ▶ marker at x 124
    c.fillStyle = PALETTE.paper;
    c.beginPath();
    c.moveTo(126, 542 + dy);
    c.lineTo(148, 554 + dy);
    c.lineTo(126, 566 + dy);
    c.closePath();
    c.fill();
  }
  typeText(c, l1, tx, 440 + dy, g, PALETTE.inkDeep, typeT0, t, 10);
  typeText(c, l2, tx, 488 + dy, g, PALETTE.inkDeep, typeT0, t, 10);
  typeText(c, l3, tx, 536 + dy, g, chosen ? PALETTE.paper : PALETTE.inkDeep, typeT0, t, 10);
  const ks = framesSince(STRIKE, t);
  if (ks >= 0) {
    c.font = g;
    const w = c.measureText(l2).width;
    c.fillStyle = PALETTE.error;
    c.fillRect(tx - 4, 504 + dy, Math.round((w + 8) * Math.min(1, (ks + 1) / 6)), 4);
  }
  c.restore();
}

function draw(fc: FrameCtx): void {
  const t = fc.t;
  const c = fc.crisp;
  const kf = framesSince(FAIL, t);
  const red = t < INK_BACK;
  const errorOn = t < RESTORE;

  // global fx: inkDeep re-ink while red is on screen; slip 6 px for 2 f at the failure
  fc.fx.inkOverride = red ? PALETTE.inkDeep : undefined;
  fc.fx.slip = kf >= 0 && kf < 2 ? 6 : 0;

  const shake = kf === 0 ? { x: 4, y: 4 } : kf === 1 ? { x: -4, y: -2 } : { x: 0, y: 0 };
  const pos = (id: NodeId): Point => ({ x: NODES[id].x + shake.x, y: NODES[id].y + shake.y });

  drawBleed(fc, pos, (p) => ({ x: p.x + shake.x, y: p.y + shake.y }), 1);

  /* ---- links */
  const h5 = progress(HOP5, t, HOP5_F);
  const h6 = progress(HOP6, t, HOP6_F);
  for (const [a, b] of MESH_LINKS) {
    const key = `${a}-${b}`;
    const A = pos(a);
    const B = pos(b);
    if (key === 'R4-R5a') {
      if (errorOn) {
        // red, broken at the midpoint where the ✕ sits
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2;
        const len = Math.hypot(B.x - A.x, B.y - A.y);
        const gx = ((B.x - A.x) / len) * 34;
        const gy = ((B.y - A.y) / len) * 34;
        link(c, A, { x: mx - gx, y: my - gy }, { state: 'error' });
        link(c, { x: mx + gx, y: my + gy }, B, { state: 'error' });
      } else link(c, A, B, { state: 'dead' });
      continue;
    }
    if (key === 'D-R1' || key === 'R1-R2' || key === 'R2-R3' || key === 'R3-R4') link(c, A, B, { fill: 1, width: 2 });
    else if (key === 'R4-R5b') link(c, A, B, { fill: h5, width: h5 < 1 || h6 < 1 ? 3 : 2 });
    else if (key === 'R5b-E') link(c, A, B, { fill: h6, width: h6 < 1 ? 3 : 2 });
    else link(c, A, B);
  }

  /* ---- nodes */
  const kArr5 = framesSince(HOP5 + HOP5_F / 30, t);
  const kArrE = framesSince(DOCK, t);
  for (const id of ['D', 'R1', 'R2', 'R3', 'R4', 'R5a', 'R5b', 'E'] as NodeId[]) {
    let pulse = 0;
    if (id === 'R4') {
      const kf2 = framesSince(FLIP, t);
      pulse = kf < 0 ? 0 : kf < 6 ? 1 : 0.3;
      if (kf2 >= 0 && kf2 < 6) pulse = 1 - kf2 / 6;
    }
    if (id === 'R5b' && kArr5 >= 0 && kArr5 < 6) pulse = 1 - kArr5 / 6;
    if (id === 'E' && kArrE >= 0) pulse = kArrE < 6 ? 1 - kArrE / 6 : 0;
    drawNode(fc, id, pos(id), { pulse });
  }

  /* ---- labels + arrows */
  for (const id of ['D', 'R1', 'R2', 'R3', 'R5a'] as NodeId[]) nodeLabel(c, id, t);
  nodeLabel(c, 'R4', t, t < LINKDOWN, t < LINKDOWN ? undefined : LINKDOWN);
  if (t >= R5B_LABEL) nodeLabel(c, 'R5b', t, true, R5B_LABEL);
  else nodeLabel(c, 'R5b', t);
  if (t >= DOCK) nodeLabel(c, 'E', t, true, DOCK);
  else nodeLabel(c, 'E', t);
  nextHopArrow(c, ARROW_R1.c, ARROW_R1.angle);
  nextHopArrow(c, ARROW_R2.c, ARROW_R2.angle);
  nextHopArrow(c, ARROW_R3.c, ARROW_R3.angle);
  if (t < FLIP) nextHopArrow(c, R4_TO_R5A.c, R4_TO_R5A.angle);
  else flippingArrow(c, R4_TO_R5B.c, R4_TO_R5A.angle, R4_TO_R5B.angle, FLIP, t);

  /* ---- error: ✕ and 'link down' */
  if (errorOn) errorX(c, t);
  const ld = rampOut(RESTORE, t, 6);
  const ldBox = { x: 380, y: 860, w: 360, h: 66 };
  if (ld >= 1) plateText(c, 'link down', 380, 860, t, { px: 66, t0: LINKDOWN, frames: 8, color: PALETTE.error });
  else rampBox(fc.ascii, ldBox, ld, PALETTE.error);

  /* ---- ttl tag + packet */
  const p = packetAt(t);
  const off = tagOffset(t);
  const ttl59 = HOP5 + HOP5_F / 30;
  ttlTag(c, p.x + off.x + shake.x, p.y + off.y + shake.y, t >= ttl59 ? 'ttl 59' : 'ttl 60', t >= ttl59 ? ttl59 : -1, t);
  trackedPacket(c, (tt) => { const q = packetAt(tt); return { x: q.x + shake.x, y: q.y + shake.y }; }, t);

  /* ---- routing table panel (drops over the top of the stage) */
  tablePanel(fc, t);

  sectionHeader(c, '03', 'routing', 20.0, t);
  hudStopwatch(c, t);
}

const scene: Scene = { id: 'S10', start: START, end: END, draw: (fc) => draw(fc) };
export default scene;
