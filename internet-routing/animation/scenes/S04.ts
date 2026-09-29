/**
 * S04 · 01 DNS, the answer (9.30–13.00 s, frames 279–389). Same layout as S03.
 * Name inverts, address scrambles and resolves, answer card rides the link up to the URL bar,
 * dig log panel types in over the cloud band, URL → IP, HUD lap at 12.90.
 * Transition out (scanline wipe at 13.00) is driven by S05 via fx.scanlineWipe.
 */
import { PALETTE, drawText, easeInOutCubic, font, framesSince, hash32, lerp, rampOut, scrambleText, tween, typeText } from '../components';
import type { Scene } from '../engine/types';
import {
  ADDR_Y,
  LINK_X,
  URL_SMALL,
  VALUE_X,
  drawCard,
  drawCloudBand,
  drawDnsFrame,
  drawDnsLink,
  drawResolver,
  drawUrl,
  rampBlock,
} from './S03';

const IP = '203.0.113.10';
const CARD_W = 12 * 28.8 + 24;
const CARD_H = 64;
const LOG_T0 = 11.75;
const LOG_LINES = ['example.com.  300  IN  A  203.0.113.10', ';; Query time: 12 msec', 'cached for 300 s'];

const scene: Scene = {
  id: 'S04',
  start: 9.3,
  end: 13.0,
  draw(fc) {
    const { crisp, t, frame } = fc;
    const f36 = font('glyph', 36);
    drawDnsFrame(fc);
    drawCloudBand(fc, LOG_T0);
    drawDnsLink(crisp, t, 1);

    drawResolver(fc, {
      // 9.55: name value inverts (paper on inkDeep)
      name: (ctx, x, y) => drawText(ctx, 'example.com', x, y, { px: 36, invert: t >= 9.55 }),
      address: (ctx, x, y) => {
        if (t < 10.3) drawText(ctx, '________', x, y, { px: 36 });
        else if (t < 11.1) {
          // 10.30: random digits in IPv4 shape, re-rolled on the 15 fps step
          const step = frame >> 1;
          const s = IP.replace(/\d/g, (_, i: number) => String(hash32(step, i, 404) % 10));
          drawText(ctx, s, x, y, { px: 36 });
        } else scrambleText(ctx, IP, x, y, f36, PALETTE.inkDeep, 11.1, t, 8); // resolves 8 f
      },
    });

    // 11.75: dig log panel types in over the cloud band (3 lines, 10 f each, staggered 4 f)
    if (framesSince(LOG_T0, t) >= 0) {
      crisp.fillStyle = PALETTE.paper;
      crisp.fillRect(120, 600, 840, 140);
      crisp.strokeStyle = PALETTE.ink;
      crisp.lineWidth = 3;
      crisp.strokeRect(121.5, 601.5, 837, 137);
      LOG_LINES.forEach((line, i) => typeText(crisp, line, 132, 610 + i * 46, f36, PALETTE.inkDeep, LOG_T0 + (i * 4) / 30, t, 10));
    }

    // 12.00: URL text scramble-resolves into the IP (10 f); spinner stops on the answer
    if (t < 12) drawUrl(fc, 'example.com', 12);
    else drawUrl(fc, IP, 12, { t0: 12, t, frames: 10 });

    // 11.35: answer card lifts from the address field and travels up the link to the URL bar (12 f);
    // docks 11.75 under the bar, dissolves into it as the URL resolves at 12.00
    if (t >= 11.35) {
      const u = tween(11.35, t, 12, easeInOutCubic);
      const x0 = VALUE_X - 12;
      const y0 = ADDR_Y - 14;
      const x1 = LINK_X - CARD_W / 2;
      const y1 = URL_SMALL.y + URL_SMALL.h + 16;
      const box = { x: Math.round(lerp(x0, x1, u)), y: Math.round(lerp(y0, y1, u)), w: CARD_W, h: CARD_H };
      const out = rampOut(12, t, 8);
      if (out >= 1) drawCard(crisp, box, IP);
      else rampBlock(fc, box, out);
    }
  },
};
export default scene;
