/** S06: section slam `02` / `INTELLIGENT PLACEMENT` (storyboard S04 pattern). */
import { sectionSlam } from '../components';
import { sceneSpan } from '../engine/timeline';
import type { Scene } from '../engine/types';

const { start, end } = sceneSpan('S06');

const scene: Scene = {
  id: 'S06',
  start,
  end,
  draw(fc) {
    sectionSlam(fc, '02', 'INTELLIGENT PLACEMENT', fc.cue('s06.slam'), fc.cue('s06.out'));
  },
};

export default scene;
