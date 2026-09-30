/**
 * Frame renderer: serves animation/ with Vite, drives N headless Chromium instances (WebGL2 via
 * SwiftShader unless --gpu), and writes render/frames/%05d.png.
 *
 * Usage: npx tsx animation/render/render-frames.ts [--from 0] [--to 1799] [--step 1] [--workers 6] [--out render/frames] [--gpu]
 *        npx tsx animation/render/render-frames.ts --gallery [creative/references/animation/component-gallery.png]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

const animationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(animationRoot, '..');

function args() {
  const a = process.argv.slice(2);
  const get = (name: string, def: string) => {
    const i = a.indexOf(`--${name}`);
    return i >= 0 && a[i + 1] !== undefined ? a[i + 1] : def;
  };
  const gi = a.indexOf('--gallery');
  return {
    from: Number(get('from', '0')),
    to: Number(get('to', '1799')),
    step: Math.max(1, Number(get('step', '1'))),
    workers: Math.max(1, Number(get('workers', '6'))),
    out: path.resolve(projectRoot, get('out', 'render/frames')),
    gpu: a.includes('--gpu'),
    gallery:
      gi < 0 ? null : path.resolve(projectRoot, a[gi + 1] && !a[gi + 1].startsWith('--') ? a[gi + 1] : 'creative/references/animation/component-gallery.png'),
  };
}

const opts = args();
const frames: number[] = [];
if (!opts.gallery) for (let f = opts.from; f <= opts.to; f += opts.step) frames.push(f);
await mkdir(opts.gallery ? path.dirname(opts.gallery) : opts.out, { recursive: true });

const server = await createServer({
  configFile: path.join(animationRoot, 'vite.config.ts'),
  root: animationRoot,
  logLevel: 'warn',
  server: { port: 5199, strictPort: false, hmr: false, watch: null },
});
await server.listen();
const url = `${server.resolvedUrls!.local[0]}${opts.gallery ? '?gallery' : '?render'}`;

const gl = opts.gpu
  ? ['--use-angle=default', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

const workerCount = opts.gallery ? 1 : Math.min(opts.workers, frames.length);
if (!opts.gallery) {
  console.log(`rendering ${frames.length} frames (${opts.from}–${opts.to} step ${opts.step}) with ${workerCount} workers → ${path.relative(projectRoot, opts.out)}`);
}

let next = 0;
let done = 0;
/** Sum of in-page render+encode time per frame (excludes browser startup). */
let renderMs = 0;
const t0 = performance.now();
const browsers: Browser[] = [];
let failed = false;

async function openPage(): Promise<Page> {
  const browser = await chromium.launch({ headless: true, args: gl });
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  page.on('pageerror', (err) => {
    console.error('pageerror:', err.message);
    failed = true;
  });
  page.on('console', (msg) => {
    if ((msg.type() === 'error' || msg.type() === 'warning') && !msg.text().includes('GL Driver Message')) {
      console.log(`[page ${msg.type()}] ${msg.text()}`);
    }
  });
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  return page;
}

async function worker(): Promise<void> {
  const page = await openPage();
  if (opts.gallery) {
    const dataUrl = await page.evaluate(() => window.captureGallery());
    await writeFile(opts.gallery, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
    console.log(`gallery → ${path.relative(projectRoot, opts.gallery)}`);
    return;
  }
  while (!failed && next < frames.length) {
    const f = frames[next++];
    const ts = performance.now();
    const dataUrl = await page.evaluate((n) => window.captureFrame(n), f);
    renderMs += performance.now() - ts;
    await writeFile(path.join(opts.out, `${String(f).padStart(5, '0')}.png`), Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
    done++;
    if (done === frames.length || done % Math.max(1, Math.round(frames.length / 40)) === 0) {
      const el = (performance.now() - t0) / 1000;
      const eta = (el / done) * (frames.length - done);
      console.log(`[${done}/${frames.length}] f${f}  ${(el / done).toFixed(3)} s/frame wall  eta ${eta.toFixed(0)} s`);
    }
  }
}

try {
  await Promise.all(Array.from({ length: workerCount }, worker));
} finally {
  await Promise.all(browsers.map((b) => b.close()));
  await server.close();
}
const total = (performance.now() - t0) / 1000;
if (done) {
  console.log(
    `done: ${done} frames in ${total.toFixed(1)} s → ${(total / done).toFixed(3)} s/frame wall (incl. startup), ` +
      `${(renderMs / done / 1000).toFixed(3)} s/frame per worker (render + PNG encode) → ` +
      `full film (1800 f, ${workerCount} workers) ≈ ${((1800 * renderMs) / done / 1000 / workerCount / 60).toFixed(1)} min`,
  );
}
if (failed) process.exit(1);
