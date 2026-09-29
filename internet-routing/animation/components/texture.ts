/**
 * Procedural textures for the ascii source layers.
 */
import { DITHER_PX } from '../config';
import type { Box } from './guide';
import { fbm } from './noise';

export interface CloudOpts {
  /** Noise seed (default 1). */
  seed?: number;
  /** Feature size in px (default 180). */
  scale?: number;
  /** Peak density 0..1 (default 0.6). */
  density?: number;
  /** Noise level below which the cloud is empty, 0..1 (default 0.42). */
  threshold?: number;
  /** Horizontal drift in px/s (default 18). */
  drift?: number;
  /** 'dither' → white paint (1-bit Bayer dots in the layer tint); 'ascii' → black paint (glyphs); default 'dither'. */
  mode?: 'dither' | 'ascii';
  /** RGB for 'ascii' mode glyphs in an explicit colour, e.g. [157,180,242] (default black → layer tint). */
  rgb?: [number, number, number];
  /** Fade band at top/bottom edges in px (default 40). */
  feather?: number;
}

let buf: HTMLCanvasElement | null = null;

/**
 * Deterministic dither/ASCII clouds painted into an ascii source (`fc.ascii`) inside `box`,
 * evaluated at 4 px resolution. Pure function of `t` (s) and opts.
 * Tip: set `fc.fx.asciiTint = PALETTE.skyTint` for sky-tinted dither clouds.
 */
export function cloudField(ctx: CanvasRenderingContext2D, box: Box, t: number, opts: CloudOpts = {}): void {
  const seed = opts.seed ?? 1;
  const scale = opts.scale ?? 180;
  const peak = opts.density ?? 0.6;
  const thr = opts.threshold ?? 0.42;
  const drift = (opts.drift ?? 18) * t;
  const feather = opts.feather ?? 40;
  const [r, g, b] = opts.mode === 'ascii' ? (opts.rgb ?? [0, 0, 0]) : [255, 255, 255];
  const gw = Math.max(1, Math.ceil(box.w / DITHER_PX));
  const gh = Math.max(1, Math.ceil(box.h / DITHER_PX));
  buf ??= document.createElement('canvas');
  if (buf.width < gw || buf.height < gh) {
    buf.width = Math.max(buf.width, gw);
    buf.height = Math.max(buf.height, gh);
  }
  const bctx = buf.getContext('2d')!;
  const img = bctx.createImageData(gw, gh);
  const d = img.data;
  for (let j = 0; j < gh; j++) {
    const py = j * DITHER_PX;
    const edge = Math.min(1, Math.min(py, box.h - py) / feather);
    for (let i = 0; i < gw; i++) {
      const n = fbm((box.x + i * DITHER_PX + drift) / scale, (box.y + py) / scale, seed, 4);
      const a = Math.max(0, Math.min(1, (n - thr) / (1 - thr))) * peak * edge;
      const o = (j * gw + i) * 4;
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = b;
      d[o + 3] = Math.round(a * 255);
    }
  }
  bctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, 0, 0, gw, gh, box.x, box.y, gw * DITHER_PX, gh * DITHER_PX);
  ctx.restore();
}

/* ----------------------------------------------------------------- camera */

export interface Camera {
  /** World point placed at screen (sx, sy). */
  x: number;
  y: number;
  zoom: number;
  /** Screen anchor (default frame centre 540, 960). */
  sx?: number;
  sy?: number;
}

/**
 * Apply a camera transform to one or more contexts (call inside save/restore).
 * World (cam.x, cam.y) maps to screen (sx, sy) at `zoom`. Apply the same camera to
 * fc.ascii, fc.asciiHero and fc.crisp so layers stay registered.
 */
export function applyCamera(cam: Camera, ...ctxs: CanvasRenderingContext2D[]): void {
  for (const c of ctxs) {
    c.translate(cam.sx ?? 540, cam.sy ?? 960);
    c.scale(cam.zoom, cam.zoom);
    c.translate(-cam.x, -cam.y);
  }
}
