/**
 * Deterministic hashing and noise (no Math.random anywhere in the renderer).
 */

/** 32-bit integer hash of up to 4 integers → uint32. */
export function hash32(a: number, b = 0, c = 0, d = 0): number {
  let h = 0x9e3779b9 ^ Math.imul(a | 0, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16) ^ Math.imul(b | 0, 0xc2b2ae35), 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15) ^ Math.imul(c | 0, 0x165667b1), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13) ^ Math.imul(d | 0, 0xd3a2646c), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Hash → float in [0, 1). */
export const hash01 = (a: number, b = 0, c = 0, d = 0): number => hash32(a, b, c, d) / 4294967296;

/** Stable integer seed from a string. */
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const smooth = (u: number): number => u * u * (3 - 2 * u);

/** 2-D value noise in [0, 1], lattice spacing 1. */
export function valueNoise(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const a = hash01(xi, yi, seed);
  const b = hash01(xi + 1, yi, seed);
  const c = hash01(xi, yi + 1, seed);
  const d = hash01(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractal (fBm) value noise in [0, 1]. */
export function fbm(x: number, y: number, seed = 0, octaves = 3): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x, y, seed + o * 101);
    norm += amp;
    x *= 2.03;
    y *= 2.03;
    amp *= 0.5;
  }
  return sum / norm;
}
