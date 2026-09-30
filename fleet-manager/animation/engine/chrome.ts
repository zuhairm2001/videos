/**
 * Always-on layers drawn by the engine before every scene: ground, idle dot field, chrome
 * (composition.md "Chrome", storyboard "Shared elements").
 */
import { font, GRID, H, MONO_ADVANCE, PALETTE, W } from '../config';
import { scramble, typeOn } from '../components/text';
import type { FrameCtx } from './types';

/** Spec-strip section text by scene id (storyboard "Shared elements"). */
export const SECTION_BY_SCENE: Record<string, string> = {
  S01: 'SPEC 00 / FLEET',
  S02: 'SPEC 00 / FLEET',
  S03: 'SPEC 00 / FLEET',
  S04: 'SPEC 01 / SAFE UPDATES',
  S05: 'SPEC 01 / SAFE UPDATES',
  S06: 'SPEC 02 / PLACEMENT',
  S07: 'SPEC 02 / PLACEMENT',
  S08: 'SPEC 03 / GOVERNANCE',
  S09: 'SPEC 03 / GOVERNANCE',
  S10: 'SPEC 04 / REACH',
  S11: 'SPEC 05 / GET STARTED',
};

const TITLE = 'AZURE KUBERNETES FLEET MANAGER';
const STRIP_PX = 18;
const STRIP_TRACK = 0.16;
const STRIP_ADV = STRIP_PX * (MONO_ADVANCE + STRIP_TRACK);
/** Line-box tops that put the 18 px mono baseline at y 60 / y 1040. */
const TOP_Y = 46;
const BOTTOM_Y = 1026;

/** 80×45 grid of 4 px `dotOff` dots at 12 + 24·i, pre-rendered once. */
export function makeDotField(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = PALETTE.dotOff;
  g.beginPath();
  for (let y = GRID / 2; y < H; y += GRID) {
    for (let x = GRID / 2; x < W; x += GRID) {
      g.moveTo(x + 2, y);
      g.arc(x, y, 2, 0, Math.PI * 2);
    }
  }
  g.fill();
  return c;
}

function crosshair(g: CanvasRenderingContext2D, cx: number, cy: number): void {
  g.fillRect(cx - 12, cy - 0.75, 24, 1.5);
  g.fillRect(cx - 0.75, cy - 12, 1.5, 24);
}

/**
 * Chrome: corner crosshairs, top spec strip (title + per-section `SPEC 0N / …`, typing on over
 * 0.00–0.40 and scrambling over 6 f at each later section start), bottom strip (`MM:SS:FF` +
 * frame counter, `[ FLEET ]`).
 * @param section spec text of the active section and the time it started
 */
export function drawChrome(fc: FrameCtx, section: { text: string; start: number }): void {
  const { g, t, frame } = fc;
  g.fillStyle = PALETTE.rule;
  crosshair(g, 48, 48);
  crosshair(g, W - 48, 48);
  crosshair(g, 48, H - 48);
  crosshair(g, W - 48, H - 48);

  const f = font('mono', STRIP_PX);
  const rightX = (s: string) => 1824 - (s.length * STRIP_ADV - STRIP_TRACK * STRIP_PX);
  if (section.start <= 0) {
    // film start: both halves type on over 12 f
    typeOn(fc, TITLE, 96, TOP_Y, f, PALETTE.mute, 0, t, (TITLE.length / 12) * 30, STRIP_TRACK);
    typeOn(fc, section.text, rightX(section.text), TOP_Y, f, PALETTE.mute, 0, t, (section.text.length / 12) * 30, STRIP_TRACK);
  } else {
    scramble(fc, TITLE, 96, TOP_Y, f, PALETTE.mute, -1, t, 6, STRIP_TRACK);
    scramble(fc, section.text, rightX(section.text), TOP_Y, f, PALETTE.mute, section.start, t, 6, STRIP_TRACK);
  }

  const ss = Math.floor(frame / 30);
  const ff = frame % 30;
  const mm = Math.floor(ss / 60);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const tc = `${pad(mm)}:${pad(ss % 60)}:${pad(ff)}   F ${pad(frame, 4)}`;
  scramble(fc, tc, 96, BOTTOM_Y, f, PALETTE.mute, -1, t, 0, STRIP_TRACK);
  const tag = '[ FLEET ]';
  scramble(fc, tag, rightX(tag), BOTTOM_Y, f, PALETTE.mute, -1, t, 0, STRIP_TRACK);
}
