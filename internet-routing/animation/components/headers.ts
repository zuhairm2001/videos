/**
 * Header components: section number + label, and the HUD stopwatch.
 */
import { FPS, PALETTE, font } from '../config';
import { easeOutBack, framesSince, keyframes, lerp, progress } from './easing';
import { scrambleText, typeText } from './scramble';
import { drawText } from './text';

export interface SectionHeaderOpts {
  /** 'slam' (01, 03): number scales in over 4 f + 2 f overshoot (easeOutBack), label scrambles 8 f.
   *  'typed' (02, 04): number and label type in over 10 f. Default 'slam'. */
  mode?: 'slam' | 'typed';
  /** Hide (e.g. after the header clears). */
  hidden?: boolean;
}

/**
 * Section header per storyboard: number in display 96 px ink at x 120–235, y 290–386;
 * label in display 64 px inkDeep from x 260, y 306–370.
 * @param num e.g. '01'
 * @param label e.g. 'dns'
 * @param t0 event time (s) of the slam/typing, same timebase as `t`
 */
export function sectionHeader(ctx: CanvasRenderingContext2D, num: string, label: string, t0: number, t: number, opts: SectionHeaderOpts = {}): void {
  if (opts.hidden) return;
  const k = framesSince(t0, t);
  if (k < 0) return;
  const numFont = font('display', 96);
  if ((opts.mode ?? 'slam') === 'slam') {
    // 6 frames total: in over 4 (overshoot below 1 at ~f4), settle by f6.
    const s = lerp(2.6, 1, easeOutBack(progress(t0, t, 6), 2.2));
    ctx.save();
    ctx.translate(120 + 57.5, 290 + 48);
    ctx.scale(s, s);
    drawText(ctx, num, -57.5, -48, { role: 'display', px: 96, color: PALETTE.ink });
    ctx.restore();
    scrambleText(ctx, label, 260, 306, font('display', 64), PALETTE.inkDeep, t0, t, 8);
  } else {
    typeText(ctx, num, 120, 290, numFont, PALETTE.ink, t0, t, 4);
    typeText(ctx, label, 260, 306, font('display', 64), PALETTE.inkDeep, t0 + 2 / FPS, t, 8);
  }
}

/* ------------------------------------------------------------------ HUD */

/** HUD value keys [t, ms] (storyboard per-shot HUD ranges; S10 starts 28.80). */
export const HUD_VALUE_KEYS: readonly (readonly [number, number])[] = [
  [5.5, 0],
  [9.3, 5],
  [12.9, 12],
  [13.0, 12],
  [15.1, 16],
  [17.1, 16],
  [20.0, 29],
  [24.3, 30],
  [28.8, 31],
  [31.6, 33],
  [36.95, 38],
];

/** HUD phase label for global time t. */
export function hudPhaseAt(t: number): string {
  if (t < 13) return 'dns';
  if (t < 20) return 'handshake';
  if (t < 31.6) return 'request';
  return 'reply';
}

/** Displayed HUD milliseconds at global time t (ticks at 15 fps, freezes at 038 from 36.95). */
export function hudValueAt(t: number): number {
  const tq = Math.floor(t * FPS / 2) * 2 / FPS;
  return Math.floor(keyframes(HUD_VALUE_KEYS, tq) + 1e-6);
}

export interface HudOpts {
  /** Override the value (ms). */
  value?: number;
  /** Override the row-3 phase label. */
  label?: string;
  /** Invert the row-3 label (paper on inkDeep). Default: 4 f from 12.90 (dns lap) and from 36.95 ('first reply'). */
  invertLabel?: boolean;
  /** Row-2 digit size in px (default 48, grows to 72 over 6 f from 36.95). */
  digitsPx?: number;
  /** Row-2 digit colour (default inkDeep; signal from 36.95). */
  digitsColor?: string;
  /** Translate the whole HUD (e.g. S02 fly-in / S13 push-in). */
  dx?: number;
  dy?: number;
  scale?: number;
}

/**
 * HUD stopwatch (S03–S12), top-right paper plate x 640–960, y 280–420:
 * row 1 `t · slow-mo` (glyph 36), row 2 `000 ms` (display 48), row 3 phase label (glyph 36).
 * Defaults follow the storyboard HUD table from global time `t`; use opts to override.
 */
export function hudStopwatch(ctx: CanvasRenderingContext2D, t: number, opts: HudOpts = {}): void {
  const frozen = t >= 36.95;
  const grow = frozen ? progress(36.95, t, 6) : 0;
  const value = opts.value ?? hudValueAt(t);
  const label = opts.label ?? (frozen ? 'first reply' : hudPhaseAt(t));
  const lapK = framesSince(12.9, t);
  const invert = opts.invertLabel ?? ((lapK >= 0 && lapK < 4) || frozen);
  const dpx = opts.digitsPx ?? Math.round(lerp(48, 72, grow));
  const dcol = opts.digitsColor ?? (frozen ? PALETTE.signal : PALETTE.inkDeep);

  ctx.save();
  const s = opts.scale ?? 1;
  ctx.translate(640 + (opts.dx ?? 0), 280 + (opts.dy ?? 0));
  ctx.scale(s, s);
  const plateH = 140 + (dpx - 48);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, 320, plateH);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 317, plateH - 3);
  drawText(ctx, 't · slow-mo', 16, 4, { px: 36 });
  drawText(ctx, `${String(Math.max(0, Math.min(999, value))).padStart(3, '0')} ms`, 16, 46, { role: 'display', px: dpx, color: dcol });
  drawText(ctx, label, 16, 100 + (dpx - 48), { px: 36, invert, pad: 4 });
  ctx.restore();
}
