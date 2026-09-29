/**
 * Frame engine: owns the three source canvases, selects the active scene, runs the
 * 15 fps ASCII / 30 fps crisp passes, draws captions, and composites via WebGL2.
 */
import { FPS, FRAMES, HEIGHT, PALETTE, WIDTH } from '../config';
import { captionRenderer } from '../components/captions';
import { Compositor } from './gl';
import type { Assets, FrameCtx, FxState, Scene, Timeline } from './types';

function layer(): CanvasRenderingContext2D {
  const c = document.createElement('canvas');
  c.width = WIDTH;
  c.height = HEIGHT;
  return c.getContext('2d')!;
}

export class Engine {
  private ascii = layer();
  private hero = layer();
  private crisp = layer();
  /** Throwaway targets for the layer a pass must not affect. */
  private sinkAscii = layer();
  private sinkHero = layer();
  private sinkCrisp = layer();
  private compositor: Compositor;

  constructor(
    readonly output: HTMLCanvasElement,
    readonly scenes: readonly Scene[],
    readonly assets: Assets,
    readonly timeline: Timeline,
  ) {
    output.width = WIDTH;
    output.height = HEIGHT;
    this.compositor = new Compositor(output);
    for (const s of scenes) {
      const ts = timeline.scenes.find((x) => x.id === s.id);
      if (ts && (Math.abs(ts.start - s.start) > 1e-6 || Math.abs(ts.end - s.end) > 1e-6)) {
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

  /** Render frame n (0 … 1349) synchronously into the output canvas. */
  renderFrame(frame: number): void {
    frame = Math.max(0, Math.min(FRAMES - 1, Math.floor(frame)));
    const fx: FxState = { slip: 0, scanlineWipe: 0 };
    const asciiFrame = frame - (frame % 2); // ASCII layers update on 2s (15 fps)
    // Odd frames: ASCII layers come from the previous (even) frame, crisp from this frame.
    if (asciiFrame === frame) {
      this.drawInto(frame, this.ascii, this.hero, this.crisp, fx);
    } else {
      this.drawInto(asciiFrame, this.ascii, this.hero, this.sinkCrisp, fx);
      this.drawInto(frame, this.sinkAscii, this.sinkHero, this.crisp, fx);
    }
    captionRenderer(this.crisp, this.timeline.captions, frame);
    this.compositor.render(this.ascii.canvas, this.hero.canvas, this.crisp.canvas, {
      asciiTint: fx.asciiTint ?? PALETTE.ink,
      heroTint: fx.heroTint ?? PALETTE.ink,
      inkOverride: fx.inkOverride ?? null,
      slip: fx.slip,
      scanlineWipe: fx.scanlineWipe,
    });
  }

  private drawInto(frame: number, ascii: CanvasRenderingContext2D, hero: CanvasRenderingContext2D, crisp: CanvasRenderingContext2D, fx: FxState): void {
    for (const c of [ascii, hero, crisp]) c.reset();
    const scene = this.sceneAt(frame);
    if (!scene) return;
    const t = frame / FPS;
    const fc: FrameCtx = { frame, t, ascii, asciiHero: hero, crisp, fx, assets: this.assets, timeline: this.timeline };
    scene.draw(fc, t - scene.start);
    for (const c of [ascii, hero, crisp]) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      c.filter = 'none';
    }
  }
}
