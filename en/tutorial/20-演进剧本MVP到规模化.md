# 20 · Evolution Playbook: MVP → Scale

> The thesis in one line: **the "first version" designed in [ch. 19](19-完整设计演练中等复杂度系统.md) will never be its final form. This chapter follows that same AI customer-service system through its three lives — watching how quantified signals push it to grow, one stage at a time, and how every "should we touch this?" is answered with a ruler, not a gut feeling.**

---

> **🎯 Practice track, ch. 3 · This chapter drills one thing**
>
> Drill **evolution judgment**: not "how to design," but "**when to upgrade, when to hold back**." It picks up from [ch. 08](08-架构决策记录与演进.md) (ADRs + when to evolve) and the [Appendix · When to Evolve (trigger signals)](https://github.com/study8677/awesome-architecture/blob/main/tutorial/演进触发信号.md), and lands them on the AI customer-service system from [ch. 19](19-完整设计演练中等复杂度系统.md).
>
> | By the end you should be able to | This chapter trains it via |
> |---|---|
> | Judge when to upgrade with quantified signals (not feelings) | The "trigger signals" between each stage |
> | Write one ADR for every upgrade | Three sample ADRs |
> | Recognize the two signals unique to AI system evolution | Cost drift + quality drift |

---

## Intro: don't force an MVP into the mature-phase blueprint

[Ch. 07](07-从0到1设计一个系统.md) said it, and it bites harder in AI systems: **architecture grows — never start by building toward the "tens-of-millions, multi-tenant" end state.** The diagram from [ch. 19](19-完整设计演练中等复杂度系统.md) is your **mental target**, not the **day-one look**.

In the real world, this AI customer-service system grows like this:

```
   Stage 1: MVP             Stage 2: Growth            Stage 3: Scale
   ┌──────────┐  cost /    ┌──────────┐  multi-tenant /  ┌──────────┐
   │ call API │  latency / │ +routing │  resilience /    │ +gateway │
   │ pure-    │  complaints│ +caching │  quality drift   │ +multi-  │
   │ vector   │ ─────────▶ │ +hybrid  │ ─────────────▶   │  active  │
   │ RAG      │            │  retriev.│                  │ +eval    │
   │ refunds  │  signals   │ +small   │  signals         │  gate    │
   │ manual   │  trigger   │  auto-   │  trigger         │ +tenant  │
   └──────────┘            │  refund  │                  │  isolat. │
        ▲                  └──────────┘                  └──────────┘
        └────────── every step is pushed by real signals, not feelings ──────────┘
```

> **The discipline of this chapter (and the taste from [ch. 09](09-架构品味.md)): no signal, no move.** Upgrading without a trigger is almost always over-engineering or chasing novelty. Each of the three stages below starts with **trigger signals**, then gives **upgrade actions**, and closes with an **ADR**.

---

## Stage 1 · MVP: call the API before building your own, keep humans before automating

**One goal only: validate whether "AI customer service" has actual users and produces trustworthy answers.** The rougher the better:

| Dimension | How MVP does it (deliberately minimal) |
|---|---|
| Model | **Call a hosted vendor API** — no self-built GPU |
| RAG | Off-the-shelf framework + **fixed-size chunking + pure vector search** — just make it run |
| Session | **Client carries history**, server is stateless and easily scalable |
| **Refunds** | **Model only answers questions, does not auto-refund** — anything touching money goes to **human approval** first |
| Cost | No routing / caching yet — **prove people use it before talking about saving money** |

Note the last two rows: **MVP hands the most dangerous things directly to humans.** That's not laziness — it's the most extreme, most friction-free version of [ch. 19](19-完整设计演练中等复杂度系统.md)'s "keep uncertainty outside the side-effect boundary" — **the human is the gate**. Once volume grows, automate the safe parts.

> This version deliberately racks up **conscious technical debt** (no cache, no routing, coarse chunking, manual refunds) — but [ch. 08](08-架构决策记录与演进.md) said it: **intentional MVP debt is often the right call, as long as you know what you owe and write it down.**

**First ADR — recording "why so rough":**

```
┌────────────────────────────────────────────────────────────┐
│  ADR-001: Use hosted model API in MVP; no self-built       │
│           inference                                        │
├────────────────────────────────────────────────────────────┤
│  Status: Accepted   Date: (pre-launch)   Deciders: arch.  │
│                                                            │
│  ── Context ──                                             │
│  The product is still validating "whether anyone uses AI   │
│  customer service." Traffic is unknown; the team has no    │
│  GPU ops experience. The biggest risk right now is         │
│  "built it and nobody came," not "it's too expensive."     │
│                                                            │
│  ── Decision ──                                            │
│  Call a hosted model API; use an off-the-shelf framework   │
│  for RAG; all refunds require human confirmation.          │
│  Explicitly defer cost reduction (routing/caching/         │
│  self-hosting) and automated refunds.                      │
│                                                            │
│  ── Options considered ──                                  │
│  A. Self-build GPU + continuous batching from day one      │
│     → Rejected: no traffic yet; self-building = burning    │
│     money on over-engineering, and it slows launch         │
│  B. Let the model auto-refund → Rejected: no baseline,     │
│     no monitoring — letting AI touch money is too risky    │
│                                                            │
│  ── Trade-offs & consequences ──                           │
│  + Fastest launch, lowest risk; money handled by humans    │
│    is safest                                               │
│  − Per-token cost is higher; manual refunds don't scale    │
│    (known debt — see trigger signals)                      │
└────────────────────────────────────────────────────────────┘
```

---

## Trigger signals ① → Stage 2 · Growth

The MVP is working, users are growing, and **these signals all turn red at once** — that's the license to upgrade, not "the boss says we need to be more AI-native":

| Measured signal (experience ranges) | Notes | Likely bottleneck |
|---|---|---|
| **Monthly model bill exceeds budget** (e.g., hits 1.5× budget) | AI-specific! Token burn is too high | No routing, no caching — even simple questions hit the big model |
| **Time-to-first-token P99 over threshold** (users getting impatient) | Experience-layer signal ([Appendix · When to Evolve](https://github.com/study8677/awesome-architecture/blob/main/tutorial/演进触发信号.md)) | Model call is slow + no caching |
| **"Off-topic answer" complaint rate > threshold** | AI-specific! Bad retrieval → hallucination | Pure vector + coarse chunking, poor recall |
| **Manual refund queue backing up** (human reviewers drowning) | Org / efficiency signal | All refunds manual — can't absorb the volume |

**Upgrade actions (fix only what's blocking you — don't rewrite everything at once):**

```
   MVP                                  Growth
   ───                                  ──────
   pure vector + coarse chunks  ──▶  hybrid retrieval (vector + keyword) + reranking + semantic chunking
   recompute system prompt each  ──▶  prompt caching (system prompt / knowledge prefix never recomputed)
   turn
   big model for everything      ──▶  model routing: FAQ → small model, complex questions only → big model
   client carries history        ──▶  session stored server-side (cross-device, enables long-term memory)
   all refunds manual            ──▶  small, low-risk refunds "automated" (the idempotent gate from ch. 19);
                                      large amounts still go to human review
   (no eval)                     ──▶  build first eval set: watch retrieval recall + answer quality
```

Note the "small-amount auto-refund": this is the moment we actually use the **deterministic + idempotent + state-machine** gate designed in [ch. 19](19-完整设计演练中等复杂度系统.md) — **human review shrinks from "every transaction" to "large amounts only"**, absorbing the volume while protecting the money.

**Two ADRs — recording the two most critical changes, cost and refunds:**

```
┌────────────────────────────────────────────────────────────┐
│  ADR-002: Introduce model routing + prompt caching         │
│           (cost trigger)                                   │
├────────────────────────────────────────────────────────────┤
│  Status: Accepted   Context: Monthly bill hit 1.6×         │
│  budget; FAQ-type queries are 70% of volume yet all        │
│  routed to the big model.                                  │
│  Decision: Simple FAQ / knowledge-base hits route to       │
│  small model or semantic cache; only complex questions     │
│  reach the big model + cached system-prompt prefix.        │
│  Options: A. Just swap to a cheaper big model → quality    │
│              falls below bar;                              │
│           B. Remove RAG to save tokens → hallucination     │
│              spikes, unacceptable.                         │
│  Trade-offs: + per-turn cost drops significantly;          │
│              − routing logic itself needs tuning;          │
│                occasional mis-routes.                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ADR-003: Automate small refunds; keep human review for    │
│           large amounts (queue-backlog trigger)            │
├────────────────────────────────────────────────────────────┤
│  Status: Accepted   Context: Manual refund queue backs     │
│  up hours daily; experience is poor and it doesn't scale. │
│  Decision: Refunds ≤ ¥500 with passing order-status        │
│  validation are executed idempotently by the deterministic │
│  refund service; > ¥500 still enters the human review      │
│  queue. The model only "proposes" — it never executes.     │
│  Options: A. Fully automated refunds → Rejected: large     │
│              erroneous refunds are irreversible;           │
│           B. Keep all-manual → Rejected: signals already   │
│              prove it can't scale.                         │
│  Trade-offs: + human-review volume plummets, experience    │
│                improves;                                   │
│              − threshold must be tuned against risk data;  │
│                reconciliation backstop is mandatory to     │
│                catch automation errors.                    │
└────────────────────────────────────────────────────────────┘
```

> 💡 Look at the "Context" fields of ADR-002 and ADR-003 — **every entry is a quantified signal; not one says "I have a feeling we should upgrade."** That's the ruler from [ch. 08](08-架构决策记录与演进.md).

---

## Trigger signals ② → Stage 3 · Scale

The growth stage has stabilized, the business keeps growing, and **a new class of signals appears** — many unique to AI systems and multi-tenant systems:

| Signal | Notes | Bottleneck |
|---|---|---|
| **Onboarding multiple merchant tenants** | Each tenant's knowledge base must not bleed into another's | Missing tenant isolation |
| **A single model provider outage takes the entire customer-service platform down** | Availability step-change ([Appendix · When to Evolve](https://github.com/study8677/awesome-architecture/blob/main/tutorial/演进触发信号.md): eliminate single points) | Model calls are a SPOF |
| **After a model upgrade or prompt change, production quality silently regresses** | AI-specific! Nondeterminism causes **quality drift** | No eval gate in CI |
| **Traffic spikes during promotions + cost continues to grow** | The mechanics of scale ([ch. 13](13-规模化的力学.md)) | Single region, no elasticity |

**Upgrade actions:**

```
   Growth                               Scale
   ──────                               ─────
   direct connection to one provider ──▶  AI gateway: multi-provider failover + unified billing & rate-limiting
                                          + semantic caching (see the ai-gateway template)
   single knowledge base             ──▶  multi-tenant isolation: knowledge base namespaced per tenant;
                                          retrieval enforced per-tenant (no cross-tenant recall)
   eval set run manually             ──▶  eval as CI gate: model upgrades or prompt changes must pass
                                          eval first; score drop blocks the deploy (prevents quality drift)
   single region                     ──▶  multi-active + elastic scaling (absorbs promotion spikes)
   logs via grep                     ──▶  full-chain trace: every round's retrieval / routing / tool / token
                                          is replayable
```

**The most critical ADR of Stage 3 — also the one unique to AI system evolution:**

```
┌────────────────────────────────────────────────────────────┐
│  ADR-005: Eval set becomes CI gate (quality-drift trigger) │
├────────────────────────────────────────────────────────────┤
│  Status: Accepted                                          │
│  Context: After the last model version upgrade, answers    │
│  to a certain class of policy questions silently           │
│  degraded — discovered two weeks later from complaints.    │
│  Nondeterminism means "quality regression" cannot be       │
│  caught by traditional assertions (same input does not     │
│  guarantee same output).                                   │
│  Decision: Maintain a representative "question → expected  │
│  key points" eval set. Before upgrading the model,         │
│  changing a prompt, or changing retrieval strategy, CI     │
│  runs eval (rules + LLM-as-judge scoring). Scores below    │
│  baseline are blocked unconditionally — no deploy.         │
│  Options: A. Manual spot-checks → Rejected: misses         │
│              regressions, slow, unsustainable;             │
│           B. Freeze model version, no upgrades →           │
│              Rejected: forfeits all gains from model       │
│              improvement.                                  │
│  Trade-offs: + "good enough" is quantified; silent         │
│                regressions are blocked;                    │
│              − eval set needs continuous maintenance;      │
│                scoring itself has a cost (this is the      │
│                theme of ch. 22).                           │
└────────────────────────────────────────────────────────────┘
```

> **Architectural wisdom**: traditional systems guard quality with "same input → same output" assertions; **AI systems have had that bedrock pulled out from under them ([ch. 17](17-大模型时代的架构判断.md)), so quality can only be guarded by "eval set + scoring" over a distribution.** That's why "eval as a gate" for AI systems isn't a nice-to-have — it's the **brakes against regression during evolution**. Without it, every "model upgrade" is a blind gamble.

---

## Master table: signal → upgrade → ADR

| Stage | Trigger signals | Upgrade actions | ADR |
|---|---|---|---|
| MVP | (starting point) | Call API, pure-vector RAG, manual refunds | ADR-001 |
| → Growth | Bill over budget / P99 over threshold / high complaint rate / human-review backlog | Routing + caching, hybrid retrieval + reranking, server-side sessions, small-amount auto-refunds, build eval set | ADR-002/003 |
| → Scale | Multi-tenant / provider SPOF / quality drift / traffic spikes | AI gateway failover, multi-tenant isolation, eval in CI gate, multi-active, full-chain trace | ADR-004/005 |

**Two signals unique to AI system evolution — signals traditional systems never have. Watch them closely:**

1. **Cost drift**: token bills burn **linearly or even super-linearly** with scale. Traditional systems can "launch first, optimize cost later" — AI systems **that ignore cost will see their margins evaporate overnight**.
2. **Quality drift**: any change to the model version, prompt, or retrieval strategy can cause quality to **silently regress with no warning**. Must use eval as a gate to catch it proactively.

---

## 🎯 Quick check

<Quiz
  question="After an AI customer-service system launches, which of the following is a valid basis for upgrading the architecture?"
  :options="['The team feels the current code is not AI-native enough and should be refactored to something more sophisticated', 'The monthly token bill hit 1.6× budget, with FAQ queries making up 70% of volume yet all routed to the big model — cost is bottlenecked by a real, measured constraint', 'A competitor shipped multi-agent, so we should too']"
  :answer="1"
  explanation="Upgrading architecture carries enormous cost and risk — it must be done to unblock a quality attribute that is genuinely, quantifiably bottlenecked. 'Not AI-native enough' and 'competitors did it' are feelings and bandwagon-jumping; only measured cost/latency/quality signals are valid grounds. No signal, no move."
/>

<Quiz
  question="Why is 'eval set as CI gate' especially important for AI system evolution, when traditional systems rarely need it?"
  :options="['Because AI system code is more complex', 'Because AI systems are nondeterministic: the same input does not guarantee the same output, so traditional equality assertions break down; model upgrades or prompt changes can silently regress quality, and only eval set + scoring can guard the quality distribution', 'Because CI runs faster']"
  :answer="1"
  explanation="Traditional systems guard quality with 'same input → same output' assertions; LLMs pull that deterministic bedrock out. Quality drift is silent. You must use eval (rules + LLM-as-judge) as a gate to actively block regressions — this is the brake unique to AI system evolution."
/>

---

## Chapter summary

- **Don't force the mature-phase blueprint onto an MVP**: the same AI customer-service system has three lives — a call-API MVP → a growth phase with routing / caching / hybrid retrieval / small-amount auto-refunds → a scale phase with gateway / multi-tenant / eval gate / multi-active.
- **MVP hands the most dangerous things to humans**: all-manual refunds are the most friction-free version of "keep uncertainty outside the side-effect boundary"; automate the safe parts only once volume warrants it.
- **Every upgrade is triggered by quantified signals, not feelings**: billing, P99, complaint rate, human-review backlog, provider SPOF, quality drift — no signal, no move (the taste of [ch. 08](08-架构决策记录与演进.md) / [ch. 09](09-架构品味.md)).
- **Write one ADR for every upgrade**: the Context field is all signals — that's the decision audit trail.
- **Two signals unique to AI system evolution**: **cost drift** (token burn scales linearly) and **quality drift** (nondeterminism causes silent regressions) — managed with "cost monitoring + model routing" and "eval as a gate," respectively.

> **Bridging forward**: as you reach the tail end of the scale stage, a new problem surfaces: orchestration, RAG, tools, billing, refunds — all crammed into **one deployment unit** for speed. Now, changing anything breaks everything, nobody dares touch it, and multiple teams block each other — the "org / efficiency" red lights in the [Appendix · When to Evolve](https://github.com/study8677/awesome-architecture/blob/main/tutorial/演进触发信号.md). The next chapter, [21 · Splitting & Migration in Practice](21-拆分与迁移实战.md), swaps the engine on this **AI customer-service system mid-flight**: using the strangler fig, parallel run, and zero-downtime migration from [ch. 14](14-演进与拆分大型系统.md) to safely pull it apart piece by piece.

---

## Related links

- The system being evolved: [19 · Full Design Walkthrough: Medium Complexity](19-完整设计演练中等复杂度系统.md) — this chapter evolves it
- Core methodology: [08 · ADRs & Evolution](08-架构决策记录与演进.md) (ADRs + when to evolve), [Appendix · When to Evolve (trigger signals)](https://github.com/study8677/awesome-architecture/blob/main/tutorial/演进触发信号.md) (quantified signal quick-reference)
- AI-specific constraints: [17 · Architecting in the Age of LLMs](17-大模型时代的架构判断.md) (cost / nondeterminism)
- Scale mechanics: [13 · The Mechanics of Scale](13-规模化的力学.md) · compare with the [AI Chat Product](../templates/ai-chat-product/README.md) evolution roadmap
