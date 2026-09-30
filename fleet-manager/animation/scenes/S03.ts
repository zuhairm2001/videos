/** S03 — Reveal (8.00–14.00): hub lights, the sprawl snaps into the fleet, product title. */
import {
  clusterGlyph,
  constructionCircles,
  crosshairLines,
  dot,
  dotLine,
  easeInOutCubic,
  easeInOutQuart,
  easeOutCubic,
  font,
  framesSince,
  headlineRise,
  lerp,
  PALETTE,
  powerOff,
  tween,
  waveRipple,
} from '../components';
import { sceneSpan } from '../engine/timeline';
import type { FrameCtx, Scene } from '../engine/types';
import { drawHeroLabel, drawSprawlLabel, FORM, formationSlots, HUB, HULL, sprawl } from './lib/opening-layout';
import { typeOnCentred } from './lib/opening-type';

const { start, end } = sceneSpan('S03');

/** Flight: 12 f easeInOutQuart to target + 1-dot (12 px) overshoot, then 3 f settle back. */
const FLIGHT_F = 12;
const SETTLE_F = 3;
const OVERSHOOT = 12;
/** Snap stagger: 0.8 f per 24 px of hub → slot distance. */
const STAGGER_F_PER_PX = 0.8 / 24;

interface Flight {
  i: number;
  /** Slot top-left and formation cell. */
  tx: number;
  ty: number;
  col: number;
  row: number;
  /** Hub → slot-centre distance (px) and flight start (s). */
  d: number;
  t0: number;
}

let flights: Flight[] | null = null;
function flightPlan(fc: FrameCtx): Flight[] {
  if (flights) return flights;
  const slots = formationSlots(fc.g);
  const tSnap = fc.cue('s03.snap.start');
  flights = slots.map((s, i) => {
    const d = Math.hypot(s.x + 2.5 * FORM.p - HUB.cx, s.y + 2.5 * FORM.p - HUB.cy);
    return { i, tx: s.x, ty: s.y, col: s.col, row: s.row, d, t0: tSnap + (d * STAGGER_F_PER_PX) / 30 };
  });
  return flights;
}

const scene: Scene = {
  id: 'S03',
  start,
  end,
  draw(fc) {
    const t = fc.t;
    const { g } = fc;
    const { glyphs } = sprawl(g);
    const plan = flightPlan(fc);
    const tHub = fc.cue('s03.hub');

    // construction: crosshairs through the hub + circles r 120/240/360 drawing on over 18 f
    crosshairLines(fc, HUB.cx, HUB.cy, 0.4);
    constructionCircles(fc, HUB.cx, HUB.cy, [120, 240, 360], tHub, t);

    // wave ripple 1/3 under the formation; glyphs bob with it
    const bobAt = waveRipple(fc, 720, HULL.x0, HULL.x1, fc.cue('s03.wave'), t);

    // hull: azure 3 px rule at y 708, x 192–1728, drawing out from the hub axis
    const uh = tween(fc.cue('s03.hull'), t, 18, easeInOutCubic);
    if (uh > 0) {
      const half = (HULL.x1 - HULL.x0) / 2;
      const mid = (HULL.x1 + HULL.x0) / 2;
      for (const [ctx, a] of [[g, 1], [fc.glow, 0.5]] as const) {
        ctx.globalAlpha = a;
        ctx.fillStyle = PALETTE.azure;
        ctx.fillRect(mid - half * uh, 706.5, 2 * half * uh, 3);
        ctx.globalAlpha = 1;
      }
    }

    // membership links: hub → each top-row slot, staggered by distance over s03.links.start … end
    const tl0 = fc.cue('s03.links.start');
    const spreadF = (fc.cue('s03.links.end') - tl0) * 30 - 12;
    const top = plan.filter((f) => f.row === 0);
    const dMin = Math.min(...top.map((f) => f.d));
    const dMax = Math.max(...top.map((f) => f.d));
    for (const f of plan) {
      const cx = f.tx + 2.5 * FORM.p;
      if (f.row === 0) {
        const fill = tween(tl0 + (spreadF * (f.d - dMin)) / (dMax - dMin) / 30, t, 12, easeInOutCubic);
        const bx = cx;
        const by = f.ty - 6;
        const len = Math.hypot(bx - HUB.cx, by - HUB.cy);
        const a = { x: HUB.cx + ((bx - HUB.cx) / len) * 72, y: HUB.cy + ((by - HUB.cy) / len) * 72 };
        dotLine(g, a, { x: bx, y: by }, { pitch: 6, diam: 1.5, color: PALETTE.fleetLight, fill });
      } else {
        // middle / bottom rows: a 24 px stub up the row gap, drawn as the glyph lands
        const fill = tween(f.t0 + (FLIGHT_F - 1) / 30, t, 6, easeInOutCubic);
        dotLine(g, { x: cx, y: f.ty - 3 }, { x: cx, y: f.ty - 24 }, { pitch: 6, diam: 1.5, color: PALETTE.fleetLight, fill });
      }
    }

    // hub: p 24 `match`, 3 f power-on, fleetPale halo r 60 @ 40 % pulsing once
    const kHub = framesSince(tHub, t);
    if (kHub >= 0) {
      const r = 60 * (1 + 0.5 * Math.sin((Math.PI * Math.min(kHub, 12)) / 12));
      const grad = g.createRadialGradient(HUB.cx, HUB.cy, 0, HUB.cx, HUB.cy, r);
      grad.addColorStop(0, PALETTE.fleetPale);
      grad.addColorStop(1, 'rgba(183,150,249,0)');
      g.globalAlpha = kHub === 0 ? 0.16 : 0.4;
      g.fillStyle = grad;
      g.beginPath();
      g.arc(HUB.cx, HUB.cy, r, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      dot(fc.glow, HUB.cx, HUB.cy, 2 * r, PALETTE.fleetPale, kHub < 12 ? 0.2 : 0.12);
      clusterGlyph(fc, HUB.x, HUB.y, HUB.p, 'match', { build: Math.min(1, (kHub + 1) / 3) });
    }

    // sprawl labels stay where they were (so flights never drag text across each other), then drop
    // 12 px and power off as their glyph lands
    for (const f of plan) {
      const q = glyphs[f.i];
      const tLand = f.t0 + (FLIGHT_F - 1) / 30;
      const off = powerOff(tLand, t);
      if (off <= 0) continue;
      const drop = framesSince(tLand, t) >= 0 ? 12 : 0;
      g.globalAlpha = off;
      if (f.i === 0) drawHeroLabel(fc, -1, drop);
      else drawSprawlLabel(fc, q, q.x, q.y + drop, -1);
      g.globalAlpha = 1;
    }

    // snap to fleet
    for (const f of plan) {
      const q = glyphs[f.i];
      const k = framesSince(f.t0, t);
      let x = q.x;
      let y = q.y;
      let p = q.p;
      let alpha = q.alpha;
      if (k >= 0) {
        const dx = f.tx - q.x;
        const dy = f.ty - q.y;
        const len = Math.hypot(dx, dy) || 1;
        const ox = f.tx + (dx / len) * OVERSHOOT;
        const oy = f.ty + (dy / len) * OVERSHOOT;
        if (k < FLIGHT_F) {
          const e = easeInOutQuart((k + 1) / FLIGHT_F);
          x = lerp(q.x, ox, e);
          y = lerp(q.y, oy, e);
          p = lerp(q.p, FORM.p, e);
          alpha = lerp(q.alpha, 1, e);
        } else {
          const e = easeOutCubic((k - FLIGHT_F + 1) / SETTLE_F);
          x = lerp(ox, f.tx, e);
          y = lerp(oy, f.ty, e);
          p = FORM.p;
          alpha = 1;
        }
      }
      const kLand = k - (FLIGHT_F - 1);
      const landed = kLand >= 0;
      // only glyphs that have left their S02 spot ride the wave, so the 8.00 cut stays pixel-continuous
      const bob = k >= 0 ? bobAt(x + 2.5 * p) : 0;
      clusterGlyph(fc, x, y, p, landed ? 'member' : q.state, { alpha, bob, glow: kLand === 0 ? 2.5 : 1 });
    }

    // title + sub-line
    const out = fc.cue('s03.out');
    headlineRise(fc, ['Azure Kubernetes Fleet Manager'], 960, 792, { px: 96, align: 'center', t0: fc.cue('s03.title'), t, outT: out });
    typeOnCentred(fc, 'Seamlessly manage Kubernetes clusters at scale.', 960, 912, font('mono', 28), 28, PALETTE.azureLight, fc.cue('s03.sub'), out);
  },
};

export default scene;
