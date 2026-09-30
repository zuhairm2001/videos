/**
 * S05 — Update runs (16.00–26.00). Split block on the left; on the right an update run through three
 * stages: azure sweep flips drift → updated, versions scramble 1.30 → 1.31, dot progress bar fills,
 * `[ PASS ]` at each row end, `[ APPROVED ]` gates between stages, Doto counter, auto-upgrade chip.
 */
import { font, PALETTE } from '../config';
import {
  chip,
  clusterGlyph,
  dot,
  dotLine,
  dotNumber,
  framesSince,
  glyphBuild,
  glyphLabel,
  pictogram,
  powerOn,
  progress,
  scramble,
  splitBlock,
  text,
  typeOn,
} from '../components';
import { sceneSpan } from '../engine/timeline';
import type { FrameCtx, Scene } from '../engine/types';

const { start, end } = sceneSpan('S05');

const P = 12; // glyph pitch → 60 px glyphs
const GX = 1000; // first glyph left
const PITCH = 96;
const LABEL_X = 760;
const RIGHT = 1824;
const PASS_PX = 24;

interface Stage {
  n: number;
  name: string;
  top: number;
  count: number;
  /** cue id prefix, e.g. 's05.stage1' */
  cue: string;
  /** row build-in cue offset (s) after `s05.rows` */
  buildDelay: number;
}

const STAGES: readonly Stage[] = [
  { n: 1, name: 'canary', top: 300, count: 3, cue: 's05.stage1', buildDelay: 0 },
  { n: 2, name: 'europe', top: 480, count: 6, cue: 's05.stage2', buildDelay: 0.1 },
  { n: 3, name: 'americas', top: 660, count: 6, cue: 's05.stage3', buildDelay: 0.2 },
];

const GATES = [
  { cue: 's05.gate1', y: 402 },
  { cue: 's05.gate2', y: 582 },
] as const;

/**
 * Frame on which glyph i of the stage flips to `updated`, relative to the sweep cue. The last glyph
 * flips exactly on the end cue, so the counter reaches 15/15 at `s05.stage3.end`.
 */
function flipFrame(s: Stage, i: number, frames: number): number {
  return Math.ceil(((i + 1) * frames) / s.count);
}

/** Sweep front x for sweep frame k: 36 px before glyph 0, reaching glyph i's right edge at its flip. */
function sweepX(s: Stage, k: number, frames: number): number {
  return GX - 36 + (PITCH * s.count * k) / frames;
}

function passBox(): { x: number; w: number; h: number } {
  const w = 8 * PASS_PX * 0.7 - 0.1 * PASS_PX + 2 * Math.round(PASS_PX * 0.5);
  return { x: RIGHT - Math.ceil(w), w, h: PASS_PX + 2 * Math.round(PASS_PX * 0.3) };
}

/** Draws one stage row; returns how many of its glyphs are updated this frame. */
function drawStage(fc: FrameCtx, s: Stage): number {
  const { g, glow, t } = fc;
  const tb = fc.cue('s05.rows') + s.buildDelay;
  if (framesSince(tb, t) < 0) return 0;
  const t0 = fc.cue(`${s.cue}.sweep`);
  const frames = Math.round((fc.cue(`${s.cue}.end`) - t0) * 30); // sweep length (sweep → end cue)
  const k = framesSince(t0, t);
  const on = powerOn(tb, t);

  // stage label column
  g.save();
  g.globalAlpha = on;
  text(g, `STAGE ${s.n}`, LABEL_X, s.top + 6, { font: font('mono', 20), color: PALETTE.paper, tracking: 0.04 });
  text(g, s.name, LABEL_X, s.top + 34, { font: font('mono', 20), color: PALETTE.mute, tracking: 0.04 });
  g.restore();

  // glyphs + version labels
  let updated = 0;
  for (let i = 0; i < s.count; i++) {
    const gx = GX + i * PITCH;
    const tg = tb + i / 30; // 1 f stagger from the row's left end
    const build = glyphBuild(tg, t);
    if (build <= 0) continue;
    const kf = k - flipFrame(s, i, frames);
    const done = kf >= 0;
    if (done) updated++;
    clusterGlyph(fc, gx, s.top, P, done ? 'updated' : 'drift', { build, glow: kf === 0 ? 2.5 : 1 });
    const lx = gx + 2.5 * P;
    const ly = s.top + 5 * P + 6;
    if (!done) {
      g.save();
      g.globalAlpha = powerOn(tg, t);
      glyphLabel(fc, lx, ly, ['1.30']);
      g.restore();
    } else {
      const f = font('mono', 18);
      const w = 4 * 18 * 0.64; // mono advance at tracking 0.04
      scramble(fc, '1.31', lx - w / 2, ly, f, PALETTE.azureLight, t0 + flipFrame(s, i, frames) / 30, t, 4, 0.04);
    }
  }

  // progress dot bar under the row [09]: 4 px dots, 8 px pitch, azure up to the sweep front
  const barY = s.top + 5 * P + 33;
  const barX1 = GX + (s.count - 1) * PITCH + 5 * P;
  const front = k < 0 ? -Infinity : sweepX(s, Math.min(k, frames), frames);
  for (let x = GX + 2; x <= barX1; x += 8) {
    const lit = x <= front;
    const bOn = powerOn(tb + (x - GX) / PITCH / 30, t);
    if (bOn <= 0) continue;
    dot(g, x, barY, 4, lit ? PALETTE.azure : PALETTE.dotOff, bOn);
    if (lit) dot(glow, x, barY, 4, PALETTE.azure, 0.35);
  }

  // leader from the row end to the PASS column, like a status sheet [17]
  const pb = passBox();
  const cy = s.top + 2.5 * P;
  g.save();
  g.globalAlpha = on;
  dotLine(g, { x: barX1 + 18, y: cy }, { x: pb.x - 14, y: cy }, { pitch: 6, diam: 1.5, color: PALETTE.rule });
  g.restore();

  // sweep front: azure dot column across the row height
  if (k >= 0 && k <= frames) {
    const x = sweepX(s, k, frames);
    for (let y = s.top - 12; y <= barY + 6; y += 6) {
      dot(g, x, y, 4, PALETTE.azure);
      dot(glow, x, y, 5, PALETTE.azureLight, 0.8);
    }
  }

  // [ PASS ]
  const tp = fc.cue(`${s.cue}.pass`);
  if (framesSince(tp, t) >= 0) {
    chip(fc, '[ PASS ]', pb.x, cy - pb.h / 2, { fill: PALETTE.azure, color: PALETTE.paper, px: PASS_PX, t0: tp, t });
    if (framesSince(tp, t) < 3) {
      glow.save();
      glow.globalAlpha = 0.4;
      glow.fillStyle = PALETTE.azure;
      glow.fillRect(pb.x, cy - pb.h / 2, pb.w, pb.h);
      glow.restore();
    }
  }
  return updated;
}

function drawGate(fc: FrameCtx, cue: string, y: number): void {
  const t0 = fc.cue(cue);
  const k = framesSince(t0, fc.t);
  if (k < 0) return;
  const sy = progress(t0, fc.t, 3);
  const box = chip(fc, '[ APPROVED ]', GX, y, { invert: true, color: PALETTE.fleetLight, scaleY: sy });
  if (k >= 3) {
    const pp = 5; // 7×7 → 35 px, centred on the 36 px chip
    pictogram(fc, 'check', box.x + box.w + 14, y + box.h / 2 - 3.5 * pp, pp, PALETTE.fleetLight, { glow: k < 6 ? 1 : 0.5 });
  }
}

const scene: Scene = {
  id: 'S05',
  start,
  end,
  draw(fc) {
    const { t } = fc;
    splitBlock(fc, {
      chip: '01 · SAFE UPDATES',
      headline: ['Upgrade the fleet,', 'stage by stage.'],
      sub: ['Update runs roll Kubernetes and', 'node image upgrades out in the', 'order you define, with approval gates.'],
      t0Chip: fc.cue('s05.chip'),
      t0Headline: fc.cue('s05.headline'),
      t0Sub: fc.cue('s05.sub'),
    });

    typeOn(fc, 'update run  ·  kubernetes 1.30 → 1.31', LABEL_X, 200, font('mono', 22), PALETTE.paper, fc.cue('s05.header'), t);

    let updated = 0;
    for (const s of STAGES) updated += drawStage(fc, s);
    for (const gt of GATES) drawGate(fc, gt.cue, gt.y);

    // counter
    const tc = fc.cue('s05.rows');
    if (framesSince(tc, t) >= 0) {
      const { g } = fc;
      g.save();
      g.globalAlpha = powerOn(tc, t);
      dotNumber(fc, `${String(updated).padStart(2, '0')}/15 updated`, RIGHT, 860, 64, PALETTE.paper, 'right', { weight: 700, glow: updated === 15 ? 0.35 : 0 });
      g.restore();
    }

    // auto-upgrade chip + check pictogram
    const ta = fc.cue('s05.autoupgrade');
    const label = 'auto-upgrade profile · stable channel';
    const ka = framesSince(ta, t);
    if (ka >= 0) {
      const box = chip(fc, label, LABEL_X, 800, { color: PALETTE.azureLight, px: 22, t0: ta, t });
      if (ka >= Math.ceil(label.length / 3)) pictogram(fc, 'check', box.x + box.w + 14, 800 + 11 - 17.5, 5, PALETTE.azureLight, { glow: 0.5 });
    }
  },
};

export default scene;
