// Score for "How the Internet Routes a Request": 45.0 s, 120 BPM 4/4, F major / D minor colour.
// Bright lo-fi chiptune with a city-pop tinge. Tone.js does synthesis, sequencing and effects;
// Tonal does chord spelling, voicing and scale math. `buildScore(context)` runs inside
// `Tone.Offline` and schedules everything on the offline context's Transport.
//
// Grid: bars start at 0.00 (1 bar = 2.0 s, 1 step = one 16th = 0.125 s). 22 bars of 4/4 plus a
// closing 2/4 bar (44.0–45.0) so the file ends on a downbeat. The 2/4 bar sits on the dominant (C)
// and resolves into bar 1's F, and the tape bed fades out past 45.0 while it fades in from 0.0, so
// render-music.ts can fold the 45–46 s tail onto the head for a seamless loop.
//
// Melodic lead (square/pulse) plays only in VO gaps (script/script.json, measured pauses of
// audio/voice/voiceover.wav). Under narration: pads, arps, bells, bass and kit only.
// No ducking here; the mix stage ducks.
import * as Tone from "tone";
import { Chord, Note, Scale } from "tonal";

export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = 4 * BEAT;
export const STEP = BEAT / 4;
export const LOOP_SECONDS = 45;
/** Rendered length: one extra second catches release/reverb spill for the loop fold. */
export const RENDER_SECONDS = 46;
export const SAMPLE_RATE = 48000;
export const SEED = 0x1e7c0de5;
export const KEY = "F major (D minor colour); borrowed A7 (V/vi) and Bbm6 (minor iv) for city-pop colour";

export interface Section {
  id: string;
  start: number;
  end: number;
  name: string;
  parts: string;
}

export const SECTIONS: Section[] = [
  { id: "A", start: 0, end: 2.5, name: "Hook bed", parts: "tape/vinyl bed + sine-sub pulse on beats (F). No lead." },
  { id: "B", start: 2.5, end: 5.5, name: "Promise", parts: "FM-bell 3-3-2 arpeggio enters at 2.50 (Fmaj7 → Dm9), sub pulse; bell motif in the VO gap 4.50–5.38." },
  { id: "C", start: 5.5, end: 13.0, name: "01 DNS", parts: "kick on the 5.50 slam, light crushed kick + hats, bells, soft pad (Bbmaj7 Am7 Gm7); fill 12.0–13.0 + lead pickup 12.625–13.2." },
  { id: "D", start: 13.0, end: 20.0, name: "02 Packets groove", parts: "groove enters on 13.00 (crash): sub bassline + octave double, crushed kit, light EP stabs, bell pings, pulse arp from 16.0; lead 2-note answer 16.625–17.1; open hats + riser 19.0–20.0." },
  { id: "E", start: 20.0, end: 28.8, name: "03 Routing peak", parts: "full kit with ghosts and 16th hats, busier bass, full EP, pad, arp, bell pings over Bbmaj7 A7 Dm9 Cm7-F7; lead only in gaps 23.75–24.33 and 25.875–26.125." },
  { id: "F", start: 28.8, end: 30.0, name: "Link-fail tension", parts: "bit-crush (16 → 5 bits) + low-pass (20 kHz → 520 Hz) sweep on the whole groove, Bbmaj7 → Bbm6, snare roll into 30.0. Lead silent." },
  { id: "G", start: 30.0, end: 31.5, name: "Reroute resolve", parts: "filter/crush snap open on the 30.00 downbeat, groove on F/A, last kick 31.375." },
  { id: "H", start: 31.5, end: 32.25, name: "Drop", parts: "near-silence: everything but the tape bed fades out 31.50–31.75." },
  { id: "I", start: 32.25, end: 35.0, name: "Arrival pad", parts: "soft pad Dm9 → Bbmaj7, no drums; bell phrase in the 34.50–34.90 gap." },
  { id: "J", start: 35.0, end: 38.0, name: "Response (light return)", parts: "bells + sub pulse + soft hats/kick, pad Gm7 → C9sus4; lead pickup 37.75 landing on the 38.00 tonic." },
  { id: "K", start: 38.0, end: 42.5, name: "Payoff lift", parts: "F tonic (Fmaj9) lift: crash, groove kit, bass, EP, pad, bells, arp; bell sparkle 42.375–42.69." },
  { id: "L", start: 42.5, end: 45.0, name: "Loop bridge", parts: "back to the S01 bed: tape bed + sine-sub pulse Bb (IV) → C (V, 2/4 bar) resolving to F at 0.00." },
];

export const INSTRUMENTS = [
  "Pulse lead (Tone.Synth, 25 % pulse) — VO gaps only",
  "Soft FM bells (PolySynth<FMSynth>, ratio 3.5)",
  "FM electric-piano stabs (PolySynth<FMSynth>, ratio 1) — city-pop comping",
  "Pulse arp (Tone.Synth, 12.5 % pulse, low-passed)",
  "Warm pad (PolySynth<Synth>, fat triangle, chorus)",
  "Sine sub bass + triangle octave double (for phones)",
  "Bit-crushed kit: MembraneSynth kick, noise+membrane snare, noise hats/open hat/crash → BitCrusher",
  "Pink-noise riser (19.0–20.0)",
  "Tape/vinyl bed (seeded pink noise + hiss + crackle, loop-faded)",
  "FX: Reverb, Chorus, Vibrato (tape wow), groove Filter + BitCrusher sweep, glue Compressor",
];

interface ChordSpan {
  t: number;
  end: number;
  sym: string;
  bass: string;
}

// Harmony. `sym` is spelled by Tonal; `bass` is the sub/bass root.
const CHORDS: ChordSpan[] = [
  { t: 0, end: 4, sym: "Fmaj7", bass: "F" },
  { t: 4, end: 6, sym: "Dm9", bass: "D" },
  { t: 6, end: 8, sym: "Bbmaj7", bass: "Bb" },
  { t: 8, end: 10, sym: "Am7", bass: "A" },
  { t: 10, end: 12, sym: "Gm7", bass: "G" },
  { t: 12, end: 14, sym: "C9sus4", bass: "C" },
  { t: 14, end: 16, sym: "Fmaj9", bass: "F" },
  { t: 16, end: 18, sym: "Dm9", bass: "D" },
  { t: 18, end: 19, sym: "Gm9", bass: "G" },
  { t: 19, end: 20, sym: "C7", bass: "C" },
  { t: 20, end: 22, sym: "Bbmaj7", bass: "Bb" },
  { t: 22, end: 24, sym: "A7", bass: "A" },
  { t: 24, end: 26, sym: "Dm9", bass: "D" },
  { t: 26, end: 27, sym: "Cm7", bass: "C" },
  { t: 27, end: 28, sym: "F7", bass: "F" },
  { t: 28, end: 29, sym: "Bbmaj7", bass: "Bb" },
  { t: 29, end: 30, sym: "Bbm6", bass: "Bb" },
  { t: 30, end: 32, sym: "Fmaj7", bass: "A" },
  { t: 32, end: 34, sym: "Dm9", bass: "D" },
  { t: 34, end: 36, sym: "Bbmaj7", bass: "Bb" },
  { t: 36, end: 37, sym: "Gm7", bass: "G" },
  { t: 37, end: 38, sym: "C9sus4", bass: "C" },
  { t: 38, end: 42.5, sym: "Fmaj9", bass: "F" },
  { t: 42.5, end: 44, sym: "Bbmaj7", bass: "Bb" },
  { t: 44, end: 45, sym: "C7sus4", bass: "C" },
];

/** Lead phrases: [time, note, length s]. Every phrase sits inside a measured VO pause. */
const LEAD: [number, string, number][] = [
  // 12.54–13.23 gap: pickup into the groove.
  [12.625, "G5", 0.11], [12.75, "A5", 0.11], [12.875, "Bb5", 0.11], [13.0, "C6", 0.19],
  // 16.54–17.21 gap: two-note answer (S06).
  [16.625, "E6", 0.11], [16.875, "D6", 0.22],
  // 23.65–24.38 gap: A7 → Dm9 turn.
  [23.75, "A5", 0.11], [23.875, "C#6", 0.11], [24.0, "E6", 0.11], [24.125, "D6", 0.2],
  // 25.86–26.18 dash gap in v09.
  [25.875, "C6", 0.11], [26.0, "Bb5", 0.11],
  // 37.67–38.32 gap: answer landing on the 38.00 tonic.
  [37.75, "G5", 0.11], [37.875, "A5", 0.11], [38.0, "C6", 0.11], [38.125, "F6", 0.15],
];

/** Bell melodies: [time, note, length s, velocity]. */
const BELL_PHRASES: [number, string, number, number][] = [
  // 2.50: bells enter with S02 (the 3-3-2 arp continues from 2.75).
  [2.5, "F5", 0.4, 0.6],
  // 4.35–5.79 VO gap (S02 → S03).
  [4.5, "A5", 0.2, 0.55], [4.625, "C6", 0.2, 0.55], [4.75, "D6", 0.3, 0.6], [5.0, "F6", 0.45, 0.65],
  // 34.48–35.04 gap (S11 → S12).
  [34.5, "D6", 0.2, 0.45], [34.625, "F6", 0.2, 0.45], [34.75, "A6", 0.4, 0.5],
];

/** Sections that play each part: [start, end). */
const SPANS = {
  subPulse: [[0, 13], [35, 38], [42.5, 45]],
  bassGroove: [[13, 20], [38, 42.5]],
  bassPeak: [[20, 31.5]],
  bells: [[2.5, 4.5], [5.5, 12], [35, 38], [38, 42.25]],
  bellPing: [[13, 28.8]],
  ep: [[13, 31.5], [38, 42.5]],
  arp: [[16, 31.5], [38, 42]],
  pad: [[6, 12], [20, 31.5], [32.25, 38], [38, 42.5]],
} satisfies Record<string, [number, number][]>;

// Bass patterns: [step in bar, semitones above root, length in steps, velocity]; "app" = chromatic approach.
type BassHit = [number, number | "app", number, number];
const GROOVE_BASS: BassHit[] = [
  [0, 0, 3, 1], [3, 0, 1, 0.6], [4, 12, 1, 0.75], [6, 0, 2, 0.85],
  [8, 0, 3, 0.95], [11, 12, 1, 0.7], [12, 7, 1, 0.7], [14, 0, 1, 0.75], [15, "app", 1, 0.7],
];
const PEAK_BASS: BassHit[] = [
  [0, 0, 2, 1], [2, 12, 1, 0.6], [3, 0, 1, 0.7], [4, 12, 1, 0.8], [6, 0, 1, 0.85], [7, 12, 1, 0.6],
  [8, 0, 2, 0.95], [10, 12, 1, 0.7], [11, 0, 1, 0.75], [12, 7, 1, 0.8], [13, 12, 1, 0.6], [14, 0, 1, 0.75],
  [15, "app", 1, 0.7],
];
/** EP comping: [step, length in steps, velocity]. */
const EP_COMP: [number, number, number][] = [
  [0, 3, 0.6], [3, 1, 0.42], [6, 2, 0.5], [8, 2, 0.55], [11, 1, 0.45], [14, 2, 0.5],
];
/** Bell arp rhythm: 3-3-2 + 3-3-2. */
const BELL_RHYTHM = [0, 3, 6, 8, 11, 14];

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
const inSpans = (t: number, spans: [number, number][]): boolean => spans.some(([a, b]) => t >= a - 1e-9 && t < b - 1e-9);

function chordAt(t: number): ChordSpan {
  const c = CHORDS.find((s) => t >= s.t - 1e-9 && t < s.end - 1e-9);
  if (!c) throw new Error(`no chord at ${t}`);
  return c;
}

/** Lowest MIDI note of pitch class `pc` at or above `lo`. */
function pitchAbove(pc: string, lo: number): number {
  return lo + ((chroma(pc) - lo) % 12 + 12) % 12;
}

/** Bass root in the sub register E1–D#2 (41–78 Hz). */
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
function voicingMap(lo: number, hi: number): Map<ChordSpan, number[]> {
  const map = new Map<ChordSpan, number[]>();
  let prev: number[] | undefined;
  for (const c of CHORDS) {
    prev = voicing(c.sym, lo, hi, prev);
    map.set(c, prev);
  }
  return map;
}

/** Iterate 16th steps in [from, to): callback gets time and step index within the bar. */
function eachStep(from: number, to: number, fn: (t: number, step: number) => void): void {
  for (let i = Math.round(from / STEP); i < Math.round(to / STEP); i++) fn(round(i * STEP), i % 16);
}

/** Pink-ish tape/vinyl bed: noise body + hiss + crackle, fading in over 0–0.5 s and out over 45.0–45.5 s. */
function makeBed(sampleRate: number, seconds: number, rng: () => number): Float32Array[] {
  const n = Math.round(sampleRate * seconds);
  const out = [new Float32Array(n), new Float32Array(n)];
  const fade = 0.5 * sampleRate;
  const loopEnd = LOOP_SECONDS * sampleRate;
  const lpA = Math.exp((-2 * Math.PI * 3200) / sampleRate);
  const hpA = Math.exp((-2 * Math.PI * 70) / sampleRate);
  const flutterA = Math.exp((-2 * Math.PI * 0.7) / sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    let b0 = 0, b1 = 0, b2 = 0, lp = 0, hpState = 0, prevLp = 0, flutter = 0;
    const x = out[ch];
    for (let i = 0; i < n; i++) {
      const w = rng() * 2 - 1;
      // Paul Kellet economy pink filter.
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      const pink = (b0 + b1 + b2 + w * 0.1848) * 0.11;
      lp = lpA * lp + (1 - lpA) * pink;
      hpState = hpA * (hpState + lp - prevLp);
      prevLp = lp;
      flutter = flutterA * flutter + (1 - flutterA) * (rng() * 2 - 1);
      x[i] = hpState * 0.05 * (1 + 6 * flutter) + (rng() * 2 - 1) * 0.0012;
    }
  }
  // Crackle: ~6 clicks/s, sharp spikes with a short resonant ring, random pan and size.
  const clicks = Math.round(seconds * 6);
  for (let k = 0; k < clicks; k++) {
    const at = Math.floor(rng() * (n - 400));
    const amp = 0.004 + 0.05 * rng() ** 3;
    const pan = rng();
    const f = 1800 + 3000 * rng();
    const len = Math.round((0.0015 + 0.004 * rng()) * sampleRate);
    for (let j = 0; j < len; j++) {
      const v = amp * Math.exp((-6 * j) / len) * Math.cos((2 * Math.PI * f * j) / sampleRate) * (j === 0 ? 1.6 : 1);
      out[0][at + j] += v * (1 - pan * 0.6);
      out[1][at + j] += v * (0.4 + pan * 0.6);
    }
  }
  // Loop envelope: equal-power fade-in at the head, fade-out past the loop point, silence after.
  for (let i = 0; i < n; i++) {
    let g = 1;
    if (i < fade) g = Math.sin((0.5 * Math.PI * i) / fade);
    else if (i >= loopEnd) g = i < loopEnd + fade ? Math.cos((0.5 * Math.PI * (i - loopEnd)) / fade) : 0;
    out[0][i] *= g;
    out[1][i] *= g;
  }
  return out;
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
    transport.schedule(fn, round(t));
  };

  // ---------- buses ----------
  const masterOut = new Tone.Gain(1).toDestination();
  const glue = new Tone.Compressor({ threshold: -22, ratio: 3, attack: 0.005, release: 0.18, knee: 10 }).connect(masterOut);
  // Groove sweep (S10 link failure): bit-crush then low-pass over everything except the tape bed,
  // so the closing filter also swallows the crusher's grit.
  const sweepFilter = new Tone.Filter({ type: "lowpass", frequency: 20000, Q: 1.2, rolloff: -24 }).connect(glue);
  const sweepCrush = new Tone.BitCrusher(16).connect(sweepFilter);
  sweepCrush.wet.value = 0;
  // Drop gate (31.50 near-silence) sits before the sweep.
  const dropGate = new Tone.Gain(1).connect(sweepCrush);
  const mixBus = new Tone.Gain(1).connect(dropGate);
  const reverb = new Tone.Reverb({ decay: 2.2, preDelay: 0.018, wet: 1 });
  await reverb.ready;
  const reverbHpf = new Tone.Filter({ type: "highpass", frequency: 250 }).connect(mixBus);
  reverb.connect(reverbHpf);
  const send = (node: Tone.ToneAudioNode, amount: number): void => {
    node.connect(new Tone.Gain(amount).connect(reverb));
  };
  // Tape wow on the melodic instruments.
  const wow = new Tone.Vibrato({ frequency: 0.55, depth: 0.35, wet: 1 }).connect(mixBus);
  const melBus = new Tone.Gain(1).connect(wow);

  // ---------- instruments ----------
  const lead = new Tone.Synth({
    oscillator: { type: "pulse", width: 0.25 },
    envelope: { attack: 0.004, decay: 0.09, sustain: 0.55, release: 0.05 },
    volume: -13,
  });
  const leadTone = new Tone.Filter({ type: "lowpass", frequency: 5200, Q: 0.7 }).connect(melBus);
  lead.connect(leadTone);
  send(leadTone, 0.12);

  const bells = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.5,
    modulationIndex: 4,
    oscillator: { type: "sine" },
    modulation: { type: "sine" },
    envelope: { attack: 0.002, decay: 1.1, sustain: 0, release: 1.1 },
    modulationEnvelope: { attack: 0.002, decay: 0.22, sustain: 0.05, release: 0.3 },
    volume: -16,
  });
  bells.maxPolyphony = 24;
  bells.connect(melBus);
  send(bells, 0.35);

  const ep = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1,
    modulationIndex: 2.2,
    oscillator: { type: "sine" },
    modulation: { type: "sine" },
    envelope: { attack: 0.003, decay: 0.7, sustain: 0.28, release: 0.18 },
    modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0.2, release: 0.2 },
    volume: -23,
  });
  ep.maxPolyphony = 24;
  const epTone = new Tone.Filter({ type: "lowpass", frequency: 3200 }).connect(melBus);
  ep.connect(epTone);
  send(epTone, 0.18);

  const arp = new Tone.Synth({
    oscillator: { type: "pulse", width: 0.125 },
    envelope: { attack: 0.002, decay: 0.07, sustain: 0.0, release: 0.03 },
    volume: -27,
  });
  const arpTone = new Tone.Filter({ type: "lowpass", frequency: 2600, Q: 0.8 }).connect(melBus);
  arp.connect(arpTone);
  send(arpTone, 0.2);

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fattriangle", count: 3, spread: 22 },
    envelope: { attack: 0.45, decay: 0.6, sustain: 0.75, release: 0.9 },
    volume: -21,
  });
  pad.maxPolyphony = 24;
  const padGain = new Tone.Gain(1);
  const padChorus = new Tone.Chorus({ frequency: 0.8, delayTime: 3.5, depth: 0.6, spread: 160, wet: 0.5 }).connect(melBus);
  padChorus.start();
  const padTone = new Tone.Filter({ type: "lowpass", frequency: 1900 }).connect(padChorus);
  pad.chain(padGain, padTone);
  send(padTone, 0.4);

  const sub = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.006, decay: 0.18, sustain: 0.7, release: 0.07 }, volume: -14 });
  const subUp = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.004, decay: 0.12, sustain: 0.5, release: 0.06 }, volume: -18 });
  sub.connect(mixBus);
  subUp.connect(new Tone.Filter({ type: "lowpass", frequency: 1400 }).connect(mixBus));

  // Kit → bit-crusher (8-bit, blended) → mix.
  const kitOut = new Tone.Gain(0.75).connect(mixBus);
  const kitCrush = new Tone.BitCrusher(8).connect(kitOut);
  kitCrush.wet.value = 0.55;
  const kitBus = new Tone.Gain(1).connect(kitCrush);
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.035, octaves: 5.5, oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.05 }, volume: -8,
  }).connect(kitBus);
  const snareNoise = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.13, sustain: 0 }, volume: -11 });
  snareNoise.chain(new Tone.Filter({ type: "bandpass", frequency: 3200, Q: 0.6 }), kitBus);
  const snareBody = new Tone.MembraneSynth({
    pitchDecay: 0.02, octaves: 1.5, oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.03 }, volume: -12,
  }).connect(kitBus);
  const hatFilter = new Tone.Filter({ type: "highpass", frequency: 7500 }).connect(kitBus);
  const hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.035, sustain: 0 }, volume: -17 }).connect(hatFilter);
  const ohat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.002, decay: 0.24, sustain: 0 }, volume: -20 }).connect(hatFilter);
  const crash = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.002, decay: 1.3, sustain: 0 }, volume: -20 });
  crash.chain(new Tone.Filter({ type: "highpass", frequency: 4800 }), kitBus);
  send(crash, 0.25);

  // Riser 19.0–20.0 into the peak downbeat.
  const riserGain = new Tone.Gain(0).connect(mixBus);
  const riserFilter = new Tone.Filter({ type: "bandpass", frequency: 400, Q: 1.8 }).connect(riserGain);
  const riserNoise = new Tone.Noise("pink").connect(riserFilter);

  // Tape/vinyl bed straight to the output (steady across the drop and the loop seam).
  const bedBuffer = Tone.ToneAudioBuffer.fromArray(makeBed(context.sampleRate, RENDER_SECONDS, rng));
  const bed = new Tone.Player({ url: bedBuffer, volume: 5 }).connect(masterOut);

  // ---------- note helpers ----------
  const playSub = (t: number, m: number, dur: number, vel: number): void =>
    at(t, (time) => {
      sub.triggerAttackRelease(hz(m), dur, time, vel);
      subUp.triggerAttackRelease(hz(m + 12), dur, time, vel);
    });
  const hitKick = (t: number, vel: number): void => at(t, (time) => kick.triggerAttackRelease("G1", 0.2, time, hum(vel)));
  const hitSnare = (t: number, vel: number): void =>
    at(t, (time) => {
      snareNoise.triggerAttackRelease(0.1, time, hum(vel));
      snareBody.triggerAttackRelease("G3", 0.06, time, hum(vel) * 0.9);
    });
  const hitHat = (t: number, vel: number): void => at(t, (time) => hat.triggerAttackRelease(0.03, time, hum(vel)));
  const hitOhat = (t: number, vel: number): void => at(t, (time) => ohat.triggerAttackRelease(0.2, time, hum(vel)));
  const hitCrash = (t: number, vel: number): void => at(t, (time) => crash.triggerAttackRelease(1.0, time, vel));

  // ---------- sub pulse (intro, response, loop bridge) ----------
  eachStep(0, 45, (t, step) => {
    if (step % 4 !== 0 || !inSpans(t, SPANS.subPulse)) return;
    // Sparse at the hook and the loop bridge, firmer once the kit is in.
    const vel = t < 2.5 || t >= 42.5 ? 0.5 : t < 5.5 ? 0.6 : 0.7;
    playSub(t, bassRoot(chordAt(t)), 0.3, step === 0 ? vel : vel * 0.8);
  });

  // ---------- groove bass ----------
  const bassLine = (from: number, to: number, pattern: BassHit[]): void =>
    eachStep(from, to, (t, step) => {
      const hit = pattern.find((p) => p[0] === step);
      if (!hit) return;
      const c = chordAt(t);
      const next = t + STEP < 45 ? chordAt(t + STEP) : CHORDS[0];
      let m: number;
      if (next !== c) m = bassRoot(next) - 1; // chromatic approach into every chord change
      else if (hit[1] === "app") m = bassRoot(c) + 12;
      else m = bassRoot(c) + hit[1];
      const len = Math.min(hit[2] * STEP, c.end - t, to - t) * 0.88;
      // Packets groove (before 20.0) sits a notch under the routing peak and the payoff.
      playSub(t, m, len, hit[3] * (t < 20 ? 0.85 : 1));
    });
  for (const [a, b] of SPANS.bassGroove) bassLine(a, b, GROOVE_BASS);
  for (const [a, b] of SPANS.bassPeak) bassLine(a, b, PEAK_BASS);

  // ---------- kit ----------
  // 01 DNS: kick on the slam (5.50), light kick + hats, fill 12.0–13.0.
  hitKick(5.5, 1);
  eachStep(6, 12, (t, step) => {
    if (step === 0 || step === 8) hitKick(t, step === 0 ? 0.8 : 0.65);
    if (step % 2 === 0) hitHat(t, step % 4 === 0 ? 0.5 : 0.32);
  });
  hitKick(12.0, 0.85);
  hitHat(12.0, 0.45);
  hitHat(12.25, 0.3);
  [[12.5, 0.55], [12.625, 0.62], [12.75, 0.75], [12.875, 0.9]].forEach(([t, v]) => hitSnare(t, v));

  // Groove pattern (packets at 0.8 level, payoff full) and peak pattern (routing).
  const grooveKit = (from: number, to: number, openHat: boolean, level: number): void =>
    eachStep(from, to, (t, step) => {
      if (step === 0 || step === 6 || step === 8) hitKick(t, (step === 0 ? 1 : 0.8) * level);
      if (step === 4 || step === 12) hitSnare(t, 0.85 * level);
      if (openHat && step === 14) hitOhat(t, 0.5 * level);
      else if (step % 2 === 0) hitHat(t, (step % 4 === 0 ? 0.55 : 0.4) * level);
      else if (step === 15) hitHat(t, 0.28 * level);
    });
  const peakKit = (from: number, to: number): void =>
    eachStep(from, to, (t, step) => {
      if (step === 0 || step === 6 || step === 8 || step === 11) hitKick(t, step === 0 || step === 8 ? 1 : 0.78);
      if (step === 4 || step === 12) hitSnare(t, 0.95);
      if (step === 7 || step === 15) hitSnare(t, 0.2);
      if (step === 10) hitSnare(t, 0.14);
      if (step === 14) hitOhat(t, 0.55);
      else hitHat(t, [0.55, 0.22, 0.4, 0.22][step % 4]);
    });

  hitCrash(13.0, 0.7);
  hitKick(13.0, 1);
  grooveKit(13.125, 19, false, 0.8);
  // 19.0–20.0 (steps 8–15 of the bar): 16th hats, open hats on the off-beats, snare pickup, riser underneath.
  eachStep(19, 20, (t, step) => {
    if (step === 8 || step === 11) hitKick(t, 0.9);
    if (step >= 12) hitSnare(t, 0.35 + 0.12 * (step - 12));
    if (step % 4 === 2) hitOhat(t, 0.55);
    else hitHat(t, step % 2 === 0 ? 0.5 : 0.3);
  });
  riserNoise.start(19).stop(20.08);
  riserFilter.frequency.setValueAtTime(350, 19);
  riserFilter.frequency.exponentialRampToValueAtTime(6500, 20);
  riserGain.gain.setValueAtTime(0.0001, 19);
  riserGain.gain.exponentialRampToValueAtTime(0.35, 19.98);
  riserGain.gain.linearRampToValueAtTime(0, 20.06);

  // Peak from the 20.00 downbeat through the tension bar; snare roll 29.5–30.0.
  peakKit(20, 29.5);
  [[29.5, 0.5], [29.625, 0.6], [29.75, 0.72], [29.875, 0.86]].forEach(([t, v]) => hitSnare(t, v));
  hitHat(29.5, 0.4);
  hitHat(29.75, 0.4);
  hitCrash(30.0, 0.5);
  peakKit(30, 31.5);

  // Response: soft hats from 35.0, soft kicks from 36.0, snare pickup 37.5.
  eachStep(35, 38, (t, step) => {
    if (step % 2 === 0) hitHat(t, step % 4 === 0 ? 0.38 : 0.26);
    if (t >= 36 && step % 8 === 0) hitKick(t, 0.6);
  });
  hitSnare(37.5, 0.45);

  // Payoff: crash + groove, last kick 42.0.
  hitCrash(38.0, 0.75);
  grooveKit(38, 42, true, 1);
  hitKick(42.0, 0.85);
  hitHat(42.0, 0.4);

  // ---------- EP comping ----------
  const epVoices = voicingMap(midi("A3"), midi("D5"));
  const comp = (from: number, to: number): void =>
    eachStep(from, to, (t, step) => {
      const hit = EP_COMP.find((h) => h[0] === step);
      if (!hit) return;
      const c = chordAt(t);
      const len = Math.min(hit[1] * STEP, c.end - t, to - t) * 0.9;
      const notes = epVoices.get(c)!.map(hz);
      // Packets groove comps lighter so the routing peak lifts.
      const vel = hum(hit[2]) * (t < 20 ? 0.8 : 1);
      at(t, (time) => ep.triggerAttackRelease(notes, len, time, vel));
    });
  for (const [a, b] of SPANS.ep) comp(a, b);

  // ---------- pulse arp (16ths, up-down over two octaves of the voicing) ----------
  const arpVoices = voicingMap(midi("F4"), midi("E5"));
  let arpIdx = 0;
  eachStep(0, 45, (t, step) => {
    if (!inSpans(t, SPANS.arp)) return;
    const v = arpVoices.get(chordAt(t))!;
    const ladder = [...v, ...v.map((m) => m + 12)];
    const cycle = [...ladder, ...ladder.slice(1, -1).reverse()];
    const m = cycle[arpIdx++ % cycle.length];
    at(t, (time) => arp.triggerAttackRelease(hz(m), 0.09, time, hum(step % 4 === 0 ? 0.9 : 0.6)));
  });

  // ---------- bells ----------
  const bellVoices = voicingMap(midi("C5"), midi("E6"));
  let bellIdx = 0;
  eachStep(0, 45, (t, step) => {
    if (!inSpans(t, SPANS.bells) || !BELL_RHYTHM.includes(step)) return;
    const v = bellVoices.get(chordAt(t))!;
    const shape = [0, 1, 2, 3, 2, 1, 0, 2];
    const m = v[shape[bellIdx++ % shape.length] % v.length];
    const vel = t < 5.5 ? 0.6 : 0.45;
    at(t, (time) => bells.triggerAttackRelease(hz(m), 0.3, time, hum(vel)));
  });
  eachStep(0, 45, (t, step) => {
    if (step !== 14 || !inSpans(t, SPANS.bellPing)) return;
    const v = bellVoices.get(chordAt(t))!;
    const top = v[v.length - 1];
    at(t, (time) => bells.triggerAttackRelease(hz(top), 0.4, time, 0.4));
  });
  for (const [t, n, len, vel] of BELL_PHRASES) at(t, (time) => bells.triggerAttackRelease(n, len, time, vel));
  // Sparkle in the 42.36–42.84 gap: F major pentatonic run C6 → C7.
  const sparkle = Scale.rangeOf("F major pentatonic")("C6", "C7");
  sparkle.forEach((n, k) => at(42.375 + k * 0.0625, (time) => bells.triggerAttackRelease(n!, 0.35, time, 0.5 - k * 0.04)));

  // ---------- pad ----------
  const padVoices = voicingMap(midi("E3"), midi("C5"));
  for (const c of CHORDS) {
    for (const [a, b] of SPANS.pad) {
      const s = Math.max(a, c.t);
      const e = Math.min(b, c.end);
      if (e - s < 0.25) continue;
      const notes = padVoices.get(c)!.map(hz);
      // Arrival (32.25–35) is the pad's feature; under the peak it only glues.
      const vel = s >= 32 && s < 35 ? 0.7 : s >= 20 && s < 31.5 ? 0.4 : 0.55;
      at(s, (time) => pad.triggerAttackRelease(notes, e - s - 0.05, time, vel));
    }
  }
  // Payoff pad clears out before the 42.5 strip-back.
  padGain.gain.setValueAtTime(1, 42.0);
  padGain.gain.linearRampToValueAtTime(0, 42.6);

  // ---------- lead (VO gaps only) ----------
  for (const [t, n, len] of LEAD) at(t, (time) => lead.triggerAttackRelease(n, len, time, 0.85));

  // ---------- automation: tension sweep 28.8–30.0, drop 31.5–32.25 ----------
  sweepFilter.frequency.setValueAtTime(20000, 28.8);
  sweepFilter.frequency.exponentialRampToValueAtTime(520, 29.95);
  sweepFilter.frequency.exponentialRampToValueAtTime(20000, 30.02);
  sweepCrush.wet.setValueAtTime(0, 28.8);
  sweepCrush.wet.linearRampToValueAtTime(0.7, 29.3);
  sweepCrush.wet.setValueAtTime(0.7, 29.97);
  sweepCrush.wet.linearRampToValueAtTime(0, 30.01);
  sweepCrush.bits.setValueAtTime(16, 28.8);
  sweepCrush.bits.linearRampToValueAtTime(5, 29.95);
  sweepCrush.bits.setValueAtTime(16, 30.02);

  dropGate.gain.setValueAtTime(1, 31.5);
  dropGate.gain.exponentialRampToValueAtTime(0.001, 31.75);
  dropGate.gain.setValueAtTime(0, 31.76);
  dropGate.gain.setValueAtTime(0, 32.15);
  dropGate.gain.linearRampToValueAtTime(1, 32.25);

  bed.start(0);
  transport.start(0);
}
