# Robotics System — Architecture Template

> **Representative products / prototypes**: robot vacuums, warehouse AGVs / AMRs, delivery robots, drones; open-source prototypes ROS 2, PX4, Nav2
> **One-line definition**: Make a machine run a millisecond-level **sense → localize → plan → control** loop in the physical world — where every sensor lies, no action can be undone, and one person has to manage a hundred robots.

---

## 1. One-Line Definition

A robotics system = **one real-time "perception → planning → control" pipeline + one independent safety bypass + one cloud-side fleet brain**.

Two things fundamentally separate it from an ordinary backend system: **① the physical world has no Ctrl+Z** — a bad database write can be rolled back, but hitting a shelf is hitting a shelf; **② the input is always dirty** — lasers are noisy, wheels slip, GPS drifts, and the whole system is built on a foundation of "fighting uncertainty with probability." The entire mission of the architecture is to put "smart but slow" decisions and "simple but fast" reflexes each in their proper place.

## 2. Business Essence: What Problem Does It Solve?

What robots sell is **swapping human labor out of repetitive, heavy, dangerous physical work**: warehouse hauling, floor cleaning, last-mile delivery, inspection. The math is easy: one robot replaces 0.5–2 workers, with a 1–3 year payback period.

But the business lives or dies not on "can it move," but on the **autonomy rate**: a robot that needs a human rescue once an hour hands all its savings back to operations. So the real exam question for the architecture is: **how much can the machine recover from on its own when things go wrong? And when it can't, how many robots can one remote operator manage at once?** That determines whether the unit economics hold up.

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Perception and state estimation: where am I? what's around me? (localization, mapping, obstacle detection)
- [ ] Planning: global path + local obstacle avoidance
- [ ] Control: turn plans into motor commands, closed-loop at millisecond scale
- [ ] Task execution: accept order → navigate → do the work (grasp / clean / deliver)
- [ ] Safety: E-stop, collision avoidance, graceful degradation on faults
- [ ] Fleet management: dispatch, monitoring, remote takeover, OTA

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Control-loop timing** | Stable 100 Hz–1 kHz control cadence | Timing jitter = motion jitter = collision risk |
| **Safety** | No single fault hurts a person | Robots share physical space with humans |
| **Autonomy rate** | The longer without human intervention, the better | Determines the unit economics (see above) |
| **Testability** | Simulation can reproduce real-world problems | Real-robot testing is expensive, slow, and dangerous |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Physics is irreversible**: an executed action cannot be recalled; "ship first, fix bugs later" breaks things here.
- 🔴 **Sensors cannot be trusted**: every observation carries noise; "current position" is forever a probabilistic estimate, never a fact.
- 🔴 **Onboard compute / battery are limited**: the compute budget and power budget are hard constraints, same as an [embedded device](../embedded-device/README.md).
- 🔴 **The network cannot be relied on**: warehouses have dead zones, roads have tunnels — **the safety loop must live entirely on the robot**.

## 4. Architecture Overview

```
 Cloud (fleet layer, may be offline)   Dispatch │ Fleet monitoring │ Remote takeover │ OTA │ Data upload
                          ▲
                          │ Wireless network (intermittent; carries tasks and status only, never safety)
 ─────────────────────────┼─────────────────────────────────────
 Robot (autonomous loop)  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Task layer (~1 Hz): task state machine (order/navigate/work/charge) │
   ├──────────────────────────────────────────────────────────────┤
   │ Planning layer (~10 Hz): global path planning + local replanning    │
   ├──────────────────────────────────────────────────────────────┤
   │ Perception layer (10–30 Hz): sensor fusion → state estimation       │
   │   lidar/camera/IMU/wheel odom ──▶ filter fusion ──▶ pose + obstacle map │
   ├──────────────────────────────────────────────────────────────┤
   │ Control layer (100 Hz–1 kHz): trajectory tracking → motor commands (RTOS) │
   └──────────────────────────────────────────────────────────────┘
      Between layers: message middleware (pub/sub, recordable and replayable)
   ═══════════════════════════════════════════════════════════════
   Safety bypass (independent of everything above):
   E-stop button + safety lidar/bumper strip ──▶ safety controller ──▶ cut torque + spring-applied brakes
   (independent of the main computer, of non-safety software, and of the network)
```

> The soul is two things: **① frequency layering** — the lower you go the faster and dumber, the higher you go the slower and smarter; the chain of command is a single line, task → planning → control (the perception layer issues no commands — it is a data source feeding planning and control), and nothing reaches past its level to touch the motors; **② an independent safety bypass** — the E-stop cuts power through an independent safety loop, so even if the entire main software stack dies, the robot still stops. (Note: the safety controller runs software too — but it is safety-certified, independently redundant software; the stop can be an immediate torque-off or a controlled deceleration followed by a stop. The key property is independence, not "software-free.")

## 5. Component Responsibilities

- **Sensor fusion / state estimation**: fuses contradictory observations (the wheels say we moved 1 m, the lidar says 0.95 m) into an optimal pose estimate. *Why it's needed*: every single sensor has a fatal blind spot (wheels slip, lidar meets glass, cameras hate backlight); complementary fusion is the only answer to "all the sensors are lying."
- **Global planner**: computes a route from A to B on the map. *Why it's needed*: local vision walks into dead ends; you need a global view to set the overall direction.
- **Local planner / obstacle avoidance**: recomputes the next few meters at high frequency, dodging people and goods that suddenly appear. *Why it's needed*: the world is dynamic and a global path goes stale within seconds; "keep the big direction, adjust the small moves in real time" is the essence of hierarchical planning.
- **Controller (real-time loop)**: turns a trajectory into per-motor, per-millisecond commands. *Why it's needed*: the stability of a physical system rests on a fixed-cadence closed loop; this layer must run in a real-time environment, isolated from the "smart but jittery" layers above.
- **Task state machine**: manages the "accept order → go to A → work → return to charge" business flow and its exception branches. *Why it's needed*: same as [embedded firmware](../embedded-device/README.md) — an explicit state machine is the weapon that tames exception branches, and robots have exceptionally many (stuck / lost / low battery / human intrusion).
- **Message middleware (pub/sub)**: modules communicate decoupled through topics, with recording and replay support. *Why it's needed*: see Decision 2 — "being able to record the scene and replay it" is the lifeline of robotics development velocity.
- **Safety controller (independent)**: E-stop, safety-zone detection, hardware-level power cutoff. *Why it's needed*: safety cannot depend on the assumption that "the software is all working."
- **Fleet cloud platform**: dispatch, status monitoring, remote takeover, OTA. *Why it's needed*: the key to scale — 100 robots backstopped by 1–2 remote operators, not 10 on-site chaperones.

## 6. Key Data Flows

**Scenario 1: One obstacle avoidance (the sense→plan→control loop in action)**
```
1. Lidar spots a pedestrian 3 m out → perception layer updates the local obstacle map (30 Hz)
2. Local planner sees the current trajectory hits them → replans at 10 Hz: slow down + detour
3. Controller tracks the new trajectory at 200 Hz, smoothly outputting motor commands
4. Whole loop <200 ms; if the pedestrian suddenly gets too close (safety lidar near-field trigger)
   → the safety bypass acts: cut torque + spring-applied brakes, without waiting for any upper layer
   ── Routine avoidance takes the smart slow path; last-ditch collision avoidance takes the dumb fast path
```

**Scenario 2: One task (dispatched from the cloud, executed autonomously onboard)**
```
1. Cloud dispatcher: "Robot 3, fetch from shelf B7 and deliver to the packing station"
   (it assigns the task; it does not teleoperate)
2. Task state machine accepts → global planning → drives while avoiding obstacles (no network needed)
3. Network drops mid-route: the task continues as normal, status is cached locally,
   reported once connectivity returns
4. Arrive, do the work → report completion → low battery auto-inserts a charging task
   ── The cloud is a foreman, not a remote control: losing the network only blocks new
      orders, never the job in progress
```

**Scenario 3: The life of a bug (record → replay → simulation regression)**
```
1. A robot keeps getting stuck at one corner on site → operations exports the scene bag
   with one click (all sensor topics + internal state, black-box style)
2. An engineer replays the bag locally: fully reconstructing the world the robot "saw"
3. Root cause is a local-planner parameter → fix → run 1000 similar scenarios in
   simulation as regression
4. Pass → OTA canary to 10 robots and observe → full rollout
   ── Without "record-replay + simulation," every bug means someone camping on site
      waiting for it to happen again
```

## 7. Data Model & Storage Choices

Core data: `maps` (occupancy grid / semantic map); `live topic streams` (sensors / pose / commands); `task and trajectory logs`; `scene bags`; `fleet state`.

| Data | Storage type | Why |
|---|---|---|
| Maps | Files / object storage, versioned | Remap when the environment changes; multiple robots share the same map version |
| Live topics | Never hit disk, in-memory pub/sub | Millisecond lifetimes; selectively record by topic when needed |
| Scene bags | Onboard ring buffer → cloud object storage | The minutes around an incident are the most valuable — black-box thinking |
| Task / event logs | Cloud relational + time-series | Raw material for ops reports (autonomy rate / mileage / rescue count) |
| Live fleet state | In-memory KV | The dispatcher needs sub-second lookup of every robot position and battery |

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: Put the intelligence on the robot, or in the cloud? ⭐**
- Cloud brain: unlimited compute, algorithms iterate fast, multi-robot global optimum; but network latency and outages directly threaten safety.
- Onboard autonomy: the safety loop does not depend on the network; but compute is limited and updates must go through OTA.
- **Leaning**: **safety and the motion loop 100% onboard; global dispatch, multi-robot coordination, and learning/training in the cloud.** Same dividing line as [industrial edge](../industrial-edge/README.md): if being late causes harm, it does not cross the network.

**Decision 2: pub/sub middleware between modules, or direct function calls?**
- Function calls: lowest latency, no middleware cost; but modules are welded together — no unit testing, no record-replay.
- pub/sub topics: decoupled modules, recordable, replayable, simulator-swappable (the simulator publishes fake lidar topics and downstream never notices); the cost is serialization overhead and scheduling nondeterminism.
- **Leaning**: **pub/sub for the bulk of development (record-replay is the velocity lifeline); shared memory / in-process calls for the inner control loop (motor level).** The success of the ROS ecosystem proves the former; countless "topic latency caused control jitter" scars prove the latter.

**Decision 3: Simulation first, or real robot first?**
- Real-robot first: the most realistic; but one experiment takes half an hour, breaking a robot costs tens of thousands, and dangerous scenarios (hitting people) simply cannot be tested.
- Simulation first: run thousands of simulation instances in parallel (equivalent to 1000x speed) for tens of thousands of trials, fabricate dangerous scenarios at will; but simulation and reality always diverge (the sim-to-real gap).
- **Leaning**: **simulation as the CI gate (every change runs the regression scenario library), real robots for final acceptance**; feed scene bags back into simulation to keep shrinking the gap. Same idea as [eval-driven architecture](../../tutorial/25-评测驱动把够好写进架构.md), except what is being evaluated is physical behavior.

**Decision 4: Multi-robot coordination — central dispatch, or distributed negotiation?**
- Central dispatch: globally optimal (who crosses the intersection first, how tasks split), logic that is easy to understand and debug.
- Distributed negotiation: no single point, robust to network loss; but hard to debug and hard to guarantee a global optimum.
- **Leaning**: **central dispatch at the task level + local yielding at the motion level.** The mainstream answer for hundred-AGV warehouses: the cloud does the scheduling, and when two robots meet in a narrow aisle they sort it out themselves — the center owns strategy, the robot owns tactics.

## 9. Scaling & Bottlenecks

Scaling a robotics business = robot count × scenario diversity × autonomy rate:

- **First bottleneck: the human-to-robot ratio.** On-site chaperones work for 10 robots; at 100 you must go remote — in structured settings like warehouses, 1–2 remote operators backstopping 100 robots is achievable (public-road fleets run far lower ratios). → Fix: fleet platform + remote-takeover stations + a self-recovery playbook (stuck → auto back-up and retry; lost → auto relocalize).
- **Second bottleneck: long-tail scenarios.** The routine 99% is easy; the remaining 1% (reflective floors, temporary construction) eats all of operations. → Fix: scene bags flow back automatically → scenario library → simulation regression, turning every crash into a permanent test case.
- **Third bottleneck: multi-robot congestion.** As the count rises, narrow aisles and charging docks become hot resources. → Fix: traffic shaping in the dispatch layer (staggering / one-way-lane rules / charge queueing) — the same playbook as urban congestion management.
- **Fourth bottleneck: map maintenance.** The environment changes daily (shelves move, holiday decorations go up), and a stale map = the whole fleet gets lost. → Fix: lifelong mapping that updates while driving + crowdsourced multi-robot map merging + change-detection alerts.

## 10. Security & Compliance Essentials

- **The safety hierarchy**: hardware E-stop (last line of defense, cuts power directly) > safety controller (independent loop, stops on close range) > software avoidance (routine courtesy). **The upper layers may be smart; the bottom layer must be reliable** — certification only recognizes the independent loop, never "the AI says it will dodge."
- **Human-robot shared zones**: speed limits, light and sound warnings, tiered slowdown by safety distance — regulations (e.g. machinery safety standards) impose hard requirements on collaborative settings.
- **Safety boundaries of remote takeover**: teleoperation has network latency, so low speed only; takeover commands need authentication + auditing to prevent remote hijacking.
- **Data compliance**: footage that robot cameras capture in warehouses / streets involves face and location privacy and must be anonymized before upload; mapping-grade geodata is strictly regulated in some countries (e.g. China).
- **OTA security**: same as [automotive](../automotive-ee/README.md): signing, canary rollout, conditional gates (only update while on the charging dock), rollback on failure.

## 11. Common Pitfalls / Anti-patterns

- ❌ **E-stop / safety stop depending on Wi-Fi or the main software path** → ✅ the safety bypass is its own loop; even a total main-stack crash still stops the robot.
- ❌ **Trusting a single sensor** (dead-reckoning position from wheel encoders alone) → ✅ multi-sensor fusion; odometry drift is a certainty, not an accident.
- ❌ **Running the control loop and business logic together** (a planner stall starves the motors of commands) → ✅ frequency layering + real-time isolation; the control cadence is sacred.
- ❌ **Testing only on real robots** → ✅ simulation regression as the CI gate; the real robot is for acceptance, not the main battlefield.
- ❌ **No record-replay, reproducing bugs by camping on site** → ✅ pub/sub + black-box bags, bringing the scene back to your desk.
- ❌ **Treating the cloud as a remote control, so a network drop strands the robot** → ✅ the cloud only assigns tasks; the autonomous loop lives entirely onboard.

## 12. Evolution Path: MVP → Growth → Maturity (how to set it up at each stage)

| Stage | Scale | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **MVP / prototype** | 1–3 robots | The full ROS 2 stack (off-the-shelf mapping / navigation / avoidance), one fixed scenario running end to end; the safety bypass exists from day one | Prove the single-robot loop works; do not rush into building your own planner |
| **Small-batch deployment** | 10–50 robots | Harden the task state machine's exception branches, fleet platform (monitoring + remote takeover), simulation regression library, OTA channel | Autonomy rate and human-to-robot ratio — operations cost decides life or death |
| **Scaled operations** | Hundreds+ | Central dispatch + traffic shaping, the data flywheel (scene bags → scenario library → simulation → OTA), multi-robot map collaboration, deep control-loop optimization | Long-tail convergence speed, per-robot economics, ability to replicate across new sites |

## 13. Reusable Takeaways

- 💡 **Frequency layering: fast layers are dumb, slow layers are smart, each keeps its cadence and never reaches past its level** — high-frequency trading (matching inner loop vs strategy outer loop) and game engines (render frames vs logic ticks) are the same shape.
- 💡 **Keep the safety bypass independent of the main path**: a backstop must never share failure modes with the system it backstops — the same reason your last database backup does not live in the same cloud.
- 💡 **pub/sub + record-replay = turning the production scene into a replayable test case** — an efficiency lever for any system where "the scene is hard to reproduce" (trade matching, real-time risk control).
- 💡 **Treat dirty input in the language of probability**: an observation is not a fact; estimate + confidence are the first-class citizens — the same worldview as fraud detection and sensor analytics.
- 💡 **Every crash becomes one regression case**: long-tail problems are not fixed by being clever; they are ground down by a scenario library that only ever grows.

## 🎯 Quick Quiz

<Quiz
  question="How should a robot's E-stop path be designed?"
  :options="['The app issues an E-stop command, relayed to the robot via the cloud', 'An independent safety loop cuts motor power directly, bypassing the software stack and the network', 'Add a highest-priority stop function inside the navigation module']"
  :answer="1"
  explanation="Safety cannot rest on the assumption that the software is healthy and the network is up — the E-stop must run through an independent hardware loop that still stops the robot even if the entire main software stack dies. A backstop that shares failure modes with the system it backstops is no backstop at all."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects**.

**🔧 Open-source prototypes (you can read the code directly):**
- [ros2/ros2](https://github.com/ros2/ros2) — the de facto standard robotics middleware: pub/sub topics, record-replay, componentized nodes; the prototype behind this template's "message middleware" section.
- [ros-navigation/navigation2](https://github.com/ros-navigation/navigation2) — the official ROS 2 navigation stack: a layered implementation of global planning / local avoidance / recovery behaviors, matching Scenario 1 in Section 6.
- [PX4/PX4-Autopilot](https://github.com/PX4/PX4-Autopilot) — open-source drone flight control: a textbook of real-time control loop + state estimation (EKF) + failsafe protection, and the ultimate specimen of "frequency layering."

**📖 Design documentation:**
- [ROS 2 design documents](https://design.ros2.org/) — the official design rationale collection: why DDS, how real-time guarantees are made, and the architectural differences from ROS 1 — reading the original decision documents beats reading the conclusions.

---

> 📌 Remember a robotics system in one line: **it's the layered cohabitation of "smart but slow" and "simple but fast" — perception and planning think in probabilities up top, control reflexes hold a rigid cadence at the bottom, and the safety bypass stands apart from everything. Every design decision answers one question: 'The sensors are lying, the network will drop, and no action can be taken back — how does the machine stay fast, stable, and harmless anyway?'**
