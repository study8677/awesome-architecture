# Model Inference Serving Architecture Template

> **Representative products / prototypes**: vLLM, SGLang, NVIDIA Triton, HuggingFace TGI, Ray Serve
> **One-line positioning**: stand up a large model on GPUs and serve it, using techniques like continuous batching and paged KV cache to squeeze the expensive GPU compute for maximum throughput and minimum latency.

---

## 1. One-Line Positioning

Model inference serving = **a "throughput-squeezing machine" that revolves around the GPU**. Its entire mission is one sentence: **keep the GPU fed, fully utilized, and used economically.**

It's actually a **zoomed-in close-up** of the "inference service" component from the [AI Chat Product template](../ai-chat-product/README.md). When you're no longer content to call someone else's API and want to run an open-source / private model yourself, this is the machine you face: the input is "model weights + a pile of prompts," the output is "a continuous stream of tokens," and the hardest thing in the middle is **keeping a GPU worth tens of thousands of dollars from idling for even a moment**.

## 2. The Business Essence: What Problem It Solves

It turns "a trained model file" into "an online service that can handle concurrency, with low latency and high throughput."

**Why does it deserve to be a category of system in its own right?** Because its cost structure is extraordinarily abnormal:

> For an ordinary service, "one more request costs almost nothing"; an inference service **burns GPU time for every token it generates**. GPUs are both expensive and scarce, so "**how many tokens a unit of GPU can generate per second**" directly equals your gross margin. The whole architecture is optimized around that single number.

## 3. Core Requirements and Constraints

**Functional requirements:**
- [ ] Load model weights into VRAM
- [ ] Receive requests, run batched inference, and **stream** output token by token
- [ ] KV cache management (the intermediate state of autoregressive generation)
- [ ] Multi-replica / multi-model serving
- [ ] (Optional) quantization, prefix caching, multi-GPU parallelism

**Non-functional requirements / quality attributes:**
| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Throughput (tokens/s/GPU)** | As high as possible | Directly determines how many users a single card serves, and the cost |
| **Time to first token (TTFT)** | < 1s | How long the user waits for the first character |
| **Time per output token (TPOT)** | Low and stable | Determines "how fluently it reads" |
| **GPU utilization** | Maxed out | Idling is burning money |
| **VRAM efficiency** | As economical as possible | VRAM is the hard ceiling; saving it lets you serve more people |

**Key constraints (boundaries you cannot cross):**
- 🔴 **GPUs are expensive and scarce**: the number-one constraint; everything serves its utilization.
- 🔴 **Inference is stateful autoregression**: generating the Nth token depends on the intermediate results of all preceding tokens (the KV cache), and this **devours VRAM**.
- 🔴 **VRAM is the hard ceiling**: once the KV cache + weights fill VRAM, you can't serve any more concurrency.
- 🔴 **Throughput and latency are inherently at odds**: a bigger batch means higher throughput, but also higher per-request latency.

## 4. The Big Picture

```
   Multiple requests (varying lengths)
   ▼ ▼ ▼ ▼
┌─────────────────────────────────────────────────────────────┐
│  Scheduler — where the soul lives                             │
│  • Request queuing                                            │
│  • [Continuous batching]: re-batch dynamically each step;     │
│     finished requests leave the batch immediately, new ones   │
│     join immediately — don't make the GPU wait for "the       │
│     slowest one"                                              │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GPU execution engine                                         │
│  ┌───────────────┐   ┌─────────────────────────────────┐    │
│  │ Model weights │   │ KV cache (paged management,       │    │
│  │ (VRAM)        │   │ like OS virtual memory)           │    │
│  └───────────────┘   └─────────────────────────────────┘    │
│      Each step computes a batch of tokens ──▶ stream them     │
│      back token by token                                      │
└───────────────────────────┬─────────────────────────────────┘
                            ▼  Model weights loaded into VRAM from
                  ◀══ stream tokens back ══   object storage at startup
```

> The soul component is the **scheduler**: it decides whether the GPU "runs full-tilt around the clock" or "everyone waits while one person finishes writing." Continuous batching turns the latter into the former, and this one decision can multiply throughput several-fold.

## 5. Component Responsibilities

- **Scheduler**: manages the request queue and **dynamically re-batches at every generation step** (continuous batching). *Why it's needed*: this is the master switch for GPU utilization — see Decision 1.
- **KV cache management**: manages the KV cache for each in-flight request, using **paging** (PagedAttention) to avoid VRAM fragmentation. *Why it's needed*: the KV cache devours VRAM and changes size dynamically; coarse allocation wastes huge amounts of VRAM — see Decision 2.
- **GPU execution engine**: actually runs the model's forward pass and samples out tokens. *Why it's needed*: it's where the core compute lives.
- **Weight loading**: loads the model file — tens to over a thousand GB — from object storage into VRAM. *Why it's needed*: the model is too large; load it in one shot at startup.
- **(Optional) prefix cache**: reuses the already-computed KV of a shared prefix (e.g., the system prompt). *Why it's needed*: skips redundant computation, sharing its lineage with prompt caching.
- **Routing / multi-replica**: distributes requests across multiple GPU replicas. *Why it's needed*: scale out horizontally when a single card can't keep up.

## 6. Key Data Flows

**Scenario 1: Continuous batching (this machine's core magic)**
```
Traditional [static batching]:
  Gather 8 requests → compute together → must wait for the slowest (longest-generating) one
  to finish → the whole batch ends together
  ✗ Short requests finished long ago but are forced to idle along ── massive GPU idling

[Continuous batching]:
  After each generation step, check: who finished? → let it leave the batch immediately,
  fill in new requests
  ✓ The GPU works full-tilt at every step, no "waiting around" ── throughput multiplied
```

**Scenario 2: One streaming generation**
```
1. Request enters the queue ──▶ scheduler folds it into the current batch
2. Allocate paged blocks for it in the KV cache (prefill phase: process the input prompt)
3. Generate step by step (decode phase): each step computes the next token ──▶ stream it back
   immediately
4. Hit EOS or reach the limit ──▶ this request leaves the batch, freeing its KV cache pages for
   others
```

## 7. Data Model and Storage Choices (Essentially VRAM Layout)

For this kind of system, the "data" mostly lives in **VRAM**, not in a database.

| Data | Where It Lives | Why |
|---|---|---|
| Model weights | Object storage → loaded into VRAM | Large, immutable, loaded at startup |
| KV cache | VRAM (paged blocks) | The intermediate state of autoregressive generation, devours VRAM, needs fine-grained management |
| Request / batch state | Memory | High-frequency, ephemeral, born and dying with each request |
| Prefix cache | VRAM / memory | Reuses the computed results of hot prefixes |

> Teaching point: the "storage problem" of inference serving isn't on disk, it's in **VRAM** — how to fit the KV caches of as many concurrent requests as possible into limited VRAM is what most sets it apart from an ordinary system.

## 8. Key Architecture Decisions and Trade-offs ⭐

**Decision 1: Static batching, or continuous batching? (the master switch for throughput) ⭐**
- Static batching: gather a batch, compute together, finish together. Simple, but **short requests idle while dragged along by long ones**, and GPU utilization is low.
- Continuous batching: dynamically join and leave the batch each step.
- **Where to land**: continuous batching, mandatory. The cost is scheduling complexity, but the gain in GPU utilization and throughput is an order of magnitude.

**Decision 2: KV cache — contiguous allocation or paging? ⭐**
- Reserve one big contiguous block of VRAM per request: simple, but request length is uncertain, producing lots of **VRAM fragmentation** and waste.
- Paging (PagedAttention): like an OS managing virtual memory, slice the KV cache into small blocks allocated on demand.
- **Where to land**: paging. It borrows the OS's mature wisdom, dramatically improving VRAM utilization and supporting higher concurrency.

**Decision 3: Throughput vs latency — how to balance?**
- Big batch: high throughput, but per-request latency (especially tail latency P99) is pushed up.
- Small batch: low latency, but the GPU isn't fed, throughput is low, cost is high.
- **Where to land**: set it by the business — offline batch jobs lean toward big batches for throughput; online interaction leans toward small batches for latency; an advanced move is to separately schedule the prefill and decode phases.

**Decision 4: Self-host inference, or just call an API? (what an MVP should think through most) ⭐**
- Call a provider's API: zero ops, pay-as-you-go, the fastest way to get started.
- Self-host: use open-source / private models, data stays with you, and per-token gets cheaper at scale — but you have to raise GPUs and this whole complex system.
- **Where to land**: **call an API first** (via an [AI Gateway](../ai-gateway/README.md)), and only self-host when "the volume is large enough that self-hosting is more cost-effective" or "you must have a private / custom model."

## 9. Scaling and Bottlenecks

- **First bottleneck: single-card throughput.** → Fix: continuous batching + paged KV + prefix cache, squeeze the single card dry.
- **Second bottleneck: the model is too big to fit on one card.** → Fix: multi-GPU parallelism (tensor parallelism / pipeline parallelism), slicing one model across multiple cards.
- **Third bottleneck: request volume exceeds a single replica.** → Fix: multi-replica + load balancing, scale out horizontally.
- **Fourth bottleneck: long context blows up VRAM.** → Fix: paged KV, quantization, context compression.
- **GPU scaling is slow and expensive**: unlike adding a web server in seconds, capacity planning must be done ahead of time.

## 10. Security and Compliance Essentials

- **Multi-tenant isolation**: among the different tenants sharing a GPU, VRAM / requests must be isolated to prevent data cross-contamination.
- **Input limits**: overly long input blows up VRAM and can be used for DoS — limit the length.
- **Model-weight protection**: private / proprietary model weights are a core asset; access must be controlled.
- **Resource quotas**: prevent a single user from hogging the GPU and dragging everyone down.

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Using static batching** → ✅ continuous batching, don't make the GPU wait around.
- ❌ **Allocating the KV cache in big contiguous blocks** → ✅ paged management, eliminating VRAM fragmentation.
- ❌ **Running each request separately (batch=1)** → ✅ batch them, or the GPU idles badly and cost explodes.
- ❌ **Blindly chasing an enormous batch** → ✅ balance throughput against tail latency.
- ❌ **Self-hosting a GPU cluster at the MVP stage** → ✅ call an API first, self-host once the volume warrants it.

## 12. Evolution Path: MVP → Growth → Maturity (How to Set It Up at Each Stage)

| Stage | Scale | How to Set It Up (Specifics) | What to Worry About Now |
|---|---|---|---|
| **MVP** | Validating the idea | **Don't self-host!** Just call a model provider's API (via an [AI Gateway](../ai-gateway/README.md)). If you absolutely need a local / private model, stand up a single-card instance with vLLM / TGI | Validate the product first; don't start out burning GPU |
| **Growth** | Self-hosting at scale | Self-host **vLLM / SGLang**: turn on continuous batching + paged KV + prefix cache; quantize to save VRAM; multi-replica + load balancing | Squeeze single-card throughput and per-token cost to the optimum |
| **Maturity** | Large models / high concurrency | Multi-GPU parallelism for large models, separate prefill/decode scheduling, multi-region GPU pools, model routing (mixing large and small models), autoscaling | Cost, capacity planning, disaster recovery, balancing quality and latency |

## 13. Reusable Takeaways

- 💡 **First recognize the system's true "scarce resource," and architect around its utilization.** Here it's the GPU, so everything serves "don't let the GPU idle" — the same mindset as [AI Chat Product](../ai-chat-product/README.md).
- 💡 **Batching is the lever for throughput.** Merging multiple requests into one computation is a universal efficiency move, from databases to GPUs.
- 💡 **Be good at borrowing mature wisdom from other domains.** PagedAttention lifted the OS's "virtual-memory paging" wholesale to cure KV-cache fragmentation — good architecture is often "old ideas applied to new problems."
- 💡 **Cache the things that are expensive to recompute.** The prefix cache reuses already-computed KV, equivalent to prompt caching — a universal money-saving trick.
- 💡 **"Build vs buy" — do the scale math first.** Self-hosting heavy infrastructure before you've reached scale is textbook over-engineering.

## 🎯 Quick Quiz

<Quiz
  question="What's the key to maxing out GPU utilization and dramatically boosting throughput?"
  :options="['Static batching: gather a batch, compute together, finish together', 'Continuous batching: dynamically join and leave the batch each step, never make the GPU wait around', 'Strictly processing each request on its own']"
  :answer="1"
  explanation="In static batching, short requests idle while dragged along by long ones; continuous batching keeps the GPU working full-tilt at every step, and throughput can multiply several-fold."
/>

---

## References & Further Reading

> This template is distilled from the architectural ideas of the following **real open-source projects** and **papers**. These projects are the de facto standard for LLM inference serving today — reading them directly is the most reliable route.

**🔧 Open-source prototypes (read the code directly):**
- [vllm-project/vllm](https://github.com/vllm-project/vllm) — the mainstream high-throughput, VRAM-efficient LLM inference engine; the benchmark implementation of continuous batching + PagedAttention.
- [sgl-project/sglang](https://github.com/sgl-project/sglang) — a high-performance serving framework with RadixAttention prefix caching, zero-overhead scheduling, and prefill/decode separation.
- [huggingface/text-generation-inference](https://github.com/huggingface/text-generation-inference) — HuggingFace's inference-serving toolkit (now in maintenance mode, still a good sample for understanding the architecture).
- [triton-inference-server/server](https://github.com/triton-inference-server/server) — NVIDIA's general-purpose inference server, supporting multiple frameworks, multiple models, and dynamic batching.

**📖 Papers / docs:**
- [Efficient Memory Management for LLM Serving with PagedAttention (SOSP'23)](https://arxiv.org/abs/2309.06180) — the paper behind vLLM, making clear "managing the KV cache with the OS paging idea."
- [SGLang: Efficient Execution of Structured LM Programs](https://arxiv.org/abs/2312.07104) — the SGLang paper, on RadixAttention prefix caching and high-throughput execution.

---

> 📌 Remember model inference serving in one line: **it isn't as simple as "getting the model running" — it's "a precision machine that revolves around an expensive GPU, squeezing the compute to the limit with continuous batching and VRAM paging." Every design decision answers one question: "how do I keep every GPU generating tokens at full load every second?"**
