# Technical research: how a request for `https://example.com` crosses the Internet

Research input for the storyboard of *How the Internet Routes a Request* (45 s, 9:16). Every number has a linked source. `[MEASURED]` means we observed it ourselves on 2026‑09‑29 with `dig`, `curl` and `mtr` over a residential link in eastern Australia (UTC+10). One location on one evening: it shows the order of magnitude, not a global average. `[UNVERIFIED]` means no primary source was checked.

> **TL;DR for the storyboard**
> - The brief's line "packets that **each find their own way**" is the part a network engineer will object to. Within one connection, routers deliberately keep a flow's packets on **one** path (§5.4). A defensible version: *"every packet is routed independently. No line is reserved, and each router decides again for every packet."*
> - "**Dozens of machines**" overstates it for a CDN-served page (we measured 6 router hops). A typical path crosses about **15** routers (§5.5).
> - "**~100 ms, less than a blink**" holds for the **first response** from a nearby CDN edge (we measured 26–41 ms TTFB). It does not hold for a full page load of a median site (§9).
> - Fun fact: `example.com`'s real page is **713 bytes** and fits in **one** packet [MEASURED]. To show "chopped into packets", describe a *typical* page. The median HTML document alone is 18 KB, about 13 packets (§4).

---

## 1. URL entry, browser cache, HSTS

1. You type `example.com` and press Enter. The browser treats the text as a URL (scheme `https`, host `example.com`, path `/`).
2. **HSTS.** Some sites have told the browser (via the `Strict-Transport-Security` header) or are listed in the built-in **HSTS preload list**. For those, the browser upgrades to `https://` itself and never sends plain HTTP ([RFC 6797][rfc6797], [hstspreload.org][hsts]).
3. **Caches first.** If the page or its parts are still fresh in the browser's HTTP cache, they load without any network traffic. Freshness rules are in [RFC 9111][rfc9111]. The same applies to the DNS answer (§2): the browser and OS keep resolved names until the record's TTL runs out.
4. Only if something is missing does the network journey start.

*Note:* `example.com` is a name reserved for documentation ([RFC 2606][rfc2606]). As of today it's served by Cloudflare's CDN (`server: cloudflare`, `cf-cache-status: HIT`, served from the `SYD` edge) [MEASURED], so its real journey is itself a CDN story (§6).

## 2. DNS resolution

**Cast:** the *stub resolver* (the small DNS client in your OS or browser), the *recursive resolver* (your ISP's, or a public one like 1.1.1.1 or 8.8.8.8), the *root* servers, the *TLD* servers (`.com`) and the *authoritative* servers for `example.com`. Terms are defined in [RFC 9499][rfc9499]; the protocol is [RFC 1034][rfc1034]/[RFC 1035][rfc1035].

Sequence on a cold lookup:
1. The stub asks the recursive resolver: "A/AAAA record for `example.com`?" This is usually one small UDP packet to port 53, or encrypted via DoH/DoT.
2. The recursive resolver asks a **root** server. The root doesn't know the answer but refers it to the `.com` servers. There are **13 root server identities** (a–m.root-servers.net), run by **12 organisations**, and served by **2,045 anycast instances** ([root-servers.org][roots], figure read 2026‑09‑29).
3. It asks a **.com TLD** server (`a.gtld-servers.net` …), which refers it to `example.com`'s own nameservers. Today those are `hera.ns.cloudflare.com` and `elliott.ns.cloudflare.com` [MEASURED].
4. It asks the **authoritative** server, which returns the address records. Real answer today: `example.com. 300 IN A 104.20.23.154` / `172.66.147.243` [MEASURED]. Don't put these on screen; use the doc-range props in §12.
5. The recursive resolver caches the answer for its **TTL** (300 s for example.com [MEASURED]) and returns it to the stub, which also caches it.

**Caching is why the root is rarely consulted.** The root hands out the `.com` delegation with a TTL of **172,800 s (2 days)** [MEASURED: `dig @a.root-servers.net com NS`], so a busy resolver almost never re-asks the root for `.com`. Jung et al. found caching very effective. They report a median name-resolution latency **under 100 ms** in 2000‑era traces ([Jung et al., IEEE/ACM ToN 2002][jung]).

**Typical latencies**
| Case | Time | Source |
|---|---|---|
| Browser/OS cache hit | ~0 ms | [MEASURED] `dig` via local cache: `Query time: 0 msec` |
| Recursive resolver cache hit | ≈ 1 RTT to resolver: **5 ms** to 1.1.1.1 / 8.8.8.8 | [MEASURED] |
| Full curl name lookup, first try | **12 ms**, then **<1 ms** once cached | [MEASURED] `curl time_namelookup` |
| Single query to a root instance | 162 ms on one probe (anycast routing chose a distant instance) | [MEASURED]; variance explained by [Schmidt et al. 2017][anycastpam] |
| Historic median, cold resolution | < 100 ms | [Jung et al. 2002][jung] |
| DoH vs plain DNS | most queries ~6 ms slower, slowest much faster | [Mozilla Nightly experiment, 2018][mozdoh] |

## 3. Connection setup: TCP + TLS 1.3 (and QUIC)

- **TCP 3‑way handshake:** `SYN` → `SYN‑ACK` → `ACK`, which costs **1 RTT** before data can flow ([RFC 9293][rfc9293]). Each side picks a random *initial sequence number* ([RFC 6528][rfc6528]).
- **TLS 1.3:** the client sends `ClientHello` with a key share, and the server answers `ServerHello` + certificate + `Finished`. A full handshake takes **1 RTT**. The client's HTTP request can ride right behind its `Finished`. A resumed session can send data in **0‑RTT** ([RFC 8446 §2][rfc8446]).
  - Recent detail: with post-quantum hybrid key exchange (X25519MLKEM768), the ClientHello is "typically split across two packets"; without it, it "almost always fits within one" ([Cloudflare docs][cfpq]).
- **Net cost over TCP:** the first response byte arrives after about **3 RTTs** (TCP, TLS, request/response) plus server time. Measured to the Cloudflare edge: connect at 6–7 ms, TLS done at 17 ms, first byte at 26–28 ms (warm DNS) [MEASURED]. That's about 3 × ~8 ms RTT, as the model predicts.
- **Alternative: QUIC / HTTP/3.** QUIC runs over UDP and merges the transport and TLS 1.3 handshakes. A new connection gets the response at about **2 RTTs** instead of 3, and resumption allows 0‑RTT ([RFC 9000][rfc9000], [RFC 9001][rfc9001], [RFC 9114][rfc9114], [Langley et al., SIGCOMM 2017][quic17]). Our curl used HTTP/2 over TCP [MEASURED].

Keep it short on screen: one "handshake" beat. Optionally show the magic words `SYN / SYN-ACK / ACK` and a padlock.

## 4. Packetisation

- **MTU.** Ethernet carries at most **1500 bytes** of IP packet ([RFC 894][rfc894]), and that has become the de‑facto Internet MTU. IPv6 guarantees at least **1280** ([RFC 8200][rfc8200]).
- **Headers.** The IPv4 header is **20 bytes** minimum: version, length, **TTL** (8 bits, so max 255), protocol (6 = TCP), header checksum, **source address**, **destination address** ([RFC 791][rfc791]). IPv6 has a fixed 40‑byte header with **Hop Limit** instead of TTL ([RFC 8200][rfc8200]). TCP adds **20+ bytes**: source/destination **ports**, 32‑bit **sequence number**, acknowledgment number, flags, window ([RFC 9293][rfc9293]).
- **Payload per packet.** 1500 − 20 (IP) − 20 (TCP) = **1460 bytes** of data (the MSS). That's arithmetic from the header sizes above; TCP options such as timestamps shave off a few more bytes.
- **Sequence numbers count bytes, not packets.** They count bytes starting from a random offset ([RFC 9293 §3.4][rfc9293], [RFC 6528][rfc6528]). Tools like Wireshark show *relative* numbers: 1, 1461, 2921, … A label like `#03/13` is an explainer device, not a real header field.
- **How a request/response is split.**
  - The **request** is tiny: curl's GET for example.com was **100 bytes** [MEASURED], which is **one packet**.
  - The **response** gets split. The median web page's **HTML alone is 18 KB** ([Web Almanac 2024, Page Weight][almanacpw]), about **13 packets** at 1460 B each. The whole median page is **2.3 MB (mobile) / 2.65 MB (desktop)** over about **71 requests** (same source), roughly **1,600+ packets** (2,311 KB ÷ 1.46 KB, our arithmetic).
  - `example.com` itself: **713 bytes** of HTML, **409 bytes** compressed. The whole page is one packet [MEASURED].
- **First flight.** A new TCP connection may send only **10 segments** (~14.6 KB) before the first ACKs return ([RFC 6928][rfc6928]; explained in [HPBN ch. 2][hpbntcp]). That's why a ~13‑packet HTML file is a nicely "one-round-trip" size.

## 5. Routing

### 5.1 First hop: home router / default gateway
Your device sends every packet addressed off the local network to its **default gateway**, usually the home router. The router does NAT for IPv4 and hands the packet to the ISP link. In our trace, hop 1 (home router) took ~3 ms and hops 2–3 (ISP access/aggregation) ~5 ms [MEASURED].

### 5.2 Networks of networks: ASes, BGP, IXPs
- The Internet is made of **autonomous systems** (ASes), independently run networks such as ISPs, CDNs, universities and clouds. **79,509 ASes** are visible in the global routing table, which holds **~1,079,000 IPv4 prefixes** ([CIDR Report, 2026‑09‑29][cidr]).
- ASes tell each other which address blocks they can reach using **BGP** ([RFC 4271][rfc4271]). BGP is *policy* routing: business relationships (customer/peer/transit) often beat "shortest". Among equal candidates, BGP prefers the shorter AS path (RFC 4271 §9.1.2.2).
- **IXPs** (Internet Exchange Points) are shared switching fabrics where many ASes interconnect ("peer") directly, which shortens paths ([Castro et al., RIPE Labs][ixp]). Cloudflare alone reports **13,000+** network interconnections ([Cloudflare network][cfnet]).
- AS‑level path length: in a 2014 RIPE Atlas study, **4–7 AS hops** covered ~74% of paths (4: 17%, 5: 24%, 6: 19%, 7: 14%) ([de Vries & Santanna, RIPE 69][ripe69]).

### 5.3 Per-hop forwarding
- Each router looks up the destination IP in its forwarding table and takes the **longest-prefix match**, the most specific route that contains the address ([RFC 1812 §5.2.4.3][rfc1812]). Example: 203.0.113.10 matches both `203.0.113.0/24` and `203.0.0.0/16`; the `/24` wins.
- The router **decrements TTL by 1**. If it hits 0, the router drops the packet and sends back ICMP *Time Exceeded* ([RFC 1812 §5.3.1][rfc1812], [RFC 792][rfc792]). This keeps looping packets from circulating forever. IPv6 does the same with Hop Limit.
- Common starting TTLs: Linux **64** ([kernel ip-sysctl docs][linuxttl]). Windows commonly uses **128** [UNVERIFIED]. So a packet from a Linux/macOS client arrives after 10 routers with TTL **54**.
- **Traceroute** exploits this: it sends probes with TTL 1, 2, 3 … and each router that zeroes one reveals itself.
- Routers don't know the whole path. Each only picks the **next hop**. Time is dominated by **distance** (light in fibre), not hop count. On our 28‑hop trace to Germany, a single trans-Pacific hop added ~135 ms (4.9 → 142 ms at hop 7) [MEASURED]. Fibre RTT New York–London ≈ **56 ms**, New York–Sydney ≈ **160 ms** ([HPBN ch. 1, Table 1‑1][hpbnlat]).

### 5.4 Do packets of one flow take different paths? (the honest answer)
- **What's true:** IP is **packet-switched**. No circuit is reserved, each router forwards each packet on its own, and the path *can* change mid-stream when links fail or BGP changes. Load balancing is common: **39%** of source–destination pairs crossed a per-flow load balancer, and **70%** a per-destination one ([Augustin, Friedman, Teixeira, IMC 2007][lb07]). It has since grown more varied ([Almeida et al., INFOCOM 2020][lb20]).
- **What's false (in the popular version):** "each packet of your download takes its own route." Routers with multiple equal-cost next hops (**ECMP**) usually **hash the flow's 5‑tuple** (addresses, ports, protocol), so every packet of one TCP/QUIC connection takes the **same** branch ([RFC 2992][rfc2992]; IPv6 flow label for the same purpose: [RFC 6438][rfc6438]). **Per-packet** load balancing was seen on only **1.9%** of pairs, and "network operators avoid this technique because it can cause packet reordering" ([IMC 2007][lb07]).
- **Acceptable 45‑s simplifications, ranked:**
  1. ✅ *"Every router decides again for every packet: no fixed line, no reservation."* Fully true.
  2. ✅ *"Packets can take different routes"*, shown as **different requests/flows** (HTML vs. an image from another server) on different branches, or later packets **rerouting around a failed link**. True.
  3. ⚠️ *"Each packet finds its own way"* as a poetic line over visuals of one flow splitting. It's the textbook "datagram" idea, but today's per-flow hashing makes it misleading. If kept, make the visual show **packets from different flows** splitting.

### 5.5 Typical hop counts (traceroute evidence)
| Path | IP hops | Source |
|---|---|---|
| Home → CDN edge (example.com, same city) | **6** hops, ~5–8 ms | [MEASURED] `mtr -4 example.com` |
| Home → origin server in Germany (from Australia) | **28** hops, ~288 ms | [MEASURED] `mtr -4 ftp.fau.de` |
| CAIDA Ark monitor, Utrecht NL → random destinations | median **14** (10th–90th pct: 10–20) | [CAIDA Ark ams-nl][arkams] |
| CAIDA Ark monitor, San Diego US | median **16** (11–23) | [CAIDA Ark san-us][arksan] |
| CAIDA Ark monitor, Honolulu US | median **15** (10–20) | [CAIDA Ark hnl-us][arkhnl] |
| 1998 study, 8,098 site pairs | mean **17.0** | [Fei et al., Globecom 1998][fei98] |

Traceroute quirk: a middle hop can show a spike (ours: hop 4 worst 52 ms while hop 5 was 6 ms) [MEASURED]. Routers put generating ICMP replies below forwarding, so a single-hop spike that later hops don't inherit is not real delay ([Steenbergen, NANOG 47 traceroute tutorial][nanogtr]; automated fetch returned 403, so link unverified by us).

## 6. CDN / anycast: why the "server" is often nearby

- Big sites put copies of content on **CDN edge servers** in hundreds of cities. Cloudflare lists **348 cities**, says **95%** of the world's Internet-connected population is within **50 ms**, and "most are within 20 ms" ([Cloudflare network][cfnet]).
- Two steering methods:
  1. **Anycast:** the *same* IP address is announced via BGP from many sites, and routing delivers you to a "nearby" one ([RFC 4786][rfc4786], [Cloudflare: What is Anycast?][cfany]). The DNS root uses this too: 2,045 instances ([root-servers.org][roots]).
  2. **DNS-based mapping:** the authoritative DNS answers with a different address depending on where the resolver (or client subnet) is ([Chen et al., "End-User Mapping", SIGCOMM 2015][akamai15]).
- Caveat: "nearby" means *BGP-nearest*, not always geographically nearest. Clients sent to a non-optimal site had median RTTs of **40 ms or more** in a study of four root letters ([Schmidt, Heidemann, Kuipers, PAM 2017][anycastpam]).
- Evidence: example.com resolves to a Cloudflare anycast address and answered from the **SYD** edge (`cf-ray: …-SYD`, `cf-cache-status: HIT`) in **6 hops** [MEASURED]. If the edge misses, it fetches from the **origin** server, which may be far away.

## 7. Server response, reassembly, retransmission

- The server (edge or origin) builds the HTTP response ([RFC 9110][rfc9110]) and TCP cuts it into segments (§4).
- The receiver's TCP **reorders by sequence number** and delivers a contiguous byte stream to the browser. It **ACKs** what arrived, and **SACK** tells the sender exactly which ranges are missing ([RFC 9293][rfc9293], [RFC 2018][rfc2018]).
- **Loss:** a missing segment gets **retransmitted**. It's caught either quickly (after **3 duplicate ACKs**, "fast retransmit", [RFC 5681][rfc5681]; or via time-based RACK‑TLP, [RFC 8985][rfc8985]) or after a timeout. The initial timeout is **1 s** ([RFC 6298][rfc6298]).
- Packets are dropped mostly when router queues overflow (congestion) or the TTL expires. TCP treats loss as a congestion signal and slows down ([RFC 5681][rfc5681]).
- QUIC does the same job inside UDP, with per-stream ordering ([RFC 9000][rfc9000], [RFC 9002][rfc9002]).

## 8. Rendering the page

The browser parses HTML into the **DOM** and CSS into the **CSSOM**, runs JavaScript, computes **layout**, then **paints** and **composites** pixels ([MDN: How browsers work][mdnhow]). While parsing, it discovers sub-resources (CSS, JS, fonts, images). Each one repeats parts of this whole journey: new DNS lookups, maybe new connections, many more packets. The median page makes **~71 requests** ([Web Almanac 2024][almanacpw]).

## 9. Realistic timing numbers

**Model (TCP + TLS 1.3, cold connection):** `TTFB ≈ DNS + 3 × RTT + server time`. With QUIC it's `DNS + 2 × RTT + server time` (§3).

| Quantity | Value | Source |
|---|---|---|
| RTT to nearby CDN edge | ~5–8 ms (ours); ≤ 50 ms for 95% of users, most ≤ 20 ms | [MEASURED]; [Cloudflare network][cfnet] |
| DNS (cached / resolver hit / first lookup) | ~0 ms / ~5 ms / 12 ms | [MEASURED] |
| TCP connect done | 6–7 ms (warm DNS) | [MEASURED] `curl time_connect` |
| TLS 1.3 done | 16–17 ms | [MEASURED] `time_appconnect` |
| **TTFB, example.com via CDN edge** | **26–28 ms warm, 41 ms cold** | [MEASURED] `time_starttransfer` |
| Far origin RTT (Australia → Germany) | ~288 ms, so TTFB ≳ 3 × 288 ≈ 0.9 s cold | [MEASURED] + model |
| "Good" TTFB threshold (web-wide) | ≤ 0.8 s; poor > 1.8 s | [web.dev TTFB][webttfb] |
| Share of origins with good TTFB (2025) | 55% desktop, 44% mobile | [Web Almanac 2025, Performance][almanacperf] |
| Human blink | 100–400 ms | [High-frame-rate blink study, 2025 (PMC12638546)][blink] |

**Implication for the brief's "~100 ms" beat.** The first response from a nearby edge (tens of ms) is honestly "faster than a blink". A full load of a median site is not: 71 requests and 2+ MB take well over a second. Say "the first reply", or time-stamp the HTML arrival rather than the finished page.

---

## 10. Misconceptions to avoid

1. **"Each packet takes its own route."** Per-flow ECMP hashing keeps a connection's packets on one path. Per-packet balancing is rare (1.9%) and avoided ([IMC 2007][lb07], [RFC 2992][rfc2992]).
2. **"Packets are numbered 1, 2, 3."** TCP sequence numbers count **bytes** from a **random** start ([RFC 9293][rfc9293], [RFC 6528][rfc6528]).
3. **"The request is split into many packets."** The GET is usually **one** packet (100 bytes here [MEASURED]); the **response** is what gets split.
4. **"DNS asks the root every time."** Caching means the root is rarely asked (delegation TTL 2 days [MEASURED]).
5. **"There are 13 root servers."** There are 13 root *identities* served by **2,045** anycast instances ([root-servers.org][roots]).
6. **Confusing the two TTLs.** DNS TTL = seconds to cache. IP TTL = remaining router hops. Label them clearly.
7. **"Routers know the whole route / plan the path."** Each router only picks the next hop by longest-prefix match ([RFC 1812][rfc1812]).
8. **"More hops = slower."** Distance dominates. One ocean hop added ~135 ms [MEASURED]; light in fibre ≈ 2/3 c ([HPBN][hpbnlat]).
9. **"Your data travels to the website's server."** Often it goes to a **CDN edge** nearby ([Cloudflare][cfnet]); the origin may never be contacted (`cf-cache-status: HIT` [MEASURED]).
10. **"Anycast = geographically nearest."** It's BGP-nearest, and mishits happen ([PAM 2017][anycastpam]).
11. **"HTTPS encrypts where you're going."** The destination IP is always visible to routers. DNS and the server name can be encrypted only with DoH/DoT and ECH [UNVERIFIED how widely ECH is deployed]. Avoid privacy claims.
12. **"It all takes less than a blink."** True for the first response from a nearby edge. False for a whole median page (§9).
13. **"Dozens of machines."** It's ~15 routers typically ([CAIDA Ark][arkams]), 6 to a nearby CDN [MEASURED]. "Dozens" only for far-away origins (28 [MEASURED]).
14. **Traceroute spikes at one middle hop ≠ congestion** (ICMP de-prioritised; §5.5).
15. **"The Internet is a cloud / one network."** It's ~79,500 separately run networks ([CIDR Report][cidr]). Handy, since the design bible bans "globe with arcs" anyway.
16. **"MTU is always 1500."** It's the common Ethernet value. Tunnels, PPPoE and so on reduce it; IPv6's minimum is 1280 ([RFC 894][rfc894], [RFC 8200][rfc8200]).

## 11. Safe simplifications (defensible)

| Say / show | Why it's defensible |
|---|---|
| "DNS is the Internet's phone book." | It maps names to addresses ([RFC 1034][rfc1034]); skip record types and DNSSEC. |
| Show root → .com → example.com as three quick stops. | That's the cold-lookup order; caching just skips steps. |
| "A handshake opens a secure connection." | TCP + TLS 1.3 are 2 RTTs; QUIC merges them. Showing one handshake beat hides no false claim. |
| "Data is cut into packets of about 1,500 bytes." | Ethernet MTU 1500 ([RFC 894][rfc894]). The payload is 1460, but "about" covers it. |
| Packet label `#03/13`. | Stands in for byte-based sequence numbers; show a real `seq=2921` once if you want rigour. |
| "Every router reads the address and passes it one step closer." | Exactly next-hop forwarding ([RFC 1812][rfc1812]); "closer" means by routing metrics or policy. |
| "Each hop, the counter drops by one; at zero, it's dropped." | IP TTL rule ([RFC 1812 §5.3.1][rfc1812]). |
| "Networks agree on routes using BGP." | BGP is the inter-AS protocol ([RFC 4271][rfc4271]); leave out policy details. |
| "Packets can take different paths." | True across flows, over time, and after failures ([IMC 2007][lb07]). Show it with different flows, not one flow splitting. |
| "The server is often a copy near you." | CDN edges in hundreds of cities ([Cloudflare][cfnet]); example.com itself [MEASURED]. |
| "Missing pieces are simply sent again." | TCP retransmission ([RFC 5681][rfc5681]). |
| "Pieces are put back in order." | TCP reassembly by sequence number ([RFC 9293][rfc9293]). |
| "The first reply is back faster than a blink." | 26–41 ms TTFB vs 100–400 ms blink ([MEASURED], [blink]). |
| Show ~10–12 hops on screen. | Sits between the CDN (6) and typical (median 14–16) paths ([CAIDA Ark][arkams]). |

## 12. Concrete data props (documentation-safe)

Only use: IPv4 `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` ([RFC 5737][rfc5737]); IPv6 `2001:db8::/32` ([RFC 3849][rfc3849]); names `example.com/.net/.org` and the `.example` TLD ([RFC 2606][rfc2606]); ASNs `AS64496–AS64511` and `AS65536–AS65551` ([RFC 5398][rfc5398]).
> Correction to the brief: AS64496–64511 is the **documentation** range. The *private* range is AS64512–65534 ([RFC 6996][rfc6996]). Use only the documentation ranges on screen.
>
> **Deviation to flag:** the home gateway would realistically be `192.168.x.x` (RFC 1918 private space). The props below use `192.0.2.1` to satisfy the doc-range rule.

**12.1 DNS answer (dig-style)**
```
$ dig example.com A
;; QUESTION SECTION:
;example.com.            IN  A
;; ANSWER SECTION:
example.com.     300  IN  A     203.0.113.10
;; Query time: 12 msec
;; SERVER: 198.51.100.53#53
```
AAAA variant: `example.com. 300 IN AAAA 2001:db8:10::a`

**12.2 DNS delegation chain (cold lookup, one line per stop)**
```
.            → "ask .com"          a.root-servers.net   (referral, TTL 172800)
com.         → "ask example.com"   a.gtld-servers.net   (referral, TTL 172800)
example.com. → 203.0.113.10        ns1.example.net      (answer,   TTL 300)
```
Root and gtld hostnames are real public infrastructure (not addresses); swap for `root` / `tld` labels if you prefer.

**12.3 Handshake timeline (RTT ≈ 8 ms)**
```
t+0 ms   SYN        →
t+8 ms   SYN-ACK    ←
t+8 ms   ACK + TLS ClientHello →
t+17 ms  ServerHello, cert, Finished ←
t+17 ms  Finished + GET / →
t+26 ms  HTTP/2 200 (first byte) ←
```
(Matches the [MEASURED] 26–28 ms warm TTFB.)

**12.4 Packet header card (IPv4 + TCP)**
```
IPv4  ver=4 ihl=5 len=1500 ttl=64 proto=6(TCP)
      src=192.0.2.23      dst=203.0.113.10
TCP   sport=51514 dport=443  flags=ACK,PSH
      seq=2921 (rel)  ack=518  win=502  len=1460
```
Ephemeral source port range 49152–65535 per [RFC 6335][rfc6335]. IPv6 variant: `src=2001:db8:1::23 dst=2001:db8:10::a hlim=64 next=6`.

**12.5 Response split into 13 packets (18 KB HTML, the median)**
```
#01/13 seq=1      len=1460
#02/13 seq=1461   len=1460
#03/13 seq=2921   len=1460
 …
#12/13 seq=16061  len=1460
#13/13 seq=17521  len=911     (total 18,431 B)
```
Relative seq = 1 + 1460 × (n−1).

**12.6 TTL countdown across 10 routers**
`64 → 63 → 62 → 61 → 60 → 59 → 58 → 57 → 56 → 55 → 54` (arrives with 54). For a drop gag: a looping packet goes `3 → 2 → 1 → 0 ✕  ICMP Time Exceeded`.

**12.7 Plausible traceroute (11 hops; shape modelled on our measured traces)**
```
traceroute to example.com (203.0.113.10), 30 hops max
 1  gw.home.example            192.0.2.1        2.9 ms
 2  bras1.isp.example          198.51.100.1     4.8 ms   AS64496
 3  agg2.syd.isp.example       198.51.100.45    5.3 ms   AS64496
 4  core1.syd.isp.example      198.51.100.77    6.1 ms   AS64496
 5  ix-syd.peer.example        203.0.113.129    6.4 ms   (IXP LAN)
 6  xe-0-1.transit.example     198.51.100.140   6.9 ms   AS64500
 7  ae3.transit.example        198.51.100.3   141.2 ms   AS64500  ← ocean crossing
 8  ae7.lax.transit.example    198.51.100.5   142.0 ms   AS64500
 9  cr2.lax.cdn.example        203.0.113.1    143.1 ms   AS64511
10  edge-lb.cdn.example        203.0.113.9    143.4 ms   AS64511
11  example.com                203.0.113.10   143.6 ms   AS64511
```
Near-CDN variant (6 hops, as measured): hops 1–5 as above, then `6  example.com  203.0.113.10  7.7 ms  AS64511`.

**12.8 BGP / routing-table snippet (longest-prefix match)**
```
Destination 203.0.113.10
  203.0.0.0/16     via 198.51.100.140  AS-path 64500 64502
  203.0.113.0/24   via 203.0.113.129   AS-path 64511        ← longest match wins
  0.0.0.0/0        via 198.51.100.1    (default)
```

**12.9 Timestamp HUD values**
`DNS 12 ms · TCP 7 ms · TLS 17 ms · first byte 26 ms` (cumulative, [MEASURED] shape). Compare with `blink ≈ 100–400 ms`.

**12.10 Scale numbers for background text**
`~1,079,000 routes` · `79,509 networks (ASes)` ([CIDR Report][cidr]) · `2,045 root instances` ([root-servers.org][roots]) · `348 cities` ([Cloudflare][cfnet]).

## 13. Narration-ready facts (≤ 15 words each)

1. First, your browser asks DNS: what's the address for example.com? *(§2)*
2. DNS asks the root, then .com, then the site's own nameserver. *(§2)*
3. Answers are cached, so repeat lookups take just a few milliseconds. *(§2, [MEASURED])*
4. Data travels in packets of about fifteen hundred bytes. *([RFC 894][rfc894])*
5. A typical page's HTML alone fills about thirteen packets. *([Almanac][almanacpw] + arithmetic)*
6. Every packet carries a from-address, a to-address, and a hop counter. *([RFC 791][rfc791])*
7. Each router reads the address and passes the packet one step closer. *([RFC 1812][rfc1812])*
8. Every hop, the counter drops by one; at zero, the packet is dropped. *([RFC 1812][rfc1812])*
9. Routers pick from about a million routes, choosing the most specific match. *([CIDR Report][cidr])*
10. Nearly eighty thousand separate networks agree on routes using BGP. *([CIDR Report][cidr], [RFC 4271][rfc4271])*
11. A typical path crosses about fifteen routers. *([CAIDA Ark][arkhnl])*
12. Often the "server" is a copy sitting in a data centre near you. *([Cloudflare][cfnet])*
13. No route is reserved: every router decides again for every packet. *(§5.4)*
14. Lost packets are resent; sequence numbers put everything back in order. *([RFC 9293][rfc9293], [RFC 5681][rfc5681])*
15. The first reply arrives in tens of milliseconds, faster than a blink. *([MEASURED], [blink])*

### Delivery notes for these lines ("smooth but upbeat" VO)
Hand-off hints only; the format/voice research owns final guidance.
- Budget: 45 s at a conversational ~150–160 wpm gives about **110–120 words** of VO [UNVERIFIED rate guideline]. That's roughly 8–10 of the lines above plus a hook and a sign-off, with breathing room for SFX beats.
- Write numbers as words ("fifteen hundred", "eighty thousand") so the TTS reads them the same way every time. Say "D-N-S" and "B-G-P" as letters; spell them with hyphens or spaces if the voice mispronounces them [UNVERIFIED TTS behaviour].
- Use commas and colons for small lift-and-land pauses. End on punctuation that closes the line ("…faster than a blink.") rather than exclamation marks, which keeps the delivery bright without hype [UNVERIFIED TTS behaviour].

---

## Sources

[rfc791]: https://www.rfc-editor.org/rfc/rfc791
[rfc792]: https://www.rfc-editor.org/rfc/rfc792
[rfc894]: https://www.rfc-editor.org/rfc/rfc894
[rfc1034]: https://www.rfc-editor.org/rfc/rfc1034
[rfc1035]: https://www.rfc-editor.org/rfc/rfc1035
[rfc1812]: https://www.rfc-editor.org/rfc/rfc1812
[rfc2018]: https://www.rfc-editor.org/rfc/rfc2018
[rfc2606]: https://www.rfc-editor.org/rfc/rfc2606
[rfc2992]: https://www.rfc-editor.org/rfc/rfc2992
[rfc3849]: https://www.rfc-editor.org/rfc/rfc3849
[rfc4271]: https://www.rfc-editor.org/rfc/rfc4271
[rfc4786]: https://www.rfc-editor.org/rfc/rfc4786
[rfc5398]: https://www.rfc-editor.org/rfc/rfc5398
[rfc5681]: https://www.rfc-editor.org/rfc/rfc5681
[rfc5737]: https://www.rfc-editor.org/rfc/rfc5737
[rfc6298]: https://www.rfc-editor.org/rfc/rfc6298
[rfc6335]: https://www.rfc-editor.org/rfc/rfc6335
[rfc6438]: https://www.rfc-editor.org/rfc/rfc6438
[rfc6528]: https://www.rfc-editor.org/rfc/rfc6528
[rfc6797]: https://www.rfc-editor.org/rfc/rfc6797
[rfc6928]: https://www.rfc-editor.org/rfc/rfc6928
[rfc6996]: https://www.rfc-editor.org/rfc/rfc6996
[rfc8200]: https://www.rfc-editor.org/rfc/rfc8200
[rfc8446]: https://www.rfc-editor.org/rfc/rfc8446#section-2
[rfc8985]: https://www.rfc-editor.org/rfc/rfc8985
[rfc9000]: https://www.rfc-editor.org/rfc/rfc9000
[rfc9001]: https://www.rfc-editor.org/rfc/rfc9001
[rfc9002]: https://www.rfc-editor.org/rfc/rfc9002
[rfc9110]: https://www.rfc-editor.org/rfc/rfc9110
[rfc9111]: https://www.rfc-editor.org/rfc/rfc9111
[rfc9114]: https://www.rfc-editor.org/rfc/rfc9114
[rfc9293]: https://www.rfc-editor.org/rfc/rfc9293
[rfc9499]: https://www.rfc-editor.org/rfc/rfc9499
[hsts]: https://hstspreload.org/
[roots]: https://root-servers.org/
[cidr]: https://www.cidr-report.org/as2.0/
[cfnet]: https://www.cloudflare.com/network/
[cfany]: https://www.cloudflare.com/learning/cdn/glossary/anycast-network/
[cfpq]: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-to-origin/
[jung]: https://web.mit.edu/6.033/2012/wwwdocs/papers/dns-ton2002.pdf
[mozdoh]: https://blog.nightly.mozilla.org/2018/08/28/firefox-nightly-secure-dns-experimental-results/
[anycastpam]: https://www.isi.edu/~johnh/PAPERS/Schmidt17a.pdf
[akamai15]: https://dl.acm.org/doi/10.1145/2785956.2787500
[lb07]: http://conferences.sigcomm.org/imc/2007/papers/imc63.pdf
[lb20]: https://homepages.dcc.ufmg.br/~cunha/papers/almeida20infocom-mca.pdf
[ripe69]: https://ripe69.ripe.net/wp-content/uploads/presentations/14-UT_DACS_RIPE_HATI_20141031.pdf
[ixp]: https://labs.ripe.net/author/ignacio_castro/shaping-the-internet-history-and-impact-of-ixp-growth/
[arkams]: https://www.caida.org/projects/ark/statistics/monitor/ams-nl/resp_path_length_ccdf.html
[arksan]: https://www.caida.org/projects/ark/statistics/monitor/san-us/resp_path_length_ccdf.html
[arkhnl]: https://www.caida.org/projects/ark/statistics/monitor/hnl-us/resp_path_length_ccdf.html
[fei98]: https://www.cs.ucla.edu/~lixia/papers/98Globcom.pdf
[nanogtr]: https://archive.nanog.org/meetings/nanog47/presentations/Sunday/RAS_Traceroute_N47_Sun.pdf
[hpbnlat]: https://hpbn.co/primer-on-latency-and-bandwidth/
[hpbntcp]: https://hpbn.co/building-blocks-of-tcp/
[linuxttl]: https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt
[quic17]: https://dl.acm.org/doi/10.1145/3098822.3098842
[almanacpw]: https://almanac.httparchive.org/en/2024/page-weight
[almanacperf]: https://almanac.httparchive.org/en/2025/performance
[webttfb]: https://web.dev/articles/ttfb
[mdnhow]: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work
[blink]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12638546

Reference links (rendered above as inline links): RFCs 791, 792, 894, 1034, 1035, 1812, 2018, 2606, 2992, 3849, 4271, 4786, 5398, 5681, 5737, 6298, 6335, 6438, 6528, 6797, 6928, 6996, 8200, 8446, 8985, 9000, 9001, 9002, 9110, 9111, 9114, 9293, 9499. Measurement and operator sources: root-servers.org; CIDR Report; Cloudflare network, anycast and PQC docs; Jung et al. 2002; Mozilla DoH 2018; Schmidt et al. PAM 2017; Chen et al. SIGCOMM 2015; Augustin et al. IMC 2007; Almeida et al. INFOCOM 2020; de Vries & Santanna RIPE 69; Castro et al. RIPE Labs; CAIDA Ark monitor stats; Fei et al. 1998; Steenbergen NANOG 47; Grigorik, *High Performance Browser Networking*; Linux ip-sysctl; Langley et al. SIGCOMM 2017; HTTP Archive Web Almanac 2024/2025; web.dev; MDN; PMC blink study.

[MEASURED] commands (2026‑09‑29, eastern Australia, residential): `dig @a.root-servers.net com NS`, `dig example.com A`, `dig @{a.gtld-servers.net,hera.ns.cloudflare.com,1.1.1.1,8.8.8.8} example.com A`, `curl -w '%{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer}' https://example.com/` (×3), `curl -sI https://example.com/`, `mtr -4 -r -n example.com`, `mtr -4 -r -n www.iana.org`, `mtr -4 -r -n ftp.fau.de`.
