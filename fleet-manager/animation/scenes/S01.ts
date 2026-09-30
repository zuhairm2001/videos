/** S01 — Hook (0.00–4.00): one hero cluster, "One cluster is simple." */
import { clusterGlyph, font, glyphBuild, headlineRise, PALETTE } from '../components';
import { sceneSpan } from '../engine/timeline';
import type { Scene } from '../engine/types';
import { HERO_LABEL, HERO_S01 } from './lib/opening-layout';
import { typeOnCentred } from './lib/opening-type';

const { start, end } = sceneSpan('S01');

const scene: Scene = {
  id: 'S01',
  start,
  end,
  draw(fc) {
    const t = fc.t;
    clusterGlyph(fc, HERO_S01.x, HERO_S01.y, HERO_S01.p, 'updated', { build: glyphBuild(fc.cue('s01.glyph'), t) });

    // label under the glyph, typed line after line (mono 20 mute, centred at x 960, top y 440)
    const tl = fc.cue('s01.label');
    const lf = font('mono', 20);
    typeOnCentred(fc, HERO_LABEL[0], 960, 440, lf, 20, PALETTE.mute, tl, undefined, 0.04);
    typeOnCentred(fc, HERO_LABEL[1], 960, 466, lf, 20, PALETTE.mute, tl + Math.ceil(HERO_LABEL[0].length / 3) / 30, undefined, 0.04);

    const out = fc.cue('s01.out');
    headlineRise(fc, ['One cluster is simple.'], 960, 560, { px: 120, align: 'center', t0: fc.cue('s01.headline'), t, outT: out });
    typeOnCentred(fc, 'one version · one region · one set of rules', 960, 720, font('mono', 28), 28, PALETTE.mute, fc.cue('s01.sub'), out);
  },
};

export default scene;
