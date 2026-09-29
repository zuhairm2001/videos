## Video Generation
The point of this particular project is to collate several video productions together. They will usually follow the same format each time, i.e we will have a storyboard, then we will produce an animation in a webgl canvas before exporting animation frame by frame and creating a video

Furthermore we might also have additional sfx and music to accompany the video itself.

## SFX & Music Generation

For music generation, spawn an agent for TypeScript-based music-generation that will generate the complete composition as TypeScript code. The code should use Tone.js for synthesis, sequencing, timing, and effects, with Tonal for music-theory operations such as scales, chords, and note manipulation. You should then export the web audio into a compatible audio file to be used for the video

## Design/Artistic Direction

It is important to first establish an artistic direction that will dictate the overall design of the rest of then animation before actual beginning on creating the animation itself.

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
│   │   │   ├── 01-reference.png
│   │   │   ├── 02-reference.jpg
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
