// Renders the score in music.ts to audio/music/music.wav (48 kHz stereo 24-bit PCM, exactly 60.000 s),
// then analyses it: spectrogram.png, integrated loudness / true peak, and a per-section loudness table.
// Vite bundles music.ts + Tone.js + Tonal (+ timeline.json) for the browser; Playwright Chromium runs
// Tone.Offline for exactly DURATION seconds, encodes 24-bit PCM WAV in the page and POSTs it back to
// Node. ffmpeg applies one static gain to -18 LUFS integrated (true peak ≤ -3 dBTP, via a transparent
// peak limiter only if the gain alone would exceed it).
//   npx tsx audio/music/render-music.ts
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { build, type Rollup } from "vite";
import type { Section } from "./music.ts";

const TARGET_LUFS = -18;
const MAX_TRUE_PEAK = -3;
/** Keep the pre-limit headroom a little under the ceiling so the post-gain true peak lands below it. */
const TRUE_PEAK_MARGIN = 0.3;
const ORIGIN = "http://localhost:4722";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..", "..");
const outFile = join(here, "music.wav");
const spectrogramFile = join(here, "spectrogram.png");

/** Score constants re-exported by the browser bundle (music.ts imports Tone/Tonal, which only load in the browser). */
interface ScoreMeta {
  bpm: number;
  key: string;
  duration: number;
  sampleRate: number;
  sections: Section[];
  instruments: string[];
}

interface RenderInfo {
  frames: number;
  peak: number;
  seconds: number;
}

declare global {
  interface Window {
    __scoreMeta: ScoreMeta;
    __renderMusic(): Promise<RenderInfo>;
  }
}

// Browser entry: offline render → 24-bit PCM WAV encoded in-page → POST /upload.
const ENTRY_ID = "\0music-entry";
const ENTRY_SRC = `
import * as Tone from "tone";
import { buildScore, BPM, DURATION, INSTRUMENTS, KEY, SAMPLE_RATE, SECTIONS } from ${JSON.stringify(join(here, "music.ts"))};

// Interleaved little-endian 24-bit PCM WAV.
function encodeWav24(channels, sampleRate, gain) {
  const frames = channels[0].length;
  const nch = channels.length;
  const dataBytes = frames * nch * 3;
  const buf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  const ascii = (off, s) => { for (let i = 0; i < s.length; i++) bytes[off + i] = s.charCodeAt(i); };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, nch, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * nch * 3, true);
  view.setUint16(32, nch * 3, true);
  view.setUint16(34, 24, true);
  ascii(36, "data");
  view.setUint32(40, dataBytes, true);
  let off = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < nch; c++) {
      const v = Math.max(-8388608, Math.min(8388607, Math.round(channels[c][i] * gain * 8388607)));
      bytes[off] = v & 0xff;
      bytes[off + 1] = (v >> 8) & 0xff;
      bytes[off + 2] = (v >> 16) & 0xff;
      off += 3;
    }
  }
  return bytes;
}

window.__scoreMeta = { bpm: BPM, key: KEY, duration: DURATION, sampleRate: SAMPLE_RATE, sections: SECTIONS, instruments: INSTRUMENTS };

window.__renderMusic = async () => {
  const t0 = performance.now();
  const buffer = await Tone.Offline((context) => buildScore(context), DURATION, 2, SAMPLE_RATE);
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)];
  let peak = 0;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
  if (!(peak > 0)) throw new Error("offline render is silent");
  // Park the raw peak at -6 dBFS (no clipping in 24-bit); ffmpeg sets the final level.
  const wav = encodeWav24(channels, buffer.sampleRate, 0.5 / peak);
  const res = await fetch("/upload", { method: "POST", body: wav });
  if (!res.ok) throw new Error("upload failed: " + res.status);
  return { frames: buffer.length, peak, seconds: (performance.now() - t0) / 1000 };
};
`;

async function bundle(): Promise<string> {
  const out = (await build({
    configFile: false,
    root: projectRoot,
    logLevel: "warn",
    plugins: [
      {
        name: "music-entry",
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

/** Run a binary; throws on non-zero exit. */
function run(cmd: string, args: string[]): { stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}\n${r.stderr}`);
  return { stdout: r.stdout, stderr: r.stderr };
}

interface Loudness {
  integrated: number;
  range: number;
  truePeak: number;
  /** Short-term (3 s) loudness every 100 ms: [time s, LUFS]. */
  shortTerm: [number, number][];
}

/** ffmpeg ebur128 (integrated LUFS, LRA, true peak, short-term curve) for a file or a time window of it. */
function loudness(file: string, window?: [number, number]): Loudness {
  const trim = window ? ["-ss", String(window[0]), "-to", String(window[1])] : [];
  const log = run("ffmpeg", ["-hide_banner", "-nostats", ...trim, "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
  const summary = log.slice(log.lastIndexOf("Summary:"));
  const num = (re: RegExp): number => {
    const m = summary.match(re);
    if (!m) throw new Error(`cannot parse ebur128 summary:\n${summary}`);
    return m[1] === "-inf" ? -Infinity : Number(m[1]);
  };
  const shortTerm: [number, number][] = [];
  for (const m of log.matchAll(/t:\s*([\d.]+)\s+TARGET:.*?S:\s*(-?[\d.]+|-inf)/g)) shortTerm.push([Number(m[1]), Number(m[2])]);
  return {
    integrated: num(/I:\s+(-?[\d.]+|-inf) LUFS/),
    range: num(/LRA:\s+(-?[\d.]+) LU/),
    truePeak: num(/True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS/),
    shortTerm,
  };
}

const tmp = await mkdtemp(join(tmpdir(), "music-render-"));
const rawFile = join(tmp, "raw.wav");
try {
  console.log("bundling music.ts …");
  const code = await bundle();
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  let info: RenderInfo;
  let meta: ScoreMeta;
  try {
    const page = await browser.newPage();
    page.on("pageerror", (err) => console.error("[page]", err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("[page console]", msg.text());
    });
    await page.route(`${ORIGIN}/**`, async (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname;
      if (path === "/upload" && req.method() === "POST") {
        const body = req.postDataBuffer();
        if (!body) return route.fulfill({ status: 400, body: "empty" });
        await writeFile(rawFile, body);
        return route.fulfill({ status: 200, body: "ok" });
      }
      if (path === "/music.js") return route.fulfill({ contentType: "text/javascript", body: code });
      return route.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="utf-8"><script src="/music.js"></script>' });
    });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => "__renderMusic" in window);
    meta = await page.evaluate(() => window.__scoreMeta);
    console.log(`rendering ${meta.duration} s offline in Chromium …`);
    info = await page.evaluate(() => window.__renderMusic());
  } finally {
    await browser.close();
  }
  const { sampleRate, duration } = meta;
  const expectedFrames = Math.round(duration * sampleRate);
  if (info.frames !== expectedFrames) throw new Error(`rendered ${info.frames} frames, expected ${expectedFrames}`);
  console.log(`rendered ${info.frames} frames in ${info.seconds.toFixed(1)} s (raw peak ${(20 * Math.log10(info.peak)).toFixed(2)} dBFS)`);

  // Master: one static gain to the target loudness; a transparent limiter only if the gain would
  // push the true peak over the ceiling (then re-measure and re-gain).
  const raw = loudness(rawFile);
  console.log(`raw mix: ${raw.integrated} LUFS, true peak ${raw.truePeak} dBTP, PLR ${(raw.truePeak - raw.integrated).toFixed(1)} dB`);
  // Converge: the limiter lowers loudness, the re-gain raises the peaks again, and alimiter works on
  // sample peaks, so lower the ceiling by the measured overshoot until the gained true peak fits.
  let source = rawFile;
  let gainDb = TARGET_LUFS - raw.integrated;
  let ceilingDb = Infinity;
  for (let pass = 1; ; pass++) {
    const pre = source === rawFile ? raw : loudness(source);
    gainDb = TARGET_LUFS - pre.integrated;
    const overshoot = pre.truePeak + gainDb - (MAX_TRUE_PEAK - TRUE_PEAK_MARGIN);
    if (overshoot <= 0) break;
    if (pass > 5) throw new Error(`limiter did not converge (overshoot ${overshoot.toFixed(2)} dB)`);
    ceilingDb = Math.min(ceilingDb, pre.truePeak) - overshoot - 0.1;
    const limited = join(tmp, "limited.wav");
    run("ffmpeg", [
      "-hide_banner", "-y", "-i", rawFile,
      "-af", `alimiter=limit=${(10 ** (ceilingDb / 20)).toFixed(6)}:attack=2:release=40:level=disabled`,
      "-c:a", "pcm_f32le", limited,
    ]);
    source = limited;
    console.log(`limiter pass ${pass}: ceiling ${ceilingDb.toFixed(2)} dBFS (${(raw.truePeak - ceilingDb).toFixed(2)} dB below the raw true peak)`);
  }
  run("ffmpeg", [
    "-hide_banner", "-y", "-i", source, "-af", `volume=${gainDb.toFixed(4)}dB`,
    "-c:a", "pcm_s24le", "-ar", String(sampleRate), "-ac", "2", outFile,
  ]);
  run("ffmpeg", ["-hide_banner", "-y", "-i", outFile, "-lavfi", "showspectrumpic=s=1920x800:legend=1", spectrogramFile]);

  // ---------- verification report ----------
  const probe = JSON.parse(
    run("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate,channels,duration_ts,duration,codec_name,bits_per_sample", "-of", "json", outFile]).stdout,
  ).streams[0];
  const final = loudness(outFile);
  console.log(`\n${relative(projectRoot, outFile)}`);
  console.log(`  ${probe.codec_name}, ${probe.sample_rate} Hz, ${probe.channels} ch, ${probe.bits_per_sample}-bit, ${probe.duration_ts} samples = ${Number(probe.duration).toFixed(6)} s`);
  console.log(`  loudness: ${final.integrated} LUFS integrated, LRA ${final.range} LU, true peak ${final.truePeak} dBTP (gain ${gainDb.toFixed(2)} dB)`);
  console.log(`  ${meta.bpm} BPM 4/4, key: ${meta.key}`);
  console.log(`  spectrogram: ${relative(projectRoot, spectrogramFile)}`);

  // Short-term (3 s window) values ending inside each section; the first 3 s of a section still carry
  // the previous one, so the "late" column (last 60 % of the section) shows where the section settles.
  console.log("\n  section      window (s)    energy  LUFS(window)  S mean  S max   S late");
  for (const s of meta.sections) {
    const w = loudness(outFile, [s.start, s.end]);
    const st = final.shortTerm.filter(([t]) => t > s.start && t <= s.end).map(([, v]) => v).filter(Number.isFinite);
    const late = final.shortTerm.filter(([t]) => t > s.start + 0.4 * (s.end - s.start) && t <= s.end).map(([, v]) => v).filter(Number.isFinite);
    const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    console.log(
      `  ${s.id.padEnd(11)} ${s.start.toFixed(1).padStart(5)}–${s.end.toFixed(1).padEnd(5)}  ${s.energy.padEnd(6)} ${String(w.integrated).padStart(8)}     ${mean(st).toFixed(1).padStart(6)} ${Math.max(...st).toFixed(1).padStart(6)} ${mean(late).toFixed(1).padStart(6)}`,
    );
  }
  const barSec = 240 / meta.bpm;
  const bars = Array.from({ length: Math.round(duration / barSec) }, (_, b) => loudness(outFile, [b * barSec, (b + 1) * barSec]).integrated);
  console.log(`\n  LUFS per bar (bar 1 … ${bars.length}):\n  ${bars.map((v) => (Number.isFinite(v) ? v.toFixed(0) : "-inf")).join(" ")}`);
  console.log(`\n  instruments:\n${meta.instruments.map((i) => `    - ${i}`).join("\n")}`);

  if (probe.duration_ts !== expectedFrames) throw new Error(`music.wav has ${probe.duration_ts} samples, expected ${expectedFrames}`);
  if (Number(probe.sample_rate) !== sampleRate || probe.channels !== 2) throw new Error("music.wav is not 48 kHz stereo");
  if (final.truePeak > MAX_TRUE_PEAK) throw new Error(`true peak ${final.truePeak} dBTP exceeds ${MAX_TRUE_PEAK}`);
  if (Math.abs(final.integrated - TARGET_LUFS) > 0.5) throw new Error(`integrated loudness ${final.integrated} LUFS is off target ${TARGET_LUFS}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
