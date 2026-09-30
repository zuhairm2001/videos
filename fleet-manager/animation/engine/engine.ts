/**
 * Frame engine: owns the main + glow canvases, draws ground / idle dot field / chrome, runs the
 * active scene, and composites through WebGL2 (bloom, grain, vignette).
 */
import { FPS, FRAMES, H, PALETTE, W } from '../config';
import { drawChrome, makeDotField, SECTION_BY_SCENE } from './chrome';
import { Compositor } from './gl';
import { cue, TIMELINE } from './timeline';
import type { Assets, FrameCtx, Scene } from './types';

function layer(): CanvasRenderingContext2D {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c.getContext('2d')!;
}

function resetState(c: CanvasRenderingContext2D): void {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.letterSpacing = '0px';
}

export class Engine {
  private g = layer();
  private glow = layer();
  private field = makeDotField();
  private compositor: Compositor;

  constructor(
    readonly output: HTMLCanvasElement,
    readonly scenes: readonly Scene[],
    readonly assets: Assets,
  ) {
    output.width = W;
    output.height = H;
    this.compositor = new Compositor(output);
    for (const s of scenes) {
      const ts = TIMELINE.scenes.find((x) => x.id === s.id);
      if (!ts) console.warn(`scene ${s.id} is not in timeline.json`);
      else if (Math.abs(ts.start - s.start) > 1e-6 || Math.abs(ts.end - s.end) > 1e-6) {
        console.warn(`scene ${s.id}: module ${s.start}–${s.end} differs from timeline ${ts.start}–${ts.end}; module wins`);
      }
    }
  }

  /** Scene active at frame n (start ≤ t < end; the last scene also owns its end). */
  sceneAt(frame: number): Scene | null {
    const t = frame / FPS;
    for (const s of this.scenes) if (t >= s.start - 1e-9 && t < s.end - 1e-9) return s;
    const last = this.scenes[this.scenes.length - 1];
    return last && t <= last.end + 1e-9 ? last : null;
  }

  /** Spec-strip section for a scene: its text and the start of the first scene sharing it. */
  private sectionOf(scene: Scene | null): { text: string; start: number } {
    const text = (scene && SECTION_BY_SCENE[scene.id]) ?? SECTION_BY_SCENE.S01;
    const first = this.scenes.find((s) => SECTION_BY_SCENE[s.id] === text);
    return { text, start: first ? first.start : 0 };
  }

  /** Render frame n (0 … 1799) synchronously into the output canvas. */
  renderFrame(frame: number): void {
    frame = Math.max(0, Math.min(FRAMES - 1, Math.floor(frame)));
    const scene = this.sceneAt(frame);
    this.renderWith(frame, scene ? (fc) => scene.draw(fc, fc.t - scene.start) : () => {}, this.sectionOf(scene));
  }

  /** Render frame n with a custom draw on top of ground / field / chrome (used by the gallery). */
  renderWith(frame: number, draw: (fc: FrameCtx) => void, section = this.sectionOf(this.sceneAt(frame)), chrome = true): void {
    const { g, glow } = this;
    for (const c of [g, glow]) {
      c.reset();
      resetState(c);
    }
    g.fillStyle = PALETTE.ground;
    g.fillRect(0, 0, W, H);
    g.drawImage(this.field, 0, 0);
    const fc: FrameCtx = { frame, t: frame / FPS, g, glow, cue, timeline: TIMELINE, assets: this.assets };
    if (chrome) drawChrome(fc, section);
    for (const c of [g, glow]) resetState(c);
    draw(fc);
    for (const c of [g, glow]) resetState(c);
    this.compositor.render(g.canvas, glow.canvas);
  }
}
