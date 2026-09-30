// SFX definitions for the Azure Kubernetes Fleet Manager promo.
// Runs in the browser only (bundled by render-sfx.ts with Vite): each `render`
// schedules Tone.js nodes inside a stereo Tone.Offline context. render-sfx.ts
// then applies the shared post chain (DC block, optional reverse, tail trim or
// fixed length, fades, linked peak normalise to -1 dBFS) and writes 48 kHz
// stereo 24-bit PCM WAVs.
//
// Sonic direction (creative/design/sound.md): dry, short, precise; pitched
// sounds use F major notes. The only deliberately "off" sound is drift-buzz
// (detuned D, the sprawl's D minor).
import type * as ToneNS from "tone";
import { Note, Scale } from "tonal";

type T = typeof ToneNS;
type Dest = ToneNS.InputNode;
type Rng = () => number;

export interface SfxDef {
  name: string;
  sound: string;
  /** Offline render length in seconds; also the hard ceiling for the file. */
  length: number;
  /** true = keep exactly `length` seconds (no tail trim); used for sounds cut to picture. */
  fixed?: boolean;
  /** Reverse the render before the post chain (reverse swells). */
  reverse?: boolean;
  render(Tone: T, dest: Dest, rng: Rng): void;
}

// ---------- pitch helpers ----------

const hz = (note: string) => {
  const f = Note.freq(note);
  if (f === null) throw new Error(`bad note ${note}`);
  return f;
};

/** F major pentatonic notes from `from` to `to` inclusive (Tonal marks entries as possibly undefined). */
function pentatonicF(from: string, to: string): string[] {
  return Scale.rangeOf("F major pentatonic")(from, to).filter((n: string | undefined): n is string => typeof n === "string");
}

const pick = <V>(rng: Rng, xs: readonly V[]): V => xs[Math.floor(rng() * xs.length) % xs.length];
const between = (rng: Rng, a: number, b: number) => a + (b - a) * rng();

// ---------- building blocks ----------

/** Stereo panner feeding `dest` (-1 = left, 1 = right). */
function pan(Tone: T, dest: Dest, p: number) {
  return new Tone.Panner(p).connect(dest);
}

interface NoiseHit {
  freq: number;
  type?: BiquadFilterType;
  Q?: number;
  color?: "white" | "pink" | "brown";
  attack?: number;
  decay: number;
  gain?: number;
}

function noiseHit(Tone: T, dest: Dest, t: number, o: NoiseHit) {
  const filter = new Tone.Filter({ type: o.type ?? "bandpass", frequency: o.freq, Q: o.Q ?? 1 }).connect(dest);
  const amp = new Tone.Gain(o.gain ?? 1).connect(filter);
  const attack = o.attack ?? 0.0005;
  const synth = new Tone.NoiseSynth({
    noise: { type: o.color ?? "white" },
    envelope: { attack, decay: o.decay, sustain: 0, release: 0.003 },
  }).connect(amp);
  synth.triggerAttackRelease(attack + o.decay, t);
  return filter;
}

interface ToneHit {
  freq: number;
  wave?: "sine" | "square" | "triangle" | "sawtooth";
  /** Glide target frequency and time. */
  to?: number;
  glide?: number;
  attack?: number;
  decay: number;
  gain?: number;
}

function toneHit(Tone: T, dest: Dest, t: number, o: ToneHit) {
  const amp = new Tone.Gain(o.gain ?? 1).connect(dest);
  const attack = o.attack ?? 0.001;
  const synth = new Tone.Synth({
    oscillator: { type: o.wave ?? "sine" },
    envelope: { attack, decay: o.decay, sustain: 0, release: 0.004 },
  }).connect(amp);
  synth.triggerAttackRelease(o.freq, attack + o.decay, t);
  if (o.to !== undefined) synth.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide ?? o.decay));
  return synth;
}

function thump(Tone: T, dest: Dest, t: number, freq: number, decay: number, gain: number, octaves = 3, pitchDecay = 0.03) {
  const amp = new Tone.Gain(gain).connect(dest);
  const drum = new Tone.MembraneSynth({
    pitchDecay,
    octaves,
    envelope: { attack: 0.001, decay, sustain: 0, release: 0.01 },
  }).connect(amp);
  drum.triggerAttackRelease(freq, decay, t);
}

function metalClick(Tone: T, dest: Dest, t: number, freq: number, decay: number, gain: number, resonance = 5000) {
  const amp = new Tone.Gain(gain).connect(dest);
  const metal = new Tone.MetalSynth({
    harmonicity: 5.1,
    modulationIndex: 16,
    octaves: 1,
    resonance,
    envelope: { attack: 0.0005, decay, release: 0.004 },
  }).connect(amp);
  metal.triggerAttackRelease(freq, decay, t);
}

function bell(Tone: T, dest: Dest, t: number, freq: number, o: { decay: number; gain: number; harmonicity: number; index: number; attack?: number }) {
  const amp = new Tone.Gain(o.gain).connect(dest);
  const fm = new Tone.FMSynth({
    harmonicity: o.harmonicity,
    modulationIndex: o.index,
    oscillator: { type: "sine" },
    modulation: { type: "sine" },
    envelope: { attack: o.attack ?? 0.003, decay: o.decay, sustain: 0, release: 0.02 },
    modulationEnvelope: { attack: 0.002, decay: o.decay * 0.4, sustain: 0, release: 0.02 },
  }).connect(amp);
  fm.triggerAttackRelease(freq, (o.attack ?? 0.003) + o.decay, t);
}

/**
 * Decorrelated stereo noise bed (one source hard left, one hard right, each
 * starting at a different random buffer offset) into a shared filter.
 * `width` 0 = mono, 1 = full stereo.
 */
function stereoNoise(Tone: T, dest: Dest, color: "white" | "pink" | "brown", start: number, stop: number, width = 0.8) {
  for (const side of [-width, width]) new Tone.Noise(color).connect(pan(Tone, dest, side)).start(start).stop(stop);
}

/** Gain node with a breakpoint envelope: `points` are [time, level] pairs, linear between them. */
function envGain(Tone: T, dest: Dest, points: readonly (readonly [number, number])[]) {
  const g = new Tone.Gain(0).connect(dest);
  g.gain.setValueAtTime(points[0][1], points[0][0]);
  for (const [t, v] of points.slice(1)) g.gain.linearRampToValueAtTime(v, t);
  return g;
}

/** Filtered noise + tuned saw riser that peaks at `len` (the downbeat it leads into). */
function riser(Tone: T, dest: Dest, len: number) {
  // Loudness curve: exponential climb, peak in the last 10 ms, then the post chain's hard cut.
  const env = new Tone.Gain(0.02).connect(dest);
  env.gain.setValueAtTime(0.02, 0);
  env.gain.exponentialRampToValueAtTime(1, len - 0.01);
  // Beat-synced tremolo (120 BPM): 16ths for the first half, 32nds for the second, depth easing out.
  const trem = new Tone.Gain(1).connect(env);
  for (let t = 0; t < len - 0.03; ) {
    const step = t < len / 2 ? 0.125 : 0.0625;
    const depth = 0.45 * (1 - t / len);
    trem.gain.setValueAtTime(1, t);
    trem.gain.linearRampToValueAtTime(1 - depth, t + step * 0.85);
    t += step;
  }
  trem.gain.setValueAtTime(1, len - 0.03);
  const bp = new Tone.Filter({ type: "bandpass", frequency: 300, Q: 0.9 }).connect(trem);
  bp.frequency.setValueAtTime(300, 0);
  bp.frequency.exponentialRampToValueAtTime(9000, len);
  stereoNoise(Tone, bp, "white", 0, len, 0.9);
  // Pitched layer: C (the dominant) rising an octave, so it resolves into the F hit.
  const lp = new Tone.Filter({ type: "lowpass", frequency: 500, Q: 0.8 }).connect(trem);
  lp.frequency.setValueAtTime(500, 0);
  lp.frequency.exponentialRampToValueAtTime(6000, len);
  ([[-0.5, 0], [0.5, 9]] as const).forEach(([p, cents]) => {
    const osc = new Tone.Oscillator(hz("C4"), "sawtooth").connect(new Tone.Gain(0.09).connect(pan(Tone, lp, p)));
    osc.detune.value = cents;
    osc.frequency.setValueAtTime(hz("C4"), 0);
    osc.frequency.exponentialRampToValueAtTime(hz("C5"), len);
    osc.start(0).stop(len);
  });
}

// ---------- the palette ----------

export const SFX: SfxDef[] = [
  {
    name: "cluster-pop",
    sound: "soft two-tone blip C6 → F6 (rising fourth to the tonic): triangle + sub-octave sine + tiny noise click",
    length: 0.3,
    render(Tone, dest) {
      ([["C6", 0], ["F6", 0.045]] as const).forEach(([note, t]) => {
        const f = hz(note);
        toneHit(Tone, dest, t, { freq: f, wave: "triangle", attack: 0.002, decay: 0.09, gain: 0.6 });
        toneHit(Tone, dest, t, { freq: f / 2, wave: "sine", attack: 0.002, decay: 0.07, gain: 0.3 });
      });
      noiseHit(Tone, dest, 0, { freq: 3000, Q: 1.2, decay: 0.003, gain: 0.25 });
    },
  },
  {
    name: "dot-tick-burst",
    sound: "seeded cluster of 4–8 very short high ticks on F-pentatonic notes F6–F7, each with a noise click, spread across the stereo field",
    length: 0.4,
    render(Tone, dest, rng) {
      const notes = pentatonicF("F6", "F7");
      const count = 4 + Math.floor(rng() * 5);
      let t = 0;
      for (let i = 0; i < count; i++) {
        const out = pan(Tone, dest, between(rng, -0.6, 0.6));
        const g = between(rng, 0.55, 0.9);
        toneHit(Tone, out, t, { freq: hz(pick(rng, notes)), wave: "sine", attack: 0.0008, decay: between(rng, 0.012, 0.02), gain: g });
        noiseHit(Tone, out, t, { type: "highpass", freq: 6000, Q: 0.7, decay: 0.002, gain: 0.35 * g });
        t += between(rng, 0.022, 0.045);
      }
    },
  },
  {
    name: "drift-buzz",
    sound: "small detuned buzz: two saws on D3 30 cents apart + square on A2, band-passed, flickering at 7.5 Hz (2 f on / 2 f off), swelling to full at 1.10 s, hard stop at 1.15 s",
    length: 1.15,
    fixed: true,
    render(Tone, dest, rng) {
      const len = 1.15;
      const swell = new Tone.Gain(0.15).connect(dest);
      swell.gain.setValueAtTime(0.15, 0);
      swell.gain.exponentialRampToValueAtTime(1, 1.1);
      // Flicker gate: 2 frames on, 2 frames off (30 fps), with a slightly jittered phase.
      const gate = new Tone.Gain(1).connect(swell);
      for (let t = 0, i = 0; t < len; t += 4 / 30, i++) {
        const on = t + (i ? between(rng, -0.006, 0.006) : 0);
        gate.gain.setValueAtTime(1, Math.max(0, on));
        gate.gain.setValueAtTime(0.3, on + 2 / 30);
      }
      const lp = new Tone.Filter({ type: "lowpass", frequency: 4000, Q: 0.5 }).connect(gate);
      const bp = new Tone.Filter({ type: "bandpass", frequency: 1100, Q: 0.8 }).connect(lp);
      ([[-0.5, 0], [0.5, 30]] as const).forEach(([p, cents]) => {
        const osc = new Tone.Oscillator(hz("D3"), "sawtooth").connect(new Tone.Gain(0.35).connect(pan(Tone, bp, p)));
        osc.detune.value = cents;
        osc.start(0).stop(len);
      });
      const sq = new Tone.Oscillator(hz("A2"), "square").connect(new Tone.Gain(0.15).connect(bp));
      sq.detune.value = -20;
      sq.start(0).stop(len);
    },
  },
  {
    name: "hub-hit",
    sound: "reveal / icon-lock hit: F1 membrane thump + F2 body, bright transient (noise click + FM bell F6), short F major triad and noise tail",
    length: 1.2,
    render(Tone, dest) {
      const drive = new Tone.Distortion(0.2).connect(dest);
      thump(Tone, drive, 0, hz("F1"), 0.5, 1, 4, 0.04);
      toneHit(Tone, dest, 0, { freq: hz("F2"), wave: "sine", attack: 0.002, decay: 0.3, gain: 0.4 });
      noiseHit(Tone, dest, 0, { type: "highpass", freq: 5000, Q: 0.7, decay: 0.015, gain: 0.6 });
      bell(Tone, dest, 0, hz("F6"), { decay: 0.25, gain: 0.22, harmonicity: 3, index: 4, attack: 0.001 });
      const lp = new Tone.Filter({ type: "lowpass", frequency: 2500, Q: 0.5 }).connect(dest);
      for (const n of ["F3", "A3", "C4"]) toneHit(Tone, lp, 0, { freq: hz(n), wave: "triangle", attack: 0.004, decay: 0.6, gain: 0.12 });
      const tail = envGain(Tone, dest, [[0, 0], [0.01, 0.2], [0.45, 0]]);
      stereoNoise(Tone, new Tone.Filter({ type: "bandpass", frequency: 1200, Q: 0.7 }).connect(tail), "pink", 0, 0.46);
    },
  },
  {
    name: "link-zip",
    sound: "rising filtered zip, 0.3 s: saw F4 → F6 through a tracking band-pass, 70 Hz zipper chop + noise, panning left → right, ending on a tiny F7 tick",
    length: 0.3,
    render(Tone, dest) {
      const panner = new Tone.Panner(-0.4).connect(dest);
      panner.pan.setValueAtTime(-0.4, 0);
      panner.pan.linearRampToValueAtTime(0.4, 0.26);
      const env = envGain(Tone, panner, [[0, 0], [0.02, 0.35], [0.24, 1], [0.28, 0]]);
      const chop = new Tone.Gain(1).connect(env);
      new Tone.LFO({ frequency: 70, type: "square", min: 0.25, max: 1 }).connect(chop.gain).start(0).stop(0.3);
      const bp = new Tone.Filter({ type: "bandpass", frequency: 700, Q: 3 }).connect(chop);
      bp.frequency.setValueAtTime(700, 0);
      bp.frequency.exponentialRampToValueAtTime(5000, 0.26);
      const saw = new Tone.Oscillator(hz("F4"), "sawtooth").connect(new Tone.Gain(0.6).connect(bp));
      saw.frequency.setValueAtTime(hz("F4"), 0);
      saw.frequency.exponentialRampToValueAtTime(hz("F6"), 0.26);
      saw.start(0).stop(0.29);
      new Tone.Noise("white").connect(new Tone.Gain(0.25).connect(bp)).start(0).stop(0.29);
      toneHit(Tone, pan(Tone, dest, 0.4), 0.255, { freq: hz("F7"), wave: "sine", decay: 0.02, gain: 0.25 });
    },
  },
  {
    name: "slam",
    sound: "tight low hit for the section numerals: F1 membrane (4-octave sweep) + low-passed noise smack + F2 → F1 square body + tiny click",
    length: 0.6,
    render(Tone, dest) {
      const drive = new Tone.Distortion(0.3).connect(dest);
      thump(Tone, drive, 0, hz("F1"), 0.32, 1, 4, 0.035);
      noiseHit(Tone, dest, 0, { type: "lowpass", freq: 1100, Q: 0.7, decay: 0.05, gain: 0.6 });
      const lp = new Tone.Filter({ type: "lowpass", frequency: 800, Q: 0.7 }).connect(dest);
      toneHit(Tone, lp, 0, { freq: hz("F2"), to: hz("F1"), glide: 0.06, wave: "square", decay: 0.08, gain: 0.18 });
      noiseHit(Tone, dest, 0, { type: "highpass", freq: 3000, Q: 0.7, decay: 0.004, gain: 0.3 });
    },
  },
  {
    name: "stage-sweep",
    sound: "stage fill, 1.3 s: stereo pink noise band-pass sweep 350 Hz → 5.5 kHz with a triangle F4 → F5 / sine F5 → F6 rise, panning left → right with the sweep line",
    length: 1.3,
    fixed: true,
    render(Tone, dest) {
      const panner = new Tone.Panner(-0.6).connect(dest);
      panner.pan.setValueAtTime(-0.6, 0);
      panner.pan.linearRampToValueAtTime(0.6, 1.25);
      const env = envGain(Tone, panner, [[0, 0], [0.08, 0.8], [1.05, 1], [1.29, 0]]);
      const bp = new Tone.Filter({ type: "bandpass", frequency: 350, Q: 2 }).connect(env);
      bp.frequency.setValueAtTime(350, 0);
      bp.frequency.exponentialRampToValueAtTime(5500, 1.2);
      stereoNoise(Tone, bp, "pink", 0, 1.3, 0.5);
      const lp = new Tone.Filter({ type: "lowpass", frequency: 3000, Q: 0.5 }).connect(env);
      ([["F4", "F5", "triangle", 0.12], ["F5", "F6", "sine", 0.05]] as const).forEach(([from, to, wave, gain]) => {
        const osc = new Tone.Oscillator(hz(from), wave).connect(new Tone.Gain(gain).connect(lp));
        osc.frequency.setValueAtTime(hz(from), 0);
        osc.frequency.exponentialRampToValueAtTime(hz(to), 1.2);
        osc.start(0).stop(1.3);
      });
    },
  },
  {
    name: "pass-chime",
    sound: "two-note chime F5 → C6 for `[ PASS ]`: soft FM bell + triangle + sub-octave sine, low-passed",
    length: 1.0,
    render(Tone, dest) {
      const lp = new Tone.Filter({ type: "lowpass", frequency: 5000, Q: 0.5 }).connect(dest);
      ([["F5", 0, 0.45], ["C6", 0.09, 0.6]] as const).forEach(([note, t, decay]) => {
        const f = hz(note);
        bell(Tone, lp, t, f, { decay, gain: 0.6, harmonicity: 2, index: 2, attack: 0.003 });
        toneHit(Tone, lp, t, { freq: f, wave: "triangle", attack: 0.003, decay: decay * 0.8, gain: 0.3 });
        toneHit(Tone, lp, t, { freq: f / 2, wave: "sine", attack: 0.005, decay: decay * 0.7, gain: 0.25 });
      });
    },
  },
  {
    name: "gate-chime",
    sound: "`[ APPROVED ]` gate chime, the pass-chime an octave up: F6 → C7 glassy FM bell + triangle, with a tiny tick on the flip",
    length: 0.9,
    render(Tone, dest) {
      const lp = new Tone.Filter({ type: "lowpass", frequency: 8000, Q: 0.5 }).connect(dest);
      ([["F6", 0, 0.35, -0.15], ["C7", 0.08, 0.5, 0.15]] as const).forEach(([note, t, decay, p]) => {
        const f = hz(note);
        const out = pan(Tone, lp, p);
        bell(Tone, out, t, f, { decay, gain: 0.55, harmonicity: 3, index: 1.5, attack: 0.002 });
        toneHit(Tone, out, t, { freq: f, wave: "triangle", attack: 0.002, decay: decay * 0.7, gain: 0.3 });
        toneHit(Tone, out, t, { freq: f / 2, wave: "sine", attack: 0.004, decay: decay * 0.6, gain: 0.2 });
      });
      noiseHit(Tone, dest, 0, { type: "highpass", freq: 6000, Q: 0.7, decay: 0.003, gain: 0.3 });
    },
  },
  {
    name: "flock-whoosh",
    sound: "airy whoosh for the arrow-of-arrows: stereo pink noise band-pass 500 Hz → 3.2 kHz → 1.2 kHz panning left → right, with 28 granular F-pentatonic dot grains (F6–C8) riding the pan",
    length: 1.3,
    render(Tone, dest, rng) {
      const panner = new Tone.Panner(-0.7).connect(dest);
      panner.pan.setValueAtTime(-0.7, 0);
      panner.pan.linearRampToValueAtTime(0.7, 1.1);
      const env = envGain(Tone, panner, [[0, 0], [0.3, 1], [0.6, 0.55], [1.15, 0]]);
      const bp = new Tone.Filter({ type: "bandpass", frequency: 500, Q: 1.2 }).connect(env);
      bp.frequency.setValueAtTime(500, 0);
      bp.frequency.exponentialRampToValueAtTime(3200, 0.4);
      bp.frequency.exponentialRampToValueAtTime(1200, 1.1);
      stereoNoise(Tone, bp, "pink", 0, 1.2, 0.6);
      const notes = pentatonicF("F6", "C8");
      for (let i = 0; i < 28; i++) {
        const u = (i + rng()) / 28;
        const t = 0.05 + u * 0.95;
        const level = Math.sin(Math.PI * Math.min(1, u * 1.3));
        const out = pan(Tone, dest, Math.max(-1, Math.min(1, -0.7 + 1.4 * u + between(rng, -0.2, 0.2))));
        toneHit(Tone, out, t, { freq: hz(pick(rng, notes)), wave: "sine", attack: 0.001, decay: between(rng, 0.01, 0.02), gain: 0.22 * level * between(rng, 0.6, 1) });
      }
    },
  },
  {
    name: "stamp",
    sound: "mechanical policy-stamp clack: low-passed noise body + woody square 330 → 180 Hz + 110 Hz membrane, then a metallic latch click 35 ms later",
    length: 0.3,
    render(Tone, dest) {
      noiseHit(Tone, dest, 0, { type: "lowpass", freq: 1800, Q: 0.7, decay: 0.045 });
      const lp = new Tone.Filter({ type: "lowpass", frequency: 2000, Q: 0.7 }).connect(dest);
      toneHit(Tone, lp, 0, { freq: 330, to: 180, glide: 0.03, wave: "square", decay: 0.035, gain: 0.35 });
      thump(Tone, dest, 0, 110, 0.08, 0.6, 2);
      const latch = pan(Tone, dest, 0.2);
      noiseHit(Tone, latch, 0.035, { freq: 4000, Q: 2, decay: 0.006, gain: 0.45 });
      metalClick(Tone, latch, 0.035, 1500, 0.006, 0.2);
    },
  },
  {
    name: "riser",
    sound: "2.0 s noise riser into the reach: stereo white noise band-pass 300 Hz → 9 kHz + detuned saws C4 → C5, beat-synced tremolo (16ths → 32nds), exponential swell peaking at the end, hard cut",
    length: 2.0,
    fixed: true,
    render(Tone, dest) {
      riser(Tone, dest, 2.0);
    },
  },
  {
    name: "riser-short",
    sound: "1.2 s version of `riser` into the CTA (same layers, compressed)",
    length: 1.2,
    fixed: true,
    render(Tone, dest) {
      riser(Tone, dest, 1.2);
    },
  },
  {
    name: "whoosh-pull",
    sound: "camera pull-back: stereo pink noise band-pass falling 5 kHz → 350 Hz (early swell, long fade) + sine drop F3 → F2",
    length: 1.1,
    render(Tone, dest) {
      const env = envGain(Tone, dest, [[0, 0], [0.12, 1], [0.5, 0.35], [1.0, 0]]);
      const bp = new Tone.Filter({ type: "bandpass", frequency: 5000, Q: 1 }).connect(env);
      bp.frequency.setValueAtTime(5000, 0);
      bp.frequency.exponentialRampToValueAtTime(350, 0.85);
      stereoNoise(Tone, bp, "pink", 0, 1.05, 0.8);
      toneHit(Tone, dest, 0, { freq: hz("F3"), to: hz("F2"), glide: 0.7, wave: "sine", attack: 0.1, decay: 0.7, gain: 0.2 });
    },
  },
  {
    name: "collapse",
    sound: "1.4 s reverse swell for the dot collapse: a reversed F add9 FM-bell cluster (F4 A4 C5 G5 F5) + swirling pink noise + F2 sub + reversed dot grains, peaking at the very end (lands on hub-hit)",
    length: 1.4,
    fixed: true,
    reverse: true,
    render(Tone, dest, rng) {
      // Rendered forwards as a decaying hit, then reversed by the post chain.
      for (const n of ["F4", "A4", "C5", "G5", "F5"]) {
        bell(Tone, dest, 0, hz(n), { decay: 1.35, gain: 0.22, harmonicity: pick(rng, [2, 3]), index: 3, attack: 0.001 });
      }
      toneHit(Tone, dest, 0, { freq: hz("F2"), wave: "sine", attack: 0.001, decay: 1.2, gain: 0.3 });
      const swirl = new Tone.AutoPanner({ frequency: 1.3, depth: 0.6 }).connect(dest).start(0);
      const tail = envGain(Tone, swirl, [[0, 0.35], [1.35, 0]]);
      stereoNoise(Tone, new Tone.Filter({ type: "bandpass", frequency: 2500, Q: 0.7 }).connect(tail), "pink", 0, 1.4, 0.7);
      const notes = pentatonicF("F6", "C8");
      for (let i = 0; i < 20; i++) {
        const t = 0.02 + (i / 20) ** 1.6 * 1.2;
        toneHit(Tone, pan(Tone, dest, between(rng, -0.7, 0.7)), t, { freq: hz(pick(rng, notes)), wave: "sine", attack: 0.001, decay: 0.05, gain: 0.12 * (1 - i / 20) });
      }
    },
  },
];
