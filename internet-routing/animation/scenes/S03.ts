/**
 * S03 · 01 DNS, the ask (5.50–9.30 s, frames 165–278).
 * Header `01 dns` slam, HUD, URL bar shrinks to the top, skyTint cloud band, resolver terminal,
 * query card travels down the link and docks. Layout helpers are shared with S04.
 */
import {
  PALETTE,
  asciiColor,
  asciiRamp,
  cloudField,
  drawText,
  easeInOutCubic,
  easeInOutQuart,
  enterKey,
  font,
  framesSince,
  hudStopwatch,
  lerp,
  link,
  progress,
  rampDensity,
  rampIn,
  rampOut,
  scrambleText,
  sectionHeader,
  tween,
  typeText,
  urlBar,
  type Box,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';
import { KEY_BOX, SPINNER_X, URL_BOX, URL_PX, spinnerStep } from './S01';

export const SHRINK_T0 = 6.0;
export const TERM_T0 = 6.0;
/** Shrunk URL bar (S03–S04). */
export const URL_SMALL: Box = { x: 120, y: 440, w: 468, h: 80 };
export const LINK_X = 354;
export const LINK_TOP = 520;
export const LINK_BOTTOM = 760;
export const TERM: Box = { x: 120, y: 760, w: 660, h: 280 };
/** Field values start after `address: ` (9 cells of 21.6 px) from the label x 144. */
export const FIELD_X = 144;
export const VALUE_X = 144 + 9 * 21.6;
export const NAME_Y = 830;
export const ADDR_Y = 880;
export const BLANK = '________';
const CARD_W = 456;
const CARD_H = 64;
export const CARD_TOP0 = 536;
export const CARD_DOCK = 690;

/** Shared S03/S04 state: section header, HUD, cloud band tint. Call first. */
export function drawDnsFrame(fc: FrameCtx): void {
  const { crisp, t } = fc;
  fc.fx.asciiTint = PALETTE.skyTint;
  sectionHeader(crisp, '01', 'dns', 5.5, t);
  // hudValueAt quantises to the 15 fps step (frame 387 → 011); the 12.90 lap must land on 012.
  hudStopwatch(crisp, t, framesSince(12.9, t) >= 0 ? { value: 12 } : {});
}

/** skyTint dither-cloud band x 120–960, y 560–740 (ramps in from 6.00, out from `outT`). */
export function drawCloudBand(fc: FrameCtx, outT: number): void {
  const { t } = fc;
  const p = Math.min(rampIn(TERM_T0, t, 8), rampOut(outT, t, 8));
  if (p < 0) return;
  const d = asciiRamp(p).density;
  if (d <= 0) return;
  cloudField(fc.ascii, { x: 120, y: 560, w: 840, h: 180 }, t, { seed: 21, density: 0.5 * d, threshold: 0.4, scale: 160 });
}

/** URL bar: S01 bar shrinks/moves to URL_SMALL from 6.00 (12 f, easeInOutQuart); spinner until `spinUntil`. */
export function drawUrl(fc: FrameCtx, text: string, spinUntil: number, scramble?: { t0: number; t: number; frames?: number }): void {
  const { t } = fc;
  const u = tween(SHRINK_T0, t, 12, easeInOutQuart);
  const box = {
    x: 120,
    y: Math.round(lerp(URL_BOX.y, URL_SMALL.y, u)),
    w: 468,
    h: Math.round(lerp(URL_BOX.h, URL_SMALL.h, u)),
  };
  urlBar(fc.crisp, box, text, {
    px: Math.round(lerp(URL_PX, 48, u)),
    spinner: t < spinUntil ? spinnerStep(t) : undefined,
    spinnerX: SPINNER_X,
    scramble,
  });
}

/** Vertical dotted link (354, 520)→(354, 760), growing with the terminal type-in; `fill` 0..1 solid from the top. */
export function drawDnsLink(ctx: CanvasRenderingContext2D, t: number, fill: number): void {
  const g = progress(TERM_T0, t, 12);
  if (g <= 0) return;
  link(ctx, { x: LINK_X, y: LINK_TOP }, { x: LINK_X, y: lerp(LINK_TOP, LINK_BOTTOM, g) }, { fill });
}

export interface TermOpts {
  /** Title bar inverted (paper bar, inkDeep text). */
  titleInvert?: boolean;
  /** Draw the `name:` value (default: blank). */
  name?: (ctx: CanvasRenderingContext2D, x: number, y: number) => void;
  address?: (ctx: CanvasRenderingContext2D, x: number, y: number) => void;
}

/** Resolver terminal (Minitel directory) x 120–780, y 760–1040; types in over 12 f from 6.00. */
export function drawResolver(fc: FrameCtx, opts: TermOpts = {}): void {
  const { crisp, ascii, t } = fc;
  const k = framesSince(TERM_T0, t);
  if (k < 0) return;
  const { x, y, w, h } = TERM;
  // frame reveals top→bottom in 20 px rows over 12 f
  const hh = Math.min(h, Math.ceil(((k + 1) / 12) * (h / 20)) * 20);
  crisp.save();
  crisp.fillStyle = PALETTE.paper;
  crisp.fillRect(x, y, w, hh);
  crisp.strokeStyle = PALETTE.ink;
  crisp.lineWidth = 3;
  crisp.strokeRect(x + 1.5, y + 1.5, w - 3, hh - 3);
  crisp.restore();
  // title bar (36 px, paper on inkDeep) — Minitel directory header
  crisp.fillStyle = opts.titleInvert ? PALETTE.paper : PALETTE.inkDeep;
  crisp.fillRect(x, y, w, 40);
  if (opts.titleInvert) {
    crisp.strokeStyle = PALETTE.inkDeep;
    crisp.lineWidth = 3;
    crisp.strokeRect(x + 1.5, y + 1.5, w - 3, 37);
  }
  const titleColor = opts.titleInvert ? PALETTE.inkDeep : PALETTE.paper;
  typeText(crisp, 'resolver · 198.51.100.53', x + 16, y + 2, font('glyph', 36), titleColor, TERM_T0, t, 8);
  const f36 = font('glyph', 36);
  typeText(crisp, 'name:', FIELD_X, NAME_Y, f36, PALETTE.inkDeep, TERM_T0 + 4 / 30, t, 4);
  typeText(crisp, 'address:', FIELD_X, ADDR_Y, f36, PALETTE.inkDeep, TERM_T0 + 6 / 30, t, 5);
  if (opts.name) opts.name(crisp, VALUE_X, NAME_Y);
  else typeText(crisp, BLANK, VALUE_X, NAME_Y, f36, PALETTE.inkDeep, TERM_T0 + 7 / 30, t, 5);
  if (opts.address) opts.address(crisp, VALUE_X, ADDR_Y);
  else typeText(crisp, BLANK, VALUE_X, ADDR_Y, f36, PALETTE.inkDeep, TERM_T0 + 8 / 30, t, 4);
  // resolver screen texture: faint ink ':' / '.' rows in the empty lower screen (ascii layer)
  if (k >= 12) {
    ascii.fillStyle = asciiColor(PALETTE.ink, rampDensity('.'));
    for (let ry = 940; ry < 1020; ry += 40) ascii.fillRect(x + 24, ry, w - 48, 20);
    ascii.fillStyle = asciiColor(PALETTE.ink, rampDensity(':'));
    ascii.fillRect(x + 24, 1000, 12 * 8, 20);
  }
}

/** Card on a paper plate with a 3 px ink border, glyph 48 inkDeep text. */
export function drawCard(ctx: CanvasRenderingContext2D, box: Box, text: string, scramble?: { t0: number; t: number; frames: number }): void {
  ctx.save();
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x + 1.5, box.y + 1.5, box.w - 3, box.h - 3);
  ctx.restore();
  const ty = box.y + (box.h - 48) / 2;
  if (scramble) scrambleText(ctx, text, box.x + 12, ty, font('glyph', 48), PALETTE.inkDeep, scramble.t0, scramble.t, scramble.frames);
  else drawText(ctx, text, box.x + 12, ty, { px: 48 });
}

/** ASCII-ramp ghost of a box (ink glyph block) for ramp entrances/exits of crisp UI. */
export function rampBlock(fc: FrameCtx, box: Box, p: number): void {
  if (p < 0 || p >= 1) return;
  const d = asciiRamp(p).density;
  if (d <= 0) return;
  fc.ascii.fillStyle = asciiColor(PALETTE.ink, d);
  fc.ascii.fillRect(box.x, box.y, box.w, box.h);
}

const scene: Scene = {
  id: 'S03',
  start: 5.5,
  end: 9.3,
  draw(fc) {
    const { crisp, t } = fc;
    drawDnsFrame(fc);
    drawCloudBand(fc, Infinity);

    // keycap from S01/S02 dissolves out as the URL bar shrinks
    const kOut = rampOut(SHRINK_T0, t, 8);
    if (kOut >= 1) enterKey(crisp, KEY_BOX, 0);
    else rampBlock(fc, KEY_BOX, kOut);

    // link: fills solid behind the card as it travels (7.55, 12 f)
    const travel = tween(7.55, t, 12, easeInOutCubic);
    const cardTop = lerp(CARD_TOP0, CARD_DOCK, travel);
    const fill = travel > 0 ? (cardTop - LINK_TOP) / (LINK_BOTTOM - LINK_TOP) : 0;
    drawDnsLink(crisp, t, fill);

    // 7.95: card docks → title bar inverts 2 f; 8.70: name value scramble-resolves (8 f)
    const dk = framesSince(7.95, t);
    drawResolver(fc, {
      titleInvert: dk >= 0 && dk < 2,
      name:
        t >= 8.7
          ? (ctx, x, y) => scrambleText(ctx, 'example.com', x, y, font('glyph', 36), PALETTE.inkDeep, 8.7, t, 8)
          : undefined,
    });

    drawUrl(fc, 'example.com', Infinity);

    // 6.75: query card scramble-resolves out of the URL bar; docks at 7.95; dissolves into the name field at 8.70
    if (framesSince(6.75, t) >= 0) {
      const box = { x: LINK_X - CARD_W / 2, y: Math.round(cardTop), w: CARD_W, h: CARD_H };
      const out = rampOut(8.7, t, 8);
      if (out >= 1) drawCard(crisp, box, 'example.com A ?', { t0: 6.75, t, frames: 8 });
      else rampBlock(fc, box, out);
    }
  },
};
export default scene;
