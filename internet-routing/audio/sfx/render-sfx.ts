// Renders every SFX in sfx.ts: Vite bundles sfx.ts + Tone.js + Tonal for the
// browser, Playwright Chromium serves it and runs Tone.Offline per sound, the
// raw float PCM comes back to Node, which applies the shared post chain and
// writes 48 kHz mono 24-bit PCM WAVs plus README.md next to this file.
//   npx tsx audio/sfx/render-sfx.ts [name ...]
import { writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { build, type Rollup } from "vite";

const SR = 48000;
const PEAK_DBFS = -3;
const FADE_IN_S = 0.002;
const FADE_OUT_S = 0.005;
/** Tail below this level (relative to peak) is trimmed off. */
const TAIL_FLOOR_DB = -54;
/** Crushed share of the signal; the rest stays dry. */
const CRUSH_WET = 0.8;
const ORIGIN = "http://localhost:4719";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..", "..");

interface Meta {
  name: string;
  storyboardId: string | null;
  sound: string;
  cue: string;
  maxDuration: number;
  crush: { bits: number; hold: number };
}

/** Globals installed by the browser entry below. */
declare global {
  interface Window {
    __sfxMeta: Meta[];
    __renderSfx(name: string): Promise<string>;
  }
}

// Browser entry: exposes metadata and an offline renderer returning base64 float32 PCM.
const ENTRY_ID = "\0sfx-entry";
const ENTRY_SRC = `
import * as Tone from "tone";
import { SFX } from ${JSON.stringify(join(here, "sfx.ts"))};

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedOf(name) {
  let h = 2166136261;
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

window.__sfxMeta = SFX.map(({ render, length, ...meta }) => meta);
window.__renderSfx = async (name) => {
  const def = SFX.find((d) => d.name === name);
  if (!def) throw new Error("unknown sfx " + name);
  // Tone.Noise draws its buffers from Math.random: reseed per sound for reproducible renders.
  Math.random = mulberry32(seedOf(name) ^ 0x9e3779b9);
  const rng = mulberry32(seedOf(name));
  const buffer = await Tone.Offline(({ destination }) => def.render(Tone, destination, rng), def.length, 1, ${SR});
  const bytes = new Uint8Array(buffer.getChannelData(0).slice().buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
`;

async function bundle(): Promise<string> {
  const out = (await build({
    configFile: false,
    root: projectRoot,
    logLevel: "warn",
    plugins: [
      {
        name: "sfx-entry",
        resolveId: (id) => (id === ENTRY_ID ? id : null),
        load: (id) => (id === ENTRY_ID ? ENTRY_SRC : null),
      },
    ],
    build: {
      write: false,
      minify: false,
      target: "es2022",
      rollupOptions: { input: ENTRY_ID, output: { format: "iife", inlineDynamicImports: true } },
    },
  })) as Rollup.RollupOutput | Rollup.RollupOutput[];
  const outputs = Array.isArray(out) ? out : [out];
  const chunk = outputs.flatMap((o) => o.output).find((c): c is Rollup.OutputChunk => c.type === "chunk" && c.isEntry);
  if (!chunk) throw new Error("vite produced no entry chunk");
  return chunk.code;
}

/** DC block → peak-normalise → bit-crush (80 % wet) → tail trim → fades → -3 dBFS. */
function post(raw: Float32Array, meta: Meta): Float32Array {
  const x = new Float32Array(raw.length);
  // One-pole DC blocker (~20 Hz): noise bodies through low-pass filters can carry offset.
  const R = 1 - (2 * Math.PI * 20) / SR;
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < raw.length; i++) {
    prevOut = raw[i] - prevIn + R * prevOut;
    prevIn = raw[i];
    x[i] = prevOut;
  }

  let peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  if (peak === 0) throw new Error(`${meta.name}: rendered silence`);
  // Sample-and-hold + quantise, blended with a little dry signal so decays below
  // the quantiser's last step fade out instead of gating to hard zero.
  const levels = 2 ** (meta.crush.bits - 1) - 1;
  let held = 0;
  for (let i = 0; i < x.length; i++) {
    const dry = x[i] / peak;
    if (i % meta.crush.hold === 0) held = Math.round(dry * levels) / levels;
    x[i] = CRUSH_WET * held + (1 - CRUSH_WET) * dry;
  }

  const floor = 10 ** (TAIL_FLOOR_DB / 20);
  let last = x.length - 1;
  while (last > 0 && Math.abs(x[last]) < floor) last--;
  const end = Math.min(x.length, last + 1 + Math.round(FADE_OUT_S * SR), Math.round(meta.maxDuration * SR));
  const y = x.slice(0, end);

  const fadeIn = Math.round(FADE_IN_S * SR);
  const fadeOut = Math.round(FADE_OUT_S * SR);
  for (let i = 0; i < fadeIn; i++) y[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeIn);
  for (let i = 0; i < fadeOut; i++) y[end - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeOut);

  peak = y.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const gain = 10 ** (PEAK_DBFS / 20) / peak;
  for (let i = 0; i < y.length; i++) y[i] *= gain;
  return y;
}

function wav24(samples: Float32Array): Buffer {
  const dataBytes = samples.length * 3;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 3, 28);
  buf.writeUInt16LE(3, 32);
  buf.writeUInt16LE(24, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-8388608, Math.min(8388607, Math.round(samples[i] * 8388607)));
    buf.writeIntLE(v, 44 + i * 3, 3);
  }
  return buf;
}

function readme(rows: { meta: Meta; duration: number }[]): string {
  const lines = [
    "# SFX",
    "",
    "Synthesised with Tone.js offline rendering in Playwright Chromium (`sfx.ts` defines the sounds, `render-sfx.ts` renders them).",
    "Regenerate from the project root: `npx tsx audio/sfx/render-sfx.ts` (optionally pass names to render a subset).",
    "",
    `All files: 48 kHz mono 24-bit PCM WAV, peak ${PEAK_DBFS} dBFS, ${FADE_IN_S * 1000} ms raised-cosine fade-in / ${FADE_OUT_S * 1000} ms fade-out, tail trimmed at ${TAIL_FLOOR_DB} dB, bit-crushed per sound (sample-and-hold + quantiser, ${CRUSH_WET * 100} % wet). The transient sits at t = 0, so place each file at the cue time and set the mix level with \`gain_db\` (the storyboard asks for \`tick\` at −18 dB).`,
    "",
    "Cue times are storyboard times; the Timeline agent applies the S10 remap (28.30→28.80 start) and VO-segment shifts.",
    "",
    "| File | Duration (s) | Storyboard id | Crush | Sound | Storyboard cue |",
    "|---|---|---|---|---|---|",
    ...rows.map(
      ({ meta, duration }) =>
        `| \`${meta.name}.wav\` | ${duration.toFixed(3)} | ${meta.storyboardId ? `\`${meta.storyboardId}\`` : "—"} | ${meta.crush.bits}-bit, hold ${meta.crush.hold} | ${meta.sound} | ${meta.cue} |`,
    ),
    "",
  ];
  return lines.join("\n");
}

const only = process.argv.slice(2);
const code = await bundle();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on("pageerror", (err) => console.error("[page]", err.message));
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/sfx.js") return route.fulfill({ contentType: "text/javascript", body: code });
    return route.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="utf-8"><script src="/sfx.js"></script>' });
  });
  await page.goto(`${ORIGIN}/`);
  await page.waitForFunction(() => "__renderSfx" in window);
  const all = await page.evaluate(() => window.__sfxMeta);
  const unknown = only.filter((n) => !all.some((m) => m.name === n));
  if (unknown.length) throw new Error(`unknown sfx: ${unknown.join(", ")}`);
  const todo = only.length ? all.filter((m) => only.includes(m.name)) : all;

  const rows: { meta: Meta; duration: number }[] = [];
  for (const meta of todo) {
    const b64 = await page.evaluate((name) => window.__renderSfx(name), meta.name);
    const bytes = Buffer.from(b64, "base64");
    const samples = post(new Float32Array(new Uint8Array(bytes).buffer), meta);
    const file = join(here, `${meta.name}.wav`);
    await writeFile(file, wav24(samples));
    const duration = samples.length / SR;
    rows.push({ meta, duration });
    console.log(`${relative(projectRoot, file)}  ${duration.toFixed(3)} s`);
  }
  if (!only.length) await writeFile(join(here, "README.md"), readme(rows));
} finally {
  await browser.close();
}
