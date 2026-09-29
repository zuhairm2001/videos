# Design Bible — "ASCII / Terminal Anime"

The oracle for every visual decision. When in doubt, return here.

## One-line direction
A risograph-poster world rendered in characters: anime figures built from ASCII and dither, living inside a cream-paper terminal, lit by a single electric blue.

## Pillars
1. **Everything is made of glyphs.** Characters, routers, packets and clouds are rendered through an ASCII/dither shader. Solid fills are rare and deliberate.
2. **Print, not screen.** Cream paper ground, ink-like blue, registration offsets, halftone. The terminal is printed, not glowing.
3. **Anime as the human anchor.** One recurring character (line-art, 1-bit shaded) is our guide. Her face is the only place we allow fine detail.
4. **Data is legible.** Real-looking IPs, hop counts, TTLs, timestamps. Numbered sections (01, 02…) as in the poster references.
5. **Restraint in colour.** Cream + blue carry 90% of frames. Magenta is the accent for "the thing to watch" (our packet). Red only for errors/drops.
6. **Accuracy.** Never claim packets choose their own route, take "the fastest route", or cross "dozens of machines". Routers pick the next hop per packet; no route is reserved (see `references/research/technical.md` §10).

## Voice
Narration is "smooth but upbeat" — ElevenLabs voice **Brittney** (UK female): warm even timbre, bright smiling delivery, 155–165 wpm, not hype-y.

## Visual vocabulary
Ref numbers follow the file names in `moodboard/INDEX.md`.

| Element | Treatment | Refs |
|---|---|---|
| Guide character | Line-art anime girl, 1-bit dither shading, ASCII dissolve on enter/exit | 01, 05, 08, 16, 18 |
| Packets | Small magenta glyph blocks with a numeric header (`#03/12`); the tracked packet also differs by shape, size and a paper halo | 01, 07 |
| Routers / nodes | Pixel-block glyph clusters on a grid, labelled with monospace IPs | 10, 14, 23 |
| Network links | Thin blue lines, dotted when idle, filled as packets travel | 04, 17 |
| Sky / "the cloud" | Dithered blue-to-cream cloud textures | 03, 21, 22 |
| Data labels | inkDeep monospace ≥ 36 px on leader lines | 12, 26 |
| Terminal chrome | VHS/Minitel-style menus, blocky title bars | 15, 24, 25, 26 |
| Type moments | Oversized pixel/block type filling the frame | 07, 09, 14, 20 |

## Do
- Keep a visible character grid; snap motion to it.
- Leave generous cream negative space; one idea per frame.
- Let ASCII density describe light and depth.

## Don't
- No glossy gradients, bloom-heavy neon, or dark-mode cyberpunk.
- No stock "globe with arcs" imagery.
- No more than three colours on screen at once (excluding the ground).

## Files
- `palette.json`, `typography.json`, `motion.md`, `composition.md`, `sound.md`
- Moodboard: `moodboard/INDEX.md`
