/**
 * "Dissolve through density" helpers (motion.md): entrances/exits step through
 * the ASCII ramp `space . + # @` and then resolve to crisp art.
 */
import { RAMP } from '../config';
import { framesSince } from './easing';

/** Entrance stages in order; after the last one the subject is "resolved". */
export const RAMP_STAGES = [' ', '.', '+', '#', '@'] as const;
export type RampStage = (typeof RAMP_STAGES)[number] | 'resolved';

/**
 * Alpha to paint into an ascii/asciiHero source so the shader picks exactly `ch`
 * (a character of RAMP ` .:-=+*#%@`) for a fully covered cell. Unknown chars → 0.
 */
export function rampDensity(ch: string): number {
  const i = RAMP.indexOf(ch);
  return i <= 0 ? 0 : (i + 0.5) / RAMP.length;
}

/**
 * Stage of a density entrance at `progress` 0..1 (0 = space, then . + # @, 1 = resolved).
 * @returns `{ stage, density, resolved }` where density = rampDensity(stage) (1 when resolved).
 */
export function asciiRamp(progress: number): { stage: RampStage; density: number; resolved: boolean } {
  if (progress >= 1) return { stage: 'resolved', density: 1, resolved: true };
  const i = Math.max(0, Math.min(RAMP_STAGES.length - 1, Math.floor(progress * RAMP_STAGES.length)));
  const stage = RAMP_STAGES[i];
  return { stage, density: rampDensity(stage), resolved: false };
}

/**
 * Entrance progress for a ramp that starts at `t0` and lasts `frames` frames (default 8).
 * Feed to asciiRamp(). Returns <0 before start (treat as hidden).
 */
export function rampIn(t0: number, t: number, frames = 8): number {
  const k = framesSince(t0, t);
  return k < 0 ? -1 : k / frames;
}

/**
 * Exit progress (reverse ramp) starting at `t0`: 1 (resolved) → @ # + . → hidden.
 * Returns ≥1 before the exit starts, <0 once fully gone. Feed to asciiRamp() when ≥ 0.
 */
export function rampOut(t0: number, t: number, frames = 8): number {
  const k = framesSince(t0, t);
  if (k < 0) return 1;
  return k >= frames ? -1 : 1 - (k + 1) / frames;
}
