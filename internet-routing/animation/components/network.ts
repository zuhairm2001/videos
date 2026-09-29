/**
 * Network components: packet cards, the tracked (signal) packet, router nodes and links.
 */
import { FPS, PALETTE } from '../config';
import type { FrameCtx } from '../engine/types';
import type { Box } from './guide';
import { hash01 } from './noise';
import { asciiInk, drawText } from './text';

export interface Point {
  x: number;
  y: number;
}

/* ------------------------------------------------------------ packet card */

export interface PacketCardOpts {
  /** Centered label (glyph 36 inkDeep), e.g. '#01/13'. */
  label?: string;
  /** Header strip text (glyph 36, paper on inkDeep) along the top edge. */
  header?: string;
  /** Body lines (glyph `px` inkDeep), left-aligned under the header. */
  lines?: string[];
  /** Body font size (default 36). */
  px?: number;
  /** Border width (default 2). */
  border?: number;
  /** Border colour (default ink). */
  borderColor?: string;
  /** Plate colour (default paper). */
  fill?: string;
}

/** Blue packet card: paper plate, ink border, optional header strip, label or body lines. */
export function packetCard(ctx: CanvasRenderingContext2D, box: Box, opts: PacketCardOpts = {}): void {
  const { x, y, w, h } = box;
  const b = opts.border ?? 2;
  const px = opts.px ?? 36;
  ctx.save();
  ctx.fillStyle = opts.fill ?? PALETTE.paper;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = opts.borderColor ?? PALETTE.ink;
  ctx.lineWidth = b;
  ctx.strokeRect(x + b / 2, y + b / 2, w - b, h - b);
  let cy = y + b + 4;
  if (opts.header) {
    ctx.fillStyle = PALETTE.inkDeep;
    ctx.fillRect(x, y, w, 44);
    drawText(ctx, opts.header, x + 12, y + 4, { px: 36, color: PALETTE.paper });
    cy = y + 52;
  }
  if (opts.label) drawText(ctx, opts.label, x + w / 2, y + (h - px) / 2, { px, align: 'center' });
  for (const line of opts.lines ?? []) {
    drawText(ctx, line, x + 12, cy, { px });
    cy += Math.round(px * 1.2);
  }
  ctx.restore();
}

/* --------------------------------------------------------- tracked packet */

export interface TrackedPacketOpts {
  /** Block size (default 96×64). */
  w?: number;
  h?: number;
  /** Paper halo width (default 12 = 1 cell). */
  halo?: number;
  /** Dotted magenta trail over the last `trailFrames` frames (default true, 16 f). */
  trail?: boolean;
  trailFrames?: number;
  /** Readable ID variant: 12 px signal frame around a paper plate with inkDeep 36 px `id`. */
  id?: string;
}

/**
 * The tracked packet (R19): solid signal block 96×64 with a 12 px paper halo and a fading dotted
 * trail sampled from its own path. `posAt(t)` returns the packet centre at global time t
 * (must be defined for t − 16 f … t). Trail dots shrink with age.
 */
export function trackedPacket(ctx: CanvasRenderingContext2D, posAt: (t: number) => Point, t: number, opts: TrackedPacketOpts = {}): void {
  const w = opts.w ?? 96;
  const h = opts.h ?? 64;
  const halo = opts.halo ?? 12;
  const p = posAt(t);
  ctx.save();
  if (opts.trail ?? true) {
    const n = opts.trailFrames ?? 16;
    ctx.fillStyle = PALETTE.signal;
    for (let k = n; k >= 1; k--) {
      const q = posAt(t - k / FPS);
      if (Math.abs(q.x - p.x) < w / 2 + halo && Math.abs(q.y - p.y) < h / 2 + halo) continue;
      const s = Math.max(2, Math.round(12 * (1 - k / (n + 1))));
      ctx.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s / 2), s, s);
    }
  }
  const x = Math.round(p.x - w / 2);
  const y = Math.round(p.y - h / 2);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(x - halo, y - halo, w + halo * 2, h + halo * 2);
  ctx.fillStyle = PALETTE.signal;
  ctx.fillRect(x, y, w, h);
  if (opts.id) {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(x + 12, y + 12, w - 24, h - 24);
    drawText(ctx, opts.id, p.x, p.y - 18, { px: 36, align: 'center' });
  }
  ctx.restore();
}

/* ------------------------------------------------------------ router node */

export interface RouterNodeOpts {
  /** Deterministic block pattern seed (default derived from position). */
  seed?: number;
  /** Cluster size in cells (default 10×4 = 120×80 px). */
  cols?: number;
  rows?: number;
  /** 0..1 density pulse: lights extra blocks and thickens the ASCII halo. */
  pulse?: number;
  /** Label (glyph 36 inkDeep), e.g. '1 · 192.0.2.1'. */
  label?: string;
  /** Label top-left (default 60 px left of centre, 44 px below). */
  labelAt?: Point;
  /** Block colour (default ink). */
  color?: string;
  /** ASCII halo density in the `ascii` layer (default 0.28; 0 = none). Pass 0.5× for decorative bleed nodes. */
  halo?: number;
}

/**
 * Router: pixel-block glyph cluster on the 12×20 grid (crisp) with an ASCII density halo
 * (ascii layer) and an optional monospace IP label.
 */
export function routerNode(fc: FrameCtx, cx: number, cy: number, opts: RouterNodeOpts = {}): void {
  const cols = opts.cols ?? 10;
  const rows = opts.rows ?? 4;
  const seed = opts.seed ?? Math.round(cx * 7 + cy * 13);
  const pulse = Math.max(0, Math.min(1, opts.pulse ?? 0));
  const x0 = Math.round(cx - (cols * 12) / 2);
  const y0 = Math.round(cy - (rows * 20) / 2);
  const haloD = (opts.halo ?? 0.28) * (1 + pulse);
  if (haloD > 0) {
    const a = fc.ascii;
    a.save();
    a.fillStyle = asciiInk(Math.min(1, haloD));
    a.fillRect(x0 - 24, y0 - 20, cols * 12 + 48, rows * 20 + 40);
    a.fillStyle = asciiInk(Math.min(1, haloD * 1.8));
    a.fillRect(x0 - 12, y0, cols * 12 + 24, rows * 20);
    a.restore();
  }
  const c = fc.crisp;
  c.save();
  c.fillStyle = PALETTE.paper;
  c.fillRect(x0 - 4, y0 - 4, cols * 12 + 8, rows * 20 + 8);
  c.fillStyle = opts.color ?? PALETTE.ink;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const edge = i === 0 || j === 0 || i === cols - 1 || j === rows - 1;
      const on = edge ? hash01(seed, i, j) < 0.85 : hash01(seed, i, j, 1) < 0.35 + pulse * 0.5;
      if (on) c.fillRect(x0 + i * 12 + 1, y0 + j * 20 + 2, 10, 16);
    }
  }
  c.restore();
  if (opts.label) {
    const at = opts.labelAt ?? { x: cx - 60, y: cy + 44 };
    c.save();
    c.fillStyle = PALETTE.paper;
    c.font = '400 36px "IBM Plex Mono"';
    const w = c.measureText(opts.label).width;
    c.fillRect(at.x - 4, at.y, w + 8, 36);
    drawText(c, opts.label, at.x, at.y, { px: 36 });
    c.restore();
  }
}

/* ------------------------------------------------------------------- link */

export interface LinkOpts {
  /** 0..1: solid-filled fraction from `a` toward `b` (packet progress). Default 0. */
  fill?: number;
  /** 'idle' dotted ink, 'error' solid error red, 'dead' dotted paperShade. Default 'idle'. */
  state?: 'idle' | 'error' | 'dead';
  /** Stroke width (default 3). */
  width?: number;
  /** Dot pitch along the line (default 12). */
  pitch?: number;
  /** Colour override for idle/filled parts (default ink). */
  color?: string;
}

/** Network link: dotted when idle, filling solid from `a` as the packet travels. */
export function link(ctx: CanvasRenderingContext2D, a: Point, b: Point, opts: LinkOpts = {}): void {
  const state = opts.state ?? 'idle';
  const wdt = opts.width ?? 3;
  const pitch = opts.pitch ?? 12;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  const fill = state === 'error' ? 1 : Math.max(0, Math.min(1, opts.fill ?? 0));
  const color = state === 'error' ? PALETTE.error : state === 'dead' ? PALETTE.paperShade : (opts.color ?? PALETTE.ink);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = wdt;
  ctx.lineCap = 'butt';
  const fl = len * fill;
  if (fl > 0) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x + ux * fl, a.y + uy * fl);
    ctx.stroke();
  }
  const d = wdt + 1;
  for (let s = Math.ceil(fl / pitch) * pitch; s <= len; s += pitch) {
    ctx.fillRect(Math.round(a.x + ux * s - d / 2), Math.round(a.y + uy * s - d / 2), d, d);
  }
  ctx.restore();
}
