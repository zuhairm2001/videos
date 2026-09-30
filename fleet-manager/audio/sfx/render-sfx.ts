// Renders every SFX in sfx.ts: Vite bundles sfx.ts + Tone.js + Tonal for the
// browser, Playwright Chromium runs Tone.Offline per sound (a fresh page each,
// so Tone's cached noise buffers never leak between sounds), the raw stereo
// float PCM comes back to Node, which applies the shared post chain and writes
// 48 kHz stereo 24-bit PCM WAVs plus README.md next to this file. Fails if any
// file referenced by timeline.audio.sfx has no definition.
//   npx tsx audio/sfx/render-sfx.ts [name ...]
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { build, type Rollup } from "vite";

const SR = 48000;
const PEAK_DBFS = -1;
const FADE_IN_S = 0.002;
/** Fade-out for trimmed (decaying) sounds. */
const FADE_OUT_S = 0.005;
/** Fade-out for fixed-length sounds that stop dead on picture (drift-buzz, risers, collapse). */
const HARD_STOP_S = 0.003;
/** Tail below this level (relative to peak) is trimmed off. */
const TAIL_FLOOR_DB = -60;
const ORIGIN = "http://localhost:4719";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..", "..");

interface Meta {
  name: string;
  sound: string;
  length: number;
  fixed?: boolean;
  reverse?: boolean;
}

interface Cue { file: string; at: number; gainDb: number; note?: string }

/** Globals installed by the browser entry below. */
declare global {
  interface Window {
    __sfxMeta: Meta[];
    __renderSfx(name: string): Promise<string[]>;
  }
}

// Browser entry: exposes metadata and an offline renderer returning base64 float32 PCM per channel.
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
function b64(f32) {
  const bytes = new Uint8Array(f32.slice().buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

window.__sfxMeta = SFX.map(({ render, ...meta }) => meta);
window.__renderSfx = async (name) => {
  const def = SFX.find((d) => d.name === name);
  if (!def) throw new Error("unknown sfx " + name);
  // Tone.Noise draws its buffers and start offsets from Math.random: reseed per sound for reproducible renders.
  Math.random = mulberry32(seedOf(name) ^ 0x9e3779b9);
  const rng = mulberry32(seedOf(name));
  const buffer = await Tone.Offline(({ destination }) => def.render(Tone, destination, rng), def.length, 2, ${SR});
  return [b64(buffer.getChannelData(0)), b64(buffer.getChannelData(1))];
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

/** DC block → (reverse) → tail trim or fixed length → fades → linked peak normalise to -1 dBFS. */
function post(raw: Float32Array[], meta: Meta): Float32Array[] {
  const R = 1 - (2 * Math.PI * 20) / SR;
  const chans = raw.map((ch) => {
    // One-pole DC blocker (~20 Hz): noise bodies through low-pass filters can carry offset.
    const x = new Float32Array(ch.length);
    let prevIn = 0;
    let prevOut = 0;
    for (let i = 0; i < ch.length; i++) {
      prevOut = ch[i] - prevIn + R * prevOut;
      prevIn = ch[i];
      x[i] = prevOut;
    }
    if (meta.reverse) x.reverse();
    return x;
  });
  const n = chans[0].length;
  const absAt = (i: number) => Math.max(...chans.map((c) => Math.abs(c[i])));

  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, absAt(i));
  if (peak === 0) throw new Error(`${meta.name}: rendered silence`);

  const fadeOut = Math.round((meta.fixed ? HARD_STOP_S : FADE_OUT_S) * SR);
  let end = Math.round(meta.length * SR);
  if (!meta.fixed) {
    const floor = peak * 10 ** (TAIL_FLOOR_DB / 20);
    let last = n - 1;
    while (last > 0 && absAt(last) < floor) last--;
    end = Math.min(end, last + 1 + fadeOut);
  }
  const out = chans.map((c) => {
    const y = new Float32Array(end);
    y.set(c.subarray(0, Math.min(end, c.length)));
    return y;
  });

  const fadeIn = Math.round(FADE_IN_S * SR);
  for (const y of out) {
    for (let i = 0; i < fadeIn; i++) y[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeIn);
    for (let i = 0; i < fadeOut; i++) y[end - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeOut);
  }

  peak = 0;
  for (const y of out) for (const v of y) peak = Math.max(peak, Math.abs(v));
  const gain = 10 ** (PEAK_DBFS / 20) / peak;
  for (const y of out) for (let i = 0; i < y.length; i++) y[i] *= gain;
  return out;
}

function wav24(chans: Float32Array[]): Buffer {
  const nch = chans.length;
  const frames = chans[0].length;
  const dataBytes = frames * nch * 3;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(nch, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * nch * 3, 28);
  buf.writeUInt16LE(nch * 3, 32);
  buf.writeUInt16LE(24, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataBytes, 40);
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (const ch of chans) {
      buf.writeIntLE(Math.max(-8388608, Math.min(8388607, Math.round(ch[i] * 8388607))), o, 3);
      o += 3;
    }
  }
  return buf;
}

function readme(rows: { meta: Meta; duration: number }[], cues: Cue[]): string {
  const cuesFor = (name: string) =>
    cues
      .filter((c) => basename(c.file, ".wav") === name)
      .map((c) => `${c.at.toFixed(2)} (${c.gainDb} dB${c.note ? `, ${c.note}` : ""})`)
      .join(" · ");
  const lines = [
    "# SFX",
    "",
    "Synthesised with Tone.js offline rendering in Playwright Chromium (`sfx.ts` defines the sounds, `render-sfx.ts` renders them).",
    "Regenerate from the project root: `npx tsx audio/sfx/render-sfx.ts` (optionally pass names to render a subset). Renders are deterministic: every sound gets its own page and a seed derived from its name, so content, lengths and random choices never change. Sounds built only from oscillators and noise are bit-identical run to run; those using Tone's envelope synths can differ by 1–2 LSB of 24-bit (≈ −132 dBFS) from Chromium's float rounding.",
    "",
    `All files: 48 kHz stereo 24-bit PCM WAV, linked peak ${PEAK_DBFS} dBFS, ${FADE_IN_S * 1000} ms raised-cosine fade-in. Decaying sounds are tail-trimmed at ${TAIL_FLOOR_DB} dB below peak with a ${FADE_OUT_S * 1000} ms fade-out; fixed-length sounds (cut to picture) keep their exact length and stop with a ${HARD_STOP_S * 1000} ms fade. The transient sits at t = 0 except for the fixed-length swells, which peak at their end, so place each file at the cue time from \`timeline.json\` (\`audio.sfx[]\`) and set the level with \`gainDb\`.`,
    "",
    "| File | Duration (s) | Length | Sound | Timeline cues (s) |",
    "|---|---|---|---|---|",
    ...rows.map(
      ({ meta, duration }) =>
        `| \`${meta.name}.wav\` | ${duration.toFixed(3)} | ${meta.fixed ? `fixed${meta.reverse ? ", reversed" : ""}` : "trimmed"} | ${meta.sound} | ${cuesFor(meta.name) || "—"} |`,
    ),
    "",
  ];
  return lines.join("\n");
}

const timeline = JSON.parse(await readFile(join(projectRoot, "timeline", "timeline.json"), "utf8")) as { audio: { sfx: Cue[] } };
const cues = timeline.audio.sfx;
const only = process.argv.slice(2);
const code = await bundle();
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  await context.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/sfx.js") return route.fulfill({ contentType: "text/javascript", body: code });
    return route.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="utf-8"><script src="/sfx.js"></script>' });
  });
  const open = async () => {
    const page = await context.newPage();
    page.on("pageerror", (err) => console.error("[page]", err.message));
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => "__renderSfx" in window);
    return page;
  };

  const metaPage = await open();
  const all = await metaPage.evaluate(() => window.__sfxMeta);
  await metaPage.close();
  const missing = [...new Set(cues.map((c) => basename(c.file, ".wav")))].filter((n) => !all.some((m) => m.name === n));
  if (missing.length) throw new Error(`timeline references undefined sfx: ${missing.join(", ")}`);
  const unknown = only.filter((n) => !all.some((m) => m.name === n));
  if (unknown.length) throw new Error(`unknown sfx: ${unknown.join(", ")}`);
  const todo = only.length ? all.filter((m) => only.includes(m.name)) : all;

  const rows: { meta: Meta; duration: number }[] = [];
  for (const meta of todo) {
    const page = await open();
    const b64s = await page.evaluate((name) => window.__renderSfx(name), meta.name);
    await page.close();
    const raw = b64s.map((s) => new Float32Array(new Uint8Array(Buffer.from(s, "base64")).buffer));
    const chans = post(raw, meta);
    const file = join(here, `${meta.name}.wav`);
    await writeFile(file, wav24(chans));
    const duration = chans[0].length / SR;
    rows.push({ meta, duration });
    console.log(`${relative(projectRoot, file)}  ${duration.toFixed(3)} s`);
  }
  if (!only.length) await writeFile(join(here, "README.md"), readme(rows, cues));
} finally {
  await browser.close();
}
