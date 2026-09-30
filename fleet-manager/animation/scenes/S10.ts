/** S10 — Reach (46.00–52.00): pull back from the S09 namespace diagram to a dot globe + right block. */
import {
  PALETTE,
  constructionCircles,
  dot,
  easeInOutCubic,
  easeInOutQuart,
  framesSince,
  hash01,
  lerp,
  powerOn,
  tween,
  withCamera,
  clusterGlyph,
  clamp01,
} from '../components';
import { drawS09 } from './S09';
import { sceneSpan } from '../engine/timeline';
import type { Scene } from '../engine/types';
import {
  GLOBE,
  HUB_D,
  arcDots,
  arcFill,
  drawMarkerLabel,
  drawReachRight,
  hubPos,
  latticeDots,
  markerStates,
} from './lib/finale-globe';

const PIVOT = { x: 1300, y: 480 };
const END_ZOOM = 0.25;
/** Frames of the scale-down; the dissolve starts when it ends. */
const PULL_F = 24;
/** Dissolve: each lattice dot launches within LAUNCH_SPREAD frames and flies FLY_F frames. */
const LAUNCH_SPREAD = 10;
const FLY_F = 14;
/** Control point of the particles' flight path: below the sub-line, left of the tile row. */
const DIP = { x: 1000, y: 820 };

/* ---------------------------------------------------------------- S09 diagram geometry (world coords at zoom 1) */

const COLS = [784, 992, 1200, 1408, 1616];
const COL = { w: 168, top: 240, bottom: 720, slot: 80 };
const BAND = { x0: 784, x1: 1784, y0: 400, y1: 480 };
const STAMPS = [784, 1088, 1392];

/** Points along the S09 diagram's lines, in world coords, with their colour (the dissolve's particle sources). */
const ECHO_POINTS: readonly { x: number; y: number; c: string }[] = (() => {
  const pts: { x: number; y: number; c: string }[] = [];
  const seg = (x0: number, y0: number, x1: number, y1: number, c: string, step = 16) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = 0; i < n; i++) pts.push({ x: lerp(x0, x1, i / n), y: lerp(y0, y1, i / n), c });
  };
  const bw = BAND.x1;
  for (const x of COLS) {
    seg(x, COL.top, x + COL.w, COL.top, PALETTE.mute);
    seg(x + COL.w, COL.top, x + COL.w, COL.bottom, PALETTE.mute);
    seg(x + COL.w, COL.bottom, x, COL.bottom, PALETTE.mute);
    seg(x, COL.bottom, x, COL.top, PALETTE.mute);
    for (let y = COL.top + COL.slot; y < COL.bottom; y += COL.slot) if (y !== BAND.y0 && y !== BAND.y1) seg(x, y, x + COL.w, y, PALETTE.rule, 24);
  }
  seg(BAND.x0, BAND.y0, bw, BAND.y0, PALETTE.fleetLight, 8);
  seg(BAND.x0, BAND.y1, bw, BAND.y1, PALETTE.fleetLight, 8);
  for (const x of STAMPS) {
    seg(x, 780, x + 280, 780, PALETTE.paper);
    seg(x, 852, x + 280, 852, PALETTE.paper);
  }
  return pts;
})();

/* ---------------------------------------------------------------- scene */

const { start, end } = sceneSpan('S10');

const scene: Scene = {
  id: 'S10',
  start,
  end,
  draw(fc) {
    const t = fc.t;
    const t0 = fc.cue('s10.pull.start');
    const k = framesSince(t0, t);

    // 1 · pull-back: S09's last frame scales to 0.25× about (1300, 480)
    if (k < PULL_F) {
      const zoom = lerp(1, END_ZOOM, tween(t0, t, PULL_F, easeInOutQuart));
      // last frame of the pull powers the diagram off (40 %) as its dots take over
      fc.g.globalAlpha = k === PULL_F - 1 ? 0.4 : 1;
      withCamera(fc, { x: PIVOT.x, y: PIVOT.y, zoom, sx: PIVOT.x, sy: PIVOT.y }, () => drawS09(fc, t0 - 1 / 30));
      fc.g.globalAlpha = 1;
    }

    // 2 · globe lattice; during the dissolve each dot flies in from a point on the shrunken echo
    const rest = latticeDots(fc, t);
    const kd = k - PULL_F;
    const g = fc.g;
    // back face first, then the outline, then the front
    for (const pass of [0, 1]) {
      rest.forEach((d, i) => {
        if ((d.alpha < 1 ? 0 : 1) !== pass) return;
        // sweep right → left (the side the echo sits on), with a little per-dot jitter
        const launch = Math.floor(LAUNCH_SPREAD * (0.7 * clamp01((GLOBE.cx + GLOBE.r - d.x) / (2 * GLOBE.r)) + 0.3 * hash01(i, 1010)));
        const u = clamp01((kd - launch) / FLY_F);
        if (kd < 0) return;
        if (u >= 1) {
          dot(g, d.x, d.y, d.d, d.color, d.alpha);
          return;
        }
        const src = ECHO_POINTS[Math.floor(hash01(i, 2020) * ECHO_POINTS.length)];
        const sx = PIVOT.x + (src.x - PIVOT.x) * END_ZOOM;
        const sy = PIVOT.y + (src.y - PIVOT.y) * END_ZOOM;
        const e = easeInOutCubic(u);
        // quadratic path dipping below the right block's sub-line
        const x = lerp(lerp(sx, DIP.x, e), lerp(DIP.x, d.x, e), e);
        const y = lerp(lerp(sy, DIP.y, e), lerp(DIP.y, d.y, e), e);
        dot(g, x, y, lerp(3, d.d, e), src.c, lerp(1, d.alpha, e));
      });
      if (pass === 0) constructionCircles(fc, GLOBE.cx, GLOBE.cy, [GLOBE.r], t0 + (PULL_F + 8) / 30, t);
    }

    // 3 · hub at the pole, arcs + markers + labels for front-facing clusters
    const markers = markerStates(fc, t);
    for (const s of markers) {
      if (s.k < 0) continue;
      for (const d of arcDots(fc, t, s.m, arcFill(s.k))) dot(g, d.x, d.y, d.d, d.color, d.alpha);
    }
    const hubOn = powerOn(fc.cue('s10.pull.end') + 10 / 30, t);
    if (hubOn) {
      const h = hubPos(fc, t);
      dot(g, h.x, h.y, HUB_D, PALETTE.fleet, hubOn);
      dot(fc.glow, h.x, h.y, HUB_D * 1.4, PALETTE.fleet, hubOn < 1 ? 1 : 0.6);
    }
    for (const s of markers) {
      if (s.k < 0) continue;
      g.globalAlpha = s.k === 0 ? 0.4 : 1;
      clusterGlyph(fc, s.x - 15, s.y - 15, 6, 'member', { glow: s.k === 0 ? 2.5 : 1 });
      g.globalAlpha = 1;
    }
    for (const s of markers) drawMarkerLabel(fc, s, t);

    // 4 · right block
    drawReachRight(fc, t);
  },
};

export default scene;
