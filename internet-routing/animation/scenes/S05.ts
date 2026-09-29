/**
 * S05 — 02 Packets, "Data travels in small packets" (13.00–15.10 s, frames 390–452).
 * Also exports the B3 request-card helpers reused by S06/S07 (all functions of global time).
 */
import {
  PALETTE,
  asciiInk,
  asciiRamp,
  drawText,
  easeInOutCubic,
  easeOutBack,
  font,
  framesSince,
  hudStopwatch,
  lerp,
  progress,
  rampDensity,
  rampOut,
  scrambleText,
  sectionHeader,
  trackedPacket,
  tween,
  typeText,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';

/** Snap an event time to its frame (storyboard: frame = round(t × 30)). */
export const ev = (t: number): number => Math.round(t * 30) / 30;

/* ------------------------------------------------------------ B3 events */
export const B3 = {
  wipe: ev(13.0),
  type: ev(13.17),
  snap: ev(13.6),
  strip: ev(14.26),
  size: ev(14.5),
  settle: ev(14.95),
  compress: ev(15.15),
  ruler: ev(15.6),
  onePacket: ev(16.05),
  collapse: ev(16.98),
  clear: ev(17.2),
} as const;

/** Final tracked request block after the S06 collapse (144×96 at x 468–612, y 592–688). */
export const REQ_BLOCK = { cx: 540, cy: 640, w: 144, h: 96 } as const;

const FULL = { x: 150, y: 520, w: 600, h: 200 };
const COMPACT = { x: 360, y: 560, w: 360, h: 160 };
const REQ_LINES = ['GET / HTTP/2', 'host: example.com'];
const STRIP_TEXT = '192.0.2.23 → 203.0.113.10 · ttl 64';

/** Paint an ASCII ramp-out (density block) over a box: `@ # + .` over `frames`. */
export function asciiOut(fc: FrameCtx, box: { x: number; y: number; w: number; h: number }, t0: number, t: number, frames = 4): void {
  const k = framesSince(t0, t);
  if (k < 0 || k >= frames) return;
  const r = asciiRamp(rampOut(t0, t, frames));
  if (r.density <= 0) return;
  fc.ascii.fillStyle = asciiInk(r.density);
  fc.ascii.fillRect(box.x, box.y, box.w, box.h);
}

/** Pixel-block ring in hero cells (asciiHero, snapped to the 24×40 hero grid) + crisp 3 px ink edge. */
function heroRing(fc: FrameCtx, x: number, y: number, w: number, h: number): void {
  const x0 = Math.round(x / 24) * 24;
  const x1 = Math.round((x + w) / 24) * 24;
  const y0 = Math.round(y / 40) * 40;
  const y1 = Math.round((y + h) / 40) * 40;
  const a = fc.asciiHero;
  a.fillStyle = asciiInk(rampDensity('#'));
  a.fillRect(x0, y0, x1 - x0, 40);
  a.fillRect(x0, y1 - 40, x1 - x0, 40);
  a.fillRect(x0, y0 + 40, 24, y1 - y0 - 80);
  a.fillRect(x1 - 24, y0 + 40, 24, y1 - y0 - 80);
  const c = fc.crisp;
  c.strokeStyle = PALETTE.ink;
  c.lineWidth = 3;
  c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

/** 14.95 settle: 1-cell drop for 2 f, then back. */
function settleDy(t: number): number {
  const k = framesSince(B3.settle, t);
  return k === 0 || k === 1 ? 20 : 0;
}

/**
 * The request card across S05–S06: text scramble (13.17), frame snap (13.60), compress (15.15),
 * collapse into the tracked request block (16.98). Draws nothing for the block once collapsed
 * (callers draw the tracked packet).
 */
export function drawRequestCard(fc: FrameCtx, t: number): void {
  const c = fc.crisp;
  const dy = settleDy(t);
  const kCol = framesSince(B3.collapse, t);
  const u = tween(B3.compress, t, 12, easeInOutCubic);
  const bx = lerp(FULL.x, COMPACT.x, u);
  const by = lerp(FULL.y, COMPACT.y, u) + dy;
  const bw = lerp(FULL.w, COMPACT.w, u);
  const bh = lerp(FULL.h, COMPACT.h, u);
  const sc = lerp(1, 0.6, u);
  const tx = bx + lerp(30, 33, u);
  const ty = [lerp(40, 48, u), lerp(100, 84, u)];

  if (kCol < 0) {
    // Frame snap: 4 f in + 2 f overshoot (easeOutBack), around the card centre.
    const kSnap = framesSince(B3.snap, t);
    if (kSnap >= 0) {
      const s = lerp(1.3, 1, easeOutBack(progress(B3.snap, t, 6), 2.2));
      const w = bw * s;
      const h = bh * s;
      heroRing(fc, bx + bw / 2 - w / 2, by + bh / 2 - h / 2, w, h);
    }
    const px = 48 * sc;
    REQ_LINES.forEach((line, i) => scrambleText(c, line, tx, by + ty[i], font('glyph', Math.round(px * 10) / 10), PALETTE.inkDeep, B3.type, t, 8));
    return;
  }
  // Collapse: body text ramps out in ASCII (4 f); block shrinks to the signal packet (2 f).
  REQ_LINES.forEach((line, i) => asciiOut(fc, { x: tx, y: by + ty[i], w: line.length * 28.8 * sc, h: 48 * sc }, B3.collapse, t, 4));
  if (kCol < 2) {
    const v = (kCol + 1) / 2;
    const w = lerp(bw, REQ_BLOCK.w, v);
    const h = lerp(bh, REQ_BLOCK.h, v);
    c.fillStyle = PALETTE.paper;
    c.fillRect(REQ_BLOCK.cx - w / 2 - 12, REQ_BLOCK.cy - h / 2 - 12, w + 24, h + 24);
    c.fillStyle = PALETTE.signal;
    c.fillRect(REQ_BLOCK.cx - w / 2, REQ_BLOCK.cy - h / 2, w, h);
  } else {
    trackedPacket(c, () => ({ x: REQ_BLOCK.cx, y: REQ_BLOCK.cy }), t, { w: REQ_BLOCK.w, h: REQ_BLOCK.h, trail: false });
  }
}

/** ASCII ruler texture x 150–750 on the cell row y 800–820, typed left→right. */
function ruler(fc: FrameCtx, t: number): void {
  const k = framesSince(B3.size, t);
  if (k < 0) return;
  const cells = 50;
  const shown = Math.min(cells, Math.ceil((cells * (k + 1)) / 8));
  const a = fc.ascii;
  for (let i = 0; i < shown; i++) {
    const tick = i % 5 === 0;
    a.fillStyle = asciiInk(rampDensity(tick ? '#' : '-'));
    a.fillRect(150 + i * 12, 800, 12, 20);
  }
}

/**
 * Header strip, size label and ruler (S05), `100 B` / ruler fill / `= 1 packet` (S06).
 * All ramp out at 17.20 (S07 clears the stage for the page).
 */
export function drawCardLabels(fc: FrameCtx, t: number): void {
  const c = fc.crisp;
  const kClear = framesSince(B3.clear, t);
  const clearing = kClear >= 0;
  const stripBox = { x: 150, y: 470, w: 756, h: 36 };
  // Header strip: stamps down from y 430 (4 f).
  const kStrip = framesSince(B3.strip, t);
  if (kStrip >= 0) {
    if (!clearing) {
      const y = lerp(430, 470, progress(B3.strip, t, 4) ** 2) + settleDy(t);
      c.fillStyle = PALETTE.paper;
      c.fillRect(stripBox.x - 6, y - 4, stripBox.w + 12, 44);
      c.strokeStyle = PALETTE.ink;
      c.lineWidth = 2;
      c.strokeRect(stripBox.x - 5, y - 3, stripBox.w + 10, 42);
      drawText(c, STRIP_TEXT, 150, y, { px: 36 });
    } else asciiOut(fc, stripBox, B3.clear, t);
  }
  // Size label (S05) → replaced by `100 B` at 15.60.
  const kRuler = framesSince(B3.ruler, t);
  if (kRuler < 0) typeText(c, 'max ≈ 1500 B per packet', 150, 740, font('glyph', 36), PALETTE.inkDeep, B3.size, t, 8);
  else if (!clearing) typeText(c, '100 B', 150, 730, font('display', 48), PALETTE.inkDeep, B3.ruler, t, 8);
  else asciiOut(fc, { x: 150, y: 730, w: 144, h: 48 }, B3.clear, t);
  if (!clearing) {
    ruler(fc, t);
    if (kRuler >= 0) {
      // 100/1500 of 600 px = 40 px ink fill, stepping in over 6 f.
      const w = Math.round(40 * progress(B3.ruler, t, 6) / 4) * 4;
      c.fillStyle = PALETTE.ink;
      c.fillRect(150, 790, Math.max(4, w), 20);
    }
    scrambleText(c, '= 1 packet', 150, 820, font('display', 48), PALETTE.inkDeep, B3.onePacket, t, 8);
  } else {
    asciiOut(fc, { x: 150, y: 790, w: 600, h: 30 }, B3.clear, t);
    asciiOut(fc, { x: 150, y: 820, w: 288, h: 48 }, B3.clear, t);
  }
}

/** '02 packets' typed header, drawn every B3 frame. */
export function drawB3Header(fc: FrameCtx, t: number, dy = 0): void {
  fc.crisp.save();
  fc.crisp.translate(0, dy);
  sectionHeader(fc.crisp, '02', 'packets', B3.type, t, { mode: 'typed' });
  fc.crisp.restore();
}

const scene: Scene = {
  id: 'S05',
  start: 13.0,
  end: 15.1,
  draw(fc) {
    const t = fc.t;
    // Scanline wipe in (5 f), > 0 on the first frame.
    const kw = framesSince(B3.wipe, t);
    if (kw >= 0 && kw < 5) fc.fx.scanlineWipe = (kw + 1) / 6;
    drawB3Header(fc, t);
    drawCardLabels(fc, t);
    drawRequestCard(fc, t);
    hudStopwatch(fc.crisp, t);
  },
};
export default scene;
