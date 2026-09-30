# Design Bible — "Fleet Spec Sheet"

This document is the reference for every visual decision. If a choice is unclear, check it against this file. Moodboard refs are cited by their `NN` number (see `moodboard/INDEX.md`).

## One-line direction
An industrial spec sheet that comes alive. Every cluster is a block of lit dots on a dark dot-matrix field, and the fleet moves as one body, like a container ship steered from a single bridge. The palette is Azure blue plus Fleet Manager purple.

## Core metaphor (from the product icon)
The official Fleet Manager icon (`animation/assets/images/fleet-manager-icon.svg`) shows **stacked purple containers on a blue hull riding light-blue waves**. The video takes its visual system from it:
- **Cluster = container glyph**: a rounded square with two vertical bars, drawn as a 5×5 dot cell at a sub-pitch of 12 px (60 px glyph) or 24 px (hero glyph, 120 px). Its top-left snaps to the 24 px grid. Unmanaged clusters are outlined with dim dots. Managed clusters are filled.
- **Fleet = hull**: when clusters join, they snap into rows on one shared baseline (the hull).
- **Waves = the signature line**: a light-blue dotted wave, drawn as a halftone field warped by a sine (04). It carries every "the fleet moves as one" moment.

## Pillars
1. **Everything is dots on a grid.** Clusters, arrows, progress bars and numerals are all built from dots on a 24 px pitch (01, 05, 06, 07, 10, 11, 28, 29). Solid fills are rare. They are reserved for type and the final icon.
2. **Spec sheet, not sci-fi.** Hairline rules, crosshair registration marks, bracketed mono labels and a numbered section structure (02, 03, 15, 16). The feel is calm, precise, engineered.
3. **One hub, many members.** Composition always radiates from a centre or a single baseline (16, 24). Sprawl looks scattered and off-grid; order looks snapped to grid.
4. **Status is visible.** Every cluster carries a legible state: version, region, stage (17, 18, 19). Colour encodes state, not decoration.
5. **Truthful claims.** Every line of copy traces to the product page or the docs overview (see `brief.md`). Preview features are labelled `(preview)`. Numbers on screen are illustrative, never stated as customer data.

## Colour roles (summary; full table in `palette.json`)
| Role | Hex | Meaning |
|---|---|---|
| ground | `#0B0F17` | background, every frame |
| dotOff | `#1F2A3A` | unlit dot / idle grid |
| rule | `#34425A` | hairlines, crosshairs, construction circles |
| paper | `#EEECE2` | primary text on dark; spec-sheet plates |
| mute | `#8894A8` | secondary mono labels |
| azure | `#0078D4` | **Azure**: healthy, updated, completed stage, hull |
| azureLight | `#83B9F9` | wave line, lit-dot glow, blue text on dark |
| fleet | `#773ADC` | **Fleet Manager**: hub, membership, placement |
| fleetLight | `#A67AF4` | purple text/labels on dark, container fill |
| fleetPale | `#B796F9` | container bars, halos |
| drift | `#F5600A` | out-of-date / unmanaged / pending (hook and pending stages only) |

## Palette derivation
Raw quantised colours (`magick <img> -resize 400x -colors 8 -format %c histogram:info:-`):
- **Seed 01 (IBM System/3):** `#232A28` 51 %, `#394239` 19 %, `#F1320F` 2 %, `#572218`, `#B2361E`, `#424843`, `#E1E1D7`, `#8E8676`.
- **`_overview.jpg`:** `#EEECE2` 38 %, `#171818` 25 %, `#58504A`, `#F5600A`, `#ADABA6`, `#757F81`, `#C23E1D`, `#E3D81D`.
- **13 (dot vortex, the one purple ref):** `#060506`, `#BF4167`, `#56384B`, `#C25C99`, `#D1A7AE`, `#535BA7`, `#D1A969`, `#6B97C3`.
- **Product icon SVG fills:** `#0078D4` (hull), `#773ADC`, `#A67AF4`, `#B796F9` (containers), `#83B9F9` (water).

Hand-tuned changes:
- **ground `#0B0F17`** ← seed `#232A28`. Darkened by about 60 % and shifted from green-grey to blue-grey, so that Azure blue and purple read as light on it rather than competing with a green cast. `#232A28` would give azure only 3.2:1.
- **dotOff `#1F2A3A`** ← seed grid dots `#394239`. The same hue shift as ground. Its value is kept just above ground so the idle dot grid is visible but quiet, as in 01, 05 and 11.
- **rule `#34425A`**: dotOff plus one step of value, used for hairlines. Blends between `#394239` and `#424843` in hue-shifted form.
- **paper `#EEECE2`** ← overview `#EEECE2`, used unchanged. The whole moodboard's paper tone becomes our text and plate colour.
- **mute `#8894A8`** ← overview `#757F81` / `#ADABA6`, cooled. Gives 6.3:1 on ground, so it is safe for small mono labels.
- **azure `#0078D4`**: MS Azure blue, unchanged (user brief and icon hull). It gives only 4.2:1 on ground, so it is used for dots, fills and ≥ 48 px type only.
- **azureLight `#83B9F9`**: icon water, unchanged. 9.4:1 on ground; used for readable blue text.
- **fleet `#773ADC`**: icon container shade, unchanged (user brief). 3.1:1 on ground, so it is never used for text. It serves as fills, the hub and halos.
- **fleetLight `#A67AF4` / fleetPale `#B796F9`**: icon container tones, unchanged. fleetLight gives 6.1:1 and is used for purple text.
- **drift `#F5600A`** ← overview `#F5600A` and seed `#F1320F`. The moodboard's dominant accent is kept, but only as a warning state. This connects the refs to the story: orange is how the world looks before Fleet Manager arrives, and it is gone by the final 20 s.

## Visual vocabulary
| Element | Treatment | Refs |
|---|---|---|
| Dot field | 24 px pitch grid of 4 px `dotOff` dots across the whole frame; lit dots 8–12 px with an 18 px soft glow | 01, 05, 06, 07, 10, 11 |
| Cluster glyph | 5×5 lit-dot container (rounded square + 2 bars), label below in mono 20 px: name · region · version | 01, 06, 24, icon |
| Hub | Container glyph at 2× in `fleet` with concentric construction circles + crosshairs in `rule` | 16, 22 |
| Membership links | Dotted lines (6 px pitch) hub → member, drawn on in `fleetLight` | 12, 16 |
| Update stage | Row of clusters; dots fill `dotOff` → `azure` left-to-right like a progress bar; stage label + `PASS` | 08, 09, 17 |
| Approval gate | Bracketed mono chip `[ APPROVED ]` inverted (ground on fleetLight) | 18, 19 |
| Placement | Arrow-of-arrows flock (many small dot arrows forming one arrow) travelling hub → targets; matched clusters light purple, others dim | 11, 12, 13 |
| Policy panel | Paper-on-ground mono UI panel with toggles and key: value rows | 25, 27 |
| Namespace | Translucent `fleet` band spanning several cluster columns; stacked-layer outline | 24, 27 |
| Reach | Wireframe dot globe + coordinate readouts | 21, 22 |
| Numerals | Doto (dot-matrix variable font) at 160–320 px | 01, 15, 28 |
| Wave | `azureLight` halftone band warped by a sine; ripples on every "fleet moves as one" beat | 04, 14 |
| Chrome | Corner crosshairs at 96 px margins, top spec strip `AZURE KUBERNETES FLEET MANAGER — SPEC 0N / …` | 02, 03, 16 |

## Do
- Snap every resting position to the 24 px dot grid.
- One idea per frame: a headline (Inter Tight), a single mono sub-line, and the diagram.
- Colour means state: drift = unmanaged or pending, azure = done or healthy, fleet = Fleet Manager acting.

## Don't
- No glossy 3D, lens flares, cyberpunk neon or hazard stripes (rejected 825073594256860929, 155303888193062420).
- No stock photography or people.
- No more than three state colours at once (ground, dotOff, rule, paper and mute don't count).
- Never show a preview feature without `(preview)`.

## Files
`palette.json` · `typography.json` · `motion.md` · `composition.md` · `sound.md` · `moodboard/INDEX.md`
