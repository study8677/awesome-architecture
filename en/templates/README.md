# 🗺️ Architecture Template Library

> Every template is an "architecture map." We **focus strictly on architecture — no language, framework, or syntax**.
> The goal: after reading a template, you understand *why* this class of system is designed this way, and can use it as the starting point for your own design.

---

## Template Catalog

> **31** templates in total: 16 classic / general systems + 5 AI-native systems + 4 AI coding / autonomous Agents + 1 system prompt architecture + 5 industrial / embedded systems. Every template ends with **links to real open-source projects and engineering docs** (see Section 14 "Reference Prototypes & Further Reading" in each template).

### Classic / General Systems

| Template | Representative Products | One-Line Positioning | Key Architecture Themes |
|---|---|---|---|
| [AI Chat Product](ai-chat-product/README.md) | Claude, ChatGPT | Wrap a large language model into a conversational, streaming, web-connected product | Inference serving, streaming, context, RAG, cost |
| [Browser Extension](browser-extension/README.md) | Honey, Grammarly | Safely inject capabilities into third-party web pages and monetize | Script separation, injection, privacy boundaries, monetization |
| [Standard Web App](standard-web-app/README.md) | Corporate sites, blogs, SaaS dashboards | The "good enough" architecture that 90% of projects actually need | Three-tier, caching, read/write split |
| [Mobile App](mobile-app/README.md) | Most iOS/Android apps | Deliver a smooth experience over unreliable networks | Offline-first, sync, client state, push |
| [E-commerce Platform](ecommerce-platform/README.md) | Amazon, Shopify, Taobao | Keep money and inventory accurate under high concurrency | Inventory, orders, payment, overselling, traffic spikes |
| [Social Feed](social-feed/README.md) | Twitter/X, Instagram | Rank and deliver massive content to every user by social graph and interest | Feed push/pull, follow graph, hot fan-out |
| [Video Streaming](video-streaming/README.md) | Netflix, YouTube | Deliver large media files globally with minimal latency and bandwidth cost | Transcoding, CDN, adaptive bitrate, recommendation |
| [Realtime Chat](realtime-chat/README.md) | WhatsApp, Slack, WeChat | Deliver messages fast, reliably, and in order | Long-lived connections, ordering, offline delivery, group fan-out |
| [URL Shortener](url-shortener/README.md) | Bitly, TinyURL, t.co | Compress long URLs into shareable, trackable short codes and redirect at ultra-low latency | Read-heavy, caching, 301/302, distributed unique IDs |
| [Payment System](payment-system/README.md) | Stripe, Alipay, PayPal | Keep every cent accounted for in an uncertain, distributed world | Idempotency, double-entry ledger, reconciliation, state machine |
| [Search Engine](search-engine/README.md) | Google, Elasticsearch | Hit and rank documents in milliseconds using inverted indexes | Inverted index, relevance, recall + rerank, sharding |
| [Ride-Hailing](ride-hailing/README.md) | Uber, Lyft, DiDi | Match massive numbers of riders and drivers on a live map in seconds | Geospatial index, real-time location, supply–demand matching |
| [Collaborative Doc](collaborative-doc/README.md) | Google Docs, Figma | Let multiple users edit simultaneously and merge in real time without overwriting each other | OT/CRDT, single-writer serialization, operation log |
| [Cloud Storage](cloud-storage/README.md) | Dropbox, iCloud | Never lose files, sync across devices, and minimize storage footprint | Chunking, content-addressed dedup, incremental sync |
| [Notification System](notification-system/README.md) | Novu, FCM/APNs | Deliver "what happened" to the right person reliably and with restraint | Multi-channel fan-out, dedup & rate-limiting, async retry |
| [Online Ticketing](online-ticketing/README.md) | Ticketmaster, Damai, 12306 | Handle massive instant contention for finite seats without overselling | Virtual waiting room, atomic stock decrement, seat-lock TTL |

### 🤖 AI-Native Systems (LLM Era)

| Template | Representative Products / Prototypes | One-Line Positioning | Key Architecture Themes |
|---|---|---|---|
| [AI Gateway / Relay](ai-gateway/README.md) | One API, LiteLLM, Portkey | Access all large models through a unified entry point with centralized governance | Unified API, billing & rate-limiting, load balancing, caching |
| [RAG Knowledge Base](rag-knowledge-base/README.md) | RAGFlow, LlamaIndex, Dify | Give the model an "open-book exam" grounded in your own documents | Chunking, vector retrieval, hybrid search + rerank, citations |
| [AI Agent / Workflow](ai-agent-platform/README.md) | Dify, Coze, LangGraph | Let the model plan → call tools → observe → decide again | Action loop, tool sandbox, memory, controllable fallbacks |
| [Inference Serving](inference-serving/README.md) | vLLM, SGLang, Triton | Squeeze maximum throughput out of GPUs when serving models | Continuous batching, paged KV cache, quantization, replicas |
| [Vector Database](vector-database/README.md) | Milvus, Qdrant, pgvector | Millisecond similarity search over massive high-dimensional vectors | ANN, HNSW/IVF, recall–latency trade-off |

### 🦾 AI Coding & Autonomous Agents (New in 2026)

| Template | Representative Products / Prototypes | One-Line Positioning | Key Architecture Themes |
|---|---|---|---|
| [Claude Code](claude-code/README.md) | Claude Code (Anthropic) | A local-first coding agent that puts Claude directly in your terminal | Autonomous loop, subagents/hooks/MCP, two-tier permissions + OS sandbox, context compaction |
| [OpenAI Codex](codex/README.md) | Codex CLI + Cloud | One kernel, two forms: local real-time pairing + cloud async execution that opens PRs | Dual form factor, sandbox × approval axes, kernel isolation, offline by default |
| [OpenClaw (the lobster 🦞)](openclaw/README.md) | OpenClaw (formerly Clawdbot/Moltbot) | Self-hosted, always-on gateway that wires an agent into the chat apps you already use | Single-process gateway, chat apps as UI, heartbeat/cron, pluggable harness |
| [Hermes](hermes/README.md) | Hermes (Nous Research) | A self-hosted, always-on agent that grows alongside you | FTS5 persistent memory, auto-distilled skills, cron, multi-channel / multi-provider |

### 📜 System Prompt Architecture

| Template | Representative Products / Prototypes | One-Line Positioning | Key Architecture Themes |
|---|---|---|---|
| [System Prompt Architecture](system-prompt-architecture/README.md) | Claude Fable 5, GPT-5.5, Gemini, Grok, Cursor | A layered Agent OS that turns a raw large model into a product | Six-layer modules, decision-tree routing, externalized Skills, compliance hard rules, runtime injection |

### 🏭 Industrial / Embedded Systems (New in 2026)

> What this group shares: **software bugs become physical-world consequences** — bricked hardware, halted production lines, or physical collisions. The protagonist of the architecture shifts from "scaling and iteration" to "isolation, autonomy, and fail-safes."

| Template | Representative Products / Prototypes | One-Line Positioning | Key Architecture Themes |
|---|---|---|---|
| [Embedded Device Firmware](embedded-device/README.md) | Smart locks, wearables; Zephyr, FreeRTOS | Resource-locked micro-systems where errors have nowhere to hide | HAL layering, state machines, watchdog, A/B dual-bank OTA |
| [IoT Device Platform](iot-platform/README.md) | AWS IoT Core, Tuya; ThingsBoard, EMQX | Keep millions of unreliable devices connected, reporting up, and controllable down | Massive long-lived connections, per-device identity, device shadow, staged OTA |
| [Industrial Edge / SCADA](industrial-edge/README.md) | Factory data acquisition, SCADA; EdgeX, OPC UA | A regulated border crossing between OT and IT | Protocol normalization, edge autonomy, Purdue isolation, gated reverse control |
| [Automotive E/E](automotive-ee/README.md) | Tesla central compute, domain controllers; openpilot, AUTOSAR | A data center on wheels where braking always comes first | ASIL isolation, dual bus networks, whole-vehicle OTA, shadow mode |
| [Robotics System](robotics/README.md) | Robot vacuums, AGVs, drones; ROS 2, PX4 | Millisecond physical closed loop of sense → plan → act | Frequency layering, independent safety bypass, record & replay, fleet management |

---

## Every Template Shares the Same 14-Section Structure

We deliberately make every template follow **the exact same structure** (see [`_TEMPLATE.md`](https://github.com/study8677/awesome-architecture/blob/main/templates/_TEMPLATE.md)). This has two benefits:

1. **You read faster the more you read**: the first template you read top-to-bottom; by the tenth, you can jump straight to "Key Decisions & Trade-offs."
2. **The structure itself is the lesson**: these 14 sections are the exact 14 questions you should ask yourself in order when designing any system.

| # | Section | What question it answers |
|---|---|---|
| 1 | One-Line Positioning | What actually is this thing? |
| 2 | Business Essence | What real problem does it solve? Who pays for it? |
| 3 | Core Requirements & Constraints | What must it do (functional)? How well must it do it (quality attributes)? |
| 4 | High-Level Architecture Diagram | What does the whole system look like? (An ASCII diagram) |
| 5 | Component Responsibilities | What does each part do, and *why* does it need to exist? |
| 6 | Key Data Flows | How do requests and data move step by step in core scenarios? |
| 7 | Data Model & Storage Choices | What is stored, and why in this type of store? |
| 8 | Key Architecture Decisions & Trade-offs | Where are the forks in the road, and what was given up? |
| 9 | Scaling & Bottlenecks | When traffic grows 100×, what breaks first? |
| 10 | Security & Compliance | Where is the attack surface? Which data must never be mishandled? |
| 11 | Common Pitfalls / Anti-Patterns | Where do newcomers most often get this wrong? |
| 12 | Evolution Path | MVP → Growth → Maturity: what does the architecture look like at each stage? |
| 13 | Reusable Takeaways | Which architectural ideas here transfer to other systems? |
| 14 | Reference Prototypes & Further Reading | Which real open-source projects and engineering papers is this based on? |

---

## Reading Tips

- **Don't memorize the diagrams.** Remember *why* the boxes are connected that way, not how many boxes there are. Change the scale or the constraints, and the diagram for the exact same system changes completely.
- **Focus on Sections 8, 9, and 11.** These three sections (trade-offs, bottlenecks, pitfalls) concentrate real-world scars and are the most valuable parts for both interviews and production work.
- **Compare yourself against Section 12 (Evolution Path).** What you are building right now probably does not need the heavy maturity-stage architecture. Know which stage you are in and avoid over-engineering.

---

## A Note on Realism

These templates are distilled from **publicly shared architecture principles, engineering blogs, technical talks, and industry-standard practices** of the representative products. Their purpose is **teaching**: capturing the shared architectural essence and key trade-offs of each class of system.

They are **not** internal blueprints of any specific company; concrete numbers and component names have been generalized. Read them as "what a typical architecture for this class of system looks like," not "how Company X implements it internally."

---

## Want to Contribute a New Template?

1. Copy [`_TEMPLATE.md`](https://github.com/study8677/awesome-architecture/blob/main/templates/_TEMPLATE.md) into a new directory, e.g., `templates/your-system/README.md`.
2. Fill in all 14 sections (including **real, verified** reference prototype links) and **stay strictly at the architecture level** — the moment you write "use library YY in language XX," stop and ask: is this an architectural decision, or an implementation detail?
3. Draw diagrams in ASCII (plain text, viewable everywhere, never breaks).
4. Add a row to the catalog tables.

> The bar: an engineer who has never worked in this domain should be able to read your template and clearly explain "why this class of system is designed this way, and where it breaks at scale."
