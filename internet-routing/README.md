# How the Internet Routes a Request

45 s vertical (1080×1920, 30 fps) narrated explainer. Look: ASCII / terminal anime on cream paper.

## Deliverables
- `render/final/video.mp4` — 1080×1920 H.264 (OpenH264, 14 Mb/s) + AAC 256k, 45.0 s, loops seamlessly
- `render/final/preview.mp4` — 540×960 preview

## Sources
- Brief `creative/brief.md` · storyboard `creative/storyboard.md` · design `creative/design/`
- Script `script/script.json` (actual VO timings) · timeline `timeline/timeline.json`
- VO `audio/voice/` (ElevenLabs Brittney) · music `audio/music/music.ts` (Tone.js + Tonal) · SFX `audio/sfx/`

## Rebuild
```sh
npm install
npx tsx audio/music/render-music.ts          # audio/music/music.wav
npx tsx audio/sfx/render-sfx.ts              # audio/sfx/*.wav
npx tsx audio/mix.ts                         # audio/mix.wav (−14 LUFS, −1 dBTP)
npx tsx animation/render/render-frames.ts    # render/frames/*.png (SwiftShader, deterministic, ~4 min)
ffmpeg -framerate 30 -i render/frames/%05d.png -i audio/mix.wav -c:v libopenh264 -b:v 14M \
  -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart render/final/video.mp4
```
Live preview: `npm run dev` (space = play, arrows = step).
