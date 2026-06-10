# Awesome Architecture · 架构图谱

> An open-source knowledge base about **architecture** — not code.
> Battle-tested architecture maps of real, popular systems, paired with a tutorial that trains you to think like an architect.

**English** · [简体中文](./README.md)

**🌐 Read online (interactive · bilingual, HTTPS):** <https://study8677.github.io/awesome-architecture/en/>

**🏆 Community attention:** On 2026-06-08, this project reached [PickGithub](http://pickgithub.com/rank) **#1 on the Vue Trending chart for the day**.

**🧭 Companion skill:** [architecture-copilot](https://github.com/study8677/architecture-copilot) — turns this knowledge into an interactive skill that **guides you through architecture design** inside Claude Code / Cursor / Codex.

[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/study8677/awesome-architecture)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Focus: architecture, not syntax](https://img.shields.io/badge/focus-architecture%2C%20not%20syntax-blue.svg)](#why-this-repo-exists)
[![Made with Markdown](https://img.shields.io/badge/made%20with-Markdown-1f425f.svg)](#)

---

## Why this repo exists

For the past two decades, a programmer's core edge was **writing code correctly and fast**.

But something is happening right in front of us: **"writing code" is disappearing.** Not getting harder, not getting scarcer — *ending*, as a craft that humans do. At frontier labs like OpenAI and Anthropic, almost all code is already written by AI; human engineers no longer type out implementations by hand. They do just two things: **tell the AI what to build, then judge whether it got it right.** Once a machine spits out working code in seconds, knowing "`for` vs `map`, that API, this syntax" — the old craft — is worth nothing overnight.

What *isn't* depreciating — and is in fact getting more valuable — is a different skill:

> **Before you write the first line of code, figure out what the system should actually look like.**
>
> Where does data come from, where does it go? What must be strongly consistent, what can be eventual?
> Where will it break first? When users grow from 10K to 100M, what's the first bottleneck?
> To get A, which B am I willing to give up?

That is **architectural thinking**. It's independent of language, of framework, even of what's trendy this year. It's the judgment to **read the map before you hit the road**.

**Our belief: the great developer of the future is first a person who makes sound architectural judgments, and only second a person who writes code.** Understand what you're building at the architecture level first — code is just one way to make that understanding real.

---

## What's inside

```
awesome-architecture/
├── tutorial/      📚 Tutorial  — systematically teaches you how to *think like an architect*
├── templates/     🗺️ Templates — architecture maps of real systems; architecture only, no syntax
└── cases/         🧪 Cases     — concrete products from zero to launch, then into real pressure
```

### 📚 tutorial/ — Become a sharper architect

Not "how to use framework X", but a transferable way of thinking: how to turn a vague requirement into constraints, how to make decisions under trade-offs, how to draw architecture diagrams that actually communicate, and how to design a brand-new system from scratch.

| Ch. | Topic | What you'll learn |
|---|---|---|
| [01](en/tutorial/01-为什么先有架构思维.md) | Why architecture-first thinking | Why "architecture first" is *the* core skill of this era |
| [02](en/tutorial/02-架构师的思考框架.md) | The architect's thinking framework | The universal flow: requirements → constraints → quality attributes → trade-offs |
| [03](en/tutorial/03-读懂与画好架构图.md) | Reading & drawing architecture diagrams | Use the C4 model to get the system out of your head and onto paper |
| [04](en/tutorial/04-十大核心架构模式.md) | 10 core architecture patterns | Layered, microservices, event-driven, CQRS… what each one actually solves |
| [05](en/tutorial/05-数据与状态.md) | Data & state | Why *data* is the real hard part of any system |
| [06](en/tutorial/06-质量属性与取舍.md) | Quality attributes & trade-offs | Performance / availability / consistency / cost — how to weigh them |
| [07](en/tutorial/07-从0到1设计一个系统.md) | Designing a system from 0 to 1 | A step-by-step methodology you can actually follow |
| [08](en/tutorial/08-架构决策记录与演进.md) | ADRs & evolution | Record decisions with ADRs and let architecture grow with the business |
| [09](en/tutorial/09-架构品味.md) | Architectural taste | What separates good architects beyond the framework; grow judgment via real cases (microservices→monolith, big-company tastes) |

**🚀 Advanced track (10–17, new) — taming the hard rock that bites once a system gets big or critical:**

| Ch. | Topic | What you'll tame |
|---|---|---|
| [10](en/tutorial/10-分布式系统的硬道理.md) | Distributed systems: the hard truths | Partial failure, no global clock, the cost of consensus, the exactly-once illusion |
| [11](en/tutorial/11-数据一致性工程.md) | The engineering of data consistency | Saga, Outbox, idempotency, event sourcing, CQRS |
| [12](en/tutorial/12-为失败而设计.md) | Designing for failure: resilience | Cascading failure, circuit breakers, bulkheads, load shedding, SLOs, chaos |
| [13](en/tutorial/13-规模化的力学.md) | The mechanics of scale | Consistent hashing, hot keys, multi-region, tail latency & fan-out |
| [14](en/tutorial/14-演进与拆分大型系统.md) | Evolving & splitting large systems | Strangler fig, parallel run, zero-downtime migration, splitting the monolith |
| [15](en/tutorial/15-组织即架构.md) | Organization as architecture | Conway / inverse Conway, Team Topologies, platform engineering |
| [16](en/tutorial/16-安全与多租户架构.md) | Security & multi-tenancy | Threat modeling, zero trust, blast radius, tenant isolation |
| [17](en/tutorial/17-大模型时代的架构判断.md) | Architecting in the age of LLMs | Vibe coding, nondeterminism, context engineering, agentic hard parts |

**🎯 Practice track (18–22) — put the method on real cases; bridge tutorial → templates:**

| Ch. | Topic | What you'll practice |
|---|---|---|
| [18](en/tutorial/18-读地图用框架拆解陌生系统.md) | Reading the map: deconstruct unfamiliar systems | Reverse-engineer *why* a `templates/` map is designed that way; practice on RAG / AI chat product |
| [19](en/tutorial/19-完整设计演练中等复杂度系统.md) | Full design walkthrough: medium complexity | Run the ch.07 eight-step flow — design an AI customer-service assistant that looks up orders and issues refunds (with token-cost math) |
| [20](en/tutorial/20-演进剧本MVP到规模化.md) | Evolution playbook: MVP → scale | Ch.08 + [evolution trigger signals](tutorial/演进触发信号.md) — three life stages of one AI assistant |
| [21](en/tutorial/21-拆分与迁移实战.md) | Splitting & migration in practice | Ch.14 as a case: strangler, branch by abstraction, shadow traffic, zero-downtime vector-store swap |
| [22](en/tutorial/22-AI原生系统设计.md) | AI-native system design | Upgrade the assistant into an autonomous Agent; land ch.17's three new constraints; bridge to the AI-collab track |

**🤝 AI-collaborative design track (23–26) — collaborate with AI without losing judgment:**

| Ch. | Topic | What you'll master |
|---|---|---|
| [23](en/tutorial/23-规格即架构约束怎么写给AI.md) | Spec as architecture: constraints for AI | ADR / `AGENTS.md` → enforceable guardrails; pairs with [architecture-copilot](https://github.com/study8677/architecture-copilot) |
| [24](en/tutorial/24-审查清单AI产出默认缺什么.md) | Review checklist: what AI output omits by default | Production-grade review checklist from ch.11/12/16 |
| [25](en/tutorial/25-评测驱动把够好写进架构.md) | Eval-driven: bake "good enough" into architecture | Eval as a CI gate for nondeterministic systems |
| [26](en/tutorial/26-协作决策树何时vibe何时spec-first.md) | Collaboration decision tree: when to vibe, when to spec-first | Prototype vs production workflow — the capstone |

**🧰 Technology stack selection track (27–34) — turn "what tech to use" into architecture judgment:**

| Ch. | Topic | What you'll judge |
|---|---|---|
| [27](en/tutorial/27-编程语言与后端框架选型.md) | Languages & backend frameworks | How language/framework affects runtime, ecosystem, team, and maintenance cost |
| [28](en/tutorial/28-数据库与存储选型.md) | Databases & storage | How source of truth, read models, search, object storage, and vector stores divide work |
| [29](en/tutorial/29-缓存消息队列与事件系统选型.md) | Cache, queues & events | What fits read hotspots, spike smoothing, and fact broadcast |
| [30](en/tutorial/30-API与服务通信选型.md) | APIs & service communication | REST / gRPC / GraphQL / Webhook boundaries |
| [31](en/tutorial/31-云原生与部署平台选型.md) | Cloud native & deployment | When PaaS, containers, Serverless, or K8s are worth it |
| [32](en/tutorial/32-可观测性与可靠性技术栈选型.md) | Observability & reliability | Work backward from SLOs to metrics, logs, traces, alerts, incidents |
| [33](en/tutorial/33-AI基础设施技术栈选型.md) | AI infrastructure | When model API, RAG, vector DB, inference serving, and evals should upgrade |
| [34](en/tutorial/34-技术选型决策树.md) | Technology selection decision tree | Turn stage, failure mode, team capability, and exit plan into an ADR |

> 👉 **New here? Start with [en/tutorial/README.md](en/tutorial/README.md)** for the full learning path.

### 🧪 cases/ — Turn architecture from answer into reasoning

`cases/` is not more templates. It walks a concrete product from zero to launch, then into real pressure. It fills the final gap between `tutorial/` and `templates/`: templates tell you **what this class of system usually looks like**; cases show **why one concrete scenario forces these trade-offs**.

The first batch of six core cases is complete:

| Case | Capability area | What it drills |
|---|---|---|
| [01 · StarArena: concert ticketing](en/cases/stararena-ticketing/README.md) | Online ticketing / e-commerce / payment | Limited inventory, virtual waiting room, seat locking, payment state machine, reconciliation |
| [02 · PatchDesk: lightweight ticketing SaaS](en/cases/patchdesk-saas/README.md) | Standard Web / SaaS backend | Modular monolith, tenant isolation, RBAC, Outbox, async notifications, search/report evolution |
| [03 · DocuMind: enterprise RAG knowledge base](en/cases/documind-rag/README.md) | RAG / AI chat / vector database | Ingestion, chunking, hybrid retrieval, Graph RAG, reranking, citations, permissions, prompt injection, evals |
| [04 · SyncRoom: realtime collaboration workspace](en/cases/syncroom-collaboration/README.md) | Realtime chat / collaborative docs / notifications | Long connections, server seq, offline catch-up, multi-device sync, OT / CRDT, presence, notification degradation |
| [05 · FeedStream: content distribution](en/cases/feedstream-content/README.md) | Social feed / video / search | Hybrid fanout, top creator fanout, timeline inboxes, ranking, search indexes, transcoding, CDN, moderation recall |
| [06 · CodePilot: coding Agent platform](en/cases/codepilot-agent/README.md) | AI Agent / Codex / Claude Code | Tool calls, permission gateway, sandboxing, human approval, context compaction, checkpoints, subagents, trace, eval gates |

> 👉 **See [en/cases/README.md](en/cases/README.md)** for the case overview. The reading rule: do not memorize diagrams; watch why the starting architecture was reasonable, which quantified signal forced an upgrade, and what the new design chose and gave up.

### 🗺️ templates/ — Architecture maps of real systems

Each template is an "architecture map". We **deliberately avoid discussing language or framework** — only: what problem this class of system solves, what parts it's made of, how data flows, how the key trade-offs are made, and where it dies at scale.

**Classic / general systems**

| Template | Representative products | Key architecture themes |
|---|---|---|
| [AI Chat Product](templates/ai-chat-product/README.md) | Claude, ChatGPT | LLM inference, streaming, context management, RAG, cost control |
| [Browser Extension](templates/browser-extension/README.md) | Honey, Grammarly | Content/background split, page injection, privacy boundaries, monetization |
| [Standard Web App](templates/standard-web-app/README.md) | Corporate sites, blogs, SaaS dashboards | Classic three-tier, caching, read/write splitting — "good enough" |
| [Mobile App](templates/mobile-app/README.md) | Most iOS/Android apps | Offline-first, data sync, client state, push |
| [E-commerce Platform](templates/ecommerce-platform/README.md) | Amazon, Shopify, Taobao | Inventory, orders, payments, overselling, traffic spikes |
| [Social Feed](templates/social-feed/README.md) | Twitter/X, Instagram | Feed push/pull, follow graph, viral fan-out |
| [Video Streaming](templates/video-streaming/README.md) | Netflix, YouTube | Transcoding, CDN, adaptive bitrate, recommendations |
| [Realtime Chat](templates/realtime-chat/README.md) | WhatsApp, Slack, WeChat | Long-lived connections, message ordering, offline delivery, group fan-out |
| [URL Shortener](templates/url-shortener/README.md) | Bitly, TinyURL, t.co | Read-heavy, caching, 301/302, distributed unique IDs |
| [Payment System](templates/payment-system/README.md) | Stripe, Alipay, PayPal | Idempotency, double-entry ledger, reconciliation, state machine |
| [Search Engine](templates/search-engine/README.md) | Google, Elasticsearch | Inverted index, relevance ranking, recall + rerank, sharding |
| [Ride-Hailing](templates/ride-hailing/README.md) | Uber, Lyft, DiDi | Geospatial index, real-time location, supply–demand matching |
| [Collaborative Doc](templates/collaborative-doc/README.md) | Google Docs, Figma | OT/CRDT, single-writer serialization, operation log |
| [Cloud Storage](templates/cloud-storage/README.md) | Dropbox, iCloud | Chunking, content-addressed dedup, incremental sync |
| [Notification System](templates/notification-system/README.md) | Novu, FCM/APNs | Multi-channel fan-out, dedup/throttling, async retry |
| [Online Ticketing](templates/online-ticketing/README.md) | Ticketmaster, 12306 | Virtual waiting room, atomic stock decrement, seat-lock TTL |

**🤖 AI-native systems** (new)

| Template | Representative products / prototypes | Key architecture themes |
|---|---|---|
| [AI Gateway / Relay](templates/ai-gateway/README.md) | One API, LiteLLM, Portkey | Unified API, billing & rate-limit, load balancing, caching |
| [RAG Knowledge Base](templates/rag-knowledge-base/README.md) | RAGFlow, LlamaIndex, Dify | Chunking, vector retrieval, hybrid search + rerank, citations |
| [AI Agent / Workflow](templates/ai-agent-platform/README.md) | Dify, Coze, LangGraph | Action loop, tool sandbox, memory, guardrails |
| [Inference Serving](templates/inference-serving/README.md) | vLLM, SGLang, Triton | Continuous batching, paged KV cache, quantization |
| [Vector Database](templates/vector-database/README.md) | Milvus, Qdrant, pgvector | ANN, HNSW/IVF, recall–latency trade-off |

**🦾 AI Coding & Autonomous Agents** (new — real, in-the-wild agent product architectures)

| Template | Representative products / prototypes | Key architecture themes |
|---|---|---|
| [Claude Code](templates/claude-code/README.md) | Claude Code (Anthropic) | Local-first coding agent; subagents/hooks/skills/MCP; two-tier permissions + OS sandbox; context compaction |
| [OpenAI Codex](templates/codex/README.md) | Codex CLI + Cloud | Local CLI & cloud async sandbox; sandbox × approval axes; offline-by-default anti-injection; opens PRs |
| [OpenClaw (the lobster 🦞)](templates/openclaw/README.md) | OpenClaw (formerly Clawdbot) | Self-hosted gateway; chat apps as the UI; heartbeat/cron; pluggable harness; memory as plain text |
| [Hermes](templates/hermes/README.md) | Hermes (Nous Research) | Always-on & self-growing; FTS5 persistent memory; auto-distilled skills; cron; multi-channel/provider |

> 👉 **Want to add your own template?** Follow the unified format in [templates/_TEMPLATE.md](templates/_TEMPLATE.md).

> 📝 **Now fully bilingual** — all **34 tutorial chapters, 25 templates, and the first 6 cases** are available in English. Use the language switch (top-right on the site), or browse `en/` in the repo.

---

## How to use this repo

**If you're a beginner / shifting toward architectural thinking:**
Read `tutorial/` in order. After each chapter, pick a system in `templates/` you find interesting and try to "read" it using the framework you just learned. After chapter 07, start using `cases/` for complete product walkthroughs.

**If you're about to design a new system:**
Start with `tutorial/07` for the methodology, then find the map closest to your scenario in `templates/`. Treat it as a starting point, not an answer — walk through its "key decisions" and "common pitfalls" and ask yourself each one. If your scenario resembles one of the first-batch cases, compare against the full reasoning in `cases/`.

**If you're prepping for system design interviews:**
Every template covers high-frequency topics (overselling, feed fan-out, message ordering, streaming output…), all in a consistent format — great for systematic review. `cases/` is better for practicing a complete answer from requirements to trade-offs.

**If you're a senior engineer / architect:**
Jump straight to each template's "Key Decisions & Trade-offs" and "Evolution Path" — the most concentrated parts. PRs sharing the scars you've earned are welcome.

---

## Three reading principles

1. **Ask "why" before "how".** Every architecture choice sits on top of a constraint or a trade-off. If you can't see the trade-off, you haven't understood it.
2. **There is no best architecture, only the most fitting one.** "Chat" for an internal tool and "chat" for WeChat are worlds apart. Scale, team, cost, and compliance decide everything.
3. **Architecture grows.** Don't force a mature-stage architecture onto an MVP. Every template includes an "evolution path" telling you when to upgrade — and when you're over-engineering.

---

## The one-sentence version

> **Code tells the computer what to do; architecture decides whether the thing is worth doing, can be done, and will hold up.**
> This repo trains you for the second kind of judgment.

---

## Contributing

Contributions are welcome — new templates, fixes, and especially **English translations** of the tutorial and existing templates.

1. Copy [`templates/_TEMPLATE.md`](templates/_TEMPLATE.md) into a new folder, e.g. `templates/your-system/README.md`.
2. Fill in all 14 sections (including **real** reference-prototype links) and **stay strictly at the architecture level** — the moment you start writing "use library YY in language XX", stop and ask: is this an architecture decision, or an implementation detail?
3. Draw diagrams in ASCII (plain text, viewable everywhere, never breaks).
4. Add a row to the template list.

> The bar: an engineer who has never touched this domain can, after reading your template, explain "why this class of system is designed this way, and where it dies".

---

## ⭐ Star History

> If this repo helped you, a Star is the best encouragement.

<a href="https://star-history.com/#study8677/awesome-architecture&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=study8677/awesome-architecture&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=study8677/awesome-architecture&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=study8677/awesome-architecture&type=Date" />
  </picture>
</a>

---

## 🔗 Friends

- [LINUX DO](https://linux.do/) — "Where possible begins." A new ideal-type community for developers who love tech and sharing.
