# Composition — 9:16 (1080×1920)

Binding source: `../references/research/format.md` → "Rules for our storyboard (checklist)" (rules 13, 14, 20).

## Grid
- ASCII cell 12×20 px → 90 columns × 96 rows (texture grid; motion snaps to it).
- Layout grid: 6 columns, 60 px margins, 24 px gutters.

## Safe areas (universal short-form)
- **Safe rect: x 120–960, y 270–1245.** All essential content (labels, numbers, captions, the character's face) sits inside it.
- **Right-rail notch:** no essential content at **x > 780 when y > 840** (like/share rail).
- Outside the safe rect: texture, bleed type and decorative ASCII only.

## Zones
| Zone | Rows (px) | Columns (px) | Use |
|---|---|---|---|
| Header | 270–420 | 120–960 | Section number + short label (`02 — dns`) |
| Stage | 420–1060 | 120–960 (≤ 780 below y 840) | Main action: character, network, packets |
| Caption | 1080–1245 | 120–780 | VO caption: IBM Plex Mono 64 px, left-aligned at x = 120, ≤ 2 lines |

## Principles
- One subject per frame; poster-like asymmetry, heavy negative cream space.
- Vertical travel reads as "distance" — packets travel top↔bottom so the portrait frame is used for the journey.
- Data annotations (IPs, TTLs) hug subjects with thin leader lines, as in refs 04 and 12.
- Oversized type may bleed off-frame edges (refs 07, 14, 20) — bleed parts are decorative, never essential.
- Guide character ≤ ⅓ of stage area, never in the lower-right rail zone.
