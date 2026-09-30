/** S04: section slam `01` / `SAFE UPDATES` (storyboard S04 pattern). */
import { sectionSlam } from '../components';
import { sceneSpan } from '../engine/timeline';
import type { Scene } from '../engine/types';

const { start, end } = sceneSpan('S04');

const scene: Scene = {
  id: 'S04',
  start,
  end,
  draw(fc) {
    sectionSlam(fc, '01', 'SAFE UPDATES', fc.cue('s04.slam'), fc.cue('s04.out'));
  },
};

export default scene;
