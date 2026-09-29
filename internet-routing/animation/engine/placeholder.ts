/**
 * Placeholder scenes: draw the scene id + beat label centred, plus a light component demo so the
 * pipeline runs end-to-end before the real scene modules land. Replaced by animation/scenes/SNN.ts.
 */
import { PALETTE, font } from '../config';
import { asciiInk, drawText } from '../components/text';
import { cloudField } from '../components/texture';
import { drawGuide } from '../components/guide';
import { enterKey, urlBar } from '../components/terminal-chrome';
import { hudStopwatch, sectionHeader } from '../components/headers';
import { link, routerNode, trackedPacket } from '../components/network';
import { progress } from '../components/easing';
import { rampDensity } from '../components/ascii-ramp';
import { scrambleText } from '../components/scramble';
import type { Pose, Scene } from './types';

const GUIDE: Record<string, Pose> = { S01: 'curious', S02: 'pointing', S13: 'surprised', S14: 'satisfied', S15: 'curious' };
const HEADERS: Record<string, [string, string, 'slam' | 'typed']> = {
  S03: ['01', 'dns', 'slam'],
  S05: ['02', 'packets', 'typed'],
  S08: ['03', 'routing', 'slam'],
  S11: ['04', 'arrival', 'typed'],
};

export function makePlaceholderScene(id: string, beat: string, start: number, end: number): Scene {
  const n = Number(id.slice(1));
  return {
    id,
    start,
    end,
    draw(fc, lt) {
      const { crisp, ascii, t } = fc;
      // decorative dither band across the top bleed
      cloudField(ascii, { x: 0, y: 0, w: 1080, h: 270 }, t, { seed: 3, density: 0.7 });
      // ASCII density ramp strip (one cell per ramp level, 3 cells wide)
      for (let i = 1; i < 10; i++) {
        ascii.fillStyle = asciiInk(rampDensity(' .:-=+*#%@'[i]));
        ascii.fillRect(120 + i * 36, 1280, 36, 60);
      }
      scrambleText(crisp, id, 540 - 180, 1380, font('display', 120), PALETTE.inkDeep, start, t, 10);
      drawText(crisp, beat, 540, 1520, { role: 'display', px: 48, align: 'center' });
      drawText(crisp, `lt ${lt.toFixed(2)} s · f${fc.frame}`, 540, 1590, { px: 36, align: 'center' });

      const header = HEADERS[id];
      if (header) sectionHeader(crisp, header[0], header[1], start, t, { mode: header[2] });
      if (n >= 3 && n <= 12) hudStopwatch(crisp, t);

      const pose = GUIDE[id];
      if (pose) drawGuide(fc, pose, { x: 120, y: 440, w: 408, h: 420 }, start, end - 8 / 30, t);
      if (id === 'S01' || id === 'S15') {
        urlBar(crisp, { x: 120, y: 900, w: 468, h: 96 }, 'example.co', { cursor: fc.frame % 30 < 15 });
        enterKey(crisp, { x: 612, y: 900, w: 168, h: 96 }, id === 'S01' ? (lt > 0.1 && lt < 0.2 ? 1 : 0) : 0);
      }
      if (n >= 8 && n <= 10) {
        const a = { x: 300, y: 600 };
        const b = { x: 640, y: 900 };
        const u = progress(start, t, Math.round((end - start) * 30));
        link(crisp, a, b, { fill: u, state: id === 'S10' && lt < 1.8 ? 'error' : 'idle' });
        routerNode(fc, a.x, a.y, { label: '1 · 192.0.2.1', pulse: u });
        routerNode(fc, b.x, b.y, { label: '2 · 198.51.100.1', labelAt: { x: 520, y: 960 } });
        trackedPacket(crisp, (tt) => {
          const v = Math.max(0, Math.min(1, (tt - start) / (end - start)));
          return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v };
        }, t);
      }
      if (id === 'S05') fc.fx.scanlineWipe = lt < 5 / 30 ? progress(start, t, 5) || 0.01 : 0;
      if (id === 'S10') {
        if (lt < 1.8) fc.fx.inkOverride = PALETTE.inkDeep;
        if (fc.frame - Math.round(start * 30) < 2) fc.fx.slip = 6;
      }
    },
  };
}
