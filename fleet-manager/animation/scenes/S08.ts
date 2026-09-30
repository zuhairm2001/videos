/** S08: section slam `03` / `GOVERNANCE` (storyboard S04 pattern). */
import { sectionSlam } from '../components';
import { sceneSpan } from '../engine/timeline';
import type { Scene } from '../engine/types';

const { start, end } = sceneSpan('S08');

const scene: Scene = {
  id: 'S08',
  start,
  end,
  draw(fc) {
    sectionSlam(fc, '03', 'GOVERNANCE', fc.cue('s08.slam'), fc.cue('s08.out'));
  },
};

export default scene;
