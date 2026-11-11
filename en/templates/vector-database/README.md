# Vector Database Architecture Template

> **Representative products / prototypes**: Milvus, Qdrant, Weaviate, pgvector, FAISS
> **One-line positioning**: a storage engine purpose-built to store massive high-dimensional vectors and find, in milliseconds, "the K most similar to a query vector" (approximate nearest neighbor, ANN) — the storage foundation for semantic search and RAG.

---

## 1. One-Line Positioning

A vector database = **a storage engine specially optimized for the one task of "finding the most similar."**

An ordinary database excels at "exact matching" (look up id=123, look up name='Zhang San'); a vector store excels at **"fuzzy, semantic similarity"** (find the image most like this one, the sentence closest in meaning to this one). Its signature skill: among a billion vectors of a few hundred dimensions each, return the closest few in milliseconds.

It's the same kind of thing as the [search engine's inverted index](../search-engine/README.md) and the [ride-hailing app's spatial index](../ride-hailing/README.md), just in a different form — **all of them are "organizing data specially for one particular kind of query."**

## 2. The Business Essence: What Problem It Solves

Anything can be vectorized: a passage of text, an image, a clip of audio — all can be encoded by a model into a string of numbers (an embedding), and **the closer in meaning, the closer the vectors sit in space**. So "finding similar" becomes "finding the nearest points in space."

The scenarios it underpins: semantic retrieval for the [RAG Knowledge Base](../rag-knowledge-base/README.md), image-to-image search, recommendation (finding similar products / content), deduplication, face / voiceprint retrieval. After the AI boom, it went from "niche" to "infrastructure."

## 3. Core Requirements and Constraints

**Functional requirements:**
- [ ] Store vectors + metadata (payload)
- [ ] Similarity retrieval: given a query vector, return the nearest top-K
- [ ] Filtered retrieval (e.g., "find the most similar, but only within 'tech' documents")
- [ ] Insert / delete / update, bulk import

**Non-functional requirements / quality attributes:**
| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Retrieval latency** | Milliseconds | Online retrieval / RAG are all waiting on it |
| **Recall** | High (and tunable) | ANN is "approximate"; you must balance accuracy against speed |
| **Scale** | Billions of vectors | AI data volume is enormous |
| **Memory / cost** | Controllable | Vectors eat a lot of memory, directly determining cost |

**Key constraints (boundaries you cannot cross):**
- 🔴 **The curse of dimensionality**: vectors run hundreds to thousands of dimensions; finding the **exact** nearest neighbor in high-dimensional space is prohibitively expensive.
- 🔴 **Vectors eat a lot of memory**: a billion × a thousand dimensions — memory is the hard constraint.
- 🔴 **Similar ≠ relevant**: the nearest vector isn't necessarily the one the business should return.
- 🔴 **Combining filtering + vector search is hard**: "be similar *and* satisfy some condition" is hard to satisfy both efficiently at once.

## 4. The Big Picture

```
═══ Write: build the index ═══
   ┌──────────────┐   ┌────────────────────────────────┐
   │ Vector +      │──▶│ Build ANN index                  │
   │ metadata      │   │ e.g. HNSW (layered proximity     │
   │ (from         │   │ graph) / IVF (clustering)        │
   │  embedding)   │   │                                  │
   └──────────────┘   └────────────────┬───────────────┘
                                       ▼
                          ┌──────────────────────────────┐
                          │  Index storage (shards +       │
                          │  replicas)                     │
                          │  Mainly in memory (can spill   │
                          │  to disk at scale)             │
                          └────────────────┬─────────────┘
═══ Query: approximate nearest neighbor ═══  │
   ┌──────────────┐   ┌────────────────────▼─────────────┐
   │ Query vector  │──▶│ ANN search: quickly converge on   │
   │ (+ filter     │   │ the nearest points along the index│
   │  conditions)  │   │ + filter by metadata → return     │
   └──────────────┘   │ top-K                             │
        ▲             └──────────────────────────────────┘
        │                                  │
        └──────────── the K most similar ◀─┘
```

> The soul of it is that one trade-off: **trade a little accuracy for an enormous gain in speed.** Exact nearest neighbor is a disaster among a billion high-dimensional vectors; ANN algorithms (like HNSW) give up "guaranteeing they find the very nearest" in exchange for "very likely finding a very near one, orders of magnitude faster."

## 5. Component Responsibilities

- **Write / index construction**: organizes vectors into a quickly searchable index structure (graph / clusters). *Why it's needed*: without an index you can only brute-force one-by-one comparisons, which is simply infeasible at billion scale.
- **ANN index**: an approximate-nearest-neighbor index (HNSW / IVF / DiskANN…). *Why it's needed*: this is the core of a vector store, deciding the three-way balance of speed, accuracy, and memory.
- **Query engine**: runs the similarity search, converging on the nearest neighbors. *Why it's needed*: the entry point for online retrieval.
- **Metadata filtering**: filters by condition (category, time, permission) at the same time as vector retrieval. *Why it's needed*: real business rarely does "pure similarity search"; it usually layers on constraints.
- **Shards + replicas**: stores massive vectors sliced across shards, with replicas to handle queries. *Why it's needed*: a single machine can neither hold nor handle billion scale.

## 6. Key Data Flows

**Scenario 1: Insert a vector**
```
1. Get the vector + metadata (e.g., {category: tech, source: doc7})
2. Insert it into the ANN index (e.g., establish connections to neighbors in the HNSW graph)
3. Write to a shard (by id / randomly), and replicate to replicas
```

**Scenario 2: Similarity query (with filtering)**
```
1. Query vector + condition "category=tech" ──▶ query engine
2. Quickly converge on the nearest candidate points along the ANN index (no brute-force full scan)
3. Combine with metadata filtering (keep only category=tech)
4. Return the top-K most similar vectors and their metadata
```

## 7. Data Model and Storage Choices

The core entity is minimal: `vector record (id + embedding + metadata payload)`.

| Data | Where It Lives | Why |
|---|---|---|
| Vectors + ANN index | Mainly in memory | Retrieval must be fast; graph indexes like HNSW run fastest in memory |
| Ultra-large index | Disk (e.g., DiskANN) | When a billion vectors won't fit in memory, trade disk for capacity |
| Metadata payload | With the vector / relational | Filtering, display |
| Original objects (images / text) | Object storage | The vector is just a "fingerprint"; fetch the original by id |

> Teaching point: a vector store's storage problem is **memory** — vectors are many and space-hungry. So "quantization (storing vectors at a more economical precision)" and "DiskANN (put it on disk)" all exist to fit more vectors under the hard constraint of memory.

## 8. Key Architecture Decisions and Trade-offs ⭐

**Decision 1: Exact nearest neighbor, or approximate (ANN)? ⭐**
- Exact (brute-force comparison / exact index): guaranteed to find the truly nearest, but unusably slow under high dimensions + massive scale.
- Approximate (ANN): give up 100% accuracy for orders-of-magnitude speedup.
- **Where to land**: almost always ANN. **"Trade accuracy for speed" is a common bargain when handling massive scale** — the key is that recall is tunable and acceptable.

**Decision 2: Which index type to choose? (by scale and resources) ⭐**
- **HNSW (layered proximity graph)**: fast queries, high recall, but **memory-hungry**. The top choice for small-to-medium scale chasing quality.
- **IVF (inverted + clustering)**: saves memory, needs training, recall slightly lower. Use it at large scale when memory-sensitive.
- **DiskANN**: index on disk, suited to **ultra-large scale that won't fit in a single machine's memory**.
- **Where to land**: HNSW for small-to-medium scale; consider IVF / DiskANN / quantization for ultra-large scale or to save memory.

**Decision 3: Recall vs latency / memory — how to balance? ⭐**
- Turn up the ANN parameters (e.g., HNSW's `ef`, `M`): higher recall, but slower and more memory-hungry.
- **Where to land**: there's no "optimal," only "the recall-latency-cost point that best fits your business" — load-test and tune per scenario.

**Decision 4: A dedicated vector store, or pgvector? (a choice that shifts by stage) ⭐**
- pgvector (install an extension on your existing PostgreSQL): zero new components, in the same database as your business data, transactions convenient. Plenty for the millions.
- A dedicated vector store (Milvus / Qdrant / Weaviate): built for vectors — billion-scale, distributed, feature-rich, but a new system you have to operate separately.
- **Where to land**: **small scale, already on Postgres → start with pgvector**; large scale / need distribution / need advanced features → go to a dedicated store. See Section 12.

## 9. Scaling and Bottlenecks

- **First bottleneck: memory (vectors take up too much space).** → Fix: quantization (lower precision), DiskANN (put it on disk), hot/cold tiering.
- **Second bottleneck: vector count exceeds a single machine.** → Fix: sharding (slice by id / randomly) + replicas to handle queries.
- **Third bottleneck: the overhead of writes and index rebuilds.** → Fix: bulk import, incremental index building, read/write separation.
- **Fourth bottleneck: the efficiency of filtered retrieval.** → Fix: a fused index strategy for "filter + vector," avoiding the waste of "retrieve everything first, then filter."

## 10. Security and Compliance Essentials

- **Multi-tenant isolation**: isolate different tenants / knowledge bases with namespaces or collections.
- **Vectors can also leak privacy**: under certain conditions, an embedding can be inverted to recover the original information — treat it as sensitive data.
- **Access control + metadata permissions**: retrieval must be able to filter by permission.

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Chasing exact nearest neighbor** → ✅ use ANN, accept controllable approximation.
- ❌ **Blindly going HNSW with no regard for memory** → ✅ at large scale, consider IVF / DiskANN / quantization.
- ❌ **Looking only at latency, not recall** → ✅ load-test and trade off both together.
- ❌ **Reaching for a heavy dedicated vector store even for tens of thousands of records** → ✅ pgvector / single-machine FAISS is plenty — don't over-engineer.
- ❌ **Assuming "vector similar" equals "business relevant"** → ✅ evaluate retrieval results against the business, and add reranking where needed.

## 12. Evolution Path: MVP → Growth → Maturity (How to Set It Up at Each Stage)

| Stage | Vector Scale | How to Set It Up (Specifics) | What to Worry About Now |
|---|---|---|---|
| **MVP** | < a million | **Just use pgvector** (add an extension to your existing Postgres), or single-machine **FAISS**; use an HNSW index | Don't introduce a new system; first get semantic retrieval running |
| **Growth** | A million to a billion | Move to a dedicated vector store (**Milvus / Qdrant / Weaviate**), HNSW index, sharding + replicas, filtered retrieval | Balancing recall, latency, and memory cost |
| **Maturity** | A billion+ | Distributed, quantization / DiskANN to cut memory, hot/cold tiering, fusion with full-text retrieval (hybrid search) | Scale, cost, coordination with the retrieval system |

## 13. Reusable Takeaways

- 💡 **"Trade accuracy for speed" is a classic bargain when handling massive scale.** ANN, sampling, Bloom filters, approximate counting… all trade "roughly right" for "much faster."
- 💡 **Special queries need a dedicated index**: similarity queries use ANN, just as full-text uses an inverted index and geography uses a spatial index — don't force a general-purpose tool onto a special shape.
- 💡 **Ask about scale before choosing.** Between pgvector and a distributed vector store, the difference isn't "advanced or not," it's "exactly how many vectors you have."
- 💡 **Similar ≠ relevant**: the business quality of retrieval results must be evaluated separately — the same point as [RAG](../rag-knowledge-base/README.md)'s "retrieval quality sets the ceiling."

## 🎯 Quick Quiz

<Quiz
  question="Why does a vector database use 'approximate nearest neighbor (ANN)' rather than exact search?"
  :options="['The exact algorithm cannot be written', 'Among massive high-dimensional vectors, it trades a little accuracy for an enormous gain in speed', 'Purely to save money']"
  :answer="1"
  explanation="Exact nearest neighbor is unusably slow under high dimensions + massive scale; ANN gives up 100% accuracy for an orders-of-magnitude speedup — 'trade accuracy for speed' is a classic bargain when handling massive scale."
/>

---

## References & Further Reading

> This template is distilled from the following **real open-source projects** and **papers**. The ones below are today's mainstream open-source vector stores — you can read the code and run benchmarks directly.

**🔧 Open-source prototypes (read the code directly):**
- [milvus-io/milvus](https://github.com/milvus-io/milvus) — the most popular open-source vector store by GitHub stars, designed for billion scale, supporting HNSW / IVF / DiskANN and more indexes.
- [qdrant/qdrant](https://github.com/qdrant/qdrant) — a high-performance vector store written in Rust, focused on filtered vector retrieval, available self-hosted or in the cloud.
- [weaviate/weaviate](https://github.com/weaviate/weaviate) — a vector store with a built-in HNSW index, supporting flexible filtering and hybrid search.
- [pgvector/pgvector](https://github.com/pgvector/pgvector) — an extension that adds vector retrieval to PostgreSQL; at the million scale it can often match a dedicated store — the worry-free choice for small-to-medium projects.
- [facebookresearch/faiss](https://github.com/facebookresearch/faiss) — Meta's similarity-search library, supporting a large set of ANN algorithms like IVF / HNSW / PQ plus GPU acceleration — the best starting point for understanding ANN.

**📖 Papers:**
- [HNSW: Efficient and robust approximate nearest neighbor search (Malkov & Yashunin)](https://arxiv.org/abs/1603.09320) — the original paper for HNSW, the default index of mainstream vector stores.

---

> 📌 Remember the vector database in one line: **it isn't "a database that can store arrays" — it's "a retrieval engine specially optimized for 'finding the most similar,' trading a little accuracy for an enormous gain in speed." Every design decision answers one question: "how do I find, in milliseconds, the closest few among a billion high-dimensional vectors?"**
