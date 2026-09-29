/**
 * Page entry. Exposes `window.__ready` and `window.renderFrame(n)` for the frame renderer,
 * plus a small preview UI (space = play/pause, ←/→ = ±1 frame, shift+←/→ = ±30, ?f=N start frame).
 */
import { FPS, FRAMES } from './config';
import { Engine } from './engine/engine';
import { loadAssets, loadFonts, loadTimeline } from './engine/assets';
import { scenes } from './scenes';

declare global {
  interface Window {
    __ready: Promise<void>;
    renderFrame(n: number): Promise<void>;
    /** Render frame n and return the output canvas as a PNG data URL. */
    captureFrame(n: number): Promise<string>;
  }
}

const canvas = document.getElementById('out') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);
const renderMode = params.has('render');
let engine: Engine | null = null;

window.renderFrame = async (n: number) => {
  await window.__ready;
  engine!.renderFrame(n);
};
window.captureFrame = async (n: number) => {
  await window.renderFrame(n);
  return canvas.toDataURL('image/png');
};

window.__ready = (async () => {
  await loadFonts();
  const [assets, timeline] = await Promise.all([loadAssets(), loadTimeline(scenes)]);
  engine = new Engine(canvas, scenes, assets, timeline);
})();

if (renderMode) {
  document.body.classList.add('render');
} else {
  const hud = document.getElementById('hud')!;
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
