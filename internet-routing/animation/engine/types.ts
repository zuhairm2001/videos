/**
 * Scene contract shared by the engine and every scene module (animation/scenes/SNN.ts).
 */

export interface FrameCtx {
  /** Global frame index (0 … 1349). */
  frame: number;
  /** Global seconds = frame / 30. */
  t: number;
  /**
   * ASCII source layer (12×20 cells). Paint *density* here: alpha = density.
   * Black paint → ASCII glyphs in the layer tint; white paint → 1-bit Bayer dither dots
   * in the layer tint; any other colour → ASCII glyphs in that colour.
   */
  ascii: CanvasRenderingContext2D;
  /** Hero ASCII source layer (24×40 cells). Same paint rules as `ascii`. */
  asciiHero: CanvasRenderingContext2D;
  /** Crisp vector layer: lines, cards, text, packets (drawn as-is). */
  crisp: CanvasRenderingContext2D;
  /** Global effects state; reset to defaults every frame, scenes write to it. */
  fx: FxState;
  assets: Assets;
  timeline: Timeline;
}

export interface FxState {
  /** Registration slip in px: the `ink` plate is offset right/down by this amount (0 = none). */
  slip: number;
  /** Scanline wipe progress 0..1 (0 = none). Reveals the frame top → bottom behind scanline bands. */
  scanlineWipe: number;
  /** Tint for black/white paint in the `ascii` layer (default palette ink). */
  asciiTint?: string;
  /** Tint for black/white paint in the `asciiHero` layer (default palette ink). */
  heroTint?: string;
  /** Re-ink every `ink`-coloured pixel of all layers with this colour (e.g. inkDeep during S10). */
  inkOverride?: string;
}

export interface Scene {
  id: string;
  /** Global start time (s), inclusive. */
  start: number;
  /** Global end time (s), exclusive (the last scene also owns t = end). */
  end: number;
  /** Draw one frame. `lt` = seconds since scene start (ctx.t - start). Must be a pure function of time. */
  draw(ctx: FrameCtx, lt: number): void;
}

/* ------------------------------------------------------------------ assets */

export type Pose = 'curious' | 'pointing' | 'surprised' | 'satisfied';

/** Pre-processed guide pose. All canvases share the pose's native size (width × height). */
export interface GuideArt {
  width: number;
  height: number;
  /** Line art tinted palette ink on transparent (crisp layer). */
  line: HTMLCanvasElement;
  /** Filled silhouette, black at alpha 1 (ASCII ramp stages). */
  silhouette: HTMLCanvasElement;
  /** 1-bit shading source: white paint, alpha = shade density (dither). */
  shade: HTMLCanvasElement;
  /** Soft contour density: black paint (hero ASCII glyphs along the lines). */
  contour: HTMLCanvasElement;
  /** True when the PNG was missing and a generated silhouette is used. */
  placeholder: boolean;
}

export interface Assets {
  guide: Record<Pose, GuideArt>;
}

/* ---------------------------------------------------------------- timeline */

export interface TimelineScene {
  id: string;
  beat: string;
  start: number;
  end: number;
}
export interface TimelineVo {
  id: string;
  start: number;
  end: number;
  text: string;
  file: string;
}
export interface TimelineCaption {
  /** Caption text; `\n` forces a line break; `[word]` brackets also mark emphasis. */
  text: string;
  start: number;
  end: number;
  /** Words/phrases rendered inverted (paper on inkDeep). */
  emphasis?: string[];
  scene?: string;
}
export interface TimelineAudio {
  file: string;
  at: number;
  gain_db: number;
  cue: string;
  scene?: string;
}
export interface Timeline {
  fps: number;
  duration: number;
  width: number;
  height: number;
  scenes: TimelineScene[];
  vo: TimelineVo[];
  captions: TimelineCaption[];
  audio: TimelineAudio[];
  music?: { file: string; bpm: number; duck: { start: number; end: number; db: number }[] } | null;
  markers: { t: number; label: string }[];
}
