# Sonic Direction

## Overall
There is no voice-over, so music and SFX carry the pacing. The sound should feel precise, mechanical and warm: a clean electronic pulse, like a well-run machine room, rather than cinematic trailer bombast. Each lit dot has a sound, and the fleet sounds like one instrument.

## Music
- **Tempo / grid:** 120 BPM, 4/4, one bar = 2.00 s, with the downbeat at 0.00. There are 30 bars in 60 s, and every scene cut lands on a bar line.
- **Key:** D minor for the sprawl (0–8 s), moving to **F major** at the reveal (8 s, the relative major lifting). It stays in F/Dm for the features, and the CTA resolves on F major add9.
- **Palette:**
  - Plucked FM "dot" arps (1/16 notes) that mirror the dots powering on.
  - A soft sub pulse on the quarter notes.
  - A felt-muted clock tick on the 8ths.
  - A warm analog pad from the reveal onward.
  - One glassy bell lead for the brand motif: 4 notes, F–A–C–G ("fleet" motif), played at 8 s, 34 s and 54 s.
- **Arc:**
  | Bars | Time | Section | Energy |
  |---|---|---|---|
  | 1–4 | 0–8 | Sprawl: sparse, detuned arps, off-grid hats that get busier as clusters multiply, Dm | 2 → 5 |
  | 5–7 | 8–14 | Reveal: downbeat hit at 8.00, pad blooms, motif, arps lock onto the grid | 6 |
  | 8–13 | 14–26 | Updates: steady groove, one arp voice added per stage (17, 20, 23 s) | 6 → 7 |
  | 14–18 | 26–36 | Placement: busier arp in contrary motion, motif at 34 s | 7 |
  | 19–23 | 36–46 | Governance: half-time feel, pad forward, calmer | 5 |
  | 24–26 | 46–52 | Reach: build with riser, full kit | 8 |
  | 27–30 | 52–60 | CTA: hit at 52, motif at 54, resolve, ring out by 59.5 | 8 → 3 |
- **Loudness:** the master is −14 LUFS integrated with −1 dBTP true-peak. Music sits at about −17 LUFS so SFX come through.

## SFX (dry, short, tuned to F major where pitched)
Files live in `audio/sfx/<name>.wav` (see `audio/sfx/README.md` for durations and synthesis notes); cue times and gains are in `timeline/timeline.json` → `audio.sfx`.

| File | Use |
|---|---|
| `dot-tick-burst` | Dot / glyph power-on runs (S02 doublings, S03 landings, S07 scan). A seeded cluster of 4–8 very short high ticks on F-pentatonic notes |
| `cluster-pop` | Cluster glyph builds and arrivals. A soft two-tone blip (C→F) |
| `drift-buzz` | Orange drift flicker in the sprawl. A small detuned buzz, 1.15 s, swelling and cutting dead at 7.95 |
| `hub-hit` | Reveal at 8.00 and icon lock at 53.40. A low thump, a bright transient and a short tail |
| `link-zip` | Membership links drawing, namespace band. A rising filtered zip, 0.3 s |
| `stage-sweep` | Stage fill. A filtered noise sweep with a rising pitch, 1.3 s, panning with the sweep line |
| `pass-chime` | `[ PASS ]` chips. Two-note chime (F→C) |
| `gate-chime` | `[ APPROVED ]` gate chips. The pass-chime an octave higher |
| `slam` | Section number slams at 14, 26 and 36. A tight low hit |
| `flock-whoosh` | Arrow-of-arrows flight. Airy whoosh with granular dots |
| `stamp` | Namespace policy stamps (quota / netpol / rbac). A mechanical clack |
| `riser` | 44–46 into the reach. A 2.0 s noise riser peaking on 46.00 |
| `riser-short` | 50.8–52 into the CTA. A 1.2 s version of `riser` |
| `whoosh-pull` | Camera pull-back at 46 |
| `collapse` | 52.0–53.4 dot collapse. A 1.4 s reverse swell peaking on the hub-hit at 53.40 |
