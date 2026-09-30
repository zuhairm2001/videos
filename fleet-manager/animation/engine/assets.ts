/**
 * Asset loading: fonts (FontFace) and the Fleet Manager icon (raster + dot sampling).
 */
import type { Assets } from './types';

const FONT_FILES: { family: string; file: string; weight: string }[] = [
  { family: 'Inter Tight', file: 'InterTight-Variable.ttf', weight: '100 900' },
  { family: 'IBM Plex Mono', file: 'IBMPlexMono-Regular.ttf', weight: '400' },
  { family: 'IBM Plex Mono', file: 'IBMPlexMono-Bold.ttf', weight: '700' },
  // Doto instanced at ROND = 100 (round dots; canvas cannot set font-variation-settings). wght axis kept.
  { family: 'Doto', file: 'Doto-Rond100.ttf', weight: '100 900' },
];

export async function loadFonts(): Promise<void> {
  await Promise.all(
    FONT_FILES.map(async ({ family, file, weight }) => {
      const face = new FontFace(family, `url(/assets/fonts/${file})`, { weight });
      await face.load();
      document.fonts.add(face);
    }),
  );
  await document.fonts.ready;
}

/** Fill colours of fleet-manager-icon.svg (palette.json "sources.icon"). */
export const ICON_FILLS = ['#0078D4', '#773ADC', '#A67AF4', '#B796F9', '#83B9F9'] as const;
export const ICON_PX = 576;

function rgbOf(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function loadAssets(): Promise<Assets> {
  const img = new Image(ICON_PX, ICON_PX);
  img.src = '/assets/images/fleet-manager-icon.svg';
  await img.decode();
  const icon = document.createElement('canvas');
  icon.width = icon.height = ICON_PX;
  const ig = icon.getContext('2d', { willReadFrequently: true })!;
  ig.drawImage(img, 0, 0, ICON_PX, ICON_PX);
  const px = ig.getImageData(0, 0, ICON_PX, ICON_PX).data;
  const fills = ICON_FILLS.map(rgbOf);
  const cache = new Map<string, (string | null)[][]>();

  /** Majority vote of 5×5 sub-samples per cell, each snapped to the nearest icon fill. */
  function iconDots(cols: number, rows: number): (string | null)[][] {
    const key = `${cols}x${rows}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const S = 5;
    const grid: (string | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: (string | null)[] = [];
      for (let c = 0; c < cols; c++) {
        const votes = new Array<number>(fills.length + 1).fill(0);
        for (let j = 0; j < S; j++) {
          for (let i = 0; i < S; i++) {
            const x = Math.min(ICON_PX - 1, Math.floor(((c + (i + 0.5) / S) / cols) * ICON_PX));
            const y = Math.min(ICON_PX - 1, Math.floor(((r + (j + 0.5) / S) / rows) * ICON_PX));
            const o = (y * ICON_PX + x) * 4;
            if (px[o + 3] < 128) {
              votes[fills.length]++;
              continue;
            }
            let best = 0;
            let bd = Infinity;
            fills.forEach(([fr, fg, fb], k) => {
              const d = (px[o] - fr) ** 2 + (px[o + 1] - fg) ** 2 + (px[o + 2] - fb) ** 2;
              if (d < bd) {
                bd = d;
                best = k;
              }
            });
            votes[best]++;
          }
        }
        const empty = votes[fills.length];
        let win = 0;
        for (let k = 1; k < fills.length; k++) if (votes[k] > votes[win]) win = k;
        row.push(empty * 2 > S * S ? null : ICON_FILLS[win]);
      }
      grid.push(row);
    }
    cache.set(key, grid);
    return grid;
  }

  return { icon, iconDots };
}
