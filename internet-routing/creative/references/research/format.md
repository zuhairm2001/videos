# Format research — 45 s vertical tech explainer (TikTok / Reels / Shorts)

Research input for the storyboard of **"How the Internet Routes a Request"** (9:16, 1080×1920, ~45 s, ElevenLabs VO, ASCII/terminal-anime look).
Tags: **[UNVERIFIED]** = claim not checked against a primary source; **[OPINION]** = craft judgement; **[MEASURED]** = computed by us from a cited source (method stated).

> **Three findings that change existing project docs**
> 1. **Captions are in the wrong place.** `composition.md` puts captions at y 1400–1500 with a 420 px bottom margin. TikTok's official template and Meta's guidance both mark the bottom **~660–672 px** as covered by UI. Captions have to sit at **y ≤ 1245** (§3).
> 2. **Captions are too small.** At 44 px mono, the line height is 2.75 % of frame height. BBC guidance for 9:16 is **3.9–4.5 %**, so use **64 px with 1.2 leading** (§3). The `data` style (30 px, ink at 0.8 opacity) scores **4.38:1**, which fails WCAG AA 4.5:1 and sits at Apple's 11 pt floor (§7).
> 3. **The brief's core line needs a wording change.** "Packets *each find their own way*": in the IP model routers do forward each packet independently. In practice, though, ECMP hashing keeps one connection's packets on the same path. Say "every router decides again for every packet; no route is reserved" instead, and see `technical.md` §5.4 (§5). Also: "dozens of machines" overstates things. TechResearch reports a typical median of ~15 hops (CAIDA Ark) and measured 6 hops for example.com via a CDN.

---

## 1. Hooks — the first 1–3 seconds

### What the platforms say (primary)
- **TikTok:** "Introduce your content proposition in the first 3 seconds for better recall and awareness" and "prioritize your hook in the first 6 seconds." It also names suspense and surprise as hook levers. ([TikTok creative best practices](https://ads.tiktok.com/help/article/creative-best-practices?lang=en))
- **TikTok Creative Codes:** 90 % of ad-recall impact and 80 % of awareness impact are captured within 6 s. Suspense early in a story gives +16 % watch time, and "fast scene changes draw users in early." ([TikTok Creative Codes, May 2023, PDF](https://ads.tiktok.com/business/library/TikTok_CreativeCodes_May2023.pdf))
- **Meta** names three hook types ([Meta, "The science of the hook"](https://www.facebook.com/business/news/the-science-of-the-hook-how-to-supercharge-your-reels-performance), quoted in [Social Media Today](https://www.socialmediatoday.com/news/meta-shares-tips-on-reels-hooks-creative-diversification-in-ads-and-threa/808182/)):
  - value promise
  - statement of intent ("telling viewers exactly what they're about to see and learn")
  - question/invitation
- **YouTube** (Creator Insider, with Shorts product lead Todd Sherman and creator Jenny Hoyos) ([video + transcript](https://www.youtube.com/watch?v=_tWy-_otnUc)):
  - The swipe decision happens in about **"the first frame… one second."**
  - Hoyos's three-part hook: **(1) a shock, ideally visual → (2) what the video is about → (3) what you'll get by the end.**
  - Sherman: when a Short underperforms, it is usually because a much higher share of people swiped away: "They didn't get them with the hook!"
  - "Viewed vs swiped away" is an official Shorts metric ([YouTube Help](https://support.google.com/youtube/answer/12942217)).
  - Hoyos warns against cramming: "if I give as much information as possible in these 60 seconds… you're just going to dilute your message."

### What notable explainers actually open with (transcripts checked)
| Creator / video | Opening line (words) | Hook type |
|---|---|---|
| Kurzgesagt short, [*Can Earth Run Out of Water?*](https://www.youtube.com/shorts/tZ8i1RxGSYM) | "We're running out of water." (5) | Stakes claim; a number follows in sentence 2 |
| Kurzgesagt short, [*Dust Is Not What You Think*](https://www.youtube.com/shorts/YqAI0oqtt7w) | "What actually is dust?" (4) | Question plus a counter-intuitive title; answers "only about 1 %…" immediately |
| Veritasium short, [*The Scariest Chart in Engineering*](https://www.youtube.com/shorts/O3a99HNskNk) | "This is the scariest chart in electrical engineering." (8) | Superlative about the object on screen ("this") |
| Veritasium short, [*How do submarines know where they are?*](https://www.youtube.com/shorts/_1G8nrmBKeY) | "Here's a question. How do submarines know where they are?" (3 + 7) | Explicit question = the title |
| 3Blue1Brown short, [*100 random chords*](https://www.youtube.com/shorts/wGffBCfrAsE) | "It's time for a new puzzle of the month. Imagine you choose 10 random chords…" | Series frame, then a concrete puzzle within about 3 s |
| Fireship, [*DNS Explained in 100 Seconds*](https://www.youtube.com/watch?v=UVR9lhUGAyU) | "The domain name system, or DNS, is like the phone book of the internet." | Definition plus analogy. Works for a subscribed dev audience; weak for a cold feed **[OPINION]** |
| ByteByteGo, [*How the Internet Works in 9 Minutes*](https://www.youtube.com/watch?v=sMHzfigUxz4) | "Ever wonder how a video travels from a server to your smartphone in seconds…?" | "Ever wonder" question (long-form pacing) |
| *Warriors of the Net* (Ericsson, 1999), [manuscript](https://www.warriorsofthe.net/manuscript.html) | "Now exactly what happened when you clicked on that link?" | **The viewer's own action.** Closest match to our Enter-press opening |

**Patterns [OPINION, from the table]:**
- The best openings are **4–8 words**.
- They name **the subject in the first sentence**, and the subject is **on screen as it is named** ("this chart").
- A concrete number or payoff promise follows within about 3 s.
- None open on a logo, title card or silence.

### Hook rules for us
- **Frame 0 already moving.** Cursor blinking in the URL bar plus a keystroke. No fade-in from blank.
- **Spoken hook ≤ 8 words, finished by t ≈ 2.0 s.** Point it at the viewer's own action (Warriors pattern). Candidates:
  - "You just hit Enter. Where did it go?"
  - "Every page you load arrives in pieces."
  - "This click is about to cross a dozen machines." (use the hop count from `technical.md`; not "dozens")
- **Proposition by 3 s** (TikTok), meaning the viewer knows the video is about "how a request travels".
- **Payoff promise by about 5 s** (Hoyos step 3). Tease the stopwatch: "…in less time than a blink" or "watch the clock".
- **Visual shock = the look itself.** An anime face resolving out of ASCII noise in the first 12 frames is the scroll-stopper. Keep the face on screen at t = 0–1.5 s. TikTok recommends featuring people to capture attention ([best practices](https://ads.tiktok.com/help/article/creative-best-practices?lang=en)); an animated character is our stand-in **[OPINION]**.

---

## 2. Retention and pacing

### Narration rate (measured on real shorts)
**[MEASURED]** Words in the transcript ÷ full runtime. This includes music-only gaps, so the true speaking rate is higher.

| Video | Words / runtime | wpm (lower bound) | Mean sentence |
|---|---|---|---|
| Kurzgesagt, *Can Earth Run Out of Water?* | 207 / 78 s | **159** | 13.8 words |
| Kurzgesagt, *Dust Is Not What You Think* | 206 / 71 s | **174** | 13.7 words |
| Veritasium, *How do submarines know…* | 309 / 91 s | **204** | 19.3 words |
| Fireship, *DNS in 100 Seconds* | 461 / 135 s | **≥ 205** | — |

- The Kurzgesagt range (≈160–175) is the "smooth but upbeat" reference.
- The Veritasium/Fireship range (≈205) reads as rapid-fire or hype. That's the wrong register for this brief **[OPINION]**.
- The oft-quoted figure of **~150 wpm** for conversational English is attributed to the US National Center for Voice and Speech **[UNVERIFIED primary]**.

**Word budget for 45 s:**

| wpm | 40 s of speech | 42 s | 45 s |
|---|---|---|---|
| 150 | 100 | 105 | 112 |
| 160 | 107 | 112 | 120 |
| 165 | 110 | 116 | 124 |

Keep about 3 s free of speech: hook SFX, the arrival "drop to near-silence" (`sound.md`), and the final chime. **Target script: 105–115 words, hard cap 120.**

### Shot length and visual change
- **Fireship long-form, as measured by a third party:** 13.3 cuts/min and a median shot of about 3 s. The hook runs at 12–18 cuts/min. Diagrams are **additive**: one element pops in per narrated clause. Long holds are "legitimate only when the frame animates itself" (e.g. a live terminal). ([PandaStudio analysis](https://www.writepanda.ai/blog/fireship-editing-style-measured/) — vendor blog, method: ffmpeg scene detection)
- TikTok says fast scene changes and text pop-ups sustain engagement ([Creative Codes](https://ads.tiktok.com/business/library/TikTok_CreativeCodes_May2023.pdf)).
- **For us [OPINION]:** our world is one continuous canvas, so "cuts" become **camera pushes, scanline wipes and additive glyph events**.
  - Rule of thumb: **something meaningful changes on screen at least every 2 s**, and each narrated clause gets one visual event.
  - Add a **bigger "pattern interrupt" every 6–8 s**: section-number slam, glitch transition, camera move, music drop or colour event.

### Pattern interrupts available in our design language
- Section-number slam (`01`–`04`, 4-frame slam; see `motion.md`)
- Registration slip on impacts
- Scanline wipe between beats
- The **one** red "dropped packet" moment (if the script uses it)
- The music drop at arrival
- A zoom from macro (the world network) to micro (one packet header)

Use each interrupt type at most twice so they stay surprising **[OPINION]**.

### Loopable ending
- Since 31 Mar 2025, YouTube counts a Shorts view **every time a Short starts or replays**, with no minimum watch time ([TeamYouTube announcement](https://support.google.com/youtube/thread/333869549)).
- Sherman: rewatchable Shorts do well, but "It's not like we strictly optimise for two loops" ([Creator Insider](https://www.youtube.com/watch?v=_tWy-_otnUc)).
- **Technique:**
  1. The **last frame matches the first frame**: an empty URL bar with a blinking cursor.
  2. The **last spoken line runs grammatically into the first**, e.g. end on "…and it all starts again the moment you hit—" then loop to "Enter."
  3. **No outro card and no "follow for more".** Fireship keeps the edit hot to the final seconds and uses no endscreen ([PandaStudio](https://www.writepanda.ai/blog/fireship-editing-style-measured/)).
- Kurzgesagt shorts **end on a concrete, quotable callback** ("…a few nanograms of stardust"; "for the price of a coffee a week"). Our equivalent is the stopwatch number.

---

## 3. On-screen text, captions and safe zones

### Platform UI safe zones (1080×1920)
| Platform | Source | Top | Bottom | Sides | Extra |
|---|---|---|---|---|---|
| **TikTok** (in-feed) | Official safe-zone PNG from [TikTok Ads spec page](https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads) ([file](https://lf-tt4b.tiktokcdn.com/obj/i18nblog/tt4b_cms/en-US/5jqet0ab9qci-10e7f5Vig4uhAscNP8XPB0.zip)), authored at 720×1280 and scaled ×1.5 by us | 240 px | 660 px | 120 px each | **Right rail:** x ≥ 780 unsafe for y ≥ 840 |
| **Instagram / Facebook Reels** | [Meta Ads Guide](https://www.facebook.com/business/ads-guide/update/image/facebook-facebook-reels-overlay): "leave roughly 14% of the top, 35% of the bottom, and 6% on each side… free from text, logos…" | 269 px | 672 px | 65 px each | — |
| **YouTube Shorts** | No official Google pixel spec found **[UNVERIFIED]**. Third-party templates show a right-side action rail and bottom title/channel block similar to TikTok's ([Hopper HQ](https://www.hopperhq.com/blog/youtube-shorts-dimensions/)) | — | — | — | — |
| **Our current `composition.md`** | project doc | 220 | 420 | right 140 | captions at y 1400–1500 → **inside both platforms' covered zone** |

Ads UI is heavier than organic UI, but the organic caption/username block sits in the same bottom band. Design to the ads templates as the conservative case **[OPINION]**.

**Universal safe rectangle (intersection):**
- **x 120–960, y 270–1245**
- Minus the lower-right notch: **x > 780 when y > 840**

Motion can pass through unsafe areas (e.g. packets travelling top↔bottom). **Labels, numbers, captions and the character's face must not** sit there.

**Suggested zone remap for the storyboard** (proposal; `composition.md` is owned elsewhere):

| Zone | y (px) | x (px) | Use |
|---|---|---|---|
| Header | 280–440 | 120–960 | Section number + label |
| Stage | 440–1070 | 120–960 | Keep key info at x ≤ 780 below y 840 |
| Caption | 1080–1245 | 120–780 | Left-aligned, terminal-prompt style |
| Decorative bleed | 0–270 and 1245–1920 | — | Texture, link lines, oversized type bleeding off-frame; nothing that must be read |

### Caption size and style
- **BBC Subtitle Guidelines** ([source](https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/)):
  - **For 9:16 video, the line height should be 3.9–4.5 % of the video height**, i.e. **75–86 px** at 1920.
  - Max line width is 90 % of the frame width for 9:16.
  - Reading rate is **160–180 wpm**, or about 0.3 s per word minimum on screen.
  - Avoid captions that straddle shot changes.
  - Default is white on black for legibility.
- **Our numbers [MEASURED]** (IBM Plex Mono advance ≈ 0.6 em):

| Size | Line height (1.2) | Chars per line in 660 px |
|---|---|---|
| 44 px | 2.75 % (too small) | 25 |
| 56 px | 3.5 % | 19 |
| 64 px | **4.0 %** | **17** |

  **Use 64 px, ≤ 17 characters per line, ≤ 2 lines.**
- **Chunking:** captions follow the VO verbatim in chunks of 1–4 words, changing on phrase boundaries and on scene changes (BBC). At 160 wpm, speech is about 2.7 words/s, inside BBC's reading rate.
  - TikTok's "5–10 words per second" for text overlays ([best practices](https://ads.tiktok.com/help/article/creative-best-practices?lang=en)) is about ad text, not verbatim captions. Don't use it to justify faster caption chunks **[OPINION]**.
- **Why burn in:** Meta's internal tests found captioned video ads **increase view time by 12 %** on average ([Meta](https://www.facebook.com/business/news/updated-features-for-video-ads)). TikTok, on the other hand, frames itself as sound-on: 73 % of users "stop and look" at sound-on ads ([Creative Codes](https://ads.tiktok.com/business/library/TikTok_CreativeCodes_May2023.pdf)). **Design for both:** the sound-on story, plus burned-in captions that make it complete with sound off.
- **Styling for our look [OPINION]:**
  - `inkDeep` text on a solid `paper` plate (1-cell padding) whenever captions overlap ASCII texture. This is our version of BBC's "white on black box".
  - Emphasise keywords by **inverting** them (paper-on-ink block), **not with magenta**, because magenta is reserved for the packet.
  - Prefix a `>` prompt glyph to sell the terminal feel.
  - Don't have captions typing out character by character when they're meant to be read. Scramble-resolve them in ≤ 6 frames, or a scramble effect will fight the reading.
- **Keyword "stickers":** Fireship uses 1–3-word stamps at the moment a term is spoken, gone after 1–2 s ([PandaStudio](https://www.writepanda.ai/blog/fireship-editing-style-measured/)). In our world these are the oversized block-type moments (`dns`, `packets`, `hop`, `100 ms`), one per beat.

---

## 4. Structure template — 45 s single-concept explainer

**Skeleton:** Hook → Promise → 01 → 02 → 03 (peak) → 04 → Payoff → Loop bridge.

This fuses TikTok's hook/body/close ([Creative Codes](https://ads.tiktok.com/business/library/TikTok_CreativeCodes_May2023.pdf)), Hoyos's hook formula, and Fireship's numbered-card skeleton.

Word budgets assume **160 wpm ≈ 2.7 words/s** of speech.

| # | Beat | Time (s) | Dur | Max words | Visual job | Interrupt at start |
|---|---|---|---|---|---|---|
| 0 | **Hook**: Enter pressed, face resolves | 0.0–2.5 | 2.5 | 7 | Cursor + keystroke at frame 0; character's face in the header/stage | Keystroke SFX at frame 0 |
| 1 | **Promise / stakes**: "less than a blink" + stopwatch appears | 2.5–5.5 | 3.0 | 8 | Stopwatch glyph starts at `000 ms` (the open loop) | Music enters sparse |
| 2 | **01 DNS**: name → address | 5.5–13.0 | 7.5 | 18 | URL scrambles into an IP; at most 1 "ask → answer" hop shown | Section slam `01` |
| 3 | **02 Packets**: split and number | 13.0–20.0 | 7.0 | 17 | Request chops into `#01/12…`; one packet turns magenta (the tracked one) | Slam `02`, groove enters |
| 4 | **03 Routing** (peak): hop by hop | 20.0–31.0 | 11.0 | 27 | Magenta packet hops router to router; routers flash a next-hop label; mid-beat camera pull-back to the wide network at ~25.5 s | Slam `03`; mid-beat pull-back |
| 5 | **04 Arrival + response** | 31.0–38.0 | 7.0 | 17 | Server reassembles; response streams back | Slam `04`, music drops near-silent |
| 6 | **Payoff**: stopwatch stops at the real number | 38.0–42.5 | 4.5 | 10 | Oversized block type `~100 ms` (from the facts file); the page renders | Chime; the one allowed "!" |
| 7 | **Loop bridge** | 42.5–45.0 | 2.5 | 4 | Page clears back to the empty URL bar = frame 0 | Line hands off to the hook |
| | **Total** | | 45 | **≈108** | | |

**Alternatives:**
- **30 s cut:** merge beats 1 into 0 and 5 into 6; keep 01–03.
- **60 s version:** add a 5 s "what can go wrong" beat (the red dropped packet plus a resend) between 03 and 04.

---

## 5. How existing explainers depict DNS, packets and routing

| Source | DNS | Packets | Routing | Notes |
|---|---|---|---|---|
| **Cloudflare Learning Center** ([packet](https://www.cloudflare.com/learning/network-layer/what-is-a-packet/), [routing](https://www.cloudflare.com/learning/network-layer/what-is-routing/), [DNS](https://www.cloudflare.com/learning/dns/what-is-dns/)) | "Phonebook of the Internet" | Alice cuts a letter onto index cards to fit Bob's mail slot; header = "Letter from Alice, 1 of 20"; header like a "packing slip" | Routing table = **train timetable**; router reading a header = **conductor checking tickets**; dynamic routing ≈ Google Maps/Waze | Flat vector diagrams; networks as numbered clouds with alternative paths (1-3-5 vs 2-4) |
| **ByteByteGo** ([DNS guide](https://bytebytego.com/guides/how-does-the-domain-name-system-dns-lookup-work), [video](https://www.youtube.com/watch?v=sMHzfigUxz4)) | "Address book"; hierarchical tree, **numbered 8-step arrow diagram** (browser → resolver → root → TLD → authoritative → back) | "Broken down into smaller chunks… may take different routes and arrive at different times… reassemble" | Separates **forwarding** (local, per-router table lookup) from **routing** (global path computation, BGP between autonomous systems); IP address = "postal address" | Numbered steps map well to our `01`–`04` section numbers |
| ***Warriors of the Net*** (Ericsson Medialab, 1997–99) ([manuscript](https://www.warriorsofthe.net/manuscript.html), [about](https://www.warriorsofthe.net/about.html)) | (not covered) | Physical parcels packed and labelled by **"Mr. IP" in a mail-room**; sender/receiver address on the label | LAN as a **crowded highway**; the router is a personified "systematic, uncaring, methodical" character; the router switch a "digital pin-ball wizard"; firewall = customs; "Ping of Death" as villain; paths "don't always take the fastest or shortest routes" | Made to explain packet switching vs circuit switching to telecom staff. Its strength is **personification plus a single tracked packet**, which is the ancestor of our concept |
| **Fireship**, *DNS in 100 Seconds* ([video](https://www.youtube.com/watch?v=UVR9lhUGAyU)) | Phone book; cache first, then recursive resolver → root → TLD → authoritative; "all happens within a fraction of a second" | — | — | About 205 wpm. Visual grammar is additive flat diagrams on dark ground, one element per clause ([PandaStudio](https://www.writepanda.ai/blog/fireship-editing-style-measured/)); specific frames of this video not inspected **[UNVERIFIED]** |

### Metaphors: which are effective and which mislead
| Metaphor | Effective for | Misleading because | Verdict for us |
|---|---|---|---|
| **Letters / index cards / parcels** (Cloudflare, Warriors) | Chopping, headers, numbering ("1 of 20"), reassembly | A postal system suggests someone plans the whole route. On the Internet **each router only picks the next hop** from its own table (Cloudflare routing; ByteByteGo forwarding vs routing) | **Use:** packets as numbered glyph cards `#03/12`, already in the design bible. **Don't** show a map of the whole route when a packet leaves |
| **Phone book** (Cloudflare, Fireship) | Name → number in one beat | Suggests one central book. Real DNS is hierarchical, distributed and heavily **cached** (Fireship notes cache first; ByteByteGo's tree) | **Use** as a single spoken phrase at most. Show "ask → answer", optionally one referral hop; skip root/TLD detail at 45 s |
| **Highway / traffic** (Warriors, Cloudflare "traffic") | Congestion, shared links, queueing | Packets aren't drivers; they **don't choose** routes, routers do. Implies lanes and free lane-changing | **Avoid** cars/roads. Links are wires (thin blue lines); a packet is carried, not driving |
| **Train timetable / conductor** (Cloudflare) | Per-hop lookup: read the ticket (header), consult the table, send to the next platform | Minor: trains run fixed schedules | **Use the conductor idea:** each router "reads the header" (the header glyph flashes) and flips a next-hop arrow |
| **GPS / Waze** (Cloudflare, for dynamic routing) | "Routes adapt" | BGP route choice between networks is **policy-driven** ("local policy", [RFC 4271 §9.1](https://www.rfc-editor.org/rfc/rfc4271#section-9.1)), not a live fastest-path optimiser | **Avoid** saying "the fastest route". Say "the next hop toward the address" |
| **"Each packet finds its own way"** (our brief) | True of the IP model: packets are forwarded independently and *can* take different paths (Cloudflare packet page) | Per-flow **ECMP hashing** deliberately keeps a flow on one next-hop so TCP isn't disrupted: "the same next-hop will be chosen for a given flow" ([RFC 2992 §2.2](https://www.rfc-editor.org/rfc/rfc2992)). Per-packet load balancing is rare because it reorders packets (Augustin et al., IMC 2007, cited in `technical.md` §5.4) | **Reword:** "every router decides again for every packet; no route is reserved." Show "different paths" with **different flows**, or a **reroute after a link failure**, never one flow's 12 packets scattering |
| **Personified packet** (Warriors) | Empathy; one thing to track | Implies agency | Our guide can *ride* or *accompany* the packet, but routers make the decisions |

---

## 6. Audio: narration, music, SFX

### Balance
- **Voice first.** BBC guidance, based on audience research: after the mix feels right, **take the music down another 4 dB**. Viewers never complain that quiet music ruined a programme. Be careful with **percussive sounds or lyrics under dialogue**, and check mixes on consumer speakers, not only studio monitors. ([BBC sound mixing best practice, PDF](https://www.bbc.com/backstage/downloads/audiomixguidelines.pdf))
- **Ducking:** `sound.md` sets −8 dB under narration. That's a floor, not a target. Use **−10 to −12 dB whenever the melodic lead plays under speech**, with a fast attack and a ~300–500 ms release so the bed breathes back in gaps. Release values are from podcast-mixing practice **[UNVERIFIED]**.
- **Music helps:** Meta reports campaigns with music or voice-over in Reels deliver "up to 13% higher incremental conversions" ([via Social Media Today](https://www.socialmediatoday.com/news/meta-shares-tips-on-reels-hooks-creative-diversification-in-ads-and-threa/808182/)).
- **TikTok's role split** ([Creative Codes](https://ads.tiktok.com/business/library/TikTok_CreativeCodes_May2023.pdf)):
  - Music sets mood and rhythm.
  - Voice-over "reveals more details… keep it clear and concise".
  - Sounds "parallel or amplify the actions".
- **Loudness:** master to about **−14 LUFS integrated, ≤ −1 dBTP**. This is the widely cited YouTube normalisation target; TikTok/Reels targets have no official documentation **[UNVERIFIED]**.
- **Phone speakers** reproduce little sub-bass **[UNVERIFIED]**. Give the sine sub from `sound.md` harmonics, or double it an octave up, so the groove survives phone playback.

### SFX density [OPINION]
- One SFX per visual event; short (≤ 150 ms for hops and ticks); pitched to the track's key.
- **No more than about 3 SFX starts in any 1 s window.**
- **Never put a transient SFX on the stressed word** of a VO sentence. Place it in the gap before or after.
- **Packet-hop blips:** rising pitch per hop is great, but cap each sequence at about 8 hops (one octave), then reset. Twelve simultaneous packets must not each blip; only the **magenta tracked packet** gets hop sounds, and the rest are a soft collective shimmer.
- **Silence is an interrupt:** the "drop to near-silence at arrival" in `sound.md` is a strong beat. Keep it to 0.5–1.5 s so the VO doesn't sound stranded.

### Voice direction: "smooth but upbeat" (user requirement)
Target: warm, even timbre with bright, energetic delivery, but not hype.

**Pace**
- **155–165 wpm measured over speech**, which comes to 105–115 words for 45 s.
- Kurzgesagt shorts (≈160–175 wpm) are the reference; Veritasium/Fireship (≈205 wpm) are too fast for this register [MEASURED, §2].

**Sentence shape**
- 5–14 words, average about 9, hard max 16. One idea per sentence, one visual event per clause.
- Hook ≤ 8 words.
- Start sentences with the new thing ("Packets…", "Each router…") so the stress lands early and matches the visual.
- Upbeat comes from **short declaratives plus rising lists**, not from exclamation marks **[OPINION]**.

**Punctuation for ElevenLabs prosody** ([ElevenLabs best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices))
- **Period:** a full landing. Use one at every section boundary so each slam lands on a falling cadence.
- **Comma:** a light lift. Use in lists ("split, numbered, sent").
- **Dash (`—` or `--`):** the docs list dashes as a "short pause". Use for quick pivots ("the name — turned into a number").
- **Ellipsis (`...`):** the docs say it adds "pauses and weight" and "hesitant tones". Max one in the script (before the payoff), because it softens energy.
- **Question mark:** hook only, for a curious rise.
- **Exclamation mark:** at most one, on the payoff.
- **CAPITALS:** in v3/v4, "Capitalization increases emphasis". Use at most one capitalised word every two sentences, or the read turns shouty.

**Model notes**
- **Eleven v3/v4 do not support SSML `<break>` tags.** Use punctuation, text structure and audio tags.
- **v2/Flash models** support `<break time="x.xs"/>` up to 3 s, but "too many break tags… can cause instability", and the voice may speed up (same doc).

**Audio tags (v3/v4)**
- The docs advise describing voice quality explicitly and matching tags to the voice.
- Use **one delivery tag at the start**, e.g. `[warm, bright, upbeat narration]`, plus at most `[curious]` on the hook question.
- **Don't scatter `[excited]`**; that's where "hype" comes from.
- Test the chosen tags; the docs admit they are "not perfect yet".

**Voice settings** ([ElevenLabs TTS guide](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech))
- Start at **stability ≈ 0.45–0.55**. The docs' common setting is "stability around 50, similarity around 75, style at 0". Too low sounds "overly random" and can make the voice "speak too quickly"; too high sounds monotonous.
- **Similarity ≈ 0.75.**
- **Style exaggeration 0** (the docs say higher values make the model "slightly less stable").
- **Speed 1.00–1.05.** The allowed range is 0.7–1.2, and "extreme values may affect the quality".
- Pick a voice whose **natural** read is already warm and bright; the docs stress that delivery found in the voice's training data is easiest to reproduce.

**Text normalisation** (same doc)
- Write numbers as words ("one hundred milliseconds").
- Never make the voice read an IP address or `#03/12`; those live on screen only.
- Expand acronyms the first time if their pronunciation matters: "D-N-S" is said letter by letter.

**Generation workflow [OPINION]**
- Generate the whole script in one pass so timbre and energy stay consistent. Regenerate single lines only where needed and match their loudness.
- Lock VO timing before animating; the brief already says the script drives timing.

**Music under this voice [OPINION]**
- 110–120 BPM (`sound.md`) pairs naturally with about 160 wpm: roughly 1.4 words per beat, so syllables fall on eighth notes.
- Keep the **lead melody out while the voice is speaking**. Let it answer in the gaps (call-and-response), or voice it an octave above the speaking range.
- The bit-crushed kit should stay light on snare/hat density under VO (BBC's percussive warning).
- Land section slams on bar lines, and cut or trim VO pauses so the next sentence starts on the downbeat after a slam.

---

## 7. Recommendations for our look (ASCII / terminal anime)

### Physical size on a phone [MEASURED]
A 1080-px-wide video displayed full-width:

| Device | Scale | 12-px ASCII cell | 30 px | 44 px | 64 px |
|---|---|---|---|---|---|
| iPhone, 393 pt wide | 2.75 px/pt | 4.4 pt | 10.9 pt | 16 pt | 23 pt |
| Small Android, 360 dp | 3.0 px/dp | 4.0 dp | 10 dp | 14.7 dp | 21 dp |

Apple's minimum iOS text size is **11 pt** and the default body size is **17 pt** ([Apple HIG, Typography](https://developer.apple.com/design/human-interface-guidelines/typography)). So:
- **12×20 px ASCII cells can't be read as letters** on a phone. They read as **texture/halftone**, which is fine for dither, clouds and shading.
- **Anything meant to be read as characters** must be at least **36 px** (≈ 13 pt; data labels) and preferably **48 px+** (≈ 17 pt; key words).
- **Two-scale ASCII rule [OPINION]:**
  - **texture layer** at 12×20 px (90 columns)
  - **hero layer** at ≥ 24×40 px (≤ 45 columns) for the character's face, the tracked packet and router labels, so individual glyphs are *visibly glyphs* (the style's selling point)
- **Compression:** platforms re-encode uploads. Grain-like, high-frequency noise "is inherently difficult to compress… high bitrates may be required" ([AOMedia film-grain technical report](http://aomedia.org/docs/CWG-C051o_TR_AOMedia_film_grain_synthesis_technology_v2.pdf)). By analogy, full-frame 1-px dither and every-frame scrambles will smear **[INFERENCE]**. So:
  - Avoid single-pixel checkerboard dithers.
  - Keep the 15 fps ASCII update from `motion.md`; it halves temporal noise.
  - Limit dense, animating texture to about ⅓ of the frame at any moment.

### Contrast [MEASURED] (WCAG 2.x formula, palette.json hex)
| Pair | Ratio | Verdict ([WCAG 2.2 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum): text ≥ 4.5:1, large text ≥ 3:1; [1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast): graphics ≥ 3:1) |
|---|---|---|
| `inkDeep` #0B1A7A on `paper` | **12.5:1** | Best choice for captions and data |
| `ink` #1F3FE0 on `paper` | **6.3:1** | OK for all text |
| `ink` @ 0.8 opacity on `paper` (the current `data` style) | **4.4:1** | **Fails AA.** Use `inkDeep` (at 0.8 opacity it's still 7.5:1) |
| `signal` magenta #E6168A on `paper` | **3.7:1** | Graphics and **large** text only. WCAG "large" = 18 pt, or 14 pt bold ≈ **≥ 66 px regular / ≥ 52 px bold** at our scale |
| `error` #E0331F on `paper` | 3.9:1 | Same as signal |
| `skyTint` #9DB4F2 on `paper` | **1.75:1** | Decorative only; never text or essential lines |
| `signal` vs `ink` (packet on a link line) | **1.7:1** | Luminance too close. Separation relies on hue, and red-weak viewers see magenta shift toward blue **[INFERENCE]** ([WCAG 1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color)) |

**Fix for the packet:**
- Give the magenta packet a **non-colour cue**: a solid filled block (vs thin blue lines) that is ≥ 2 cells larger than blue glyphs.
- Add a **1-cell paper-coloured gap/halo** where it sits on a line.
- Give it its own motion (the trail).

### Using the anime guide without clutter [OPINION]
- **One role per shot.** Either she is the **guide** (in a corner, reacting, pointing, gaze leading to the subject) or she is **with the packet** (riding it at hero scale). Never both on screen at once.
- **Magenta follows the packet, not her.** The palette rule allows `signal` on one subject at a time. If she "becomes" the packet, only one accessory (ribbon or hair tie) turns magenta and the packet glyph drops to blue for that shot.
- **Screen share:** as guide, ≤ ⅓ of the stage and parked at the stage's **left or upper edge**. The lower-right is the platform rail (x > 780, y > 840), so never put her face there.
- **Appearances:**
  - hook (face by frame 12)
  - one mid-video interrupt (a reaction at the routing peak)
  - payoff (a reaction to the stopwatch)

  That's about 30–40 % of runtime. Between those, the network is the star.
- **Performance economy:** 4–6 reusable key poses (curious, pointing, surprised, satisfied, riding) and blinks/hair-sway on the 15 fps ASCII step. No lip sync, since the VO is a narrator and not her dialogue unless the script says otherwise.
- **Detail budget:** per the design bible, her face is the only fine-detail zone. So when she's on screen, hold the network at low density (texture scale, fewer labels) so two detailed things never compete.
- **Enter/exit through the ASCII ramp** (`@ # + . space`, 6–8 frames). That doubles as a pattern interrupt without new motion vocabulary.

---

## Rules for our storyboard (checklist)

1. **Frame 0 has motion and the subject.** Cursor or keystroke visible at t = 0; no logo, title card or fade-from-blank.
2. **Spoken hook ≤ 8 words, finished by t ≤ 2.0 s.** It refers to the viewer's own action or a surprising claim.
3. **Topic proposition stated by t ≤ 3.0 s.** Payoff promise (stopwatch or "less than a blink") on screen by t ≤ 5.5 s.
4. **Character's face readable (hero scale) within the first 12 frames.**
5. **Total runtime 43–47 s. VO script 105–115 words (cap 120)**, paced at 155–165 wpm.
6. **Every VO sentence ≤ 16 words; average ≤ 10; one idea per sentence.**
7. **Script punctuation:** ≤ 1 exclamation mark (payoff only), ≤ 1 ellipsis, question marks only in the hook, ≤ 1 CAPITALISED emphasis word per two sentences. **No** SSML `<break>` tags if using Eleven v3/v4.
8. **Numbers and IPs are never read digit by digit.** VO numbers are spelled as words; IPs and packet IDs appear on screen only.
9. **A visible change at least every 2.0 s**, and every narrated clause maps to exactly one visual event.
10. **A major pattern interrupt every 6–8 s** (section slam, pull-back, scanline wipe, music drop). No single interrupt type used more than twice.
11. **Beat timing within ±1 s of the §4 table:** 01 DNS starts ≤ 6 s; 03 Routing is the longest beat (≥ 9 s); payoff lands at 37–42 s.
12. **Loop:** the last frame matches frame 0 (empty URL bar and cursor), and the last line hands off grammatically to the first. No end card or CTA.
13. **Essential content** (labels, numbers, captions, the character's face) sits inside **x 120–960, y 270–1245**, and never at **x > 780 with y > 840**.
14. **Captions:** IBM Plex Mono **64 px**, line height ≥ 75 px, ≤ 17 characters per line, ≤ 2 lines, left-aligned at x = 120. Caption box inside y 1080–1245.
15. **Captions are verbatim VO chunks of 1–4 words**, each on screen ≥ 0.3 s per word. Chunks never straddle a scene change.
16. **Caption colour:** `inkDeep` on a solid `paper` plate over any texture. Emphasis by inversion, never magenta.
17. **Readable text ≥ 36 px** (data labels); **key words ≥ 48 px**. ASCII at the 12×20 cell size is texture only and never carries meaning.
18. **No readable text in `ink` below 100 % opacity**, and no text in `skyTint`. `signal`/`error` text only at ≥ 66 px regular or ≥ 52 px bold.
19. **Magenta is on at most one subject per frame** (the tracked packet). That packet also differs by shape, size and a paper halo, not colour alone.
20. **Guide character on stage ≤ ⅓ of stage area and ≤ ~40 % of runtime.** She is never guide and packet-rider in the same shot, and never in the lower-right rail zone.
21. **Wording:** VO never claims packets pick their own route or take "the fastest route", and never says "dozens of machines". Routers choose the next hop for every packet; no route is reserved. Different paths are shown only as a different flow or as a reroute after a link failure.
22. **DNS shown as ≤ 2 visual steps** (ask → answer, optionally one referral). The phone-book metaphor is at most one spoken phrase.
23. **Mix:** music ducked ≥ 8 dB under VO (≥ 10 dB when the lead melody plays). No melodic lead or lyric-like hook under the stressed words. Master ≈ −14 LUFS, ≤ −1 dBTP.
24. **SFX:** ≤ 3 SFX starts per second; hop blips only on the tracked packet, ≤ 8 rising steps per run. No transient on a stressed VO word.
25. **Voice settings start at** stability 0.45–0.55, similarity ≈ 0.75, style 0, speed 1.00–1.05. One global delivery tag (e.g. `[warm, bright, upbeat narration]`); no repeated `[excited]`.
