# AI Chat Product · Architecture Template

> **Representative products**: Claude, ChatGPT, Gemini, every flavor of "AI assistant"
> **One-line definition**: wrap a large language model (LLM) into a product you can talk to — one that streams its output, calls tools, and reaches the internet.

---

## 1. One-line definition

An AI chat product = **one expensive "reasoning brain" (the LLM)** + **a shell around it that makes it useful, safe, and profitable**.

The most counterintuitive thing architecturally: the biggest difference from the "websites" you know isn't logical complexity — it's that **the most expensive, scarcest resource shifts from "database / CPU" to "GPU compute."** Almost the entire architecture revolves around one question: **how do you keep the GPU fed, fully utilized, and cheap?**

## 2. The business essence: what problem it solves

What users want is an assistant that's **on call any time, knows everything, and gets work done for them.** It replaces the whole "Google it myself + read it myself + write it myself" routine.

Where the money comes from:
- **Subscriptions** (individuals/teams pay monthly, expecting a stable experience and a usage quota);
- **API calls** (developers pay per token to embed your model into their own products);
- Enterprise editions (data isolation, compliance, private deployment).

**The key fact: every character generated costs real GPU time — real money.** On an ordinary website, "one more request costs almost nothing"; here, "generating 1,000 more characters is a tangible cost." This one fact drives nearly every architectural trade-off that follows.

## 3. Core requirements and constraints

**Functional requirements:**
- [ ] Multi-turn conversation: remember context, keep the dialogue going.
- [ ] Streaming output: characters pop out one by one like a typewriter, instead of stalling for a dozen seconds and dumping everything at once.
- [ ] System prompt / role setup: set behavioral boundaries for the model.
- [ ] Tool calling (function calling): let the model use a calculator, search, code execution, database queries.
- [ ] Internet access / RAG: let the model ground its answers in external knowledge or real-time information.
- [ ] Multimodality: see images, read files, generate images.
- [ ] Conversation history: store and retrieve past dialogues.

**Non-functional requirements / quality attributes (this is where architecture actually fights):**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Time to first token (TTFT)** | < 1 second | The user is staring at the screen, waiting; the faster the first token, the more it "keeps up." This is the whole point of streaming. |
| **Generation throughput** | High tokens/sec | Decides how fast an answer can be read, and directly determines how many users one GPU can serve. |
| **Cost per 1K tokens** | The lower the better | Compute is cost; your entire margin rides on this. This is the single biggest difference from ordinary systems. |
| **Availability** | 99.9%+ | If it goes down, users leave instantly. |
| **Security** | Mandatory | Cannot be coaxed into harmful output, cannot be hijacked by injection attacks. |

**Key constraints (boundaries you cannot cross):**
- 🔴 **GPUs are expensive and scarce.** This is the number-one constraint; the entire architecture serves it.
- 🔴 **The context window is finite.** There's a hard cap on how much the model can "see" at once — stuff in too much and it gets expensive, slow, or simply won't fit.
- 🔴 **Inference is a "stateful" computation.** Generating the next token depends on the intermediate results of every prior token (the KV cache), which devours GPU memory.
- The model itself is uncontrollable (it hallucinates, it can be tricked); you need an outer layer to backstop it.

## 4. The big-picture architecture

```
                       User (Web / mobile / third-party API caller)
                                      │  sends a message
                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Access layer  API gateway / edge                                       │
│  • Auth, rate limiting, per-user quota  • Keep streaming connections     │
│    (SSE/WebSocket) alive  • Routing                                      │
└───────────────────────────────────┬──────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Orchestration layer (Orchestrator) — the product's "brain shell";      │
│  the real business logic all lives here                                 │
│                                                                        │
│   ① Assemble context: system prompt + history + retrieved material      │
│      + this turn's input                                                │
│   ② Input safety check (moderation)                                     │
│   ③ Decide the path: answer directly? query the knowledge base (RAG)?   │
│      call a tool?                                                        │
│   ④ Agent loop: model → tool → feed result back to model, until it      │
│      converges                                                          │
│   ⑤ Output safety check + billing/metering (count tokens)               │
└───┬───────────────┬────────────────┬───────────────┬──────────────────┘
    │               │                │               │
    ▼               ▼                ▼               ▼
┌─────────┐   ┌───────────┐   ┌────────────┐   ┌─────────────────┐
│ Session │   │  Vector    │   │   Tool      │   │ Inference svc    │
│ store   │   │ retrieval  │   │ execution   │   │   (the core)     │
│(history)│   │(RAG/knowl.)│   │  sandbox    │   │                 │
│         │   │           │   │ search/code/│   │ queue + continuous│
└─────────┘   └───────────┘   │ func calls  │   │   batching        │
                              └────────────┘   │       ↓          │
                                               │  ┌───────────┐   │
                                               │  │ GPU cluster│   │
                                               │  │(runs model)│←──── model weights
                                               │  └───────────┘   │   (object storage)
                                               └────────┬────────┘
                                                        │ tokens emitted one by one
                                                        ▼
                                          ◀═══ streamed back to user (SSE) ═══
```

> The soul of the system is the **inference service** in the bottom right — everything else (gateway, orchestration, caches) exists, fundamentally, to **protect and feed that expensive GPU.**

## 5. Component responsibilities

- **Access layer / API gateway**: auth, rate limiting, allocating quota by subscription tier, and **holding the streaming connection open** (a single answer may keep emitting tokens for tens of seconds). *Why it's needed*: GPUs are too expensive — abuse and excess traffic must be blocked at the very outer edge.
- **Orchestration layer (Orchestrator)**: where the product's entire business logic lives. It **assembles scattered material into one complete "prompt to feed the model,"** runs the "model ↔ tool" agent loop, does safety checks, and meters usage. *Why it's needed*: the model itself only knows how to "continue writing text"; all the intelligence that turns it into a "product" lives in this layer.
- **Inference service (Inference Service)**: manages the GPU cluster, **merges many users' requests into batches** to compute together (continuous batching), maximizes GPU utilization, and emits output token by token. *Why it's needed*: feeding a GPU one request at a time leaves it mostly idle; batching is the key to driving cost down.
- **Session store**: stores conversation history. *Why it's needed*: multi-turn conversation has to remember earlier context; it also powers the "past conversations" list. Append-heavy, read by conversation ID.
- **Vector retrieval / knowledge base (RAG)**: chunks documents, embeds them, and retrieves the snippets most semantically relevant to the question. *Why it's needed*: it grounds the model's answers in "your material / the latest information," not just what it memorized during training.
- **Tool execution sandbox**: when the model says "I need to search" or "I need to run this code," it actually executes inside an **isolated environment** and feeds the result back. *Why it's needed*: it turns the model from "only talks" into "can do things"; isolation is required because executing external code/requests carries security risk.
- **Model weight storage**: model files (tens to over a thousand GB) sit in object storage and are loaded into GPU memory when nodes start.
- **Safety / content moderation**: intercept malicious/abusive requests on the input side, harmful content on the output side.

## 6. Key data flows

**Scenario 1: an ordinary streaming conversation (the most central path)**
```
1. User types "make this paragraph more formal" ──▶ Gateway (auth, deduct quota, open SSE connection)
2. ──▶ Orchestrator:
       a. Pull this conversation's history
       b. Assemble: system prompt + history + this turn's input  →  one complete prompt
       c. Input moderation (anything out-of-bounds / abusive?)
3. ──▶ Inference service: request enters the queue, joins other users' requests to form a batch
4. ──▶ GPU: generates tokens one by one. Each one is pushed back the moment it's produced:
          Gateway ══SSE══▶ characters appear on the user's screen one at a time
5. Generation ends ──▶ Orchestrator: output moderation + record token count for billing
   + write this turn into the session store
```
> Note step 4: **the text isn't even finished generating, yet the user is already reading it.** This is the magic by which streaming turns "a dozen seconds of waiting" into "instant reaction."

**Scenario 2: the "agent loop" with tools/retrieval (the model not only talks, it acts)**
```
User asks "What were our East China sales last quarter?"

  Orchestrator ─▶ Model: I can't answer this; I need to look up the data
  Model ──▶ emits a "tool call: query sales (region=East China, quarter=Q3)"
  Orchestrator ─▶ tool sandbox runs the query ─▶ gets the result "East China Q3: ¥12.4M"
  Orchestrator ─▶ stitches the result back into the prompt, feeds it to the model again
  Model ──▶ "East China sales last quarter were ¥12.4M, up... " (this time a streamed answer)

  ⟲ This "model → tool → feed back → model" may loop several rounds, until the model no longer asks for a tool.
```
> Architectural point: a tool result is **text that re-enters the model** — it must be treated as **untrusted input** (see Section 10: prompt injection).

## 7. Data model and storage choices

Core entities: `user` ─ `conversation` ─ `message`; `document` ─ `chunk` ─ `embedding`; `usage record`.

| Data | Storage type | Why |
|---|---|---|
| Users / subscriptions / quotas | Relational | Needs transactions and strong consistency (billing must never be wrong) |
| Conversation history (messages) | Document / append log | Write-heavy, read-light, fetched by conversation ID, flexible structure |
| Document vectors (RAG) | Vector database | Must be retrieved by "semantic similarity" — something an ordinary database can't do |
| Model weights | Object storage | Huge, immutable, loaded into the GPU on demand |
| Usage / billing records | Time-series / columnar | Massive, aggregated by time, used for billing and monitoring |
| Hot prompt prefixes | KV cache in GPU memory | See Decision 3 — this is the key to saving money |

> Teaching point: **different data has different "access shapes," so it belongs in different kinds of storage.** Cramming conversation history into a relational database, or using `LIKE` to do semantic search, are both cases of using the wrong tool for the job.

## 8. Key architectural decisions and trade-offs ⭐

**Decision 1: streaming output (SSE), or return-all-at-once?**
- All-at-once: simple to implement, but the user stares at a blank screen for a dozen seconds — an experience disaster.
- Streaming: the first token appears within a second, dramatically reducing **perceived latency.**
- **Verdict**: almost always choose streaming. The cost is more complex connection management, trickier retry/recovery after errors, and the gateway holding connections open for a long time. **Perceived latency sometimes matters more than true total latency** — that's a piece of general wisdom.

**Decision 2: compute each request alone, or use "continuous batching"?**
- Alone: latency is controllable, but the GPU sits mostly idle and cost explodes.
- Continuous batching: dynamically stitch multiple users' generation requests into one batch to compute together, maxing out GPU utilization.
- **Verdict**: batching is mandatory, because **the GPU is the number-one scarce resource.** The cost is complex scheduling and possibly higher tail latency on individual requests; you have to tune the balance between "throughput" and "single-request latency."

**Decision 3: should repeated prompt prefixes be cached? (the key to saving money)**
- Recomputing "system prompt + entire history" every turn is simple but extravagantly wasteful — that content was just computed last turn.
- Cache the intermediate results of that prefix (KV cache / prompt caching) and reuse them next turn directly.
- **Verdict**: a must once you scale. **Turning "recompute the expensive prefix" into "read from cache" is one of the biggest cost levers in this kind of system.** The cost is the complexity of cache management, memory footprint, and invalidation strategy.

**Decision 4: stuff in a long context, or retrieve with RAG?**
- Long context: dump all possibly-relevant material into the prompt. Simple, but expensive and slow — and too much noise actually degrades answer quality.
- RAG: retrieve just the few most relevant snippets, and only stuff those in.
- **Verdict**: once the volume of material grows, use RAG. The cost is maintaining a "chunk → embed → retrieve" pipeline, and retrieval quality directly determines answer quality.

**Decision 5: keep conversation state on the client or the server?**
- Client holds the history and sends it all up every turn: the server stays stateless and scales well, but privacy and bandwidth are strained, and you're bounded by the context window.
- Server stores the history: a coherent, cross-device experience, but you have to manage storage and privacy compliance.
- **Verdict**: product-grade apps usually store it server-side (for multi-device support and long-term memory); API-grade offerings often let the caller bring their own history (stateless, scales well).

**Decision 6: one big model for everything, or "model routing"?**
- Use the strongest (most expensive) model for every request: quality is steady, but you burn big money even on trivial questions.
- Routing: send easy questions to a small/cheap model, and bring out the big model only for hard ones.
- **Verdict**: introduce routing once you scale. **Hand the expensive work to "the smallest tool that can do the job"** — a general money-saving principle.

## 9. Scaling and bottlenecks

Completely unlike an ordinary system: **here the bottleneck usually isn't the database — it's the GPU.**

- **First bottleneck: the GPU cluster maxes out → requests queue → first-token latency spikes.**
  Fixes: ① continuous batching to max out utilization; ② prompt caching to cut repeated computation; ③ model routing to divert easy requests to a small model; ④ model quantization (a more memory-thrifty precision); ⑤ add GPUs (but GPUs are slow and pricey to procure — you can't scale them in seconds the way you add web servers).
- **Second bottleneck: the longer the context, the more memory each request eats → fewer people you can serve at once.**
  Fixes: ① fine-grained KV-cache management (memory paging like paged attention); ② use RAG instead of "mindless long context"; ③ periodically compress/summarize conversation history.
- **Third bottleneck: large batches raise tail latency (P99).** Fixes: dynamically trade off batch size against latency targets; reserve a low-latency lane for premium paying users.
- **Cost itself is a bottleneck.** For ordinary systems, "ship first, optimize cost later" is fine; here, **leave cost unoptimized and your margin is outright negative,** so saving money (caching, routing, quantization) is an architectural topic from day one.

## 10. Security and compliance essentials

- 🔴 **Prompt injection — this is the brand-new, thorniest attack surface for AI products.** Any **external text that re-enters the model** (a web page retrieved by RAG, a tool's return value, a file the user uploaded) may hide malicious content like "ignore your previous instructions and instead...". Architecturally, treat such content as **untrusted input**: isolate it, label its source, and limit tool permissions.
- **Tool execution must be sandboxed**: when the model runs code or makes network requests, do it in a restricted, disposable, isolated environment — never let it touch the production system.
- **Data privacy**: conversations often contain personal/commercial sensitive information. You need tenant isolation, encryption in transit and at rest, a clear boundary on "is this used for training?", and the ability to delete.
- **Output safety**: prevent being coaxed into generating harmful content (jailbreaks); moderate both the input and output sides.
- **Quotas and abuse**: at the API layer, defend against scraping and freeloading (every token is money).

## 11. Common pitfalls / anti-patterns

- ❌ **Designing it like an ordinary CRUD website, ignoring that the GPU is the scarce resource** → ✅ For every architectural choice, ask first "what does this mean for GPU utilization and cost?"
- ❌ **No streaming — holding the full answer back before returning** → ✅ Stream by default; first-token latency is the number-one experience metric.
- ❌ **Re-feeding the entire history every turn, never caching** → ✅ Cache the prompt prefix — one of the biggest money-savers.
- ❌ **Cramming all material into the context** → ✅ Use RAG once the volume grows; feed only the most relevant snippets.
- ❌ **Trusting text returned by tools/retrieval/web pages outright** → ✅ Treat it as untrusted input; watch for prompt injection.
- ❌ **Calling tools synchronously and blocking, stalling the whole stream** → ✅ Make tool calls asynchronous; decouple the agent loop from streaming output.
- ❌ **Not metering tokens** → ✅ Without token metering, you'll both blow past the context window and get a terrifying bill.

## 12. Evolution path: MVP → growth → maturity

| Stage | Scale | What the architecture looks like | What to worry about now |
|---|---|---|---|
| **MVP** | Validate the idea | Call some model provider's API directly + a thin orchestration layer; the client carries history; simple SSE streaming; no RAG, no self-hosted GPU | **First validate whether anyone actually uses the product** — don't start by self-hosting a GPU cluster |
| **Growth** | 10K–1M users | Introduce a session store, RAG, input/output moderation, rate limiting/quotas, prompt caching; if self-hosting the model, add continuous batching | Find the cost and latency bottlenecks, drive per-token cost down, hold availability steady |
| **Maturity** | 10M–100M+ | Multi-region GPU clusters, model routing (mixing big and small models), fine-grained caching and memory management, a full agent tool ecosystem, an evaluation/observability pipeline, enterprise-grade multi-tenant isolation | Cost, disaster recovery, security/compliance, continuous evaluation of model quality |

## 13. Reusable takeaways

- 💡 **First find your system's true "scarce resource," and build the architecture around its utilization.** Here it's the GPU; in other systems it may be database connections, bandwidth, or people. Build the architecture on "keep the scarce resource from sitting idle," not on "elegant code."
- 💡 **Perceived latency often matters more than true latency.** Streaming doesn't shorten total time, but it transforms the experience. Any design that "lets the user see feedback sooner" is worth money.
- 💡 **Caching "things that are expensive to recompute" is an enormous lever.** Here it's the KV cache / prompt cache; elsewhere it may be computed results, aggregated views, or rendered pages.
- 💡 **Hand the expensive work to the smallest tool that can do it.** The idea behind model routing is the same as "don't solve a lightweight problem with a heavyweight solution."
- 💡 **Any external data that re-enters your core system is untrusted.** Prompt injection is just the old rule "never trust user input" in its new, AI-era form.

## 🎯 Quick quiz

<Quiz
  question="In this kind of AI chat product, the scarcest resource — the one that essentially determines all cost — is usually?"
  :options="['Number of database connections', 'GPU compute', 'Frontend bandwidth']"
  :answer="1"
  explanation="Almost the entire architecture answers one question: 'how do you keep the expensive GPU fed, fully utilized, and cheap?' Continuous batching, prompt caching, and model routing all serve it."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **papers**. For AI chat products, the three pieces — "inference serving / access orchestration / retrieval" — each get a magnified close-up in this repo as the [Model Inference Serving](../inference-serving/README.md), [AI Gateway](../ai-gateway/README.md), and [RAG Knowledge Base](../rag-knowledge-base/README.md) templates.

**🔧 Open-source prototypes (read the code directly):**
- [vllm-project/vllm](https://github.com/vllm-project/vllm) — a mainstream LLM inference / serving engine, embodying GPU inference, continuous batching, and KV-cache management.
- [langchain-ai/langchain](https://github.com/langchain-ai/langchain) — the classic LLM application framework, embodying the orchestration of RAG and tool calling (function calling).

**📖 Papers:**
- [Efficient Memory Management for LLM Serving with PagedAttention (SOSP'23)](https://arxiv.org/abs/2309.06180) — the paper behind vLLM, on virtual-memory-style paging of the KV cache.

---

> 📌 Remember the AI chat product in one line: **it isn't "a website with very complex logic" — it's "a precision machine spinning around an expensive GPU." Every architectural trade-off ultimately answers: 'how do you use this compute fast, cheaply, and safely?'**
