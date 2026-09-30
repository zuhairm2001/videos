# Music

`music.ts` is the score: Tone.js handles synthesis, sequencing and effects, and Tonal handles scales, chord spelling and voice-led voicings. It reads `timeline/timeline.json` for the section times, hits, motif times, the arp layer entries (`updates.layerAdds`), the half-time section (`feel`), the resolve chord and `tailEnd`, and for the sprawl cues (`s01.glyph`, `s02.double.*`, `s02.drift.*`). Harmony is written per section in bars relative to each section's start.

To render:

```sh
npx tsx audio/music/render-music.ts    # → audio/music/music.wav + spectrogram.png, prints the report below
```

Vite bundles the score for the browser, and Playwright Chromium runs `Tone.Offline` for exactly 60 s (about 3–4 min on SwiftShader). There is no loop fold. The page encodes 24-bit PCM, then ffmpeg applies one static gain to −18 LUFS. The renderer also runs an iterative `alimiter` pass, because the gain on its own would push the true peak above −3 dBTP. The render is deterministic: `Math.random` is seeded for Tone's noise and reverb, and all humanisation uses a seeded PRNG.

## Score (120 BPM, 4/4, 30 bars)
| Section | Time | Energy | What plays |
|---|---|---|---|
| sprawl | 0–8 | 2→5 | Dm9 → Bbmaj7 → Gm9 → C9sus4. Sparse, detuned, off-grid FM dot plucks (density 20 → 70 %). Off-grid hats whose density follows the cluster doublings. A sub on half notes, then quarters from 4 s. Soft kicks. The detune widens through the drift. Noise swell into 8.00 |
| reveal | 8–14 | 6 | F major. Hit, then the pad blooms (LP 300 Hz → 2.2 kHz). Bell motif F–A–C–G (Tonal: F major degrees 1-3-5-2). The arp locks to straight 16ths. 8th-note clock tick, kick on 1 and 3 |
| updates | 14–26 | 6→7 | Four-on-the-floor groove with a sidechained sub and pad. Arp voices enter at 17 (8th-note off-beat pluck), 20 (3-3-2 mid pluck plus 16th hat ghosts) and 23 (glass sparkle plus open hats). The pad steps up with each entry |
| placement | 26–36 | 7 | The dot arp climbs while the mid arp descends (contrary motion). 8th-note mid bass. Motif at 34 over Fadd9 |
| governance | 36–46 | 5 | Half-time: kick on 1, snare on 3, sub on half notes. The pad comes forward (filter to 3.6 kHz) while the rest thins out. Rebuilds 44–46 |
| reach | 46–52 | 8 | Full kit, all four arp voices, 8th-note bass, riser and snare roll 50–52 |
| cta | 52–60 | 8→3 | Hit on Fadd9. The arp collapses into a crisp bell hit at 53.4. Motif at 54 over Bbmaj9, resolving to Fadd9 at 56 with a bell strum. Silent from 59.5 |

Hits (kick + tuned F1 boom + crash) land at 8, 14, 26, 36, 46 and 52, with a bell cluster at 53.4.

## Last render
- `music.wav`: pcm_s24le, 48 kHz, 2 ch, 2 880 000 samples = 60.000 s. No clipping (sample peak −3.6 dBFS, flat factor 0). Digital silence from 59.5 s.
- **−18.0 LUFS integrated**, LRA 8 LU, **true peak −3.3 dBTP**. Before limiting, the PLR is about 19 dB; the peaks are the kick, the sub on the beats and the 8th-note transients. The limiter takes up to 4.9 dB off those peaks.

| Section | Energy | LUFS (window) | Short-term max |
|---|---|---|---|
| sprawl 0–8 | 2→5 | −25.6 (bars: −33 −29 −25 −23) | −22.8 |
| reveal 8–14 | 6 | −18.3 | −16.9 |
| updates 14–26 | 6→7 | −19.1 (bars −19 → −18) | −18.5 |
| placement 26–36 | 7 | −17.4 | −16.5 |
| governance 36–46 | 5 | −18.8 (core bars −19, rebuild −18) | −16.4 |
| reach 46–52 | 8 | −15.5 | −15.1 |
| cta 52–60 | 8→3 | −17.3 (bars −17 −16 −21 −63) | −15.0 |

## Spectrogram notes (`spectrogram.png`)
- **Low end:** the first render had the sub band 14–20 dB above 400 Hz–2 kHz, which made the mix muddy and flat in loudness (LRA 1.8 LU). The sub, kick and boom were cut by 10–16 dB. The pad was high-passed at 260 Hz and the mid pluck at 250 Hz, and a −2.5 dB dip was added at 260 Hz. The sub band now sits 3–6 dB above the mids, and the LRA is 8 LU.
- **2–5 kHz:** there is no harsh build-up. This band sits 10–12 dB under 400 Hz–2 kHz. Plucks are low-passed at 2.4–7 kHz and the reverb return at 6.5 kHz. The one transient offender, the 8th-note tick, was softened and low-passed at 1.8 kHz. Above 7 kHz there is only hats, crash and the risers, plus a +2 dB air shelf. Overall the mix is warm rather than bright.
- **Arc:** the swell into 8 s, the hits at 8, 14, 26, 36, 46 and 52, the thinner half-time columns from 36 to 44, the dense reach and the tail fading to nothing before 59.5 s are all visible.
