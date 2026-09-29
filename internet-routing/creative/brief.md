# Brief — How the Internet Routes a Request

## Purpose
Show, in under a minute, what happens between pressing Enter on a URL and a page arriving: DNS lookup → packets → hop-by-hop routing → server → response back.

## Audience
Curious, non-specialist viewers on vertical short-form platforms (TikTok / Reels / Shorts). Comfortable with apps, never thought about what's underneath.

## Core message
"Your request is chopped into tiny packets, and every router along the way decides afresh where each one goes next — no route is reserved. The first reply comes back faster than a blink."

## Format
- 9:16, 1080×1920, 30–60 s (target ~45 s)
- Narrated (ElevenLabs voice-over), music + SFX
- Rendered from a WebGL canvas, exported frame by frame

## Beats (draft, refined in storyboard)
1. Hook — cursor blinks in a URL bar, Enter pressed.
2. DNS — the name is looked up and turned into an address.
3. Packets — the request is split into numbered packets.
4. Routing — packets hop router to router (~6 hops to a nearby CDN edge, ~15 typical); every router decides per packet. Different paths shown only as a different flow or a reroute after a link failure.
5. Arrival — server (often a nearby CDN edge) reassembles, responds.
6. Return — first bytes arrive; timestamp shows first reply in ~30–40 ms (faster than a 100–400 ms blink). Do not claim the whole page loads that fast.

## Tone
Playful, precise, a little nostalgic. Anime character as guide/"packet" avatar; the network as a terminal world.
