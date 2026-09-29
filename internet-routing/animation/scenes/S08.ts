/**
 * S08 — 03 Routing, "reads the address" (20.00–24.30 s, frames 600–728).
 * Macro follow-scroll down a schematic router column (x 270): D → R1 → R2, next router R3 below.
 * v08 word-tied events are shifted +0.44 s (VO 20.64–23.71); the slam and hop D→R1 stay on the beat.
 */
import {
  PALETTE,
  asciiInk,
  drawText,
  easeInOutCubic,
  easeInOutQuart,
  font,
  framesSince,
  hudStopwatch,
  link,
  progress,
  rampDensity,
  routerNode,
  scrambleText,
  sectionHeader,
  trackedPacket,
  tween,
  typeText,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';
import { asciiOut, ev } from './S05';

const V08 = 0.44;
const E = {
  slam: ev(20.0),
  hop1: ev(20.15),
  dst1: ev(20.98 + V08),
  ttl63: ev(21.3 + V08),
  decide1: ev(21.6 + V08),
  hop2: ev(22.05 + V08),
  r2: ev(22.8 + V08),
  ttl62: ev(23.1 + V08),
  decide2: ev(23.6 + V08),
} as const;
const ARRIVE1 = E.hop1 + 12 / 30;

/** Router column (world coords; screen y = world y − scroll). Active router sits at screen (270, 700). */
const X = 270;
const NODES = [
  { y: 700, seed: 11 }, // D (you)
  { y: 960, seed: 23 }, // R1
  { y: 1220, seed: 37 }, // R2
  { y: 1480, seed: 41 }, // R3
];
const CLUSTER = { cols: 15, rows: 6 }; // 180×120 (macro scale)

function scroll(t: number): number {
  return (
    260 * tween(E.hop1 + 2 / 30, t, 14, easeInOutQuart) +
    260 * tween(E.hop2 + 2 / 30, t, 14, easeInOutQuart)
  );
}

/** Packet centre in world coords. */
function packetWorld(t: number): { x: number; y: number } {
  const y =
    NODES[0].y +
    260 * tween(E.hop1, t, 12, easeInOutCubic) +
    260 * tween(E.hop2, t, 12, easeInOutCubic);
  return { x: X, y };
}

const pulseAt = (t0: number, t: number): number => (framesSince(t0, t) >= 0 ? 1 - progress(t0, t, 8) : 0);

/** Next-hop arrow: '→' flips to '↓' (4 f, stepped rotation). Box x 250–298, y cy+80…cy+128. */
function arrow(fc: FrameCtx, cy: number, flipT: number, t: number): void {
  const a = (Math.PI / 2) * progress(flipT, t, 4);
  const c = fc.crisp;
  c.save();
  c.translate(274, cy + 104);
  c.rotate(a);
  drawText(c, '→', 0, -24, { px: 48, color: PALETTE.ink, align: 'center' });
  c.restore();
}

interface LabelBlock {
  lines: [string, string];
  decision: string;
  showT: number;
  decideT: number;
  hideT: number;
}

/** Router label block at x 400 (lines at cy−60, cy−16; decision at cy+40) plus arrow. */
function labelBlock(fc: FrameCtx, cy: number, b: LabelBlock, t: number): void {
  const c = fc.crisp;
  const kHide = framesSince(b.hideT, t);
  if (kHide >= 0) {
    for (const [i, s] of [...b.lines, b.decision].entries()) {
      asciiOut(fc, { x: 400, y: cy + [-60, -16, 40][i], w: s.length * 21.6, h: 36 }, b.hideT, t, 4);
    }
    return;
  }
  if (framesSince(b.showT, t) < 0) return;
  const f36 = font('glyph', 36);
  scrambleText(c, b.lines[0], 400, cy - 60, f36, PALETTE.inkDeep, b.showT, t, 8);
  scrambleText(c, b.lines[1], 400, cy - 16, f36, PALETTE.inkDeep, b.showT, t, 8);
  typeText(c, b.decision, 400, cy + 40, f36, PALETTE.inkDeep, b.decideT, t, 8);
  arrow(fc, cy, b.decideT, t);
}

/** Sparse ASCII background grid, scrolling with the world. */
function bgGrid(fc: FrameCtx, s: number): void {
  const a = fc.ascii;
  a.fillStyle = asciiInk(rampDensity('.'));
  const off = ((s % 80) + 80) % 80;
  for (let y = -off; y < 1920; y += 80) {
    const yy = Math.round(y / 20) * 20;
    for (let x = 36; x < 1080; x += 96) a.fillRect(x, yy, 12, 20);
  }
}

/** Readout: dst line (inverts 6 f per read) and ttl (scramble 8 f, digits invert 4 f). */
function readout(fc: FrameCtx, t: number): void {
  const c = fc.crisp;
  c.fillStyle = PALETTE.paper;
  c.fillRect(120, 440, 500, 120);
  c.strokeStyle = PALETTE.ink;
  c.lineWidth = 3;
  c.strokeRect(121.5, 441.5, 497, 117);
  const f48 = font('glyph', 48);
  const dstInv = [E.dst1, E.r2].some((t0) => {
    const k = framesSince(t0, t);
    return k >= 0 && k < 6;
  });
  if (dstInv) drawText(c, 'dst 203.0.113.10', 136, 448, { px: 48, invert: true, pad: 4 });
  else scrambleText(c, 'dst 203.0.113.10', 136, 448, f48, PALETTE.inkDeep, E.slam, t, 8);
  scrambleText(c, 'ttl ', 136, 504, f48, PALETTE.inkDeep, E.slam, t, 8);
  const [ttl, t0] = framesSince(E.ttl62, t) >= 0 ? ['62', E.ttl62] : framesSince(E.ttl63, t) >= 0 ? ['63', E.ttl63] : ['64', E.slam];
  const dx = 136 + 4 * 28.8;
  const k = framesSince(t0, t);
  const inv = t0 !== E.slam && k < 4;
  if (inv) {
    c.fillStyle = PALETTE.inkDeep;
    c.fillRect(dx - 4, 504, 2 * 28.8 + 8, 48);
  }
  scrambleText(c, ttl, dx, 504, f48, inv ? PALETTE.paper : PALETTE.inkDeep, t0, t, 8);
}

const scene: Scene = {
  id: 'S08',
  start: 20.0,
  end: 24.3,
  draw(fc) {
    const t = fc.t;
    const c = fc.crisp;
    const s = scroll(t);
    bgGrid(fc, s);

    // World (router column) lives below the readout plate: routers scrolling past y 560 leave the frame.
    for (const g of [c, fc.ascii]) {
      g.save();
      g.beginPath();
      g.rect(0, 560, 1080, 1360);
      g.clip();
      g.translate(0, -s);
    }
    // Links between cluster edges (fill as the packet passes).
    const py = packetWorld(t).y;
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = { x: X, y: NODES[i].y + 64 };
      const b = { x: X, y: NODES[i + 1].y - 64 };
      link(c, a, b, { fill: (py - a.y) / (b.y - a.y) });
    }
    const pulses = [0, pulseAt(E.dst1, t), pulseAt(E.r2, t), 0];
    NODES.forEach((n, i) => routerNode(fc, X, n.y, { ...CLUSTER, seed: n.seed, pulse: pulses[i] }));
    // D label (hides as the packet leaves).
    if (framesSince(E.hop1, t) < 0) scrambleText(c, 'you · 192.0.2.23', 400, NODES[0].y - 60, font('glyph', 36), PALETTE.inkDeep, E.slam, t, 8);
    else asciiOut(fc, { x: 400, y: NODES[0].y - 60, w: 16 * 21.6, h: 36 }, E.hop1, t, 4);
    labelBlock(fc, NODES[1].y, {
      lines: ['hop 1 · gw.home.example', '192.0.2.1'],
      decision: '0.0.0.0/0 → 198.51.100.1',
      showT: ARRIVE1,
      decideT: E.decide1,
      hideT: E.hop2,
    }, t);
    labelBlock(fc, NODES[2].y, {
      lines: ['hop 2 · bras1.isp.example', '198.51.100.1 · AS64496'],
      decision: 'next hop → 198.51.100.45',
      showT: E.r2,
      decideT: E.decide2,
      hideT: Infinity,
    }, t);
    trackedPacket(c, packetWorld, t);
    c.restore();
    fc.ascii.restore();

    readout(fc, t);
    sectionHeader(c, '03', 'routing', E.slam, t, { mode: 'slam' });
    hudStopwatch(c, t);
  },
};
export default scene;
