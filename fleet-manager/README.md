# Azure Kubernetes Fleet Manager — promo

A 60 s promo at 16:9 (1920×1080, 30 fps). There is no voice-over: on-screen type, music and SFX carry it. The look is called "Fleet Spec Sheet": a dot-matrix industrial spec sheet in Azure blue `#0078D4` and Fleet Manager purple `#773ADC`, built on the product icon's container-ship metaphor.

## Deliverables
- `render/final/video.mp4`: 1920×1080 H.264 + AAC 256k, 60.0 s
- `render/final/preview.mp4`: 960×540 preview

## Sources
- Brief: `creative/brief.md`. Storyboard: `creative/storyboard.md`. Design: `creative/design/`.
- Moodboard: `creative/design/moodboard/INDEX.md`. It has 29 refs, taken from 3 seed pins plus 2 hops, and the user's attachment. The full audit is in `creative/references/visual/moodboard-candidates/candidates.json`.
- Timing layer: `timeline/timeline.json` holds the scenes, the named cues that scenes read by id, the music sections and hits, and the SFX cues. `timeline/markers.json` holds the markers.
- Music: `audio/music/music.ts` (Tone.js + Tonal). The spectrogram is `audio/music/spectrogram.png`.
- SFX: `audio/sfx/` (synthesised).
- Mix: `audio/mix.ts`.
- Animation: `animation/`. Its API is in `animation/README.md`.

## Rebuild
```sh
npm install
npx tsx audio/music/render-music.ts          # audio/music/music.wav
npx tsx audio/sfx/render-sfx.ts              # audio/sfx/*.wav
npx tsx audio/mix.ts                         # audio/mix.wav (−14 LUFS, −1 dBTP)
npx tsx animation/render/render-frames.ts --to 1799   # render/frames/*.png (SwiftShader, deterministic, ~3–5 min)
ffmpeg -framerate 30 -i render/frames/%05d.png -i audio/mix.wav -c:v libx264 -preset slow -crf 16 \
  -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart render/final/video.mp4
ffmpeg -i render/final/video.mp4 -vf scale=960:540 -c:v libx264 -crf 23 -c:a aac -b:a 128k render/final/preview.mp4
```
To preview live, run `npm run dev`. Space plays and pauses, the arrow keys step one frame, shift+arrow steps 30 frames, and `?f=N` opens at frame N.

ffmpeg is a static build in `~/.local/bin`.
