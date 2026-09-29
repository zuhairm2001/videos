// SFX definitions for "How the Internet Routes a Request".
// Runs in the browser only (bundled by render-sfx.ts with Vite): each `render`
// schedules Tone.js nodes inside a Tone.Offline context. render-sfx.ts then
// applies the shared post chain (DC block, bit-crush, tail trim, 2 ms / 5 ms
// fades, peak normalise to -3 dBFS) and writes 48 kHz mono PCM WAVs.
import type * as ToneNS from "tone";
import { Note, Scale } from "tonal";

type T = typeof ToneNS;
type Dest = ToneNS.InputNode;
type Rng = () => number;

export interface Crush {
  /** Quantiser bit depth (applied to the peak-normalised signal). */
  bits: number;
  /** Sample-and-hold factor (1 = none, 3 = 16 kHz effective rate). */
  hold: number;
}

export interface SfxDef {
  name: string;
  /** Storyboard SFX id(s) this file realises (null = contract/alternate only). */
  storyboardId: string | null;
  sound: string;
  cue: string;
  /** Offline render length in seconds (the post chain trims the silent tail). */
  length: number;
  /** Hard ceiling for the trimmed file. */
  maxDuration: number;
  crush: Crush;
  render(Tone: T, dest: Dest, rng: Rng): void;
}

// ---------- building blocks ----------

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
  /** Pulse width for a pulse wave (overrides `wave`). */
  width?: number;
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
  const oscillator = (o.width !== undefined ? { type: "pulse", width: o.width } : { type: o.wave ?? "sine" }) as ToneNS.SynthOptions["oscillator"];
  const synth = new Tone.Synth({
    oscillator,
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

/** Bus whose gain fades to silence between `from` and `to` (guarantees a clean tail). */
function fadeBus(Tone: T, dest: Dest, from: number, to: number) {
  const bus = new Tone.Gain(1).connect(dest);
  bus.gain.setValueAtTime(1, from);
  bus.gain.linearRampToValueAtTime(0, to);
  return bus;
}

const pick = <V>(rng: Rng, xs: readonly V[]): V => xs[Math.floor(rng() * xs.length) % xs.length];
const between = (rng: Rng, a: number, b: number) => a + (b - a) * rng();

/** F major pentatonic notes from `from` to `to` inclusive (Tonal marks entries as possibly undefined). */
function pentatonicF(from: string, to: string): string[] {
  return Scale.rangeOf("F major pentatonic")(from, to).filter((n: string | undefined): n is string => typeof n === "string");
}

// F5 → A6: eight rising hop pitches.
const BLIP_NOTES = pentatonicF("F5", "A6");
if (BLIP_NOTES.length !== 8) throw new Error(`expected 8 pentatonic blip notes, got ${BLIP_NOTES.join(" ")}`);
const hz = (note: string) => {
  const f = Note.freq(note);
  if (f === null) throw new Error(`bad note ${note}`);
  return f;
};

// ---------- the palette ----------

const blips: SfxDef[] = BLIP_NOTES.map((note, i) => {
  const n = i + 1;
  const boardId = n <= 5 ? `blip${n}` : null;
  return {
    name: `packet-blip-0${n}`,
    storyboardId: boardId,
    sound: `tracked-packet hop blip, pulse wave on ${note} (${hz(note).toFixed(1)} Hz), step ${n} of the rising F-pentatonic run`,
    cue:
      [
        "S07 20.15 blip1 (R1 hop; before VO 20.20)",
        "S07 22.05 blip2 (R2 hop; on unstressed \"and\")",
        "S08 24.30 blip3 (R3 hop; before \"No\")",
        "S08 27.25 blip4 (R4 hop; comma gap before \"for\")",
        "S10 30.20 blip5 (R5b hop; unstressed \"router\"; remap to S10 28.80–31.60)",
      ][i] ?? "spare step (the storyboard uses blips 1–5 only; R24 caps the run at 8)",
    length: 0.22,
    maxDuration: 0.6,
    crush: { bits: 8, hold: 2 },
    render(Tone, dest) {
      const f = hz(note);
      toneHit(Tone, dest, 0, { freq: f * 0.94, to: f, glide: 0.014, width: 0.25, attack: 0.001, decay: 0.11, gain: 0.8 });
      toneHit(Tone, dest, 0, { freq: f * 2, wave: "sine", attack: 0.001, decay: 0.045, gain: 0.3 });
    },
  };
});

export const SFX: SfxDef[] = [
  {
    name: "key-click",
    storyboardId: "key",
    sound: "keystroke click: filtered noise tick + small sine thump + release click",
    cue: "S01 0.00 key (keycap pressed, before VO onset 0.20)",
    length: 0.1,
    maxDuration: 0.6,
    crush: { bits: 10, hold: 2 },
    render(Tone, dest) {
      noiseHit(Tone, dest, 0, { freq: 4200, Q: 1.2, decay: 0.018 });
      toneHit(Tone, dest, 0, { freq: 190, to: 110, wave: "sine", decay: 0.03, gain: 0.5 });
      noiseHit(Tone, dest, 0.045, { freq: 6000, Q: 1.5, decay: 0.008, gain: 0.35 });
    },
  },
  {
    name: "enter-press",
    storyboardId: "enter",
    sound: "heavier bit-crushed Enter clack: noise body + membrane thump + key release",
    cue: "S01 0.10 enter (Enter keycap press)",
    length: 0.28,
    maxDuration: 0.6,
    crush: { bits: 8, hold: 3 },
    render(Tone, dest) {
      noiseHit(Tone, dest, 0, { freq: 1800, Q: 0.9, decay: 0.035 });
      thump(Tone, dest, 0, 70, 0.09, 0.8);
      toneHit(Tone, dest, 0, { freq: 900, wave: "square", decay: 0.012, gain: 0.25 });
      noiseHit(Tone, dest, 0.085, { freq: 3200, Q: 1.2, decay: 0.015, gain: 0.5 });
      toneHit(Tone, dest, 0.085, { freq: 1400, wave: "square", decay: 0.008, gain: 0.15 });
    },
  },
  {
    name: "scramble-tick",
    storyboardId: "tick",
    sound: "dot-matrix scramble burst: 9 square/noise micro-ticks, ≤150 ms (mix at −18 dB)",
    cue: "tick ×11: S01 0.12, 1.95 · S02 5.10 · S04 11.10, 12.90 · S06 19.90 · S08 25.45 · S10 29.55 · S11 31.65 · S13 39.20 · S14 41.02",
    length: 0.16,
    maxDuration: 0.15,
    crush: { bits: 8, hold: 2 },
    render(Tone, dest, rng) {
      let t = 0;
      for (let i = 0; i < 9; i++) {
        const g = 1 - i * 0.055;
        toneHit(Tone, dest, t, { freq: pick(rng, [1800, 2400, 3000, 3600, 4200]), wave: "square", decay: 0.004, gain: 0.7 * g });
        noiseHit(Tone, dest, t, { freq: 5000, Q: 1.5, decay: 0.003, gain: 0.45 * g });
        t += between(rng, 0.012, 0.016);
      }
    },
  },
  {
    name: "slam",
    storyboardId: "slam",
    sound: "bit-crushed kick-thump for the section-number impact: membrane sweep 180→45 Hz + low noise smack",
    cue: "S03 5.50 slam (before VO 5.75) · S07 20.00 slam",
    length: 0.55,
    maxDuration: 0.6,
    crush: { bits: 6, hold: 4 },
    render(Tone, dest) {
      const drive = new Tone.Distortion(0.35).connect(dest);
      thump(Tone, drive, 0, 45, 0.38, 1, 4, 0.05);
      noiseHit(Tone, dest, 0, { type: "lowpass", freq: 900, Q: 0.7, decay: 0.07, gain: 0.7 });
      toneHit(Tone, dest, 0, { freq: 110, to: 55, glide: 0.08, wave: "square", decay: 0.1, gain: 0.25 });
    },
  },
  {
    name: "glitch-crunch",
    storyboardId: "crunch",
    sound: "90 ms digital glitch: 7 ms stutter slices of square + band-passed noise, heavy crush",
    cue: "S05 13.00 crunch (glitch wipe; gap 12.85–13.20) · S15 42.50 crunch (wipe; gap before 42.80)",
    length: 0.12,
    maxDuration: 0.12,
    crush: { bits: 5, hold: 6 },
    render(Tone, dest, rng) {
      const bus = fadeBus(Tone, dest, 0.075, 0.1);
      for (let t = 0, i = 0; t < 0.09; t += 0.007, i++) {
        if (i % 3 !== 2) toneHit(Tone, bus, t, { freq: between(rng, 90, 2600), wave: "square", decay: 0.006, gain: 0.55 });
        if (rng() < 0.7) noiseHit(Tone, bus, t, { freq: between(rng, 600, 7000), Q: 2, decay: 0.006, gain: 0.8 });
      }
    },
  },
  {
    name: "link-fail",
    storyboardId: "crunch",
    sound: "link-failure glitch: short crunch into a soft descending square bloop (B4 → F4 tritone)",
    cue: "S10 28.80 crunch at the link failure (storyboard 28.30, moved to the S10 start; transient precedes VO v10 at 28.92)",
    length: 0.5,
    maxDuration: 0.6,
    crush: { bits: 6, hold: 4 },
    render(Tone, dest, rng) {
      for (let t = 0; t < 0.04; t += 0.008) {
        noiseHit(Tone, dest, t, { freq: between(rng, 800, 6000), Q: 2, decay: 0.006, gain: 0.9 });
        toneHit(Tone, dest, t, { freq: between(rng, 120, 1800), wave: "square", decay: 0.005, gain: 0.45 });
      }
      const lp = new Tone.Filter({ type: "lowpass", frequency: 2200, Q: 0.7 }).connect(dest);
      toneHit(Tone, lp, 0.045, { freq: hz("B4"), to: hz("A#4"), glide: 0.1, wave: "square", attack: 0.004, decay: 0.12, gain: 0.16 });
      toneHit(Tone, lp, 0.17, { freq: hz("F4"), to: hz("D4"), glide: 0.25, wave: "square", attack: 0.004, decay: 0.24, gain: 0.16 });
    },
  },
  {
    name: "packet-send",
    storyboardId: "send",
    sound: "soft non-pitched swish-tick: pink noise band-pass sweep 800→5000 Hz ending in a tiny tick",
    cue: "S03 7.55 send (DNS query leaves; gap after \"D-N-S,\")",
    length: 0.32,
    maxDuration: 0.6,
    crush: { bits: 10, hold: 2 },
    render(Tone, dest) {
      const filter = noiseHit(Tone, dest, 0, { color: "pink", freq: 800, Q: 1.4, attack: 0.1, decay: 0.12, gain: 1 });
      filter.frequency.setValueAtTime(800, 0);
      filter.frequency.exponentialRampToValueAtTime(5000, 0.22);
      noiseHit(Tone, dest, 0.21, { type: "highpass", freq: 6000, Q: 0.7, decay: 0.004, gain: 0.5 });
    },
  },
  {
    name: "router-chirp",
    storyboardId: "chirp",
    sound: "soft modem chirp: triangle sweep 1.1→2.3 kHz then a 1.65/2.1 kHz warble, low-passed",
    cue: "S03 9.18 chirp (resolver receives; gap after \"book,\") · S10 31.42 chirp (packet docks at the edge server)",
    length: 0.36,
    maxDuration: 0.6,
    crush: { bits: 8, hold: 3 },
    render(Tone, dest) {
      const lp = new Tone.Filter({ type: "lowpass", frequency: 4000, Q: 0.5 }).connect(dest);
      const amp = new Tone.Gain(0.7).connect(lp);
      const synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.004, decay: 0.18, sustain: 0.25, release: 0.07 },
      }).connect(amp);
      synth.triggerAttack(1100, 0);
      synth.frequency.exponentialRampToValueAtTime(2300, 0.06);
      for (let t = 0.07, i = 0; t < 0.22; t += 0.03, i++) synth.frequency.setValueAtTime(i % 2 ? 2100 : 1650, t);
      synth.triggerRelease(0.22);
      noiseHit(Tone, dest, 0, { freq: 2500, Q: 0.8, attack: 0.01, decay: 0.15, gain: 0.1 });
    },
  },
  ...blips,
  {
    name: "magenta-ping",
    storyboardId: "ping",
    sound: "soft FM bell on C6 with a faint C7 partial",
    cue: "S06 17.00 ping (item turns magenta; gap 16.95–17.20) · S11 34.80 ping (#01 tracked; gap 34.75–35.00)",
    length: 0.62,
    maxDuration: 0.6,
    crush: { bits: 10, hold: 1 },
    render(Tone, dest) {
      bell(Tone, dest, 0, hz("C6"), { decay: 0.42, gain: 0.8, harmonicity: 3.5, index: 5, attack: 0.004 });
      toneHit(Tone, dest, 0, { freq: hz("C7"), wave: "sine", attack: 0.004, decay: 0.18, gain: 0.2 });
    },
  },
  {
    name: "paper-stamp",
    storyboardId: "stamp",
    sound: "paper stamp: low-passed noise thud + 120→70 Hz body + paper slap + lift click",
    cue: "S05 14.95 stamp (gap after \"packets.\")",
    length: 0.3,
    maxDuration: 0.6,
    crush: { bits: 9, hold: 2 },
    render(Tone, dest) {
      noiseHit(Tone, dest, 0, { type: "lowpass", freq: 1400, Q: 0.7, decay: 0.05 });
      toneHit(Tone, dest, 0, { freq: 120, to: 70, wave: "sine", decay: 0.07, gain: 0.8 });
      noiseHit(Tone, dest, 0.004, { freq: 3000, Q: 1, decay: 0.02, gain: 0.4 });
      noiseHit(Tone, dest, 0.05, { freq: 2000, Q: 1.5, decay: 0.01, gain: 0.15 });
    },
  },
  {
    name: "paper-slice",
    storyboardId: "slice",
    sound: "soft paper riffle, non-transient: pink noise fluttered ~33 Hz, 120 ms swell",
    cue: "S06 18.20 slice (soft, under the unstressed \"page's\")",
    length: 0.56,
    maxDuration: 0.6,
    crush: { bits: 10, hold: 2 },
    render(Tone, dest, rng) {
      const env = new Tone.Gain(0).connect(dest);
      env.gain.setValueAtTime(0, 0);
      env.gain.linearRampToValueAtTime(1, 0.12);
      env.gain.setValueAtTime(1, 0.3);
      env.gain.linearRampToValueAtTime(0, 0.52);
      const flutter = new Tone.Gain(0.3).connect(env);
      for (let t = 0; t < 0.52; t += 0.03) {
        flutter.gain.linearRampToValueAtTime(between(rng, 0.75, 1), t + 0.008);
        flutter.gain.linearRampToValueAtTime(between(rng, 0.15, 0.35), t + 0.028);
      }
      const bp = new Tone.Filter({ type: "bandpass", frequency: 2500, Q: 0.7 }).connect(flutter);
      bp.frequency.setValueAtTime(2500, 0);
      bp.frequency.exponentialRampToValueAtTime(4500, 0.5);
      new Tone.Noise("pink").connect(bp).start(0).stop(0.54);
    },
  },
  {
    name: "packet-shimmer",
    storyboardId: "shimmer",
    sound: "collective packet shimmer, soft: 12 high F-pentatonic sine sparkles over a hiss swell",
    cue: "S12 34.92 shimmer (collective, soft; before \"Thirteen\")",
    length: 0.6,
    maxDuration: 0.6,
    crush: { bits: 9, hold: 1 },
    render(Tone, dest, rng) {
      const bus = new Tone.Gain(0).connect(dest);
      bus.gain.setValueAtTime(0, 0);
      bus.gain.linearRampToValueAtTime(1, 0.06);
      bus.gain.setValueAtTime(1, 0.45);
      bus.gain.linearRampToValueAtTime(0, 0.58);
      const notes = pentatonicF("F6", "A7");
      for (let i = 0; i < 12; i++) {
        const t = 0.01 + (i / 12) * 0.38 + between(rng, 0, 0.02);
        toneHit(Tone, bus, t, { freq: hz(pick(rng, notes)), wave: "sine", attack: 0.004, decay: 0.08, gain: between(rng, 0.35, 0.6) });
      }
      noiseHit(Tone, bus, 0, { type: "highpass", freq: 7000, Q: 0.7, attack: 0.15, decay: 0.3, gain: 0.15 });
    },
  },
  {
    name: "stopwatch-tick",
    storyboardId: "stop",
    sound: "stopwatch click: metallic press + softer release 45 ms later",
    cue: "S12 36.97 stop (HUD freezes; unstressed \"into\")",
    length: 0.12,
    maxDuration: 0.6,
    crush: { bits: 9, hold: 1 },
    render(Tone, dest) {
      metalClick(Tone, dest, 0, 1200, 0.012, 0.8);
      noiseHit(Tone, dest, 0, { freq: 5000, Q: 3, decay: 0.004, gain: 0.6 });
      metalClick(Tone, dest, 0.045, 1500, 0.008, 0.4);
      noiseHit(Tone, dest, 0.045, { freq: 6000, Q: 3, decay: 0.003, gain: 0.3 });
    },
  },
  {
    name: "stopwatch-set",
    storyboardId: "setwatch",
    sound: "stopwatch wind: accelerating 6-click ratchet then a lower set click with a tiny ping",
    cue: "S02 2.50 setwatch (before VO onset 2.55)",
    length: 0.42,
    maxDuration: 0.6,
    crush: { bits: 9, hold: 1 },
    render(Tone, dest) {
      [0, 0.045, 0.085, 0.12, 0.15, 0.18].forEach((t, i) => {
        noiseHit(Tone, dest, t, { freq: 4000, Q: 4, decay: 0.006, gain: 0.5 + i * 0.04 });
        metalClick(Tone, dest, t, 1800, 0.006, 0.25);
      });
      noiseHit(Tone, dest, 0.27, { freq: 2500, Q: 2, decay: 0.02, gain: 0.9 });
      metalClick(Tone, dest, 0.27, 1100, 0.015, 0.5);
      toneHit(Tone, dest, 0.27, { freq: 800, wave: "sine", decay: 0.05, gain: 0.25 });
    },
  },
  {
    name: "tray-clack",
    storyboardId: "clack",
    sound: "tray lock: plastic clack (resonant noise + woody square + membrane) and a latch click",
    cue: "S12 37.92 clack (tray full; gap before 38.00)",
    length: 0.26,
    maxDuration: 0.6,
    crush: { bits: 8, hold: 2 },
    render(Tone, dest) {
      noiseHit(Tone, dest, 0, { freq: 1400, Q: 2, decay: 0.03 });
      toneHit(Tone, dest, 0, { freq: 420, to: 300, wave: "square", decay: 0.025, gain: 0.45 });
      thump(Tone, dest, 0, 90, 0.06, 0.5, 2);
      noiseHit(Tone, dest, 0.05, { freq: 3800, Q: 2, decay: 0.008, gain: 0.5 });
      toneHit(Tone, dest, 0.05, { freq: 1800, wave: "square", decay: 0.005, gain: 0.2 });
    },
  },
  {
    name: "page-chime",
    storyboardId: "chime",
    sound: "warm two-note chime C5 → F5 (rising fourth to the tonic): soft FM bell + triangle + sub-octave sine",
    cue: "S13 38.00 chime (first reply arrives; gap 37.90–38.30)",
    length: 1.2,
    maxDuration: 1.2,
    crush: { bits: 12, hold: 1 },
    render(Tone, dest) {
      const lp = new Tone.Filter({ type: "lowpass", frequency: 3500, Q: 0.5 }).connect(dest);
      ([["C5", 0, 0.55], ["F5", 0.14, 0.75]] as const).forEach(([note, t, decay]) => {
        const f = hz(note);
        bell(Tone, lp, t, f, { decay, gain: 0.7, harmonicity: 2, index: 2.5, attack: 0.004 });
        toneHit(Tone, lp, t, { freq: f, wave: "triangle", attack: 0.004, decay: decay * 0.8, gain: 0.35 });
        toneHit(Tone, lp, t, { freq: f / 2, wave: "sine", attack: 0.006, decay: decay * 0.8, gain: 0.3 });
      });
    },
  },
  {
    name: "blink-tk",
    storyboardId: "blink",
    sound: "tiny \"tk\": bright micro-click then a lower one 22 ms later",
    cue: "S02 3.75 blink (eye glyph; dash pause) · S14 42.20 blink (after \"blink!\" ends 42.15)",
    length: 0.07,
    maxDuration: 0.6,
    crush: { bits: 9, hold: 1 },
    render(Tone, dest) {
      noiseHit(Tone, dest, 0, { type: "highpass", freq: 7000, Q: 0.7, decay: 0.003 });
      toneHit(Tone, dest, 0, { freq: 2600, wave: "sine", decay: 0.006, gain: 0.5 });
      noiseHit(Tone, dest, 0.022, { freq: 3500, Q: 1.5, decay: 0.004, gain: 0.6 });
    },
  },
  {
    name: "type-burst",
    storyboardId: "type",
    sound: "one soft typing burst: 7 irregular keystrokes over ~0.37 s (storyboard asks ≤ 0.45 s)",
    cue: "S15 43.40 type (one soft burst; gap after \"that,\")",
    length: 0.46,
    maxDuration: 0.6,
    crush: { bits: 10, hold: 2 },
    render(Tone, dest, rng) {
      let t = 0;
      for (let i = 0; i < 7; i++) {
        const g = between(rng, 0.6, 1);
        noiseHit(Tone, dest, t, { freq: between(rng, 3000, 5000), Q: 1.2, decay: between(rng, 0.012, 0.02), gain: g });
        toneHit(Tone, dest, t, { freq: between(rng, 150, 220), to: 100, wave: "sine", decay: 0.02, gain: 0.35 * g });
        t += between(rng, 0.05, 0.065);
      }
    },
  },
  {
    name: "whoosh-wipe",
    storyboardId: null,
    sound: "scanline wipe: band-passed pink noise sweep 300→6 kHz with a 30 Hz-chopped raster buzz",
    cue: "alternate / layer for the glitch wipes (S05 13.00, S15 42.50); not placed by the storyboard",
    length: 1.0,
    maxDuration: 1.2,
    crush: { bits: 8, hold: 3 },
    render(Tone, dest) {
      const env = new Tone.Gain(0).connect(dest);
      env.gain.setValueAtTime(0, 0);
      env.gain.linearRampToValueAtTime(1, 0.35);
      env.gain.linearRampToValueAtTime(0.5, 0.6);
      env.gain.linearRampToValueAtTime(0, 0.92);
      const bp = new Tone.Filter({ type: "bandpass", frequency: 300, Q: 1.5 }).connect(env);
      bp.frequency.setValueAtTime(300, 0);
      bp.frequency.exponentialRampToValueAtTime(6000, 0.7);
      new Tone.Noise("pink").connect(bp).start(0).stop(0.95);
      const chop = new Tone.Gain(0).connect(bp);
      for (let t = 0; t < 0.92; t += 1 / 30) {
        chop.gain.setValueAtTime(0.3, t);
        chop.gain.setValueAtTime(0, t + 0.012);
      }
      const buzz = new Tone.Oscillator(120, "sawtooth").connect(chop);
      buzz.start(0).stop(0.95);
    },
  },
];
