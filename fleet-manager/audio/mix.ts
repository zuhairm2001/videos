/**
 * Final audio mix: music (0 dB) + every timeline SFX cue → audio/mix.wav
 * (48 kHz stereo 24-bit, exactly 60.000 s, −14 LUFS integrated, ≤ −1 dBTP via
 * two-pass linear loudnorm). No voice-over, no ducking.
 *
 * Run from fleet-manager/: `npx tsx audio/mix.ts [--music <path>]`
 * The music path defaults to timeline.music.file; `--music` or the MUSIC env
 * variable overrides it (e.g. a placeholder bed while the score is in progress).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

interface Cue { file: string; at: number; gainDb: number }
interface Timeline { duration: number; music: { file: string }; audio: { sfx: Cue[] } }

const SR = 48000;
const TARGET_I = -14;
const TARGET_TP = -1;
/** Sample-peak ceiling (relative to the final level) used when linear gain alone would break TARGET_TP. */
const LIMIT_TP = -2;
/** loudnorm refuses linear mode when the measured LRA exceeds its LRA target; the mix's dynamics are authored, so allow up to 20 LU. */
const LRA = 20;
const OUT = "audio/mix.wav";

const tl: Timeline = JSON.parse(readFileSync("timeline/timeline.json", "utf8"));
const musicArg = process.argv.indexOf("--music");
const music = musicArg >= 0 ? process.argv[musicArg + 1] : (process.env.MUSIC ?? tl.music.file);
if (!music) throw new Error("--music needs a path");
const cues = tl.audio.sfx;
const totalSamples = Math.round(tl.duration * SR);

// One decoder per distinct SFX file, split to its cues.
const files = [...new Set(cues.map((c) => c.file))];
const inputs = ["-i", music, ...files.flatMap((f) => ["-i", f])];
const fmt = `aformat=sample_fmts=fltp:sample_rates=${SR}:channel_layouts=stereo`;
const filters: string[] = [`[0:a]${fmt},atrim=end_sample=${totalSamples}[mus]`];
files.forEach((file, fi) => {
  const mine = cues.flatMap((c, ci) => (c.file === file ? [ci] : []));
  filters.push(`[${fi + 1}:a]${fmt},asplit=${mine.length}${mine.map((ci) => `[raw${ci}]`).join("")}`);
});
cues.forEach((c, ci) => {
  filters.push(`[raw${ci}]volume=${c.gainDb}dB,adelay=delays=${Math.round(c.at * SR)}S:all=1[s${ci}]`);
});
const mixIns = ["[mus]", ...cues.map((_, ci) => `[s${ci}]`)].join("");
const fit = `apad=whole_len=${totalSamples},atrim=end_sample=${totalSamples}`;
const pre = `${filters.join(";")};${mixIns}amix=inputs=${cues.length + 1}:normalize=0:duration=longest,${fit}`;

/** Runs a loudnorm measurement over `chain` and returns loudnorm's JSON stats (printed on stderr). */
function measure(chain: string): Record<string, string> {
  const r = spawnSync("ffmpeg", ["-hide_banner", ...inputs, "-filter_complex", `${chain},loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${LRA}:print_format=json[o]`, "-map", "[o]", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`loudnorm measure failed:\n${r.stderr}`);
  return JSON.parse(r.stderr.slice(r.stderr.lastIndexOf("{"), r.stderr.lastIndexOf("}") + 1));
}

// Pass 1: measure. If the linear gain to −14 LUFS would push true peak above −1 dBTP,
// loudnorm would silently switch to dynamic mode; instead, brick-wall the pre-mix
// so its peaks land at LIMIT_TP after the gain, and re-measure. The limiter works
// on sample peaks and limiting lowers the integrated loudness, so tighten it by the
// remaining excess until the linear gain fits (a few rounds at most).
let chain = pre;
let stats = measure(chain);
let limitDb: number | null = null;
for (let round = 0; Number(stats.input_tp) + TARGET_I - Number(stats.input_i) > TARGET_TP; round++) {
  if (round === 5) throw new Error(`pre-limiter could not bring the mix under ${TARGET_TP} dBTP: ${JSON.stringify(stats)}`);
  const excess = Number(stats.input_tp) + TARGET_I - Number(stats.input_i) - LIMIT_TP;
  limitDb = (limitDb ?? Number(stats.input_tp)) - excess;
  chain = `${pre},alimiter=limit=${Math.max(0.0625, 10 ** (limitDb / 20)).toFixed(5)}:attack=1:release=40:level=false:asc=1`;
  stats = measure(chain);
}
const limited = limitDb !== null;

// Pass 2: linear normalisation with the measured values.
const ln = `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${LRA}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true:print_format=json`;
const pass2 = spawnSync("ffmpeg", ["-hide_banner", "-y", ...inputs, "-filter_complex", `${chain},${ln},aresample=${SR},${fit}[o]`, "-map", "[o]", "-c:a", "pcm_s24le", OUT], { encoding: "utf8", maxBuffer: 1 << 26 });
if (pass2.status !== 0) throw new Error(`mix render failed:\n${pass2.stderr}`);
const normType = /"normalization_type"\s*:\s*"(\w+)"/.exec(pass2.stderr)?.[1];

const report = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i ${OUT} -af ebur128=peak=true -f null - 2>&1 | grep -A16 Summary`], { encoding: "utf8" });
const duration = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=duration", "-of", "csv=p=0", OUT], { encoding: "utf8" }).trim();
console.log(`music: ${music}\ncues: ${cues.length} (${files.length} files), pre-mix: ${stats.input_i} LUFS / ${stats.input_tp} dBTP / LRA ${stats.input_lra}, pre-limiter: ${limited ? "on" : "off"}, loudnorm: ${normType}, duration: ${duration} s\n${report}`);
const truePeak = Number(/True peak:\s*Peak:\s*(-?[\d.]+)/.exec(report)?.[1]);
if (normType !== "linear" || !(truePeak <= TARGET_TP)) throw new Error(`mix out of spec: loudnorm ${normType}, true peak ${truePeak} dBTP (limit ${TARGET_TP})`);
