# Composition

## Frame
- 1920×1080, 16:9. The world coordinates are screen pixels with the origin at the top-left.
- **Dot grid:** 24 px pitch. Dot centres sit at `x = 12 + 24i` and `y = 12 + 24j`, which gives an 80 × 45 grid. The idle grid dots are 4 px `dotOff`.
- **Margins:** 96 px (4 dots) on all sides. Title-safe is `96 ≤ x ≤ 1824`, `96 ≤ y ≤ 984`.
- **Chrome (every scene):**
  - A corner crosshair is centred 48 px in from each corner: 24 px arms, 1.5 px, in `rule`.
  - The top spec strip is set in mono 18 px, `mute`, with its baseline at y = 60. It reads `AZURE KUBERNETES FLEET MANAGER` at x = 96 on the left and `SPEC 0N / <SECTION>` right-aligned to x = 1824.
  - The bottom strip, baseline y = 1040, carries a timecode-style counter `00:00:00` on the left and `[ FLEET ]` on the right. It is always present, is purely decorative, and never carries claims (02, 03).

## Layout grid
12 columns, each 136 px wide with a 16 px gutter, starting at x = 96.
- **Split layout** (feature scenes): the headline block sits in columns 1–5 (x 96–744), and the diagram sits in columns 6–12 (x 760–1824).
- **Centred layout** (reveal, CTA): the hub or icon is at (960, 480), the headline is centred at y ≈ 760, and the sub-line at y ≈ 860.

## Headline block (split layout)
- The section chip `01 · SAFE UPDATES` is mono 22 px `fleetLight` at (96, 180).
- The headline is Inter Tight 800 84 px `paper`, top at y = 230, with at most 3 lines and 12 words. Any line wider than the 648 px column steps down in size (84 → 72 px minimum) until it fits. Every line in a headline uses the same size.
- The sub-line is mono 28 px `mute`, top at y = headline bottom + 40, with at most 3 lines of 38 chars each (the 648 px column at a 16.8 px advance). Centred layouts allow up to 72 chars.

## Principles
- **Radiate from one point.** Every diagram has a single origin: the hub (feature scenes) or the left end of the stage row (updates). The eye starts there (16).
- **Negative space.** At least 40 % of the frame shows only the idle dot grid.
- **Asymmetry in features, symmetry in brand moments.** Reveal and CTA are centred; feature scenes are split.
- **Depth by dot size, not blur.** Background clusters use 6 px dots at 60 % opacity, and foreground clusters use 10 px dots (10).
