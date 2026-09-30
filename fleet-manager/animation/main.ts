/**
 * Page entry.
 * - `?render`: exposes `window.__ready`, `window.renderFrame(n)` and `window.captureFrame(n)` for render-frames.ts.
 * - `?gallery[=1|2|3]`: dev-only component gallery; ←/→ switch pages. `window.captureGallery()` returns all pages stacked as one PNG.
 * - default: preview (space = play/pause, ←/→ = ±1 frame, shift+←/→ = ±30, `?f=N` start frame).
 */
import { FPS, FRAMES, H, W } from './config';
import { Engine } from './engine/engine';
import { loadAssets, loadFonts } from './engine/assets';
import { galleryPages } from './gallery';
import { scenes } from './scenes';

declare global {
  interface Window {
    __ready: Promise<void>;
    renderFrame(n: number): Promise<void>;
    /** Render frame n and return the output canvas as a PNG data URL. */
    captureFrame(n: number): Promise<string>;
    /** Gallery mode: every gallery page stacked vertically (1920 × 1080·pages) as a PNG data URL. */
    captureGallery(): Promise<string>;
  }
}

const canvas = document.getElementById('out') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;
const params = new URLSearchParams(location.search);
let engine: Engine | null = null;

window.__ready = (async () => {
  await loadFonts();
  engine = new Engine(canvas, scenes, await loadAssets());
})();

window.renderFrame = async (n: number) => {
  await window.__ready;
  engine!.renderFrame(n);
};
window.captureFrame = async (n: number) => {
  await window.renderFrame(n);
  return canvas.toDataURL('image/png');
};

const GALLERY_FRAME = 450; // any frame: pages pin their own times; this only feeds the chrome timecode

function showGallery(page: number): void {
  engine!.renderWith(GALLERY_FRAME, galleryPages[page], { text: 'SPEC -- / GALLERY', start: -1 });
  hud.textContent = `gallery ${page + 1}/${galleryPages.length} · ←/→ page`;
}

window.captureGallery = async () => {
  await window.__ready;
  const sheet = document.createElement('canvas');
  sheet.width = W;
  sheet.height = H * galleryPages.length;
  const sg = sheet.getContext('2d')!;
  galleryPages.forEach((_, i) => {
    showGallery(i);
    sg.drawImage(canvas, 0, i * H);
  });
  return sheet.toDataURL('image/png');
};

if (params.has('render')) {
  document.body.classList.add('render');
} else if (params.has('gallery')) {
  let page = Math.max(0, Math.min(galleryPages.length - 1, Number(params.get('gallery') || 1) - 1));
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    page = (page + (e.key === 'ArrowRight' ? 1 : -1) + galleryPages.length) % galleryPages.length;
    e.preventDefault();
    showGallery(page);
  });
  window.__ready.then(() => showGallery(page), (err) => (hud.textContent = String(err)));
} else {
  let frame = Math.max(0, Math.min(FRAMES - 1, Number(params.get('f') ?? 0)));
  let playing = false;
  let playStart = 0;
  let playFrom = 0;
  const show = () => {
    engine!.renderFrame(frame);
    hud.textContent = `f ${frame} · ${(frame / FPS).toFixed(2)} s · ${engine!.sceneAt(frame)?.id ?? '-'}${playing ? ' ▶' : ''}`;
  };
  const tick = (now: number) => {
    if (!playing) return;
    frame = (playFrom + Math.floor(((now - playStart) / 1000) * FPS)) % FRAMES;
    show();
    requestAnimationFrame(tick);
  };
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      playing = !playing;
      playStart = performance.now();
      playFrom = frame;
      if (playing) requestAnimationFrame(tick);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      playing = false;
      frame = (frame + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 30 : 1) + FRAMES) % FRAMES;
    } else return;
    e.preventDefault();
    show();
  });
  window.__ready.then(show, (err) => (hud.textContent = String(err)));
}
