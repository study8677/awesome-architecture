# Ride-Hailing / Dispatch · Architecture Template

> **Representative products**: Uber, DiDi, Lyft, Grab
> **One-line definition**: track the real-time location of a vast fleet of drivers and riders, match the best car to the best person within seconds, and follow the trip end to end.

---

## 1. One-line definition

A ride-hailing system = **a constantly shifting "live map"** + **a "real-time matching engine" that pairs supply and demand within seconds.**

What sets it most apart from ordinary systems: **the core data is "location," and location changes every few seconds and goes stale a few seconds later.** The entire architecture answers two questions: "**who's near me right now?**" and "**how do I pair this person with that car as fast as possible?**" — and that takes a geospatial index, a massive real-time location stream, and a matching engine working in concert.

## 2. The business essence: what problem is it solving

It's a **two-sided market**: on one side, drivers with idle capacity; on the other, riders with travel demand. The system solves "**efficiently matching idle cars and waiting people across space and time**," and along the way handles trust (ratings), pricing, and safety.

Where the money comes from: a commission per trip, dynamic surge pricing, subscriptions / memberships, ads. The higher the matching efficiency (less deadheading, shorter waits), the better the experience on both sides and the better the platform's revenue.

## 3. Core requirements and constraints

**Functional requirements:**
- [ ] Real-time location of drivers / riders, reported continuously
- [ ] Hail a ride → match and dispatch the nearest car
- [ ] Route planning and estimated time of arrival (ETA)
- [ ] Dynamic pricing (peak-hour surge)
- [ ] Trip tracking, payment, ratings

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Match latency** | Seconds | Wait too long and the rider cancels, the driver moves on |
| **Location write throughput** | Extremely high | Every driver reports every few seconds = a massive write load |
| **Geo-query speed** | Milliseconds | "Nearby cars" has to be computed fast |
| **Peak scalability** | Elastic | Rush hours, rainy days, event lets-out — traffic swings violently |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Location data is high-frequency, massive, and ephemeral**: the write volume is huge, but each entry lives only a few seconds, and the old ones are worthless.
- 🔴 **A geo-query is a "special query"**: "cars within a 3 km radius" is neither a primary-key point lookup nor a range scan — it's a **2D spatial query**, which an ordinary index can't do.
- 🔴 **Strong regionality**: Beijing's supply and demand have nothing to do with New York's — this is a **natural sharding dimension.**
- 🔴 **Supply and demand swing violently in real time**: a concert letting out, a downpour — demand explodes in an instant.

## 4. The big picture

```
   Driver app             Rider app
   (reports location       (hails a ride)
    every few sec)
       │                      │
       ▼                      ▼
┌────────────────┐    ┌──────────────────┐
│ Location       │    │ Ride request     │
│ ingest service │    └─────────┬────────┘
│ (ultra-high-   │              ▼
│  freq writes,  │    ┌───────────────────────────────┐
│  mostly in mem)│    │ Matching engine               │
└──────┬─────────┘    │ ① geo-index "nearby cars"     │
       ▼              │ ② pick best by dist/ETA/rating│
┌────────────────┐    │ ③ dispatch, wait for accept   │
│ Geospatial     │◀───│                               │
│ index          │    └───────────────┬───────────────┘
│ GeoHash/grid   │                    ▼
│ (sharded by    │    ┌────────────────────────────────────────┐
│  region)       │    │ Trip service (state machine) → pricing │
└────────────────┘    │ → payment → ratings                    │
                      │ end-to-end location tracking, ETA      │
                      │ updates, push                          │
                      └────────────────────────────────────────┘
                     (trajectory written async to a time-series store, for replay/analysis)
```

> The soul of the system is the **geospatial index + the matching engine**: the former turns "find nearby" from "impossible" into "milliseconds," and the latter does the matchmaking on this live map. Everything else supports this match and the trip that follows.

## 5. Component responsibilities

- **Location ingest service**: take the ultra-high-frequency location reports from drivers / riders. *Why it's needed*: the write volume is enormous, and most locations only need to sit in memory, with no per-entry persistence (see Decision 2).
- **Geospatial index**: encode the 2D latitude/longitude into a quickly searchable structure (GeoHash / grid / quadtree), supporting "nearby cars" queries. *Why it's needed*: this is the core capability that sets ride-hailing apart from every ordinary system.
- **Matching engine**: query nearby candidates → pick by distance / ETA / rating → dispatch. *Why it's needed*: matchmaking is the core act by which the platform creates value.
- **Trip service (state machine)**: manage a trip's states from "dispatched → driver en route → in trip → completed." *Why it's needed*: a trip has a strict state flow, and it touches billing.
- **Dynamic pricing**: adjust prices by the real-time supply/demand ratio. *Why it's needed*: at peaks, use the price lever to rebalance supply and demand and shave the peak (see Decision 4).
- **Push / long-lived connections**: push dispatches, locations, and ETAs to both sides in real time. *Why it's needed*: ride-hailing is a heavily real-time interaction.

## 6. Key data flows

**Scenario 1: a driver continuously reports location (ultra-high-frequency writes)**
```
1. The driver app reports {driverID, lat/lng} every 4 seconds ──▶ location ingest service
2. Update that driver's position in the geospatial index (mostly in memory)
3. (side path) sample the trajectory and write it asynchronously to a time-series store, for replay, settlement, analysis
   ── note: not every location goes into the database, that would blow up writes and be pointless
```

**Scenario 2: a rider hails and gets matched (the system's core act)**
```
1. Rider hails {pickup lat/lng} ──▶ matching engine
2. Query "idle drivers near the pickup" via the geo-index ── get candidates in milliseconds
3. Sort by real road ETA, driver rating, whether it's on the way; pick the best
4. Dispatch to that driver ──▶ push, wait for accept (on timeout, offer the next one)
5. After accept ──▶ trip service creates the order, enters "driver en route," both sides see the location live
```

## 7. Data model and storage choices

The core entities: `driver location (high-frequency updates, ephemeral)`; `trip (state machine)`; `user / driver profile`; `trajectory (time-series)`.

| Data | Storage type | Why |
|---|---|---|
| Real-time driver location | In-memory geo-index | Ultra-high-frequency updates, queries must be fast, old data can be dropped |
| Trip orders | Relational | State flow + billing, needs transactions and strong consistency |
| Historical trajectories | Time-series / object storage | Massive appends, replay by time, used for analysis and settlement |
| User / driver profiles | Relational | Structured, must be consistent |

> Teaching point: **driver location is the textbook "ephemeral high-frequency data"** — its value is only "right now," overwritten by a new value seconds later. Persisting it entry-by-entry with strong consistency is squandering precious write capacity on data that doesn't need persisting.

## 8. Key architectural decisions and trade-offs ⭐

**Decision 1: how do you query "nearby cars"? (the very foundation of ride-hailing) ⭐**
- A database `WHERE` computing distance: compute the distance from every car to the pickup, then filter — a full-table scan, which collapses once there are many cars.
- A spatial index (GeoHash / grid): encode the 2D position into an indexable structure, so "nearby" becomes "look up a few adjacent cells."
- **The lean**: a spatial index, always. **It turns the special query of "2D proximity" into an ordinary, indexable lookup.**

**Decision 2: location data — persist every entry, or mostly keep it in memory? ⭐**
- Persist every entry: one entry per driver every few seconds, a massive write load that crushes the database directly — and this data is stale seconds later anyway.
- Mostly in memory (the geo-index) + sampled trajectory persistence: real-time positions update in memory, and only sampled trajectories are saved.
- **The lean**: keep real-time positions in memory, write sampled trajectories asynchronously. **Don't pay the cost of persistence for "ephemeral data that doesn't need persisting."**

**Decision 3: nearest-match, or batch global optimum?**
- Nearest greedy: when an order arrives, immediately dispatch the closest car — simple, fast.
- Batch matching: collect a small batch of requests and cars and compute a global optimum together (reducing total deadheading).
- **The lean**: start with nearest; at scale, introduce batch matching to lift overall efficiency, at the cost of each match waiting a second or two longer.

**Decision 4: how do you handle the peak? — use pricing as an "economic rate limiter"**
- Brute-force it: supply fixed, demand surging, lots of people can't get a car, experience collapses.
- Dynamic surge: raising the price **suppresses some demand and draws more drivers online**, automatically rebalancing supply and demand.
- **The lean**: dynamic pricing is essentially **traffic regulation via an economic lever** — an advanced form of rate limiting / peak shaving. The cost is a worse felt experience for users, so it needs careful design and compliance.

**Decision 5: shard by region.**
- Strong regionality makes sharding incredibly natural: each city / region is a nearly independent system with no cross-region interaction. **This is the model case of "cutting along the business's natural boundary"** — horizontal scaling is extremely clean.

## 9. Scaling and bottlenecks

- **First bottleneck: the location write flood.** → Fix: an in-memory geo-index + sharding by region; the write pressure is naturally scattered by geography.
- **Second bottleneck: local supply/demand explosion** (an airport / a concert letting out). → Fix: regional isolation keeps it from affecting elsewhere + queuing + dynamic pricing to shave the peak.
- **Third bottleneck: a massive number of long-lived connections** (one per online user). → Fix: scale the connection ingest layer horizontally, with region-local ingest. See the [Realtime Chat template](../realtime-chat/README.md).
- **Cross-region is nearly independent**: geo-sharding makes global expansion close to "replicate a copy into a new region," which is its sweetest spot.

## 10. Security and compliance highlights

- 🔴 **Location privacy**: real-time location is extremely sensitive data — strict authorization, minimized retention, encrypted in transit; reduce precision after a trip ends.
- **Personal safety**: trip audio recording, a one-tap emergency button, traceable trajectories, emergency contacts — these are baseline requirements for this kind of product, not add-ons.
- **Fraud**: order brushing, fake GPS (location spoofing), driver-rider collusion to defraud subsidies — needs trajectory-consistency checks and fraud control.
- **Payment security**: see the [Payment System template](../payment-system/README.md).

## 11. Common pitfalls / anti-patterns

- ❌ **Doing a "nearby query" with a database `WHERE` computing distance** → ✅ A spatial index (GeoHash / grid).
- ❌ **Persisting every location entry with strong consistency** → ✅ Keep real-time location in memory, persist sampled trajectories asynchronously.
- ❌ **One big global pool for matching, ignoring region** → ✅ Shard by region, cut along the natural boundary.
- ❌ **At peaks, only thinking about brute-forcing with more machines** → ✅ Queuing + dynamic pricing, shave the peak with an economic lever.
- ❌ **Treating location as ordinary business data with strong consistency** → ✅ Recognize its nature: "ephemeral, high-frequency, alive for only a few seconds."

## 12. Evolution path: MVP → Growth → Maturity

| Stage | Scale | What the architecture looks like | What to worry about now |
|---|---|---|---|
| **MVP** | A single city | In-memory geo-index + nearest greedy matching + one trip database | Just get "hail - dispatch - complete" working |
| **Growth** | Multiple cities | Sharding by region, dynamic pricing, ETA optimization, a long-connection ingest layer | Matching efficiency, peak scaling, location writes |
| **Maturity** | Global, multi-region | Batch global matching, machine-learning ETA / pricing, carpooling, capacity-dispatch forecasting | Global efficiency, disaster recovery, safety and compliance, cost |

## 13. Reusable takeaways

- 💡 **A special query needs a dedicated index.** Geo-proximity uses a spatial index, just as full-text retrieval uses an inverted index — map the special problem onto a structure that can be indexed.
- 💡 **For ephemeral high-frequency data, you don't have to persist every entry.** First ask "how soon does this data become useless," then decide whether — and how — to store it.
- 💡 **Regulating traffic with an economic lever (pricing) is an advanced form of rate limiting / peak shaving.** Price can both suppress demand and pull in supply, smarter than plain queuing.
- 💡 **Sharding along the business's natural boundary (region) scales the cleanest.** When there's no cross-shard interaction, horizontal scaling is almost just "replicate a copy."

## 🎯 Quick quiz

<Quiz
  question="To query 'the cars near me' in ride-hailing, what's the right approach?"
  :options="['Use a database WHERE to compute distance for every car', 'Use a geospatial index (GeoHash / grid)', 'Full-table scan then sort']"
  :answer="1"
  explanation="Turn the special query of '2D proximity' into an indexable lookup — a special query needs a dedicated index, just as full-text retrieval needs an inverted index."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **engineering deep-dives**.

**🔧 Open-source prototypes (read the code directly):**
- [uber/h3](https://github.com/uber/h3) — Uber's open-source hexagonal hierarchical geospatial index (C core + bindings for many languages), the spatial-index foundation for ride-hailing pricing and dispatch.

**📖 Engineering blogs:**
- [H3: Uber's Hexagonal Hierarchical Spatial Index (Uber)](https://www.uber.com/us/en/blog/h3/) — why a hexagonal grid is used to optimize pricing and dispatch.
- [How Uber Scales Their Real-time Market Platform (High Scalability)](http://highscalability.com/blog/2015/9/14/how-uber-scales-their-real-time-market-platform.html) — the DISCO dispatch system: matching supply and demand by geo-partition, global allocation optimization.

---

> 📌 Remember ride-hailing in one line: **it's not "a ride-hailing app," it's "a live map changing every second + an engine that does sub-second supply-demand matchmaking on that map" — and every design choice answers "how do I know, fast and accurately, who's nearby, and pair the person with the car."**
