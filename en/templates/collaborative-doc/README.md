# Real-Time Collaborative Document — Architecture Template

> **Representative products**: Google Docs, Tencent Docs, Feishu Docs, Notion, Figma
> **One-line definition**: Let many people edit the same document at the same time, merging everyone's changes in real time without overwriting each other, so that everyone ends up seeing exactly the same result.

---

## 1. One-Line Definition

A real-time collaborative document = **one local copy on every client** + **an engine that merges everyone's editing intent into a single consistent state, in real time**.

Its real difficulty isn't storage — it's a deceptively simple question: **when two people edit the same sentence in the same second, what do you do?** You can't make one person wait on a lock (that's no longer collaboration), and you can't let whoever saves last overwrite whoever saved first (that's data loss). The soul of the whole architecture is the algorithm that **merges concurrent edits without locks and guarantees everyone converges to the same state.**

## 2. Business Essence: What Problem Does It Solve?

It kills off the painful round-trip of "**email the file → everyone edits their own copy → email it back → merge by hand → `final_v3_final_really_final.docx`**." It turns collaboration from an "asynchronous relay" into "synchronous co-creation," where everyone sees what everyone else is doing in real time.

Where the money comes from: enterprise collaboration suite subscriptions, per-team / per-workspace seats, and premium permission and compliance features. **The very "live" feeling of collaboration is the product's moat.**

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Multiple people editing the same document in real time
- [ ] Seeing others' cursors / selections / online status (presence)
- [ ] Offline editing, auto-syncing once back online
- [ ] Version history and rollback
- [ ] Comments / annotations

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Real-time latency** | Sub-second sync of changes | The whole "we're in the same room" feeling depends on it |
| **Convergent consistency** | Everyone ends up identical | Two people must never see different documents |
| **Conflict merging** | No one's edits dropped or overwritten | This is the bottom line of collaboration |
| **Offline availability** | Edit while disconnected, merge on return | Real networks always drop |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Editing is inherently concurrent**: multiple people may change the same spot at once, and **each person's intent must be preserved**.
- 🔴 **The network is laggy and drops**: the order in which changes reach the server and other users is unpredictable.
- 🔴 **No brute-force locking**: "lock the whole paragraph before you can edit" completely destroys the collaboration experience.

## 4. Architecture Overview

```
   User A's browser            User B's browser            User C's browser
 ┌────────────┐           ┌────────────┐           ┌────────────┐
 │ Local copy │           │ Local copy │           │ Local copy │
 │ + editor   │           │ + editor   │           │ + editor   │
 └─────┬──────┘           └─────┬──────┘           └─────┬──────┘
       │ Send "operations (op)"  │ Bidirectional,      │
       └────────── WebSocket persistent connection ─────┴──────────┘
                                          ▼
              ┌────────────────────────────────────────┐
              │  Collaboration service (merge engine)   │
              │  • Route all ops for one doc to one      │
              │    handler                               │
              │  • [Single-threaded, serial] processing  │
              │    to fix a global order                 │
              │  • OT / CRDT merge: transform ops so     │
              │    they don't overwrite each other       │
              │  • Broadcast merged ops to all collabs   │
              └───────────────────┬────────────────────┘
                                  ▼
              ┌────────────────────────────────────────┐
              │  Persistence: operation log (append)     │
              │  + periodic snapshots                    │
              └────────────────────────────────────────┘
```

> The soul component is the **merge engine inside the collaboration service**: it takes "edits that arrive out of order from many people" and arranges them into "one order everyone agrees on," guaranteeing that after merging, everyone converges to the same document. **Note that it is single-threaded and serial per document** — this is the key move that uses "order" to kill "concurrency hell."

## 5. Component Responsibilities

- **Client local copy + editor**: edit locally first and display immediately (optimistic update), while sending the "operations" to the server. *Why it's needed*: instant local response is what makes editing feel smooth; it's also the foundation for offline availability.
- **Persistent-connection gateway (WebSocket)**: maintains a bidirectional, real-time channel for each collaborator. *Why it's needed*: collaboration requires the server to actively push other people's changes down, which plain request-response can't do.
- **Collaboration / merge engine**: processes all operations **serially** per document, merges concurrent edits with OT / CRDT, then broadcasts. *Why it's needed*: this is the core of guaranteeing "no overwrite + convergent consistency."
- **Operation log (append-only)**: records every operation in its final order. *Why it's needed*: enables replay to rebuild the document, version history, and auditing.
- **Snapshots**: periodically store the full state of the document. *Why it's needed*: avoids replaying every operation from the beginning each time.
- **Presence**: who's online, where their cursor is, what they've selected. *Why it's needed*: the "see each other" experience of collaboration.

## 6. Key Data Flows

**Scenario 1: Two people editing the same sentence concurrently (the core challenge of collaboration)**
```
The document currently reads: "Hello World"
  User A inserts "beautiful " at position 6  →  wants "Hello beautiful World"
  User B simultaneously deletes "World" at the end  →  wants "Hello "

  ✗ Overwrite ("last writer wins"): one person's change is dropped
  ✓ Merge engine (OT): the later-arriving op is [transformed] into the
     coordinate space where "the earlier op has already taken effect,"
     so both intents survive → everyone converges to "Hello beautiful "
```

**Scenario 2: Reconnecting after offline editing**
```
1. User goes offline, keeps editing locally (ops queue up locally)
2. Reconnects ──▶ sends the offline ops to the server one by one
3. The server merges and orders them against others' ops from that period
4. Syncs the merged result back; the local copy converges to match everyone
```

## 7. Data Model & Storage Choices

Core idea: **a document = the result of a stream of operations (ops) applied in order**, not a "final text" that gets repeatedly overwritten.

| Data | Storage type | Why |
|---|---|---|
| Operation log (op sequence) | Append-only log | Insert-only, never modified; replayable, supports history |
| Document snapshots | Document store / object storage | Speeds up loading, avoids replaying every op |
| Document metadata / permissions | Relational | Structured, needs consistency |
| Presence | In-memory | Ephemeral, high-frequency, invalid the moment a connection drops |

> Teaching point: **modeling state as an "operation sequence" rather than a "final value"** buys you three things at once: collaborative merging, version history, and full auditing. This is exactly the idea of Event Sourcing — see [04 · Architecture Patterns](../../tutorial/04-十大核心架构模式.md).

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: How do you merge concurrent edits? Locks / OT / CRDT? (the crux of collaboration) ⭐**
- **Locks**: whoever edits locks a segment. Simplest to implement, but **it's fundamentally queuing, not collaboration** — an experience disaster.
- **OT (Operational Transformation)**: "transform" later-arriving ops into the coordinate space after earlier ops took effect. **The mainstream approach**; needs a central server to fix the operation order; the algorithm is complex but mature.
- **CRDT (Conflict-free Replicated Data Type)**: design the data so that **no matter what order operations arrive in, the merged result is identical**. **Naturally suited to offline and decentralized scenarios**, but the data structures carry extra space / metadata overhead.
- **Leaning**: products with a central server tend to use OT; strongly offline / end-to-end / decentralized scenarios lean toward CRDT. **The core of both is "preserve intent, not overwrite."**

**Decision 2: Process one document's operations single-threaded and serial ⭐**
- Processing one document's operations in parallel across multiple nodes: you fall into the "who came first" concurrency hell.
- Route all operations for one document to **the same handler, processed serially**: a single order falls out naturally.
- **Leaning**: almost always pick a single-writer serial model. **This is the classic technique of "turning a concurrency problem into an ordering problem"** — per-document serialization won't become a bottleneck, because the number of editors on a single document is limited.

**Decision 3: Sync the whole document, or only transmit incremental operations?**
- Sending the whole document: simple, but every single-character edit ships a huge blob — bad for both bandwidth and latency.
- Sending only operations (ops): "insert X at position 6" is just a few bytes.
- **Leaning**: transmit incremental operations, always. This is the foundation of smooth real-time collaboration.

**Decision 4: Store only snapshots, or operation log + snapshots?**
- Storing only the latest snapshot: easy, but **no history, no auditing, no replay**.
- Operation log + periodic snapshots: roll back to any version *and* load quickly.
- **Leaning**: combine both. The log gives you "time travel," the snapshot gives you "fast loading."

## 9. Scaling & Bottlenecks

- **First bottleneck: a flood of persistent connections** (one per collaborator). → Fix: horizontally scale the persistent-connection layer, grouping connections by document.
- **Second bottleneck: ultra-hot documents** (hundreds of people editing the same one). → Fix: single-writer per document is still the ceiling; for huge documents you can **shard them** (different chapters collaborate independently), or route read-only viewers through broadcast rather than into the merge.
- **Third bottleneck: the operation log grows without bound.** → Fix: after taking periodic snapshots, compact / archive old operations.
- **Sharded routing by document**: all operations for one document must land on the same handler — this is both a constraint and what makes sharding clean (route by document ID).

## 10. Security & Compliance Essentials

- **Permission granularity**: who can view / comment / edit; permissions may be changed **mid-collaboration** and must take effect in real time.
- **Document leakage**: the scope of a sharing link (anyone-with-link vs invite-only), expiry, watermarks.
- **The trade-off of end-to-end encryption**: under E2EE the server can't see the plaintext, but **if the server can't see the plaintext, it can't perform merging in the cloud** — a real conflict between privacy and collaboration capability.
- **Auditing**: who changed what and when; the operation log supports this naturally.

## 11. Common Pitfalls / Anti-patterns

- ❌ **Handling multi-person editing with "last writer overwrites"** → ✅ OT / CRDT merge, preserving everyone's intent.
- ❌ **Implementing "collaboration" with locks** → ✅ that's queuing; real collaboration needs lock-free merging.
- ❌ **One document's operations processed out of order by multiple nodes** → ✅ single-writer serial per document, fixing a single order.
- ❌ **Syncing the entire document on every change** → ✅ transmit only incremental operations.
- ❌ **Storing only the latest snapshot, discarding operation history** → ✅ operation log + snapshots, buying you versioning and auditing.

## 12. Evolution Path: MVP → Growth → Maturity

| Stage | Scale | What the architecture looks like | What to worry about now |
|---|---|---|---|
| **MVP** | A handful of people on one doc | Central-server OT + WebSocket + operation log | First get "two people editing at once without clashing" working |
| **Growth** | Multiple teams | Sharding by document, presence, offline sync, version history, permissions | Real-time latency, persistent-connection scale, conflict UX |
| **Maturity** | Large scale / cross-region | CRDT or hardened OT, sharded collaboration on huge docs, rich content, low cross-region latency | Scale, latency, end-to-end security, rich expressiveness |

## 13. Reusable Takeaways

- 💡 **"Single-writer serialization" is a powerful weapon for killing concurrency complexity**: it turns "many things changing at once" into "process them one by one in a single fixed order."
- 💡 **The essence of collaboration is "preserve intent, not overwrite results."** Any system where multiple parties modify the same resource (including sync conflicts in [cloud storage](../cloud-storage/README.md)) should think this way.
- 💡 **Model state as an "operation sequence" rather than a "final value"**, and in one stroke you gain merge capability, version history, and auditing — that's Event Sourcing.
- 💡 **Operation log + periodic snapshots** is the universal combo for "I want both complete history and fast loading."

## 🎯 Quick Quiz

<Quiz
  question="When multiple people edit the same spot at the same time, what is the correct way to handle it?"
  :options="['Last writer overwrites the earlier ones', 'Merge with OT / CRDT, preserving the intent of every editor', 'Add a lock — whoever grabs it first edits, everyone else waits']"
  :answer="1"
  explanation="The essence of collaboration is 'preserve intent, not overwrite results'; locking is fundamentally queuing, not real collaboration."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **engineering blogs**.

**🔧 Open-source prototypes (you can read the code directly):**
- [yjs/yjs](https://github.com/yjs/yjs) — a high-performance CRDT providing shared data types that auto-merge; supports offline editing, snapshots, and shared cursors.

**📖 Engineering blogs:**
- [How Figma's multiplayer technology works (Figma)](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) — why they abandoned pure OT for a CRDT-like client / server + WebSocket real-time sync.
- [I was wrong. CRDTs are the future (Joseph Gentle)](https://josephg.com/blog/crdts-are-the-future/) — a classic long read by the veteran author of ShareDB / OT, reflecting on the OT vs CRDT trade-off.

---

> 📌 Remember a real-time collaborative document in one line: **it isn't "a document multiple people can open" — it's "an engine that, without any locks, merges everyone's out-of-order editing intent into a single consistent state." Every design decision answers one question: 'When two people edit the same spot at once, how do we lose no one's work and still end up consistent?'**
