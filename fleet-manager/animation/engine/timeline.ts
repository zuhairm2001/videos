/**
 * The director: timeline/timeline.json, imported statically (Vite reloads the page when it changes).
 */
import json from '../../timeline/timeline.json';
import type { Timeline, TimelineScene } from './types';

export const TIMELINE = json as Timeline;

/** Seconds of `timeline.cues[id]`; throws on an unknown id so typos fail loudly. */
export function cue(id: string): number {
  const v = TIMELINE.cues[id];
  if (typeof v !== 'number') throw new Error(`unknown cue "${id}"`);
  return v;
}

/** `{ start, end }` of a scene from timeline.scenes; throws on an unknown id. */
export function sceneSpan(id: string): TimelineScene {
  const s = TIMELINE.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`scene "${id}" not in timeline.json`);
  return s;
}
