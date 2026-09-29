/**
 * S06 — 02 Packets, "Your request fits in one" (15.10–17.10 s, frames 453–512).
 * Card compresses (15.15), ruler fill + `100 B` (15.60), `= 1 packet` (16.05),
 * card collapses into the tracked request packet (16.98).
 */
import { hudStopwatch } from '../components';
import type { Scene } from '../engine/types';
import { drawB3Header, drawCardLabels, drawRequestCard } from './S05';

const scene: Scene = {
  id: 'S06',
  start: 15.1,
  end: 17.1,
  draw(fc) {
    const t = fc.t;
    drawB3Header(fc, t);
    drawCardLabels(fc, t);
    drawRequestCard(fc, t);
    hudStopwatch(fc.crisp, t);
  },
};
export default scene;
