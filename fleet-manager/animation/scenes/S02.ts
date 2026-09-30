/** S02 — Sprawl (4.00–8.00): clusters double on the beat, scatter off-grid and drift. */
import {
  clusterGlyph,
  dotNumber,
  easeInOutCubic,
  font,
  framesSince,
  glyphBuild,
  hash01,
  headlineRise,
  lerp,
  PALETTE,
  plate,
  powerOff,
  powerOn,
  scramble,
  seedOf,
  tween,
  typeOn,
} from '../components';
import { sceneSpan } from '../engine/timeline';
import type { Scene } from '../engine/types';
import {
  COUNTER,
  drawHeroLabel,
  drawSprawlLabel,
  HEADLINE,
  HERO_LABEL,
  HERO_S01,
  HERO_S02,
  HL_BOTTOM,
  LABEL_PX,
  LABEL_TRACK,
  popTime,
  S02_HEADLINE,
  S02_SUB,
  sprawl,
  SUB_LH,
  SUB_PX,
  VERSIONS,
} from './lib/opening-layout';
import { typeOnCentred } from './lib/opening-type';

const { start, end } = sceneSpan('S02');
const SEED = seedOf('S02.drift');

const scene: Scene = {
  id: 'S02',
  start,
  end,
  draw(fc) {
    const t = fc.t;
    const { glyphs, counterW, headlineW } = sprawl(fc.g);
    const dStart = fc.cue('s02.drift.start');
    const kDrift = framesSince(dStart, t);
    const drifting = kDrift >= 0 && t < fc.cue('s02.drift.end');
    const lf = font('mono', LABEL_PX);

    // hero: shrinks p 24 → 12 and drifts to its S02 rest over 12 f; S01 label powers off, then re-types beside it
    const tShrink = fc.cue('s02.shrink');
    const u = tween(tShrink, t, 12, easeInOutCubic);
    const heroP = lerp(HERO_S01.p, HERO_S02.p, u);
    clusterGlyph(fc, lerp(HERO_S01.x, HERO_S02.x, u), lerp(HERO_S01.y, HERO_S02.y, u), heroP, 'updated');
    const off = powerOff(tShrink, t);
    if (off > 0) {
      fc.g.globalAlpha = off;
      typeOnCentred(fc, HERO_LABEL[0], 960, 440, font('mono', 20), 20, PALETTE.mute, -1, undefined, 0.04);
      typeOnCentred(fc, HERO_LABEL[1], 960, 466, font('mono', 20), 20, PALETTE.mute, -1, undefined, 0.04);
      fc.g.globalAlpha = 1;
    }
    drawHeroLabel(fc, tShrink + 12 / 30);

    // the sprawl
    let count = 0;
    for (const q of glyphs) {
      if (q.i === 0) {
        count++;
        continue;
      }
      const t0 = popTime(fc, q);
      if (framesSince(t0, t) < 0) continue;
      count++;
      let { x, y } = q;
      let state = q.state;
      if (drifting) {
        x += Math.floor(hash01(SEED, q.i, fc.frame, 1) * 3) - 1;
        y += Math.floor(hash01(SEED, q.i, fc.frame, 2) * 3) - 1;
        const phase = Math.floor(hash01(SEED, q.i, 3) * 4);
        if (state === 'drift' && Math.floor((kDrift + phase) / 2) % 2 === 1) state = 'dim';
      }
      clusterGlyph(fc, x, y, q.p, state, { build: glyphBuild(t0, t), alpha: q.alpha });
      drawSprawlLabel(
        fc,
        q,
        x,
        y,
        t0 + 2 / 30,
        drifting
          ? (ver, vx, vy) => {
              // version labels scramble to a new seeded version every 4 f
              const phase = Math.floor(hash01(SEED, q.i, 4) * 4);
              const w = Math.floor((kDrift + phase) / 4);
              const v = VERSIONS[Math.floor(hash01(SEED, q.i, w, 5) * 3)];
              scramble(fc, v, vx, vy, lf, PALETTE.mute, dStart + (w * 4 - phase) / 30, t, 2, LABEL_TRACK);
            }
          : undefined,
      );
    }

    // headline on a 16 px ground plate, then the sub-line
    const tHead = fc.cue('s02.headline');
    const plateOn = powerOn(tHead, t);
    if (plateOn > 0) plate(fc, { x: HEADLINE.x - 16, y: HEADLINE.y - 16, w: headlineW + 32, h: HL_BOTTOM - HEADLINE.y + 32 }, PALETTE.ground, 4, plateOn);
    headlineRise(fc, [S02_HEADLINE], HEADLINE.x, HEADLINE.y, { px: HEADLINE.px, t0: tHead, t });
    let ts = fc.cue('s02.sub');
    S02_SUB.forEach((line, i) => {
      typeOn(fc, line, HEADLINE.x, HL_BOTTOM + 40 + i * SUB_LH, font('mono', SUB_PX), PALETTE.mute, ts, t);
      ts += Math.ceil(line.length / 3) / 30;
    });

    // counter: popped clusters, Doto 900 200 paper at (96, 760) + "clusters"
    dotNumber(fc, String(count).padStart(2, '0'), COUNTER.x, COUNTER.y, COUNTER.px, PALETTE.paper);
    typeOn(fc, 'clusters', COUNTER.x + counterW + 24, COUNTER.y + 118, font('mono', 24), PALETTE.mute, tShrink, t);
  },
};

export default scene;
