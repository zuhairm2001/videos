/**
 * Placeholder scenes: span from timeline.json, a small `PLACEHOLDER · SNN · beat` label, plus a
 * scene-specific component demo so the film renders end to end. Replaced by real scene modules.
 */
import { font, PALETTE } from '../config';
import { text } from '../components/text';
import { sceneSpan } from './timeline';
import type { FrameCtx, Scene } from './types';

export function makePlaceholderScene(id: string, demo: (fc: FrameCtx, lt: number, scene: Scene) => void): Scene {
  const { start, end, beat } = sceneSpan(id);
  const scene: Scene = {
    id,
    start,
    end,
    draw(fc, lt) {
      text(fc.g, `PLACEHOLDER · ${id} · ${beat} · lt ${lt.toFixed(2)}`, 96, 948, { font: font('mono', 18), color: PALETTE.rule, tracking: 0.08 });
      demo(fc, lt, scene);
    },
  };
  return scene;
}
