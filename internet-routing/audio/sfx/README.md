# SFX

Synthesised with Tone.js offline rendering in Playwright Chromium (`sfx.ts` defines the sounds, `render-sfx.ts` renders them).
Regenerate from the project root: `npx tsx audio/sfx/render-sfx.ts` (optionally pass names to render a subset).

All files: 48 kHz mono 24-bit PCM WAV, peak -3 dBFS, 2 ms raised-cosine fade-in / 5 ms fade-out, tail trimmed at -54 dB, bit-crushed per sound (sample-and-hold + quantiser, 80 % wet). The transient sits at t = 0, so place each file at the cue time and set the mix level with `gain_db` (the storyboard asks for `tick` at −18 dB).

Cue times are storyboard times; the Timeline agent applies the S10 remap (28.30→28.80 start) and VO-segment shifts.

| File | Duration (s) | Storyboard id | Crush | Sound | Storyboard cue |
|---|---|---|---|---|---|
| `key-click.wav` | 0.057 | `key` | 10-bit, hold 2 | keystroke click: filtered noise tick + small sine thump + release click | S01 0.00 key (keycap pressed, before VO onset 0.20) |
| `enter-press.wav` | 0.101 | `enter` | 8-bit, hold 3 | heavier bit-crushed Enter clack: noise body + membrane thump + key release | S01 0.10 enter (Enter keycap press) |
| `scramble-tick.wav` | 0.125 | `tick` | 8-bit, hold 2 | dot-matrix scramble burst: 9 square/noise micro-ticks, ≤150 ms (mix at −18 dB) | tick ×11: S01 0.12, 1.95 · S02 5.10 · S04 11.10, 12.90 · S06 19.90 · S08 25.45 · S10 29.55 · S11 31.65 · S13 39.20 · S14 41.02 |
| `slam.wav` | 0.364 | `slam` | 6-bit, hold 4 | bit-crushed kick-thump for the section-number impact: membrane sweep 180→45 Hz + low noise smack | S03 5.50 slam (before VO 5.75) · S07 20.00 slam |
| `glitch-crunch.wav` | 0.098 | `crunch` | 5-bit, hold 6 | 90 ms digital glitch: 7 ms stutter slices of square + band-passed noise, heavy crush | S05 13.00 crunch (glitch wipe; gap 12.85–13.20) · S15 42.50 crunch (wipe; gap before 42.80) |
| `link-fail.wav` | 0.326 | `crunch` | 6-bit, hold 4 | link-failure glitch: short crunch into a soft descending square bloop (B4 → F4 tritone) | S10 28.80 crunch at the link failure (storyboard 28.30, moved to the S10 start; transient precedes VO v10 at 28.92) |
| `packet-send.wav` | 0.219 | `send` | 10-bit, hold 2 | soft non-pitched swish-tick: pink noise band-pass sweep 800→5000 Hz ending in a tiny tick | S03 7.55 send (DNS query leaves; gap after "D-N-S,") |
| `router-chirp.wav` | 0.278 | `chirp` | 8-bit, hold 3 | soft modem chirp: triangle sweep 1.1→2.3 kHz then a 1.65/2.1 kHz warble, low-passed | S03 9.18 chirp (resolver receives; gap after "book,") · S10 31.42 chirp (packet docks at the edge server) |
| `packet-blip-01.wav` | 0.110 | `blip1` | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on F5 (698.5 Hz), step 1 of the rising F-pentatonic run | S07 20.15 blip1 (R1 hop; before VO 20.20) |
| `packet-blip-02.wav` | 0.110 | `blip2` | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on G5 (784.0 Hz), step 2 of the rising F-pentatonic run | S07 22.05 blip2 (R2 hop; on unstressed "and") |
| `packet-blip-03.wav` | 0.110 | `blip3` | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on A5 (880.0 Hz), step 3 of the rising F-pentatonic run | S08 24.30 blip3 (R3 hop; before "No") |
| `packet-blip-04.wav` | 0.110 | `blip4` | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on C6 (1046.5 Hz), step 4 of the rising F-pentatonic run | S08 27.25 blip4 (R4 hop; comma gap before "for") |
| `packet-blip-05.wav` | 0.110 | `blip5` | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on D6 (1174.7 Hz), step 5 of the rising F-pentatonic run | S10 30.20 blip5 (R5b hop; unstressed "router"; remap to S10 28.80–31.60) |
| `packet-blip-06.wav` | 0.110 | — | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on F6 (1396.9 Hz), step 6 of the rising F-pentatonic run | spare step (the storyboard uses blips 1–5 only; R24 caps the run at 8) |
| `packet-blip-07.wav` | 0.110 | — | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on G6 (1568.0 Hz), step 7 of the rising F-pentatonic run | spare step (the storyboard uses blips 1–5 only; R24 caps the run at 8) |
| `packet-blip-08.wav` | 0.110 | — | 8-bit, hold 2 | tracked-packet hop blip, pulse wave on A6 (1760.0 Hz), step 8 of the rising F-pentatonic run | spare step (the storyboard uses blips 1–5 only; R24 caps the run at 8) |
| `magenta-ping.wav` | 0.379 | `ping` | 10-bit, hold 1 | soft FM bell on C6 with a faint C7 partial | S06 17.00 ping (item turns magenta; gap 16.95–17.20) · S11 34.80 ping (#01 tracked; gap 34.75–35.00) |
| `paper-stamp.wav` | 0.073 | `stamp` | 9-bit, hold 2 | paper stamp: low-passed noise thud + 120→70 Hz body + paper slap + lift click | S05 14.95 stamp (gap after "packets.") |
| `paper-slice.wav` | 0.524 | `slice` | 10-bit, hold 2 | soft paper riffle, non-transient: pink noise fluttered ~33 Hz, 120 ms swell | S06 18.20 slice (soft, under the unstressed "page's") |
| `packet-shimmer.wav` | 0.446 | `shimmer` | 9-bit, hold 1 | collective packet shimmer, soft: 12 high F-pentatonic sine sparkles over a hiss swell | S12 34.92 shimmer (collective, soft; before "Thirteen") |
| `stopwatch-tick.wav` | 0.058 | `stop` | 9-bit, hold 1 | stopwatch click: metallic press + softer release 45 ms later | S12 36.97 stop (HUD freezes; unstressed "into") |
| `stopwatch-set.wav` | 0.319 | `setwatch` | 9-bit, hold 1 | stopwatch wind: accelerating 6-click ratchet then a lower set click with a tiny ping | S02 2.50 setwatch (before VO onset 2.55) |
| `tray-clack.wav` | 0.061 | `clack` | 8-bit, hold 2 | tray lock: plastic clack (resonant noise + woody square + membrane) and a latch click | S12 37.92 clack (tray full; gap before 38.00) |
| `page-chime.wav` | 0.678 | `chime` | 12-bit, hold 1 | warm two-note chime C5 → F5 (rising fourth to the tonic): soft FM bell + triangle + sub-octave sine | S13 38.00 chime (first reply arrives; gap 37.90–38.30) |
| `blink-tk.wav` | 0.031 | `blink` | 9-bit, hold 1 | tiny "tk": bright micro-click then a lower one 22 ms later | S02 3.75 blink (eye glyph; dash pause) · S14 42.20 blink (after "blink!" ends 42.15) |
| `type-burst.wav` | 0.370 | `type` | 10-bit, hold 2 | one soft typing burst: 7 irregular keystrokes over ~0.37 s (storyboard asks ≤ 0.45 s) | S15 43.40 type (one soft burst; gap after "that,") |
| `whoosh-wipe.wav` | 0.918 | — | 8-bit, hold 3 | scanline wipe: band-passed pink noise sweep 300→6 kHz with a 30 Hz-chopped raster buzz | alternate / layer for the glitch wipes (S05 13.00, S15 42.50); not placed by the storyboard |
