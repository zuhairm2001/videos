/**
 * S15 · Loop bridge, "because you hit—" (42.50–45.00 s, frames 1275–1349).
 * Scanline wipe (5 f) clears to the S01 layout while the satisfied guide ramps out (8 f); URL bar and
 * keycap scramble-resolve at 42.67 (empty, blinking cursor); `example.co` types at 43.40 (14 f);
 * the curious guide ramps back in (`.` 44.37, `+` 44.60, `#` 44.83 held to f1349).
 * Frame 1349 = S01 frame 0: same band, URL bar (px 52, cursor on), keycap up, guide at `#`.
 */
import {
  PALETTE,
  asciiInk,
  asciiRamp,
  cloudField,
  drawGuide,
  enterKey,
  font,
  framesSince,
  progress,
  scrambleChar,
  urlBar,
  type RampStage,
} from '../components';
import type { Scene } from '../engine/types';
import { PAYOFF, T } from './S13';

const WIPE = T(42.5);
const CHROME = T(42.67);
const TYPE = T(43.4);
const URL = 'example.co';
const PX = 52;
/** S01 layout. */
const BAR = { x: 120, y: 900, w: 468, h: 96 };
const KEY = { x: 612, y: 900, w: 168, h: 96 };
const GUIDE_BOX = { x: 120, y: 440, w: 408, h: 420 };
/** Guide re-entry stage frames: `.` 44.37, `+` 44.60, `#` 44.83 (held into S01 f0). */
const REENTRY: [number, RampStage][] = [
  [Math.round(44.83 * 30), '#'],
  [Math.round(44.6 * 30), '+'],
  [Math.round(44.37 * 30), '.'],
];

/** Cursor blink 15 f on / 15 f off, phased so frames 1335–1349 (and S01 0–14) are on. */
const cursorOn = (frame: number): boolean => (frame + 15) % 30 < 15;

const scene: Scene = {
  id: 'S15',
  start: 42.5,
  end: 45.0,
  draw(fc) {
    const { crisp, t, frame } = fc;

    // Scanline wipe top→bottom over 5 f (kept > 0 on the first frame).
    const kw = framesSince(WIPE, t);
    if (kw >= 0 && kw < 5) fc.fx.scanlineWipe = Math.max(0.02, progress(WIPE, t, 5));

    // Top ASCII bleed band, S01 params; time runs on into S01's t = 0 at the seam.
    cloudField(fc.ascii, { x: 0, y: 0, w: 1080, h: 270 }, t - 45, { seed: 3, density: 0.45 });

    // Satisfied guide ramps out (8 f) from 42.50.
    drawGuide(fc, 'satisfied', PAYOFF.guideBox, 0, WIPE, t);

    // URL bar + keycap scramble-resolve from 42.67 (8 f): ASCII ramp 4 f, then crisp chrome with
    // scramble glyphs clearing out of the text field over 4 f.
    const kc = framesSince(CHROME, t);
    if (kc >= 0 && kc < 4) {
      const { density } = asciiRamp((kc + 1) / 5);
      fc.ascii.fillStyle = asciiInk(density);
      fc.ascii.fillRect(BAR.x, BAR.y - 20, BAR.w, BAR.h + 20);
      fc.ascii.fillRect(KEY.x, KEY.y, KEY.w + 8, KEY.h + 8);
    } else if (kc >= 4) {
      const kt = framesSince(TYPE, t);
      let text = '';
      let cursor = cursorOn(frame);
      if (kt >= 0) {
        // `example.co` types in: 10 chars over 14 f; newest char scrambles on its first frame.
        const shown = Math.min(URL.length, Math.ceil((URL.length * (kt + 1)) / 14));
        text = URL.slice(0, shown);
        if (shown < URL.length) {
          text = text.slice(0, -1) + scrambleChar(URL, shown - 1, kt);
          cursor = true;
        }
      }
      urlBar(crisp, BAR, text, { px: PX, cursor });
      if (kc < 8) {
        const n = Math.round(URL.length * (1 - (kc - 3) / 4));
        const tx = BAR.x + 12 + Math.round(PX * 0.75) + 12;
        crisp.font = font('glyph', PX);
        crisp.fillStyle = PALETTE.inkDeep;
        crisp.textAlign = 'left';
        crisp.textBaseline = 'middle';
        const adv = crisp.measureText('M').width;
        for (let i = 0; i < n; i++) crisp.fillText(scrambleChar(URL, i, kc + 31), tx + i * adv, BAR.y + BAR.h / 2);
      }
      enterKey(crisp, KEY, 0);
    }

    // Curious guide ramps back in, holding `#` to f1349 (= S01 f0).
    const stage = REENTRY.find(([f]) => frame >= f)?.[1];
    if (stage) drawGuide(fc, 'curious', GUIDE_BOX, 0, Infinity, t, { stage });
  },
};
export default scene;
