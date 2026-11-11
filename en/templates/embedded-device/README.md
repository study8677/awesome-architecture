# Embedded Device Firmware — Architecture Template

> **Representative products / prototypes**: smart door locks, fitness bands, robot-vacuum main controllers, e-bike controllers; open-source prototypes Zephyr, FreeRTOS, ESP-IDF, MCUboot
> **One-line definition**: On a chip with KB-scale memory, mW-scale power, and no way to take it back once sold, run "sense → decide → act" reliably and frugally — and stay remotely upgradable without ever bricking.

---

## 1. One-Line Definition

Embedded firmware = **a tiny operating system plus a business state machine, running where "resources are locked down and errors have nowhere to escape."**

When a cloud program crashes you restart, scale out, roll back; firmware runs inside the lock on a user's front door — **a crash means the door won't open**. All of its architectural craft goes into three things: **layering to isolate hardware differences, state machines to tame concurrency, and sealing off the "failed upgrade" path for good**. It is the most extreme version of [designing for failure](../../tutorial/12-为失败而设计.md) — because here there isn't even a "human reboot" to fall back on.

## 2. Business Essence: What Problem Does It Solve?

The brutal truth of the hardware business: **once a device ships, your marginal control over it approaches zero.** A firmware bug in the cloud is "roll back + apologize"; on hardware it's "recall a million units" or "the brand's reputation collapses."

Meanwhile, hardware margins are counted in pennies: shave a cent off the BOM (bill of materials), multiply by a million units, and you've saved real money. So firmware is forever asked to **do the most with the smallest chip** — RAM measured in KB, Flash in MB, power in μA. Every layer of abstraction has a real cost in memory and CPU, so **"do we need this abstraction" is an accounting question here**.

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Sensor sampling / actuator control (the device's actual job)
- [ ] Local interaction (buttons / screen / LEDs / voice)
- [ ] Wireless connectivity and reporting (BLE / Wi-Fi / cellular / LoRa)
- [ ] OTA remote upgrades
- [ ] Low-power management (the lifeline of battery devices)
- [ ] Self-recovery from faults (watchdog, power-loss protection)

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Reliability** | Years of continuous operation (a watchdog reset is a backstop, not passing the bar) | Users will not "try restarting the door lock" |
| **Real-time behavior** | Critical responses deterministic at millisecond scale | Motor control 10 ms late can burn out a transistor |
| **Power** | Battery lasts months to years | Frequent charging = product failure |
| **Upgrade safety** | Brick rate ≈ 0 | Brick one unit, refund one unit; brick a batch, make the news |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Resources are locked down**: RAM from tens of KB to a few MB, Flash from hundreds of KB to tens of MB, and none of it can grow after the device ships.
- 🔴 **No rebooting / updating at will**: the device is on the job (locking a door, riding down the road); update windows and failure budgets are tiny.
- 🔴 **No debugging in the field**: no SSH, no debugger — problems can only be solved with the evidence the device leaves behind by itself.
- 🔴 **Hardware iterates out of sync**: the same firmware must run on V1.0 / V1.2 / the V2.0 board that switched sensor suppliers.

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Application layer: the business state machine               │
│  (the device's life script: idle → working → fault →         │
│   recovery, event-driven)                                     │
├─────────────────────────────────────────────────────────────┤
│  Service layer: business-agnostic common capabilities         │
│  OTA manager │ log black box │ power mgmt │ config store │    │
│  connectivity manager                                         │
├─────────────────────────────────────────────────────────────┤
│  RTOS kernel: task scheduling / message queues / timers /     │
│  interrupt management                                         │
│  (high-priority tasks: motor control…  low-priority tasks:    │
│   reporting, logging…)                                        │
├─────────────────────────────────────────────────────────────┤
│  HAL, the hardware abstraction layer: "swap the chip,         │
│  change only this layer"                                      │
│   GPIO │ timers │ ADC │ UART/SPI/I2C │ radio TX/RX            │
├─────────────────────────────────────────────────────────────┤
│  Hardware: MCU + sensors + actuators + radio module + power   │
└─────────────────────────────────────────────────────────────┘
     ▲ Watchdog: independent of every layer above — if the
       firmware goes silent, force a reset
     ▲ Flash partitions: bootloader │ firmware slot A │
       firmware slot B │ data
```

> The soul is this: **the HAL locks "hardware changes" into the bottom layer, the state machine locks "business concurrency" into the top layer, and the watchdog plus A/B slots catch "everything you didn't think of."** The service layer in the middle is the part every product rewrites and still gets wrong — which is exactly why it's worth writing correctly once.

## 5. Component Responsibilities

- **HAL (hardware abstraction layer)**: translates "turn on the LED" into the register operations of a specific chip. *Why it's needed*: chips go out of stock, get pricier, change suppliers; without a HAL, swapping the chip = rewriting all the code.
- **RTOS task scheduling**: preemptive, priority-based scheduling of multiple tasks. *Why it's needed*: motor control cannot wait for a log write to finish; priorities are how real-time behavior is implemented.
- **Business state machine**: models device behavior as "state + event → transition." *Why it's needed*: the king of embedded bugs is the "unexpected state combination"; a state machine makes every state explicit, enumerable, testable.
- **Watchdog**: an independent hardware timer; the firmware "feeds the dog" periodically, and a missed feeding forces a reset. *Why it's needed*: it's the last line of insurance against hangs — provided the feeding logic sits on a path the system only reaches when it is genuinely healthy.
- **OTA manager (A/B dual slots)**: new firmware is written to the standby slot, switched to only after verification, and rolled back automatically if boot fails. *Why it's needed*: upgrades are the number-one cause of bricking; dual slots turn "upgrade failed" into "back to the old version."
- **Log black box**: a ring buffer records key events; crash context (registers / call stack) is persisted to Flash. *Why it's needed*: with no field debugging, the black box is the only "autopsy report."
- **Power management**: orchestrates the rhythm of "sleep → wake → work → sleep again." *Why it's needed*: a battery device should be asleep 99% of the time; the power budget is allocated at the architecture level, not "optimized" in at the end.

## 6. Key Data Flows

**Scenario 1: One sensor event (interrupt → queue → task)**
```
1. The sensor fires a hardware interrupt
2. Interrupt service routine (ISR): does exactly two things — read the data,
   post a message to a queue (returns in microseconds)
3. The RTOS wakes the business task waiting on that queue
4. The business task feeds the message to the state machine:
   current state + event → new state + action
5. The action executes (drive an actuator / trigger a report)
   ── Iron rule: never do heavy work in the ISR; everything heavy
      gets queued and handed to a task
```

**Scenario 2: One OTA upgrade (the full closed loop that seals off "bricking")**
```
1. The cloud pushes an upgrade notice (version + signature + per-chunk hashes)
2. The firmware downloads in chunks to slot B (verifying as it goes,
   resumable after interruption)
3. Full signature verification → on success, mark "boot from slot B next
   time (trial mode)"
4. Reboot at an opportune moment (device idle + battery sufficient — never
   mid-job)
5. The bootloader boots from slot B → firmware self-check (can it reach the
   network? are the sensors OK?)
6. Self-check passes → commit "slot B is now official"; failure / another
   crash → the bootloader switches back to slot A automatically
```

**Scenario 3: The low-power cycle (a battery device's daily life)**
```
Deep sleep (μA level) ──RTC timed wake──▶ sample ──▶ batch up ──▶ only
power the radio to report once the batch threshold is hit ──▶ back to
deep sleep
── The radio is the power hog: connect rarely, send in batches, sleep
   immediately after sending — the three architectural moves of saving power
```

## 7. Data Model & Storage Choices

Core data: `firmware image`; `device config` (keys, calibration parameters, user settings); `runtime logs / crash context`; `pending-report data cache`.

| Data | Storage type | Why |
|---|---|---|
| Firmware image | Dedicated A/B Flash slots | The physical basis of atomic switching and rollback on failure |
| Device config | Small Flash partition, **dual copies + CRC** | Power loss mid-write must not lose the config; if one copy corrupts, the other survives |
| Runtime logs | RAM ring buffer + key events flushed to Flash | Flash has a wear limit (tens of thousands of cycles) — you cannot write everything to it |
| Pending-report data | RAM queue (optional Flash overflow area) | Buffer while offline, catch up when connectivity returns — offline-first, same as the [mobile app](../mobile-app/README.md) |

> Flash is not a hard disk: **it wears out, writes by page, erases by block, and corrupts on power loss.** Every persistence design must answer "what happens if power dies halfway through a write?"

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: Bare-metal super-loop, or an RTOS? ⭐**
- Bare metal (a `while(1)` polling loop): zero dependencies, minimal memory footprint, fully predictable behavior; but the moment tasks multiply, timing coupling becomes a disaster.
- RTOS: task isolation, priority preemption, a mature ecosystem; the price is a few KB to tens of KB of memory plus mental load (priority inversion, stack overflows).
- **Leaning**: with ≤3 features and no networking, bare metal is enough; **the moment "connectivity + business logic + low power" coexist, adopt an RTOS** — a small price for decoupled tasks.

**Decision 2: OTA with a single slot or A/B dual slots? ⭐**
- Single slot (overwrite in place): saves half the Flash; but **power loss mid-write = a brick**, with only a non-upgradable bootloader as a safety net.
- A/B dual slots: double the Flash, in exchange for "any step can fail and you still return to the old version."
- **Leaning**: mass-produced devices get A/B, no exceptions. Going up one Flash size costs a few cents to about one RMB per unit — multiplied by a million units, that is hundreds of thousands to millions — but a single brick-recall of 0.1% burns through more than that. **This accounting question works out.** If Flash truly cannot stretch, at minimum keep a dedicated recovery partition.

**Decision 3: Intelligence on-device, or in the cloud?**
- Cloud compute: cheaper device, iterable algorithms; but no network means a paperweight, and latency is uncontrollable.
- On-device compute: works offline, responds fast, better privacy; but chip cost rises and the algorithm is frozen.
- **Leaning**: **the "safety fallback" must be local** (a door lock must still open with the network down); experience enhancements can go to the cloud. The litmus test: after 24 hours offline, would the user still accept this device?

**Decision 4: How does one firmware serve multiple hardware revisions?**
- One firmware branch per hardware revision: clear, but versions explode and maintenance becomes hell.
- A single firmware that reads the hardware revision at boot and adapts dynamically: slightly larger binary, but one codebase, one production line.
- **Leaning**: single firmware + HAL-level adaptation + a board configuration table. **Branches are for "different architectures," not for "we swapped a sensor."**

## 9. Scaling & Bottlenecks

Embedded "scale" is not traffic — it's **device count × hardware revisions × years in the field**:

- **First bottleneck: field problems you cannot investigate.** 0.1% anomalies across 100,000 units = 100 angry users, and without logs it's a cold case. → Fix: black box + automatic crash-context upload + a remote diagnostics channel.
- **Second bottleneck: one OTA push takes down a whole cohort.** → Fix: staged rollout (1% → 10% → 100%) + a circuit breaker on upgrade failure rate + an observation window per batch — same as batch distribution in the [IoT platform](../iot-platform/README.md).
- **Third bottleneck: SKU explosion, the firmware matrix spins out of control.** → Fix: HAL + config tables converge onto a single firmware; the production line uses one shared factory-test firmware.
- **Fourth bottleneck: Flash wear runs out (5 years into deployment).** → Fix: wear leveling, reduced log frequency, and an erase-cycle budget computed for a 10-year life from day one.

## 10. Security & Compliance Essentials

- **Secure Boot**: the bootloader verifies the firmware's signature; unsigned code does not run — keeping the device from being reflashed into a botnet zombie.
- **Firmware signing + encrypted transport**: OTA packages must be signature-verified, preventing a man-in-the-middle from slipping in a backdoor.
- **Keys must not lie around in Flash**: use the chip's secure storage / a secure element; one key per device, so that "crack one = crack all" cannot happen.
- **Lock the debug ports**: production firmware must close or lock JTAG/SWD (readout protection / authenticated debug / fusing) — otherwise you are handing the firmware binary over for free. Leave a path for RMA and failure analysis: "authenticated debug" (temporarily reopened with a key) is more common than one-shot permanent fusing.
- **Compliance**: wireless devices need RF certification (SRRC/FCC/CE); consumer data has privacy regulations; categories like smart locks carry mandatory safety standards on top.

## 11. Common Pitfalls / Anti-patterns

- ❌ **Heavy work in interrupts (algorithms, packet sends, Flash writes)** → ✅ the ISR only grabs data + posts a message; heavy work queues up for a task.
- ❌ **Feeding the watchdog from a timer, so the dog gets fed while the main logic is dead** → ✅ the feeding condition = every critical task has checked in alive; only then does the dog mean anything.
- ❌ **OTA with no rollback — "we tested it, it will not fail"** → ✅ upgrade failure is not an if, it's a when: A/B + self-check + automatic rollback.
- ❌ **Casual dynamic malloc everywhere** → ✅ after months of uptime, fragmentation = a hidden bomb; the embedded convention is static allocation at boot, no malloc at runtime (or memory pools only).
- ❌ **Logging that depends on plugging in a serial cable** → ✅ there is no serial cable after the device ships: black box + remote upload is the production-grade answer.
- ❌ **Leaving "power saving" as a final optimization** → ✅ power is an architectural property: wake cadence, batched reporting, peripheral power sequencing are all design-time decisions.

## 12. Evolution Path: MVP → Growth → Maturity (how to set it up at each stage)

| Stage | Scale | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **MVP / prototype** | Dozens of units | Bare metal or a lightweight RTOS; first make the sensor→actuator chain work end to end; OTA can wait, debug over serial | Validating hardware choices and core features — do not rush to build the skyscraper |
| **Small batch** | Thousands of units | Adopt RTOS + HAL layering; A/B OTA must be in place (from this batch on, you cannot take them back); a basic black box | The upgrade channel and the log channel — your last chance before they leave the factory |
| **Mass production** | 100K–1M+ units | Single firmware across hardware revisions, staged OTA + circuit breaker, automatic crash upload, factory-test firmware, Secure Boot fully on | Brick rate, return rate, SKU convergence, Flash wear budget |

## 13. Reusable Takeaways

- 💡 **The essence of a HAL is "locking your most unstable dependency into your thinnest layer"** — true for chips, and just as true for third-party APIs (same as the adapters in the [AI gateway](../ai-gateway/README.md)).
- 💡 **The state machine is the universal weapon against "unexpected state combinations"**: explicitly enumerated states are far more testable than if-else scattered everywhere — payment order transitions (see the [payment system](../payment-system/README.md)) are the same move.
- 💡 **A/B dual slots = the embedded edition of blue-green deployment**: any system where "an update can kill" is worth paying double the storage for "return to the previous version at any time."
- 💡 **"The ISR only posts messages, never works" = separating receipt from processing**: the same peak-shaving idea as web systems where "the entry point only enqueues, workers consume at their own pace."
- 💡 **Hard resource constraints force good design**: where memory is counted in KB there is no "pile it on now, optimize later"; that discipline of "budgeted architecture" benefits resource-rich systems just as much.

## 🎯 Quick Quiz

<Quiz
  question="What is the core goal of OTA upgrade design?"
  :options="['Download as fast as possible', 'Any step can fail and the device still returns to a working old version', 'Make the upgrade package as small as possible']"
  :answer="1"
  explanation="Bricking is the number-one OTA risk: A/B dual slots + signature verification + boot self-check + automatic rollback turn an upgrade failure from a disaster into a return to yesterday. Speed and package size are optimizations; rollback capability is the line between life and death."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **engineering resources**.

**🔧 Open-source prototypes (you can read the code directly):**
- [zephyrproject-rtos/zephyr](https://github.com/zephyrproject-rtos/zephyr) — a modern RTOS under the Linux Foundation; its layering (kernel / drivers / subsystems / HAL) and device-tree abstraction are the textbook implementation of "swap the chip, change only the bottom layer."
- [FreeRTOS/FreeRTOS](https://github.com/FreeRTOS/FreeRTOS) — the most widely deployed open-source RTOS; a minimal, readable implementation of tasks / queues / priority scheduling, the first stop for understanding the "RTOS kernel layer."
- [mcu-tools/mcuboot](https://github.com/mcu-tools/mcuboot) — a cross-RTOS secure bootloader; the standard reference implementation of A/B slots, signature verification, and upgrade rollback, matching Scenario 2 in Section 6 of this template.
- [espressif/esp-idf](https://github.com/espressif/esp-idf) — the official ESP32 framework; a complete engineering sample of the entire "connectivity + OTA + low power" service layer.

**📖 Engineering blogs / documentation:**
- [Memfault Interrupt: Device Firmware Update Cookbook](https://interrupt.memfault.com/blog/device-firmware-update-cookbook) — a long-form engineering guide to embedded OTA: partition layout, rollback, version management, matching Decision 2 in Section 8.

---

> 📌 Remember embedded firmware in one line: **it is the system where "errors have nowhere to escape" — so layering locks down hardware change, the state machine locks down business chaos, and the watchdog plus dual slots lock down everything you did not foresee. Every design decision answers one question: 'When this device fails in the user's hands, what keeps it alive?'**
