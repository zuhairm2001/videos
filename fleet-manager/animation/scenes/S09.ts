/**
 * S09 — Managed namespaces (38.00–46.00). Five stacked-layer cluster columns, a `fleet` namespace band
 * sliding across slot 3, three policy stamps (quota, netpol, rbac) with band flashes and per-column slot
 * icons, then a pulse along the band flips the column glyphs member → match.
 *
 * `drawS09(fc, t)` is exported so S10 can redraw this composition inside its camera pull-back.
 */
import {
  PALETTE,
  clusterGlyph,
  dot,
  easeInOutQuart,
  font,
  framesSince,
  glyphBuild,
  hash32,
  lerp,
  pictogram,
  powerOn,
  splitBlock,
  text,
  tween,
  typeOn,
  type PictogramName,
} from '../components';
import { sceneSpan } from '../engine/timeline';
import type { FrameCtx, Scene } from '../engine/types';

const { start, end } = sceneSpan('S09');

const COL_X = [784, 992, 1200, 1408, 1616];
const COL_W = 168;
const COL_Y0 = 240;
const SLOT_H = 80;
const SLOTS = 6;
/** Namespace band: slot 3 (y 400–480), overhanging the outer columns by 8 px. */
const BAND = { x0: 776, x1: 1792, y: 400, h: 80 };
const BAND_ALPHA = 0.35;
/** One pulse pass along the band (frames); three passes fill 43.50–45.60. */
const PASS_F = 21;
const PASS_AMP = [1, 0.6, 0.35];

interface Stamp {
  icon: PictogramName;
  title: string;
  detail: string;
  cue: string;
  x: number;
}
/** 320 × 72 plates at a 340 px pitch: the three stamps span exactly the column block (784–1784). */
const STAMP_W = 320;
const STAMP_H = 72;
const STAMP_Y = 780;
const STAMPS: Stamp[] = [
  { icon: 'quota', title: 'QUOTA', detail: 'cpu 64 · mem 256Gi', cue: 's09.stamp.quota', x: 784 },
  { icon: 'netpol', title: 'NETWORK POLICY', detail: 'deny ingress', cue: 's09.stamp.netpol', x: 1124 },
  { icon: 'rbac', title: 'RBAC', detail: 'payments-devs · edit', cue: 's09.stamp.rbac', x: 1464 },
];

/** Frame of pulse pass 0 at which the front crosses column i's centre (the glyph flips there). */
const FLIP_K = COL_X.map((x) => Math.ceil(((x + COL_W / 2 - BAND.x0) / (BAND.x1 - BAND.x0)) * (PASS_F - 1)));

function drawColumns(fc: FrameCtx, t: number, bandRight: number): void {
  const { g } = fc;
  const t0 = fc.cue('s09.columns');
  const pulseT = fc.cue('s09.pulse');
  const kPulse = framesSince(pulseT, t);
  COL_X.forEach((x, i) => {
    const tc = t0 + (3 * i) / 30;
    const on = powerOn(tc, t);
    if (!on) return;
    // outline draws top → bottom over 6 f
    const u = tween(tc, t, 6);
    const h = SLOT_H * SLOTS * u;
    g.save();
    g.globalAlpha = on;
    // the band passes through the columns: clip the outline out wherever the band already covers
    g.beginPath();
    g.rect(0, 0, 1920, 1080);
    if (bandRight > BAND.x0) g.rect(BAND.x0, BAND.y + 1, bandRight - BAND.x0, BAND.h - 2);
    g.clip('evenodd');
    g.beginPath();
    g.rect(x - 2, COL_Y0 - 2, COL_W + 4, h + 4);
    g.clip();
    g.strokeStyle = PALETTE.rule;
    g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect(x, COL_Y0, COL_W, SLOT_H * SLOTS, 8);
    g.stroke();
    g.fillStyle = PALETTE.rule;
    for (let s = 1; s < SLOTS; s++) g.fillRect(x + 1, COL_Y0 + s * SLOT_H - 0.5, COL_W - 2, 1);
    g.restore();
    // other namespaces: a short seeded run of rule dots in each free slot (occupied cells [06])
    for (let s = 0; s < SLOTS; s++) {
      if (s === 2) continue;
      const top = COL_Y0 + s * SLOT_H;
      if (top + SLOT_H > COL_Y0 + h) continue;
      const n = 3 + (hash32(i, s, 9) % 7);
      for (let d = 0; d < n; d++) dot(g, x + 18 + d * 12, top + SLOT_H / 2, 4, PALETTE.rule, on);
    }
    // column-top glyph (p 8) + label; member → match as pulse pass 0 crosses the column
    const flipped = kPulse >= FLIP_K[i];
    clusterGlyph(fc, x, 196, 8, flipped ? 'match' : 'member', { build: glyphBuild(tc, t), glow: kPulse === FLIP_K[i] ? 2.5 : 1 });
    typeOn(fc, `cluster-${i + 1}`, x + 52, 207, font('mono', 18), PALETTE.mute, tc + 3 / 30, t);
  });
}

function drawBand(fc: FrameCtx, t: number, bandRight: number, u: number): void {
  if (bandRight <= BAND.x0) return;
  const { g, glow } = fc;
  let alpha = BAND_ALPHA;
  for (const s of STAMPS) {
    const k = framesSince(fc.cue(s.cue), t);
    if (k >= 0 && k < 4) alpha += 0.2;
  }
  const w = bandRight - BAND.x0;
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = PALETTE.fleet;
  g.fillRect(BAND.x0, BAND.y, w, BAND.h);
  g.globalAlpha = 1;
  g.fillStyle = PALETTE.fleetLight;
  g.fillRect(BAND.x0, BAND.y - 1, w, 2);
  g.fillRect(BAND.x0, BAND.y + BAND.h - 1, w, 2);
  g.restore();
  glow.save();
  glow.globalAlpha = 0.35;
  glow.fillStyle = PALETTE.fleetLight;
  glow.fillRect(BAND.x0, BAND.y - 1, w, 2);
  glow.fillRect(BAND.x0, BAND.y + BAND.h - 1, w, 2);
  glow.restore();
  // leading edge while sliding in: a dotted fleetLight front
  if (u < 1) {
    for (let y = BAND.y + 3; y < BAND.y + BAND.h; y += 6) {
      dot(g, bandRight, y, 3, PALETTE.fleetLight);
      dot(glow, bandRight, y, 4, PALETTE.fleetLight, 0.6);
    }
  }
  typeOn(fc, 'ns/team-payments', BAND.x0 + 14, BAND.y + 10, font('mono', 20, 700), PALETTE.paper, fc.cue('s09.band.start') + 6 / 30, t);
}

/** Pulse envelope (0..1) at x for time t: three passes along the band, the first one full strength. */
function pulseAt(fc: FrameCtx, t: number): (x: number) => number {
  const k = framesSince(fc.cue('s09.pulse'), t);
  const pass = Math.floor(k / PASS_F);
  if (k < 0 || pass >= PASS_AMP.length) return () => 0;
  const front = lerp(BAND.x0, BAND.x1, (k % PASS_F) / (PASS_F - 1));
  return (x) => PASS_AMP[pass] * Math.exp(-(((x - front) / 90) ** 2));
}

function drawPulse(fc: FrameCtx, env: (x: number) => number): void {
  // the pulse runs along the band's two borders (the slot interior holds the label and the icons)
  for (let x = BAND.x0 + 6; x < BAND.x1; x += 8) {
    const e = env(x);
    if (e < 0.05) continue;
    for (const y of [BAND.y, BAND.y + BAND.h]) {
      dot(fc.g, x, y, 2 + 6 * e, PALETTE.fleetPale, e);
      dot(fc.glow, x, y, 3 + 8 * e, PALETTE.fleetPale, 0.6 * e);
    }
  }
}

/** Per-column slot-3 icons: one tiny pictogram per landed stamp, powering on left → right (2 f apart). */
function drawSlotIcons(fc: FrameCtx, t: number, env: (x: number) => number): void {
  STAMPS.forEach((s, n) => {
    const t0 = fc.cue(s.cue);
    COL_X.forEach((x, i) => {
      const on = powerOn(t0 + (2 * i) / 30, t);
      const glow = 0.3 + 0.7 * env(x + COL_W / 2);
      if (on) pictogram(fc, s.icon, x + 44 + n * 29, BAND.y + 50, 3, PALETTE.paper, { glow, alpha: on });
    });
  });
}

function drawStamps(fc: FrameCtx, t: number): void {
  const { g } = fc;
  for (const s of STAMPS) {
    const k = framesSince(fc.cue(s.cue), t);
    if (k < 0) continue;
    // lands with a 3 f scale 1.1 → 1 about its centre
    const sc = k < 3 ? 1.1 - (0.1 * k) / 3 : 1;
    const cx = s.x + STAMP_W / 2;
    const cy = STAMP_Y + STAMP_H / 2;
    g.save();
    g.translate(cx, cy);
    g.scale(sc, sc);
    g.translate(-cx, -cy);
    g.fillStyle = PALETTE.paper;
    g.beginPath();
    g.roundRect(s.x, STAMP_Y, STAMP_W, STAMP_H, 8);
    g.fill();
    pictogram(fc, s.icon, s.x + 14, STAMP_Y + 15, 6, PALETTE.fleet);
    // a stamp lands with its print already on it
    text(g, s.title, s.x + 68, STAMP_Y + 12, { font: font('mono', 20, 700), color: PALETTE.ground });
    text(g, s.detail, s.x + 68, STAMP_Y + 40, { font: font('mono', 20), color: PALETTE.ground });
    g.restore();
  }
}

/** The S09 composition at global time `t`. `diagramOnly` skips the left headline block. */
export function drawS09(fc: FrameCtx, t: number, { diagramOnly = false }: { diagramOnly?: boolean } = {}): void {
  if (!diagramOnly) {
    splitBlock(fc, {
      chip: '03 · GOVERNANCE',
      headline: ['One namespace.', 'Every cluster.', 'Same rules.'],
      sub: ['Managed Fleet Namespaces (preview)', 'enforce quotas, network policies', 'and access across clusters.'],
      t0Chip: start,
      t0Headline: fc.cue('s09.headline'),
      t0Sub: fc.cue('s09.sub'),
    });
  }
  const b0 = fc.cue('s09.band.start');
  const bandFrames = Math.round((fc.cue('s09.band.end') - b0) * 30);
  const u = tween(b0, t, bandFrames, easeInOutQuart);
  const bandRight = framesSince(b0, t) < 0 ? BAND.x0 : lerp(BAND.x0, BAND.x1, u);
  drawColumns(fc, t, bandRight);
  drawBand(fc, t, bandRight, u);
  const env = pulseAt(fc, t);
  drawPulse(fc, env);
  drawSlotIcons(fc, t, env);
  drawStamps(fc, t);
}

const scene: Scene = {
  id: 'S09',
  start,
  end,
  draw(fc) {
    drawS09(fc, fc.t);
  },
};

export default scene;
