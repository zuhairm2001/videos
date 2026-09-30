## Video Generation
The point of this particular project is to collate several video productions together. They will usually follow the same format each time, i.e we will have a storyboard, then we will produce an animation in a webgl canvas before exporting animation frame by frame and creating a video

Furthermore we might also have additional sfx and music to accompany the video itself.

## SFX & Music Generation

For music generation, spawn an agent for TypeScript-based music-generation that will generate the complete composition as TypeScript code. The code should use Tone.js for synthesis, sequencing, timing, and effects, with Tonal for music-theory operations such as scales, chords, and note manipulation. You should then export the web audio into a compatible audio file to be used for the video

Analyse the music output with a spectogram.

## Design/Artistic Direction

It is important to first establish an artistic direction that will dictate the overall design of the rest of then animation before actual beginning on creating the animation itself.

### Moodboard

The moodboard comes before the design bible, and every design decision should cite it. Build it with this pipeline and keep every intermediate output, so the selection can be audited and reproduced.

1. **Seed.** Ask the user for a seed Pinterest pin and, optionally, one of their boards. Record both in `moodboard/INDEX.md`.
2. **Collect candidates.** Open the seed pin in the browser and gather its related pins ("More like this"), then the related pins of those, for two hops in total. Add the pins from the user's board. Remove duplicates by pin ID. For each candidate, write the pin ID, pin URL, image URL and source (`seed` | `hop1` | `hop2` | `board`) to `creative/references/visual/moodboard-candidates/candidates.json`.
3. **Download untouched.** Fetch Pinterest's 736 px-wide image (`i.pinimg.com/736x/...`) for each candidate into `moodboard-candidates/raw/<pinId>.jpg`. Do not resize or re-encode it.
4. **Contact sheets.** Tile the candidates into sheets labelled with pin IDs, using ImageMagick: `magick montage -label '%t' raw/*.jpg -tile 6x5 -geometry 240x320+6+6 -background '#F2EDE1' sheets/sheet-%02d.jpg` (use `montage` on ImageMagick 6). `-label` must come before the input files, and each sheet holds 30 candidates. Save the sheets in `moodboard-candidates/sheets/`.
5. **Scan and shortlist.** Look at every sheet, and judge each candidate against the brief. Useful questions: does it fit the seed's look? Could it become a motion, layout or texture idea? Does it duplicate something already chosen? Record a verdict (`selected` / `rejected`) and a one-line reason for every candidate in `candidates.json`. Aim for roughly 20–30 final picks, and show the user the shortlist before finalising.
6. **Finalise.** Copy the selected raw files into `creative/design/moodboard/` as `NN-slug.jpg`, with the seed as `01`. Write `INDEX.md` as a table with the columns `# | File | Why | Source pin`. Create `_overview.jpg` by running the same montage over the final set, but without `-label`, and with `-tile 6x` so the whole set fits on one page.
7. **Derive the palette.** Get a starting palette by reducing the seed and `_overview.jpg` to a few colours (`magick <img> -resize 400x -colors 8 -format %c histogram:info:-`). Then tune it by hand for contrast and roles. Record the raw quantised colours, and the reasons for each change, in `design-bible.md`.
8. **Cite by number.** The design bible and the storyboard must refer to moodboard images by their `NN` number. Each storyboard scene should list the refs it draws on.

## Dubbing

You should ask the user if they wish to dub the video, if so you should utlise the ElevenLabs MCP to create the voice over

This is how you should structure the `script.json` in order to best organise the voice-over generation:

script.json
```json
{
  "segments": [
    {
      "id": "intro",
      "text": "Kubernetes changed the way we deploy applications.",
      "start": 0.0,
      "end": 3.8
    },
    {
      "id": "problem",
      "text": "But managing hundreds of clusters introduces a new problem.",
      "start": 4.1,
      "end": 8.7
    }
  ]
}
```

## Timing Layer
There should be an explicit timing layer that ties together all the elements and acts as a director of the video

```TypeScript
const timeline = {
  scenes: [
    { id: "intro", start: 0, end: 4.5 },
    { id: "main", start: 4.5, end: 18 },
    { id: "outro", start: 18, end: 24 }
  ],

  audio: [
    { file: "whoosh.wav", at: 4.2 },
    { file: "impact.wav", at: 12.7 }
  ]
}
```

## Project Structure

When starting a new video make sure to reference this project structure

<video-name>/
│
├── README.md
├── project.json
│
├── creative/
│   ├── brief.md                    # High-level purpose, audience, message
│   ├── storyboard.md               # What happens, scene by scene
│   │
│   ├── design/
│   │   ├── design-bible.md         # Overall artistic direction / design oracle
│   │   ├── moodboard/
│   │   │   ├── INDEX.md            # Seed, sources, per-image rationale
│   │   │   ├── _overview.jpg       # Montage of the final set
│   │   │   ├── 01-seed-slug.jpg
│   │   │   ├── 02-slug.jpg
│   │   │   └── ...
│   │   │
│   │   ├── palette.json            # Colours
│   │   ├── typography.json         # Fonts / hierarchy
│   │   ├── motion.md                # Animation language
│   │   ├── composition.md           # Layout / framing principles
│   │   └── sound.md                 # Sonic direction
│   │
│   └── references/
│       ├── visual/
│       │   └── moodboard-candidates/
│       │       ├── candidates.json # Every candidate: pin, source, verdict, reason
│       │       ├── raw/            # Untouched 736x downloads
│       │       └── sheets/         # Numbered contact sheets
│       ├── animation/
│       ├── cinematography/
│       └── audio/
│
├── script/
│   ├── script.md
│   ├── script.json
│   └── revisions/
│
├── animation/
│   ├── scenes/
│   │   ├── 01-intro.ts
│   │   ├── 02-main.ts
│   │   └── 03-outro.ts
│   │
│   ├── components/
│   ├── assets/
│   │   ├── images/
│   │   ├── models/
│   │   └── fonts/
│   └── config.ts
│
├── audio/
│   ├── voice/
│   │   ├── voiceover.json
│   │   ├── segments/
│   │   └── voiceover.wav
│   │
│   ├── music/
│   │   ├── music.ts
│   │   └── music.wav
│   │
│   └── sfx/
│       └── ...
│
├── timeline/
│   ├── timeline.json
│   └── markers.json
│
├── render/
│   ├── frames/
│   ├── intermediate/
│   └── final/
│       ├── video.mp4
│       └── preview.mp4
│
└── package.json
