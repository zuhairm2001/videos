/**
 * Dev-only component gallery (`?gallery`, `?gallery=2`, `?gallery=3`): every component and every
 * glyph state on the real ground / dot field / chrome / bloom pipeline. Static pages: each demo
 * pins its own time so mid-animation states are visible side by side.
 */
import {
  chip,
  clusterGlyph,
  constructionCircles,
  crosshairLines,
  dot,
  dotArrow,
  dotLine,
  dotNumber,
  font,
  GLYPH_STATES,
  glyphBuild,
  glyphLabel,
  headlineRise,
  PALETTE,
  pictogram,
  PICTOGRAMS,
  plate,
  powerOn,
  scramble,
  sectionSlam,
  splitBlock,
  text,
  typeOn,
  waveRipple,
  withCamera,
  type PictogramName,
} from './components';
import type { FrameCtx } from './engine/types';

const at = (fc: FrameCtx, t: number): FrameCtx => ({ ...fc, t, frame: Math.round(t * 30) });
const caption = (fc: FrameCtx, s: string, x: number, y: number) => text(fc.g, s, x, y, { font: font('mono', 14), color: PALETTE.mute, tracking: 0.04, alpha: 0.7 });

/** Page 1: glyph states, sizes, build sequence, dots, arrows, pictograms, wave. */
function page1(fc: FrameCtx): void {
  chip(fc, 'GALLERY 1/3 · GLYPHS + DOTS', 96, 96, { color: PALETTE.fleetLight });
  GLYPH_STATES.forEach((s, i) => {
    const x = 96 + i * 216;
    clusterGlyph(fc, x, 144, 24, s);
    glyphLabel(fc, x + 60, 276, [s, 'p = 24']);
    clusterGlyph(fc, x + 30, 336, 12, s);
    clusterGlyph(fc, x + 110, 348, 8, s, { alpha: 0.5 });
    clusterGlyph(fc, x + 170, 354, 6, s);
  });
  caption(fc, 'p = 12 · p = 8 @ 50 % · p = 6', 96, 412);

  caption(fc, 'glyphBuild f0–f6', 1440, 104);
  for (let k = 0; k < 7; k++) {
    const x = 1440 + (k % 4) * 96;
    const y = 132 + Math.floor(k / 4) * 120;
    clusterGlyph(fc, x, y, 12, 'updated', { build: glyphBuild(0, k / 30) });
    glyphLabel(fc, x + 30, y + 68, [`f${k}`]);
  }

  caption(fc, 'powerOn f0 / f1 / f2', 96, 456);
  [0, 1 / 30, 2 / 30].forEach((t, i) => {
    const a = powerOn(0, t);
    dot(fc.g, 120 + i * 48, 504, 12, PALETTE.azureLight, a);
    dot(fc.glow, 120 + i * 48, 504, 13, PALETTE.azureLight, a < 1 ? 1 : 0.55);
  });
  caption(fc, 'dotLine 6 px · fill 0.6 · 12 px', 336, 456);
  dotLine(fc.g, { x: 336, y: 504 }, { x: 736, y: 504 }, { color: PALETTE.fleetLight });
  dotLine(fc.g, { x: 336, y: 528 }, { x: 736, y: 528 }, { color: PALETTE.fleetLight, fill: 0.6 });
  dotLine(fc.g, { x: 336, y: 552 }, { x: 736, y: 600 }, { color: PALETTE.azureLight, pitch: 12, diam: 4 });
  caption(fc, 'dotArrow p 6: → ↓ ← ↑ 30° · p 12', 816, 456);
  (['right', 'down', 'left', 'up', Math.PI / 6] as const).forEach((d, i) => dotArrow(fc.g, 840 + i * 48, 516, 6, PALETTE.fleetLight, d));
  dotArrow(fc.g, 1128, 516, 12, PALETTE.fleetPale, 'right');
  dotArrow(fc.glow, 1128, 516, 12, PALETTE.fleetPale, 'right', 0.6);

  caption(fc, 'pictogram p = 8 (fleetLight, glow 0.4) · on paper plate p = 6 (fleet)', 96, 624);
  (Object.keys(PICTOGRAMS) as PictogramName[]).forEach((n, i) => {
    const x = 96 + i * 108;
    pictogram(fc, n, x, 660, 8, PALETTE.fleetLight, { glow: 0.4 });
    glyphLabel(fc, x, 728, [n], { align: 'left' });
  });
  plate(fc, { x: 960, y: 648, w: 280, h: 72 }, PALETTE.paper, 6);
  pictogram(fc, 'quota', 974, 662, 6, PALETTE.fleet);
  text(fc.g, 'QUOTA', 1030, 660, { font: font('mono', 20, 700), color: PALETTE.ground });
  text(fc.g, 'cpu 64 · mem 256Gi', 1030, 686, { font: font('mono', 18), color: PALETTE.ground });
  pictogram(fc, 'check', 1280, 660, 8, PALETTE.fleetLight);
  chip(fc, '[ APPROVED ]', 1352, 668, { invert: true, color: PALETTE.fleetLight });

  caption(fc, 'waveRipple mid-pass (f15) + glyph bobAt(x) · hull 3 px azure', 96, 792);
  const bobAt = waveRipple(at(fc, 0.5), 936, 192, 1728, 0, 0.5);
  for (let c = 0; c < 16; c++) clusterGlyph(fc, 192 + c * 96, 828, 12, 'member', { bob: bobAt(222 + c * 96) });
  fc.g.fillStyle = PALETTE.azure;
  fc.g.fillRect(192, 906, 1536, 3);
}

/** Page 2: split block, headline, chips, type-on / scramble, numerals, construction, camera. */
function page2(fc: FrameCtx): void {
  chip(fc, 'GALLERY 2/3 · TYPE + LAYOUT', 96, 96, { color: PALETTE.mute });
  splitBlock(at(fc, 5), {
    chip: '01 · SAFE UPDATES',
    headline: ['Upgrade the fleet,', 'stage by stage.'],
    sub: ['Update runs roll Kubernetes and', 'node image upgrades out in the', 'order you define, with approval gates.'],
    t0Chip: 0,
    t0Headline: 0.2,
    t0Sub: 0.8,
  });
  caption(fc, 'splitBlock (chip · headline 84 autofit 648 · sub mono 28)', 96, 700);
  headlineRise(fc, ['Place workloads anywhere.'], 96, 740, { px: 84, maxWidth: 648, t0: 0, t: 2 });
  caption(fc, 'headlineRise autofit 84 → ≥ 72 to 648 px · masked rise f0 / f2 / settled', 96, 848);
  [0, 2].forEach((k, i) => headlineRise(fc, ['Rise'], 96 + i * 220, 876, { px: 72, t0: 0, t: k / 30 }));
  headlineRise(fc, ['Rise'], 536, 876, { px: 72, t0: 0, t: 1 });

  const X = 800;
  caption(fc, 'chip: invert azure 24 · invert fleetLight · fill · bare · scaleY 0.5', X, 96);
  chip(fc, '[ PASS ]', X, 128, { invert: true, color: PALETTE.azure, px: 24 });
  chip(fc, '[ APPROVED ]', X + 160, 130, { invert: true, color: PALETTE.fleetLight });
  chip(fc, '02 · PLACEMENT', X + 380, 130, { fill: PALETTE.dotOff, color: PALETTE.fleetLight });
  chip(fc, '[ FLEET ]', X + 640, 130, { color: PALETTE.mute });
  chip(fc, '[ APPROVED ]', X + 820, 130, { invert: true, color: PALETTE.fleetLight, scaleY: 0.5 });

  caption(fc, 'typeOn 3 chars/f (f6, cursor) · settled · scramble f2 · settled', X, 204);
  typeOn(fc, 'update run  ·  kubernetes 1.30 → 1.31', X, 236, font('mono', 22), PALETTE.paper, 0, 6 / 30);
  typeOn(fc, 'update run  ·  kubernetes 1.30 → 1.31', X, 272, font('mono', 22), PALETTE.paper, 0, 1);
  scramble(fc, 'v1.30 → v1.31 · eastus', X + 620, 236, font('mono', 22), PALETTE.azureLight, 0, 2 / 30, 6);
  scramble(fc, 'v1.30 → v1.31 · eastus', X + 620, 272, font('mono', 22), PALETTE.azureLight, 0, 1, 6);
  typeOn(fc, 'auto-upgrade profile · stable channel ✓', X, 308, font('mono', 22), PALETTE.azureLight, 0, 1);

  caption(fc, 'dotNumber Doto 900 200 (glow 0.25) · 700 64 right-aligned', X, 360);
  dotNumber(fc, '48', X, 384, 200, PALETTE.paper, 'left', { glow: 0.25 });
  text(fc.g, 'clusters', X + 250, 520, { font: font('mono', 24), color: PALETTE.mute });
  dotNumber(fc, '15/15', 1824, 400, 64, PALETTE.paper, 'right', { weight: 700 });
  text(fc.g, 'updated', 1824, 476, { font: font('mono', 22), color: PALETTE.mute, align: 'right' });

  caption(fc, 'constructionCircles (f9 / done) + crosshairLines + hub', X, 624);
  fc.g.save();
  fc.g.beginPath();
  fc.g.rect(X, 650, 1024, 330);
  fc.g.clip();
  crosshairLines(fc, 1100, 810, 0.4);
  fc.g.restore();
  constructionCircles(fc, 1100, 810, [60, 120], 0, 9 / 30);
  constructionCircles(fc, 1500, 810, [60, 120], 0, 1);
  clusterGlyph(fc, 1070, 780, 12, 'match');
  dot(fc.glow, 1500, 810, 120, PALETTE.fleetPale, 0.4);
  clusterGlyph(fc, 1440, 750, 24, 'match');
  caption(fc, 'withCamera 0.5×', 1640, 900);
  withCamera(fc, { x: 1720, y: 810, zoom: 0.5, sx: 1720, sy: 810 }, () => {
    for (let i = 0; i < 3; i++) clusterGlyph(fc, 1640 + i * 84, 780, 12, 'updated');
  });
}

/** Page 3: section slam states, icon dots, plates. */
function page3(fc: FrameCtx): void {
  chip(fc, 'GALLERY 3/3 · ICON + SECTION SLAM', 96, 96, { color: PALETTE.fleetLight });
  caption(fc, 'iconDots(18, 18) · 16 px pitch', 96, 140);
  const grid = fc.assets.iconDots(18, 18);
  grid.forEach((row, r) =>
    row.forEach((c, i) => {
      if (!c) return;
      dot(fc.g, 104 + i * 16, 184 + r * 16, 12, c);
      dot(fc.glow, 104 + i * 16, 184 + r * 16, 13, c, 0.45);
    }),
  );
  caption(fc, 'assets.icon 288 px', 456, 140);
  fc.g.drawImage(fc.assets.icon, 456, 176, 288, 288);

  caption(fc, 'sectionSlam settled, at 0.5× via withCamera', 840, 140);
  withCamera(fc, { x: 96, y: 360, zoom: 0.5, sx: 840, sy: 184 }, () => sectionSlam(at(fc, 1), '01', 'SAFE UPDATES', 0, 1.6));

  caption(fc, 'sectionSlam f0 / f2 / f4 / f8 · out f3 (0.25×)', 96, 540);
  [0, 2, 4, 8].forEach((k, i) => {
    withCamera(fc, { x: 96, y: 360, zoom: 0.25, sx: 96 + i * 360, sy: 584 }, () => sectionSlam(at(fc, k / 30), '02', 'INTELLIGENT PLACEMENT', 0, 1.6));
  });
  withCamera(fc, { x: 96, y: 360, zoom: 0.25, sx: 1536, sy: 584 }, () => sectionSlam(at(fc, 1.6 + 3 / 30), '03', 'GOVERNANCE', 0, 1.6));

  caption(fc, 'plate 8 px corners · CTA', 96, 720);
  plate(fc, { x: 96, y: 756, w: 920, h: 64 }, PALETTE.azure, 8);
  text(fc.g, 'Get started  →  learn.microsoft.com/azure/kubernetes-fleet', 556, 772, { font: font('display', 32, 700), color: PALETTE.paper, align: 'center' });
  plate(fc, { x: 1096, y: 756, w: 400, h: 150 }, PALETTE.paper, 8);
  ['kind: ClusterResourcePlacement', 'selector: env=prod', 'property: nodeCount ≥ 5', 'rollout: progressive'].forEach((l, i) =>
    text(fc.g, l, 1112, 768 + i * 32, { font: font('mono', 20), color: PALETTE.ground }),
  );
}

export const galleryPages: readonly ((fc: FrameCtx) => void)[] = [page1, page2, page3];
