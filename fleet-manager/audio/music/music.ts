// Score for the Azure Kubernetes Fleet Manager promo: 60.0 s, 120 BPM 4/4, 30 bars, no voice-over.
// D minor sprawl (0–8 s) lifting to F major at the 8.00 reveal; resolves on F add9 and rings out by
// 59.5 s. Tone.js does synthesis, sequencing and effects; Tonal does scales, chord spelling and
// voicing. `buildScore(context)` runs inside `Tone.Offline` and schedules everything on the offline
// context's Transport.
//
// Section times, hits, motif times, the arp layer entries, the half-time section and the resolve
// chord all come from timeline/timeline.json (`music{}` plus a few `cues{}`), so nothing here
// duplicates the director's numbers. Harmony is written per section in bars relative to its start.
//
// Grid: bar = 2.00 s, beat = 0.50 s, one step = one 16th = 0.125 s; downbeat at 0.00.
import * as Tone from "tone";
import { Chord, Note, Scale } from "tonal";
import timeline from "../../timeline/timeline.json";

interface TimelineSection {
  id: string;
  start: number;
  end: number;
  key?: string;
  energy: number | string;
  layerAdds?: number[];
  feel?: string;
  resolve?: string;
  tailEnd?: number;
}

interface TimelineMusic {
  bpm: number;
  barSec: number;
  duration: number;
  cues: Record<string, number>;
  music: { motifAt: number[]; sections: TimelineSection[]; hits: number[] };
}

const TL = timeline as unknown as TimelineMusic;

export const BPM = TL.bpm;
export const BAR = TL.barSec;
export const BEAT = BAR / 4;
export const STEP = BEAT / 4;
export const DURATION = TL.duration;
export const SAMPLE_RATE = 48000;
export const SEED = 0x0f1ee7ac;
if (Math.abs(BAR - 240 / BPM) > 1e-9) throw new Error(`timeline barSec ${BAR} does not match ${BPM} BPM 4/4`);

function section(id: string): TimelineSection {
  const s = TL.music.sections.find((x) => x.id === id);
  if (!s) throw new Error(`timeline.music.sections has no "${id}"`);
  return s;
}
function cue(id: string): number {
  const v = TL.cues[id];
  if (typeof v !== "number") throw new Error(`timeline.cues has no "${id}"`);
  return v;
}

const S = {
  sprawl: section("sprawl"),
  reveal: section("reveal"),
  updates: section("updates"),
  placement: section("placement"),
  governance: section("governance"),
  reach: section("reach"),
  cta: section("cta"),
};
const LAYER_ADDS = S.updates.layerAdds ?? [];
if (LAYER_ADDS.length !== 3) throw new Error("updates.layerAdds must list the three arp entries");
const HALF_TIME: TimelineSection = TL.music.sections.find((s) => s.feel === "half-time") ?? (() => {
  throw new Error("no half-time section in the timeline");
})();
if (!S.cta.resolve || S.cta.tailEnd === undefined) throw new Error("cta section needs resolve and tailEnd");
const RESOLVE = S.cta.resolve;
const TAIL_END = S.cta.tailEnd;
const MOTIF_AT = TL.music.motifAt;
const HITS = TL.music.hits;

export const KEY = `${S.sprawl.key} (${S.sprawl.start}–${S.sprawl.end} s) → ${S.reveal.key} from ${S.reveal.start} s; resolves on ${RESOLVE}`;

export interface Section {
  id: string;
  start: number;
  end: number;
  energy: string;
  parts: string;
}

const PARTS: Record<string, string> = {
  sprawl:
    "Dm9 → Bbmaj7 → Gm9 → C9sus4. Sparse detuned FM dot plucks off the grid (density 20 % → 70 %), off-grid hats whose density follows the cluster doublings, sub on half notes then quarters from 4 s, soft kicks from 4 s, detune widens through the drift (6.8–7.9 s), noise swell into 8.00.",
  reveal:
    "F major. Downbeat hit, pad blooms (low-pass 300 → 2.2 kHz), bell motif F–A–C–G, dot arp locks to straight 16ths, sub pulse on quarters, clock tick on 8ths, kick on 1 and 3.",
  updates:
    "Steady groove (four-on-the-floor kick, clap 2 & 4, off-beat hats, 8th ticks, sidechained sub/pad), rising 6 → 7. One arp voice added per stage: 8th off-beat pluck (17 s), 3-3-2 mid pluck + 16th hat ghosts (20 s), glass 3-step sparkle + open hats (23 s); the pad lifts a step with each. Snare fill into 26.",
  placement:
    "Busier: dot arp climbs while the mid arp descends (contrary motion), 8th-note mid bass, 16th hats, open hats; motif at 34 s over F add9.",
  governance:
    "Half-time: kick on 1, snare on 3, sub on half notes, ticks on quarters. Pad forward (filter opens to 3.6 kHz while the rest thins), single low-passed 8th arp, sparse glass. Builds back to 16ths 44–46.",
  reach:
    "Peak: full kit (16th hats, open hats), all four arp voices, 8th bass, pad, crash. Noise riser + snare roll 50–52.",
  cta:
    "Hit at 52 (Fadd9), dot arp collapses 52–53.4, crisp bell hit at 53.4, motif at 54 over Bbmaj9, resolve to F add9 at 56 with a bell strum; everything rings out by 59.5.",
};

export const SECTIONS: Section[] = TL.music.sections.map((s) => {
  const parts = PARTS[s.id];
  if (!parts) throw new Error(`no score notes for section ${s.id}`);
  return { id: s.id, start: s.start, end: s.end, energy: String(s.energy), parts };
});

export const INSTRUMENTS = [
  "Dot pluck arp (PolySynth<FMSynth>, ratio 2) + detuned twin for the sprawl",
  "Arp voice 2: bright 8th off-beat pluck (FM ratio 3), panned left",
  "Arp voice 3: warm mid pluck (FM ratio 1), 3-3-2 / contrary 16ths, panned right",
  "Arp voice 4: glass sparkle (FM ratio 5, low index), 3-step polymeter",
  "Glassy bell lead for the F–A–C–G motif (FM ratio 3.5 + sine octave shimmer)",
  "Warm analog pad (fat sawtooth ×3, 24 dB low-pass with section automation, chorus)",
  "Sine sub pulse on quarters + triangle octave (small-speaker translation), sidechain-ducked by the kick",
  "Saw mid bass with filter envelope (placement, reach)",
  "Kit: tuned felt kick (F1), clap/snare (noise + body), hats, open hat, crash, felt clock tick",
  "Hit layer: tuned boom (F1 pitch drop) + crash on each timeline hit; bell cluster on the 53.4 crisp hit",
  "Pink-noise swell (7–8 s) and riser (50–52 s)",
  "FX: Reverb (3.4 s, 320 Hz–6.5 kHz return), ping-pong delay (dotted 8th); master: 260 Hz −2.5 dB dip, +2 dB shelf at 7 kHz, 30 Hz high-pass, fast glue Compressor",
];

// ---------- harmony ----------
interface ChordSpan {
  t: number;
  end: number;
  sym: string;
  bass: string;
}

/** Per section: [bar offset from the section start, chord symbol, optional bass pitch class]. */
const PROGRESSIONS: Record<string, [number, string, string?][]> = {
  sprawl: [[0, "Dm9"], [2, "Bbmaj7"], [3, "Gm9"], [3.5, "C9sus4"]],
  reveal: [[0, "Fmaj9"], [1, "Am7"], [2, "Bbmaj9"], [2.5, "C9sus4"]],
  updates: [[0, "Fmaj9"], [1, "Dm9"], [2, "Bbmaj9"], [3, "Am7"], [4, "Gm9"], [5, "C9sus4"]],
  placement: [[0, "Fmaj9"], [1, "Am7"], [2, "Bbmaj9"], [3, "Gm9"], [3.5, "C9sus4"], [4, "Fadd9"]],
  governance: [[0, "Dm9"], [1, "Bbmaj9"], [2, "Fmaj7", "A"], [3, "Gm9"], [4, "C9sus4"]],
  reach: [[0, "Dm9"], [1, "Bbmaj9"], [2, "C9sus4"]],
  cta: [[0, "Fadd9"], [1, "Bbmaj9"], [2, RESOLVE]],
};

const CHORDS: ChordSpan[] = TL.music.sections.flatMap((s) => {
  const prog = PROGRESSIONS[s.id];
  if (!prog) throw new Error(`no progression for section ${s.id}`);
  return prog.map(([bar, sym, bass], i) => {
    const tonic = Chord.get(sym).tonic;
    if (!tonic) throw new Error(`Tonal cannot parse ${sym}`);
    const end = i + 1 < prog.length ? s.start + prog[i + 1][0] * BAR : s.end;
    return { t: s.start + bar * BAR, end, sym, bass: bass ?? tonic };
  });
});

// ---------- helpers ----------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const midi = (n: string): number => {
  const m = Note.midi(n);
  if (m === null) throw new Error(`bad note ${n}`);
  return m;
};
const hz = (m: number): number => 440 * 2 ** ((m - 69) / 12);
const chroma = (pc: string): number => {
  const c = Note.chroma(pc);
  if (c === undefined || Number.isNaN(c)) throw new Error(`bad pitch class ${pc}`);
  return c;
};
const round = (t: number): number => Math.round(t * 1e6) / 1e6;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const inSec = (t: number, s: { start: number; end: number }): boolean => t >= s.start - 1e-9 && t < s.end - 1e-9;

function chordAt(t: number): ChordSpan {
  const c = CHORDS.find((s) => t >= s.t - 1e-9 && t < s.end - 1e-9);
  if (!c) throw new Error(`no chord at ${t}`);
  return c;
}

/** Lowest MIDI note of pitch class `pc` at or above `lo`. */
function pitchAbove(pc: string, lo: number): number {
  return lo + ((chroma(pc) - lo) % 12 + 12) % 12;
}

/** Sub root in E1–D#2 (41–78 Hz). */
const bassRoot = (c: ChordSpan): number => pitchAbove(c.bass, midi("E1"));

/**
 * Close voicing of `sym` inside [lo, hi] (rootless when the chord has ≥ 5 tones), picking the
 * candidate with the least total movement from `prev` (voice leading), else the most central one.
 */
function voicing(sym: string, lo: number, hi: number, prev?: number[]): number[] {
  let pcs = Chord.get(sym).notes;
  if (pcs.length === 0) throw new Error(`Tonal cannot spell ${sym}`);
  if (pcs.length >= 5) pcs = pcs.slice(1);
  const options = pcs.map((pc) => {
    const out: number[] = [];
    for (let m = pitchAbove(pc, lo); m <= hi; m += 12) out.push(m);
    return out;
  });
  let best: number[] | null = null;
  let bestCost = Infinity;
  const visit = (i: number, acc: number[]): void => {
    if (i === options.length) {
      const v = [...acc].sort((a, b) => a - b);
      if (v[v.length - 1] - v[0] > 14) return;
      let cost = prev && prev.length === v.length
        ? v.reduce((s, m, k) => s + Math.abs(m - prev[k]), 0)
        : Math.abs((v[0] + v[v.length - 1]) / 2 - (lo + hi) / 2);
      if (v[1] - v[0] === 1) cost += 6; // no minor 2nd at the bottom
      if (cost < bestCost) {
        bestCost = cost;
        best = v;
      }
      return;
    }
    for (const m of options[i]) visit(i + 1, [...acc, m]);
  };
  visit(0, []);
  if (!best) throw new Error(`no voicing for ${sym} in ${lo}-${hi}`);
  return best;
}

/** Voice-led voicings for every chord span in one register. */
function voicingMap(lo: string, hi: string): Map<ChordSpan, number[]> {
  const map = new Map<ChordSpan, number[]>();
  let prev: number[] | undefined;
  for (const c of CHORDS) {
    prev = voicing(c.sym, midi(lo), midi(hi), prev);
    map.set(c, prev);
  }
  return map;
}

/** Two-octave ladder of a voicing (ascending). */
const ladder = (v: number[]): number[] => [...v, ...v.map((m) => m + 12)];

/** Iterate 16th steps in [from, to): callback gets time, step in the bar and the global step index. */
function eachStep(from: number, to: number, fn: (t: number, step: number, idx: number) => void): void {
  for (let i = Math.round(from / STEP); i < Math.round(to / STEP); i++) fn(round(i * STEP), i % 16, i);
}

/** Number of lit cluster glyphs at `t` in the sprawl: 1 from s01.glyph, doubling on each s02.double.N cue. */
function clustersAt(t: number): number {
  if (t < cue("s01.glyph")) return 0;
  let n = 1;
  for (let k = 1; `s02.double.${k}` in TL.cues; k++) if (t >= cue(`s02.double.${k}`)) n *= 2;
  return n;
}

/** Schedule the whole score on `context` (the context passed to the `Tone.Offline` callback). */
export async function buildScore(context: Tone.OfflineContext): Promise<void> {
  // Tone.Noise and Tone.Reverb draw from Math.random: seed it for reproducible renders.
  Math.random = mulberry32(SEED ^ 0x9e3779b9);
  const rng = mulberry32(SEED);
  const hum = (v: number): number => v * (0.9 + 0.1 * rng());
  const transport = context.transport;
  transport.bpm.value = BPM;
  const at = (t: number, fn: (time: number) => void): void => {
    if (t < 0 || t >= DURATION) throw new Error(`event at ${t} outside 0–${DURATION}`);
    transport.schedule(fn, round(t));
  };

  // ---------- buses ----------
  const out = new Tone.Gain(1).toDestination();
  const tailFade = new Tone.Gain(1).connect(out);
  const glue = new Tone.Compressor({ threshold: -16, ratio: 2.5, attack: 0.005, release: 0.15, knee: 8 }).connect(tailFade);
  const masterHpf = new Tone.Filter({ type: "highpass", frequency: 30, rolloff: -24 }).connect(glue);
  // Tone shaping: gentle low-mid dip against mud (pad, mid pluck, bass harmonics) and a little air.
  const airShelf = new Tone.Filter({ type: "highshelf", frequency: 7000, gain: 2 }).connect(masterHpf);
  const lowMidDip = new Tone.Filter({ type: "peaking", frequency: 260, Q: 0.9, gain: -2.5 }).connect(airShelf);
  const mix = new Tone.Gain(1).connect(lowMidDip);

  const reverb = new Tone.Reverb({ decay: 3.4, preDelay: 0.025, wet: 1 });
  await reverb.ready;
  reverb.chain(new Tone.Filter({ type: "highpass", frequency: 320 }), new Tone.Filter({ type: "lowpass", frequency: 6500 }), mix);
  const delay = new Tone.PingPongDelay({ delayTime: 3 * STEP, feedback: 0.3, wet: 1 });
  delay.chain(new Tone.Filter({ type: "highpass", frequency: 380 }), new Tone.Filter({ type: "lowpass", frequency: 4200 }), mix);
  const send = (node: Tone.ToneAudioNode, rv: number, dl = 0): void => {
    if (rv > 0) node.connect(new Tone.Gain(rv).connect(reverb));
    if (dl > 0) node.connect(new Tone.Gain(dl).connect(delay));
  };

  // Sidechain: the kick ducks the sub/bass bus hard and the pad/arp bus lightly.
  const subBus = new Tone.Gain(1).connect(mix);
  const pumpBus = new Tone.Gain(1).connect(mix);
  const kitBus = new Tone.Gain(1).connect(mix);

  // ---------- instruments ----------
  interface Pluck {
    synth: Tone.PolySynth<Tone.FMSynth>;
    panner: Tone.Panner;
    tone: Tone.Filter;
  }
  const makePluck = (o: {
    harmonicity: number; index: number; decay: number; modDecay: number; volume: number;
    lp: number; hp: number; pan: number; rv: number; dl: number;
  }): Pluck => {
    const synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: o.harmonicity,
      modulationIndex: o.index,
      oscillator: { type: "sine" },
      modulation: { type: "sine" },
      envelope: { attack: 0.002, decay: o.decay, sustain: 0, release: o.decay * 0.6 },
      modulationEnvelope: { attack: 0.001, decay: o.modDecay, sustain: 0, release: 0.05 },
      volume: o.volume,
    });
    synth.maxPolyphony = 16;
    const hp = new Tone.Filter({ type: "highpass", frequency: o.hp });
    const tone = new Tone.Filter({ type: "lowpass", frequency: o.lp, Q: 0.5 });
    const panner = new Tone.Panner(o.pan);
    synth.chain(hp, tone, panner, pumpBus);
    send(panner, o.rv, o.dl);
    return { synth, panner, tone };
  };

  const dot = makePluck({ harmonicity: 2, index: 5, decay: 0.3, modDecay: 0.08, volume: -19, lp: 4800, hp: 220, pan: 0, rv: 0.2, dl: 0.16 });
  const dotTwin = makePluck({ harmonicity: 2, index: 5, decay: 0.3, modDecay: 0.08, volume: -22, lp: 3000, hp: 220, pan: 0, rv: 0.3, dl: 0.2 });
  const arp2 = makePluck({ harmonicity: 3, index: 3, decay: 0.2, modDecay: 0.05, volume: -21, lp: 5500, hp: 400, pan: -0.45, rv: 0.2, dl: 0.2 });
  const arp3 = makePluck({ harmonicity: 1, index: 2.5, decay: 0.34, modDecay: 0.12, volume: -19, lp: 2400, hp: 250, pan: 0.4, rv: 0.16, dl: 0.08 });
  const arp4 = makePluck({ harmonicity: 5, index: 1.2, decay: 0.16, modDecay: 0.04, volume: -25, lp: 7000, hp: 900, pan: 0, rv: 0.3, dl: 0.25 });

  // Glassy bell (motif): inharmonic FM + sine octave shimmer.
  const bellOut = new Tone.Filter({ type: "lowpass", frequency: 6500, Q: 0.5 });
  bellOut.chain(new Tone.Filter({ type: "highpass", frequency: 300 }), mix);
  send(bellOut, 0.42, 0.22);
  const bell = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.5,
    modulationIndex: 2.6,
    oscillator: { type: "sine" },
    modulation: { type: "sine" },
    envelope: { attack: 0.002, decay: 2.6, sustain: 0, release: 2.2 },
    modulationEnvelope: { attack: 0.002, decay: 0.9, sustain: 0.05, release: 0.8 },
    volume: -19.5,
  }).connect(bellOut);
  bell.maxPolyphony = 16;
  const shimmer = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.004, decay: 1.2, sustain: 0, release: 1 },
    volume: -28,
  }).connect(bellOut);
  shimmer.maxPolyphony = 16;

  // Warm pad.
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 26 },
    envelope: { attack: 0.9, decay: 1.0, sustain: 0.8, release: 2.0 },
    volume: -27,
  });
  pad.maxPolyphony = 24;
  const padLevel = new Tone.Gain(0);
  const padTone = new Tone.Filter({ type: "lowpass", frequency: 300, Q: 0.4, rolloff: -24 });
  const padChorus = new Tone.Chorus({ frequency: 0.5, delayTime: 4, depth: 0.55, spread: 180, wet: 0.5 }).start();
  pad.chain(new Tone.Filter({ type: "highpass", frequency: 260 }), padTone, padChorus, padLevel, pumpBus);
  send(padLevel, 0.35);

  // Sub pulse + octave for small speakers.
  const sub = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.012, decay: 0.2, sustain: 0.4, release: 0.1 }, volume: -25 }).connect(subBus);
  const subTop = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.008, decay: 0.15, sustain: 0.3, release: 0.08 }, volume: -29 });
  subTop.chain(new Tone.Filter({ type: "lowpass", frequency: 700 }), subBus);

  const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { type: "lowpass", Q: 1, rolloff: -24 },
    filterEnvelope: { attack: 0.002, decay: 0.14, sustain: 0.15, release: 0.08, baseFrequency: 160, octaves: 2.3 },
    envelope: { attack: 0.004, decay: 0.2, sustain: 0.25, release: 0.06 },
    volume: -21,
  });
  bass.chain(new Tone.Filter({ type: "highpass", frequency: 70 }), subBus);

  // Kit.
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.032, octaves: 4.5, oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.05 }, volume: -19,
  }).connect(kitBus);
  const clapTone = new Tone.Filter({ type: "bandpass", frequency: 1500, Q: 0.8 });
  clapTone.chain(new Tone.Filter({ type: "lowpass", frequency: 5000 }), kitBus);
  send(clapTone, 0.22);
  const clap = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.003, decay: 0.15, sustain: 0 }, volume: -19 }).connect(clapTone);
  const snareBody = new Tone.MembraneSynth({
    pitchDecay: 0.02, octaves: 1.5, oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.11, sustain: 0, release: 0.03 }, volume: -21,
  }).connect(kitBus);
  const hatPan = new Tone.Panner(0).connect(kitBus);
  const hatTone = new Tone.Filter({ type: "highpass", frequency: 8000 }).connect(hatPan);
  const hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.032, sustain: 0 }, volume: -23 }).connect(hatTone);
  const ohat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.002, decay: 0.22, sustain: 0 }, volume: -29 }).connect(hatTone);
  // Felt-muted clock tick: soft onset, low-passed, well under the plucks.
  const tickTone = new Tone.Filter({ type: "lowpass", frequency: 1800 });
  tickTone.chain(new Tone.Filter({ type: "highpass", frequency: 500 }), new Tone.Panner(0.2), kitBus);
  const tick = new Tone.MembraneSynth({
    pitchDecay: 0.006, octaves: 1.2, oscillator: { type: "sine" },
    envelope: { attack: 0.002, decay: 0.035, sustain: 0, release: 0.01 }, volume: -24,
  }).connect(tickTone);
  const crashTone = new Tone.Filter({ type: "highpass", frequency: 4500 });
  crashTone.chain(new Tone.Filter({ type: "lowpass", frequency: 11000 }), kitBus);
  send(crashTone, 0.3);
  const crash = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.002, decay: 1.8, sustain: 0 }, volume: -27 }).connect(crashTone);
  const boom = new Tone.MembraneSynth({
    pitchDecay: 0.14, octaves: 2.2, oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 1.1, sustain: 0, release: 0.3 }, volume: -21,
  });
  boom.chain(new Tone.Filter({ type: "lowpass", frequency: 240 }), mix);

  // Noise swell (into the reveal) and riser (into the CTA).
  const makeRiser = (from: number, to: number, f0: number, f1: number, peak: number): void => {
    const g = new Tone.Gain(0).connect(mix);
    const bp = new Tone.Filter({ type: "bandpass", frequency: f0, Q: 1.4 }).connect(g);
    send(bp, 0.3);
    new Tone.Noise("pink").connect(bp).start(from).stop(to + 0.06);
    bp.frequency.setValueAtTime(f0, from);
    bp.frequency.exponentialRampToValueAtTime(f1, to);
    g.gain.setValueAtTime(0.0001, from);
    g.gain.exponentialRampToValueAtTime(peak, to - 0.02);
    g.gain.linearRampToValueAtTime(0, to + 0.04);
  };

  // ---------- note helpers ----------
  const duck = (time: number, depth: number): void => {
    subBus.gain.cancelScheduledValues(time);
    subBus.gain.setValueAtTime(1 - depth, time);
    subBus.gain.linearRampToValueAtTime(1, time + 0.16);
    pumpBus.gain.cancelScheduledValues(time);
    pumpBus.gain.setValueAtTime(1 - depth * 0.3, time);
    pumpBus.gain.linearRampToValueAtTime(1, time + 0.2);
  };
  // Drum hits are collected first and scheduled at the end: when two parts hit the same drum at the
  // same time (a section hit on a groove downbeat, a roll over a backbeat) the louder one wins, since
  // Tone's monophonic sources cannot restart at an identical start time.
  const drumHits = new Map<string, { t: number; vel: number; play: (time: number, v: number) => void }>();
  const drum = (name: string, t: number, vel: number, play: (time: number, v: number) => void): void => {
    const key = `${name}@${round(t)}`;
    const v = hum(vel);
    const prev = drumHits.get(key);
    if (!prev || prev.vel < v) drumHits.set(key, { t, vel: v, play });
  };
  const hitKick = (t: number, vel: number): void =>
    drum("kick", t, vel, (time, v) => {
      kick.triggerAttackRelease("A1", 0.15, time, v);
      duck(time, 0.65 * v);
    });
  const hitClap = (t: number, vel: number, body = 0.6): void =>
    drum("clap", t, vel, (time, v) => {
      clap.triggerAttackRelease(0.12, time, v);
      if (body > 0) snareBody.triggerAttackRelease("D3", 0.08, time, v * body);
    });
  const hitHat = (t: number, vel: number, pan = 0): void =>
    drum("hat", t, vel, (time, v) => {
      hatPan.pan.setValueAtTime(pan, time);
      hat.triggerAttackRelease(0.03, time, v);
    });
  const hitOhat = (t: number, vel: number): void =>
    drum("hat", t, vel, (time, v) => {
      hatPan.pan.setValueAtTime(0, time);
      ohat.triggerAttackRelease(0.2, time, v);
    });
  const hitTick = (t: number, vel: number): void => drum("tick", t, vel, (time, v) => tick.triggerAttackRelease("C6", 0.03, time, v));
  const hitCrash = (t: number, vel: number): void => drum("crash", t, vel, (time, v) => crash.triggerAttackRelease(1.6, time, v));
  const playSub = (t: number, m: number, dur: number, vel: number): void =>
    at(t, (time) => {
      sub.triggerAttackRelease(hz(m), dur, time, vel);
      subTop.triggerAttackRelease(hz(m + 12), dur, time, vel);
    });
  const pluckNote = (p: Pluck, t: number, freq: number, dur: number, vel: number, pan?: number): void =>
    at(t, (time) => {
      if (pan !== undefined) p.panner.pan.setValueAtTime(pan, time);
      p.synth.triggerAttackRelease(freq, dur, time, vel);
    });

  const dotVoices = voicingMap("F4", "E5");
  const arp2Voices = voicingMap("C5", "C6");
  const arp3Voices = voicingMap("A3", "G4");
  const arp4Voices = voicingMap("C6", "C7");

  // ---------- sprawl (Dm, energy 2 → 5): sparse, detuned, off the grid ----------
  {
    const { start, end } = S.sprawl;
    const driftA = cue("s02.drift.start");
    const driftB = cue("s02.drift.end");
    let idx = 2;
    eachStep(start, end, (t, step) => {
      const x = (t - start) / (end - start);
      const forced = Math.abs(t - cue("s01.glyph")) < 1e-9; // first dot lights with the first glyph
      const density = 0.2 + 0.5 * x ** 1.3;
      if (!forced && (t < cue("s01.glyph") || rng() >= density)) return;
      const lad = ladder(dotVoices.get(chordAt(t))!);
      idx = Math.min(lad.length - 1, Math.max(0, idx + [-2, -1, 1, 2, 1, -1][Math.floor(rng() * 6)]));
      const m = lad[idx];
      const jitter = (rng() * 2 - 1) * 0.022;
      const drift = t >= driftA && t < driftB ? 22 + 20 * (t - driftA) / (driftB - driftA) : 0;
      const detune = 9 + 6 * x + drift;
      const vel = (0.6 + 0.3 * x) * (step % 4 === 0 ? 1 : 0.85);
      const pan = (rng() * 2 - 1) * 0.5;
      pluckNote(dot, Math.max(0, t + jitter), hz(m - detune / 200), 0.12, hum(vel), pan);
      pluckNote(dotTwin, Math.max(0, t + jitter + 0.011), hz(m + detune / 200), 0.12, hum(vel * 0.9), -pan);
    });
    // Off-grid hats: density follows the number of lit clusters.
    eachStep(start, end, (t) => {
      const n = clustersAt(t);
      if (n === 0) return;
      const p = Math.min(0.62, 0.06 + 0.09 * Math.log2(n));
      if (rng() >= p) return;
      const jitter = (rng() * 2 - 1) * 0.035;
      hitHat(Math.max(0, t + jitter), 0.22 + 0.3 * rng(), (rng() * 2 - 1) * 0.7);
    });
    // Sub: half notes for the first two bars, then quarters.
    eachStep(start, end, (t, step) => {
      const half = t < start + 2 * BAR;
      if (half ? step % 8 !== 0 : step % 4 !== 0) return;
      const x = (t - start) / (end - start);
      playSub(t, bassRoot(chordAt(t)), half ? 0.7 : 0.34, 0.22 + 0.48 * x);
    });
    // Soft heartbeat kicks as the clusters multiply.
    for (const [t, v] of [[4, 0.45], [6, 0.55], [7, 0.6], [7.5, 0.62]] as const) hitKick(start + t, v);
    makeRiser(end - 1, end, 400, 5200, 0.14);
  }

  // ---------- grooves ----------
  /** Straight groove: four-on-the-floor, clap 2 & 4, off-beat hats (+16th ghosts when `busy`), 8th ticks. */
  const groove = (from: number, to: number, level: (t: number) => number, busy: boolean, openHats: boolean): void =>
    eachStep(from, to, (t, step) => {
      const L = level(t);
      if (step % 4 === 0) hitKick(t, (step === 0 ? 0.95 : 0.82) * L);
      if (step === 4 || step === 12) hitClap(t, 0.62 * L);
      if (step % 2 === 0) hitTick(t, (step % 4 === 0 ? 0.55 : 0.4) * L);
      if (openHats && (step === 6 || step === 14)) hitOhat(t, 0.5 * L);
      else if (step % 4 === 2) hitHat(t, 0.55 * L, 0.15);
      else if (busy && step % 2 === 1) hitHat(t, 0.24 * L, -0.15);
    });
  const snareRoll = (from: number, to: number, v0: number, v1: number): void =>
    eachStep(from, to, (t) => hitClap(t, v0 + (v1 - v0) * (t - from) / (to - from), 0.8));

  // Reveal: kick on 1 and 3, 8th ticks, light off-beat hats.
  eachStep(S.reveal.start, S.reveal.end, (t, step) => {
    if (step === 0 || step === 8) hitKick(t, step === 0 ? 0.9 : 0.72);
    if (step % 2 === 0) hitTick(t, step % 4 === 0 ? 0.5 : 0.36);
    if (step % 4 === 2) hitHat(t, 0.32, 0.15);
  });
  hitClap(S.reveal.end - BEAT, 0.35);

  // Updates: steady groove rising 6 → 7 (16th hat ghosts from the second stage, open hats from the
  // third); snare fill into the placement slam.
  {
    const { start, end } = S.updates;
    const level = (t: number): number => 0.86 + 0.14 * (t - start) / (end - start);
    groove(start, LAYER_ADDS[1], level, false, false);
    groove(LAYER_ADDS[1], LAYER_ADDS[2], level, true, false);
    groove(LAYER_ADDS[2], end - BEAT, level, true, true);
    snareRoll(end - BEAT, end, 0.3, 0.7);
  }
  // Placement: busier groove; breath before the governance slam.
  groove(S.placement.start, S.placement.end - BEAT, () => 1, true, true);
  hitKick(S.placement.end - BEAT, 0.8);

  // Governance: half-time (kick on 1, snare on 3, ticks on quarters), rebuilding over the last bar.
  {
    const { start, end } = HALF_TIME;
    eachStep(start, end - BAR, (t, step) => {
      if (step === 0) hitKick(t, 0.75);
      if (step === 11) hitKick(t, 0.4);
      if (step === 8) hitClap(t, 0.5, 0.9);
      if (step % 4 === 0) hitTick(t, 0.3);
      if (step % 4 === 2) hitHat(t, 0.22, 0.2);
    });
    eachStep(end - BAR, end, (t, step) => {
      const x = (t - (end - BAR)) / BAR;
      if (step % 4 === 0) hitKick(t, 0.6 + 0.3 * x);
      if (step % 2 === 0) hitTick(t, 0.4);
      hitHat(t, 0.15 + 0.35 * x, step % 2 ? -0.2 : 0.2);
    });
    snareRoll(end - BEAT, end, 0.25, 0.65);
  }

  // Reach: full kit, riser + roll into the CTA hit.
  {
    const { start, end } = S.reach;
    groove(start, end - BEAT, () => 1.08, true, true);
    eachStep(end - BAR, end - BEAT, (t, step) => {
      if (step % 2 === 0) hitClap(t, 0.2 + 0.25 * (t - (end - BAR)) / BAR, 0.5);
    });
    snareRoll(end - BEAT, end, 0.5, 0.85);
    makeRiser(end - BAR, end, 300, 6500, 0.3);
  }

  // CTA: hit, then the kit drops out; soft ticks under the motif, gone by the resolve.
  {
    const { start } = S.cta;
    eachStep(cue("s11.crisp"), start + 2 * BAR, (t, step) => {
      if (step % 4 === 0) hitTick(t, 0.32);
    });
  }

  // ---------- hits ----------
  const sectionStarts = new Set(TL.music.sections.map((s) => s.start));
  for (const t of HITS) {
    if (sectionStarts.has(t)) {
      const big = t === S.reveal.start || t === S.reach.start || t === S.cta.start;
      hitKick(t, 1);
      hitCrash(t, big ? 0.85 : 0.6);
      at(t, (time) => boom.triggerAttackRelease("F1", 0.8, time, big ? 1 : 0.7));
    } else {
      // Crisp accent (icon cross-steps to vector): bell cluster + light crash.
      const v = voicing("Fadd9", midi("C6"), midi("D7"));
      v.forEach((m, k) => at(t + k * 0.018, (time) => bell.triggerAttackRelease(hz(m), 0.6, time, 0.32)));
      hitCrash(t, 0.4);
      hitKick(t, 0.55);
    }
  }

  // ---------- sub pulse (quarters; half notes in the half-time section) ----------
  eachStep(S.reveal.start, S.cta.start + 2 * BAR, (t, step) => {
    const half = inSec(t, HALF_TIME) && t < HALF_TIME.end - BAR;
    if (half ? step % 8 !== 0 : step % 4 !== 0) return;
    const c = chordAt(t);
    const vel = inSec(t, S.cta) ? 0.4 : half ? 0.42 : step === 0 ? 0.78 : 0.66;
    playSub(t, bassRoot(c), half ? 0.8 : 0.34, vel);
  });
  // Resolve: one long sub note under the final chord.
  playSub(S.cta.start + 2 * BAR, bassRoot(chordAt(S.cta.start + 2 * BAR)), 1.6, 0.35);

  // ---------- mid bass (8ths, octave bounce) in placement and reach ----------
  for (const s of [S.placement, S.reach]) {
    eachStep(s.start, s.end - BEAT, (t, step) => {
      if (step % 2 !== 0) return;
      const c = chordAt(t);
      const m = bassRoot(c) + 12 + (step % 4 === 2 ? 12 : 0);
      const vel = hum(step % 4 === 0 ? 0.8 : 0.6) * (s === S.reach ? 1.1 : 1);
      at(t, (time) => bass.triggerAttackRelease(hz(m), STEP * 1.6, time, vel));
    });
  }

  // ---------- dot arp (locked grid from the reveal) ----------
  {
    let up = 0;
    const play = (t: number, step: number, vel: number, dur = 0.12): void => {
      const lad = ladder(dotVoices.get(chordAt(t))!);
      const cyc = [...lad, ...lad.slice(1, -1).reverse()];
      const m = cyc[up++ % cyc.length];
      pluckNote(dot, t, hz(m), dur, hum(vel * (step % 4 === 0 ? 1 : step % 2 === 0 ? 0.8 : 0.66)));
    };
    const climb = (t: number, step: number, vel: number): void => {
      // Placement/reach: strictly ascending across two octaves (contrary to arp 3).
      const lad = ladder(dotVoices.get(chordAt(t))!);
      const m = lad[Math.floor(t / STEP) % lad.length];
      pluckNote(dot, t, hz(m), 0.12, hum(vel * (step % 4 === 0 ? 1 : 0.72)));
    };
    eachStep(S.reveal.start, S.cta.start, (t, step) => {
      if (inSec(t, S.reveal)) play(t, step, 0.6 + 0.2 * clamp01((t - S.reveal.start) / 2));
      else if (inSec(t, S.updates)) play(t, step, 0.75);
      else if (inSec(t, S.placement)) climb(t, step, 0.8);
      else if (inSec(t, HALF_TIME)) {
        const rebuild = t >= HALF_TIME.end - BAR;
        if (rebuild || step % 2 === 0) play(t, step, rebuild ? 0.7 : 0.5, rebuild ? 0.12 : 0.22);
      } else if (inSec(t, S.reach)) climb(t, step, 0.85);
    });
    // CTA: collapse 52 → crisp (fading 16ths), then soft 8ths under the motif until the resolve.
    const crisp = cue("s11.crisp");
    eachStep(S.cta.start, S.cta.start + 2 * BAR, (t, step) => {
      if (t < crisp) play(t, step, 0.85 * (1 - (t - S.cta.start) / (crisp - S.cta.start)) + 0.1);
      else if (step % 2 === 0 && t >= S.cta.start + BAR) play(t, step, 0.42, 0.2);
    });
  }
  // Arp filter: calmer in the half-time section.
  dot.tone.frequency.setValueAtTime(4800, HALF_TIME.start);
  dot.tone.frequency.linearRampToValueAtTime(1900, HALF_TIME.start + 0.5);
  dot.tone.frequency.setValueAtTime(1900, HALF_TIME.end - BAR);
  dot.tone.frequency.linearRampToValueAtTime(4800, HALF_TIME.end);

  // ---------- arp voice 2: 8th off-beats, from the first stage ----------
  {
    let k = 0;
    const spans: [number, number][] = [[LAYER_ADDS[0], S.placement.end - BAR], [S.reach.start, S.reach.end]];
    for (const [a, b] of spans)
      eachStep(a, b, (t, step) => {
        if (step % 4 !== 2) return;
        const v = arp2Voices.get(chordAt(t))!;
        const m = [...v].reverse()[k++ % v.length];
        pluckNote(arp2, t, hz(m), 0.1, hum(0.6));
      });
  }
  // ---------- arp voice 3: 3-3-2 mid pluck (updates), contrary descending 16ths (placement, reach) ----------
  {
    const RHY = [0, 3, 6, 8, 11, 14];
    let k = 0;
    eachStep(LAYER_ADDS[1], S.updates.end, (t, step) => {
      if (!RHY.includes(step)) return;
      const lad = ladder(arp3Voices.get(chordAt(t))!);
      pluckNote(arp3, t, hz(lad[lad.length - 1 - (k++ % lad.length)]), 0.18, hum(0.62));
    });
    for (const s of [S.placement, S.reach])
      eachStep(s.start, s.end - BEAT, (t, step) => {
        const lad = ladder(arp3Voices.get(chordAt(t))!);
        const m = lad[lad.length - 1 - (Math.floor(t / STEP) % lad.length)];
        pluckNote(arp3, t, hz(m), 0.12, hum(step % 4 === 0 ? 0.6 : 0.42));
      });
  }
  // ---------- arp voice 4: glass sparkle every third 16th ----------
  {
    const spans: [number, number][] = [
      [LAYER_ADDS[2], S.placement.end - BAR],
      [HALF_TIME.start + BAR, HALF_TIME.end],
      [S.reach.start, S.reach.end],
    ];
    for (const [a, b] of spans)
      eachStep(a, b, (t, _step, idx) => {
        const sparse = inSec(t, HALF_TIME);
        if (idx % (sparse ? 6 : 3) !== 1) return;
        const v = arp4Voices.get(chordAt(t))!;
        const m = v[Math.floor(idx / 3) % v.length];
        pluckNote(arp4, t, hz(m), 0.08, hum(sparse ? 0.3 : 0.55), idx % 2 ? 0.55 : -0.55);
      });
  }

  // ---------- pad (from the reveal) ----------
  {
    const padVoices = voicingMap("E3", "C5");
    for (const c of CHORDS) {
      if (c.t < S.reveal.start) continue;
      const final = c === CHORDS[CHORDS.length - 1];
      const notes = padVoices.get(c)!.map(hz);
      const dur = final ? 1.2 : c.end - c.t - 0.05;
      at(c.t, (time) => pad.triggerAttackRelease(notes, dur, time, 0.8));
    }
    // Level and brightness per section (ordered automation).
    const L = padLevel.gain;
    const F = padTone.frequency;
    L.setValueAtTime(0, 0);
    L.setValueAtTime(0.2, S.reveal.start);
    L.linearRampToValueAtTime(1, S.reveal.start + 1.2);
    L.linearRampToValueAtTime(0.85, S.reveal.start + 3);
    F.setValueAtTime(300, S.reveal.start);
    F.exponentialRampToValueAtTime(2200, S.reveal.start + 1.5);
    // Updates: dips on the slam, then lifts with each arp layer.
    L.setValueAtTime(0.85, S.updates.start);
    L.linearRampToValueAtTime(0.7, S.updates.start + 0.5);
    LAYER_ADDS.forEach((t, k) => {
      L.setValueAtTime(0.7 + 0.08 * k, t);
      L.linearRampToValueAtTime(0.78 + 0.08 * k, t + 0.5);
    });
    L.setValueAtTime(0.94, S.placement.start);
    L.linearRampToValueAtTime(0.85, S.placement.start + 0.5);
    F.setValueAtTime(2200, S.placement.start);
    F.linearRampToValueAtTime(2600, S.placement.start + 0.5);
    // Governance: pad forward = brighter while everything else thins out.
    F.setValueAtTime(2600, HALF_TIME.start);
    F.linearRampToValueAtTime(3600, HALF_TIME.start + 1);
    L.setValueAtTime(0.85, S.reach.start);
    L.linearRampToValueAtTime(1, S.reach.start + 0.5);
    L.setValueAtTime(1, S.cta.start + BAR);
    L.linearRampToValueAtTime(0.8, S.cta.start + BAR + 0.5);
    L.setValueAtTime(0.8, S.cta.start + 2 * BAR);
    L.linearRampToValueAtTime(0.65, S.cta.start + 2 * BAR + 1);
    F.setValueAtTime(3600, S.cta.start + 2 * BAR);
    F.exponentialRampToValueAtTime(900, TAIL_END);
  }

  // ---------- bell motif F–A–C–G (Tonal: F major degrees 1-3-5-2) ----------
  {
    const fMajor = Scale.get("F major").notes;
    const motif = [0, 2, 4, 1].map((d) => fMajor[d]);
    const pitches = [midi(`${motif[0]}5`), midi(`${motif[1]}5`), midi(`${motif[2]}6`), midi(`${motif[3]}5`)];
    const rhythm = [0, 3 * STEP, 6 * STEP, 8 * STEP];
    const lengths = [0.3, 0.3, 0.25, 1.6];
    const vels = [0.78, 0.72, 0.8, 0.9];
    for (const t0 of MOTIF_AT) {
      const finale = inSec(t0, S.cta);
      pitches.forEach((m, k) => {
        const t = t0 + rhythm[k];
        at(t, (time) => {
          bell.triggerAttackRelease(hz(m), lengths[k], time, vels[k]);
          shimmer.triggerAttackRelease(hz(m + 12), lengths[k], time, vels[k] * 0.8);
          if (finale) bell.triggerAttackRelease(hz(m - 12), lengths[k], time, vels[k] * 0.4);
        });
      });
    }
  }

  // ---------- resolve: bell strum on the final chord ----------
  {
    const t = S.cta.start + 2 * BAR;
    const v = voicing(RESOLVE, midi("F4"), midi("G5"));
    const strum = [...v, ...v.map((m) => m + 12)];
    strum.forEach((m, k) => at(t + k * 0.06, (time) => bell.triggerAttackRelease(hz(m), 1.4, time, 0.36 - k * 0.025)));
  }

  // ---------- ring out by the timeline's tailEnd ----------
  tailFade.gain.setValueAtTime(1, TAIL_END - 1.6);
  tailFade.gain.exponentialRampToValueAtTime(0.001, TAIL_END);
  tailFade.gain.setValueAtTime(0, TAIL_END + 0.001);

  for (const { t, vel, play } of drumHits.values()) at(t, (time) => play(time, vel));

  transport.start(0);
}
