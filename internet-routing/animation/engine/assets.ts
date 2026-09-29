/**
 * Asset loading: fonts (FontFace), timeline.json, guide poses (pre-processed into shading sources).
 */
import { PALETTE } from '../config';
import type { Assets, GuideArt, Pose, Scene, Timeline } from './types';

const FONT_FILES: { family: string; file: string; weight: string }[] = [
  { family: 'IBM Plex Mono', file: 'IBMPlexMono-Regular.ttf', weight: '400' },
  { family: 'IBM Plex Mono', file: 'IBMPlexMono-Bold.ttf', weight: '700' },
  { family: 'Departure Mono', file: 'DepartureMono-Regular.woff2', weight: '400' },
  { family: 'DotGothic16', file: 'DotGothic16-Regular.ttf', weight: '400' },
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

/** Load ../timeline/timeline.json (served at /project/…); falls back to an empty timeline built from the scene registry. */
export async function loadTimeline(scenes: readonly Scene[]): Promise<Timeline> {
  try {
    const res = await fetch('/project/timeline/timeline.json', { cache: 'no-store' });
    if (res.ok) return (await res.json()) as Timeline;
    console.warn(`timeline.json: HTTP ${res.status}; using empty timeline`);
  } catch (err) {
    console.warn('timeline.json unavailable; using empty timeline', err);
  }
  return {
    fps: 30,
    duration: 45,
    width: 1080,
    height: 1920,
    scenes: scenes.map((s) => ({ id: s.id, beat: '', start: s.start, end: s.end })),
    vo: [],
    captions: [],
    audio: [],
    music: null,
    markers: [],
  };
}

/* ----------------------------------------------------------------- guide */

const POSES: Pose[] = ['curious', 'pointing', 'surprised', 'satisfied'];

export async function loadAssets(): Promise<Assets> {
  const entries = await Promise.all(POSES.map(async (p) => [p, await loadGuide(p)] as const));
  return { guide: Object.fromEntries(entries) as Record<Pose, GuideArt> };
}

async function loadGuide(pose: Pose): Promise<GuideArt> {
  const img = new Image();
  img.src = `/assets/images/guide/${pose}.png`;
  try {
    await img.decode();
    return processGuide(img, img.naturalWidth, img.naturalHeight, false);
  } catch {
    console.warn(`guide/${pose}.png missing; using placeholder silhouette`);
    return processGuide(placeholderGuide(), 600, 760, true);
  }
}

function placeholderGuide(): HTMLCanvasElement {
  const c = canvas(600, 760);
  const g = c.getContext('2d')!;
  g.strokeStyle = '#000';
  g.lineWidth = 8;
  g.beginPath();
  g.ellipse(300, 220, 150, 180, 0, 0, Math.PI * 2);
  g.moveTo(80, 760);
  g.quadraticCurveTo(100, 470, 300, 440);
  g.quadraticCurveTo(500, 470, 520, 760);
  g.stroke();
  return c;
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Separable box sum of radius r over a w×h float field. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const norm = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc * norm;
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc * norm;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

/** Greyscale max filter (square, radius r), separable. */
function maxFilter(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) m = Math.max(m, src[y * w + k]);
      tmp[y * w + x] = m;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) m = Math.max(m, tmp[k * w + x]);
      out[y * w + x] = m;
    }
  }
  return out;
}

/** Binary dilation (square, radius r) of a 0/1 field. */
function dilate(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const b = boxBlur(src, w, h, r);
  for (let i = 0; i < b.length; i++) b[i] = b[i] > 1e-6 ? 1 : 0;
  return b;
}

/** Derive line / silhouette / shade / contour sources from black line art on transparent or white. */
function processGuide(src: CanvasImageSource, w: number, h: number, placeholder: boolean): GuideArt {
  const base = canvas(w, h);
  const bctx = base.getContext('2d', { willReadFrequently: true })!;
  bctx.drawImage(src, 0, 0, w, h);
  const px = bctx.getImageData(0, 0, w, h).data;
  const n = w * h;
  const ink = new Float32Array(n);
  const lineMask = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = px[i * 4 + 3] / 255;
    const luma = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
    ink[i] = a * (1 - luma);
    lineMask[i] = ink[i] > 0.3 ? 1 : 0;
  }
  // exterior = flood fill from the border through non-(dilated)line pixels
  const closed = dilate(lineMask, w, h, 5);
  const ext = new Float32Array(n);
  const stack: number[] = [];
  const seed = (i: number) => {
    if (!closed[i] && !ext[i]) {
      ext[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < n - w) seed(i + w);
  }
  const extGrown = dilate(ext, w, h, 4);
  const blurWide = boxBlur(boxBlur(ink, w, h, 7), w, h, 7);
  const blurTight = boxBlur(ink, w, h, 3);
  // ≈3 px strokes at the storyboard guide scale (~0.55×)
  const thick = maxFilter(ink, w, h, 1);

  const inkHex = parseInt(PALETTE.ink.slice(1), 16);
  const inkRgb = [(inkHex >> 16) & 255, (inkHex >> 8) & 255, inkHex & 255];
  const mk = () => {
    const c = canvas(w, h);
    const g = c.getContext('2d')!;
    return { c, g, img: g.createImageData(w, h) };
  };
  const line = mk();
  const sil = mk();
  const shade = mk();
  const contour = mk();
  const L = line.img.data;
  const S = sil.img.data;
  const H = shade.img.data;
  const C = contour.img.data;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const inside = extGrown[i] ? 0 : 1;
    L[o] = inkRgb[0];
    L[o + 1] = inkRgb[1];
    L[o + 2] = inkRgb[2];
    L[o + 3] = Math.round(Math.min(1, thick[i] * 1.15) * 255);
    S[o + 3] = Math.max(inside, lineMask[i]) * 255;
    H[o] = H[o + 1] = H[o + 2] = 255;
    H[o + 3] = Math.round(inside * Math.min(0.5, 0.03 + 1.4 * blurWide[i]) * 255);
    C[o + 3] = Math.round(Math.min(1, blurTight[i] * 1.8) * 0.85 * 255);
  }
  for (const l of [line, sil, shade, contour]) l.g.putImageData(l.img, 0, 0);
  return { width: w, height: h, line: line.c, silhouette: sil.c, shade: shade.c, contour: contour.c, placeholder };
}
