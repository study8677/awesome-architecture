# Industrial Edge Gateway / SCADA — Architecture Template

> **Representative products / prototypes**: factory SCADA monitoring systems, shop-floor data-acquisition gateways, EdgeX Foundry; representative protocols: OPC UA, Modbus
> **One-line definition**: Standing on the border between OT (the shop floor) and IT (the server room), it translates the physical world into data and ships it to the cloud — while guaranteeing that **no matter how the cloud fails, the production line keeps running and the alarms keep sounding**.

---

## 1. One-Line Definition

Industrial edge = **an "interpreter between two worlds + a little brain that stays autonomous when the network is down."**

On its left is the OT world: PLCs, sensors, instruments — ancient protocols (Modbus was born in 1979), 20-year equipment lifespans, **stability above everything else**. On its right is the IT world: cloud, big data, AI-driven predictive maintenance — **iterate fast, embrace change**. These two worlds have completely opposite value systems, and the edge gateway is the single, strictly controlled border crossing between them.

## 2. Business Essence: What Problem Does It Solve?

The factory's pain: the machines make money, but **they are mute** — how much they produced, when they'll break, where the energy went, it all lives in veteran operators' rounds and Excel sheets. The first step of digitalization is always "get the data out."

But industrial economics differ from the internet's: **one hour of downtime = real money in the six figures; a safety incident = human lives**. So the first constraint of any digitalization project is "**do not break the thing that is making money**." That dictates the whole architecture's posture: toward the OT side, read-mostly and handle with care; all intelligence and iteration live at the edge and above — the farther from the production line, the more freedom.

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Southbound acquisition: connect to PLCs / sensors / instruments across many protocols (Modbus, OPC UA, proprietary ones…)
- [ ] Protocol normalization: translate heterogeneous data into a unified model (raw tags → measurement points → devices)
- [ ] Real-time edge processing: threshold alarms, operational-level response, local dashboards (safety interlocks belong to the PLC / Safety Instrumented System, not the gateway — see Section 5)
- [ ] Store-and-forward: cache locally while offline, backfill after reconnecting
- [ ] Northbound to the cloud: time-series data → cloud analytics / predictive maintenance
- [ ] (Controlled) reverse control: remote parameter tuning, start/stop — with approvals and interlocks

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Non-intrusive to production** | Acquisition never disturbs the control system | Choking a PLC turns a digitalization project into an incident |
| **Alarm latency** | Milliseconds to seconds, cloud-independent | If an overheat alarm has to round-trip the cloud, the furnace has already blown |
| **Offline autonomy** | Runs normally for days without the cloud | Flaky factory networks are the norm, not the exception |
| **No data loss** | Backfill data collected while offline | A gap in energy / quality data ruins reports and traceability |

**Key constraints (boundaries you cannot cross):**
- 🔴 **OT equipment is untouchable**: the PLC program belongs to the vendor and any change requires a production-halt validation; 20-year-old machines only speak serial.
- 🔴 **Extreme protocol heterogeneity**: ten protocols and a few proprietary variants in a single workshop is normal.
- 🔴 **OT and IT networks must be segregated**: this is a security red line (see Section 10) — connections may only be initiated from the inside outward, through a controlled DMZ channel.
- 🔴 **Harsh field conditions**: heat, dust, electromagnetic interference — edge hardware must be industrial-grade and run unattended.

## 4. Architecture Overview

```
 IT / Cloud             ┌──────────────────────────────────────────────┐
 (free-iteration zone)  │ Cloud: time-series data lake / dashboards /  │
                        │ predictive maintenance                       │
                        └──────────────▲───────────────────────────────┘
                                       │ Outbound-only (the edge pushes)
 ══ DMZ / controlled boundary (connections outbound-only, control hardly comes down) ══
                                       │
 Edge layer             ┌──────────────┴───────────────────────────────┐
 (offline-autonomy      │ Edge gateway (industrial hardware, cluster-  │
  zone)                 │ able)                                        │
                        │  · Unified data model (tags→points→devices)  │
                        │  · Real-time rules: threshold alarms         │
                        │    (the loop closes locally!)                │
                        │  · Local time-series cache + resumable upload│
                        │  · Local HMI dashboard (works without cloud) │
                        └──┬────────┬────────┬─────────────────────────┘
                           │ Southbound adapters (one plugin per protocol)
                      ┌────┴───┐ ┌──┴─────┐ ┌┴──────────────┐
 OT / Shop floor      │ OPC UA │ │ Modbus │ │ Proprietary…  │
 (stability first)    └────┬───┘ └──┬─────┘ └┬──────────────┘
                           ▼        ▼        ▼
                      PLCs / sensors / instruments / robots (physical world)
```

> The soul is this: **alarms close the loop locally at the edge; the cloud only does "hindsight wisdom"** (analytics, prediction, optimization). Any logic where "late means disaster" is never allowed to cross that DMZ boundary. And there is one more layer below: **true safety interlocks / emergency shutdown live in the PLC and the Safety Instrumented System (SIS) — that is the territory of safety-certified equipment, where a data-acquisition gateway has neither the right nor any business to reach**. The edge's job is to "see and shout," not to "hit the brakes for the PLC."
>
> One more note: drawing the "edge gateway" as a single box is a teaching simplification; real deployments often split it in two — an acquisition side in the control / production network (L2/L3) and a northbound forwarding side in the DMZ (L3.5), matching the Purdue layers in Section 10.

## 5. Component Responsibilities

- **Southbound protocol adapters**: one plugin per protocol, handling acquisition and (controlled) writes. *Why it's needed*: heterogeneous protocols are industry's fate; plugins let you "onboard a new device type" without touching the core — same move as the multi-vendor adapters in the [AI gateway](../ai-gateway/README.md).
- **Unified data model**: translates "register 40001 = 2350" into "Furnace 3 temperature = 235.0 °C". *Why it's needed*: without a semantic layer, every application above must know every device's register map — which means you have no platform at all.
- **Edge rule engine**: threshold alarms, operational-level response suggestions, data filtering and downsampling — all executed locally. *Why it's needed*: this is where real-time response and offline autonomy land; it is the "little brain" — not clever, but fast, and independent of the big brain. **Keep the boundary clear**: safety interlocks / emergency shutdown belong to the PLC and the Safety Instrumented System (SIS — safety-certified, fail-safe by design); the edge rule engine only does non-safety alarms and process hints.
- **Local cache + store-and-forward**: time-series data lands locally first, is pushed north in batches, and resumes after outages. *Why it's needed*: the implementation of "no data loss"; losing the uplink is a monthly event in a factory.
- **Local HMI (human-machine interface)**: shop-floor dashboards, alarm overview. *Why it's needed*: operators must not go blind just because "the cloud is down."
- **Northbound connector**: pushes to the cloud proactively (outbound only), managing batches and acknowledgments. *Why it's needed*: an outbound-only connection direction is the compliant way to cross the DMZ.
- **Edge management plane**: remote configuration, plugin upgrades, health monitoring. *Why it's needed*: gateways are scattered across dozens of unattended sites — you cannot run operations by driving out with a USB stick.

## 6. Key Data Flows

**Scenario 1: Data acquisition going up (the main road)**
```
1. Adapter polls the PLC by tag table (frequency matters: too fast and you
   poll an old device to death)
2. Change detection: unchanged values are not reported (deadband filtering,
   saves 90% of the traffic)
3. Translate into the unified model: point ID + value + quality stamp + timestamp
4. Dual dispatch: → local rule engine (real-time evaluation) → local
   time-series cache
5. Northbound connector pushes to the cloud in batches; while offline, data
   piles up locally and is backfilled in order after reconnecting
```

**Scenario 2: One overheat alarm (why the loop must close locally)**
```
Furnace at 250 °C crosses the 240 °C threshold:
  ✗ Cloud-side decision: acquire → upload → rule → command down ── if any hop
    breaks or lags, the alarm is gone
  ✓ Edge-side decision: rule engine fires locally within seconds → siren and
    beacon + operators notified
     Meanwhile the event is reported to the cloud (arriving late is fine — the
     alarm has already sounded on site)
  ── The cloud is the "after-the-fact analyst"; the edge is the "operator on shift";
     and a safety interlock like automatic overtemperature furnace shutdown is
     the PLC/SIS's job — a layer lower and faster than the edge
     (three-layer division: PLC/SIS keeps it safe → the edge keeps it seen →
      the cloud keeps it smart)
```

**Scenario 3: One remote parameter change (the gauntlet of reverse control)**
```
1. A cloud-side engineer requests "set Furnace 3 setpoint to 230" → enters the
   approval flow
2. Approved → the command travels down to the edge (via the single controlled
   channel, fully audited)
3. Edge validation: is the value within the safe range? Is the device in a
   writable state? Are interlock conditions satisfied?
4. Only after validation does it write to the PLC; any failed check → reject
   and raise an alarm
   ── "Read" is routine; "write" is surgery: forbidden by default, approved
   case by case, with the edge holding the final veto
```

## 7. Data Model & Storage Choices

Core entities: `device / asset tree` (site → line → device → measurement point); `tag mapping table` (protocol address ↔ point semantics); `telemetry time series`; `alarm events`; `control audit log`.

| Data | Storage type | Why |
|---|---|---|
| Asset tree / tag table | Relational (one copy at the edge, one in the cloud) | Structured, rarely changes, the root of all semantics |
| Telemetry time series (edge) | Embedded time-series DB / ring storage | Local buffer is finite; rolls over by retention policy |
| Telemetry time series (cloud) | Time-series DB + cold archive | Long-term trends, cross-site analytics — same as the [IoT platform](../iot-platform/README.md) |
| Alarms / control audit | Relational, append-only | Incident traceability and compliance — not a single record may go missing |

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: Put the intelligence at the edge, or in the cloud? ⭐**
- Cloud: unlimited compute, models iterate anytime; but hostage to the network — offline means incapacitated.
- Edge: real-time and autonomous; but limited compute, and every update goes through an on-site change process.
- **Leaning**: split by "does being late cause harm" — **alarms and on-site response must live at the edge; analytics, prediction, and optimization go to the cloud** (safety interlocks sit lower still, in the PLC/SIS — they never enter this choice at all). The litmus test: with the network down for 72 hours, can the factory still produce normally?

**Decision 2: May the IT side write back into OT? ⭐**
- Fully forbidden: safest, but you lose all the value of "remote tuning / remote operations" — every adjustment requires a site visit.
- Fully open: efficient, but it hands the cloud an arm reaching into the production line — a compromised cloud = a compromised line.
- **Leaning**: **read-only by default; whitelist write operations** — restricted points, restricted ranges, approval + audit, final validation at the edge (interlock checks). For high-hazard scenarios (safety instrumented systems), there is physically no write path at all.

**Decision 3: With heterogeneous legacy protocols, where does the normalization layer live?**
- Each application parses protocols itself: quick to start, but point semantics scatter everywhere — adding one device means changing N systems.
- The gateway normalizes centrally: every protocol is translated at the edge into the unified model; applications only ever see "measurement points."
- **Leaning**: normalize at the edge, no question. **The tag mapping table is the most valuable asset in industrial digitalization** — it is the dictionary of the physical world, and worth maintaining with real effort.

**Decision 4: How do you set the polling frequency?**
- Faster feels more "real-time," but an old PLC's comms port is feeble — poll it too hard and you crowd out its traffic with the control system and **poll the production line to a halt**.
- **Leaning**: tier by point criticality (alarm-class at seconds, trend-class at minutes) + deadband filtering; validate PLC load in a test environment before go-live. "Non-intrusive" outranks "real-time."

## 9. Scaling & Bottlenecks

Industrial scaling = **number of sites × device heterogeneity × years in service**:

- **First bottleneck: tag mapping is configured by hand.** Tens of thousands of points per plant — configuration errors outnumber code bugs. → Fix: tag template libraries (reuse across same-model devices), import validation tools, versioned configuration management.
- **Second bottleneck: operating gateways across many sites.** Dozens of plants, hundreds of gateways, all unattended. → Fix: an edge management plane (remote config / staged upgrades / health monitoring) — treat gateways as cattle, not pets.
- **Third bottleneck: cloud time-series storage cost.** (Tens of thousands of points per second per plant) → Fix: deadband filtering + downsampling at the edge before upload; keep the raw detail at the edge, fetched on demand.
- **Fourth bottleneck: alarm storms.** One shutdown triggers thousands of cascading alarms, and the real root cause drowns. → Fix: alarm tiering, suppression rules (a stopped parent device suppresses its children's alarms), root-cause aggregation.

## 10. Security & Compliance Essentials

- **Layered network segregation (the Purdue model)**: control network (L0-L2) / manufacturing operations (L3) / DMZ (L3.5) / enterprise network (L4-L5), isolated layer by layer; crossings only via controlled channels. **Connecting the shop-floor network straight to the internet = hanging the production line in front of a gun barrel.**
- **Outbound-only connection direction**: the edge dials out; the cloud may never reach in. Anything that needs to travel down goes via edge-initiated pulls or a dedicated channel.
- **Full audit of control commands**: who, when, which point, from what value to what value — the lifeline of incident forensics.
- **Legacy devices have no security capabilities**: Modbus has no authentication and no encryption (it is a 1979 protocol); protection can only come from wrapping the network layer around it (segregation + whitelists), never from the device itself.
- **Compliance**: critical infrastructure (power, water, chemicals) carries mandatory national / industry security standards; security incidents may trigger statutory reporting obligations.

## 11. Common Pitfalls / Anti-patterns

- ❌ **Connecting the shop-floor network directly to the internet** → ✅ layered segregation + DMZ + connections initiated from the inside outward — a red line, not a suggestion (extreme-security settings such as nuclear power go further, with physical unidirectional data diodes).
- ❌ **Making the alarm path depend on the cloud** → ✅ every piece of "late means disaster" logic closes the loop locally at the edge.
- ❌ **Applying IT-style "fast iteration" to OT systems** (restart anytime, canary-release to a PLC) → ✅ every OT-side change goes through a shutdown window + on-site validation; keep the iteration freedom at the edge and above.
- ❌ **Maxing out polling frequency everywhere in pursuit of "real-time"** → ✅ tiered acquisition + deadband filtering; polling a PLC to death is the classic data-acquisition incident.
- ❌ **Tag mappings scattered across individual applications** → ✅ normalize once at the edge, with the tag table under version control.
- ❌ **Dropping data collected while offline** → ✅ local cache + resumable backfill — that is what keeps reports and traceability whole.

## 12. Evolution Path: MVP → Growth → Maturity (how to set it up at each stage)

| Stage | Scale | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **MVP / single-line pilot** | 1 production line | One industrial gateway + off-the-shelf acquisition software, a few hundred critical points, local dashboard + simple cloud upload | Prove "we can collect it, see it, and not disturb production" — earn the factory's trust |
| **Growth / whole plant** | 1 plant, tens of thousands of points | Gateway cluster, unified data model, edge rule engine, alarm system, DMZ network rework | Tag governance, alarm storms, offline autonomy |
| **Maturity / group-wide** | Dozens of sites | Edge management plane for unified operations, cloud data lake for cross-plant analytics, predictive maintenance, controlled reverse control | Multi-site standardization (a unified asset model), the security regime, operating cost |

## 13. Reusable Takeaways

- 💡 **"Interpreter + unified model" is the universal answer to heterogeneous legacy systems**: normalize the semantics first, then talk about upper-layer applications — integrating with an old core-banking system or a hospital HIS is the same tactic.
- 💡 **Split edge vs. center by "does being late cause harm"**: real-time backstops sink down, clever decisions float up — CDN edge computing and retail-store systems follow the same logic.
- 💡 **Store-and-forward is the standard stance for weak-network collaboration**: land locally first, backfill later — same as the offline-first approach in the [mobile app](../mobile-app/README.md) template.
- 💡 **Gate every operation that "writes to the physical world" layer by layer**: whitelist + approval + final validation at the executing side — universal for any system with physical consequences (payments, healthcare, robotics).
- 💡 **When two systems with opposite value systems must connect, the boundary must be narrow, controlled, and audited**: the stability camp and the iteration camp cannot live together — you can only build a border crossing.

## 🎯 Quick Quiz

<Quiz
  question="Where should the decision logic for a factory overheat alarm live?"
  :options="['In a cloud rule engine, easier to manage and iterate centrally', 'Locally on the edge gateway, closing the loop on site and working even when offline', 'Only inside the PLC and nowhere else']"
  :answer="1"
  explanation="An alarm is logic where being late causes harm, so it must close the loop locally at the edge — cloud down or network down, the alarm still sounds. The cloud only does after-the-fact analysis. (The safety interlocks inside the PLC are a separate, lower layer of protection; both coexist, but the data platform's alarm duty lands on the edge.)"
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **official documentation**.

**🔧 Open-source prototypes (you can read the code directly):**
- [edgexfoundry/edgex-go](https://github.com/edgexfoundry/edgex-go) — the Linux Foundation's open-source edge platform: its layering of southbound device services (protocol plugins) / core data / northbound export is the open-source realization of this template's overview diagram.
- [open62541/open62541](https://github.com/open62541/open62541) — an open-source implementation of OPC UA; OPC UA is the industry's answer to a "unified semantic model" — read it to understand how raw tags acquire semantics.

**📖 Official documentation:**
- [NIST SP 800-82 Rev. 3: Guide to OT Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final) — the authoritative guide to industrial control security from the U.S. National Institute of Standards and Technology (NIST): Purdue layering, OT/IT segregation, defense in depth — the backbone of Section 10 in this template.

---

> 📌 Remember industrial edge in one line: **it is the border crossing between two worlds with opposite value systems — toward the shop floor, "handle with care, read-mostly"; toward the cloud, "send data up freely, keep your hands off the way down"; and for itself, "cloud gone, line still runs, alarms still sound." Every design decision answers one question: 'How do we get the data out without ever breaking the production line that is making the money?'**
