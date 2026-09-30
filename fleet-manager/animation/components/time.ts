/**
 * Time, easing and deterministic hashing. All functions are pure (no Math.random, no Date).
 */
import { FPS } from '../config';

/** Clamp to [0, 1]. */
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Linear interpolation. */
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export const linear = (u: number): number => clamp01(u);
export const easeOutCubic = (u: number): number => 1 - (1 - clamp01(u)) ** 3;
export function easeInOutCubic(u: number): number {
  u = clamp01(u);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}
export const easeOutQuart = (u: number): number => 1 - (1 - clamp01(u)) ** 4;
export function easeInOutQuart(u: number): number {
  u = clamp01(u);
  return u < 0.5 ? 8 * u ** 4 : 1 - (-2 * u + 2) ** 4 / 2;
}
/** easeOutBack: overshoots past 1 then settles. `s` = overshoot (motion.md uses 1.4 for the slam). */
export function easeOutBack(u: number, s = 1.70158): number {
  u = clamp01(u);
  const c3 = s + 1;
  return 1 + c3 * (u - 1) ** 3 + s * (u - 1) ** 2;
}

/** Whole frames elapsed since `t0` (floor; negative before t0). */
export const framesSince = (t0: number, t: number): number => Math.floor((t - t0) * FPS + 1e-6);

/** Progress 0..1 of an event starting at `t0` (s) and lasting `frames` frames, stepped per frame. */
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

/** 32-bit integer hash of any number of integers → uint32. */
export function hash32(...ints: number[]): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < ints.length; i++) {
    h = Math.imul(h ^ Math.imul(ints[i] | 0, 0x85ebca6b), 0xc2b2ae35);
    h ^= h >>> 15;
    h = Math.imul(h, 0x27d4eb2f);
    h ^= h >>> 13;
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/** Hash of integers → float in [0, 1). */
export const hash01 = (...ints: number[]): number => hash32(...ints) / 4294967296;

/** Stable integer seed from a string (FNV-1a). */
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
