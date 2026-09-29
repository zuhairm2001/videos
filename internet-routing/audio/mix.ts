/**
 * Final audio mix: voice-over + ducked music + timeline SFX → audio/mix.wav
 * (48 kHz stereo, 45.000 s, ≈ −14 LUFS integrated, ≤ −1 dBTP).
 *
 * Run from internet-routing/: `npx tsx audio/mix.ts`
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

interface Cue { file: string; at: number; gain_db: number }
interface Duck { start: number; end: number; db: number }
interface Timeline { duration: number; audio: Cue[]; music: { file: string; duck: Duck[] } }

const tl: Timeline = JSON.parse(readFileSync("timeline/timeline.json", "utf8"));
const DUR = tl.duration;
const MUSIC_GAIN_DB = -3;
const VO_GAIN_DB = 0;
const ATTACK = 0.1;
const RELEASE = 0.15;

/** Piecewise-linear duck envelope as an ffmpeg expression: 1 outside ranges, 10^(db/20) inside, with ramps. */
function duckExpr(ranges: Duck[]): string {
  const terms = ranges.map(({ start, end, db }) => {
    const depth = (1 - 10 ** (db / 20)).toFixed(4);
    const r = `clip((t-${(start - ATTACK).toFixed(3)})/${ATTACK},0,1)*clip((${(end + RELEASE).toFixed(3)}-t)/${RELEASE},0,1)`;
    return `${depth}*${r}`;
  });
  const combined = terms.reduce((acc, term) => (acc ? `max(${acc},${term})` : term), "");
  return `1-${combined}`;
}

const inputs = ["-i", "audio/voice/voiceover.wav", "-i", tl.music.file, ...tl.audio.flatMap((c) => ["-i", c.file])];

const filters: string[] = [
  `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${VO_GAIN_DB}dB[vo]`,
  `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,asetnsamples=480,volume=${MUSIC_GAIN_DB}dB,volume='${duckExpr(tl.music.duck)}':eval=frame[mus]`,
  ...tl.audio.map((c, i) => {
    const ms = Math.round(c.at * 1000);
    return `[${i + 2}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${c.gain_db}dB,adelay=${ms}|${ms}[s${i}]`;
  }),
];
const mixIns = ["[vo]", "[mus]", ...tl.audio.map((_, i) => `[s${i}]`)].join("");
const pre = `${filters.join(";")};${mixIns}amix=inputs=${tl.audio.length + 2}:normalize=0:duration=longest,apad=whole_dur=${DUR},atrim=0:${DUR}`;

function ff(args: string[]): string {
  return execFileSync("ffmpeg", ["-hide_banner", "-y", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
}

// Pass 1: measure (loudnorm prints its JSON stats on stderr).
const pass1 = spawnSync("ffmpeg", ["-hide_banner", ...inputs, "-filter_complex", `${pre},loudnorm=I=-14:TP=-1:LRA=9:print_format=json[o]`, "-map", "[o]", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
if (pass1.status !== 0) throw new Error(`loudnorm measure failed:\n${pass1.stderr}`);
const statsJson: unknown = JSON.parse(pass1.stderr.slice(pass1.stderr.lastIndexOf("{"), pass1.stderr.lastIndexOf("}") + 1));
const stat = (key: string): string => {
  if (statsJson && typeof statsJson === "object" && key in statsJson) {
    const v: unknown = Reflect.get(statsJson, key);
    if (typeof v === "string") return v;
  }
  throw new Error(`loudnorm stats missing ${key}`);
};
const stats = { input_i: stat("input_i"), input_tp: stat("input_tp"), input_lra: stat("input_lra"), input_thresh: stat("input_thresh"), target_offset: stat("target_offset") };

// Pass 2: linear normalisation with measured values.
const ln = `loudnorm=I=-14:TP=-1:LRA=9:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;
ff([...inputs, "-filter_complex", `${pre},${ln},aresample=48000,atrim=0:${DUR}[o]`, "-map", "[o]", "-c:a", "pcm_s24le", "audio/mix.wav"]);

const report = execFileSync("sh", ["-c", "ffmpeg -hide_banner -i audio/mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary"], { encoding: "utf8" });
console.log(`cues: ${tl.audio.length}, duck ranges: ${tl.music.duck.length}\n${report}`);
