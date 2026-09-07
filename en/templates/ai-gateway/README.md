# AI Relay Station / AI Gateway Architecture Template

> **Representative products**: One API, New API, LiteLLM, Bifrost, Helicone, Portkey, OpenRouter, Cloudflare AI Gateway
> **One-line positioning**: Stand up a unified "middle layer" between your application and the many large-model providers out there — plug into every model through one (usually OpenAI-compatible) interface, and centralize auth, billing, rate limiting, load balancing, failover, caching, and observability.

---

## 1. One-Line Positioning

An AI gateway = **the API gateway + reverse proxy of the LLM era**. It produces no intelligence of its own; **its entire value is "governance"**: it gathers calls that were once scattered everywhere, each wired directly to a different model, into **one entry point you can manage uniformly**.

The problem it solves is dead simple. When your code is littered with "call OpenAI" here, "call Claude" there, "call DeepSeek" somewhere else — every provider's API is different, every provider goes down sometimes, and nobody can say how much money you've spent — that's when you need a middle layer to round up all these **cross-cutting concerns** (auth, rate limiting, billing, fault tolerance, observability) in one place.

> It's exactly the **BFF / gateway** and **proxy** ideas from [04 · Architecture Patterns](https://github.com/study8677/awesome-architecture/blob/main/tutorial/04-十大核心架构模式.md), applied to the act of "calling a large model."

## 2. The Business Essence: What Problem It Solves

It has two typical uses, corresponding to two business essences:

- **(A) Internal enterprise governance**: dozens of apps across a team all need to call models, and you need to manage keys uniformly, enforce quotas uniformly, view bills in one place, and fail over automatically when one provider hiccups. The gateway makes "calling a model" **manageable, controllable, and auditable**.
- **(B) The "relay station" distribution model**: an operator aggregates upstreams (possibly multiple accounts, multiple providers) and **bills downstream users by usage, reselling keys**. What it sells is "peace of mind + aggregation + billing" — downstream users don't have to register with every provider individually or juggle multiple keys; one interface and one account gets them every model.

> Either way, its core is "**turning the act of calling a large model into a product that can be governed**." It doesn't think for you — it handles the **cash register, scheduling, fallback, and bookkeeping** for you.

## 3. Core Requirements and Constraints

**Functional requirements:**
- [ ] Unified interface (usually OpenAI-compatible), shielding provider differences
- [ ] Multi-provider / multi-model routing
- [ ] Key management and distribution; per-user / per-team billing and quotas
- [ ] Rate limiting, load balancing, failover (retry / switch upstream)
- [ ] Caching (to save money), usage logs, and observability
- [ ] (Optional) content moderation / guardrails

**Non-functional requirements / quality attributes:**
| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Added latency** | Extremely low (milliseconds) | The gateway sits on the critical path; it must never slow requests down itself |
| **Availability** | Extremely high | It's a single point — if it's down, every model call is down |
| **Streaming pass-through** | Mandatory | LLMs stream their output; the gateway must forward it as-is, never buffer |
| **Cost visibility** | Down to the token | The bedrock of billing / quotas |

**Key constraints (boundaries you cannot cross):**
- 🔴 **It's a single point on the critical path**: it must be stateless, horizontally scalable, with hot-reloadable config — otherwise it's a global point of failure.
- 🔴 **Responses are streamed**: it must forward as it receives (SSE pass-through), not wait for the model to finish generating before returning.
- 🔴 **Upstreams are unreliable and heterogeneous**: each one rate-limits, hiccups, and differs in price and capability.
- 🔴 **An upstream key is money**: it must never leak to downstream users or into logs.

## 4. The Big Picture

```
   Your apps / downstream users (using one unified OpenAI-compatible interface)
        │  one base_url + one key
        ▼
┌──────────────────────────────────────────────────────────────┐
│  AI Gateway (stateless, horizontally scalable)                 │
│  ① Auth + quota check     ② Rate limiting                      │
│  ③ Routing / load balancing: pick an upstream by price /       │
│     latency / health                                           │
│  ④ Cache: on hit, return directly (saving one call)            │
│  ⑤ Call upstream; on failure, [fail over] to the next upstream │
│  ⑥ Stream tokens through  ⑦ Parse usage → book & deduct cost   │
└───┬───────────────────────────────────────────┬──────────────┘
    │ Forward (and relay the stream as-is)        │ Side channel, async
    ▼                                             ▼
┌───────────────────────────────┐      ┌──────────────────────┐
│ Upstream LLM providers         │      │ Usage / logs / billing│
│ (many, multi-key)              │      │ store                 │
│ OpenAI / Claude / Gemini /     │      │ (observability,       │
│ self-hosted                    │      │  invoicing)           │
└───────────────────────────────┘      └──────────────────────┘
```

> The soul of it: **the gateway runs no model of its own**. It's a "smart tollbooth" — every car (request) passes through it to be authenticated, priced, throttled, and re-routed if needed, but the car still drives on to the upstream model.

## 5. Component Responsibilities

- **Unified ingress layer**: exposes one (OpenAI-compatible) interface externally, and internally uses **adapters** to translate it into each upstream's protocol. *Why it's needed*: lets downstream "write once, call all," hiding provider differences — a textbook application of the adapter pattern.
- **Auth and key management**: validates downstream keys, manages the upstream key pool, and handles resale. *Why it's needed*: upstream keys are money; they must be held by the gateway and never leak.
- **Routing / load balancing / failover**: chooses among multiple upstreams / multiple keys, retrying or switching automatically on failure. *Why it's needed*: don't put all your eggs in one basket — one provider going down can't take everything down.
- **Rate limiting and quotas**: throttle and cap by user / team. *Why it's needed*: prevent abuse and overspending (every token is money).
- **Cache**: return cached results directly for identical (or similar) requests. *Why it's needed*: LLM calls are expensive and slow; caching is one of the biggest money-saving levers there is.
- **Metering and billing**: parse the token usage of each response, then book and deduct cost. *Why it's needed*: without metering you can neither control cost nor produce a bill.
- **Observability / logging**: latency, cost, and success/failure of every single call. *Why it's needed*: what you can't see, you can't manage.

## 6. Key Data Flows

**Scenario 1: An ordinary forward (the gateway's daily grind)**
```
1. Downstream sends a request with a key ──▶ Gateway: auth + quota check (enough quota?)
2. Rate limit passes ──▶ check cache: on hit, return directly (saving one upstream call)
3. On miss ──▶ routing picks a healthy upstream ──▶ forward the request
4. Upstream starts streaming tokens ──▶ Gateway [forwards each chunk as-is, as it arrives]
   to downstream (SSE pass-through)
5. Stream ends ──▶ parse usage (prompt/completion token counts) ──▶ book & deduct cost async
```
> Step 4 is the crux: **the gateway must never wait for the upstream to finish the whole generation before forwarding**, or the streaming experience is ruined. It has to be a "transparent pipe."

**Scenario 2: Upstream failover**
```
The routed upstream returns 429 (rate-limited) or 5xx / timeout:
  ──▶ Gateway follows the [failover chain] to the next upstream (or swaps to another key)
  ──▶ retry (exponential backoff)
  ──▶ only when all upstreams fail does it return an error to downstream
  ── Downstream is oblivious throughout: all it knows is "I made one call and got a result"
```

## 7. Data Model and Storage Choices

Core entities: `downstream user / key / quota`; `upstream provider / key pool`; `usage records (tokens, cost, latency)`; `routing config`; `cache`.

| Data | Storage Type | Why |
|---|---|---|
| Users / keys / quotas | Relational | Needs transactions and strong consistency (quota deduction can't go wrong) |
| Routing / model config | Relational + in-memory cache | Read frequently, must be hot-reloadable |
| Usage / billing records | Time-series / columnar | Massive append volume, aggregated by time and user to produce bills |
| Response cache | In-memory KV | Hits must be fast; has a TTL |
| Rate-limit counters | In-memory KV | High-frequency read/write, sliding window |

## 8. Key Architecture Decisions and Trade-offs ⭐

**Decision 1: Streaming responses — pass through or buffer? (the gateway's red line) ⭐**
- Buffer: wait for the upstream to generate the whole thing before returning — simple to implement, but downstream sits there waiting ten-plus seconds, and the streaming experience is gone.
- Pass through: forward as you receive (SSE chunk by chunk).
- **Where to land**: pass-through, mandatory. The cost is more complex connection management and mid-stream error recovery, but this is table stakes for an LLM gateway.

**Decision 2: Self-host or use managed? (a key choice that shifts by stage) ⭐**
- Managed (e.g., OpenRouter, Cloudflare AI Gateway): zero ops, works out of the box, but you take on a third-party dependency, your data passes through it, and customization is limited.
- Self-hosted (e.g., One API, LiteLLM): fully in your control, data stays with you, deeply customizable — but you own keeping it highly available and operating it.
- **Where to land**: **for an individual / getting started, managed or a single-box self-host** is plenty; **for a team / platform scale, self-host and engineer for high availability**. See Section 12.

**Decision 3: Caching — exact or semantic? ⭐**
- Exact cache: hits only when the request is identical — safe, but low hit rate.
- Semantic cache: returns a cached result when the request is "semantically similar" — high hit rate, more savings, but **risks answering the wrong question** (similar ≠ equivalent).
- **Where to land**: exact cache by default; turn on semantic cache only in tolerant scenarios, cautiously, and with a configurable similarity threshold.

**Decision 4: How to set the load-balancing / routing strategy?**
- Round-robin: simple, even spread. By price: prefer cheaper upstreams. By latency / health: prefer the fast, live ones.
- **Where to land**: most setups use "health-first + a failover chain" as the base, layered with price / latency weighting. **The core point is don't pile all traffic on one provider.**

## 9. Scaling and Bottlenecks

- **First bottleneck: the gateway's own throughput.** → Fix: keep the gateway **stateless** and just scale it out to N copies + a load balancer in front.
- **Second bottleneck: upstream rate limits (every provider has RPM/TPM caps).** → Fix: rotate across multiple accounts / keys, queue requests, and shave peaks against quotas.
- **Third bottleneck: heavy billing writes.** → Fix: make usage bookkeeping **asynchronous** (forward first, book after) — don't put it in the way of the critical path.
- **Fourth bottleneck: consistency of config / rate-limit state** (across multiple gateway instances). → Fix: use shared in-memory storage (centralized rate-limit counters and config).

## 10. Security and Compliance Essentials

- 🔴 **Upstream keys must never leak**: they are money. Downstream holds only the downstream key the gateway issued and never sees the upstream key; logs must be redacted too.
- **Multi-tenant isolation**: strictly isolate the quotas, data, and logs of different downstream users / teams.
- **Abuse prevention**: rate limiting, anomalous-usage alerts, leaked-key detection.
- **Content compliance**: as the choke point all traffic passes through, this is where you can wire in content moderation / guardrails uniformly.
- **Prompt injection**: the gateway passes user content through and doesn't interpret it itself, but be aware that downstream models face injection risk (see Section 10 of the [AI Chat Product template](https://github.com/study8677/awesome-architecture/blob/main/templates/ai-chat-product/README.md)).

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Buffering the full response before returning** → ✅ stream-through; the gateway is a transparent pipe.
- ❌ **Building the gateway as a stateful, hard-to-scale single point** → ✅ stateless + scale out + externalized shared state.
- ❌ **Not parsing tokens, not metering** → ✅ book by usage, or cost spirals out of control and you can't produce a bill.
- ❌ **Overusing the semantic cache and answering the wrong question** → ✅ exact cache by default, semantic cache cautiously.
- ❌ **Exposing upstream keys / writing them into logs** → ✅ the gateway exclusively holds upstream keys, redacted.
- ❌ **Wiring up only one upstream, so one outage takes everything down** → ✅ multiple upstreams + a failover chain.

## 12. Evolution Path: MVP → Growth → Maturity (How to Set It Up at Each Stage)

| Stage | Scale | How to Set It Up (Specifics) | What to Worry About Now |
|---|---|---|---|
| **MVP / individual** | Single app, light call volume | **Just use managed** (OpenRouter / Cloudflare AI Gateway), or **stand up a single-box One API / LiteLLM**, wiring in 1–2 upstreams is enough | Don't over-build; first get "unified interface + visibility into what you're spending" working |
| **Growth / team** | Many apps, many teams | **Self-host LiteLLM / One API**: configure multi-provider routing + failover, per-team quotas and rate limits, add an in-memory cache layer, store usage in a relational DB | Fault tolerance, quotas, cache hit rate, driving down per-token cost |
| **Maturity / platform** | External distribution / large scale | **Multi-replica HA gateway** + centralized rate limiting; plug in pro observability (e.g., Helicone); fine-grained billing and multi-tenant isolation; enable semantic cache and guardrails as needed | High availability, accurate billing, compliance, abuse governance |

## 13. Reusable Takeaways

- 💡 **A gateway / middle layer is the classic move for "centralizing cross-cutting concerns."** Auth, rate limiting, billing, observability, fault tolerance — rather than rewriting them in every app, round them up at one entry point.
- 💡 **The adapter pattern hides provider differences**: one interface outward, N adapters inward. "Write once, call all" applies to any scenario "integrating multiple heterogeneous third parties."
- 💡 **Failover = don't put all your eggs in one basket.** Any system that depends heavily on an external party that can go down should have a "primary fails, switch to backup" path.
- 💡 **Caching is one of the biggest money-saving levers in an LLM system** — the same idea runs through the prompt / prefix caching in [AI Chat Product](https://github.com/study8677/awesome-architecture/blob/main/templates/ai-chat-product/README.md) and [Inference Serving](https://github.com/study8677/awesome-architecture/blob/main/templates/inference-serving/README.md).

## 🎯 Quick Quiz

<Quiz
  question="What is the core value of an AI gateway / relay station?"
  :options="['It runs the large model itself', 'It centralizes auth, billing, rate limiting, fault tolerance, and caching behind one unified entry point', 'It is responsible for training the model']"
  :answer="1"
  explanation="It runs no model of its own; its entire value is in 'governance' — rounding up cross-cutting concerns at one entry point is the classic gateway / middle-layer move."
/>

---

## References & Further Reading

> This template is distilled from the architectural ideas of the following **real open-source projects** and **public documentation**. To go deep, read their code and docs directly — more reliable than any secondhand explanation.

**🔧 Open-source prototypes (read the code directly):**
- [songquanpeng/one-api](https://github.com/songquanpeng/one-api) — the most popular Chinese-community LLM API management & distribution system; unified interface + key management + resale, a textbook "relay station" implementation.
- [BerriAI/litellm](https://github.com/BerriAI/litellm) — a gateway / proxy to call 100+ models in OpenAI format, with built-in cost tracking, load balancing, failover, and rate limiting.
- [Helicone/ai-gateway](https://github.com/Helicone/ai-gateway) — a high-performance open-source AI gateway written in Rust, focused on load balancing, caching, rate limiting, and observability.
- [Portkey-AI/gateway](https://github.com/Portkey-AI/gateway) — an ultra-lightweight (<1ms added latency) open-source AI gateway; routing + guardrails + multi-provider.
- [maximhq/bifrost](https://github.com/maximhq/bifrost) — a high-performance Go AI gateway that unifies 23+ providers behind an OpenAI-compatible API, with automatic failover, load balancing, semantic caching, and native observability.

**📖 Engineering docs / resources:**
- [Cloudflare AI Gateway docs](https://developers.cloudflare.com/ai-gateway/) — a managed AI gateway: caching, rate limiting, retries, observability — useful for understanding "how a managed solution is designed."
- [jasonkuperberg/ai-gateway-resources](https://github.com/jasonkuperberg/ai-gateway-resources) — a curated roundup of AI-gateway selection and integration resources (OpenRouter / LiteLLM / Portkey / Kong / Cloudflare).

---

> 📌 Remember the AI gateway in one line: **it runs no model at all — it's the tollbooth and control tower for the act of "calling a large model." Every design decision answers one question: "how do I use one unified entry point to handle auth, billing, rate limiting, fault tolerance, caching, and observability all at once?"**
