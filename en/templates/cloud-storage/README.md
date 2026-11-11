# Cloud Storage / File Sync — Architecture Template

> **Representative products**: Dropbox, Google Drive, iCloud, OneDrive, Baidu Netdisk
> **One-line definition**: Reliably store users' files in the cloud and auto-sync them across multiple devices — never losing them, never wasting space on duplicates, and resuming a broken transfer where it left off.

---

## 1. One-Line Definition

Cloud storage = **a small but critical set of "metadata" (directory tree, versions, block manifests)** + **a nearly infinite store of "content blocks"** — the two kept separate.

Its single most important move is: **chop large files into small blocks (chunks).** As you'll see, resumable uploads, incremental sync (transmit only the changed blocks), and deduplication (store identical blocks only once) — these seemingly magical abilities are **all just by-products of that one decision to "chunk."**

## 2. Business Essence: What Problem Does It Solve?

It solves "**my files, reachable on any device, never lost, and consistent across all of them**." It turns files from "chained to one computer's hard drive" into "following your account, available anywhere."

Where the money comes from: storage-capacity subscriptions (a few free GB, pay for more), enterprise collaboration / compliance / governance, and APIs and ecosystem.

> **Key fact: in this kind of system, "storage cost" and "bandwidth cost" are two giant mountains.** So "don't store identical content twice" and "transmit only the changed parts" aren't nice-to-haves — they're the difference between a viable business model and not.

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Upload / download files
- [ ] Automatic multi-device sync
- [ ] Folders, sharing, collaboration
- [ ] Version history, trash bin
- [ ] Resumable uploads (a large file half-transferred when it dropped can pick up again)

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Durability** | Virtually no loss (e.g. 11 nines) | Users treat it as their "last safe-deposit box"; losing files is fatal |
| **Bandwidth efficiency** | Transmit only the changed parts | Changing one character shouldn't re-upload the whole file — saves money and time |
| **Sync consistency** | Eventually consistent across devices | The directory tree each device sees must converge |
| **Cost** | The leaner the storage, the better | Dedup and hot/cold tiering directly determine the margin |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Files can be enormous** (several GB) and the network is unstable → must support resumable, chunked transfer.
- 🔴 **Devices go offline**, and while offline multiple devices may change the same file → conflicts will arise.
- 🔴 **Durability is the bottom line**: it can be slow, but it must never lose data.

## 4. Architecture Overview

```
   Device A (sync agent)                       Device B (sync agent)
 ┌────────────────────┐                  ┌────────────────────┐
 │ • Watch file        │                  │ • Receive sync      │
 │   changes           │                  │   notification      │
 │ • Chunk + hash      │                  │ • Download only the │
 │   each block        │                  │   missing blocks    │
 └─────────┬──────────┘                  └──────────▲─────────┘
           │ ① Ask before upload: do you have       │ ④ Notify: there's
           │   these blocks?                        │    a new version
           ▼                                        │
 ┌────────────────────────┐         ┌──────────────┴───────────┐
 │   Metadata service      │         │   Sync coordination /     │
 │ Directory tree /        │◀───────▶│   notification            │
 │ versions / block        │         │   (who should update)     │
 │ manifests               │         └──────────────────────────┘
 │ (small, strongly        │
 │  consistent, queried     │
 │  often)                 │
 └───────────┬────────────┘
             │ ② Upload only the blocks the server doesn't have
             ▼
 ┌────────────────────────────────────────┐
 │   Block storage (object storage)         │
 │   Addressed by [content hash] →          │
 │   identical content auto-deduplicated    │
 │   (large, immutable, near-infinite scale)│
 └────────────────────────────────────────┘
```

> The soul is the separation of "**metadata ↔ content blocks**": metadata is small, needs strong consistency, and is queried and changed often; content blocks are large, immutable, and piled near-infinitely in object storage. Splitting the two and using the storage best suited to each is the source of all this system's efficiency.

## 5. Component Responsibilities

- **Client sync agent**: watches local file changes, chunks files, hashes each block, and decides which blocks to upload / download. *Why it's needed*: most of the intelligence behind incremental sync and dedup happens on the client.
- **Metadata service**: stores the directory tree, file versions, and which blocks make up each file (the block manifest). *Why it's needed*: it is the source of truth for "what a file looks like" — small but critical, and must be strongly consistent.
- **Block storage (object storage)**: stores all content blocks, **addressed by content hash**. *Why it's needed*: massive, immutable big data fits object storage best; content addressing brings dedup for free.
- **Deduplication**: blocks with the same hash are stored only once. *Why it's needed*: this is the core of saving storage cost.
- **Sync coordination / notification**: a file changed, notify the other devices to pull. *Why it's needed*: multi-device consistency is driven by it.

## 6. Key Data Flows

**Scenario 1: Uploading a file (chunk + dedup + transmit only the missing blocks)**
```
1. The sync agent chops the file into blocks and hashes each: [h1, h2, h3, h4]
2. First ask the metadata service: do you have these blocks?
      Server answers: I already have h1 and h3 (someone uploaded them / you did)
3. Upload only blocks h2 and h4 ──▶ block storage
4. Update metadata: this file = [h1, h2, h3, h4], version +1
   ── Result: not a single byte of a deduplicable block is re-uploaded
```

**Scenario 2: Incremental sync after editing a file**
```
You change a few lines at the end of a 1GB file:
  After chunking, only the last 1–2 blocks' hashes have changed
  ──▶ upload only those 1–2 changed blocks, leave the rest untouched
  ── This is "change a little, transmit a little," instead of re-uploading 1GB
```

## 7. Data Model & Storage Choices

Core entities: `file / folder (metadata: path, version, block manifest)`; `block (content hash → data)`; `user / quota`.

| Data | Storage type | Why |
|---|---|---|
| Directory tree / versions / block manifests | Relational (strongly consistent) | Queried & changed often, needs transactions, is the truth of "file structure" |
| Content blocks | Object storage (content-addressed) | Massive, immutable, fetched by hash, deduplicated naturally |
| Cold data / old versions | Cheap archival storage | Rarely accessed, put in cold storage to save money |
| Sync state | KV / in-memory | High-frequency, per-device |

> Teaching point: **use the "content hash" as a block's ID**, and identical content naturally gets the same ID and is stored only once — that's dedup. Git storing objects and container-image layering both use this same "content addressing."

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: Whole-file storage or block storage? (the source of all capabilities) ⭐**
- Whole file: simple, but changing one character re-uploads the entire file, a half-transferred file starts over, and identical files are stored many times.
- Blocks: chop the file into fixed- / variable-size blocks.
- **Leaning**: chunk, inevitably. **Resumable uploads, incremental sync, dedup, parallel transfer — all are by-products of chunking.** The price is maintaining a "file → block manifest" mapping and the lifecycle of blocks.

**Decision 2: Address blocks by "content addressing" (hash as the ID) ⭐**
- Using a random ID / path as the block identifier: identical content is treated as different blocks and stored many times.
- Using the content hash as the block ID: identical content → identical hash → automatically stored only once.
- **Leaning**: content addressing. It makes **dedup a natural property of storage** rather than something requiring an extra comparison. The price is the cost of computing hashes and handling the vanishingly small chance of a hash collision.

**Decision 3: Store metadata and content separately ⭐**
- Mixed together: large files and small metadata use the same storage, pleasing neither end.
- Separated: metadata (small, strongly consistent, frequent) in relational; content (large, immutable, massive) in object storage.
- **Leaning**: separate, always — a textbook example of "choose storage based on the data's access pattern."

**Decision 4: When multiple devices edit the same file offline, what about conflicts?**
- Whoever syncs later overwrites the earlier one: simple, but **it loses data**.
- When a conflict is detected, **keep both versions** (create a "conflicted copy") and let the user decide.
- **Leaning**: rather keep a conflicted copy than silently overwrite. **Same as [collaborative documents](../collaborative-doc/README.md): preserve, don't overwrite.**

## 9. Scaling & Bottlenecks

- **First bottleneck: the metadata service swells with users and file counts.** → Fix: shard by user (one user's file tree lives in one place, so queries don't cross shards).
- **Second bottleneck: content storage scale.** → Fix: object storage scales near-infinitely by nature; pair it with dedup and hot/cold tiering to squeeze cost.
- **Third bottleneck: the fan-out of sync notifications** (one change must notify all of a user's devices). → Fix: pub-sub + persistent connections, see the [notification system template](../notification-system/README.md).
- **Fourth bottleneck: a hot file shared and downloaded en masse.** → Fix: CDN caching and distribution, see the [video streaming template](../video-streaming/README.md).

## 10. Security & Compliance Essentials

- **Encryption**: in-transit encryption + at-rest encryption is the bottom line; for highly sensitive cases add **end-to-end encryption** (but under E2EE the server can't do dedup or in-cloud previews — a real trade-off).
- **Sharing permissions**: link visibility scope, expiry, password, read-only / editable.
- **Data isolation and residency**: multi-tenant isolation; enterprise / regulators may require data to live in a specific region.
- **Abuse governance**: prevent the service from being used to store / transmit illegal content; needs compliance-detection mechanisms.

## 11. Common Pitfalls / Anti-patterns

- ❌ **Whole-file transfer, re-uploading the entire file for a one-character change** → ✅ chunk + incremental, transmit only the changed blocks.
- ❌ **Mixing metadata and content into one storage** → ✅ separate, each using the storage best suited to it.
- ❌ **Overwriting directly on a sync conflict** → ✅ keep the conflicted copy, never silently lose data.
- ❌ **Storing identical files / blocks many times** → ✅ content addressing, deduplicated naturally.
- ❌ **No resumable upload for large files** → ✅ chunking makes resumption possible; when the network drops, pick up from the break.

## 12. Evolution Path: MVP → Growth → Maturity

| Stage | Scale | What the architecture looks like | What to worry about now |
|---|---|---|---|
| **MVP** | Just starting | Whole-file direct upload to object storage + a simple metadata DB | First get "upload, download, visible on multiple devices" working |
| **Growth** | Millions of users | Chunking, incremental sync, dedup, resumable uploads, version history, trash bin | Bandwidth and storage cost, sync consistency, conflicts |
| **Maturity** | Massive / enterprise | End-to-end encryption, cross-region, massive dedup, hot/cold tiering, CDN distribution, collaboration governance | Cost, compliance, durability, global experience |

## 13. Reusable Takeaways

- 💡 **"Chunking" is the master key for handling large objects.** Resumable uploads, parallel transfer, incremental sync, dedup — nearly all grow out of that first "chop it into blocks" step.
- 💡 **Content addressing (hash as the ID) = free deduplication.** Identical content converges to one copy automatically; Git and container images both rely on it.
- 💡 **Separating metadata from large objects, each using the storage best suited to it**, is universal storage wisdom: small-and-hot strongly consistent, large-and-cold piled in object storage.
- 💡 **On conflict, "preserve rather than overwrite"**: any system where multiple devices modify the same resource should put "don't lose data" ahead of "take the easy way."

## 🎯 Quick Quiz

<Quiz
  question="What lets cloud storage 'change one character without re-uploading the whole large file'?"
  :options="['A more efficient compression algorithm', 'Chopping the file into blocks and transmitting only the changed ones', 'Simply increasing upload bandwidth']"
  :answer="1"
  explanation="Resumable uploads, incremental sync, and dedup nearly all grow out of that first 'chunk it' step — chunking is the master key for handling large objects."
/>

---

## References & Further Reading

> This template is compiled from the following **official engineering blogs**, **real open-source projects**, and **papers**.

**📖 Engineering blogs / papers:**
- [Inside the Magic Pocket (Dropbox Tech Blog)](https://dropbox.tech/infrastructure/inside-the-magic-pocket) — EB-scale blob storage: file chunking, cross-region multi-replica, read/write protocols.
- [Efficient Batched Synchronization in Dropbox-like Cloud Storage (Middleware'13, PDF)](https://sites.cs.ucsb.edu/~ravenben/publications/pdf/dropbox-middleware13.pdf) — an academic analysis of batched / incremental sync efficiency in cloud storage.

**🔧 Open-source prototypes (you can read the code directly):**
- [haiwen/seafile](https://github.com/haiwen/seafile) — self-hosted file sync / sharing with content-addressed block storage + cross-library dedup + incremental sync.

---

> 📌 Remember cloud storage in one line: **it isn't "a hard drive in the cloud" — it's "a precision system that chops large files into blocks, stores identical blocks only once, and syncs only the changed parts." Every design decision answers one question: 'How do we keep files from being lost and available anywhere, while taking as little space and bandwidth as possible?'**
