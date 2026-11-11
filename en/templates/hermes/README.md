# Hermes Agent Architecture Template

> **Representative product / prototype**: Hermes Agent (nicknamed "Hermès 爱马仕" in the Chinese community; Nous Research, MIT) — peer: OpenClaw
> **One-line positioning**: Nous Research's self-hosted, always-on agent that "grows with you" — a resident process + persistent cross-session memory + autonomously distilled reusable skills, taking over your messaging accounts to serve as a long-term personal assistant that understands you more and does more, the more you use it.

---

## 1. One-Line Positioning

Hermes = **an always-on resident agent running on your own server**: it takes over your messaging accounts (WeChat / Telegram / email…), remembers everything you've said before, and distills "how I got this done" into reusable skills — **it understands you more and does more, the more you use it.**

What sets it apart from a [general Agent platform](../ai-agent-platform/README.md) is "resident + growth": general Agents are mostly "one task, then discarded," starting from zero every time; Hermes is **a long-lived process** with persistent cross-session memory and a skill library it keeps accumulating. The question it answers isn't "how do I automate this one task," but "**how does an agent accompany you and grow over the long run, instead of being amnesiac every time.**"

## 2. The Business Essence: What Problem It Solves

A general chat Agent has three fundamental pain points: **cross-session amnesia** (close the window and it forgets who you are), **starting from zero every time** (the same preferences, the same background, repeated over and over), and **knowledge that can't compound** (the trick you taught it last week, it can't do this week).

What Hermes sells is exactly "**an agent that understands you more and does more, the more you use it.**" It breaks those three pains with three things:
- **Persistent memory**: every session is written to a database, so next time it can retrieve what was said before — it "remembers."
- **Automatic skills**: after a complex task is done, the solution path is abstracted into a reusable skill and stored — it "learns."
- **Resident process**: an always-on daemon that takes over your messaging accounts — it's "always there."

> In one line: it isn't "a stronger one-shot Agent," but "**a personal assistant that grows with you over the long run.**" Its value isn't in how dazzling a single task is, but in the **compounding of knowledge over time** — the longer you use it, the deeper its understanding of you and the thicker its capabilities.

## 3. Core Requirements and Constraints

**Functional requirements:**
- [ ] A resident process that takes over messaging accounts: a unified entry across platforms (WeChat / Telegram / email / SMS…)
- [ ] Persistent cross-session memory: able to retrieve "what was said before," isolated per user / platform
- [ ] Automatic skills: autonomously distill reusable skills after complex tasks; relevant skills auto-hit on similar tasks later
- [ ] A tool-calling loop: 70+ tools (across ~28 toolsets), including terminal / code execution, with dangerous commands going through approval
- [ ] Multiple entries: CLI / resident Gateway / IDE (via ACP) / cron
- [ ] Cron jobs: executed unattended as **first-class agent tasks** (not bare shell scripts)

**Non-functional requirements / quality attributes:**
| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Persistent / resident** | Always on | The prerequisite for a "long-term assistant"; if it drops, you're back to amnesia |
| **Portable** | Runs on a $5 VPS | Self-hosting is what keeps "your data in your own hands"; the lower the bar, the wider the reach |
| **Observable / interruptible** | Every tool call is visible to the user and cancelable mid-flight | It can run terminals / self-authored skills — you must be able to hit the brake |
| **Loosely coupled** | Subsystems optional and pluggable | Via registry + check_fn gating, you can drop heavy components on a $5 VPS |
| **No vendor lock-in** | Many providers, self-stored data | Switching models or machines doesn't lock you in |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Single-machine first**: built for a single user, single deployment — not a multi-tenant SaaS cluster.
- 🔴 **SQLite single writer, no sharding**: sessions and memory default to SQLite — serialized writes, no sharding.
- 🔴 **The system prompt is immutable mid-conversation**: to maximize prompt prefix-cache hits, the system prompt is not hot-updated within a single conversation.
- 🔴 **Each profile gets its own `HERMES_HOME`**: running multiple instances means multiple profiles, each with its own config / credentials / data directory.
- 🔴 **It can run a terminal + author its own skills + run cron unattended**: power equals attack surface — it must be backstopped by approval + isolation + interruptibility.

## 4. The Big Picture

```
            ┌──────────── Entry points (who triggers the Agent) ───────────┐
            │  CLI    Resident Gateway      IDE (via ACP)        cron       │
            │  (REPL)  (takes over messaging)  (in-editor)       (scheduled)│
            └───────┬────────┬──────────────────┬────────────────┬─────────┘
                    │        │                  │                │
                    ▼        ▼                  ▼                ▼
        ╔════════════════════════════════════════════════════════════╗
        ║     Platform-agnostic AIAgent orchestration core (the only   ║
        ║     "brain"):  prompt_builder assembles → provider call →    ║
        ║     tool loop → reply  (all entries share one core —          ║
        ║     consistent behavior, zero duplicated implementation)     ║
        ╚════════════════════════════════════════════════════════════╝
            ▲   ▲   ▲   ▲   ▲   ▲   ▲   ▲   (a ring of pluggable subsystems)
   ┌────────┘   │   │   │   │   │   │   └────────┐
   ▼            ▼   ▼   ▼   ▼   ▼   ▼            ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Memory│ │Skill │ │Tool  │ │Provider││ cron │ │Terminal│ │Plugin│
│FTS5  │ │system│ │regis-│ │resolve ││sched-│ │backend │ │hook /│
│search│ │(auto-│ │try   │ │layer   ││uler  │ │(7 of   │ │sub-  │
│      │ │create│ │70+   │ │(18+ →  ││      │ │ them)  │ │agent │
│      │ │+self-│ │tools │ │ 3 mode)││      │ │        │ │      │
│      │ │ impr)│ │      │ │        ││      │ │        │ │      │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   │                                                       │
   └─── Session store: SQLite + FTS5 (per-platform, with ──┘
        lineage). Memory: MEMORY.md (agent-level) /
        USER.md (the distilled you)

Data flow: message ─▶ auth ─▶ fetch session history ─▶ prompt_builder
   (inject SOUL/MEMORY/USER + FTS5-retrieve relevant skills & past sessions)
   ─▶ provider ─▶ tool loop (dangerous cmd → approval) ─▶ reply
   ─▶ write back to session DB (+ optionally solidify memory / distill a skill)
```

> The soul of it is the **platform-agnostic AIAgent core** in the middle — it's the only brain, and every entry (CLI / Gateway / IDE / cron) reuses it, so behavior "in WeChat" and "in the command line" is identical. The ring of subsystems around it is all **pluggable**: whatever won't run on a $5 VPS (vector store, isolated terminal) can be dropped, with registry + check_fn deciding which subsystems mount. **"One core + many entries + pluggable subsystems" is the root of how it stays both unified and lightweight.**

## 5. Component Responsibilities

- **AIAgent orchestration core**: drives the core loop of "assemble prompt → call model → tool loop → reply," platform-agnostic. *Why it's needed*: it's the only brain, collapsing "many entries" into "one behavior" and avoiding a separate logic implementation per platform.
- **Resident messaging Gateway + ~20 platform adapters**: a resident daemon takes over your messaging accounts; adapters normalize each platform (Telegram / Discord / Slack / WhatsApp / Signal / Matrix / Email / SMS, plus China-domestic DingTalk / Feishu / WeCom / native Weixin / QQ / Yuanbao, etc.) into messages the core understands. *Why it's needed*: it puts "the agent wherever the user is," sparing you a custom front-end.
- **Session store (SQLite + FTS5)**: stores all session history with full-text search, isolated per platform, recording session lineage (derivation relationships). *Why it's needed*: the physical substrate for cross-session memory — a single file, zero ops.
- **Memory system (pluggable provider)**: short-term = session history; long-term artifacts = `MEMORY.md` (agent-level long-term memory) and `USER.md` (a user profile / "the distilled you"); retrieval defaults to the session DB's FTS5, swappable for an external provider (knowledge graph / vector). *Why it's needed*: lets it "remember you," with the memory strategy upgradable on demand.
- **Skill system (procedural memory)**: skills are file-form "how to get a class of things done," **auto-created and self-improving in use**. *Why it's needed*: turns a one-shot solution process into a reusable asset — this is the engine of "doing more over time."
- **Tool registry**: registers 70+ tools (across ~28 toolsets), including terminal / code execution / file / network, etc. *Why it's needed*: tools are the agent's "hands and feet"; the registry makes them enumerable and gateable (early / marketing material often says 40+; the developer docs' 70+ is authoritative).
- **Provider resolution layer**: normalizes 18+ model providers (Anthropic / Gemini / MiniMax / Kimi / GLM…) **down to three API modes**. *Why it's needed*: absorbing N vendors' differences with three interaction paradigms means switching models doesn't touch the core — the key to no vendor lock-in.
- **Cron scheduler**: schedules timed tasks, and each job is a **first-class agent task** (not a bare shell). *Why it's needed*: lets the agent "do work on a schedule on its own" — send a weekly report, check a calendar, unattended.
- **Terminal backends (7 of them)**: commands from tools run in one of the terminal backends, from running directly on the host to an isolated sandbox (Docker / Singularity / Vercel Sandbox). *Why it's needed*: provides a tunable isolation dial between "can get work done" and "don't cause trouble."
- **Plugins / hooks / sub-agents**: extend at lifecycle hook points; complex tasks can spawn sub-agents in parallel. *Why it's needed*: extends capability and does limited parallelism without touching the core.

## 6. Key Data Flows

**① From an incoming message to a reply (the main path)**
```
Message (WeChat/Telegram…) ─▶ Gateway adapter normalizes it
  └▶ Auth: allowlist + DM pairing + token lock (reject anyone not on the list)
  └▶ Fetch session history (isolated by platform + user)
  └▶ prompt_builder assembles context:
        · Inject SOUL.md (persona) / MEMORY.md (long-term) / USER.md (profile)
        · FTS5 retrieval: pull "keyword-relevant" content from past sessions +
          the skill library into context
  └▶ provider call (normalized to an API mode by the resolution layer)
  └▶ Tool loop: model wants a tool → dangerous cmd goes through approval first
     → run in the terminal backend → feed result back
  └▶ Generate reply ─▶ deliver back to the original platform
  └▶ Write back to session DB (+ a memory tool may solidify key points into
     MEMORY.md / USER.md)
```

**② The autonomous skill-distillation loop (the engine of "doing more over time")**
```
A complex task gets done
  └▶ "Abstract" this run's solution path into a reusable skill (a file)
     → write it to the skill library
        ↓ (time passes; a similar task arrives)
  └▶ During prompt assembly, FTS5 hits this skill → load it into context
  └▶ During execution, a flaw / optimization is found → self-improve in place,
     write back to the skill library
        ↺ Compounding experience: each run of a similar task goes smoother
```

**③ Cron jobs (first-class agent tasks)**
```
Scheduler tick (it's time)
  └▶ Create a brand-new AIAgent instance with no history (clean context)
  └▶ Inject this job's instructions + the skills it carries
  └▶ The agent executes autonomously (can call tools, can run a terminal)
  └▶ Deliver the result (to a designated channel) + update next_run
```

## 7. Data Model and Storage Choices

| Data | Where It Lives | Why |
|---|---|---|
| Session history | **SQLite + FTS5**, isolated per platform, with lineage | A single file, zero ops; FTS5 gives full-text search; lineage records derivation |
| Long-term memory (agent) | `MEMORY.md` file | Human-readable, editable long-term facts that persist across sessions |
| User profile | `USER.md` file ("the distilled you") | Distills its understanding of you into a readable dossier |
| Memory retrieval | Defaults to the session DB's **FTS5**; swappable for an external provider | Zero dependency by default; swap to knowledge graph / vector when you need semantic recall |
| Skills | **Files** (agentskills.io-compatible) | Portable, shareable, versionable — skills as assets |
| Persona | `SOUL.md` | Solidifies "who it is, how it talks" |
| Config / credentials | profile-aware `HERMES_HOME` | Multi-instance isolation: one environment and key set per profile |
| Cron jobs | JSON | A simple, readable task definition |

> Teaching point: its memory is **by default not vector RAG** but "store sessions in SQLite + FTS5 keyword retrieval." Long-term facts land in human-readable `MEMORY.md` / `USER.md`. The full reasoning for this choice is in item ① of the next section — the most valuable section of this piece.

## 8. Key Architecture Decisions and Trade-offs ⭐

**Decision 1: Memory retrieval via FTS5 keywords, or vector semantics? (the core of this piece — read it thoroughly) ⭐⭐⭐**

This is the linchpin of Hermes's entire memory design, and an explicit trade of "simple and self-hostable" against "semantic recall quality."

- **What choosing FTS5 keyword retrieval buys you**:
  - **Zero external dependency**: SQLite ships with FTS5 — no extra vector store / embedding service to run.
  - **Dead-simple deployment, CPU-friendly**: no embedding inference, no ANN index resident in memory — **a $5 VPS can run it.**
  - **Fast exact word matching**: the exact words you said can be retrieved quickly and precisely by keyword search.
  - Aided by **LLM summarization as retrieval post-processing**: the raw recalled snippets are first compressed / refined by the model, easing the "recall a pile but imprecise" problem of keyword search.

- **The cost (acknowledged directly in official Issue [#10355](https://github.com/NousResearch/hermes-agent/issues/10355))**:
  - **Keyword recall only, no concept-level retrieval**: the classic counterexample — you stored a record titled `Fixed N+1 query`; next time you ask `database performance optimization`, **FTS5 can't find it**, because there's no shared literal word, yet the two are highly equivalent in meaning.
  - **Semantic discontinuity across sessions**: describe the same thing a different way and you may fail to retrieve last time's relevant memory.
  - **Memory is equal-weighted, undifferentiated**: FTS5 ranks by term-frequency relevance and **doesn't distinguish "how important / how recent this memory is to you"** — an important old memory and a trivial new one are treated alike.

- **The path forward (yet the default still sticks with FTS5)**:
  - **RRF hybrid retrieval**: fuse the two result lists from BM25 (keyword) and cosine (vector semantics) via Reciprocal Rank Fusion, getting both precision and semantics.
  - **`sqlite-vec` + FTS5 hybrid**: run keyword and vector in the same SQLite, keeping the "single file" advantage while adding semantic recall.
  - **A knowledge-graph provider**: structure memory into entities / relations to support concept-level queries.
  - But embeddings bring **complexity / latency / disk footprint / migration risk** (swap the model and all historical vectors must be recomputed). For an assistant meant to run resident on a $5 VPS and serve a single user, these costs may not pay off — **so the default sticks with FTS5 and leaves the semantic upgrade as an optional provider.**

> Remember this trade in one line: **FTS5 makes memory "runnable and easy to host," at the cost of "weak semantic recall."** That's precisely the flip side of what [vector databases](../vector-database/README.md) trade away with ANN — vectors give you concept-level semantic recall, at the cost of memory, ops, and a separate index system to run. Hermes chose "simple and self-hostable" first, leaving "semantic recall quality" for those willing to pay the complexity to upgrade. To understand the ceiling of retrieval quality more deeply, see [RAG Knowledge Base](../rag-knowledge-base/README.md).

**Decision 2: Self-growth / auto-authoring skills — should it create executable skills on its own? ⭐**
- **Benefit**: compounding experience, stronger over time; complex-task solutions no longer evaporate one-off but become executable skills reusable via `terminal` / `execute_code`.
- **Cost**: a **wrong or poisoned skill gets executed repeatedly and self-amplifies**; with no mandatory human review, the skill library **drifts silently** (getting more off-base while nobody notices).
- **Where to land**: rather than the "lock it in a hard sandbox" route, backstop with **command approval + full observability and interruptibility** — let dangerous actions be seen and stoppable before they run. The brake is on the "execution gate," not on "the capability itself."

**Decision 3: Resident daemon + platform-agnostic core — one service for all entries? ⭐**
- **Benefit**: one AIAgent core serves CLI / Gateway / IDE / cron, **consistent behavior, zero duplicated implementation**; change one place and every entry benefits in sync.
- **Cost**: that daemon becomes a **concentration point for concurrency and availability** — if it dies, every entry goes mute.
- **Where to land**: for a single-user, single-deployment target, the "consistency" of centralization far outweighs the "single point" cost; if you must scale, run multiple profiles in parallel on one machine rather than building a cluster.

**Decision 4: The messaging platform as the UI — take over your WeChat / Telegram directly? ⭐**
- **Benefit**: **zero front-end cost**, the agent is wherever the user is, naturally multi-surface.
- **Cost**: subject to each platform's **API / rate limits / content moderation**; auth is on you — via **allowlist + DM pairing**, not the platform's account system.
- **Where to land**: worth it for a personal-assistant scenario — it spares an entire front-end project in exchange for "inside the app you already use."

**Decision 5: Prompt stability first (cache-friendly) — the system prompt doesn't change mid-flight? ⭐**
- **Benefit**: keeping the system prompt unchanged within a conversation buys a **high prefix-cache hit rate, markedly cutting cost / latency.**
- **Cost**: **new memory / new skills can't be hot-updated into the current system prompt** mid-conversation — they only take effect on the next round.
- **Where to land**: for a high-frequency, long-term assistant you're paying for out of pocket, **the cost lever outweighs the convenience of instant hot-update.**

## 9. Scaling and Bottlenecks

- **First bottleneck: SQLite single writer + FTS5 retrieval.** As the corpus grows, **write contention** (serialized writes) and **full-text retrieval latency** hit the ceiling first; more insidiously, FTS5's **semantic gap widens with the corpus** — the bigger the library, the more keenly keyword recall "fails to find semantically equivalent records." → Fix: migrate to an external DB / adopt a hybrid or semantic-retrieval provider.
- **Second bottleneck: a single daemon with no sharding.** Built for single-user, single-deployment, **running multiple instances relies on profile isolation in parallel on one machine, not a cluster.** → Fix: accept the positioning; if you truly need multiple users, run multiple instances.
- **Third bottleneck: no automatic memory GC.** Memory only grows, pruned by the agent / user proactively. → Fix: periodically review `MEMORY.md` / `USER.md` and the skill library by hand.
- **Fourth bottleneck: limited parallelism + long sessions bounded by the window.** Parallelism relies on sub-agents but is **spawned on one machine**; long sessions rely on context compression, still bounded by the context-window limit. → Fix: break big tasks down, archive old sessions promptly.

## 10. Security and Compliance Essentials

- **Data stays entirely in your hands**: self-hosting means sessions / credentials / memory are **all on your own server**, never through a third party — the fundamental selling point of self-hosting.
- **Key handling**: keys are **stored dispersed, never written to logs**, and injected into the (isolated) terminal via a pass-through mechanism rather than strewn across the command line / logs.
- **Channel auth**: the trio of **allowlist + DM pairing + token lock** prevents cross-talk and triggering by strangers — by default it only listens to people on the allowlist.
- 🔴 **The biggest attack surface**: it **can run `terminal` / `execute_code`, authors its own skills, and has cron running unattended** — the most powerful and most dangerous combination. It's backstopped **mainly by isolated terminal backends (Docker / Singularity / Vercel Sandbox) + command approval + full observability and interruptibility**, rather than by a hard sandbox on by default.
- 🔴 **Prompt injection**: guarded by the **user allowlist + command approval**, not by content-detection scanning — **so "trust only allowlisted users by default" is the key premise of the whole security model.** The moment you feed it untrusted users / content, you've handed the shell to the injector.

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Treating it as "memory with vector RAG"** → ✅ it's **FTS5 keyword retrieval by default, with weak semantic recall**; for semantics you must swap the provider.
- ❌ **Feeding untrusted users / content straight to it** → ✅ it auto-executes and self-authors skills, which is **exposing the shell to prompt injection**; open it to the allowlist only.
- ❌ **Scaling it out as a multi-tenant SaaS** → ✅ it's **single-user, single-deployment**; serve many people with multiple profiles / instances, not a cluster.
- ❌ **Thinking cron runs shell scripts** → ✅ a cron job is a **first-class agent task** (with context, able to call tools and use skills).
- ❌ **Letting memory and self-authored skills go unsupervised** → ✅ **there's no automatic GC and skills drift** — review and prune by hand periodically.
- ❌ **Expecting to hot-update the system prompt mid-conversation** → ✅ for cache-friendliness the system prompt is unchanged within a conversation; new memory / skills take effect next round.

## 12. Evolution Path: MVP → Growth → Maturity (How to Set It Up at Each Stage)

| Stage | Scale / Scenario | How to Set It Up (Specifics) | What to Worry About Now |
|---|---|---|---|
| **MVP** | Just you | Single-machine deploy; memory on the **default FTS5**; allowlist contains **only yourself**; start with the host terminal backend | Get it running first; validate whether "resident + memory + skills" is actually useful to you |
| **Growth** | Multi-channel + accruing experience | Connect more channels (WeChat / Telegram…); **accumulate skills and memory**; **tighten command approval + switch to an isolated terminal backend** | Recall quality, skill drift, controllability of dangerous commands |
| **Maturity** | Heavy long-term assistant | Switch to a **semantic / hybrid-retrieval provider** (RRF / sqlite-vec / knowledge graph); fully isolated terminal (Docker, etc.); **periodically review memory and the skill library by hand** | Semantic recall, isolation strength, long-term hygiene of memory and skills |

## 13. Reusable Takeaways

- 💡 **Persistent memory + automatic skills = knowledge that compounds for an agent.** "Remembers" + "learns" are the two pillars that turn a one-shot agent into a "long-term asset" — value accumulates along the time axis.
- 💡 **Get running with the simplest retrieval first, then upgrade by recall quality.** FTS5 brings memory online with zero dependencies; only when the semantic gap actually hurts do you adopt hybrid / vector / graph — the same restraint as "if a single machine will do, don't go to a cluster."
- 💡 **Self-growth must come with the brakes of observability / interruptibility / approval.** For any system that "can create capabilities on its own and execute them," a brake is not optional; this echoes the [Agent platform](../ai-agent-platform/README.md) line, "if you set it free, you must bolt on a brake."
- 💡 **System-prompt stability is an architectural lever for saving money.** A stable prefix = high cache-hit rate = a sharp cost drop; the cost is giving up mid-flight hot-updates — a trade that pays off well in a high-frequency, long-term scenario.
- 💡 **Self-hosting trades data sovereignty for operational responsibility.** The flip side of "all data in your own hands" is that security, backup, and isolation are all on you — trusting only the allowlist by default is the premise that makes the model hold.

## 🎯 Quick Quiz

<Quiz
  question="Hermes uses FTS5 keyword retrieval for memory by default. What is its main limitation?"
  :options="['Retrieval is too slow to run', 'Keyword matching only, no concept-level semantic recall, so a different wording fails to find an equivalent record', 'It only works online']"
  :answer="1"
  explanation="FTS5 matches literal words with no semantic understanding. The classic counterexample: you stored Fixed N plus 1 query, then asked database performance optimization and it cannot be found — semantically equivalent but no shared literal word. This is the semantic-recall shortfall traded for being simple and self-hostable; for semantic recall you must swap to a hybrid or vector provider."
/>

---

## References & Further Reading

> This template is distilled from the following **official resources**. Hermes Agent is open-sourced by Nous Research (MIT); to get hands-on, read the repo and the official architecture docs directly. For a peer always-on agent, see the sister piece [OpenClaw](../openclaw/README.md).

**🔧 Official prototype and docs:**
- [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) — the official repo README, the entry to Hermes Agent's source.
- [Official architecture docs (most authoritative)](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture) — the architecture chapter in the developer guide; first-hand on the core / subsystems / data flows.
- [Official docs site home](https://hermes-agent.nousresearch.com/docs/) — navigation for all docs.
- [Official tools reference](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/reference/tools-reference.md) — the authoritative list of 70+ tools / ~28 toolsets (marketing material often says 40+; this is the figure to use).
- [Official Issue #10355](https://github.com/NousResearch/hermes-agent/issues/10355) — the first-hand discussion of FTS5 keyword-retrieval limits vs semantic retrieval, the basis for item ① of Section 8.
- [Official landing page: The Agent That Grows With You](https://hermes-agent.nousresearch.com/) — the "grows with you" product positioning.

**🔗 Further reading (this repo):**
- [OpenClaw](../openclaw/README.md) — a peer self-hosted always-on agent; the sister piece to compare against.
- [Vector Database](../vector-database/README.md) — the deep dive on "the vector / ANN side" of FTS5 vs vector retrieval.
- [RAG Knowledge Base](../rag-knowledge-base/README.md) — retrieval quality sets the ceiling; understand the ceiling of memory recall.
- [AI Agent / Workflow Platform](../ai-agent-platform/README.md) — general Agent orchestration and "bolting a brake onto autonomy."
- [Data and State](../../tutorial/05-数据与状态.md) — the fundamentals of SQLite / persistence / state management.

---

> 📌 Remember Hermes in one line: **it isn't "a stronger one-shot Agent" but "a resident assistant running on your own server that grows with you over the long run" — the resident process keeps it always there, FTS5 persistent memory lets it remember, and auto-distilled skills let it learn; and that it defaults to FTS5 keywords (not vector semantics) and backstops with allowlist + approval + interruptibility (not a hard sandbox) are all clear-eyed trade-offs under the "simple, self-hostable, single-user" positioning.**
