/**
 * S07 — Placement (28.00–36.00). Policy panel → evaluation scan (match / dim) → arrow-of-arrows flock in
 * two progressive waves → arrival chips + rollout readout → wave ripple 2/3 and the `also:` chip.
 */
import {
  PALETTE,
  clusterGlyph,
  constructionCircles,
  dot,
  dotArrow,
  easeInOutCubic,
  easeOutCubic,
  font,
  framesSince,
  glyphBuild,
  lerp,
  pictogram,
  powerOn,
  progress,
  scramble,
  chip,
  headlineRise,
  measure,
  text,
  tween,
  typeOn,
  waveRipple,
} from '../components';
import { cue, sceneSpan } from '../engine/timeline';
import type { FrameCtx, Scene } from '../engine/types';
import { flock, pathAt, type FlockTarget } from './lib/S07-flock';

const { start, end } = sceneSpan('S07');

const HUB = { x: 784, y: 480, cx: 844, cy: 540 };
const COLS = [1216, 1384, 1552, 1720];
const ROWS = [300, 500, 700];
const SCAN_X0 = 1180;
const SCAN_X1 = 1824;
const LABEL_PX = 18;
/** Mono advance at 18 px with the glyphLabel tracking (0.04 em). */
const LABEL_ADV = LABEL_PX * 0.64;

/** Matched set (env=prod + nodes ≥ 5), wave 1 first: (0,0), (1,0), (0,2) · (3,1), (2,2), (3,2). */
const TARGETS: FlockTarget[] = (
  [
    [0, 0, 1],
    [1, 0, 1],
    [0, 2, 1],
    [3, 1, 2],
    [2, 2, 2],
    [3, 2, 2],
  ] as const
).map(([c, r, wave]) => ({ c, r, wave, gx: COLS[c], gy: ROWS[r] }));

/** Labels of the non-matching members: each fails at least one rule (env=dev or nodes 3). */
const MISS: Record<string, [string, string]> = {
  '2,0': ['env=dev', 'nodes 12'],
  '3,0': ['env=prod', 'nodes 3'],
  '0,1': ['env=dev', 'nodes 3'],
  '1,1': ['env=prod', 'nodes 3'],
  '2,1': ['env=dev', 'nodes 12'],
  '1,2': ['env=prod', 'nodes 3'],
};

interface Member {
  gx: number;
  gy: number;
  lines: [string, string];
  /** index into TARGETS, or -1 */
  target: number;
  /** build start (s): staggered by distance from the hub, 0.8 f per 24 px */
  t0: number;
  /** frames after the scan start when the scan line crosses the glyph centre */
  flipK: number;
}

const SCAN_FRAMES = Math.round((cue('s07.scan.end') - cue('s07.scan.start')) * 30);
const MEMBERS: Member[] = [];
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 4; c++) {
    const gx = COLS[c];
    const gy = ROWS[r];
    const target = TARGETS.findIndex((m) => m.c === c && m.r === r);
    const dist = Math.hypot(gx + 30 - HUB.cx, gy + 30 - HUB.cy);
    MEMBERS.push({
      gx,
      gy,
      lines: target >= 0 ? ['env=prod', 'nodes 12'] : MISS[`${c},${r}`],
      target,
      t0: start + Math.round((0.8 * dist) / 24) / 30,
      // the scan line moves linearly SCAN_X0 → SCAN_X1 over the scan window
      flipK: Math.ceil(((gx + 30 - SCAN_X0) / (SCAN_X1 - SCAN_X0)) * SCAN_FRAMES),
    });
  }
}

const PANEL = { x: 760, y: 200, w: 400, h: 150 };
const PANEL_LINES = ['kind: ClusterResourcePlacement', 'selector: env=prod', 'property: nodeCount ≥ 5', 'rollout: progressive'];
/** Row tops inside the panel: header row, hairline, then the three toggle rows at a 28 px pitch. */
const PANEL_ROW_Y = [216, 262, 290, 318];

function drawPanel(fc: FrameCtx, t: number): void {
  const t0 = fc.cue('s07.panel');
  const sy = progress(t0, t, 3);
  if (sy <= 0) return;
  const { g } = fc;
  g.save();
  const cy = PANEL.y + PANEL.h / 2;
  g.translate(0, cy);
  g.scale(1, sy);
  g.translate(0, -cy);
  g.fillStyle = PALETTE.paper;
  g.beginPath();
  g.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 8);
  g.fill();
  // header hairline
  g.globalAlpha = 0.25;
  g.fillStyle = PALETTE.ground;
  g.fillRect(PANEL.x + 20, 249, PANEL.w - 40, 1);
  g.globalAlpha = 1;
  let lt = t0 + 3 / 30;
  PANEL_LINES.forEach((line, i) => {
    typeOn(fc, line, PANEL.x + 20, PANEL_ROW_Y[i], font('mono', 20), PALETTE.ground, lt, t);
    lt += Math.ceil(line.length / 3) / 30;
    if (i === 0) return;
    // toggle [25]: off = ground outline, knob left; on = fleet pill, paper knob right (slides over 3 f)
    const u = tween(lt + 2 / 30, t, 3);
    const x = PANEL.x + PANEL.w - 60;
    const y = PANEL_ROW_Y[i];
    g.beginPath();
    g.roundRect(x, y, 40, 20, 10);
    g.lineWidth = 1.5;
    g.strokeStyle = PALETTE.ground;
    g.globalAlpha = 0.45 * (1 - u) + u;
    g.stroke();
    if (u > 0) {
      g.globalAlpha = u;
      g.fillStyle = PALETTE.fleet;
      g.fill();
    }
    g.globalAlpha = 1;
    dot(g, lerp(x + 10, x + 30, u), y + 10, 14, u >= 1 ? PALETTE.paper : PALETTE.ground, u >= 1 ? 1 : 0.45 + 0.55 * u);
  });
  g.restore();
}

function drawScanLine(fc: FrameCtx, t: number): void {
  const k0 = fc.cue('s07.scan.start');
  const frames = Math.round((fc.cue('s07.scan.end') - k0) * 30);
  const k = framesSince(k0, t);
  if (k < 0 || k >= frames) return;
  const x = SCAN_X0 + ((SCAN_X1 - SCAN_X0) * k) / frames;
  const trail: [number, number, number][] = [
    [0, 3.2, 1],
    [-6, 2.2, 0.5],
    [-12, 1.6, 0.3],
    [-18, 1.2, 0.15],
  ];
  for (let y = 276; y <= 852; y += 6) {
    for (const [dx, d, a] of trail) {
      dot(fc.g, x + dx, y, d, PALETTE.fleetLight, a);
      if (dx === 0) dot(fc.glow, x, y, 4, PALETTE.fleetLight, 0.5);
    }
  }
}

/** Arrival time (s) per target: the moment its last arrow lands. */
function arrivals(fc: FrameCtx): number[] {
  const { arrows } = flock(TARGETS);
  const res = TARGETS.map(() => 0);
  for (const a of arrows) {
    const launch = fc.cue(a.wave === 1 ? 's07.wave1.start' : 's07.wave2.start') + a.delay / 30;
    res[a.target] = Math.max(res[a.target], launch + a.frames / 30);
  }
  return res;
}

function drawFlock(fc: FrameCtx, t: number): void {
  const { arrows } = flock(TARGETS);
  const scan0 = fc.cue('s07.scan.start');
  const formT = scan0 + (fc.cue('s07.scan.end') - scan0) / 2;
  const hub = { x: HUB.cx, y: HUB.cy };
  const { g, glow } = fc;
  for (const a of arrows) {
    const launch = fc.cue(a.wave === 1 ? 's07.wave1.start' : 's07.wave2.start') + a.delay / 30;
    const at = (tt: number) => pathAt(a.path, easeInOutCubic(((tt - launch) * 30) / a.frames) * a.path.len);
    // dotted trail: the last 12 f of the flight path, fading out
    for (let j = 1; j <= 24; j++) {
      const tj = t - j / 60;
      if (tj < launch || tj >= launch + a.frames / 30) continue;
      const p = at(tj);
      const al = 0.6 * (1 - j / 24);
      dot(g, p.x, p.y, 2.6, PALETTE.fleetLight, al);
      dot(glow, p.x, p.y, 3, PALETTE.fleetLight, 0.35 * al);
    }
    if (t >= launch + a.frames / 30) continue;
    if (t >= launch) {
      const p = at(t);
      dotArrow(g, p.x, p.y, 6, PALETTE.fleetLight, p.a);
      dotArrow(glow, p.x, p.y, 6, PALETTE.fleetLight, p.a, 0.5);
      continue;
    }
    // form-up: each arrow flies out of the hub to its formation slot (6 f), staggered by distance
    const t0 = formT + a.formDelay / 30;
    const on = powerOn(t0, t);
    if (!on) continue;
    const u = easeOutCubic((framesSince(t0, t) + 1) / 6);
    const x = lerp(hub.x, a.home.x, u);
    const y = lerp(hub.y, a.home.y, u);
    dotArrow(g, x, y, 6, PALETTE.fleetLight, 'right', on);
    dotArrow(glow, x, y, 6, PALETTE.fleetLight, 'right', on === 1 ? 0.45 : 0.9);
  }
}

function drawReadout(fc: FrameCtx, t: number, arr: number[]): void {
  const w1 = fc.cue('s07.wave1.start');
  const w2 = fc.cue('s07.wave2.start');
  if (t < w1) return;
  const f = font('mono', 22);
  const x = 760;
  const y = 800;
  const head = 'rollout  wave ';
  if (t < w2) typeOn(fc, `${head}1/2`, x, y, f, PALETTE.paper, w1, t);
  else {
    text(fc.g, head, x, y, { font: f, color: PALETTE.paper });
    scramble(fc, '2/2', x + head.length * 13.2, y, f, PALETTE.paper, w2, t, 4);
  }
  // six cells (▮ filled / ▯ empty): cell n fills when the n-th target (by arrival) lands
  const cellsOn = framesSince(w1, t) >= 6;
  if (!cellsOn) return;
  const order = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const g = fc.g;
  for (let n = 0; n < 6; n++) {
    const cx = x + 19 * 13.2 + n * 18;
    const on = powerOn(order[n].v, t);
    g.beginPath();
    g.roundRect(cx, y + 1, 11, 20, 2);
    if (on) {
      g.globalAlpha = on;
      g.fillStyle = PALETTE.paper;
      g.fill();
      g.globalAlpha = 1;
    } else {
      g.lineWidth = 1.5;
      g.strokeStyle = PALETTE.mute;
      g.stroke();
    }
  }
}

function drawMembers(fc: FrameCtx, t: number, arr: number[], bobAt: (x: number) => number): void {
  const scan0 = fc.cue('s07.scan.start');
  const kScan = framesSince(scan0, t);
  const labelFont = font('mono', LABEL_PX);
  for (const m of MEMBERS) {
    const build = glyphBuild(m.t0, t);
    if (build <= 0) continue;
    const bob = bobAt(m.gx + 30);
    const flipped = kScan >= m.flipK;
    const matched = m.target >= 0;
    let glowAmt = 1;
    if (flipped && kScan === m.flipK && matched) glowAmt = 2.5;
    const arrT = matched ? arr[m.target] : Infinity;
    const kArr = framesSince(arrT, t);
    if (kArr >= 0 && kArr < 8) glowAmt = 1 + 2 * (1 - kArr / 8);
    const state = flipped ? (matched ? 'match' : 'dim') : 'member';
    clusterGlyph(fc, m.gx, m.gy, 12, state, { build, bob, glow: glowAmt });
    if (flipped && !matched && kScan === m.flipK) clusterGlyph(fc, m.gx, m.gy, 12, 'member', { alpha: 0.4, bob, glow: 0 });
    // arrival pulse: a dotted fleetPale ring expanding from the glyph (8 f)
    if (kArr >= 0 && kArr < 8) {
      const rr = 40 + 3 * kArr;
      const al = 0.8 * (1 - kArr / 8);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const px = m.gx + 30 + Math.cos(a) * rr;
        const py = m.gy + 30 + bob + Math.sin(a) * rr;
        dot(fc.g, px, py, 3, PALETTE.fleetPale, al);
        dot(fc.glow, px, py, 4, PALETTE.fleetPale, 0.5 * al);
      }
    }
    // labels type on after the glyph; the losers drop to mute at 35 %
    const lAlpha = flipped && !matched ? (kScan === m.flipK ? 0.6 : 0.35) : 1;
    const cx = m.gx + 30;
    fc.g.save();
    fc.g.globalAlpha = lAlpha;
    m.lines.forEach((line, i) => {
      const w = line.length * LABEL_ADV - 0.04 * LABEL_PX;
      typeOn(fc, line, cx - w / 2, m.gy + 68 + i * 23 + bob, labelFont, PALETTE.mute, m.t0 + (4 + i * 3) / 30, t, 90, 0.04);
    });
    fc.g.restore();
    // arrival chip: check pictogram + `checkout-api` (mono 18 fleetLight)
    if (kArr >= 0) {
      const s = 'checkout-api';
      const w = 21 + 6 + s.length * LABEL_PX * 0.6;
      const x0 = Math.round(cx - w / 2);
      const y0 = m.gy + 120 + bob;
      pictogram(fc, 'check', x0, y0 - 1.5, 3, PALETTE.fleetLight, { glow: 0.35, alpha: powerOn(arrT, t) });
      typeOn(fc, s, x0 + 27, y0, labelFont, PALETTE.fleetLight, arrT + 1 / 30, t);
    }
  }
}

function drawAlso(fc: FrameCtx, t: number): void {
  const t0 = fc.cue('s07.also');
  const l1 = 'also: namespace-scoped placement ·';
  const l2 = 'automated deployments from git (preview)';
  const f = font('mono', 20);
  typeOn(fc, l1, 760, 860, f, PALETTE.mute, t0, t);
  typeOn(fc, l2, 760, 888, f, PALETTE.mute, t0 + Math.ceil(l1.length / 3) / 30, t);
}

const HEADLINE = ['Place workloads', 'where they run best.'];
const SUB = ['Target clusters by labels,', 'properties, cost and capacity —', 'then roll out progressively.'];
/** Headline cap: 624 px keeps ≥ 40 px to the policy panel at x 760 (splitBlock stops at 72 px / 648). */
const HEADLINE_MAX_W = 624;

/**
 * splitBlock's left block (chip, headline, typed sub-lines), except the headline takes the largest
 * px ≤ 84 whose widest line fits HEADLINE_MAX_W, both lines at that size.
 */
function drawLeftBlock(fc: FrameCtx, t: number): void {
  let px = 84;
  while (px > 1 && Math.max(...HEADLINE.map((l) => measure(fc.g, l, font('display', px, 800), -0.025))) > HEADLINE_MAX_W) px--;
  const hl = headlineRise(fc, HEADLINE, 96, 230, { px, maxWidth: HEADLINE_MAX_W, t0: fc.cue('s07.headline'), t });
  chip(fc, '02 · PLACEMENT', 96, 180, { color: PALETTE.fleetLight, px: 22, t0: start, t });
  let t0 = fc.cue('s07.sub');
  SUB.forEach((line, i) => {
    typeOn(fc, line, 96, hl.bottom + 40 + i * 38, font('mono', 28), PALETTE.mute, t0, t);
    t0 += Math.ceil(line.length / 3) / 30;
  });
}

const scene: Scene = {
  id: 'S07',
  start,
  end,
  draw(fc) {
    const t = fc.t;
    drawLeftBlock(fc, t);

    // hub: match glyph with one construction circle; it flares as each wave launches
    constructionCircles(fc, HUB.cx, HUB.cy, [120], start, t);
    let hubGlow = 1;
    for (const id of ['s07.wave1.start', 's07.wave2.start']) {
      const k = framesSince(fc.cue(id), t);
      if (k >= 0 && k < 6) hubGlow = 1 + 1.5 * (1 - k / 6);
    }
    clusterGlyph(fc, HUB.x, HUB.y, 24, 'match', { build: glyphBuild(start, t), glow: hubGlow });

    drawPanel(fc, t);
    const arr = arrivals(fc);
    const bobAt = waveRipple(fc, 880, 1248, 1788, fc.cue('s07.ripple'), t);
    drawMembers(fc, t, arr, bobAt);
    drawScanLine(fc, t);
    drawFlock(fc, t);
    drawReadout(fc, t, arr);
    drawAlso(fc, t);
  },
};

export default scene;
