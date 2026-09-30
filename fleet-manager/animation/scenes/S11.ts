/** S11 — CTA (52.00–60.00): dot collapse of S10's last frame into the icon, crisp icon, title, CTA. */
import {
  PALETTE,
  clamp01,
  dot,
  easeInOutCubic,
  font,
  framesSince,
  headlineRise,
  lerp,
  measure,
  powerOn,
  text,
  typeOn,
  waveRipple,
} from '../components';
import { sceneSpan } from '../engine/timeline';
import type { FrameCtx, Scene } from '../engine/types';
import { drawMarkerLabel, drawReachRight, globeLitDots, markerStates, type LitDot } from './lib/finale-globe';

const ICON = { x: 816, y: 256, size: 288, cx: 960, cy: 400, pitch: 16, n: 18 } as const;
/** Largest per-dot radius delay (frames); the rest of the collapse window is travel. */
const MAX_DELAY = 14;
const DOT_D = 12;
const RASTER_PITCH = 5;

interface Src {
  x: number;
  y: number;
  d: number;
  color: [number, number, number];
  alpha: number;
  r: number;
  a: number;
  delay: number;
  target: number;
}
interface Target {
  x: number;
  y: number;
  hex: string;
  color: [number, number, number];
  /** Collapse frame on which the first source lands here. */
  land: number;
}

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** S10's right block + marker labels at its last frame, rasterised to dots on a 6 px pitch. */
function rasterDots(fc: FrameCtx, t: number): LitDot[] {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = 1920;
    c.height = 1080;
    return c.getContext('2d', { willReadFrequently: true })!;
  };
  const g = mk();
  const off: FrameCtx = { ...fc, g, glow: mk(), t, frame: Math.round(t * 30) };
  drawReachRight(off, t);
  for (const s of markerStates(off, t)) drawMarkerLabel(off, s, t);
  const px = g.getImageData(0, 0, 1920, 1080).data;
  const out: LitDot[] = [];
  for (let y0 = 0; y0 < 1080; y0 += RASTER_PITCH) {
    for (let x0 = 0; x0 < 1920; x0 += RASTER_PITCH) {
      // brightest pixel in the cell (thin mono strokes would slip between centre samples)
      let best = -1;
      let sum = 0;
      for (let y = y0; y < y0 + RASTER_PITCH; y++) {
        for (let x = x0; x < x0 + RASTER_PITCH; x++) {
          const o = (y * 1920 + x) * 4;
          const s = (px[o] + px[o + 1] + px[o + 2]) * px[o + 3];
          if (s > sum) {
            sum = s;
            best = o;
          }
        }
      }
      // skip the ground-coloured label backings and faint edges
      if (best < 0 || px[best + 3] < 110 || px[best] + px[best + 1] + px[best + 2] < 140) continue;
      const hex = `#${((px[best] << 16) | (px[best + 1] << 8) | px[best + 2]).toString(16).padStart(6, '0')}`;
      out.push({ x: x0 + RASTER_PITCH / 2, y: y0 + RASTER_PITCH / 2, d: 4, color: hex, alpha: 1 });
    }
  }
  return out;
}

let plan: { src: Src[]; targets: Target[] } | null = null;

/** Sources (S10's final dots) mapped to icon cells by angle about the icon centre. Pure; cached. */
function collapsePlan(fc: FrameCtx): { src: Src[]; targets: Target[] } {
  if (plan) return plan;
  const tEnd = sceneSpan('S10').end - 1 / 30;
  const lit = [...globeLitDots(fc, tEnd), ...rasterDots(fc, tEnd)];
  const grid = fc.assets.iconDots(ICON.n, ICON.n);
  const targets: (Target & { a: number })[] = [];
  grid.forEach((row, r) =>
    row.forEach((hex, c) => {
      if (!hex) return;
      const x = ICON.x + ICON.pitch / 2 + c * ICON.pitch;
      const y = ICON.y + ICON.pitch / 2 + r * ICON.pitch;
      targets.push({ x, y, hex, color: rgb(hex), land: Infinity, a: Math.atan2(y - ICON.cy, x - ICON.cx) });
    }),
  );
  targets.sort((p, q) => p.a - q.a || Math.hypot(p.x - ICON.cx, p.y - ICON.cy) - Math.hypot(q.x - ICON.cx, q.y - ICON.cy));
  const src: Src[] = lit.map((d) => ({
    x: d.x,
    y: d.y,
    d: d.d,
    color: rgb(d.color),
    alpha: d.alpha,
    r: Math.hypot(d.x - ICON.cx, d.y - ICON.cy),
    a: Math.atan2(d.y - ICON.cy, d.x - ICON.cx),
    delay: 0,
    target: 0,
  }));
  const rMax = Math.max(...src.map((s) => s.r));
  const travel = collapseFrames(fc) - MAX_DELAY;
  const order = src.map((_, i) => i).sort((i, j) => src[i].a - src[j].a || src[i].r - src[j].r);
  order.forEach((i, rank) => {
    const s = src[i];
    s.target = Math.floor((rank * targets.length) / order.length);
    s.delay = Math.round((MAX_DELAY * s.r) / rMax);
    const tg = targets[s.target];
    tg.land = Math.min(tg.land, s.delay + travel);
  });
  plan = { src, targets };
  return plan;
}

const collapseFrames = (fc: FrameCtx): number => Math.round((fc.cue('s11.collapse.end') - fc.cue('s11.collapse.start')) * 30);

const mix = (a: [number, number, number], b: [number, number, number], u: number): string =>
  `rgb(${Math.round(lerp(a[0], b[0], u))},${Math.round(lerp(a[1], b[1], u))},${Math.round(lerp(a[2], b[2], u))})`;

/** Wrap to (−π, π]. */
const wrap = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

/* ---------------------------------------------------------------- scene */

const { start, end } = sceneSpan('S11');
const TITLE = 'Azure Kubernetes Fleet Manager';
const SUB = 'Seamlessly manage Kubernetes clusters at scale.';
const SMALL = 'No charge for the Fleet Manager resource itself — you pay only for the AKS cluster it creates on your behalf.';
const CTA = 'Get started  →  learn.microsoft.com/azure/kubernetes-fleet';

function drawCollapse(fc: FrameCtx, kc: number): void {
  const { src, targets } = collapsePlan(fc);
  const travel = collapseFrames(fc) - MAX_DELAY;
  const { g, glow } = fc;
  for (const s of src) {
    const u = clamp01((kc - s.delay) / travel);
    if (u >= 1) continue;
    const tg = targets[s.target];
    const e = easeInOutCubic(u);
    const rT = Math.hypot(tg.x - ICON.cx, tg.y - ICON.cy);
    const aT = Math.atan2(tg.y - ICON.cy, tg.x - ICON.cx);
    // 180° vortex swirl on top of the (small) angular offset to the target
    const a = s.a + e * (Math.PI + wrap(aT - s.a - Math.PI));
    const r = lerp(s.r, rT, e);
    const x = ICON.cx + r * Math.cos(a);
    const y = ICON.cy + r * Math.sin(a);
    const col = mix(s.color, tg.color, e);
    dot(g, x, y, lerp(s.d, DOT_D * 0.6, e), col, lerp(s.alpha, 1, e));
    if (u > 0) dot(glow, x, y, 6, col, 0.25 * e);
  }
}

/** Landed icon dots; `scale` shrinks them for the crisp cross-step; `flash` boosts the glow. */
function drawIconDots(fc: FrameCtx, kc: number, scale: number, flash: number, bob: number): void {
  const { targets } = collapsePlan(fc);
  for (const tg of targets) {
    const k = kc - tg.land;
    if (k < 0) continue;
    const level = k === 0 ? 0.4 : 1;
    dot(fc.g, tg.x, tg.y + bob, DOT_D * scale, tg.hex, level);
    dot(fc.glow, tg.x, tg.y + bob, DOT_D * 1.1 * Math.max(scale, 0.5), tg.hex, Math.min(1, (k === 0 ? 0.9 : 0.45) * flash));
  }
}

function drawCta(fc: FrameCtx, t: number): void {
  const t0 = fc.cue('s11.cta');
  const k = framesSince(t0, t);
  if (k < 0) return;
  const f = font('display', 32, 700);
  const tw = measure(fc.g, CTA, f);
  const w = Math.round(tw + 80);
  const h = 64;
  const x = 960 - w / 2;
  const y = 850;
  const BUILD = 10;
  const { g, glow } = fc;
  if (k < BUILD) {
    // plate builds from dots powering on, centre outward
    for (let yy = y + 4; yy < y + h; yy += 8) {
      for (let xx = x + 4; xx < x + w; xx += 8) {
        const on = Math.floor(((BUILD - 2) * Math.abs(xx - 960)) / (w / 2));
        const lv = k < on ? 0 : k === on ? 0.4 : 1;
        if (!lv) continue;
        dot(g, xx, yy, 7, PALETTE.azure, lv);
        dot(glow, xx, yy, 7, PALETTE.azure, 0.3 * lv);
      }
    }
    return;
  }
  g.fillStyle = PALETTE.azure;
  g.beginPath();
  g.roundRect(x, y, w, h, 8);
  g.fill();
  glow.globalAlpha = 0.18;
  glow.fillStyle = PALETTE.azure;
  glow.beginPath();
  glow.roundRect(x, y, w, h, 8);
  glow.fill();
  glow.globalAlpha = 1;
  const tp = powerOn(t0 + BUILD / 30, t);
  if (tp) text(g, CTA, 960, y + (h - 32) / 2, { font: f, color: PALETTE.paper, align: 'center', alpha: tp });
}

const scene: Scene = {
  id: 'S11',
  start,
  end,
  draw(fc) {
    const t = fc.t;
    const kc = framesSince(fc.cue('s11.collapse.start'), t);
    const kx = framesSince(fc.cue('s11.crisp'), t);
    const ripple = fc.cue('s11.ripple');

    // wave ripple 3/3 under the icon; afterwards the icon rides a gentle 1 Hz swell
    const bobAt = waveRipple(fc, 560, 96, 1824, ripple, t);
    const swellT = t - (ripple + 1);
    const bob = swellT > 0 ? 2 * Math.sin(2 * Math.PI * swellT) : bobAt(ICON.cx);
    if (swellT > 0) {
      for (let x = 780; x <= 1140; x += 12) {
        const y = 560 + 3 * Math.sin(2 * Math.PI * swellT - (x - 960) / 48);
        const edge = 1 - Math.abs(x - 960) / 200;
        dot(fc.g, x, y, 2 + 2 * clamp01(edge * 1.4), PALETTE.azureLight, 0.35 + 0.5 * clamp01(edge));
      }
    }

    if (kx < 0) {
      drawCollapse(fc, kc);
      drawIconDots(fc, kc, 1, 1, 0);
    } else {
      // crisp cross-step over 4 f: vector steps in behind, dots shrink away
      const u = clamp01((kx + 1) / 4);
      fc.g.globalAlpha = u;
      fc.g.drawImage(fc.assets.icon, ICON.x, ICON.y + bob, ICON.size, ICON.size);
      fc.g.globalAlpha = 1;
      fc.glow.globalAlpha = 0.12 * u;
      fc.glow.drawImage(fc.assets.icon, ICON.x, ICON.y + bob, ICON.size, ICON.size);
      fc.glow.globalAlpha = 1;
      if (kx < 4) drawIconDots(fc, kc, 1 - u, kx === 0 ? 2 : 1, bob);
    }

    headlineRise(fc, [TITLE], 960, 600, { px: 96, align: 'center', t0: fc.cue('s11.title'), t });
    const subF = font('mono', 28);
    typeOn(fc, SUB, 960 - (SUB.length * 28 * 0.6) / 2, 720, subF, PALETTE.azureLight, fc.cue('s11.sub'), t);
    const smallF = font('mono', 20);
    typeOn(fc, SMALL, 960 - (SMALL.length * 20 * 0.6) / 2, 790, smallF, PALETTE.mute, fc.cue('s11.smallprint'), t, 150);
    drawCta(fc, t);
  },
};

export default scene;
