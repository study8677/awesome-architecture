# 📚 Tutorial: Think Like an Architect

> This tutorial teaches no language and no framework.
> It teaches a transferable, **never-expiring** skill: thinking the system through *before* you write code.

---

## What problem does this tutorial solve

Plenty of people write code for years and still can't draw their own system's architecture, nor explain "why this and not that." The reason: **schools and tutorials almost all teach "implementation," and very few systematically teach "judgment."**

- Implementation ability answers: *how do I build this feature?*
- Architectural judgment answers: *what should this system look like? where will it break? what am I trading for what?*

This tutorial is the missing lesson on judgment.

---

## Learning path

The tutorial is organized as a sequence of tracks. **Reading in order is recommended**, but each chapter also stands on its own.

### Part 1 · Build the mindset (01–03) — a new way of seeing systems

| Ch. | In one line |
|---|---|
| [01 · Why architectural thinking comes first](./01-为什么先有架构思维) | In the age of AI writing code, judgment is scarcer than implementation. |
| [02 · The architect's thinking framework](./02-架构师的思考框架) | Any system can be cracked open with "requirements → constraints → quality attributes → trade-offs." |
| [03 · Reading & drawing architecture diagrams](./03-读懂与画好架构图) | Use the C4 model to get the system out of your head and into a picture others understand. |

### Part 2 · Master the toolbox (04–06) — what cards an architect actually holds

| Ch. | In one line |
|---|---|
| [04 · Ten core architecture patterns](./04-十大核心架构模式) | Layered, microservices, event-driven, CQRS… each pattern answers a specific problem. |
| [05 · Data & state](./05-数据与状态) | The hard part of a system isn't the logic — it's where data lives, how it stays consistent, how it scales. |
| [06 · Quality attributes & trade-offs](./06-质量属性与取舍) | Performance, availability, consistency, cost — you can't have them all. |

### Part 3 · Practice & evolution (07–08) — put judgment to work

| Ch. | In one line |
|---|---|
| [07 · Designing a system from 0 to 1](./07-从0到1设计一个系统) | A methodology you can literally follow to produce an architecture. |
| [08 · ADRs & evolution](./08-架构决策记录与演进) | Record *why* you decided with ADRs, and let architecture grow with the business. |

### Part 4 · Beyond the framework (09) — turn judgment into taste

| Ch. | In one line |
|---|---|
| [09 · Architectural taste](./09-架构品味) | What truly separates good architects beyond the framework; grow it via real-world comparisons (microservices→monolith, big-company tastes). |

---

## 🚀 Advanced track (10–17) — taming the hard rock that bites once a system gets big or critical

The foundations teach you to design a small-to-medium system from scratch; **the advanced track handles a different class of problem** — distribution, failure, scale, evolution, organization, security — capped by architectural judgment in the LLM era.

| Ch. | In one line |
|---|---|
| [10 · Distributed systems: the hard truths](./10-分布式系统的硬道理) | Partial failure, no global clock, consensus is expensive — why distributed is hard. |
| [11 · The engineering of data consistency](./11-数据一致性工程) | No cross-service transactions: Saga, Outbox, idempotency, event sourcing. |
| [12 · Designing for failure: resilience](./12-为失败而设计) | Assume failure: circuit breakers, isolation, degradation, SLOs, chaos. |
| [13 · The mechanics of scale](./13-规模化的力学) | Sharding, consistent hashing, hot keys, multi-region, tail latency. |
| [14 · Evolving & splitting large systems](./14-演进与拆分大型系统) | Strangler fig, parallel run, zero-downtime migration, splitting the monolith. |
| [15 · Organization as architecture](./15-组织即架构) | Conway's law: systems mirror orgs; team topologies & platform engineering. |
| [16 · Security & multi-tenancy](./16-安全与多租户架构) | Security as structure: threat modeling, zero trust, blast radius, tenant isolation. |
| [17 · Architecting in the age of LLMs](./17-大模型时代的架构判断) | What stays irreplaceable in the vibe-coding era; gather theory to the present moment. |

---

## 🎯 Practice track (18–22) — put judgment on real cases

Foundations + advanced teach *how to judge*; **the practice track teaches how to drill** — threading [07](./07-从0到1设计一个系统), [08](./08-架构决策记录与演进), [10–16](./10-分布式系统的硬道理), and the `templates/` maps into one narrative. **Read this track before the AI-collaborative design track.**

| Ch. | In one line |
|---|---|
| [18 · Reading the map: deconstruct unfamiliar systems](./18-读地图用框架拆解陌生系统) | Four-step reverse-reading; practice on RAG / AI chat product maps. |
| [19 · Full design walkthrough: medium complexity](./19-完整设计演练中等复杂度系统) | Run the ch.07 eight-step flow again — design an AI customer-service assistant that looks up orders and issues refunds, from scratch. |
| [20 · Evolution playbook: MVP → scale](./20-演进剧本MVP到规模化) | Same AI assistant as ch.19: read quantified signals, write ADRs, decide when to upgrade. |
| [21 · Splitting & migration in practice](./21-拆分与迁移实战) | Land ch.14: strangler, branch by abstraction, shadow traffic, zero-downtime vector-store swap. |
| [22 · AI-native system design](./22-AI原生系统设计) | Upgrade the ch.19 assistant into an autonomous Agent; land ch.17's three new constraints; bridge to the next track. |

---

## 🤝 AI-collaborative design track (23–26) — collaborate with AI without losing judgment

**Prerequisite: practice track.** Not vibe-coding tool tips — **workflow & review**: how to write specs for AI, what output omits by default, eval as a gate, when to vibe vs spec-first. Same product line as the [architecture-copilot](https://github.com/study8677/architecture-copilot) skill.

| Ch. | In one line |
|---|---|
| [23 · Spec as architecture: constraints for AI](./23-规格即架构约束怎么写给AI) | Turn ADRs and quality goals into guardrails AI can follow. |
| [24 · Review checklist: what AI output omits by default](./24-审查清单AI产出默认缺什么) | Production review checklist from ch.11/12/16 — will this design hold up? |
| [25 · Eval-driven: bake "good enough" into architecture](./25-评测驱动把够好写进架构) | Eval gates for nondeterministic systems — catch silent regressions. |
| [26 · Collaboration decision tree: when to vibe, when to spec-first](./26-协作决策树何时vibe何时spec-first) | Prototype: vibe freely; production: close with judgment — the capstone workflow. |

---

## 🧰 Technology stack selection track (27–34) — turn "what tech to use" into architecture judgment

**Prerequisite: foundations + advanced track.** This is not a framework tutorial or a tool ranking. It applies [Chapter 02](./02-架构师的思考框架)'s "requirements → constraints → quality attributes → trade-offs" to languages, databases, cache, APIs, deployment, observability, and AI infrastructure.

| Ch. | In one line |
|---|---|
| [27 · Programming languages and backend frameworks](./27-编程语言与后端框架选型) | Language and framework choice combines runtime, ecosystem, team capability, and maintenance cost. |
| [28 · Databases and storage](./28-数据库与存储选型) | Draw the data lifecycle before choosing truth sources, read models, search, object storage, and vector stores. |
| [29 · Cache, message queues, and events](./29-缓存消息队列与事件系统选型) | Separate read hotspots, time mismatch, and fact broadcast before naming Redis or Kafka. |
| [30 · APIs and service communication](./30-API与服务通信选型) | Decide sync/async, internal/external, and contract strength before REST, gRPC, or GraphQL. |
| [31 · Cloud native and deployment platforms](./31-云原生与部署平台选型) | Cloud native is not "use K8s"; it is choosing a deployment and rollback model the team can operate. |
| [32 · Observability and reliability stack](./32-可观测性与可靠性技术栈选型) | Work backward from user SLOs to metrics, logs, traces, alerts, on-call, and incident flow. |
| [33 · AI infrastructure stack](./33-AI基础设施技术栈选型) | First identify the scarce resource: model, GPU, context, retrieval quality, cost, or control. |
| [34 · Technology selection decision tree](./34-技术选型决策树) | Connect new-tech necessity, stage, failure mode, team capability, and exit plan into one tree. |

---

## After finishing, you should be able to

- [ ] Take a vague requirement and ask the right questions to break it into clear constraints and quality goals.
- [ ] Hear "we want to build an X" and immediately picture several candidate architectures, each with its trade-offs.
- [ ] Draw a clear architecture diagram that product, backend, and frontend all understand.
- [ ] Look at an unfamiliar system and quickly grasp *why it's designed that way*.
- [ ] Make architecture decisions based on constraints and trade-offs — and write down the reasons.
- [ ] *(Practice track)* Walk a full path on an unfamiliar system or template: read → design → evolve → migrate.
- [ ] *(AI-collab track)* Write architecture constraints for AI, review its output, and pick the right collaboration mode for prototype vs production.
- [ ] *(Technology stack track)* Turn "what tech should we use" into a reviewable ADR instead of a popularity or preference call.

---

## A reminder

> Architecture has no standard answers, only answers that are "more reasonable" under specific constraints.
> What this tutorial gives you isn't conclusions — it's **the ability to ask the right questions**.
> When you naturally ask of every technical choice, "why this one? what does it cost?" — you're already thinking like an architect.
