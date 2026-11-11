# Automotive E/E Architecture — Architecture Template

> **Representative products / prototypes**: Tesla's centralized architecture, the domain-controller architectures of the EV newcomers, traditional distributed ECUs; open-source prototype openpilot; industry standard AUTOSAR
> **One-line definition**: Evolve a car from "100 little computers each doing their own thing" into "a data center on wheels" — while guaranteeing that **the brakes always matter more than a smooth infotainment screen**.

---

## 1. One-Line Definition

Automotive E/E architecture = **a mobile distributed system built on "safety-level isolation + real-time buses + whole-vehicle OTA."**

It may be the **most constrained architecture** an ordinary engineer will ever touch: hard real-time (brake signals must arrive within milliseconds), functional safety (mistakes kill people), cost-sensitive (save 10 yuan per car × a million cars), a 15-year lifespan — and it still has to OTA new features like a phone. Its core tension is singular: **"entertainment must iterate at full speed, safety must be rock solid" — and these two kinds of software are physically installed in the same vehicle.**

## 2. Business Essence: What Problem Does It Solve?

Traditional automotive software was "thrown in with the parts": a wiper controller, a window controller, an engine controller… one ECU (Electronic Control Unit) per function, each delivered as a black box by a different supplier, with the OEM doing only integration. The result: **100+ ECUs and kilometers of wiring harness per car**, and adding a "close the windows when it rains" feature meant coordinating three suppliers for half a year.

The "software-defined vehicle" flipped that landscape: **a car's differentiation shifted from horsepower to experience and autonomous driving, and software went from a cost item to a revenue item** (autonomous-driving subscriptions, cockpit apps, paid OTA unlocks). This forces the architecture to converge from "a hundred black boxes" into "a few high-compute computers + a software platform" — the OEM must own its software stack the way an internet company does.

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Vehicle control: powertrain, chassis, body (lights / windows / door locks)
- [ ] Autonomous driving: perception, planning, control (sensors → decisions → actuation)
- [ ] Smart cockpit: instrument cluster, center-stack infotainment, voice, navigation
- [ ] Connected services: remote vehicle control, fleet data upload, whole-vehicle OTA
- [ ] Diagnostics & after-sales: fault codes, remote diagnostics

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Functional safety** | Critical functions certified to their ASIL level | A brake failure is not a bug, it is an accident |
| **Hard real-time** | Control signals delivered deterministically within milliseconds | "Fast on average" is useless; you need "on time even in the worst case" |
| **Service life** | 15 years / maintainable across the full lifecycle | A car is not a phone; users do not replace it every three years |
| **OTA capability** | Whole vehicle upgradable, failures rollback-able | Both software revenue and defect recalls depend on it |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Functional safety levels (ASIL)**: each function gets its safety level from hazard analysis and risk assessment (ISO 26262's HARA) — brake-related functions are typically ASIL-D, infotainment QM. It is an industry standard rather than statute law, but **it is the de-facto bar to entry**; **software at different levels must not affect each other** — this is the architecture's first dividing line.
- 🔴 **Automotive-grade hardware**: -40℃ to 105℃, vibration, electromagnetic interference; compute and memory far more conservative than consumer electronics.
- 🔴 **Supply-chain reality**: a large share of components is still delivered by Tier1 suppliers; the architecture must draw clean interfaces between "build" and "integrate."
- 🔴 **Cost**: per-vehicle hardware cost is counted in cents; redundancy cannot be stacked without limit.

## 4. Architecture Overview

```
            Cloud: OTA service / fleet data platform / remote diagnostics
                         ▲  Cellular network (TBox gateway, convergence point of the remote channel)
 ────────────────────────┼─────────────────────────────────────
 In-vehicle              │
   ┌─────────────────────┴───────────────────────────────────┐
   │        Central compute platform (high-compute SoC)      │
   │  ┌──────────────────────┐   ┌─────────────────────────┐ │
   │  │ ADAS domain          │   │ Cockpit domain          │ │
   │  │ (hard-real-time OS)  │   │ (Linux / Android)       │ │
   │  │ Perception/planning/ │   │ Cluster (own RTOS) │    │ │
   │  │ control              │   │ center stack / media    │ │
   │  │ Isolated per ASIL    │   │ Safety display hard-    │ │
   │  │ level                │   │ isolated from fun       │ │
   │  └──────────────────────┘   └─────────────────────────┘ │
   └───────────────┬─────────────────────────────────────────┘
                   │ Automotive Ethernet backbone (high bandwidth: video streams / bulk data)
     ┌─────────────┼─────────────┬─────────────┐
     ▼             ▼             ▼             ▼
 ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
 │ Zonal    │  │ Zonal    │  │ Zonal    │  │ Zonal    │   (wired by physical position)
 │ ctrl FL  │  │ ctrl FR  │  │ ctrl RL  │  │ ctrl RR  │
 └──┬───────┘  └──┬───────┘  └──┬───────┘  └──┬───────┘
    │ CAN/LIN branches (low bandwidth, high determinism: control signals)
    ▼             ▼             ▼             ▼
 Sensors / actuators: motors, brakes, steering, lights, windows, seats … (the physical world)
```

> The soul is this: **two networks for two kinds of traffic** — the Ethernet backbone carries "big data" (camera video, maps, OTA packages), while CAN branches carry "small but precise" control signals (a brake command is 8 bytes, but it must arrive deterministically within milliseconds); **zonal controllers gather wiring by position** (saving kilometers of harness), while **the central platform splits by software domain** (ADAS and cockpit each mind their own).

## 5. Component Responsibilities

- **Central compute platform**: the vehicle's "brain," running the two big domains — ADAS and cockpit. *Why it's needed*: the software-defined vehicle demands centralized compute so features can cooperate across domains and OTA can be unified.
- **ADAS domain (hard-real-time OS + ASIL isolation)**: sensor fusion → planning → control commands. *Why it's needed*: this is safety-critical software; it must run in a real-time, safety-certified environment, completely isolated from entertainment. In practice this uses "ASIL decomposition": the neural-network main algorithms are developed at QM/ASIL-B (they cannot be certified to ASIL-D), flanked by an ASIL-D safety-monitor core that does plausibility checks and degraded-mode takeover — **the smart part runs at a lower level, the backstop at the highest**.
- **Cockpit domain (Linux / Android)**: center stack, media, voice, app ecosystem. *Why it's needed*: experience must iterate fast, so use the consumer-electronics stack; **but the instrument display (speed / warnings) runs separately on a small RTOS** — if the center stack freezes, the speedometer must not go dark.
- **Zonal controllers**: connect sensors / actuators by physical proximity, doing I/O aggregation and power distribution. *Why it's needed*: turns "run a wire from every function to its ECU" into "connect locally + carry over the backbone," significantly shortening the harness (the industry has floated the target of compressing kilometers of harness down to the hundred-meter scale; real-world production gains are large but incremental) — the harness is one of the heaviest components in a vehicle and the biggest obstacle to assembly automation.
- **CAN / LIN buses**: the transport layer for control signals — broadcast, priority arbitration. *Why it's needed*: a brake signal does not want bandwidth, it wants "on time even in the worst case" — under controlled bus load and priority design, CAN delivers a **computable worst-case latency** (which is exactly why it has refused to die for 40 years; the price is that low-priority frames get starved under high load, so the bus-load budget is itself a design task).
- **Automotive Ethernet backbone**: the transport layer for high-bandwidth traffic (video / maps / OTA). *Why it's needed*: a single 8-megapixel camera can swamp the combined bandwidth of every CAN bus in the car. By default it is a best-effort network; when the backbone must carry cross-zone safety signals, TSN-class (Time-Sensitive Networking) mechanisms are layered on to obtain bounded latency — which is exactly what central + zonal architectures do.
- **TBox / connectivity gateway**: convergence point of the remote cellular channel + firewall between inside and outside. *Why it's needed*: the remote attack surface needs a unified checkpoint. Note, though, that a single "only external port" does not exist — Bluetooth / Wi-Fi (usually on the infotainment head unit), the OBD diagnostic port, and keyless-entry RF are all external surfaces; the goal is an attack surface that is **enumerable, with a checkpoint at every port**. In the famous car-hacking incidents of history, the entry point was precisely the connectivity channel.
- **OTA management (dual partition + rollback)**: orchestrated firmware upgrades across the vehicle's controllers. *Why it's needed*: one OTA touches dozens of controllers with complex dependencies; "power dies halfway through an upgrade" must be a designed-for scenario.

## 6. Key Data Flows

**Scenario 1: One press of the brake pedal (hard-real-time path, milliseconds or bust)**
```
1. Pedal sensor → zonal controller (sampled locally, dual-channel redundant)
2. High-priority CAN frame on the same low-latency segment → brake controller
   receives and executes within milliseconds
   (the pedal and the brake controller deliberately sit on the same segment /
    a dedicated redundant link; if the path must cross zones, the backbone has
    to carry it over deterministic Ethernet such as TSN)
3. The ADAS domain receives the same signal (it needs to know a human took over)
   ── Note what is NOT on this path: no central-SoC application layer, no
      dependency on anything that "might be busy with something else."
      Safety paths must be short, dedicated, and redundant.
   ── Also note: conventional cars always keep a hydraulic / mechanical braking
      path as the base; what is described here is the by-wire / electronic
      modulation path — pure brake-by-wire (no mechanical backup) relies on
      dual-redundant electronic channels.
```

**Scenario 2: One whole-vehicle OTA (designing "upgrade failed" into a safe state)**
```
1. Cloud publishes the campaign (signatures + version dependency graph) → TBox
   verifies the signatures
2. Silent background download to each controller's spare partition (invisible
   to the user, resumable)
3. Install-condition gate: gear in P + sufficient battery + user confirmation
   (never reboot a controller while driving)
4. Install orchestrated in dependency order → commit as a whole only after
   every self-check passes
5. Any controller fails → the entire batch rolls back to the old version
   (versions must be consistent across the vehicle — never half new, half old)
```

**Scenario 3: Shadow mode (a million cars = a free test fleet)**
```
1. A new ADAS algorithm ships via OTA, but only "observes" — it never controls
   the car
2. Old and new run in parallel: the new algorithm's decisions are compared
   against the human driver / old algorithm
3. Disagreement scenarios (new algorithm wanted to brake, human did not) →
   clip extracted and uploaded to the cloud
4. Cloud trains the next version on real corner cases → OTA again → repeat
   ── Same "shadow traffic" as in [Evolution & Splitting](../../tutorial/14-演进与拆分大型系统.md),
      except the traffic is real roads
```

## 7. Data Model & Storage Choices

Core data: `signals` (live values on the bus: speed, pedal…); `fault codes (DTC)`; `calibration parameters`; `firmware version matrix`; `driving data / scenario clips`.

| Data | Storage type | Why |
|---|---|---|
| Live signals | Never persisted; bus broadcast + memory | Millisecond lifespan — freshness matters, not durability |
| Fault codes / event records | Controller-local flash (black-box style) | After-sales diagnostics and accident forensics; must survive power loss |
| Calibration parameters | Controller flash, versioned | Differ per model / per batch; OTA must be able to change them |
| Firmware version matrix | Relational, in the cloud | "Which car, which controller, which version" — the foundation of recalls and OTA |
| Uploaded scenario data | On-vehicle ring buffer → cloud object storage | Huge and sparsely valuable; only triggered clips get uploaded |

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: Distributed ECUs → domain-centralized → central compute — how far do you go? ⭐**
- Distributed (100+ ECUs): mature supply chain, small blast radius per failure; but scattershot software, harness explosion, OTA next to impossible.
- Domain-centralized (one domain controller each for powertrain / body / cockpit / ADAS): software starts converging — the current mainstream.
- Central compute + zonal controllers: fully centralized software, minimal harness, smoothest OTA; but it demands extreme software capability from the OEM, and single-point-of-failure protection (redundancy) must be done in full.
- **Leaning**: the industry as a whole is evolving toward central compute, **but the pace depends on the organization's software capability** — an architecture ahead of its capability = disaster ([Organization Is Architecture](../../tutorial/15-组织即架构.md) as manifested in the auto industry: the supplier relationships are the shape of the old architecture).

**Decision 2: How do you isolate the safety domain from the entertainment domain? ⭐**
- Physical isolation (separate chips): the hardest boundary, easy to certify; expensive, and cross-domain communication is slow.
- Single-chip virtualization (hypervisor partitions): saves money and space; but proving "an entertainment crash can never touch the cluster" makes certification extremely costly.
- **Leaning**: **critical displays (the cluster) lean toward an independent small system as the backstop, with virtualization between the high-compute domains**. The principle never changes: **no behavior of QM-level software may ever affect the resources or timing of ASIL-level software.**

**Decision 3: OTA — push full images, or delta + staged rollout?**
- Full images: simple and reliable, but one whole-vehicle upgrade is several GB — cellular data cost × a million cars.
- Delta packages + staged rollout: saves 90% of the traffic; push to a thousand cars first, watch, then open the floodgates; the price is a complex version-combination matrix to manage.
- **Leaning**: delta + staged rollout + failure-rate circuit breakers is the production standard, same OTA playbook as the [IoT platform](../iot-platform/README.md) — except here "bricking" means a tow truck.

**Decision 4: Upload all ADAS data, or trigger-based collection?**
- Upload everything: the most complete data; but one car produces several TB a day, and the traffic and storage bills run into the hundreds of millions.
- Trigger-based (upload clips only on shadow-mode disagreement / hard braking / takeover moments): a thousandfold reduction in volume, and every clip is signal.
- **Leaning**: trigger-based, primarily. **The value density of data matters more than its volume** — only corner cases fatten the algorithm.

## 9. Scaling & Bottlenecks

For a car, "scale" = number of models × fleet size × a 15-year lifecycle:

- **First bottleneck: model-configuration explosion.** One platform spawns N models × M configurations, and the firmware version matrix grows exponentially. → Fix: decouple software from hardware (one software platform + configuration words to activate differences), turning "model differences" from branches into configuration.
- **Second bottleneck: OTA fleet management.** A million cars, cellular networks, users who switch off the ignition at any moment. → Fix: resumable downloads + staged rollout + failure circuit breakers + version-convergence governance (version sprawl is a long-term poison).
- **Third bottleneck: data-upload cost.** → Fix: trigger-based collection + on-vehicle pre-filtering + uploading when Wi-Fi is available.
- **Fourth bottleneck: 15 years of maintenance.** Chips go end-of-life, operating systems fall out of support, and the car is still on the road. → Fix: long-term supply agreements, abstraction layers to isolate the hardware, and a security-patch channel kept alive for the full lifecycle.

## 10. Security & Compliance Essentials

- **Functional safety (Safety)**: ISO 26262 governs the entire process — ASIL decomposition and isolation; dual-channel redundancy for critical actuators; failures land in a "safe state" (e.g. speed-limited limp-home mode) rather than a flat refusal to work.
- **Cybersecurity (Security)**: a checkpoint at every external interface (the TBox converges the remote channel; Bluetooth / Wi-Fi / OBD each get their own defenses) + in-vehicle network segmentation with firewalls; bus message authentication (against forged brake commands); end-to-end OTA signing (see the Uptane framework); the R155/R156 regulations mandate vehicle cybersecurity and software-update management systems.
- **Safety and Security are two faces of the same thing in a car**: a hacked steering system is a safety incident. Remote attack surface (cellular / Bluetooth / Wi-Fi) → lateral movement inside the vehicle → the control bus — every hop needs a checkpoint.
- **Data compliance**: driving trajectories and cockpit cameras are highly sensitive personal data; many countries strictly regulate the cross-border transfer of geographic data.

## 11. Common Pitfalls / Anti-patterns

- ❌ **Entertainment and control systems sharing one environment and one bus with no isolation** → ✅ ASIL partitioning + network segmentation: an infotainment freeze must never reach the cluster or the brakes.
- ❌ **OTA with no install conditions, rebooting controllers while driving** → ✅ gear in P + battery + user confirmation, with whole-batch rollback on failure.
- ❌ **Applying internet-style "move fast" directly to safety components** (pushing a brake firmware on Friday evening) → ✅ safety components go through the full V-model verification; keep the iteration freedom for the cockpit and non-safety domains.
- ❌ **Safety paths that rely on "average performance"** (the Ethernet is not congested today) → ✅ hard real-time judges the worst case: control signals go over links with bounded latency — CAN under controlled load, or Ethernet with TSN / time-triggered scheduling layered on.
- ❌ **Trusting the in-vehicle network by default** (once inside, anyone can send commands) → ✅ bus message authentication + inter-domain firewalls; assume the connectivity module will eventually be breached.
- ❌ **"Store all the ADAS data first, sort it out later"** → ✅ trigger-based collection; value density first.

## 12. Evolution Path: MVP → Growth → Maturity (how to set it up at each stage)

| Stage | Shape | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **Traditional starting point** | Distributed, 100+ ECUs | One independent ECU per function, black-box supplier delivery, the OEM does integration testing | Integration quality; no point talking about a software platform yet |
| **Domain-centralized (current mainstream)** | 4–6 domain controllers | Powertrain / body / cockpit / ADAS each converge into a domain controller; build cockpit and ADAS in-house first; whole-vehicle OTA in place | The in-house vs supplier boundary, standardized cross-domain communication, the OTA system |
| **Central compute (the direction of evolution)** | Central platform + zonal controllers | Fully centralized software (service-oriented architecture), zonal controllers as pure I/O, software-hardware decoupling with configuration-based activation | Organizational software capability, redundancy design, software operations for a million-car fleet |

## 13. Reusable Takeaways

- 💡 **Isolate by "consequence of failure," not by "functional module"**: the ASIL mixed-criticality isolation idea applies to any system where critical and non-critical workloads share a home (trading core vs marketing campaigns).
- 💡 **Two kinds of traffic, two networks**: high bandwidth rides the high-throughput link, small-but-critical rides the deterministic link — the physical edition of "separate the control plane from the data plane."
- 💡 **Shadow mode = validating a new version on real traffic for free**: observe first, compare the differences, then hand over authority — applicable to any high-risk replacement (risk models, recommendation algorithms).
- 💡 **Failure needs a "safe state" to land in**: the limp-home-mode idea — where a degraded system comes to rest is designed, not left to luck ([Design for Failure](../../tutorial/12-为失败而设计.md)).
- 💡 **Software-hardware decoupling + configuration activation**: one software stack serving N hardware configurations — the endgame answer to SKU management (same as [embedded firmware](../embedded-device/README.md) Decision 4).

## 🎯 Quick Quiz

<Quiz
  question="Why does the brake signal travel on the CAN bus while camera video travels on automotive Ethernet?"
  :options="['CAN is newer and Ethernet is older', 'Braking needs deterministic worst-case latency while video needs big bandwidth — two kinds of needs, two networks', 'It is purely a cost decision']"
  :answer="1"
  explanation="A safety control signal is only 8 bytes, but it must arrive within milliseconds even in the worst case — CAN priority arbitration under controlled bus load yields a computable worst-case latency (Ethernet needs TSN for an equivalent guarantee); a camera produces hundreds of MB per second and wants throughput. Choosing the transport layer by traffic profile is the same idea as the control-plane / data-plane separation in internet systems."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **industry standards**.

**🔧 Open-source prototypes (you can read the code directly):**
- [commaai/openpilot](https://github.com/commaai/openpilot) — an open-source driver-assistance system running on real cars: the perception → planning → control loop, interaction with the vehicle over CAN, and a safety watchdog in an independent process — the most real automotive software an ordinary engineer can actually read.

**📖 Industry standards / frameworks:**
- [AUTOSAR](https://www.autosar.org/) — the industry standards body for automotive software architecture: the Classic (safety real-time domain) and Adaptive (high-compute domain) platforms map exactly to this template's "two value systems of software."
- [Uptane](https://uptane.org/) — the open framework for secure automotive OTA updates (multi-level signing, anti-rollback, safe even under partial compromise), matching Scenario 2 in Section 6 and Section 10.

---

> 📌 Remember automotive E/E in one line: **two kinds of software live in one car — rock-solid safety components and fast-iterating experience components — and all the architectural craft goes into letting them cohabit without harming each other: tiered isolation, two networks, controlled OTA. Every design decision answers one question: 'However wild the entertainment gets, the brakes are never affected.'**
