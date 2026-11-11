# IoT Device Platform — Architecture Template

> **Representative products / prototypes**: AWS IoT Core, Azure IoT Hub, Tuya Smart; open-source prototypes ThingsBoard, EMQX
> **One-line definition**: Let millions of unreliable, low-power, drop-off-anytime devices **connect securely, report their data, and receive commands** — and keep the business running whether the device is online or not.

---

## 1. One-Line Definition

An IoT platform = **a massive long-connection gateway + a device identity system + a "device shadow" mirror**.

It looks like [real-time chat](../realtime-chat/README.md) (both are massive long connections), but the party on the other end changes from "a person" to "a battery-powered device with flaky signal that may sleep for three hours at a stretch." The core difficulty shifts from "fast messages" to three things: **device identity must be trustworthy, offline is the norm not the exception, and one bad command can brick a batch of real hardware.**

## 2. Business Essence: What Problem Does It Solve?

Every hardware company hits the same wall: the devices have shipped — **how do you know they're still alive? How do you send them commands? How do you collect their data? How do you upgrade them?**

Building it yourself means handling millions of long connections, reconnection storms, device authentication, message dedup… that's an entire infrastructure team's job. An IoT platform turns this "dirty work of device connectivity" into a utility: **the device maker focuses on devices and business; connectivity, identity, shadows, and OTA distribution are all outsourced to the platform.** The business model bills by connections / message volume — essentially selling "device connectivity at scale."

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Device registration and authentication (one key per device)
- [ ] Massive-scale device connectivity and state management (online / offline / heartbeat)
- [ ] Telemetry upstream (collect → pipeline → store)
- [ ] Command downstream (and handling "the device is offline")
- [ ] Device shadow / digital twin (a cloud-side mirror of device state)
- [ ] Rule engine (data arrives → trigger forwarding / alerts / automation)
- [ ] OTA firmware batch distribution (staged rollout, progress, failure rate)

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Connection scale** | Millions to hundreds of millions of concurrent long connections | Always-powered devices hold their connections 24/7 while battery devices come online intermittently — the platform must serve both |
| **Upstream throughput** | Millions of telemetry points per second | Sensors report numbers tirelessly |
| **Command reachability** | Seconds when online, catch-up delivery when offline | If a "remote unlock / shutdown" cannot get through, the business grinds to a halt (safety interlocks must be handled locally on the device — see [embedded device firmware](../embedded-device/README.md)) |
| **Weak-network tolerance** | Drop-and-reconnect is the norm | 2G / NB-IoT / battery devices — the link is inherently unstable |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Device-side resources are tiny**: the protocol must be light (no heavyweight frameworks), and heavy logic can only live in the cloud.
- 🔴 **Devices "sleep" to save power — it's a hard requirement**: low-power devices are offline most of the time; the architecture must accept that "async is the norm."
- 🔴 **Device behavior is uncontrollable**: old firmware, broken clocks, and buggy devices that reconnect frantically will all show up; the platform must protect itself.
- 🔴 **One key per device is the bottom line**: a shared secret means cracking one device cracks them all.

## 4. Architecture Overview

```
 Millions of devices (sensors / gateways / appliances)
   │  MQTT long connection (lightweight, supports last-will messages)
   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Access layer: MQTT gateway cluster (state externalized, scales out) │
│  · TLS termination + device auth (per-device key/cert)              │
│  · Keep-alive, heartbeat, last will (drops are detectable)          │
│  · Topic ACL (a device can only pub/sub its own topics)             │
└──────────────────┬──────────────────────────────────────────────────┘
                   ▼
        ┌───────────────────────────┐
        │ Message bus (peak-smooth,  │
        │ decouple)                  │
        └──┬──────────┬─────────┬───┘
           ▼          ▼         ▼
   ┌────────────┐ ┌────────────┐ ┌──────────────────┐
   │ Rule engine │ │ Device     │ │ Telemetry pipeline│
   │ filter/fwd  │ │ shadow     │ │ clean → TSDB      │
   │ alert/auto  │ │ desired/   │ │ → cold archive    │
   │             │ │ reported   │ │                   │
   └─────┬──────┘ └─────┬──────┘ └────────┬─────────┘
         ▼              ▼                 ▼
  Business systems  App API           Dashboards /
  / alerts          (reads shadow)    analytics / alerts
     Plus: OTA service ──staged rollout──▶ devices (via access layer)
```

> The soul is this: **by default, applications do not talk to devices directly — state-class operations always go through the "shadow."** The app reads the shadow (millisecond-fast, always online) and writes the "desired state"; the device syncs itself up when it wakes. This one mirror decouples "the device works when it feels like it" from "the business needs stability."

## 5. Component Responsibilities

- **MQTT access gateway**: maintains massive long connections; auth, keep-alive, ACL. *Why it's needed*: connection management is the platform's most expensive asset. Note that a long-connection gateway is **inherently stateful** (connections, sessions, and subscription relationships all live on it) — externalize session and routing state to shared storage so the gateway instances themselves are replaceable; that is what makes horizontal scaling possible. Rolling upgrades must also kick off and drain connections in batches, or you are manufacturing your own reconnection storm.
- **Device identity / registry**: each device's certificate / key and lifecycle (activate / disable / deregister). *Why it's needed*: device identity is the root of all security; only "single-device revocation" lets you deal with a compromised device.
- **Message bus**: the buffer between access layer and business layer. *Why it's needed*: the flood of millions of devices reporting at once must never hit the database directly — enqueue first, the same peak-smoothing idea as the [notification system](../notification-system/README.md).
- **Device shadow (digital twin)**: the cloud keeps one JSON state per device: `reported` (what the device says) + `desired` (what the app wants). *Why it's needed*: see Decision 1 — it is the platform's single most important abstraction.
- **Rule engine**: declarative configuration for logic like "temperature > 80 → alert + close the valve." *Why it's needed*: lets business teams process device data without writing code; this is where the platform's versatility comes from.
- **Telemetry pipeline + time-series storage**: cleaning, downsampling, time-tiered storage. *Why it's needed*: telemetry is huge, queried by time, and almost never modified — a natural time-series workload.
- **OTA distribution service**: manages firmware versions, staged pushes, upgrade success stats, failure circuit-breaking. *Why it's needed*: for a million devices, one all-at-once push is one giant gamble; staged rollout is the only responsible posture (for the device side, see [embedded device firmware](../embedded-device/README.md)).

## 6. Key Data Flows

**Scenario 1: Telemetry upstream (the data trunk road)**
```
1. Device samples, batches, and publishes over MQTT to its own telemetry topic
2. Access gateway checks ACL → hands off to the message bus (returns immediately,
   never waits for the write)
3. Telemetry pipeline consumes: clean (drop bad points / fix timestamps) → write TSDB
4. Rule engine consumes in parallel: "temperature > 80" hits → trigger alert
   + send a close-valve command
   ── Fully async end to end: the bus absorbs the flood; any slow downstream
      never affects device reporting
```

**Scenario 2: Command downstream (the shadow handles "the device is asleep")**
```
1. User taps "set the AC to 26°C" in the app
2. App writes the shadow desired: {temp: 26} → returns "command issued" instantly
3a. Device online: platform pushes the shadow change, device executes,
    writes back reported: {temp: 26}
3b. Device asleep: nothing happens — next time it wakes, the device pulls
    the shadow, sees desired ≠ reported, syncs itself, writes back reported
4. The app compares desired with reported to know "did the command take effect"
   ── The app always faces "a shadow that answers in a second," never
      "a device that works when it feels like it"
```

**Scenario 3: OTA staged rollout (do not push a million devices off a cliff together)**
```
1. Upload new firmware → define the target fleet (model × current version)
2. First batch 1%: send upgrade notice → devices download in chunks
   → report upgrade results
3. Observation window: success rate ≥ 99.5% before the next batch; failure rate
   over threshold auto-breaks and pauses
4. 10% → 50% → 100%, each batch with its own window; offline devices catch up
   on the notice when they wake
```

## 7. Data Model & Storage Choices

Core entities: `device` (identity, model, firmware version); `shadow` (desired / reported); `telemetry data`; `rule`; `OTA job`.

| Data | Storage type | Why |
|---|---|---|
| Device registry / identity | Relational | Strong consistency, transactions (activation / revocation cannot be fuzzy) |
| Device shadow | Document / KV | One JSON per device, read/written by device ID, high-frequency small objects |
| Telemetry data | Time-series DB (hot) + object storage (cold) | Written and queried by time, huge, immutable; downsample and archive on expiry |
| Connection routing (which gateway a device is on) | In-memory KV | Downstream commands need a split-second "where is it" lookup; drops must clear in seconds |
| OTA firmware packages | Object storage + CDN | Large files, immutable, downloaded concurrently by a million devices |

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: Send commands to devices directly, or go through the device shadow? ⭐**
- Direct: shorter path, better real-time; but it fails when the device is offline, and the app must handle retries, timeouts, and unknown state itself.
- Via shadow: the app writes "desired," the device syncs itself when it wakes; the cost is an extra layer of abstraction and eventual consistency (uncertain time-to-effect).
- **Leaning**: **state-class operations go through the shadow by default**. In the IoT world "offline" is the norm; the shadow turns offline into "takes effect later" instead of "failed." But mind the boundary: **the shadow fits "target state" (the AC at 26°C), not "one-shot actions" (reboot, take one photo, open the door once)** — actions go through a command channel with a TTL: expired commands are dropped, never executed late. Modeling actions as desired state is the classic incident where a device wakes from a three-hour sleep and executes a stale command. And hard real-time control (industrial interlocks) should not depend on the cloud downlink at all.

**Decision 2: MQTT, or HTTP?**
- HTTP polling: simplest on the device; but staying reachable means polling nonstop — burns battery, burns data, and command latency is high.
- MQTT long connection: bidirectional, lightweight (the fixed header is as small as 2 bytes; the real per-message overhead is dominated by the topic name length — so design topics short), has last-will messages, natively pub/sub.
- **Leaning**: use MQTT (or a similarly light protocol) for the device channel. **"Detecting that a device dropped off" is a capability only a long connection can afford**; HTTP only fits ultra-low-frequency devices that "report once a day." But do not overestimate detection speed: **disconnect-detection latency ≈ 1.5 × the keepalive interval** — a shorter keepalive detects faster but burns more power. For low-power devices, "online status" is inherently fuzzy; do not design business logic around second-precision presence.

**Decision 3: Devices connect to the platform directly, or through an edge gateway?**
- Direct: simple architecture — one connection, one identity per device.
- Gateway proxy: BLE / Zigbee / wired sensors have no IP capability and can only hang off a gateway; the gateway can also pre-process locally and cache through outages.
- **Leaning**: support both. **Sub-devices behind a gateway still get their own identity and shadow** (rather than the gateway "representing" them), otherwise swapping the gateway = resetting every sub-device — same as the southbound access in the [industrial edge gateway](../industrial-edge/README.md).

**Decision 4: Store all telemetry, or compute at the edge first?**
- Everything to the cloud: complete data, plenty of hindsight insurance; but bandwidth and storage costs explode linearly with device count.
- Edge pre-aggregation: cuts upstream volume 10–100×; the cost is losing the raw detail — "the data you did not think you would need" is gone forever.
- **Leaning**: tier it — **push alert evaluation as far forward as possible (edge / device), collect detail on demand (downsample by default, temporarily switch a misbehaving device to full capture)**.

## 9. Scaling & Bottlenecks

- **First bottleneck: the per-gateway connection ceiling.** → Fix: externalize session state + shard connections, keep the routing table in a shared KV — add machines to scale.
- **Second bottleneck: reconnection storms.** After a regional outage recovers, hundreds of thousands of devices charge back in the same second, and the auth service falls first. → Fix: randomized backoff on the device side (bake it into the firmware!) + rate-limiting and queueing at the access layer.
- **Third bottleneck: time-series write volume.** → Fix: shard by device ID, batch writes, hot/cold tiering, downsample on expiry.
- **Fourth bottleneck: shadow read/write hotspots.** (apps polling a large fleet at high frequency) → Fix: switch shadow changes to push (subscribe to an event stream), batch query APIs, caching.

## 10. Security & Compliance Essentials

- **One key / one cert per device**: unique, individually revocable identity; keys burned into secure storage at the factory, never shared.
- **Least-privilege topic ACLs**: a device may only publish / subscribe under its own ID — prevents one compromised device from forging fleet-wide data or eavesdropping on others.
- **Transport encryption**: TLS end to end; even low-end devices short on compute need at least message-level signatures.
- **Botnets are a real threat**: Mirai built a botnet of hundreds of thousands of devices out of "default passwords" — lax device authentication becomes an attack on the entire internet.
- **Compliance**: device data may contain personal privacy (location, routines, health); store and authorize per local privacy law; some industries (power, healthcare) require data to stay in-domain.

## 11. Common Pitfalls / Anti-patterns

- ❌ **Using HTTP polling as the device channel** → ✅ long connection + push; polling is unsustainable against batteries and cellular data.
- ❌ **Apps sending commands straight to devices, online or not** → ✅ shadow relay; offline = takes effect later, not failure.
- ❌ **Writing telemetry straight into a relational DB** → ✅ message bus for peak-smoothing + a time-series DB; the relational DB neither survives it nor suits it.
- ❌ **All devices sharing one access key** → ✅ one key per device, individually revocable.
- ❌ **Pushing a firmware upgrade to the whole fleet at once** → ✅ staged rollout + success-rate circuit breaker.
- ❌ **Devices reconnecting with no backoff, charging back en masse after an outage** → ✅ randomized backoff baked into the firmware; platform-side rate-limiting as the backstop.

## 12. Evolution Path: MVP → Growth → Maturity (how to set it up at each stage)

| Stage | Scale | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **MVP** | Under a thousand devices | Use a cloud vendor IoT service directly (pay as you go), or single-node EMQX + a time-series DB; the shadow can start as a simple KV | First close the "connect → report → command" loop; do not build your own access layer |
| **Growth** | A hundred thousand devices | Self-host open source (EMQX cluster + bus + a ThingsBoard-like platform) or stay on the cloud service; fill in OTA staged rollout, the rule engine, alerting | Reconnection storms, time-series data cost, whether the shadow abstraction is unified |
| **Maturity** | Millions to hundreds of millions | Multi-region access layer, devices connect nearby; tiered time-series storage; OTA as a platform (version matrix / rollout policies); automated device risk control | A single-region failure must not take down the fleet; cost (connections + storage); how fast a compromised device gets isolated |

## 13. Reusable Takeaways

- 💡 **The "shadow" is a general pattern for unreliable participants**: give the flaky party an "always-online mirror," turning synchronous calls into state reconciliation — equally useful when integrating unstable third-party systems.
- 💡 **Separating desired vs reported = declarative thinking**: the app declares "what it wants," the executor converges on its own — the same philosophy as Kubernetes desired state.
- 💡 **Enqueue at the flood gate first**: the access layer only does "receive + authenticate + hand off," everything else goes async — same as the [notification system](../notification-system/README.md).
- 💡 **Staged rollout + circuit breaker is standard kit for any operation that "changes the real world in bulk"**: pushing firmware, sending marketing, changing configs — one and the same.
- 💡 **Identity granularity sets the security ceiling**: only if you can revoke a single device do you lose only a single device.

## 🎯 Quick Quiz

<Quiz
  question="Devices are frequently offline. What is the correct way to send them a command?"
  :options="['Retry in a loop until the device comes online', 'Write the desired state into the device shadow and let the device sync itself when it wakes', 'Report an error to the user as soon as the device is offline']"
  :answer="1"
  explanation="In the IoT world, offline is the norm: the shadow turns 'device not here' into 'takes effect later.' The app always faces a shadow that answers in a second, never a device that works when it feels like it — this is the single most important abstraction of an IoT platform."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **official documentation**.

**🔧 Open-source prototypes (you can read the code directly):**
- [thingsboard/thingsboard](https://github.com/thingsboard/thingsboard) — the most popular open-source IoT platform: device access, telemetry, rule engine, and dashboards in one — a complete open-source counterpart to this template's overview diagram.
- [emqx/emqx](https://github.com/emqx/emqx) — the open-source benchmark for a high-concurrency MQTT access layer (tens of millions of connections per cluster), embodying "access-layer cluster + stateless scale-out."

**📖 Official documentation:**
- [AWS IoT Device Shadow service](https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html) — the defining documentation for device shadows (desired / reported / delta), matching Scenario 2 in Section 6 and Decision 1 of this template.
- [MQTT protocol website](https://mqtt.org/) — the protocol spec and ecosystem entry point: why lightweight headers, QoS, and last-will messages were born for weak-network devices.

---

> 📌 Remember an IoT platform in one line: **it is the buffer layer between "a million unreliable devices" and "a business that demands stability" — identity makes devices trustworthy, long connections make state observable, and the shadow makes offline no longer a failure. Every design decision answers one question: 'When the device is offline, how does the business keep running as usual?'**
