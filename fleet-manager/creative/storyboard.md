# Storyboard: Azure Kubernetes Fleet Manager (promo)

Sources:
- `brief.md`
- `design/design-bible.md`, `palette.json`, `typography.json`, `motion.md`, `composition.md`, `sound.md`
- Moodboard refs, cited by number as `[NN]` (see `design/moodboard/INDEX.md`)
- The timing layer (`timeline/timeline.json`) is the source of truth for every time listed here. Scenes read their cue times from it by id (`cue("s05.stage1.sweep")`), so they never hard-code them.

## Header
| Item | Value |
|---|---|
| Runtime | **60.00 s = 1800 frames** (0–1799) |
| Format | 1920×1080, 16:9, 30 fps |
| Voice-over | none. On-screen type carries the message |
| Music | 120 BPM, 4/4, bar = 2.00 s, 30 bars. Every scene boundary lands on a bar line |
| Claims | Every claim below traces to the [product page](https://azure.microsoft.com/en-us/products/kubernetes-fleet-manager) (PP) or the [docs overview](https://learn.microsoft.com/en-us/azure/kubernetes-fleet/overview) (DO). Preview features are labelled `(preview)` |

## Beat table
| Scene | Beat | Start | End | Bars | Content |
|---|---|---|---|---|---|
| S01 | Hook | 0.00 | 4.00 | 1–2 | One cluster: simple |
| S02 | Sprawl | 4.00 | 8.00 | 3–4 | Clusters multiply and drift |
| S03 | Reveal | 8.00 | 14.00 | 5–7 | Hub lights, fleet snaps into formation, product name |
| S04 | Section | 14.00 | 16.00 | 8 | `01` Safe updates |
| S05 | Updates | 16.00 | 26.00 | 9–13 | Update run through 3 stages with gates |
| S06 | Section | 26.00 | 28.00 | 14 | `02` Intelligent placement |
| S07 | Placement | 28.00 | 36.00 | 15–18 | Policy → match → flock → progressive rollout |
| S08 | Section | 36.00 | 38.00 | 19 | `03` Governance |
| S09 | Namespaces | 38.00 | 46.00 | 20–23 | Managed Fleet Namespace spanning clusters |
| S10 | Reach | 46.00 | 52.00 | 24–26 | Pull back to globe: regions, clouds, on-prem, edge |
| S11 | CTA | 52.00 | 60.00 | 27–30 | Dot collapse → icon → name → CTA |

### Pattern interrupts
| t | Interrupt |
|---|---|
| 4.00 | Sudden multiplication, and the counter starts |
| 8.00 | Hub hit + snap to fleet (signature 1), wave ripple 1/3 |
| 14.00 / 26.00 / 36.00 | Section slams (3) |
| 31.00 | Flock launch (signature 3) |
| 34.00 | Wave ripple 2/3 + motif |
| 46.00 | Camera pull-back to globe |
| 52.00 | Dot collapse (signature 5), then wave ripple 3/3 at 54.00 |

Longest gap without an interrupt is 6.0 s (38–44 is carried by the stamps at 40.5, 41.5 and 42.5).

---

## Shared elements (all scenes)
- **Chrome** (see `composition.md`): corner crosshairs, top spec strip, bottom strip. The spec strip text on the right changes per section: `SPEC 00 / FLEET` for S01–S03, `SPEC 01 / SAFE UPDATES` for S04–S05, `SPEC 02 / PLACEMENT` for S06–S07, `SPEC 03 / GOVERNANCE` for S08–S09, `SPEC 04 / REACH` for S10, and `SPEC 05 / GET STARTED` for S11. It scrambles to the new text over 6 f at each section start.
- **Bottom-left counter:** `00:00:00` shows `SS:FF` time, plus a frame counter. It is decorative only.
- **Idle dot field:** 80×45 dots, 4 px `dotOff`, visible in every frame [01, 05, 11].
- **Cluster glyph** (component `clusterGlyph`): 5×5 dots at a sub-pitch `p`, where p = 12 (small, 60 px) or 24 (hero, 120 px). The shape is the icon's container: the outer ring is lit, the two inner vertical bars (columns 1 and 3, rows 1–3) are lit in the `bar` colour, and the corners are rounded (corner dots at 50 % size). State colours:
  - `unmanaged`: ring and bars in `dotOff`+`mute` outline only, 60 % alpha
  - `drift`: ring `drift`, bars `drift` at 50 %
  - `member`: ring `fleetLight`, bars `fleetPale`
  - `updated`: ring `azure`, bars `azureLight`
  - `match`: ring `fleet`, fill dots `fleetLight`, bars `fleetPale`
  - `dim`: everything `dotOff`
  Labels sit under the glyph (mono 18–20 px `mute`), up to 2 lines [06, 24, icon].

---

## S01 — Hook (0.00–4.00, f 0–119)
Refs: [01] lit numeral on a dark grid, [02] editorial type, [16] centred construction.
- **0.00:** idle dot field and chrome. The spec strip types on over 0.00–0.40.
- **0.50:** one hero cluster glyph (p = 24, 120 px), top-left at (900, 300), powers on row by row (6 f) in state `updated`. SFX `cluster-pop`.
- **0.80:** a label types under the glyph, centred at x = 960, y = 440: `aks-prod-eastus` / `v1.31 · eastus`.
- **1.20:** headline (hero, Inter Tight 800 120 px, `paper`), centred, top y = 560: **"One cluster is simple."** It uses a masked rise.
- **2.20:** sub-line, mono 28 `mute`, centred at y = 720: `one version · one region · one set of rules`.
- **3.40–4.00:** the headline and sub-line mask down (8 f). The glyph stays.

## S02 — Sprawl (4.00–8.00, f 120–239)
Refs: [10] dot-scale gradient, [05] LED status field, [18][19] status labels, [15] big numeral.
- **4.00:** the hero glyph shrinks to p = 12 and drifts to (240, 180) over 12 f. Clusters then **multiply**, doubling on the beat (1, 2, 4, 8, 16, 32, 48) at 4.00, 4.50, 5.00, 5.50, 6.00, 6.50, 7.00. They are scattered **off-grid** (positions from a seeded hash, avoiding the counter area) at mixed depths: 30 % are background (p = 8, 50 % alpha). Each new glyph pops (6 f) with SFX `dot-tick` (grouped, at most 1 per 2 f).
- **Labels** (mono 18 `mute`) sit on about 60 % of the glyphs. Names are drawn from this list: `eastus`, `westeurope`, `southeastasia`, `japaneast`, `uksouth`, `australiaeast`, `brazilsouth`, `centralindia`, `canadacentral`, `on-prem · dc-02`, `edge · store-114`, `other-cloud · arc`, `sub: payments-prod`, `sub: data-dev`. Versions are `v1.29`, `v1.30` or `v1.31`. About 40 % of glyphs are in state `drift` and 60 % `unmanaged`; the hero stays `updated`.
- **Counter:** Doto 900 200 px `paper` at the bottom left (96, 760) counts from `01` to `48` in step with the doublings, with the label `clusters` in mono 24 `mute` beside it. It is illustrative.
- **4.40:** headline (84 px, left, top y = 230 at x = 96, on a `ground` plate 16 px padded so the scattered glyphs don't collide): **"Dozens is a different story."**
- **5.40:** sub-line (mono 28 `mute`, max 38 ch/line): `regions · subscriptions · clouds · on-prem` / `each one drifting on its own`.
- **6.80–7.90:** **drift flicker.** Drift glyphs flicker (2 f on / 2 f off, seeded phase), version labels scramble every 4 f, and the whole field jitters ±1 px. SFX `drift-buzz` swells from 6.8 to 7.9 and cuts dead at 7.95.

## S03 — Reveal (8.00–14.00, f 240–419)
Refs: [16] construction circles and crosshairs, [04] halftone warp, [24] stepped stack, [12] many-to-one.
- **8.00:** hard cut on the downbeat. The headline, sub-line and counter vanish. **Hub:** a hero cluster glyph (p = 24) in state `match` (fleet purple) is centred at (960, 300). It powers on in 3 f with a `fleetPale` halo of 60 px radius at 40 %, pulsing once. SFX `hub-hit`. Construction circles (`rule`, 1.5 px) of r = 120, 240 and 360 around the hub draw over 0.00–0.60 (easeInOutCubic). Crosshair lines run through the hub for the full width and height (`rule`, 1 px, 40 %).
- **8.10–9.40:** **snap to fleet.** All 48 scattered glyphs fly to a formation of 16 columns × 3 rows. Each glyph is p = 12 (60 px) with a 96 px column pitch. The formation spans x 192–1728 (first glyph's left edge at 192; the last glyph spans 1632–1692), with row tops at y 468, 552 and 636. A glyph's start delay is proportional to its distance from the hub (0.8 f per 24 px). The flight takes 12 f with easeInOutQuart and lands with a 1-dot overshoot. As each glyph lands it switches to state `member`, and its labels drop. SFX `dot-tick` clusters, with a rising `link-zip` over the whole snap.
- **8.40–9.60:** a dotted membership link (`fleetLight`, 6 px pitch, 1.5 px) draws from the hub to each glyph in the top row (16 links). For the middle and bottom rows only a short 24 px stub is drawn, to avoid clutter.
- **8.00–9.00:** **wave ripple 1/3.** A dotted `azureLight` wave band (halftone, 3 rows of dots, amplitude 12 px) sweeps left to right under the formation at y ≈ 720. Glyphs bob with sine(x) (max 6 px) as the wave passes. The hull line is a solid `azure` 3 px rule at y = 708, x 192–1728, drawn on over 8.6–9.2.
- **10.00:** title (hero, Inter Tight 800 96 px, `paper`), centred, top y = 792: **"Azure Kubernetes Fleet Manager"**, with a masked rise.
- **10.80:** sub-line, mono 28 `azureLight`, centred at y = 912: `Seamlessly manage Kubernetes clusters at scale.` (PP hero). It types on.
- **13.40–14.00:** the title and sub-line mask down. The formation stays until the cut.

## S04 — Section 01 (14.00–16.00, f 420–479)
Refs: [15] giant numeral, [03] grid chrome, [28] dot alphabet.
- **14.00:** hard cut to the idle dot field. **Slam:** `01` (Doto 900 240 px, `fleetLight`), left at x = 96, top y = 360, scales from 1.25 to 1 over 4 f and settles over 3 f (easeOutBack 1.4). SFX `slam`.
- **14.15:** the label `SAFE UPDATES` (mono 700 44 px, `paper`, tracking 0.12) at x = 440, top y = 470 types on over 8 f. Beneath it, a hairline rule (`rule`) draws from x = 440 to 1824 at y = 540 over 10 f.
- **15.60–16.00:** the numeral and label slide out left 48 px and vanish over 8 f (stepped alpha).

## S05 — Update runs (16.00–26.00, f 480–779)
Refs: [08] staged dot rows, [09] dot progress bar, [17] PASS/READY sheet, [18] status labels, [25] control panel.
Claims: update runs, update strategies (order and timing), approval gates, auto-upgrade profiles (PP, DO).
- **Left block** (split layout):
  - 16.00: section chip `01 · SAFE UPDATES` at (96, 180) in `fleetLight`.
  - 16.20: headline at top y = 230: **"Upgrade the fleet,"** / **"stage by stage."**
  - 16.80: sub-line: `Update runs roll Kubernetes and` / `node image upgrades out in the` / `order you define, with approval gates.`
- **Right diagram** (x 760–1824):
  - 16.20: the run header (mono 22 `paper`) types on at (760, 200): `update run  ·  kubernetes 1.30 → 1.31`.
  - Three stage rows. Each has a label column at x = 760 (mono 20: `STAGE 1` in `paper` with `canary` in `mute` on the line below) and glyphs (p = 12) starting at x = 1000 with a 96 px pitch.
    - Stage 1, row top y = 300: 3 glyphs.
    - Stage 2, y = 480: 6 glyphs.
    - Stage 3, y = 660: 6 glyphs.
    - Stage names: `canary`, `europe`, `americas`.
  - The rows build in at 16.40, 16.50 and 16.60, all in state `drift` (pending). Version labels `1.30` sit under each glyph.
  - **Stage sweep** (signature 2): a vertical `azure` sweep line 3 px tall × row height moves across the row. As it passes, glyphs switch `drift` → `updated` and their labels scramble `1.30` → `1.31`. A 4 px azure progress dot-bar under the row fills in step [09]. SFX `stage-sweep`.
    - Stage 1: 17.00–18.20. At 18.30 the `[ PASS ]` chip appears at the row end (inverted `azure` plate, paper text 24 bold). SFX `pass-chime`.
    - Gate 1: at 19.00, between rows 1 and 2 at (1000, 402), the chip `[ APPROVED ]` (fleetLight plate, ground text) flips in (a scaleY step of 3 f) with a dot-pictogram check [29]. SFX `pass-chime` (higher).
    - Stage 2: 20.00–21.50, `[ PASS ]` at 21.60, gate 2 `[ APPROVED ]` at 22.20 at (1000, 582).
    - Stage 3: 23.00–24.50, `[ PASS ]` at 24.60.
  - **Counter:** Doto 700 64 px `paper` at the bottom right, right-aligned to 1824 with top at y = 860: `00/15 updated`, counting as glyphs flip. It ends at `15/15` at 24.50.
  - **25.00:** a chip types on under the diagram at (760, 800), mono 22 `azureLight`: `auto-upgrade profile · stable channel ✓`.
- **25.60–26.00:** everything holds.

## S06 — Section 02 (26.00–28.00, f 780–839)
Same as S04 with `02` / `INTELLIGENT PLACEMENT`. SFX `slam` at 26.00.

## S07 — Placement (28.00–36.00, f 840–1079)
Refs: [12] arrow of arrows, [13] dot vortex, [11] lit dot arrow, [25] control panel, [27] UI cards.
Claims: resource placement by labels, properties and capacity; progressive rollouts; from a central hub (PP, DO).
- **Left block:**
  - Chip `02 · PLACEMENT`.
  - Headline **"Place workloads"** / **"where they run best."** at 28.20.
  - Sub-line at 28.80: `Target clusters by labels,` / `properties, cost and capacity —` / `then roll out progressively.`
- **Diagram:**
  - Hub glyph (p = 24, `match`) with top-left at (784, 480) and centre (844, 540). It has one construction circle of r = 120.
  - Members: a 4 col × 3 row grid of p = 12 glyphs in state `member`. Column lefts are at x 1216, 1384, 1552 and 1720; row tops at y 300, 500 and 700. Each has two label lines (mono 18): `env=prod` or `env=dev`, and `nodes 12` or `nodes 3`. Six clusters match `env=prod` + `nodes ≥ 5`: indices (0,0), (1,0), (3,1), (0,2), (2,2), (3,2) by (col,row).
  - **28.40:** the **policy panel** (a `paper` plate, 360×150, top-left (760, 200), 8 px corners, ground-coloured mono 20 text) types on line by line:
    - `kind: ClusterResourcePlacement`
    - `selector: env=prod`
    - `property: nodeCount ≥ 5`
    - `rollout: progressive`
    Toggles are drawn as in [25].
  - **30.00–30.60:** an evaluation scan. A vertical `fleetLight` scan line sweeps from x = 1180 to x = 1824. Matches switch to state `match`, and the rest go to `dim` with their labels turning `dotOff`+mute. SFX: a quiet `dot-tick` run.
  - **31.00–33.70:** **flock** (signature 3). An arrow-of-arrows forms at the hub from about 40 small dot-arrows (each 3×5 dots at p = 6), in formation as a large arrow pointing right [12]. At 31.00 it launches and splits into 6 streams toward the matched glyphs.
    - Wave 1 (targets (0,0), (1,0), (0,2)) flies 31.00–32.20.
    - Wave 2 (targets (3,1), (2,2), (3,2)) flies 32.50–33.70.
    - Trails are dotted and fade over 12 f. On arrival, the glyph pulses once and the chip `✓ checkout-api` (mono 18 `fleetLight`) types under it.
    - A rollout readout at (760, 800) (mono 22 `paper`) shows `rollout  wave 1/2 ▮▮▮▯▯▯` and then `wave 2/2 ▮▮▮▮▮▮`.
    - SFX `flock-whoosh` at 31.00 and 32.50, `cluster-pop` on each arrival.
  - **34.00:** wave ripple 2/3 under the members and the music motif. The chip at 34.20 (mono 20 `mute`, at (760, 860)) reads `also: namespace-scoped placement · automated deployments from git (preview)`. Because it is wider than the diagram column, it is split onto two lines.
- **35.60–36.00:** hold.

## S08 — Section 03 (36.00–38.00, f 1080–1139)
Same as S04 with `03` / `GOVERNANCE`. SFX `slam` at 36.00.

## S09 — Managed namespaces (38.00–46.00, f 1140–1379)
Refs: [24] stepped layer stack, [27] feature cards "Role-based access", [29] dot pictograms, [19] state glyphs.
Claims: Managed Fleet Namespaces (preview on PP) enforce resource quotas, network policies and role-based access at the namespace level across clusters (PP, DO).
- **Left block:**
  - Chip `03 · GOVERNANCE`.
  - Headline at 38.20: **"One namespace."** / **"Every cluster."** / **"Same rules."** (3 lines at 84 px, top at 230; line tops 230, 318, 406).
  - Sub-line at 39.00 (starting at y = 530): `Managed Fleet Namespaces (preview)` / `enforce quotas, network policies` / `and access across clusters.`
- **Diagram:** five **cluster columns**.
  - Each column is 168 px wide at x 784, 992, 1200, 1408 and 1616 (pitch 208), spanning y 240–720. Each is a stacked-layer outline [24]: a `rule` 1.5 px rounded rect with 6 horizontal namespace slots (80 px tall each, 1 px `rule` separators).
  - Each column has a small p = 8 cluster glyph at its top (y = 196) and the label `cluster-1`…`cluster-5` in mono 18 `mute`.
  - 38.20: the columns build in, left to right, 3 f apart.
  - **39.20–40.00:** the namespace band. A `fleet`-coloured band at 35 % alpha, with 2 px `fleetLight` borders and slot 3 (y 400–480), slides in from the left across all five columns (easeInOutQuart). Its label `ns/team-payments` (mono 700 22 `paper`) sits at the band's left end, inside column 1. SFX `link-zip`.
  - **Stamps:** each stamp is a paper plate, 280×72, mono 20 ground text, carrying a 7×7 dot pictogram in `fleet` at its left. Each lands with a 3 f scale 1.1 → 1 and SFX `stamp`. When a stamp lands, the band flashes (+20 % alpha, 4 f), and each column's slot-3 gets a tiny matching dot-icon.
    - 40.50: `QUOTA  cpu 64 · mem 256Gi` at (784, 780).
    - 41.50: `NETWORK POLICY  deny ingress` at (1088, 780).
    - 42.50: `RBAC  payments-devs · edit` at (1392, 780).
  - **43.50–45.60:** a slow pulse runs down the band. In the column tops, the glyph states go `member` → `match` in sequence, 4 f apart.

## S10 — Reach (46.00–52.00, f 1380–1559)
Refs: [22] wireframe globe, [21] coordinate readout, [26] bento stats, [07] dot-colour field.
Claims: AKS across regions and subscriptions; Arc-enabled clusters across clouds and on-premises (preview); centralized monitoring; DNS-based load balancing (preview) (PP, DO).
- **46.00:** camera pull-back. The S09 composition scales to 0.25× around (1300, 480) over 24 f (easeInOutQuart), then dissolves into the dots of the globe. SFX `whoosh-pull`.
- **Globe:** orthographic, centre (560, 560), r = 360. It is built from dots on 12 meridians and 7 parallels (dots every 4°, 5 px, `rule`, with back-face dots at 30 %) plus an outline circle. Meridians drift at 6°/s, the only sustained rotation in the film.
  - Seven fixed-latitude cluster markers rotate with the globe. Each is a p = 6 glyph plus a leader line to a label (mono 18). Front-facing markers are `fleetLight`; back-facing ones are hidden. Labels:
    - `AKS · eastus`
    - `AKS · westeurope`
    - `AKS · japaneast`
    - `AKS · australiaeast`
    - `Arc · on-prem (preview)`
    - `Arc · other cloud (preview)`
    - `Arc · edge (preview)`
  - Each marker shows a coordinate readout, e.g. `37.37° N  79.82° W` [21].
  - From the globe's north pole a `fleet` hub dot links with dotted `fleetLight` arcs to every front-facing marker.
- **Right block** (x 1040–1824):
  - 46.60: headline **"Every cluster."** / **"One control plane."**, top y = 200.
  - 47.20: sub-line `AKS across regions and subscriptions,` / `plus Arc-enabled clusters (preview).`
  - 48.40, 49.00, 49.60: three bento tiles [26] build in. Each is 240×180, 16 px gap, row top y = 560, starting at x = 1040. They have a `rule` border and a ground fill, with a 9×7 dot pictogram in `azureLight` and mono 20 `paper` text:
    - `Centralized` / `monitoring`
    - `DNS load` / `balancing` / `(preview)`
    - `Auto-upgrade` / `profiles`
  - Each tile has a tiny sparkline or dot-bar animating.
- **44.00–46.00** (end of S09) and **50.80–52.00:** SFX `riser` builds toward 52.

## S11 — CTA (52.00–60.00, f 1560–1799)
Refs: [13] dot vortex (reversed), [01] lit dots, [15] hierarchy, icon.
Claims: product tagline (PP); pricing (PP: "There's no charge for the Azure Kubernetes Fleet Manager resource itself… only… the AKS cluster created… on your behalf").
- **52.00–53.40:** **dot collapse** (signature 5). Every lit dot on screen (globe, markers, tiles, text rasterised as dots) spirals inward with a vortex swirl of 180°. Each dot is delayed by its radius and lands on one dot of a **dot-matrix Fleet Manager icon**: 18×18 dots at a 16 px pitch (icon 288 px), centred at (960, 400). Dot colours come from the icon SVG (sample the icon at 18×18; transparent cells stay empty). Each dot lands in its target colour. SFX `collapse` → `hub-hit` at 53.40.
- **53.40–53.80:** the dot icon cross-steps to the crisp vector icon over 4 f (dots shrink as the vector reveals behind them), at the same position and size (288 px).
- **54.00:** wave ripple 3/3 under the icon (`azureLight` halftone band, y ≈ 560) and the music motif. Title at 54.20 (hero, Inter Tight 800 96 px, `paper`), centred, top y = 600: **"Azure Kubernetes Fleet Manager"**.
- **55.00:** sub-line mono 28 `azureLight`, centred at y = 720: `Seamlessly manage Kubernetes clusters at scale.`
- **56.00:** small print, mono 20 `mute`, centred at y = 790: `No charge for the Fleet Manager resource itself — you pay only for the AKS cluster it creates on your behalf.`
- **57.00:** CTA plate, `azure`, 8 px corners, centred at y = 850 (top), 64 px tall, with paper text Inter Tight 700 32 px: `Get started  →  learn.microsoft.com/azure/kubernetes-fleet`. It builds in as the dots power on.
- **57.00–60.00:** hold. The icon's water line keeps a gentle 1 Hz bob, and the idle field and chrome stay. The final frame is a clean poster frame.

---

## SFX cue sheet
Canonical times are in `timeline/timeline.json`, under `audio.sfx`.
