/**
 * Scene contract shared by the engine and every scene module (animation/scenes/SNN.ts).
 */

export interface FrameCtx {
  /** Global frame index (0 … 1799). */
  frame: number;
  /** Global seconds = frame / 30. */
  t: number;
  /** Main layer (1920×1080). Already holds ground, idle dot field and chrome when `draw` is called. */
  g: CanvasRenderingContext2D;
  /** Glow layer, same size, cleared to transparent. Everything drawn here is bloomed (blurred) and added on top of `g`. */
  glow: CanvasRenderingContext2D;
  /** Seconds of `timeline.cues[id]`. Throws on an unknown id. */
  cue(id: string): number;
  timeline: Timeline;
  assets: Assets;
}

export interface Scene {
  id: string;
  /** Global start time (s), inclusive. */
  start: number;
  /** Global end time (s), exclusive (the last scene also owns t = end). */
  end: number;
  /** Draw one frame. `lt` = seconds since scene start (fc.t − start). Must be a pure function of time. */
  draw(fc: FrameCtx, lt: number): void;
}

export interface Assets {
  /** fleet-manager-icon.svg rasterised at 576×576 px. */
  icon: CanvasImageSource;
  /**
   * The icon sampled to a cols×rows grid, `[row][col]`. Each cell is one of the icon's fill hexes
   * (#0078D4, #773ADC, #A67AF4, #B796F9, #83B9F9, upper-case) or null where the icon is transparent.
   */
  iconDots(cols: number, rows: number): (string | null)[][];
}

/* ---------------------------------------------------------------- timeline */

export interface TimelineScene {
  id: string;
  beat: string;
  start: number;
  end: number;
}
export interface TimelineSfx {
  file: string;
  at: number;
  gainDb: number;
  note?: string;
}
export interface TimelineMusicSection {
  id: string;
  start: number;
  end: number;
  [k: string]: unknown;
}
export interface Timeline {
  fps: number;
  duration: number;
  width: number;
  height: number;
  bpm: number;
  barSec: number;
  scenes: TimelineScene[];
  cues: Record<string, number>;
  music: { file: string; motifAt: number[]; sections: TimelineMusicSection[]; hits: number[] };
  audio: { sfx: TimelineSfx[] };
}
