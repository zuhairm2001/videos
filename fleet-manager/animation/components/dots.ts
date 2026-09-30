/**
 * Dot primitives. Everything in this film is dots on a 24 px grid (design bible, pillar 1).
 */
import { framesSince } from './time';

type Pt = { x: number; y: number };

/** Filled circle centred on (x, y), `diam` px across. Draws on whatever context you pass (fc.g or fc.glow). */
export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, diam: number, color: string, alpha = 1): void {
  if (alpha <= 0 || diam <= 0) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, diam / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = prev;
}

/**
 * motion.md power-on rule: 0 before `t0`, 0.4 on the first frame, 1 from the second frame on.
 * Multiply dot alpha by it; a result of 0.4 is also the cue for the small overshoot glow.
 */
export function powerOn(t0: number, t: number): 0 | 0.4 | 1 {
  const k = framesSince(t0, t);
  return k < 0 ? 0 : k === 0 ? 0.4 : 1;
}

/** The reverse of `powerOn`: 1 before `t0`, 0.4 on the first frame, 0 after. */
export function powerOff(t0: number, t: number): 0 | 0.4 | 1 {
  const k = framesSince(t0, t);
  return k < 0 ? 1 : k === 0 ? 0.4 : 0;
}

/**
 * Dotted line from `a` to `b`: dots every `pitch` px starting at `a`. `fill` (0..1, default 1) draws
 * only the first `fill` of the length (use it for draw-on).
 */
export function dotLine(
  ctx: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  { pitch = 6, diam = 1.5, color, fill = 1, alpha = 1 }: { pitch?: number; diam?: number; color: string; fill?: number; alpha?: number },
): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.floor((len * Math.max(0, Math.min(1, fill))) / pitch + 1e-6);
  if (len === 0 || fill <= 0) return;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = a.x + ux * i * pitch;
    const y = a.y + uy * i * pitch;
    ctx.moveTo(x + diam / 2, y);
    ctx.arc(x, y, diam / 2, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.globalAlpha = prev;
}

/** 3 columns × 5 rows solid triangle pointing right (+x): 5 · 3 · 1 dots. */
const ARROW: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 1],
  [1, 2],
  [1, 3],
  [2, 2],
];

export type ArrowDir = 'right' | 'left' | 'up' | 'down' | number;
const DIR_ANGLE: Record<'right' | 'left' | 'up' | 'down', number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

/**
 * Small dot-arrow (3×5 dots at pitch `p`, a solid triangle ▶) centred on (x, y).
 * `dir` is a name or an angle in radians (0 = right, π/2 = down). Dot diameter = 0.8·p.
 */
export function dotArrow(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string, dir: ArrowDir = 'right', alpha = 1): void {
  const a = typeof dir === 'number' ? dir : DIR_ANGLE[dir];
  const c = Math.cos(a);
  const s = Math.sin(a);
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [i, j] of ARROW) {
    const lx = (i - 1) * p;
    const ly = (j - 2) * p;
    const px = x + lx * c - ly * s;
    const py = y + lx * s + ly * c;
    ctx.moveTo(px + 0.4 * p, py);
    ctx.arc(px, py, 0.4 * p, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.globalAlpha = prev;
}
