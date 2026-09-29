# Storyboard: How the Internet Routes a Request

Sources: `brief.md`, `design/*` (design bible, motion, composition, sound, palette, typography), `design/moodboard/INDEX.md` (refs are cited by file number 01–26), `references/research/technical.md` (cited as **T§**) and `references/research/format.md` (cited as **F§**; checklist rules as **R1–R25**). Where the checklist conflicts with any other doc, the checklist wins.

---

## 1. Header

| Item | Value |
|---|---|
| Runtime | **45.00 s = 1350 frames** (frames 0–1349). Seamless loop: frame 1349 matches frame 0 |
| Format | 1080×1920, 9:16, **30 fps**. The ASCII texture layer updates on 2s (15 fps). Camera, packets and text run at 30 fps |
| VO words | **106** (14 segments, 16 sentences, mean 6.6 words, max 13). "D-N-S", "H-T-M-L", "Let's" and "internet's" each count as one word |
| VO speech time | 39.05 s summed over the segment spans |
| Pace | 106 ÷ 39.05 s × 60 = **163 wpm** (target 155–165). Every segment falls between 147 and 176 wpm |
| Voice | ElevenLabs **"Brittney"** (UK female), "smooth but upbeat". Settings: stability 0.50, similarity 0.75, style 0, speed 1.03. On Eleven v3/v4, put one global tag at the start: `[warm, bright, upbeat narration]`. No `<break>` tags and no `[excited]` |
| Music | 120 BPM, 4/4, F major / D minor feel, downbeat grid anchored at 0.00 s (bar = 2.0 s) |
| Timing note | Word and caption times are syllable-weighted estimates. Once the VO is rendered, re-sync them to the real word timestamps and keep every caption chunk inside its shot |

### Beat table

| Beat id | Name | Start (s) | End (s) | Dur (s) | Frames | Shots | vs F§4 |
|---|---|---|---|---|---|---|---|
| B0 | Hook | 0.00 | 2.50 | 2.50 | 0–74 | S01 | = |
| B1 | Promise | 2.50 | 5.50 | 3.00 | 75–164 | S02 | = |
| B2 | 01 DNS | 5.50 | 13.00 | 7.50 | 165–389 | S03–S04 | = |
| B3 | 02 Packets | 13.00 | 20.00 | 7.00 | 390–599 | S05–S07 | = |
| B4 | 03 Routing (peak, longest) | 20.00 | 31.60 | 11.60 | 600–947 | S08–S10 | end +0.6 s |
| B5 | 04 Arrival + response | 31.60 | 38.00 | 6.40 | 948–1139 | S11–S12 | start +0.6 s |
| B6 | Payoff | 38.00 | 42.50 | 4.50 | 1140–1274 | S13–S14 | = |
| B7 | Loop bridge | 42.50 | 45.00 | 2.50 | 1275–1349 | S15 | = |
| | **Total** | | | **45.00** | 1350 | | all within ±1 s |

Check: 2.50 + 3.00 + 7.50 + 7.00 + 11.60 + 6.40 + 4.50 + 2.50 = **45.00 s**.

### Major pattern-interrupt schedule (R10)

| # | t (s) | Interrupt type | Use of type | Gap since previous |
|---|---|---|---|---|
| I1 | 0.00 | Guide ASCII-ramp entrance + keystroke. This entrance starts at 44.37 and runs across the loop seam, so it counts as one entrance | guide-entrance 1/2 | 2.50 (I9 at 42.50 → loop seam at 45.00 = 0.00) |
| I2 | 5.50 | Section-number slam `01` | slam 1/2 | 5.50 |
| I3 | 13.00 | Scanline wipe | wipe 1/2 | 7.50 |
| I4 | 20.00 | Section-number slam `03` | slam 2/2 | 7.00 |
| I5 | 24.70 | Camera pull-back, macro → wide network | scale-change 1/2 | 4.70 |
| I6 | 28.30 | The single red link failure + registration slip | error-colour 1/1, slip 1/2 | 3.60 |
| I7 | 31.60 | Music drop to near-silence | music-drop 1/1 | 3.30 |
| I8 | 38.00 | Push-in to the oversized stopwatch number + registration slip + guide entrance at 38.90 | scale-change 2/2, slip 2/2, guide-entrance 2/2 | 6.40 |
| I9 | 42.50 | Scanline wipe back to the URL bar | wipe 2/2 | 4.50 |

The longest gap is 7.50 s. No type is used more than twice. Section numbers `02` and `04` are scramble-typed (a minor visible change) and do **not** slam.

---

## 2. Voice-over script

The `text` column is exactly what goes to TTS. Captions show the same words, but write the letter-spelled acronyms as "DNS" and "HTML". **Bold** marks the stressed words: SFX transients must avoid them (R24), and the music lead stays out under them.

| id | Beat | Start (s) | End (s) | Text (TTS) | Words | wpm | Stressed |
|---|---|---|---|---|---|---|---|
| v01 | Hook | 0.20 | 1.90 | Enter. Where did it go? | 5 | 176 | **Enter**, **go** |
| v02 | Promise | 2.55 | 5.05 | Let's follow it — and race a blink. | 7 | 168 | **follow**, **blink** |
| v03 | 01 DNS | 5.75 | 11.05 | Your browser asks D-N-S, the internet's phone book, where example dot com lives. | 13 | 147 | **D-N-S**, **phone book**, **lives** |
| v04 | 01 DNS | 11.35 | 12.85 | Back comes an address. | 4 | 160 | **address** |
| v05 | 02 Packets | 13.20 | 14.90 | Data travels in small packets. | 5 | 176 | **packets** |
| v06 | 02 Packets | 15.15 | 16.95 | Your request fits in one. | 5 | 167 | **one** |
| v07 | 02 Packets | 17.20 | 19.85 | A typical page's H-T-M-L needs about thirteen. | 7 | 158 | **thirteen** |
| v08 | 03 Routing | 20.20 | 24.10 | Each router reads the address and passes it one step closer. | 11 | 169 | **reads**, **closer** |
| v09 | 03 Routing | 24.35 | 28.30 | No route is reserved — every router decides again, for every packet. | 11 | 167 | **reserved**, **every** (1st), **again** |
| v10 | 03 Routing | 28.45 | 31.40 | If a link fails, the router picks another. | 8 | 163 | **fails**, **another** |
| v11 | 04 Arrival | 32.25 | 34.75 | Often, the server is a nearby copy. | 7 | 168 | **nearby** |
| v12 | 04 Arrival | 35.00 | 37.90 | Thirteen packets stream back and snap into order. | 8 | 166 | **Thirteen**, **order** |
| v13 | Payoff | 38.30 | 42.15 | The first reply: about forty milliseconds. Faster than a blink! | 10 | 156 | **forty**, **blink** |
| v14 | Loop | 42.80 | 44.75 | All that, because you hit— | 5 | 154 | **hit** |
| | | | | **Total** | **106** | **163** | |

**Loop hand-off:** v14 "All that, because you hit—" continues straight into v01 "Enter. Where did it go?", which reads as "…because you hit Enter." v14 ends at 44.75, and the frame-0 keystroke lands at 0.00/0.10, so the dash pause is 0.45 s.

**Punctuation budget (R7):** 1 exclamation mark (v13, payoff), 0 ellipses, 1 question mark (v01, hook), 0 capitalised emphasis words (D-N-S and H-T-M-L are letter spellings, not emphasis), 3 dashes (v02, v09, v14), 0 SSML tags. **Numbers** are spelled out ("thirteen" ×2, "forty"). IPs and packet IDs appear on screen only (R8).

**Sentence check (R6):** Enter. (1) / Where did it go? (4) / v02 (7) / v03 (13) / v04 (4) / v05 (5) / v06 (5) / v07 (7) / v08 (11) / v09 (11) / v10 (8) / v11 (7) / v12 (8) / "The first reply: about forty milliseconds." (6) / "Faster than a blink!" (4) / v14 (5). Sum 106, 16 sentences, mean 6.6, max 13.

---

## 3. Shot list

### Global conventions (apply to every shot)

- **Coordinates** are screen px on the 1080×1920 frame, as x-range × y-range. **Safe rect:** x 120–960, y 270–1245. **Notch:** nothing essential at x > 780 when y > 840. **Zones:** header y 270–420, stage y 420–1060, caption y 1080–1245. Beyond the safe rect: decorative bleed only.
- **Times** are in seconds; the frame for event time t is round(t × 30). Motion durations are in frames (f). Shot end frames are inclusive.
- **Layers, back to front:**
  1. **paper ground**: `paper` #F2EDE1, plus `paperShade` dither.
  2. **ASCII layer**: 12×20 texture cells, ramp ` .:-=+*#%@`, updates at 15 fps. Texture only, never meaning; animated density ≤ ⅓ of the frame.
  3. **ink lines**: links, node clusters, frames. Lines are 3 px, `ink`. Links are dotted when idle and fill as a packet travels.
  4. **signal packet**: the tracked packet.
  5. **character**: the guide.
  6. **UI chrome**: URL bar, stopwatch/HUD, terminal panels.
  7. **text**: labels and captions.
- **Colours:** at most 3 non-ground colours per frame (paper and paperShade are ground). Each shot lists its set.
- **Tracked packet (R19):** a solid `signal` block of 96×64 px (the hero-scale packet) with a 1-cell (12 px) paper halo. It is ≥ 2 cells larger than blue cards, and it leaves a fading dotted magenta trail (16 f). If it has to carry a readable ID (#01/13), draw it instead as a 12 px signal frame around a paper plate with `inkDeep` 36 px text. Only one signal subject per frame.
- **Guide:** line-art anime girl drawn with 3 px `ink` strokes. Shading is 1-bit dither in the ASCII layer; face contours use hero cells (24×40). Her bounding box is always ≤ 408×440 px (≤ 179,200 px² = ⅓ of the 840×640 stage). She enters and exits through the ASCII ramp over 8 f (`space . + # @`, then resolved line art), is never in the notch, has guide role only (never rides the packet) and never wears magenta. Poses: curious, pointing, surprised, satisfied. No lip-sync.
- **Captions (R14–R16):** IBM Plex Mono 64 px, line height 76 px, ≤ 17 chars per line, ≤ 2 lines. Left-aligned at x = 120, top-anchored: line 1 at y 1090–1166, line 2 at y 1166–1242. Plate is solid `paper` with 12 px padding (x 108 → text end + 12, y 1080–1245), text in `inkDeep`. A decorative `>` prompt in `ink` 64 px hangs at x 72–110, outside the safe rect and non-essential. Captions resolve in 4 f (≤ 6 f). Emphasis = inversion (paper on inkDeep) of the word in [brackets], never magenta. No caption is on screen during frames 0–5 or 1346–1349 (the loop match).
- **Section header:** number in `display` (Departure Mono) 96 px `ink` at x 120–235, y 290–386. Label in display 64 px `inkDeep` from x 260, y 306–370.
- **HUD stopwatch** (S03–S12, top-right, x 640–960, y 280–420, paper plate):
  - row 1: `t · slow-mo`, glyph 36 px inkDeep, y 284–320
  - row 2: digits `000 ms`, display 48 px inkDeep, y 326–374
  - row 3: phase label, glyph 36 px inkDeep, y 380–416

  Digits scramble-tick at 15 fps. Phase labels and values:

  | Span (s) | Label | Value |
  |---|---|---|
  | 5.50–13.00 | `dns` | 000→012 |
  | 13.00–20.00 | `handshake` | 012→029 |
  | 20.00–31.60 | `request` | 029→033 |
  | 31.60–36.95 | `reply` | 033→038, freezes at 038 at 36.95 |
- **Wide network map** (camera zoom 1.0; used in S09, S10 and S12). Node centres; each node is a pixel-block glyph cluster of about 120×80 px in `ink`.

  | Node | Centre | Label (36 px inkDeep; hop tag always shown, IP shown when active) |
  |---|---|---|
  | D (you) | (200, 480) | `you · 192.0.2.23`, x 120–465, y 520–556 |
  | R1 | (420, 540) | `1 · 192.0.2.1` |
  | R2 | (240, 640) | `2 · 198.51.100.1` |
  | R3 | (480, 720) | `3 · 198.51.100.45` |
  | R4 | (300, 810) | `4 · 198.51.100.77` |
  | R5a (IXP) | (640, 780) | `ix · 203.0.113.129`, x 560–949, y 724–760 |
  | R5b (transit) | (200, 950) | `5 · 198.51.100.140 · AS64500`, x 120–725, y 880–916 |
  | E (edge server) | (520, 990) | `edge 203.0.113.10` (17 chars, 367 px), x 400–767, y 1024–1060 |

  - **Links:** D–R1, R1–R2, R2–R3, R3–R4, R4–R5a, R5a–E, R4–R5b, R5b–E.
  - **Decorative links:** R1–R3, R2–R4, R3–R5a, plus about 12 unlabelled nodes bleeding past x 960 and above y 270, drawn in ink at 50% ASCII density (texture, non-essential).
  - **Macro view** is zoom 2.0 on the active router; the camera pans so the active router sits at screen x 180–360, y 640–760.
- **SFX ids:**

  | id | Sound |
  |---|---|
  | `key` | keystroke click |
  | `enter` | heavier bit-crushed clack |
  | `tick` | dot-matrix scramble burst, ≤ 150 ms, −18 dB |
  | `slam` | bit-crushed kick-thump |
  | `crunch` | 50–100 ms digital glitch |
  | `send` | soft non-pitched swish-tick |
  | `chirp` | soft modem chirp = router/server arrival |
  | `blip1`–`blip5` | tracked-packet hop, rising pentatonic steps in F |
  | `ping` | soft FM bell = item turns magenta |
  | `stamp` | paper stamp |
  | `slice` | soft paper riffle, non-transient |
  | `shimmer` | collective packet shimmer, soft |
  | `stop` | stopwatch click |
  | `clack` | tray lock |
  | `chime` | warm two-note chime |
  | `blink` | tiny "tk" |
  | `type` | one typing-burst sample, 0.45 s |
  | `setwatch` | stopwatch wind click |

---

### S01: Hook, "Enter."
- **Time:** 0.00–2.50 s · frames 0–74 · beat B0 Hook
- **VO:** v01 "Enter. Where did it go?"
  - "Enter." → Enter keycap press (0.10)
  - "Where did it go?" → dotted trail leaves the URL bar (0.93)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 0.20–0.90 | `[Enter.]` |
  | 0.93–2.45 | `Where did it go?` |
- **Frame description (frame 0 = loop key frame):**
  - Paper ground with a light ASCII dither band (paperShade/ink) bleeding across y 0–270. Decorative.
  - **Guide** (curious pose, leaning right, gaze down to the URL bar) at x 120–528, y 440–860, face at x 190–470, y 470–720. At f0 she is at ramp stage `#`: dense ink glyph silhouette.
  - **URL bar** (VHS/Minitel chrome: 3 px ink border, blocky title strip) at x 120–588, y 900–996, containing `⌕` 48 px (x 132–180) and `example.co` + block cursor (cursor "on"). Glyph 64 px inkDeep from x 192.
  - **Enter keycap** `⏎` (display 64 px, paper on ink block, 8 px ink drop-shadow) at x 612–780, y 900–996.
  - Header and HUD empty. No caption at f0.
- **Layers:**
  - paper ground: yes
  - ASCII layer: top bleed band; guide shading
  - ink lines: URL bar border, keycap, guide strokes, the 0.93 dotted trail
  - signal packet: none
  - character: guide (curious)
  - UI chrome: URL bar, keycap, spinner
  - text: URL, header proposition, captions
- **On-screen text:**
  - `example.co` → `example.com`: glyph 64 px inkDeep
  - `how a request travels`: display 48 px inkDeep, x 120–725, y 300–348, from 1.95
  - captions: glyph 64 px inkDeep
- **Colours:** ink, inkDeep (2)
- **Motion:**
  - f0: typing is already in progress (continued from S15).
  - f1 (0.03): `m` appears and the cursor steps one cell.
  - f3 (0.10): keycap depresses 8 px (2 f), releases at f6.
  - f3–f9 (0.10–0.30): guide ramps `#`→`@`→resolved line art. Face readable by f9 (R4).
  - 0.50: URL-bar border inverts for 2 f, then a spinner `|/-\` (48 px ink) starts at x 540 and steps every 2 f.
  - 0.93: a dotted ink trail with a 48 px `?` glyph at its head leaves the right end of the URL bar and travels diagonally to the top-right bleed (x 588→1080, y 948→0) over 18 f. Decorative, never behind the caption.
  - 1.40: guide head turn / gaze follows the trail upward (pose swap on the 15 fps step).
  - 1.95: header proposition scramble-resolves (10 f).
  - Visible-change gaps ≤ 0.55 s.
- **Camera:** locked, zoom 1.0.
- **Transition out:** hard continuity (same layout) into S02.
- **SFX:** 0.00 `key`, 0.10 `enter`, 0.12 `tick` (face resolve), 1.95 `tick` (header). All are clear of the stressed words, and the 0.00/0.10 hits precede the VO onset at 0.20.
- **Music:** sparse intro: vinyl/tape bed plus a sine-sub pulse on beats. The same bed plays under S15, so the loop seam is inaudible. No lead.
- **Moodboard:**
  - 01: ASCII face, core look
  - 08: 1-bit portrait
  - 18: ASCII dissolve entrance
  - 24: VHS UI chrome for the URL bar/keycap
- **Data props:** `example.com` (T§1, RFC 2606 name). No IPs.

### S02: Promise, "race a blink"
- **Time:** 2.50–5.50 s · frames 75–164 · beat B1 Promise
- **VO:** v02 "Let's follow it — and race a blink."
  - "Let's follow it" → guide pointing pose plus a dotted path stub growing down from the URL bar (2.90)
  - "and race a blink" → `vs. a blink` label plus eye glyph (3.93)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 2.55–3.93 | `Let's follow it —` |
  | 3.93–5.40 | `and race a [blink].` |
- **Frame description:**
  - Guide stays at x 120–528, y 440–860 (pointing right).
  - URL bar and keycap as in S01, with the spinner still running.
  - **Stopwatch** (hero):
    - ASCII dial ring (ink texture) at x 576–936, y 440–800
    - digits `000 ms` in display 96 px inkDeep at x 583–929, y 572–668
    - label `vs. a blink` in display 48 px inkDeep at x 600–917, y 700–748
    - eye glyph `(◉)` in ink 48 px at x 830–926, y 460–508
  - Header keeps `how a request travels`.
- **Layers:**
  - paper ground: yes
  - ASCII layer: dial ring, guide shading
  - ink lines: dial, path stub, guide
  - signal packet: none
  - character: guide (pointing)
  - UI chrome: stopwatch, URL bar
  - text: digits, label, header, captions
- **On-screen text:** `000 ms` (display 96 inkDeep); `vs. a blink` (display 48 inkDeep); header (display 48 inkDeep); captions.
- **Colours:** ink, inkDeep (2)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 2.50 | Stopwatch scramble-resolves in (10 f); dial ring draws clockwise (12 f) |
  | 2.90 | Guide pose → pointing; a dotted ink path stub grows 0→160 px down-left from the URL bar's left edge (12 f) |
  | 3.75 | Eye glyph blinks (4 f) |
  | 3.93 | `vs. a blink` scramble-resolves (8 f) |
  | 4.40 | Dial ring pulses its density (@ ↔ #, 6 f) |
  | 4.77 | Guide blinks on the word "blink" (4 f) |
  | 5.10–5.37 | Guide ramp exit (8 f) |
  | 5.30 | Stopwatch shrinks and flies to the HUD box at x 640–960, y 280–420 (6 f, easeInOutQuart) |
- **Camera:** locked.
- **Transition out:** hard cut on the `01` slam at 5.50.
- **SFX:** 2.50 `setwatch` (before the VO onset at 2.55), 3.75 `blink` (in the dash pause), 5.10 `tick` (guide exit, after the VO ends at 5.05).
- **Music:** music enters sparse at 2.50: FM-bell arpeggio (F major), no drums, ducked −8 dB. Bell answers in the dash gap at 3.67–3.93.
- **Moodboard:**
  - 05: pixel line-art anime
  - 16: dither anime + editorial type
  - 10: numeral grid digits
  - 24: VHS UI
- **Data props:** `000 ms` (the open loop; payoff value from T§9).

### S03: 01 DNS, the ask
- **Time:** 5.50–9.30 s · frames 165–278 · beat B2 01 DNS
- **VO:** v03 (first part) "Your browser asks D-N-S, the internet's phone book,"
  - "Your browser asks D-N-S" → query card leaves the URL bar (7.55)
  - "the internet's phone book" → resolver "directory" fields type in (8.70)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 5.75–6.75 | `Your browser asks` |
  | 6.75–7.65 | `[DNS],` |
  | 7.65–8.65 | `the internet's` |
  | 8.65–9.30 | `phone book,` |
- **Frame description:**
  - Header: `01` slam plus `dns`. HUD top-right shows `000 ms`, label `dns`.
  - The URL bar shrinks to x 120–588, y 440–520 (text 48 px `example.com`).
  - A vertical dotted ink link runs from (354, 520) to (354, 760).
  - A skyTint dither-cloud band ("the internet") at x 120–960, y 560–740: low density, decorative.
  - **Resolver terminal** (Minitel directory style, ref 25) at x 120–780, y 760–1040:
    - title bar `resolver · 198.51.100.53` (36 px, paper on inkDeep) at y 760–800
    - field `name:` at y 830–866
    - field `address:` at y 880–916
    - both fields are 36 px inkDeep with empty `________` values
  - Query card `example.com A ?` (glyph 48 px inkDeep on a paper plate with a 3 px ink border, 456×64).
- **Layers:**
  - paper ground: yes
  - ASCII layer: cloud band, resolver screen texture
  - ink lines: link, borders
  - signal packet: none (the DNS query is not the tracked packet)
  - character: none
  - UI chrome: URL bar, resolver terminal, HUD
  - text: header, labels, card, captions
- **On-screen text:**
  - `01` (display 96 ink)
  - `dns` (display 64 inkDeep)
  - `example.com` (glyph 48 inkDeep)
  - `example.com A ?` (glyph 48 inkDeep)
  - `resolver · 198.51.100.53` (glyph 36, paper on inkDeep)
  - `name:` / `address:` (glyph 36 inkDeep)
  - HUD
- **Colours:** ink, inkDeep, skyTint (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 5.50 | `01` slams (4 f in, 2 f overshoot, easeOutBack); `dns` scramble-resolves (8 f) |
  | 6.00 | URL bar shrinks and moves up (12 f, easeInOutQuart); resolver terminal types in (12 f) |
  | 6.75 | Query card scramble-resolves out of the URL bar (8 f) |
  | 7.55 | Card travels down the link to y 690 (12 f, easeInOutCubic); link fills solid ink behind it |
  | 7.95 | Card docks; resolver title bar inverts (2 f) |
  | 8.70 | `name: example.com` scramble-resolves (8 f) |

  HUD ticks 000→005 across the shot.
- **Camera:** locked, zoom 1.0.
- **Transition out:** continuous (same layout) into S04.
- **SFX:** 5.50 `slam` (before the VO at 5.75), 7.55 `send` (gap after "D-N-S,"), 9.18 `chirp` (resolver receives, gap after "book,").
- **Music:** 5.50: kick on the slam (beat 4 pickup into bar 4) plus light bit-crushed hats. Bells continue, duck −8 dB.
- **Moodboard:**
  - 10: section numeral
  - 20: pixel-block type
  - 25: Minitel directory = phone book
  - 21: dither cloud
- **Data props:** resolver `198.51.100.53` (T§12.1 `SERVER: 198.51.100.53#53`); query `example.com A` (T§12.1 question section).

### S04: 01 DNS, the answer
- **Time:** 9.30–13.00 s · frames 279–389 · beat B2 01 DNS
- **VO:** v03 (end) "where example dot com lives." and v04 "Back comes an address."
  - "where example dot com lives" → name field inverts and the address field scrambles (9.55 / 10.30)
  - "Back comes an address" → answer card travels up and the URL resolves to the IP (11.35 / 12.00)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 9.30–10.30 | `where example` |
  | 10.30–11.30 | `dot com lives.` |
  | 11.35–12.00 | `Back comes` |
  | 12.00–12.95 | `an [address].` |
- **Frame description:**
  - Same layout as S03.
  - At 11.75 a dig log panel (green-log style, ref 26, rendered in inkDeep on a paper plate) at x 120–960, y 600–740 replaces the cloud band centre:
    - `example.com.  300  IN  A  203.0.113.10` at y 610–646
    - `;; Query time: 12 msec` at y 656–692
    - `cached for 300 s` at y 702–738 (DNS TTL, labelled to avoid confusion with IP TTL)
  - Answer card `203.0.113.10` (glyph 48 inkDeep, paper plate, ink border).
- **Layers:**
  - paper ground: yes
  - ASCII layer: cloud band (fades by ramp at 11.75), resolver texture
  - ink lines: link, borders
  - signal packet: none
  - character: none
  - UI chrome: resolver, log panel, URL bar, HUD
  - text: fields, log, captions
- **On-screen text:**
  - fields: glyph 36 inkDeep
  - answer card: glyph 48 inkDeep
  - log lines: glyph 36 inkDeep
  - URL bar: glyph 48 inkDeep, `example.com` → `203.0.113.10`
  - HUD lap `dns 012 ms`
- **Colours:** ink, inkDeep, skyTint (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 9.55 | `name:` value inverts (paper on inkDeep) |
  | 10.30 | `address:` value scrambles random digits (20 f) |
  | 11.10 | Address resolves to `203.0.113.10` (8 f) |
  | 11.35 | Answer card lifts from the field and travels up the link to the URL bar (12 f, easeInOutCubic) |
  | 11.75 | Card docks; log panel types in (3 lines, 10 f each, staggered 4 f); cloud band ramps out (8 f) |
  | 12.00 | URL-bar text `example.com` scramble-resolves into `203.0.113.10` (10 f) |
  | 12.90 | HUD lap: digits land on `012 ms`, row-3 label inverts for 4 f |

  Only 2 DNS visual steps: ask (S03) → answer (S04). No root/TLD shown (R22).
- **Camera:** locked.
- **Transition out:** scanline wipe at 13.00 (5 f horizontal bands, ref 12).
- **SFX:** 11.10 `tick` (gap before "Back"), 12.90 `tick` (URL → IP + HUD lap, after the VO ends at 12.85).
- **Music:** bells plus kit; one-bar fill at 12.0–13.0 into the groove.
- **Moodboard:**
  - 25: Minitel UI
  - 26: terminal log
  - 03: dither sky
  - 14: pixel type on grid
- **Data props:** `example.com. 300 IN A 203.0.113.10`, `;; Query time: 12 msec`, resolver `198.51.100.53` (T§12.1); DNS TTL 300 s (T§2 step 5); HUD `012 ms` (T§9 first lookup 12 ms).

### S05: 02 Packets, "Data travels in small packets"
- **Time:** 13.00–15.10 s · frames 390–452 · beat B3 02 Packets
- **VO:** v05 "Data travels in small packets."
  - "Data travels" → packet frame snaps around the request (13.60)
  - "in small packets" → header strip stamps plus the size ruler (14.26 / 14.50)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 13.20–14.05 | `Data travels` |
  | 14.05–15.10 | `in small [packets].` |
- **Frame description:**
  - Header: `02` plus `packets` (scramble-typed, no slam). HUD shows `012 ms`, label `handshake`.
  - Request text block, glyph 48 inkDeep, at x 180–720, y 560–680:
    - `GET / HTTP/2`
    - `host: example.com`
  - Packet frame: pixel-block ink border in hero cells (24×40) at x 150–750, y 520–720.
  - Header strip at x 150–906, y 470–506: `192.0.2.23 → 203.0.113.10 · ttl 64` (glyph 36 inkDeep).
  - Size label at x 150–647, y 740–776: `max ≈ 1500 B per packet` (glyph 36 inkDeep). Beneath it, an ASCII ruler bar (texture) at x 150–750, y 790–810.
- **Layers:**
  - paper ground: yes
  - ASCII layer: ruler, wipe bands
  - ink lines: frame
  - signal packet: none yet
  - character: none
  - UI chrome: HUD
  - text: request, strip, label, captions
- **On-screen text:** as listed; `02` (display 96 ink), `packets` (display 64 inkDeep).
- **Colours:** ink, inkDeep (2)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 13.00–13.17 | Scanline wipe (5 f) |
  | 13.17 | Header types (10 f); request text scramble-resolves (8 f) |
  | 13.60 | Frame snaps around the text (4 f in + 2 f overshoot) |
  | 14.26 | Header strip stamps down from y 430 (4 f) |
  | 14.50 | Size label plus ruler type in (8 f) |
  | 14.95 | Whole card settles 1 cell (2 f) |

  HUD 012→016.
- **Camera:** locked, zoom 1.0.
- **Transition out:** continuous into S06.
- **SFX:** 13.00 `crunch` (wipe; gap 12.85–13.20), 14.95 `stamp` (gap after "packets.").
- **Music:** 13.00 is a beat on the 120 BPM grid (bar 7, beat 3): **groove enters**: sine sub (doubled an octave up for phones), bit-crushed kit, light hats. Duck −8 dB under VO, lead silent.
- **Moodboard:**
  - 12: scanline wipe
  - 07: block type grid
  - 26: terminal text
- **Data props:** `GET /` request, `192.0.2.23 → 203.0.113.10`, `ttl 64` (T§12.4 header card); `≈ 1500 B` (T§4 MTU, T§11).

### S06: 02 Packets, "Your request fits in one"
- **Time:** 15.10–17.10 s · frames 453–512 · beat B3 02 Packets
- **VO:** v06 "Your request fits in one."
  - "Your request" → frame compresses to a compact card (15.15)
  - "fits in one" → `= 1 packet` label plus 100 B fill (16.05); card turns tracked-magenta in the gap (16.98)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 15.15–16.05 | `Your request` |
  | 16.05–17.10 | `fits in [one].` |
- **Frame description:**
  - The card compresses to x 360–720, y 560–720. The header strip stays above it at y 470–506.
  - Ruler at x 150–750, y 790–810 fills to 100/1500 (a 40 px ink fill).
  - Label `100 B` (display 48 inkDeep) at x 150–294, y 730–778.
  - Label `= 1 packet` (display 48 inkDeep) at x 150–438, y 820–868.
  - At 16.98 the card collapses into the **tracked packet**: a solid signal block (144×96) at x 468–612, y 592–688 with a paper halo.
- **Layers:**
  - paper ground: yes
  - ASCII layer: ruler texture
  - ink lines: card frame
  - signal packet: tracked request packet (from 16.98)
  - character: none
  - UI chrome: HUD
  - text: strip, labels, captions
- **On-screen text:** `100 B`, `= 1 packet` (display 48 inkDeep); header strip (glyph 36 inkDeep).
- **Colours:** ink, inkDeep, signal (3, from 16.98)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 15.15 | Card compresses (12 f, easeInOutCubic) |
  | 15.60 | Ruler fill steps in (6 f); `100 B` types in (8 f) |
  | 16.05 | `= 1 packet` scramble-resolves (8 f) |
  | 16.98 | Card body text ramps out (4 f) and the block fills signal with a halo (2 f) |
- **Camera:** locked.
- **Transition out:** continuous into S07.
- **SFX:** 17.00 `ping` (turns magenta; gap 16.95–17.20).
- **Music:** groove. Lead answers 2 notes in the 16.95–17.20 gap only.
- **Moodboard:** 01 (magenta accent on blue/cream), 07.
- **Data props:** `100 B` request (T§4 "curl's GET was 100 bytes", one packet; T§10 #3).

### S07: 02 Packets, "about thirteen"
- **Time:** 17.10–20.00 s · frames 513–599 · beat B3 02 Packets
- **VO:** v07 "A typical page's H-T-M-L needs about thirteen."
  - "A typical page's" → ghost page appears (17.20)
  - "H-T-M-L needs" → page slices into cards (18.26)
  - "about thirteen" → counter `13 packets · 18,431 B` (19.14)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 17.20–18.26 | `A typical page's` |
  | 18.26–19.14 | `HTML needs` |
  | 19.14–19.95 | `about [thirteen].` |
- **Frame description:**
  - The tracked request block moves left to x 132–276, y 600–696 (halo kept).
  - Label `index.html · 18 KB (typical)` (glyph 36 inkDeep) at x 355–960, y 440–476.
  - Ghost page: dotted ink outline with ASCII text-line texture at x 480–960, y 490–830.
  - The page then slices into 13 blue cards in a 3-column grid at x 530–956, y 500–740. Each card is 130×40 with a 2 px ink border and label `#01/13` … `#13/13` (glyph 36 inkDeep). Rows: 01–03, 04–06, 07–09, 10–12, 13.
  - Counter `13 packets · 18,431 B` (display 48 inkDeep) at x 355–960, y 760–808.
  - These 13 are the **reply** that comes back in B5. Only the request block leaves now.
- **Layers:**
  - paper ground: yes
  - ASCII layer: page texture, card dissolve
  - ink lines: page outline, card borders
  - signal packet: request block
  - character: none
  - UI chrome: HUD
  - text: labels, card IDs, counter, captions
- **On-screen text:** as above.
- **Colours:** ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 17.20 | Request block slides left (12 f); page outline draws (10 f) plus label types |
  | 18.26 | Page slices horizontally into 13 strips (2 f per slice, 26 f) |
  | 18.90 | Strips fold into cards and snap to the grid (6 f, grid-snapped) |
  | 19.14 | Counter scramble-resolves (10 f) |
  | 19.20–20.00 | Camera tilt down begins (24 f, easeInOutQuart); the request block drops to screen y 900 |
  | 19.55 | The 13 cards ramp-dissolve to `.` (8 f) |

  HUD 016→029.
- **Camera:** tilt down 19.20–20.00; hard-cut into S08 on the slam.
- **Transition out:** hard cut on the `03` slam at 20.00.
- **SFX:** 18.20 `slice` (soft, non-transient, under the unstressed "page's"), 19.90 `tick` (cards dissolve; gap before 20.20).
- **Music:** groove builds (open hat added 19.0–20.0) into the bar-10 downbeat at 20.00.
- **Moodboard:**
  - 07: card grid
  - 14: pixel type on grid
  - 09: blue poster layout
- **Data props:** `index.html · 18 KB`, `#01/13 … #13/13`, `18,431 B` (T§4 median HTML 18 KB ≈ 13 packets; T§12.5 total 18,431 B).

### S08: 03 Routing, "reads the address"
- **Time:** 20.00–24.30 s · frames 600–728 · beat B4 03 Routing
- **VO:** v08 "Each router reads the address and passes it one step closer."

  | Clause | Visual event |
  |---|---|
  | "Each router" | Packet arrives at R1 (20.15–20.55) |
  | "reads the address" | `dst` line flash (20.98) |
  | "and passes it" | Hop R1→R2 (22.05) |
  | "one step closer" | R2 next-hop arrow flips onward (23.60) |
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 20.20–21.00 | `Each router` |
  | 21.00–22.02 | `[reads] the address` |
  | 22.02–23.06 | `and passes it` |
  | 23.06–24.30 | `one step closer.` |
- **Frame description (macro, zoom 2.0):**
  - Header: `03` slam plus `routing`. HUD shows `029 ms`, label `request`.
  - **Packet header readout** (paper plate, 3 px ink border; ref 13 data labels) at x 120–620, y 440–560:
    - `dst 203.0.113.10` (glyph 48 inkDeep)
    - `ttl 64` (glyph 48 inkDeep)
  - Active router cluster at x 180–360, y 640–760. Its label block at x 400–900:
    - line 1, y 640–676: `hop 1 · gw.home.example`
    - line 2, y 684–720: `192.0.2.1`
    - decision line, y 740–776: `0.0.0.0/0 → 198.51.100.1` (all glyph 36 inkDeep)
    - next-hop arrow glyph `↓` (ink 48) at x 250–298, y 780–828
  - Next router cluster partly visible at x 180–360, y 900–1000, joined by a dotted vertical link at x 270.
  - Tracked packet: signal block 96×64 plus halo, riding the link.
  - At R2 the label block becomes:
    - `hop 2 · bras1.isp.example`
    - `198.51.100.1 · AS64496`
    - `next hop → 198.51.100.45`
- **Layers:**
  - paper ground: yes
  - ASCII layer: router clusters, sparse background grid
  - ink lines: links (fill as the packet passes)
  - signal packet: tracked request with its trail
  - character: none
  - UI chrome: readout, HUD
  - text: labels, captions
- **On-screen text:** `03` (display 96 ink), `routing` (display 64 inkDeep), readout (glyph 48 inkDeep), router labels (glyph 36 inkDeep).
- **Colours:** ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 20.00 | `03` slams (4 f + 2 f overshoot) |
  | 20.15–20.55 | Hop D→R1 (12 f, easeInOutCubic) with the magenta trail; camera scrolls 260 px (14 f, easeInOutQuart, 2 f lag) |
  | 20.98 | `dst` line inverts (6 f); R1 cluster density pulses |
  | 21.30 | `ttl 64` → `63` (scramble 8 f; digit inverts 4 f) |
  | 21.60 | Decision line types (8 f); arrow flips to point at R2 (4 f) |
  | 22.05–22.45 | Hop R1→R2 (12 f), camera follows |
  | 22.80 | R2 label block scramble-resolves (8 f); `dst` inverts |
  | 23.10 | `ttl 62` |
  | 23.60 | R2 decision line plus arrow flip |

  HUD 029→030.
- **Camera:** follow-scroll, zoom 2.0.
- **Transition out:** continuous; S09 begins with the next hop.
- **SFX:** 20.00 `slam`, 20.15 `blip1` (before VO onset 20.20), 22.05 `blip2` (on unstressed "and").
- **Music:** **peak** from the bar-10 downbeat at 20.00: full kit, square lead only in VO gaps (e.g. 24.10–24.35), ducked −10 dB whenever the lead is present.
- **Moodboard:**
  - 10: numerals
  - 23: routers as pixel-block clusters on a grid
  - 04: lines as network
  - 13: data labels on line art
- **Data props:** `gw.home.example 192.0.2.1`, `bras1.isp.example 198.51.100.1 AS64496`, next hop `198.51.100.45` (T§12.7); `0.0.0.0/0 → 198.51.100.1` (T§12.8 default); `dst 203.0.113.10`, `ttl 64→63→62` (T§12.4, T§5.3).

### S09: 03 Routing, "no route is reserved"
- **Time:** 24.30–28.30 s · frames 729–848 · beat B4 03 Routing
- **VO:** v09 "No route is reserved — every router decides again, for every packet."

  | Clause | Visual event |
  |---|---|
  | "No route is reserved" | Pull-back to the wide mesh, every link dotted and none solid (24.70–25.50) |
  | "every router decides again" | Ripple of next-hop arrows re-flipping across R1–R4 (25.60) |
  | "for every packet" | Hop R3→R4 (27.25) |
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 24.35–25.55 | `No route is` / `[reserved] —` (2 lines) |
  | 25.55–26.36 | `every router` |
  | 26.36–27.29 | `decides again,` |
  | 27.29–28.30 | `for every packet.` |
- **Frame description:**
  - Starts in macro at R2 → R3, then the camera pulls back to the **wide network map** (see Global conventions).
  - Every link is dotted ink; links the packet has already used are ink-filled but thin.
  - Router tags `1`–`4`, `ix`, `5` and `edge` (glyph 36 inkDeep), full IP only on the active router.
  - The header readout collapses to a tag riding next to the packet: `ttl 62`, glyph 36 inkDeep on a paper plate.
  - Decorative bleed nodes beyond x 960 and above y 270.
  - R3 decision label `next hop → 198.51.100.77` (glyph 36) at x 540–958, y 680–716.
- **Layers:**
  - paper ground: yes
  - ASCII layer: node clusters, bleed nodes at 50% density
  - ink lines: mesh
  - signal packet: tracked request
  - character: none
  - UI chrome: HUD, ttl tag
  - text: tags, decision label, captions
- **On-screen text:** as above.
- **Colours:** ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 24.30–24.70 | Hop R2→R3 (12 f) |
  | 24.70–25.50 | **Pull-back** zoom 2.0 → 1.0 (24 f, easeInOutQuart); readout morphs into the ttl tag (8 f) |
  | 25.60–26.20 | Ripple: R1, R2, R3, R4 arrows flip in sequence, 3 f apart, each 4 f |
  | 26.00 | Tag `ttl 61` |
  | 26.38 | R3 decision label types (8 f) |
  | 27.25–27.65 | Hop R3→R4 (12 f) |
  | 27.80 | R4 tag shows `4 · 198.51.100.77`; its cluster pulses |
  | 28.10 | `ttl 60` |

  HUD 030→031.
- **Camera:** pull-back 24.70–25.50, then locked wide.
- **Transition out:** hard glitch cut (3 f) into S10 at 28.30.
- **SFX:** 24.30 `blip3` (before "No" at 24.35), 25.45 `tick` (ripple; dash pause), 27.25 `blip4` (comma gap before "for").
- **Music:** peak groove. Lead answer at 25.36–25.55 (dash gap only).
- **Moodboard:**
  - 04: power lines as network
  - 17: blue line mesh
  - 23: grid clusters
- **Data props:** `agg2` `198.51.100.45` (hop 3), `core1` `198.51.100.77` (hop 4), `ix 203.0.113.129` (T§12.7); `ttl 62→61→60` (T§5.3).

### S10: 03 Routing, the link failure and reroute (the only red)
- **Time:** 28.30–31.60 s · frames 849–947 · beat B4 03 Routing
- **VO:** v10 "If a link fails, the router picks another."

  | Clause | Visual event |
  |---|---|
  | "If a link fails" | R4–R5a link turns red, breaks, ✕ (28.30) + `link down` (28.60) |
  | "the router picks another" | R4 table: /24 struck, /16 chosen, arrow flips, hop to R5b (29.30–30.60) |
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 28.40–29.62 | `If a link [fails],` |
  | 29.62–30.40 | `the router` |
  | 30.40–31.55 | `picks another.` |
- **Frame description (wide map):**
  - Link R4 (300, 810) – R5a (640, 780) turns `error` red and breaks at its midpoint, where a ✕ glyph (error, 66 px) sits at (470, 795).
  - Label `link down` (glyph 66 px regular, error) at x 380–736, y 860–926 (inside the notch rule: x ≤ 780).
  - **R4 routing-table panel** (terminal chrome, refs 24/25; paper plate with 3 px inkDeep border) drops over the top of the stage at x 120–900, y 430–590. Lines are glyph 36 inkDeep:
    - `route to 203.0.113.10` at y 440–476
    - `203.0.113.0/24  via 203.0.113.129` at y 488–524: struck through with a 4 px error line at 29.30
    - `203.0.0.0/16    via 198.51.100.140` at y 536–572: inverted (paper on inkDeep) at 29.55, with a `▶` marker at x 124
  - R5b label `5 · 198.51.100.140 · AS64500` at x 120–725, y 880–916 (shown from 30.60, after `link down` exits).
  - E label `edge 203.0.113.10` at x 400–767, y 1024–1060.
  - **Colour rule:** from 28.30 to 30.60 every ink element is re-inked to `inkDeep`, so the frame holds inkDeep + signal + error = 3 colours. At 30.60 the error elements turn to a dead paperShade dotted link (✕ removed) and ink returns.
- **Layers:**
  - paper ground: yes
  - ASCII layer: node clusters
  - ink lines: mesh (re-inked inkDeep 28.30–30.60)
  - signal packet: tracked request
  - character: none
  - UI chrome: table panel, HUD, ttl tag
  - text: panel lines, labels, captions
- **On-screen text:** as above. `error` appears only here and only at ≥ 66 px, on the ✕ and `link down`; the strike line is a graphic.
- **Colours:** inkDeep, signal, error (3) during 28.30–30.60; afterwards ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 28.30 | Link snaps red. **Registration slip:** the blue layer offsets 6 px right/down for 2 f. ✕ scramble-resolves (4 f) |
  | 28.60 | `link down` scramble-resolves (8 f) |
  | 28.90 | Table panel drops from y 390 (6 f, easeOutBack) and types (10 f) |
  | 29.30 | /24 line strike draws left→right (6 f) |
  | 29.55 | /16 line inverts plus the ▶ marker |
  | 29.90 | R4 next-hop arrow flips from R5a to R5b (4 f) |
  | 30.20–30.60 | Hop R4→R5b (12 f); link fills |
  | 30.60 | Panel and `link down` ramp out (6 f); error → dead paperShade dotted link; ink restored |
  | 30.80 | R5b label types; tag `ttl 59` |
  | 30.95–31.35 | Hop R5b→E (12 f) |
  | 31.35 | Packet docks at E; E label shows |

  HUD 031→033.
- **Camera:** locked wide; a 2 f 4 px shake on 28.30 (part of the slip).
- **Transition out:** at 31.60 a camera push-in to E starts S11 (continuous).
- **SFX:**

  | t (s) | id | Placement |
  |---|---|---|
  | 28.30 | `crunch` | Failure; gap 28.30–28.45 before "If" |
  | 29.55 | `tick` | Table choice; comma gap after "fails," |
  | 30.20 | `blip5` | Hop 5; unstressed "router" |
  | 31.42 | `chirp` | Arrival at edge; after the VO ends at 31.40 |

  The R5b→E hop is silent, keeping the blip run at 5 rising steps.
- **Music:** 28.30: one bar of bit-crush/low-pass sweep on the groove (tension), resolving at 30.0. Lead silent.
- **Moodboard:**
  - 17: blue lines + red accents
  - 06: red line / registration
  - 25: table panel UI
  - 24: menu chrome
- **Data props:** routing table `203.0.113.0/24 via 203.0.113.129` (longest match) and `203.0.0.0/16 via 198.51.100.140` (T§12.8); `xe-0-1.transit.example 198.51.100.140 AS64500` (T§12.7 hop 6); `ttl 59` (64 − 5 routers, T§5.3 arithmetic); `edge 203.0.113.10` (T§12.7).

### S11: 04 Arrival, "a nearby copy"
- **Time:** 31.60–34.90 s · frames 948–1046 · beat B5 04 Arrival
- **VO:** v11 "Often, the server is a nearby copy." It starts after the 0.65 s near-silence.
  - "Often," → the request block is absorbed into the rack (32.30)
  - "the server" → `edge server` label (32.81)
  - "is a nearby copy" → `copy of example.com · cache HIT` plus the far origin ghost `origin: not asked` (33.46)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 32.25–32.81 | `Often,` |
  | 32.81–33.46 | `the server` |
  | 33.46–34.85 | `is a [nearby] copy.` |
- **Frame description (macro on E):**
  - Header: `04` plus `arrival` (scramble-typed, no slam). HUD shows `033 ms`, label `reply`.
  - Server rack: pixel-block glyph cluster, ink, dense ASCII at x 120–480, y 600–800.
  - `edge server` (display 48 inkDeep) at x 120–437, y 440–488.
  - `203.0.113.10 · AS64511` (glyph 36 inkDeep) at x 120–595, y 496–532.
  - Origin ghost: paperShade dither cloud at x 720–960, y 440–530. Its label `origin: not asked` (glyph 36 inkDeep) at x 590–957, y 540–576.
  - `copy of example.com · cache HIT` (glyph 36 inkDeep) at x 120–790, y 804–840. This is legal: at y ≤ 840 the notch does not apply.
  - At 34.00 the reply prints: 13 cards (130×40, `#01/13`…`#13/13`, glyph 36 inkDeep) in a grid at x 530–956, y 590–800.
- **Layers:**
  - paper ground: yes
  - ASCII layer: rack, origin ghost
  - ink lines: card borders
  - signal packet: request block until 32.30; `#01/13` from 34.80
  - character: none
  - UI chrome: HUD
  - text: labels, cards, captions
- **On-screen text:** as above.
- **Colours:** ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 31.60–32.40 | Camera push-in to E (24 f, easeInOutQuart) |
  | 31.65 | `04 arrival` types (10 f) |
  | 32.30 | Request block ramp-dissolves into the rack (8 f); rack density pulses |
  | 32.81 | `edge server` plus IP line scramble-resolve (8 f) |
  | 33.46 | Copy label types (10 f); origin ghost ramps in to 40% density (8 f) |
  | 34.00 | Page prints out of the rack and slices into 13 cards (10 f, grid-snapped) |
  | 34.80 | `#01/13` becomes tracked: 12 px signal frame plus paper halo, grows 2 cells (4 f) |
- **Camera:** push-in to zoom 2.0 on E.
- **Transition out:** camera pull-back at 34.90 (continuous into S12).
- **SFX:** 31.65 `tick` (header, inside the silence), 34.80 `ping` (#01 tracked; gap 34.75–35.00).
- **Music:** **drop to near-silence** at 31.50 (the nearest beat, just after the VO ends at 31.40): only the vinyl bed until 32.25. Then a soft pad, no drums, under v11.
- **Moodboard:**
  - 23: server cluster on grid
  - 15: terminal-poster layout
  - 21: dither cloud (origin ghost)
- **Data props:** `203.0.113.10 · AS64511` (T§12.7); `cache HIT` / origin not contacted (T§6, T§10 #9); `#01/13 … #13/13` (T§12.5).

### S12: 04 Arrival, "snap into order"
- **Time:** 34.90–38.00 s · frames 1047–1139 · beat B5 04 Arrival
- **VO:** v12 "Thirteen packets stream back and snap into order."
  - "Thirteen packets" → train leaves E (34.95)
  - "stream back" → train climbs the path (36.20)
  - "and snap into order" → cards lock into tray slots `01`–`13`; stopwatch freezes (36.95–37.75)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 35.00–35.97 | `Thirteen packets` |
  | 35.97–36.69 | `stream back` |
  | 36.69–37.95 | `and snap into` / `[order].` (2 lines) |
- **Frame description (wide map):**
  - The dead R4–R5a link is shown dotted in paperShade; the return path is E→R5b→R4→R3→R2→R1→D.
  - Router IP labels are hidden; hop tags only.
  - **Reassembly tray** at x 288–960, y 440–500: 13 slots of 48×60 with labels `01`…`13` (glyph 36 inkDeep).
  - Tray label `13/13 · 18,431 B` (glyph 36 inkDeep) at x 288–634, y 506–542.
  - HUD row 2 scales 48 → 72 px and turns signal at 36.95, when `038 ms` freezes and `first reply` shows inverted in row 3.
- **Layers:**
  - paper ground: yes
  - ASCII layer: nodes, train shimmer
  - ink lines: mesh, fill trail
  - signal packet: `#01/13` until 36.95, then the HUD number
  - character: none
  - UI chrome: tray, HUD
  - text: tray labels, captions
- **On-screen text:** slots, tray label, HUD `038 ms` (display 72, signal ≥ 66 px) and `first reply`.
- **Colours:** ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 34.90–35.60 | Pull-back to wide (21 f, easeInOutQuart) |
  | 34.95 | Train leaves E. Each card hops node→node in 10 f (easeInOutCubic), cards spaced 2 f apart, #01 first. #01 hop starts: 34.95, 35.28, 35.62, 35.95, 36.28, 36.62 |
  | 35.60 | Tray scramble-resolves (8 f) |
  | 36.20 | Train mid-path (R3→R2) with the trail filling links |
  | 36.95 | #01 lands in slot `01`: its frame turns ink (signal handed to the HUD) and the HUD freezes and grows (6 f) |
  | 36.95–37.75 | Cards #02–#13 lock into slots in sequence, 2 f apart, each with a 1-cell overshoot |
  | 37.90 | Tray label types |
- **Camera:** pull-back, then locked wide.
- **Transition out:** push-in toward the HUD at 38.00 (continuous into S13).
- **SFX:**

  | t (s) | id | Placement |
  |---|---|---|
  | 34.92 | `shimmer` | Collective, soft; before "Thirteen" |
  | 36.97 | `stop` | Freeze; unstressed "into" |
  | 37.92 | `clack` | Tray full; gap before 38.00 |
- **Music:** 35.00 (beat): groove re-enters light ("resolve on return") with bells plus sub. No lead. Duck −8 dB.
- **Moodboard:**
  - 04: lines
  - 07: block grid
  - 14: pixel type on grid (tray)
- **Data props:** `13/13 · 18,431 B` (T§12.5); stopwatch `038 ms` = 12 ms DNS + 26 ms first byte (T§9/T§12.9, both [MEASURED] components; T§9 measured the cold total at 41 ms).

### S13: Payoff, the number
- **Time:** 38.00–41.00 s · frames 1140–1229 · beat B6 Payoff
- **VO:** v13 (part 1) "The first reply: about forty milliseconds."
  - "The first reply:" → number lands at headline size (38.20)
  - "about forty" → breakdown lines type (39.28)
  - "milliseconds." → footnote `first reply, not full page` (40.10)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 38.30–39.28 | `The first reply:` |
  | 39.28–40.10 | `about [forty]` |
  | 40.10–40.98 | `milliseconds.` |
- **Frame description:**
  - The network ramps out.
  - Oversized `38 ms` (display 180 px, signal) at x 300–840, y 450–630.
  - `first reply` (display 48 inkDeep) at x 523–840, y 640–688.
  - Breakdown (glyph 36 inkDeep, right-aligned to x 960, y 700–830):

    ```
    dns            12 ms
    handshake    + 17 ms
    request→reply + 9 ms
    ```
  - **Guide** (surprised pose) at x 120–528, y 650–1000, face at x 180–460, y 680–900 (lower-left, outside the notch).
  - Footnote `first reply, not full page` (glyph 36 inkDeep) at x 120–682, y 1010–1046.
  - Header empty. HUD gone (it became the headline).
- **Layers:**
  - paper ground: yes
  - ASCII layer: dither halo behind the number (ink, 20% density), guide shading
  - ink lines: guide strokes
  - signal packet: none (signal on the key number)
  - character: guide (surprised)
  - UI chrome: none
  - text: number, labels, breakdown, footnote, captions
- **On-screen text:** as above.
- **Colours:** ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 38.00–38.80 | Push-in (24 f, easeInOutQuart). The HUD number re-typesets 72 → 180 px on the way; the network ramps out (6 f) |
  | 38.20 | Number lands. **Registration slip:** blue layer offset 6 px for 2 f |
  | 38.90–39.17 | Guide ramp entrance (8 f) |
  | 39.28 | Breakdown lines scramble-resolve (10 f each, staggered 4 f) |
  | 40.10 | Footnote types (8 f) |
- **Camera:** push-in, then locked.
- **Transition out:** continuous into S14.
- **SFX:** 38.00 `chime` (first reply; gap 37.90–38.30), 39.20 `tick` (guide entrance; pause after "reply:").
- **Music:** 38.00 = bar-19 downbeat: tonic F-major resolve. Lead plays a 2-note answer at 38.00–38.30, then drops out. Duck −10 dB from 38.30.
- **Moodboard:**
  - 20: pixel-block headline
  - 09: poster type
  - 10: numerals
  - 16: dither anime + editorial type
- **Data props:** `38 ms`, `dns 12 ms`, `handshake + 17 ms`, `request→reply + 9 ms` (T§9, T§12.3, T§12.9: TLS done at 17 ms, first byte at 26 ms warm, DNS 12 ms first lookup); footnote per T§9 "Implication".

### S14: Payoff, "Faster than a blink!"
- **Time:** 41.00–42.50 s · frames 1230–1274 · beat B6 Payoff
- **VO:** v13 (part 2) "Faster than a blink!"
  - "Faster than" → the magenta 38 ms bar extends (41.13)
  - "a blink" → the blink range bar extends; eye glyph and guide blink (41.74 / 42.20)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 41.13–41.74 | `Faster than` |
  | 41.74–42.45 | `a [blink]!` |
- **Frame description:**
  - Number and `first reply` label stay.
  - The breakdown is replaced by a comparison chart (ref 24 VHS volume bars) at x 560–960, y 700–832, with the scale 0–400 ms mapped to 380 px:
    - label `first reply 38 ms` (glyph 36 inkDeep) at y 700–736
    - solid signal bar, 36 px long (x 560–596), at y 742–762
    - label `blink 100–400 ms` (glyph 36 inkDeep) at y 772–808
    - hatched ink ASCII bar (texture) from x 655 to 940 at y 812–832
  - Eye glyph `(◉)` (ink 48) at x 880–928, y 640–688.
  - Guide switches to the satisfied pose (same box).
  - Footnote stays.
- **Layers:**
  - paper ground: yes
  - ASCII layer: hatched bar, guide shading
  - ink lines: bar outlines, guide
  - signal packet: none (the signal is the 38 ms measurement: number plus bar, one subject)
  - character: guide (satisfied)
  - UI chrome: bar chart
  - text: labels, number, captions
- **On-screen text:** as above.
- **Colours:** ink, inkDeep, signal (3)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 41.00 | Breakdown scramble-swaps into the chart labels (8 f) |
  | 41.13 | Magenta bar extends (12 f, stepped per cell) |
  | 41.74 | Blink bar extends (12 f); guide pose → satisfied |
  | 42.20 | Eye glyph and guide blink together (4 f) |
- **Camera:** locked.
- **Transition out:** scanline wipe at 42.50.
- **SFX:** 41.02 `tick` (chart; gap before "Faster"), 42.20 `blink` (after "blink!" ends at 42.15).
- **Music:** tonic sustain; bells sparkle in 42.15–42.50.
- **Moodboard:**
  - 24: VHS bars
  - 08, 05: anime face
  - 16
- **Data props:** `blink 100–400 ms` (T§9 blink study), `first reply 38 ms` (as S13).

### S15: Loop bridge, "because you hit—"
- **Time:** 42.50–45.00 s · frames 1275–1349 · beat B7 Loop
- **VO:** v14 "All that, because you hit—"
  - "All that," → wipe clears everything back to the empty URL bar (42.50–42.67)
  - "because you hit—" → `example.co` is retyped and the guide ramps back in, ready for the frame-0 keystroke (43.40 / 44.37)
- **Captions:**

  | Time (s) | Caption |
  |---|---|
  | 42.80–43.57 | `All that,` |
  | 43.57–44.85 | `because you [hit]—` |

  No caption from frame 1346 on.
- **Frame description:** identical layout to S01:
  - URL bar at x 120–588, y 900–996
  - keycap at x 612–780, y 900–996
  - guide box at x 120–528, y 440–860
  - header empty, no HUD
  - top ASCII bleed band as S01

  **Frame 1349 = frame 0:**
  - URL `example.co` with the cursor "on"
  - keycap up
  - guide at ramp stage `#` with the same glyph seed as f0
  - header empty, no caption
  - ASCII texture seeded as f0
- **Layers:**
  - paper ground: yes
  - ASCII layer: wipe bands, top bleed, guide ramp
  - ink lines: URL bar, keycap
  - signal packet: none
  - character: guide (exit 42.50–42.77; re-entry 44.37→)
  - UI chrome: URL bar, keycap
  - text: URL, captions
- **On-screen text:** URL (glyph 64 inkDeep); captions.
- **Colours:** ink, inkDeep (2)
- **Motion:**

  | t (s) | Event |
  |---|---|
  | 42.50–42.67 | Scanline wipe (5 f), top→bottom; guide ramp exit (8 f, 42.50–42.77) |
  | 42.67 | URL bar plus keycap scramble-resolve (8 f), empty, cursor blinking (15 f on / 15 f off, phased so frames 1335–1349 and 0–14 are "on") |
  | 43.40–43.85 | `example.co` types in (10 chars over 14 f, autocomplete-fast) |
  | 44.37 | Guide ramp-in begins: `.` at 44.37, `+` at 44.60, `#` at 44.83, holding `#` to f1349 |

  S01 then continues `#`→`@`→resolved by f9.
- **Camera:** locked.
- **Transition out:** loop to frame 0 (seamless; typing continues with `m` at f1).
- **SFX:** 42.50 `crunch` (wipe; gap before 42.80), 43.40 `type` (one soft burst; gap after "that,"). No SFX after 43.85, so the seam window stays ≤ 3 starts.
- **Music:** strips back to the S01 bed (vinyl plus sine pulse) by 42.50. The 45.0 s file ends at beat 3 of bar 23. Write the last bar as 2/4 so the loop seam lands on a downbeat.
- **Moodboard:**
  - 12: scanline wipe
  - 18: ASCII dissolve
  - 01: core look
  - 24: UI
- **Data props:** `example.com` (typed as `example.co` + `m` at f1).

### Shot contiguity check

S01 0.00–2.50 | S02 2.50–5.50 | S03 5.50–9.30 | S04 9.30–13.00 | S05 13.00–15.10 | S06 15.10–17.10 | S07 17.10–20.00 | S08 20.00–24.30 | S09 24.30–28.30 | S10 28.30–31.60 | S11 31.60–34.90 | S12 34.90–38.00 | S13 38.00–41.00 | S14 41.00–42.50 | S15 42.50–45.00.

Frames: 0–74, 75–164, 165–278, 279–389, 390–452, 453–512, 513–599, 600–728, 729–848, 849–947, 948–1046, 1047–1139, 1140–1229, 1230–1274, 1275–1349. There are no gaps or overlaps, and the total is 1350 frames.

### Guide screen time (R20)
| Span | Duration |
|---|---|
| 0.00–5.37 | 5.37 s |
| 38.90–42.77 | 3.87 s |
| 44.37–45.00 | 0.63 s |
| **Total** | **9.87 s = 21.9 %** of runtime |

---

## 4. Rule compliance (format.md checklist)

| # | Rule | Status | Where / how |
|---|---|---|---|
| R1 | Frame 0 has motion + subject | PASS | S01 f0: typing in progress (`m` at f1, Enter at f3), guide mid-ramp, cursor. No logo or fade |
| R2 | Hook ≤ 8 words, done ≤ 2.0 s, viewer's action | PASS | v01 "Enter. Where did it go?" = 5 words, 0.20–1.90, names the viewer's keystroke |
| R3 | Proposition ≤ 3.0 s; payoff promise on screen ≤ 5.5 s | PASS | Header `how a request travels` at 1.95; VO "Let's follow it" by 3.39. Stopwatch `000 ms` at 2.50 and `vs. a blink` at 3.93 (S02) |
| R4 | Face readable at hero scale within 12 frames | PASS | S01: face resolved by f9 (0.30 s), box 408×420, hero 24×40 contour cells |
| R5 | Runtime 43–47 s; 105–115 words at 155–165 wpm | PASS | 45.00 s; 106 words; 163 wpm over 39.05 s of speech |
| R6 | Sentences ≤ 16 words, mean ≤ 10, one idea each | PASS | Max 13 (v03), mean 6.6 over 16 sentences (§2) |
| R7 | Punctuation budget | PASS | 1 "!" (v13 payoff), 0 "…", 1 "?" (hook), 0 CAPS emphasis, no SSML |
| R8 | Numbers as words; IPs/IDs on screen only | PASS | "thirteen", "forty". All IPs, `#01/13`, `38 ms` are on-screen only |
| R9 | Visible change every ≤ 2.0 s; one visual event per clause | PASS | Largest gap between listed events is 0.93 s (16.05 → 16.98, S06). Every shot's VO field maps each clause → event |
| R10 | Major interrupt every 6–8 s; no type > 2 uses | PASS | §1 interrupt table: max gap 7.50 s; slam ×2, wipe ×2, scale-change ×2, slip ×2, guide-entrance ×2 (the 44.37→0.00 entrance counts once across the seam), error ×1, music-drop ×1. `02`/`04` are typed, not slammed |
| R11 | Beats ±1 s; DNS ≤ 6 s; Routing longest ≥ 9 s; payoff 37–42 s | PASS | DNS at 5.50; Routing 11.60 s (longest); payoff lands at 38.00–38.20. Only deviation: Routing end/Arrival start at 31.60 (+0.6 s) |
| R12 | Last frame = frame 0; line hands off; no end card | PASS | S15 f1349 spec = S01 f0; v14 "…because you hit—" → v01 "Enter." No CTA |
| R13 | Essential content in safe rect, not in the notch | PASS | All coordinates in §3 lie within x 120–960, y 270–1245. At y > 840 everything ends at x ≤ 780 (URL bar, keycap, `link down`, R5b/E labels, footnote, captions). Bleed items are decorative only |
| R14 | Captions 64 px, lh ≥ 75, ≤ 17 chars, ≤ 2 lines, x = 120, y 1080–1245 | PASS | Global caption spec. The longest chunks are 17 chars ("Let's follow it —", "and race a blink.", "is a nearby copy."); two-line chunks in S09 and S12 |
| R15 | Verbatim VO chunks of 1–4 words, ≥ 0.3 s/word, no straddling | PASS | All 43 chunks checked: word sequence equals the VO, each chunk sits inside its shot, all meet ≥ 0.3 s/word. Letter-spelled "D-N-S"/"H-T-M-L" are displayed as "DNS"/"HTML" (same words) |
| R16 | inkDeep on paper plate; emphasis by inversion | PASS | Global caption spec; [bracketed] words are inverted, never magenta |
| R17 | Readable text ≥ 36 px, key words ≥ 48 px; 12×20 ASCII texture only | PASS | Smallest text is 36 px (labels). Key words and headers are 48–180 px. The ASCII layer carries no meaning |
| R18 | No ink text < 100 %; no skyTint text; signal/error text ≥ 66 px | PASS | All text is inkDeep (or ink at 100 % for the `01`/`03` numerals and `>` prompt). skyTint is used only in the cloud band (S03–S04). Signal text: `038 ms` 72 px and `38 ms` 180 px. Error text: `link down` and ✕ at 66 px |
| R19 | Magenta on ≤ 1 subject; tracked packet differs by shape/size/halo | PASS | Signal is handed off one subject at a time: request block (16.98–32.30) → `#01/13` (34.80–36.95) → the stopwatch value (36.95–42.50). Block ≥ 2 cells larger, paper halo, trail |
| R20 | Guide ≤ ⅓ stage, ≤ 40 % runtime, one role, not in the notch | PASS | Box ≤ 408×440 (≤ 32 % of stage); 9.87 s = 21.9 %; guide role only; always at x ≤ 528 |
| R21 | Wording: no self-routing packets, no "fastest route", no "dozens" | PASS | v08–v10 make routers the subject ("Each router…", "every router decides…", "the router picks another"). The alternative path is shown only as a reroute after a failed link (S10) |
| R22 | DNS ≤ 2 visual steps; phone book ≤ 1 phrase | PASS | S03 ask → S04 answer; "the internet's phone book" said once |
| R23 | Mix: duck ≥ 8 dB (≥ 10 with lead), no lead under stressed words, −14 LUFS / ≤ −1 dBTP | PASS | Music notes per shot: duck −8 dB, −10 dB when the lead is present; the lead plays only in VO gaps. Master −14 LUFS integrated, ≤ −1 dBTP (to be enforced at the mix stage) |
| R24 | ≤ 3 SFX starts/s; hop blips only on the tracked packet, ≤ 8 steps; no transient on stressed words | PASS | 38 SFX starts. The worst 1 s window, including the loop seam, has 3. Blips 1–5 only on the magenta request. Every transient is placed in a VO gap or on an unstressed syllable (listed per shot) |
| R25 | Voice settings / single tag | PASS | §1 header: stability 0.50, similarity 0.75, style 0, speed 1.03, one global tag, no `[excited]` |

---

## 5. Fact check

| # | Claim (VO or on screen) | Where | Support in technical.md |
|---|---|---|---|
| 1 | Pressing Enter starts the request to `example.com` | v01/v14, S01 | §1 steps 1–4 |
| 2 | "Your browser asks D-N-S… where example dot com lives" | v03, S03 | §2 (stub → recursive resolver, A record); §11 "phone book" |
| 3 | "the internet's phone book" (single phrase) | v03 | §11 safe simplification row 1 |
| 4 | "Back comes an address" / `example.com. 300 IN A 203.0.113.10`, `Query time: 12 msec`, resolver `198.51.100.53` | v04, S04 | §2 step 4–5; §12.1 prop |
| 5 | `cached for 300 s` (DNS TTL, not IP TTL) | S04 | §2 step 5 (TTL 300 s); §10 #6 |
| 6 | DNS lookup 12 ms (HUD lap) | S04 | §2 table "Full curl name lookup, first try 12 ms"; §9 |
| 7 | "Data travels in small packets" / `max ≈ 1500 B per packet` | v05, S05 | §4 MTU 1500 (RFC 894); §11 row 4 |
| 8 | Header card `192.0.2.23 → 203.0.113.10 · ttl 64` | S05 | §12.4 prop; §5.3 Linux TTL 64 |
| 9 | "Your request fits in one" / `100 B` | v06, S06 | §4 "curl's GET… 100 bytes… one packet"; §10 #3 |
| 10 | "A typical page's H-T-M-L needs about thirteen" / `18 KB (typical)`, `#01/13…#13/13`, `18,431 B` | v07, S07, S11, S12 | §4 median HTML 18 KB ≈ 13 packets; §12.5; §13 #5 |
| 11 | "Each router reads the address and passes it one step closer" | v08, S08 | §5.3 per-hop forwarding (RFC 1812); §11 row 7; §13 #7 |
| 12 | TTL drops by one per router: 64→63→62→61→60→59 | S08–S10 | §5.3 "decrements TTL by 1"; §12.6 (our 5-router arithmetic) |
| 13 | Hop names/IPs/ASNs: `gw.home.example 192.0.2.1`, `bras1 198.51.100.1 AS64496`, `198.51.100.45`, `198.51.100.77`, `ix 203.0.113.129`, `198.51.100.140 AS64500`, `203.0.113.10 AS64511` | S08–S12 | §12.7 plausible traceroute (hops 1–6) and near-CDN 6-hop variant |
| 14 | Default route decision `0.0.0.0/0 → 198.51.100.1` | S08 | §12.8 prop; §5.1 default gateway |
| 15 | ~6 hops to a nearby edge (5 routers + edge shown) | S08–S10 | §5.5 "Home → CDN edge 6 hops" [MEASURED]; §12.7 near-CDN variant |
| 16 | "No route is reserved — every router decides again, for every packet" | v09, S09 | §5.4 "What's true" and simplification ✅1; §13 #13 |
| 17 | "If a link fails, the router picks another" / table: /24 via 203.0.113.129 struck, /16 via 198.51.100.140 chosen | v10, S10 | §5.4 "path can change… when links fail"; §5.4 ✅2 "rerouting around a failed link"; §5.3 longest-prefix match; §12.8 prop |
| 18 | Routers pick the next hop, not the whole path | S08–S10 visuals | §5.3 "Each only picks the next hop"; §10 #7 |
| 19 | "Often, the server is a nearby copy" / `edge server`, `copy of example.com · cache HIT`, `origin: not asked` | v11, S11 | §6 CDN edges; §6 evidence `cf-cache-status: HIT`; §10 #9; §13 #12 |
| 20 | The response, not the request, is split into 13 packets | S07, S11 | §4 "The response gets split"; §10 #3 |
| 21 | "Thirteen packets stream back and snap into order" / tray `01–13` | v12, S12 | §7 "receiver's TCP reorders by sequence number"; §11 "Pieces are put back in order" |
| 22 | Return packets use the working path (one flow, one path) | S12 | §5.4 per-flow ECMP keeps one connection on one path |
| 23 | HUD `handshake` phase (+17 ms) | S05–S07 HUD, S13 | §3 TCP + TLS 1.3; §9 "TLS 1.3 done 16–17 ms"; §12.3 |
| 24 | `request→reply + 9 ms` | S13 | §12.3 (Finished+GET at t+17 → first byte at t+26); §9 TTFB 26–28 ms warm |
| 25 | "The first reply: about forty milliseconds" / `38 ms` | v13, S12–S14 | §9: DNS 12 ms + warm TTFB 26 ms = 38 ms; measured cold TTFB 41 ms. Both ≈ "about forty" |
| 26 | "Faster than a blink" / `blink 100–400 ms` | v13, S14 | §9 human blink 100–400 ms; §11 "first reply… faster than a blink"; §13 #15 |
| 27 | `first reply, not full page` | S13–S14 | §9 Implication; §10 #12 |
| 28 | HUD intermediate values (029→033 outbound, 033→038 return) | S08–S12 | [INFERENCE] split of the 9 ms request/response leg into about half an RTT each way, from §12.3 RTT ≈ 8 ms. Label `slow-mo` marks the HUD as illustrative |
| 29 | All IPs/ASNs/names are documentation-safe | all | §12 (RFC 5737 IPv4, RFC 5398 ASNs, RFC 2606 names) |

---

## 6. Open questions for the director

1. **Payoff number.** The stopwatch shows `38 ms` (12 ms DNS + 26 ms warm TTFB, both measured components). The measured cold total was 41 ms (T§9). Keep 38, which matches the brief's "~30–40 ms", or show `41 ms` as the single measured figure? The VO "about forty" works for both.
2. **Home gateway address.** `192.0.2.1` and the client `192.0.2.23` are documentation addresses. A real home LAN would be `192.168.x.x` and would be NATed at hop 1 (T§12 deviation note). The header card shows the pre-NAT source only once (S05). Acceptable?
3. **Guide presence.** She appears only in Hook/Promise and Payoff/Loop (21.9 %). A mid-routing reaction (F§7 suggestion) would be a third guide entrance and break "no interrupt type > 2 uses". Add one if the director doesn't count guide entrances as interrupts.
4. **Beat shift.** Routing runs to 31.60 (+0.6 s vs F§4) so v10 fits at 163 wpm; Arrival is 6.40 s. OK?
5. **Caption spelling.** TTS text uses "D-N-S"/"H-T-M-L" for pronunciation; captions show "DNS"/"HTML". Confirm this counts as verbatim.
6. **Music grid.** 120 BPM anchored at 0.00 puts slam 03 (20.00) and the payoff (38.00) on bar lines and slam 01 (5.50) on a beat-4 pickup. The 45 s loop needs a final 2/4 bar. Alternatively, nudge slam 01 to 6.00 (still ≤ 6 s, R11) to put it on a bar line.
7. **Doc drift.** `motion.md` cites "ref 11" for scanline wipes. After the INDEX fix, the scanline reference is **12** (used here). `sound.md` still says 150–160 wpm and −8 dB duck; this board follows the checklist (155–165 wpm; −10 dB under the lead).
