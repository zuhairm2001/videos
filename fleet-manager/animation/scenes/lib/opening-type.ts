/** Opening-scene type helpers (S01–S03): centred mono type-on with the headline mask-down exit. */
import { easeOutQuart, framesSince, typeOn, W } from '../../components';
import { MONO_ADVANCE } from '../../config';
import type { FrameCtx } from '../../engine/types';

/**
 * Mono line typing on from `t0`, centred on `cx` (fixed-advance layout), top at `y`. From `outT` it
 * masks down like `headlineRise`: slides 24 px down behind a closing mask over 8 f.
 */
export function typeOnCentred(fc: FrameCtx, s: string, cx: number, y: number, font: string, px: number, color: string, t0: number, outT?: number, tracking = 0): void {
  const w = s.length * px * (MONO_ADVANCE + tracking) - tracking * px;
  const kOut = outT === undefined ? -1 : framesSince(outT, fc.t);
  const fall = kOut < 0 ? 0 : easeOutQuart((kOut + 1) / 8);
  if (fall >= 1) return;
  const { g } = fc;
  g.save();
  if (fall > 0) {
    const boxH = px * 1.3;
    g.beginPath();
    g.rect(0, y - px * 0.15, W, boxH * (1 - fall));
    g.clip();
  }
  typeOn(fc, s, cx - w / 2, y + 24 * fall, font, color, t0, fc.t, 90, tracking);
  g.restore();
}
