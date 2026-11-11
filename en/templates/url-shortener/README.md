# URL Shortener · Architecture Template

> **Representative products**: Bitly, TinyURL, t.co (Twitter), all kinds of QR-code / share short links
> **One-line definition**: map a long URL onto an extremely short key, and when someone clicks the short link, redirect them back to the original address as fast as humanly possible.

---

## 1. One-line definition

A URL shortener = **one gigantic "short code → long URL" lookup table** + **a redirect fast path optimized to the bone**.

It looks simple enough to be a one-line hash map, but that is exactly what makes it a **textbook case of "read-heavy, extreme availability, globally unique IDs."** The truth: 99.9% of all traffic is the single action "take a short code, look up the long URL, then 302 away" — and this path has to be **fast down to tens of milliseconds, and almost impossible to take down** (once a link is printed on a poster, a QR code, or an SMS, an outage is a large-scale incident).

## 2. The business essence: what problem is it solving

Long URLs are long and ugly: SMS has character limits, the longer a QR code is the denser and harder to scan it gets, and social shares need to look clean and clickable. A short link solves "**compress an arbitrarily long address into a clean, distributable, trackable entry point**."

The real value that comes along for the ride is **click analytics**: who clicked this link, when, where, and on what device.

Where the money comes from: enterprise-tier click analytics and marketing reports, custom branded domains, bulk-generation APIs, A/B campaign tracking. **The short link itself makes almost no money; what makes money is the layer of "measurable distribution" behind it.**

## 3. Core requirements and constraints

**Functional requirements:**
- [ ] Long URL → generate short code
- [ ] Short code → redirect back to the long URL (the core of the core)
- [ ] Custom aliases (`/spring-sale`), expiration times
- [ ] Click statistics (count, source, geography, device)

**Non-functional requirements / quality attributes (this is where the real architectural battle is):**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Redirect latency** | < 50ms | A click should jump instantly; any lag feels like "this link is broken" |
| **Availability** | 99.99%+ | The link is already sent out and printed; if the service is down, nobody's clicks work |
| **Read/write ratio** | Often 100:1, even 1000:1 | Created once, clicked tens of millions of times. The read/write shape is severely lopsided |
| **Short-code length** | As short as possible | Shorter is more usable, but shorter means less available space — it's a trade-off |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Links are immutable**: once a short code is generated and distributed, it's printed on materials and can never be changed.
- 🔴 **The short-code space is finite**: available codes = charset size ^ length. 6-character Base62 ≈ 56.8 billion — looks like a lot, but a popular service approaches that in a few years.
- 🔴 **Reads and writes are extremely asymmetric**: the architecture must be designed around "reads"; "writes" can be slow.

## 4. The big picture

```
   Create short link (low volume)           Click short link (massive, 99.9% of traffic)
        │                                  │
        ▼                                  ▼
┌────────────────┐                      ┌───────────────────────────────┐
│  Write service │                      │  Read service / redirect      │
│ • Validate URL │                      │  (fast path)                  │
│ • Request ID   │◀── ID gen ──┐        │  ┌─────────────────────────┐  │
│ • ID → Base62  │  (seg/snow) │        │  │ 1. Check cache (hit→ret)│  │
│ • Persist      │            │         │  └────────────┬────────────┘  │
└───────┬────────┘            │         │               │ miss          │
        │                     │         │               ▼               │
        ▼                     │         │  ┌─────────────────────────┐  │
┌────────────────┐          │           │  │ 2. Query store, backfill│  │
│ Main store(map)│◀───────────┘         │  └────────────┬────────────┘  │
│ short_key→long │──────────────────────│   on miss: query store        │
└────────────────┘                      │  3. Return 301/302 redirect   │
                                        └────────────────┬──────────────┘
                                                         │ async report
                                                         ▼
                                          ┌──────────────────────────┐
                                          │ Click event queue →      │
                                          │ analytics store          │ (never slows the redirect)
                                          └──────────────────────────┘
```

> The soul of the system is that **redirect fast path** in the middle: it absorbs all the read traffic, so the "cache hit rate" is practically this system's destiny. Everything else exists to serve it.

## 5. Component responsibilities

- **Write service**: validate the target URL, request a globally unique ID, encode the ID into a short code, persist it. *Why it's needed*: creation is infrequent but must guarantee that short codes never collide globally.
- **ID generator**: produces globally unique, non-colliding IDs. *Why it's needed*: it's the foundation of short-code uniqueness; the moment it becomes a single point or a bottleneck, all writes seize up (see Decision 1).
- **Read service / redirect**: check cache → query store → return the redirect. *Why it's needed*: this is 99.9% of the system's work, so it must be independent, dead simple, and horizontally scalable en masse.
- **KV cache**: keep the mappings for hot short codes in an in-memory-grade cache. *Why it's needed*: hot links run extremely hot (a single viral link might account for half the site's clicks), so the cache hit rate directly decides latency and cost.
- **Main store (mapping table)**: the persisted source of truth for `short_key → long_url`.
- **Click event pipeline (async)**: drop every click into a queue as an event, and aggregate it slowly in the background. *Why it's needed*: statistics must never sit in front of the critical redirect path (see Decision 3).

## 6. Key data flows

**Scenario 1: create a short link (low-frequency write)**
```
1. User submits a long URL ──▶ write service: validate / blocklist check
2. ──▶ ID generator: get a globally unique ID (e.g. 10000001)
3. Write service: Base62-encode the ID → "aUKYr"; persist {aUKYr → https://...}
4. Return https://sho.rt/aUKYr
```

**Scenario 2: click a short link and redirect (massive reads, the system's lifeline)**
```
1. User clicks https://sho.rt/aUKYr ──▶ read service
2. Check KV cache:
      hit ──▶ get the long URL directly (99% goes here)
      miss ──▶ query main store, then backfill the cache
3. Return HTTP 302 + Location: original long URL  ── browser jumps automatically
4. (side path) drop this click into the queue as an async event; the main flow ends immediately ◀── doesn't wait for the stat write
```
> Notice step 4: **statistics are a "side path," not the "main path."** The redirect already finished at step 3. This is the textbook move of "peeling the non-critical path off the critical path."

## 7. Data model and storage choices

The core entities are dead simple: `mapping(short_key, long_url, creator, expiration)`; `click event(short_key, time, source, geography, device)`.

| Data | Storage type | Why |
|---|---|---|
| Short-code → long-URL mapping | KV / relational (sharded by short_key) | Exact primary-key lookup, huge volume, no complex joins |
| Hot mappings | In-memory-grade KV cache | The lifeline of the read path; hit rate decides everything |
| Click events | Time-series / columnar | Massive appends, aggregated by time and dimension for reports |

> Teaching point: this is a **primary-key point-lookup** scenario (always "take one key, fetch one value") — no `JOIN`, no range scans — so a KV-shaped store is the natural fit. Relational works too, but you'd use it as a KV store.

## 8. Key architectural decisions and trade-offs ⭐

**Decision 1: how should short codes be generated?**
- Auto-increment ID → Base62: short, no collisions, guaranteed unique. But the **short codes are sequential and enumerable** (anyone can crawl your entire site's links in order, or even estimate your business volume).
- Random generation: non-enumerable, secure. But you have to **dedupe** (possible collisions), and as the space fills up the collision rate climbs.
- Hash the long URL, take the first few characters: identical URLs map to identical codes (natural dedupe), but you have to handle **hash collisions**.
- **The lean**: most go with "auto-increment ID, shuffle/salt it, then Base62" — getting uniqueness while avoiding plainly sequential, enumerable codes. The cost is that the ID generator must be reliable.

**Decision 2: 301 or 302 for the redirect? (a classic trade-off) ⭐**
- **301 permanent redirect**: browsers and CDNs will **cache** it, so subsequent clicks never even reach your server — blazing fast, dirt cheap. But **you stop receiving click statistics from then on** (the request is intercepted by the cache). And if you ever want to repoint a short code, it's stuck.
- **302 temporary redirect**: every click comes back to your server, so **click statistics are complete** and the target stays flexible to change. But your server has to absorb all the traffic.
- **The lean**: **if you want analytics, use 302** (that's where the business model lives), at the cost of carrying all the traffic yourself and leaning on caching to optimize. This pair of trade-offs perfectly captures the eternal tension of "**cacheability vs observability**."

**Decision 3: synchronous or asynchronous click statistics?**
- Synchronous: write the stat to the store inline during the redirect. Simple, but it **stuffs a slow write operation into the path that most needs to be fast**; the moment the stats store jitters, the redirect slows down.
- Asynchronous: a click just tosses an event onto a queue, and the main flow returns the redirect immediately.
- **The lean**: must be asynchronous. **The redirect is the critical path, statistics are the side path, and the two must never be welded together.**

## 9. Scaling and bottlenecks

- **First bottleneck: read traffic floods you.** → Fix: multi-level caching (local + distributed KV), push hot short links to the CDN / edge nodes to redirect directly, and scale the stateless read service horizontally.
- **Second bottleneck: the central ID generator becomes a single point for writes.** → Fix: the segment pattern (wholesale a batch of IDs at a time to each node for local use) or the snowflake algorithm (each node generates non-colliding IDs on its own). See the ID-generation approach in the [E-commerce Platform template](../ecommerce-platform/README.md).
- **Third bottleneck: a flood of click events** (a viral link gets frantically reshared). → Fix: a message queue to absorb the peak (see [04 · Message queues / async](../../tutorial/04-十大核心架构模式.md)), with background batch aggregation.
- **Fourth bottleneck: the mapping table grows too large.** → Fix: hash-shard by short_key. Because it's pure point lookups, sharding is extremely clean (no cross-shard queries).

## 10. Security and compliance highlights

- 🔴 **An open redirect is a phishing tool by nature**: a short link hides its real target, and attackers love using it to lure people to malicious sites. Architecturally you must **validate / scan target URLs, maintain a blocklist of malicious domains, and put a risk-warning interstitial in front of suspicious links**.
- **Enumeration crawling**: sequential short codes get scraped in order by crawlers, leaking all your links and your business volume. → Salt-and-shuffle or randomize short codes.
- **Abuse / fake clicks**: someone inflates clicks to fake data → rate limiting, deduplication, fraud control.
- **Privacy**: click data contains IP / geography / device, which is personal information and must be handled compliantly and anonymized.

## 11. Common pitfalls / anti-patterns

- ❌ **Writing click statistics synchronously, slowing the redirect** → ✅ Stats go through an async queue; the redirect is a sacred fast path.
- ❌ **Using plain sequential auto-increment as short codes** → ✅ Salt and shuffle, to avoid being enumerable and guessable.
- ❌ **No caching, hitting the main store on every click** → ✅ Multi-level caching; the hit rate is the lifeblood.
- ❌ **Reaching for 301 to save effort, then losing all your analytics** → ✅ Decide whether you need statistics first, then choose 301/302.
- ❌ **Not validating the target URL, becoming an accomplice to phishing** → ✅ Blocklist + scanning + risk interstitial.
- ❌ **Over-engineering it as if it were a complex system** → ✅ Its only hard part is "speed and stability of the read path"; everything else should stay dead simple.

## 12. Evolution path: MVP → Growth → Maturity

| Stage | Scale | What the architecture looks like | What to worry about now |
|---|---|---|---|
| **MVP** | < 100K clicks/day | Monolith + one database + auto-increment ID to Base62; synchronous stats are fine | Just get "generate + redirect" working; don't overthink it |
| **Growth** | Millions to tens of millions | Split read and write services; add a KV cache; make click stats async; switch the ID generator to the segment pattern | Find read-path bottlenecks and drive the cache hit rate up |
| **Maturity** | Hundreds of millions + global | Multi-region active-active, edge / CDN redirects, sharded mapping table, a dedicated real-time analytics pipeline | Global latency, disaster recovery, abuse prevention, the analytics system |

## 13. Reusable takeaways

- 💡 **For a read-heavy system, optimize the read path to the extreme and fully decouple it from the write path.** This is the starting point of caching, read/write splitting, and CQRS — all of it.
- 💡 **301 vs 302 is a miniature model of "cacheability vs observability."** Almost any design that "lets an intermediate layer cache for you" has to trade away "can I still see this visit happen."
- 💡 **A globally unique ID is a basic skill of distributed systems**: central allocation, segments, snowflake — each with its own trade-offs, and worth mastering thoroughly.
- 💡 **Peeling the non-critical path (statistics) off the critical path (the redirect)** is a general technique for cutting latency and raising stability.

## 🎯 Quick quiz

<Quiz
  question="Where should the architectural center of gravity of a URL shortener be placed?"
  :options="['The write (code generation) path', 'The read (redirect) path + cache', 'Treat both equally']"
  :answer="1"
  explanation="A short link is 'created once, clicked countless times,' with a read/write ratio often reaching 100:1+; the redirect fast path has to absorb all the read traffic, and the cache hit rate is practically the system's destiny."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** (short-link service + distributed ID generation).

**🔧 Open-source prototypes (read the code directly):**
- [YOURLS/YOURLS](https://github.com/YOURLS/YOURLS) — the classic self-hosted short-link tool: code generation / custom keywords / click statistics / redirect.
- [shlinkio/shlink](https://github.com/shlinkio/shlink) — a self-hosted short-link service: a read-heavy redirect + a REST API + multi-domain short links.
- [thedevs-network/kutt](https://github.com/thedevs-network/kutt) — a modern short-link tool (Node.js): link management / statistics / custom domains.
- [twitter-archive/snowflake](https://github.com/twitter-archive/snowflake) — distributed time-ordered unique ID generation (timestamp + machine ID + sequence number), the classic approach to short-code ID allocation.

---

> 📌 Remember a URL shortener in one line: **it's not "a one-line hash map," it's "a redirect fast path that has to absorb clicks from the entire world and can never go down" — and every design choice answers the question of "how do I make looking up a key fast, stable, and cheap, all at once."**
