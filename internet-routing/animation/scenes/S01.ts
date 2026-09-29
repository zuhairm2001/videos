/**
 * S01 · Hook "Enter." (0.00–2.50 s, frames 0–74).
 * Frame 0 is the loop key frame shared with S15 f1349: top dither bleed band, guide (curious) at
 * ramp stage '#', URL bar `example.co` + cursor on, keycap up, no header/HUD/caption.
 */
import {
  PALETTE,
  cloudField,
  drawGuide,
  drawText,
  easeInOutCubic,
  enterKey,
  font,
  framesSince,
  link,
  scrambleText,
  urlBar,
  type Box,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';

/** Loop layout shared by S01, S02 and (by agreement) S15. */
export const GUIDE_BOX: Box = { x: 120, y: 440, w: 408, h: 420 };
export const URL_BOX: Box = { x: 120, y: 900, w: 468, h: 96 };
export const KEY_BOX: Box = { x: 612, y: 900, w: 168, h: 96 };
/** URL text size in the S01/S15 bar: 64 px overflows the 468 px bar, 52 px fits `example.com` + spinner. */
export const URL_PX = 52;
export const SPINNER_X = 540;
/** Spinner starts after the 2-frame submit inversion at 0.50 s (frames 15–16). */
export const SPINNER_T0 = 17 / 30;
export const HEADLINE = 'how a request travels';
export const HEADLINE_T0 = 1.95;

/** Decorative top bleed band (y 0–270). `tl` = fc.t in S01/S02, fc.t − 45 in S15 (continuous drift). */
export function topBleedBand(fc: FrameCtx, tl: number): void {
  cloudField(fc.ascii, { x: 0, y: 0, w: 1080, h: 270 }, tl, { seed: 3, density: 0.45 });
}

/** Spinner step index for global time t (steps every 2 f from SPINNER_T0). */
export function spinnerStep(t: number): number {
  return Math.floor(framesSince(SPINNER_T0, t) / 2);
}

/** Header proposition `how a request travels` (display 48 inkDeep, x 120, y 300). */
export function drawHeadline(ctx: CanvasRenderingContext2D, t: number): void {
  scrambleText(ctx, HEADLINE, 120, 300, font('display', 48), PALETTE.inkDeep, HEADLINE_T0, t, 10);
}

const TRAIL_T0 = 0.93;
const TRAIL_FRAMES = 18;
const TRAIL_A = { x: 588, y: 948 };
const TRAIL_B = { x: 1080, y: 0 };

/** 0.93: dotted ink trail with a 48 px `?` head, URL bar right end → top-right bleed over 18 f. */
function drawQuestionTrail(ctx: CanvasRenderingContext2D, t: number): void {
  const k = framesSince(TRAIL_T0, t);
  if (k < 0) return;
  const at = (u: number) => ({ x: TRAIL_A.x + (TRAIL_B.x - TRAIL_A.x) * u, y: TRAIL_A.y + (TRAIL_B.y - TRAIL_A.y) * u });
  const head = easeInOutCubic(Math.min(1, k / TRAIL_FRAMES));
  // tail lags the head by ~10 f so the whole trail leaves the frame shortly after the head
  const tail = easeInOutCubic(Math.max(0, Math.min(1, (k - 10) / TRAIL_FRAMES)));
  if (tail >= 1) return;
  link(ctx, at(tail), at(head), { fill: 0 });
  if (head < 1) {
    const p = at(head);
    drawText(ctx, '?', p.x + 4, p.y - 58, { px: 48, color: PALETTE.ink, weight: 700 });
  }
}

/** Keycap press 0..1 by frame: down over f3–f4, held, released from f6 (2 f). */
const KEY_PRESS = [0, 0, 0, 0.5, 1, 1, 0.5];
const scene: Scene = {
  id: 'S01',
  start: 0,
  end: 2.5,
  draw(fc) {
    const { crisp, t, frame } = fc;
    topBleedBand(fc, t);

    // guide: '#' f0–3 (loop hold), '@' f4–7, resolved from f8 (face readable by f9);
    // 1.40 gaze follows the trail upward → pose swap to surprised on the 15 fps step.
    if (t < 1.4) {
      const stage = frame < 4 ? '#' : frame < 8 ? '@' : 'resolved';
      drawGuide(fc, 'curious', GUIDE_BOX, 0, Infinity, t, { stage });
    } else {
      drawGuide(fc, 'surprised', GUIDE_BOX, 0, Infinity, t, { stage: 'resolved' });
    }

    // URL bar: `example.co` at f0, `m` at f1; cursor on f0–14; 0.50 border inverts 2 f; spinner after.
    const text = frame < 1 ? 'example.co' : 'example.com';
    const invert = frame === 15 || frame === 16;
    urlBar(crisp, URL_BOX, text, {
      px: URL_PX,
      cursor: frame < 15,
      invert,
      spinner: t >= SPINNER_T0 ? spinnerStep(t) : undefined,
      spinnerX: SPINNER_X,
    });
    enterKey(crisp, KEY_BOX, KEY_PRESS[frame] ?? 0);

    drawQuestionTrail(crisp, t);
    drawHeadline(crisp, t);
  },
};
export default scene;
