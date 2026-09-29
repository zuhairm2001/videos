/**
 * The guide character: line art in crisp ink over 1-bit dither + hero-ASCII shading,
 * with the 8-frame ASCII-ramp entrance/exit (`space . + # @` → resolved line art).
 */
import type { FrameCtx, Pose } from '../engine/types';
import { asciiRamp, rampDensity, rampIn, rampOut, type RampStage } from './ascii-ramp';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GuideOpts {
  /** Ramp length in frames for entrance and exit (default 8). */
  frames?: number;
  /** Force a ramp stage (e.g. '#' for the S01/S15 loop hold) instead of the time-based one. */
  stage?: RampStage;
  /** Mirror horizontally. */
  flip?: boolean;
  /** Dither shading strength multiplier (default 1). */
  shade?: number;
  /** Hero-ASCII contour strength multiplier (default 1). */
  contour?: number;
  /** Horizontal placement of the fitted art inside the box (default 'center'). */
  align?: 'left' | 'center' | 'right';
}

/**
 * Draw the guide in `pose`, fitted (contain, bottom-aligned) inside `box`.
 * - Before `enterT`: nothing. From `enterT`: ASCII ramp in the asciiHero layer over `frames`, then resolved.
 * - Resolved: crisp ink line art + dither shading and soft hero-ASCII contours in asciiHero.
 * - From `exitT`: reverse ramp, then nothing. Pass `Infinity` for no exit.
 * `enterT`, `exitT` and `t` share one timebase (normally global seconds, `fc.t`).
 * @returns the stage drawn ('resolved', a ramp char, or null when hidden).
 */
export function drawGuide(fc: FrameCtx, pose: Pose, box: Box, enterT: number, exitT: number, t: number, opts: GuideOpts = {}): RampStage | null {
  const frames = opts.frames ?? 8;
  let stage: RampStage;
  let density: number;
  if (opts.stage) {
    stage = opts.stage;
    density = stage === 'resolved' ? 1 : rampDensity(stage);
  } else {
    const pin = rampIn(enterT, t, frames);
    const pout = rampOut(exitT, t, frames);
    if (pin < 0 || pout < 0) return null;
    ({ stage, density } = asciiRamp(Math.min(pin, pout)));
  }

  const art = fc.assets.guide[pose];
  const s = Math.min(box.w / art.width, box.h / art.height);
  const w = art.width * s;
  const h = art.height * s;
  const align = opts.align ?? 'center';
  const x = align === 'left' ? box.x : align === 'right' ? box.x + box.w - w : box.x + (box.w - w) / 2;
  const y = box.y + box.h - h;

  const place = (ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, alpha: number) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    if (opts.flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.restore();
  };

  if (stage !== 'resolved') {
    place(fc.asciiHero, art.silhouette, density);
    return stage;
  }
  place(fc.asciiHero, art.shade, opts.shade ?? 1);
  place(fc.asciiHero, art.contour, opts.contour ?? 1);
  place(fc.crisp, art.line, 1);
  return stage;
}
