/**
 * S07 — 02 Packets, "about thirteen" (17.10–20.00 s, frames 513–599).
 * Request block slides left, ghost page slices into 13 reply cards, counter, camera tilt down.
 */
import {
  PALETTE,
  asciiInk,
  easeInOutCubic,
  easeInOutQuart,
  font,
  framesSince,
  hash01,
  hudStopwatch,
  lerp,
  packetCard,
  progress,
  rampDensity,
  scrambleText,
  snapX,
  snapY,
  trackedPacket,
  tween,
  typeText,
} from '../components';
import type { FrameCtx, Scene } from '../engine/types';
import { REQ_BLOCK, asciiOut, drawB3Header, drawCardLabels, ev } from './S05';

const E = {
  slide: ev(17.2),
  slice: ev(18.26),
  fold: ev(18.9),
  counter: ev(19.14),
  tilt: ev(19.2),
  dissolve: ev(19.55),
} as const;

const PAGE = { x: 480, y: 490, w: 480, h: 340 };
const STRIP_H = PAGE.h / 13;
const CARD_X = [530, 678, 826];
const CARD_Y = [500, 550, 600, 650, 700];
/** Camera tilt: world scrolls up 240 px; the request block drops to screen y 900. */
const TILT = 240;
const REQ_END = { x: 204, y: 648 };

const tiltU = (t: number): number => tween(E.tilt, t, 24, easeInOutQuart);

function reqPos(t: number): { x: number; y: number } {
  const u = tween(E.slide, t, 12, easeInOutCubic);
  return {
    x: snapX(lerp(REQ_BLOCK.cx, REQ_END.x, u)),
    y: lerp(REQ_BLOCK.cy, REQ_END.y, u) + (900 - REQ_END.y) * tiltU(t),
  };
}

/** Frame (since E.slice) at which cut i (1..12) is made: 1.5 f apart so all 12 cuts land before the 18.90 fold. */
const cutFrame = (i: number): number => Math.round(i * 1.5);

function ghostPage(fc: FrameCtx, t: number): void {
  const c = fc.crisp;
  const kSlice = framesSince(E.slice, t);
  // ASCII text-line texture: ramps in with the outline, out at the fold.
  const kFold = framesSince(E.fold, t);
  const texIn = progress(E.slide + 4 / 30, t, 6);
  if (kFold < 0 && texIn > 0) {
    fc.ascii.fillStyle = asciiInk(rampDensity(texIn < 0.5 ? '.' : '='));
    for (let j = 0; j < 14; j++) {
      const y = 520 + j * 20;
      if (j % 2 === 1) continue;
      const len = Math.round((180 + hash01(71, j) * 240) / 12) * 12;
      fc.ascii.fillRect(504, y, len, 20);
    }
  } else if (kFold >= 0) {
    for (let j = 0; j < 14; j += 2) {
      const len = Math.round((180 + hash01(71, j) * 240) / 12) * 12;
      asciiOut(fc, { x: 504, y: 520 + j * 20, w: len, h: 20 }, E.fold, t, 4);
    }
  }
  if (kSlice < 0) {
    // Dotted outline drawn around the perimeter over 10 f.
    const per = 2 * (PAGE.w + PAGE.h);
    const shown = per * progress(E.slide, t, 10);
    c.fillStyle = PALETTE.ink;
    for (let s = 0; s <= shown; s += 12) {
      let x: number;
      let y: number;
      if (s < PAGE.w) [x, y] = [PAGE.x + s, PAGE.y];
      else if (s < PAGE.w + PAGE.h) [x, y] = [PAGE.x + PAGE.w, PAGE.y + s - PAGE.w];
      else if (s < 2 * PAGE.w + PAGE.h) [x, y] = [PAGE.x + PAGE.w - (s - PAGE.w - PAGE.h), PAGE.y + PAGE.h];
      else [x, y] = [PAGE.x, PAGE.y + PAGE.h - (s - 2 * PAGE.w - PAGE.h)];
      c.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
    }
    return;
  }
  if (kFold >= 0) return;
  // Slicing: segments between made cuts; single freed strips jog ±6 px.
  const made = (i: number): boolean => i === 0 || i === 13 || kSlice >= cutFrame(i);
  let top = 0;
  for (let i = 1; i <= 13; i++) {
    if (!made(i)) continue;
    const single = i - top === 1;
    const dx = single ? (top % 2 === 0 ? -6 : 6) : 0;
    const y0 = PAGE.y + top * STRIP_H + (top > 0 ? 2 : 0);
    const y1 = PAGE.y + i * STRIP_H - (i < 13 ? 2 : 0);
    c.strokeStyle = PALETTE.ink;
    c.lineWidth = 2;
    c.strokeRect(PAGE.x + dx + 1, Math.round(y0) + 1, PAGE.w - 2, Math.round(y1 - y0) - 2);
    top = i;
  }
}

function cardBox(i: number): { x: number; y: number; w: number; h: number } {
  return { x: CARD_X[i % 3], y: CARD_Y[Math.floor(i / 3)], w: 130, h: 40 };
}

function replyCards(fc: FrameCtx, t: number): void {
  const kFold = framesSince(E.fold, t);
  if (kFold < 0) return;
  const kDis = framesSince(E.dissolve, t);
  if (kDis >= 0) {
    const stage = kDis < 2 ? '@' : kDis < 4 ? '#' : kDis < 6 ? '+' : '.';
    fc.ascii.fillStyle = asciiInk(rampDensity(stage));
    for (let i = 0; i < 13; i++) {
      const b = cardBox(i);
      fc.ascii.fillRect(b.x, b.y, b.w, b.h);
    }
    return;
  }
  const u = easeInOutCubic(progress(E.fold, t, 6));
  for (let i = 0; i < 13; i++) {
    const to = cardBox(i);
    const dx = i % 2 === 0 ? -6 : 6;
    const from = { x: PAGE.x + dx, y: PAGE.y + i * STRIP_H + 2, w: PAGE.w, h: STRIP_H - 4 };
    if (u < 1) {
      packetCard(fc.crisp, {
        x: snapX(lerp(from.x, to.x, u)),
        y: snapY(lerp(from.y, to.y, u)),
        w: Math.round(lerp(from.w, to.w, u)),
        h: Math.round(lerp(from.h, to.h, u)),
      });
    } else {
      packetCard(fc.crisp, to);
      const id = `#${String(i + 1).padStart(2, '0')}/13`;
      scrambleText(fc.crisp, id, to.x + 1, to.y + 2, font('glyph', 36), PALETTE.inkDeep, E.fold + 6 / 30, t, 4);
    }
  }
}

const scene: Scene = {
  id: 'S07',
  start: 17.1,
  end: 20.0,
  draw(fc) {
    const t = fc.t;
    const c = fc.crisp;
    const dy = -Math.round(TILT * tiltU(t));
    c.save();
    fc.ascii.save();
    c.translate(0, dy);
    fc.ascii.translate(0, dy);
    drawB3Header(fc, t);
    drawCardLabels(fc, t);
    typeText(c, 'index.html · 18 KB (typical)', 355, 440, font('glyph', 36), PALETTE.inkDeep, E.slide, t, 10);
    ghostPage(fc, t);
    replyCards(fc, t);
    scrambleText(c, '13 packets · 18,431 B', 355, 760, font('display', 48), PALETTE.inkDeep, E.counter, t, 10);
    c.restore();
    fc.ascii.restore();
    trackedPacket(c, reqPos, t, { w: REQ_BLOCK.w, h: REQ_BLOCK.h });
    hudStopwatch(c, t);
  },
};
export default scene;
