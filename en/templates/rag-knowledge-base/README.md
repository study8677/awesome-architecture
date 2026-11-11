# RAG Knowledge Base / Retrieval-Augmented Generation Architecture Template

> **Representative products / prototypes**: RAGFlow, LlamaIndex, Haystack, Dify, and all manner of "enterprise knowledge-base Q&A / document assistants"
> **One-line positioning**: chunk, vectorize, and index your own documents so that before the large model answers, it first retrieves the most relevant fragments and stuffs them into context — answering based on "your materials / the latest information" rather than relying solely on what it memorized during training.

---

## 1. One-Line Positioning

RAG (Retrieval-Augmented Generation) = **letting the large model take an open-book exam**.

It doesn't retrain the model. Instead, at the very moment the user asks a question, it **retrieves the relevant materials from your knowledge base on the fly and stuffs them into the prompt**, so the model "answers while looking at the materials." In essence, it's **a search engine stitched onto a large model**: [search](../search-engine/README.md) is responsible for "finding the right materials," and the model is responsible for "organizing the materials into an answer."

## 2. The Business Essence: What Problem It Solves

General-purpose large models have three fatal flaws: **they hallucinate (confidently making things up), their knowledge goes stale (they don't know what happened after the training cutoff), and they don't know your private data (they've never seen your company's internal documents)**.

RAG eases all three at once: feed the model authoritative, up-to-date, private materials as "open-book material," so its answers are **backed by evidence**.

Typical scenarios: enterprise knowledge-base Q&A, intelligent customer service, product-doc assistants, Q&A over specialized materials in law / medicine / financial reports. What it sells is "**making a general-purpose model reliably answer questions about your domain**."

## 3. Core Requirements and Constraints

**Functional requirements:**
- [ ] Document ingestion (multiple formats: PDF / Word / web pages / tables…)
- [ ] Chunking + vectorization (embedding) + index building
- [ ] Retrieval (vector semantic search + keyword search)
- [ ] Reranking: pick the most relevant from the recalled candidates
- [ ] Assemble context to feed the model and generate an answer **with cited sources**

**Non-functional requirements / quality attributes:**
| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Retrieval quality (recall + precision)** | As high as possible | RAG's lifeline: if it can't retrieve / retrieves wrong, the model will surely talk nonsense |
| **Traceability** | Answers can point back to the source text | "Backed by evidence" is what makes it trustworthy and verifiable |
| **Freshness** | New docs become searchable promptly | The knowledge base must support continuous updates |
| **Cost** | Embedding + retrieval + generation all cost money | All three stages burn money; it must stay controllable |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Retrieval quality sets the ceiling**: how good a RAG answer is, **its ceiling is how good the retrieval is** — garbage in, garbage out.
- 🔴 **The context window is finite**: you can't stuff in all the material, only the most relevant few chunks, so "which chunks to pick" is critical.
- 🔴 **Similar ≠ relevant**: a fragment with high vector similarity may not actually answer the question.
- 🔴 **Retrieved content is untrusted input**: it may hide prompt injection.

## 4. The Big Picture

```
═══════════ Offline: build the knowledge base (turn docs into a searchable form) ═══════════
   ┌────────┐  ┌────────┐  ┌──────────┐  ┌──────────────────────┐
   │ Doc src │─▶│ Parse  │─▶│ Chunk     │─▶│ Vectorize (embedding) │
   │ PDF/web │  │ extract│  │ chunking │  │ + build index         │
   └────────┘  └────────┘  └──────────┘  └──────────┬───────────┘
                                                    ▼
                                  ┌──────────────────────────────┐
                                  │ Vector store (chunk vectors + │
                                  │ metadata + sources)           │
                                  │ + (optional) full-text/       │
                                  │   keyword index               │
                                  └───────────────┬──────────────┘
═══════════ Online: retrieve + generate ═══════════               │
   ┌────────┐  ┌──────────────┐  ┌────────────────▼─────────────┐
   │ User   │─▶│ Retriever     │─▶│ ① Hybrid retrieval (vector +  │
   │ query  │  │              │  │   keyword) recall             │
   └───▲────┘  └──────────────┘  │ ② Rerank, pick top-K          │
       │                         └────────────────┬─────────────┘
       │                                          ▼
       │         ┌────────────────────────────────────────────┐
       └─────────│ Assemble prompt (question + retrieved        │
   answer w/cites│ fragments) → LLM generates                   │
                 │ → output answer + cited sources              │
                 └────────────────────────────────────────────┘
```

> The soul of it is those two steps: "**organize the materials well offline + find the right materials online**." The model itself is merely the final link that "writes the answer while reading the materials" — **in RAG, 80% of the skill is in retrieval, 20% in generation**.

## 5. Component Responsibilities

- **Document parsing / loading**: extracts clean text (including tables and layout) from documents of every format. *Why it's needed*: garbage input drags everything downstream straight down; parse quality is the invisible foundation.
- **Chunker**: splits long documents into small chunks suited to both retrieval and feeding the model. *Why it's needed*: chunks too big bring noise, chunks too small lose context — chunking directly drives retrieval quality (see Decision 2).
- **Embedding model**: turns text chunks into vectors. *Why it's needed*: vectors are the basis of "semantic retrieval."
- **Vector store**: stores chunk vectors + metadata and runs similarity search. *Why it's needed*: this is RAG's storage foundation — see the [Vector Database template](../vector-database/README.md).
- **Retriever + reranker**: first recall broadly (vector + keyword), then rerank to pick the most relevant. *Why it's needed*: the two-stage "recall + rerank" shares its lineage with the [search engine](../search-engine/README.md).
- **Context assembly + LLM**: splices the question and retrieved fragments into a prompt and generates an answer with citations. *Why it's needed*: this is the "generation" link; citations make the answer traceable.

## 6. Key Data Flows

**Scenario 1: Document ingestion (offline indexing)**
```
1. Upload a batch of documents ──▶ parse into text (including tables, heading hierarchy)
2. Chunk: split into small overlapping chunks by semantics / structure
3. Each chunk ──▶ embedding ──▶ get a vector
4. Vector + source text + source metadata ──▶ write to vector store (+ optional full-text index)
```

**Scenario 2: One Q&A round (retrieval + generation)**
```
1. User asks "How many days is our refund policy?"
2. Vectorize the question ──▶ run similarity search + keyword search in the vector store
   → recall ~20 candidate chunks
3. Rerank → pick the most relevant top-3~5 chunks
4. Assemble prompt: [system prompt + these chunks + user question] ──▶ feed the LLM
5. LLM generates an answer based on the materials ──▶ attach a citation like
   "Source: Policy Doc, Section 3.2"
```
> The rerank in step 3 is critical: **vector recall is "broad and coarse," reranking is "precise and accurate."** Without reranking, the chunks you stuff in often include filler that's just making up the numbers.

## 7. Data Model and Storage Choices

Core entities: `document` ─ `chunk (text + vector + metadata + source)`.

| Data | Storage Type | Why |
|---|---|---|
| Chunk vectors + metadata | Vector store | Must search by semantic similarity — see [Vector Database](../vector-database/README.md) |
| Keyword / full-text index | Search engine | The keyword leg of hybrid retrieval — see [Search Engine](../search-engine/README.md) |
| Original documents | Object storage | Large, immutable, fetched by ID for display |
| Document / chunk metadata | Relational | Permissions, source, version |

## 8. Key Architecture Decisions and Trade-offs ⭐

**Decision 1: RAG, long context, or fine-tuning? (pick the right route first) ⭐**
- Long context: cram all the material into the prompt. Simple, but expensive and slow; once there's a lot of material it won't fit, and the noise drags down quality.
- Fine-tuning: train the knowledge into the model. Feels like a once-and-for-all fix, but it's expensive, slow, hard to update, and prone to forgetting old knowledge.
- RAG: retrieve on the fly at question time. Materials can be updated anytime, answers are traceable, and the cost-effectiveness is high.
- **Where to land**: **lots of material / needs frequent updates / needs traceability → RAG**; very little, fixed material → long context; want to change the model's "behavioral style" rather than its "knowledge" → fine-tuning. The three can also be combined.

**Decision 2: How to chunk? (the invisible switch for retrieval quality) ⭐**
- Fixed-size chunking: simple, but may cut a complete thought right in half.
- Chunk by semantics / structure + appropriate overlap: preserves semantic integrity, and overlap prevents loss of boundary information.
- **Where to land**: start from "fixed size + overlap"; when quality falls short, move to "chunk by structure / semantics." **Chunking is the most underrated link in RAG, yet the one that most affects results.**

**Decision 3: Pure vector retrieval, or hybrid retrieval? ⭐**
- Pure vector: great at semantic approximation, but actually poor at proper nouns and exact keywords (product model numbers, person names).
- Hybrid (vector + keyword BM25): the two complement each other, usually a marked improvement.
- **Where to land**: production-grade RAG mostly uses hybrid retrieval + reranking. The cost is more complexity and maintaining two indexes.

**Decision 4: Should you enrich chunks with context?**
- Bare chunks: once a chunk is severed from its source text, its meaning can be incomplete ("It rose 20%" — *it* being what?).
- Context enrichment (e.g., prepend a source-summary sentence to each chunk before vectorizing): more accurate recall.
- **Where to land**: worth doing in scenarios sensitive to recall quality (see Anthropic's Contextual Retrieval).

## 9. Scaling and Bottlenecks

- **First bottleneck: growing vector scale.** → Fix: shard + replicate the vector store — see [Vector Database](../vector-database/README.md).
- **Second bottleneck: retrieval latency.** → Fix: tune the ANN index, cache hot queries, and rerank only a small set of candidates.
- **Third bottleneck: embedding cost (massive docs / frequent updates).** → Fix: batch vectorization, incremental updates (recompute only the changed chunks), caching.
- **Fourth bottleneck: multiple knowledge bases / multi-tenancy.** → Fix: isolate by knowledge base / tenant with namespaces + filter by metadata at retrieval time.

## 10. Security and Compliance Essentials

- 🔴 **Retrieved content is untrusted input**: a retrieved document fragment may hide a prompt injection like "Ignore the instructions above…" — treat it as untrusted text. It's the same pit as Section 10 of [AI Chat Product](../ai-chat-product/README.md).
- **Permission filtering**: a user may only retrieve documents **they have permission for**; filtering must take effect at the retrieval stage, never "retrieve first, then hide" (same as [Search Engine](../search-engine/README.md)).
- **Private-data leakage**: knowledge bases often contain sensitive materials; do tenant isolation and encryption in transit / at rest.
- **Source trustworthiness**: citations must point back to a real source, to prevent "fabricated citations."

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Poor retrieval quality, yet blaming the model for being dumb** → ✅ RAG's ceiling = retrieval's ceiling; optimize retrieval first.
- ❌ **Chunking by gut feel (too big / too small / no overlap)** → ✅ chunk by semantics + overlap, and evaluate continuously.
- ❌ **Vector retrieval only** → ✅ hybrid retrieval + reranking, especially for exact keywords.
- ❌ **Treating retrieved content as trustworthy** → ✅ treat it as untrusted input, guard against injection.
- ❌ **Not providing citations** → ✅ traceability is what makes it trustworthy and verifiable.
- ❌ **Forcing RAG where long context / fine-tuning would do** → ✅ pick the right route first.

## 12. Evolution Path: MVP → Growth → Maturity (How to Set It Up at Each Stage)

| Stage | Scale | How to Set It Up (Specifics) | What to Worry About Now |
|---|---|---|---|
| **MVP** | A handful of documents | Use an off-the-shelf framework (**LlamaIndex / Dify / RAGFlow**), fixed-size chunking + pure vector retrieval, just get Q&A working | Validate whether the "retrieve + answer" pipeline holds up at all |
| **Growth** | Knowledge base at scale | Hybrid retrieval + reranking, semantic chunking, citation traceability, permission filtering, and **establish retrieval-quality evaluation** | Push up recall / precision, control cost |
| **Maturity** | Massive / multi-tenant | Context-enriched retrieval, large-scale vector-store sharding, continuous retrieval-quality evaluation, Agentic RAG (let an [Agent](../ai-agent-platform/README.md) retrieve over multiple rounds) | Retrieval quality, scale, cost, observability |

## 13. Reusable Takeaways

- 💡 **The "open-book exam" mindset**: rather than making the system "memorize" everything (fine-tuning / a bigger model), make it "know how to look things up" (retrieval). Lookup-able, updatable, traceable — often a better deal than rote memorization.
- 💡 **The two-stage "recall + rerank" funnel** shares its exact lineage with the [search engine](../search-engine/README.md) — broad first, then precise, a universal paradigm for "picking the few out of the many."
- 💡 **Quality is decided by the weakest link**: parsing, chunking, retrieval, reranking — if any one link is feeble, it drags down the whole. Find the weakest link and optimize it first.
- 💡 **Any external content that re-enters the model is untrusted input** — RAG retrieval results are no exception.

## 🎯 Quick Quiz

<Quiz
  question="What mainly determines the ceiling on a RAG knowledge base's answer quality?"
  :options="['How big the underlying model is', 'Whether retrieval is accurate (whether it found the right materials)', 'How long the prompt is written']"
  :answer="1"
  explanation="RAG's ceiling is retrieval's ceiling — garbage in, garbage out; if it can't retrieve / retrieves wrong, even the strongest model will talk nonsense."
/>

---

## References & Further Reading

> This template is distilled from the following **real open-source projects** and **public engineering resources**. If you want to get hands-on, these frameworks will get you a working RAG fastest.

**🔧 Open-source prototypes (read the code directly):**
- [infiniflow/ragflow](https://github.com/infiniflow/ragflow) — an open-source RAG engine focused on "deep document understanding," handling parsing / chunking / retrieval / agents end to end.
- [run-llama/llama_index](https://github.com/run-llama/llama_index) — one of the most popular RAG / data frameworks, with 300+ integrations, great for quickly assembling a retrieval pipeline.
- [deepset-ai/haystack](https://github.com/deepset-ai/haystack) — explicitly models RAG / agents as "modular, swappable pipelines" (retriever / reranker / generator).
- [langgenius/dify](https://github.com/langgenius/dify) — an LLM application platform with a visual UI, with a built-in RAG pipeline and knowledge-base management.

**📖 Engineering articles:**
- [Anthropic: Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — uses "enrich each chunk with context" to cut retrieval failure rate by 49% (67% with reranking) — a must-read for understanding chunking / retrieval optimization.

---

> 📌 Remember RAG in one line: **it isn't "a smarter model" — it's "letting the model take an open-book exam." Every design decision answers one question: "at the very moment of the question, how do I accurately find the most relevant materials and stuff them into the model?" Find the right materials, and the answer becomes reliable.**
