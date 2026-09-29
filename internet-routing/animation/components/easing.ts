/**
 * Easing and time helpers. All functions are pure.
 */
import { FPS } from '../config';

/** Clamp to [0, 1]. */
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Linear interpolation. */
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export const linear = (u: number): number => clamp01(u);
export const easeInCubic = (u: number): number => clamp01(u) ** 3;
export const easeOutCubic = (u: number): number => 1 - (1 - clamp01(u)) ** 3;
export function easeInOutCubic(u: number): number {
  u = clamp01(u);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}
export const easeInQuart = (u: number): number => clamp01(u) ** 4;
export const easeOutQuart = (u: number): number => 1 - (1 - clamp01(u)) ** 4;
export function easeInOutQuart(u: number): number {
  u = clamp01(u);
  return u < 0.5 ? 8 * u ** 4 : 1 - (-2 * u + 2) ** 4 / 2;
}
/** easeOutBack; overshoots past 1 then settles. `s` = overshoot amount (1.70158 = standard). */
export function easeOutBack(u: number, s = 1.70158): number {
  u = clamp01(u);
  const c3 = s + 1;
  return 1 + c3 * (u - 1) ** 3 + s * (u - 1) ** 2;
}

/** Whole frames elapsed since `t0` (floor, can be negative). */
export const framesSince = (t0: number, t: number): number => Math.floor((t - t0) * FPS + 1e-6);

/**
 * Normalised progress of an event that starts at `t0` (s) and lasts `frames` frames.
 * Returns 0 before, 1 after. Stepped per frame (no sub-frame values).
 */
export function progress(t0: number, t: number, frames: number): number {
  return clamp01(framesSince(t0, t) / frames);
}

/** Eased progress: `ease(progress(t0, t, frames))`. */
export function tween(t0: number, t: number, frames: number, ease: (u: number) => number = easeInOutCubic): number {
  return ease(progress(t0, t, frames));
}

/** Piecewise-linear interpolation over sorted `[t, value]` keys (held outside the range). */
export function keyframes(keys: readonly (readonly [number, number])[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t < t1) {
      const [t0, v0] = keys[i - 1];
      return lerp(v0, v1, (t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}
