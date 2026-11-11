# OpenClaw (nicknamed "the lobster 🦞") Architecture Template

> **Representative product / prototype**: OpenClaw (nicknamed "the lobster 🦞", formerly Clawdbot → Moltbot, by Peter Steinberger) — peer: Hermes
> **One-line positioning**: a self-hosted personal agent gateway that lives resident on your own machine — a local daemon that wires a capable, work-doing coding agent into the chat apps you already use (WhatsApp / Telegram / Slack / Discord…), on call 24/7, with data and keys kept local.

---

## 1. One-Line Positioning

OpenClaw = **a local daemon (the Gateway) that lives resident on your own machine and wires a tool-calling, work-doing coding agent into the chat apps you already use.**

You don't have to open yet another app, and you don't have to hand your conversations and keys to some cloud SaaS: it lives parasitically inside the WhatsApp / Telegram / Slack / Discord windows you're already in, and sending it a message is how you hand the agent a task — it stands by 24/7 on your machine. In one line: **it's a "personal, self-hosted, parasitic-on-existing-chat-UI" agent gateway**, not yet another agent SaaS. What sets it fundamentally apart from an [AI Agent Platform](../ai-agent-platform/README.md) is this: those platforms are built for "multi-tenant, run other people's tasks"; OpenClaw is built for "**single-user, run your own work, with data held locally**."

## 2. The Business Essence: What Problem It Solves

What it sets out to kill is **the fragmentation of "AI scattered across platforms"**: your agent capabilities live on this web page today and that app tomorrow; session history, available tools, and remembered facts each sit in their own corner with nothing tying them together; keys are either handed to a pile of cloud services or scattered around on their own.

OpenClaw's answer: **use a single-user control plane to converge sessions, channels, tools, and memory all into one place — and that place is on your own machine.** This convergence point (the Gateway) is the single source of truth for all your agent interactions — no matter which chat app you message from, behind it is the same resident process, the same config, the same memory. What it sells isn't "a stronger model" but "**unifying scattered AI capabilities into one resident assistant that lives by your side and answers to you alone**."

> One judgment that runs through the whole piece, worth committing up front: OpenClaw is the product of **single-user, single trust boundary**. All its conveniences (resident, hot-reload, local-first) rest on the premise that "**the machine's owner = the agent's owner = the one and only trusted person**." The moment you have to let an untrusted person use it, that premise collapses and the architecture must be reworked (see Sections 8 and 10).

## 3. Core Requirements and Constraints

**Functional requirements (what the system must be able to do):**
- [ ] Wire a tool-calling coding agent into multiple chat channels (WhatsApp / Telegram / Slack / Discord / Feishu / iMessage…)
- [ ] Unified, cross-channel session routing and isolation (different peers on the same channel, and different accounts on different channels, never bleed into each other)
- [ ] Tool orchestration: let the agent run commands, read/write files, and call external capabilities — under approval and sandboxing
- [ ] Persistent memory: remember things across sessions, and keep memory **readable, searchable, and version-controllable**
- [ ] Autonomous patrol (Heartbeat) + precise scheduling (Cron): not just reactive answering, but doing work proactively on a schedule
- [ ] Config hot-reload: edit the config and it takes effect without a restart
- [ ] A skills mechanism: package reusable capabilities, share them, and load them on demand

**Non-functional requirements / quality attributes (how well it must do them):**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Resident availability** | Online 24/7, on call | The whole value of a personal assistant is "always there" — once it's down it's useless |
| **Local-first** | Config / sessions / memory / keys all on the local machine | This is its core selling point over a cloud SaaS — data and keys never leave home |
| **Config hot-reload** | Editing `openclaw.json` takes effect without a restart | A resident process can't drop offline just to flip a switch |
| **Session isolation** | Contexts of different channels/peers never bleed together | One process serving many channels — bleed-through = a privacy incident |
| **Auditability** | Tool calls, scheduled jobs, and memory all leave a traceable record | Self-hosting = the operator bears responsibility; when something goes wrong you must be able to reconstruct it |

**Key constraints (boundaries you can't cross):**
- 🔴 **Runtime environment**: needs a fairly recent runtime (Node 24, or 22.19+); on Windows it needs WSL2 to run reliably (many channels depend on Unix-like behavior).
- 🔴 **Single trust boundary / single-user, not multi-tenant**: the whole system assumes a single trusted owner. It is **not** a SaaS shared by a crowd of strangers; using it as multi-tenant is using the security model backwards.
- 🔴 **Bring your own model provider key**: OpenClaw neither sells nor runs models itself; you must bring a model provider's key (it only orchestrates, it doesn't do inference).
- 🔴 **Behavior depends on upstream**: the agent kernel and most harnesses are external projects, and their capabilities and quirks shift with upstream (see Section 8, Decision ③).

## 4. The Big-Picture Architecture Diagram

At the center sits the resident **Gateway daemon** (the hub); each chat channel is a spoke. Inside the Gateway are wrapped the agent runtime, session routing, tool orchestration, the scheduler, and memory.

```
   The chat apps you already use (spokes, 12+ channels)
  WhatsApp  Telegram  Slack  Discord  Feishu  iMessage  Signal  …
     │         │        │       │       │        │        │
     └─────────┴────────┴───┬───┴───────┴────────┴────────┘
                            │  inbound msg (first passes DM policy: pairing/allowlist/open/disabled)
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Gateway daemon (single process · control plane · sole source of truth  │
│  for sessions/routing/channel)                                          │
│  reads ~/.openclaw/openclaw.json (JSON5, strict schema check + hot-reload)│
│                                                                        │
│   ① Channel adapters ─▶ ② Session routing (dmScope: main/per-peer/      │
│                          │   per-channel-peer)                          │
│                          │  bind/reset thread (daily / idleMinutes)     │
│                          ▼                                              │
│   ┌────────────── ③ Agent runtime (pluggable harness) ───────────────┐ │
│   │  Built-in Pi kernel: owns model loop · thread state · dynamic     │ │
│   │                      tools · context engine · compaction          │ │
│   │  plugin: codex  │  ACP: Claude Code / Gemini CLI / OpenCode …      │ │
│   │  action loop: build system prompt → plan → call tool → observe →  │ │
│   │               decide again                                        │ │
│   │  hooks: before_model_resolve / before_prompt_build /              │ │
│   │         before_tool_call / after_tool_call                        │ │
│   └───────┬───────────────────┬────────────────────┬─────────────────┘ │
│           │ tool call          │ read/write memory  │ schedule trigger  │
│           ▼                    ▼                    ▼                   │
│   ┌──────────────┐    ┌──────────────────┐  ┌─────────────────────┐    │
│   │ ④ Tool orch.  │    │ ⑥ Persistent mem.│  │ ⑤ Scheduler          │    │
│   │  policy(deny  │    │  workspace pure  │  │  Heartbeat (~30m):  │    │
│   │  by default)  │    │  Markdown:       │  │   patrol main sess. │    │
│   │  + approval   │    │  MEMORY.md       │  │   / cost-thrifty    │    │
│   │  + Docker box │    │  memory/date.md  │  │  Cron: precise/     │    │
│   │              │    │  (opt. DREAMS.md) │  │   isolated/task log │    │
│   └──────────────┘    └──────────────────┘  └─────────────────────┘    │
│           │                                                            │
│   ⑦ Skills: SKILL.md (Markdown+YAML) → compiled into XML, injected     │
│      into the prompt; multi-source merge by priority; ClawHub = a       │
│      shareable skills registry                                          │
└────────────────────────────┬───────────────────────────────────────────┘
                             ▼  stream the reply back to "the channel/session it came from", persist to disk (transcript + memory)
                       you see the reply in your chat window
```

> The soul is that central **single-process Gateway control plane**: it's both the hub (rounding up all channels and sessions) and the host that embeds the agent runtime and hangs tools, scheduling, and memory off itself. **Every convenience (resident, hot-reload, locally self-held) and every risk (single trust boundary, single-process serial execution) springs from this one choice of "converge everything into one local process."**

## 5. Component Responsibilities

For each key part above, what it does + why it's needed.

- **① Gateway control plane**: a resident process, the **sole source of truth** for sessions / routing / channel config (the hub in hub-and-spoke); reads `~/.openclaw/openclaw.json` (JSON5), does strict schema validation, and supports hot-reload; can run in the foreground for debugging, or stay resident in the background via launchd/systemd. *Why needed*: a personal assistant must be "always there," and many channels must have one unified convergence point, or sessions/routing/config scatter again.
- **② Channel adapters (spokes)**: smooth out the protocol differences of each chat platform (12+: WhatsApp / Telegram / Slack / Discord / Feishu / iMessage / Signal / Teams / Matrix / LINE / WeChat / QQ / WebChat…) into a uniform "inbound message / outbound reply." Each channel carries a DM policy: `pairing` (default) / `allowlist` / `open` / `disabled`, and group chats can require `@bot`. *Why needed*: the messaging platform *is* the UI; this layer is what makes "parasitizing existing chat apps" possible, and it bears the first line of admission.
- **③ Agent action loop + pluggable harness**: a built-in minimalist coding kernel, **Pi** (the Gateway wraps a layer around it: `agentCommand` resolves which model to use and which skills to load → `runEmbeddedPiAgent` executes), where Pi itself owns the model loop, thread state, dynamic tools, the context engine, and compaction; the harness can also be swapped — plugin `codex`, or via **ACP** to Claude Code / Gemini CLI / OpenCode / Cursor. It exposes hooks like `before_model_resolve / before_prompt_build / before_tool_call / after_tool_call`. *Why needed*: outsourcing the agent kernel keeps OpenClaw light and able to keep up with the frontier (see Decision ③).
- **④ Tool orchestration + approval + sandbox**: when the agent wants to run commands, read/write files, or call external capabilities, it first passes policy (`exec`/`gateway`/`cron` etc. default to **deny**, with allow/deny lists), high-risk actions go through approval, and execution can be placed in a **Docker sandbox**. *Why needed*: tools can "change the world," and under self-hosting this is the operator's only safety valve.
- **⑤ Heartbeat scheduler + Cron**: Heartbeat by default runs an autonomous patrol every ~30m (1h in the Anthropic OAuth mode) in the **main session**; Cron is a built-in scheduler that persists jobs, fires on a precise/one-shot schedule, wakes on time, and delivers to a channel or webhook. *Why needed*: it upgrades the agent from "reactive answering" to "proactively watching things + doing work on time."
- **⑥ Cross-channel session management**: `dmScope` decides session granularity (`main` / `per-peer` / `per-channel-peer`); a thread can reset by `daily` or `idleMinutes`; multi-agent routing **routes different channels/accounts/peers to isolated agents** (each with its own workspace + sessions). *Why needed*: one process serving many channels means isolation is the guarantee of privacy and of contexts not bleeding together.
- **⑦ Persistent memory**: the workspace is **pure Markdown** — `MEMORY.md` (loaded at the start of every DM session), `memory/YYYY-MM-DD.md` (today + yesterday auto-loaded), and optional `DREAMS.md`; retrieval via `memory_search`/`memory_get` (the memory-core plugin). "The model only remembers what gets saved to disk — **there is no hidden state**." *Why needed*: making memory readable, greppable, version-controllable plain text is this system's most restrained and most clever trade-off (see Decision ⑤).
- **⑧ Skills mechanism + ClawHub**: a skill = `SKILL.md` (Markdown body + YAML frontmatter metadata), compiled into **XML injected into the system prompt**; multiple sources merge by priority; **ClawHub** is a shareable, discoverable skills registry. `SOUL.md` / `AGENTS.md` are persona / process injection files. *Why needed*: it makes capabilities packageable, shareable, and auditable at the lowest barrier (writing Markdown) — at the cost that installing a third-party skill = trusting its content (see Decision ④).

## 6. Key Data Flows

Three scenarios that best capture what makes OpenClaw distinctive.

**Scenario 1: a message arrives from a chat app (the reactive main path)**
```
① On Telegram you type: "File today's meeting notes into my memo"
② A channel adapter takes it → passes DM-policy auth (pairing/allowlist/open? if it fails, blocked outright)
③ Session routing: per dmScope, find the matching agent + session (isolated, no bleed-through)
④ Build the system prompt: inject MEMORY.md + the last two days of memory/date.md + relevant skills (XML) + SOUL/AGENTS
⑤ Pi action loop: the model plans → wants to call the "write file" tool
⑥ The tool is constrained: policy check (deny by default, must be on the allow list) → approval if needed → executed in the sandbox
⑦ Result fed back to the model → the model decides to wrap up → the reply streams back to "the Telegram session it came from"
⑧ Persist: the transcript is recorded; memory updates only if the model actively writes to disk (otherwise it won't remember next time)
   ⟲ The whole thing runs serially through a per-session + global queue (see Section 9's bottleneck)
```

**Scenario 2: Heartbeat autonomous patrol (fuzzy time / shared main session / cost-thrifty)**
```
Fires once every ~30m (1h in OAuth mode), running one round in the [main session]:
① Read HEARTBEAT.md (your list of "things to check on periodically")
② Inject only the tasks [due right now] into this round's prompt — anything not yet due never enters the context (saves tokens)
③ Pi runs a round: if something is due, it does it (may call tools); when done, streams back to the main session
④ If there's nothing to do this round → it just replies HEARTBEAT_OK and wraps up
⑤ Crucially: Heartbeat [creates no task record] — it's a "light patrol," not a "logged job"
   Motivation: being resident + periodically waking [continually burns tokens], so the default design is extremely restrained
```

**Scenario 3: Cron precise scheduling (precise time / isolated execution / leaves a record)**
```
You register a cron job: "Pull a daily report of yesterday's data at 09:00 every day"
① The Gateway's built-in scheduler persists this job (it survives a process restart)
② At exactly 09:00 it wakes the agent — isolated execution (not mixed into the main-session context)
③ When done, it delivers the result to the designated channel, or hits a webhook
④ Every execution [produces a task record] — auditable, reviewable
   Division of labor vs. Heartbeat: Cron = precise/isolated/logged; Heartbeat = fuzzy/shared/thrifty
```

## 7. Data Model and Storage Choices

The core idea: **everything lives locally under `~/.openclaw/`, and much of it is human-readable plain text.** Conceptual entities: `config`, `session transcript`, `memory workspace`, `skills`, `key credentials`, `task records`.

| Data | Storage form | Why |
|---|---|---|
| Global config | `~/.openclaw/openclaw.json` (**JSON5**) | Human-writable, with comments; strict schema validation + hot-reload |
| Session transcript | Local session records (isolated per agent/session) | Auditable, replayable; isolation prevents bleed-through |
| Memory (long-term) | `MEMORY.md` (loaded at the start of every DM) | Plain text, readable, greppable, version-controllable; no hidden state |
| Memory (daily) | `memory/YYYY-MM-DD.md` (today + yesterday auto-loaded) | Low-cost injection of recent context; older stuff is fetched by search |
| Memory (optional) | `DREAMS.md` | An optional carrier for long-term / reflective notes |
| Skills | Multi-source `SKILL.md`, merged by priority | Markdown+YAML, low barrier; multiple sources (local / ClawHub) can stack |
| Keys / credentials | Under `~/.openclaw/` | Held locally, never leaves home |
| Task records | Produced by Cron (Heartbeat produces none) | Distinguishes "logged jobs" from "light patrols" |

> One security premise to burn into your brain: **"assume anything under `~/.openclaw/` may contain secrets."** This directory holds plaintext config, plus sessions and memory, plus keys; plaintext *is* sensitive data, and this directly drives Section 10's advice of "full-disk encryption + a dedicated user."

## 8. Key Architecture Decisions and Trade-offs ⭐

**(The most valuable section of this template.)** For each decision: the choice faced, the leaning, and what was given up.

**Decision ① Self-hosted single-process daemon + single trust boundary ⭐ (the foundation of the whole piece)**
- Option A: a cloud multi-tenant SaaS. Pro: hassle-free, multi-user by nature; con: you hand over your data and keys, and it's not local-first.
- Option B: **a self-hosted single-process daemon + single trust boundary**. Pro: **local-first, resident, hot-reload**, with data and keys never leaving home; con: **it is not multi-tenant** — to let untrusted people use it, you must additionally split the trust boundary (separate gateway / credentials, even a separate OS user or host).
- **Leaning**: B. All of OpenClaw's selling points rest on "one trusted owner + one local process"; **multi-tenancy isn't unbuilt so much as deliberately excluded from the trust model.**

**Decision ② The messaging platform is the UI, not a self-built frontend ⭐**
- Option A: build your own web/desktop client. Pro: total control over the UI; con: one more new client to install and maintain, and users have to change habits.
- Option B: **parasitize the chat apps you already use**. Pro: **zero new client, zero learning curve**, anytime and anywhere; con: you pull each platform's **accounts, credentials, and multi-user semantics** entirely into the attack surface (others in a group can talk too; a platform account can be stolen).
- **Leaning**: B. The payoff of lowering the barrier overrides everything, but stay clear-eyed: **you've outsourced the trust boundary to the chat platform** (see Section 10's admission policy).

**Decision ③ Outsource the agent kernel + pluggable harness ⭐**
- Option A: build your own agent kernel. Pro: fully self-controlled behavior, consistent across scenarios; con: heavy, and chasing the frontier wears you out.
- Option B: **outsource the kernel** — bundle the minimalist **Pi**, plug in `codex`, and reach Claude Code / Gemini CLI / OpenCode / Cursor via **ACP**. Pro: **light, keeps up with the frontier**, and users can use the harness they're used to; con: **behavior depends on upstream**, and **cross-harness consistency is on OpenClaw to paper over** (the same sentence may behave differently under Pi vs. Claude Code).
- **Leaning**: B. The Gateway does only "control plane + orchestration," handing "how to think" — a fast-evolving thing — to a dedicated kernel.

**Decision ④ Skills = SKILL.md compiled into XML + a ClawHub registry ⭐**
- Option A: write skills as code plugins. Pro: powerful; con: high barrier, hard to share, hard to audit.
- Option B: **skills = `SKILL.md` (Markdown + YAML frontmatter), compiled into XML injected into the prompt, shared via ClawHub**. Pro: **low barrier, shareable, auditable** (it's just text you can read); con: **installing a third-party skill = trusting its content** — it enters the system prompt, i.e., it's a supply-chain / prompt-injection entry point.
- **Leaning**: B, but treat "installing a skill = granting trust" as a hard line (see Sections 10 and 11).

**Decision ⑤ Memory = plain text on disk, no hidden state ⭐**
- Option A: put memory in a database/vector-store black box. Pro: strong retrieval; con: unreadable, hard to version, and easy to mistake for magic that "remembers everything automatically."
- Option B: **memory = plain Markdown on disk** (`MEMORY.md` / `memory/date.md`), where "the model only remembers what gets saved to disk." Pro: **readable, greppable, version-controllable**, with transparent behavior; con: **it depends on the model actively writing to disk** (if it doesn't write, it doesn't remember), and **plaintext is sensitive data**.
- **Leaning**: B. Transparency and auditability override "a black box remembers more"; retrieval is rounded out separately with `memory_search`/`memory_get`.

**Decision ⑥ Heartbeat and Cron as a dual-track scheduler ⭐**
- A single mechanism can't be both "thrifty and precise": autonomous patrol wants to save tokens and can be fuzzy; scheduled jobs want precision and a record.
- **Leaning**: **dual-track**. **Heartbeat** = fuzzy time / shared main session / inject only due items / reply OK if nothing / no task record (thrifty); **Cron** = precise time / isolated execution / a task record every time (logged). The motivation is blunt: **being resident + periodically waking continually burns tokens, so the default design is extremely restrained.**

## 9. Scaling and Bottlenecks

Set the tone first: **OpenClaw is single-user, single-machine, resident — not designed for high concurrency / multi-tenancy.** "Scaling" here isn't "handle more users" but "as one person uses it more heavily, what gives out first."

- **First bottleneck: single-process serial execution.** The Pi action loop runs serially through a **per-session + global queue** — messages arriving simultaneously from multiple channels **queue up** and wait. → This is the inherent cost of a single-process control plane; the fix is not "add machines" but accepting that it's a personal assistant (split into multi-agent / multiple gateway instances if you must, but that already drifts from the single-trust-boundary intent).
- **Second bottleneck: cost and context (burning tokens).** Being resident + Heartbeat's periodic waking **continually burns tokens** (it's been reported that the author's team running 100 agents burned through tokens on the order of a million dollars in a month — exactly the motivation for the restrained defaults). → Fix: Heartbeat **injects only due items, replies `HEARTBEAT_OK` when nothing's up, and leaves no task record**; recent memory only auto-injects "today + yesterday," with older context fetched by search on demand.
- **Third bottleneck: platform-side channel constraints.** Each chat platform has its own **API rate limits and account policies** — push too hard and you may get throttled or even banned. → Fix: treat channels as constrained external dependencies, tighten DM policy, and control the rate of proactive outbound messages.

## 10. Security and Compliance Essentials

Set the tone in one line: **self-hosting = the operator bears it.** OpenClaw's security model is a **single-operator trust boundary**, assuming by default that "the machine's owner is the only trusted party."

- 🔴 **Keys are everything; the directory is sensitive**: under `~/.openclaw/` are config, sessions, memory, and keys (in plaintext). Recommend **full-disk encryption + running the Gateway under a dedicated OS user** to shrink the blast radius.
- 🔴 **Policy-first tool permissions**: `exec` / `gateway` / `cron` etc. default to **deny**; allow precisely with allow/deny lists; high-risk goes through approval; execution goes in a **Docker sandbox**. **Never pair a "tool-equipped agent" with a weak, small model** — weak models are more easily coaxed across the line.
- 🔴 **Prompt injection is "unsolved"**: this is a recognized open problem. OpenClaw's defense is **defense-in-depth**:
  - **The first and most effective line — inbound admission**: `pairing` (default) / `allowlist`; don't use `open`; group chats require `@bot`. Keeping strangers out at the door beats remediating after the fact.
  - **DM isolation**: `per-channel-peer` keeps different peers' contexts invisible to each other.
  - **Context visibility filtering**: control what content can enter the prompt.
  - ⚠️ **Group chats amplify the risk**: in a group, **any sender allowed by policy** can induce a tool call within policy — take the admission list seriously.
- 🔴 **Untrusted scenarios must split the boundary**: the moment you have to let untrusted people use it, you **must split gateway + credentials, even a separate OS user / host** — don't cram multi-user into a single trust boundary.

## 11. Common Misconceptions / Anti-patterns

For each: "wrong approach → why it's wrong → the right mindset."

- ❌ **Deploying it as a multi-tenant SaaS** (a crowd of strangers sharing one Gateway) → ✅ It's a **single trust boundary**; for multi-user/untrusted scenarios, split into separate gateways + credentials, even separate hosts.
- ❌ **Default wide open, and hooking full-power tools into a sensitive channel** → ✅ Policy-first: tools deny by default, allow on demand, sensitive actions through approval and sandbox.
- ❌ **Believing it has a "magic memory black box" that remembers everything automatically** → ✅ **No hidden state**; if the model doesn't actively write to disk, it doesn't remember — memory is plain text on disk that you can read.
- ❌ **Installing third-party skills indiscriminately / blindly letting the agent execute inbound content** → ✅ **Installing a skill = granting trust**; skills enter the system prompt, and treat inbound content as untrusted input, backed by admission and approval.
- ❌ **Confusing Heartbeat with Cron** (using the heartbeat as a precise alarm, or expecting it to leave a record) → ✅ Use **Cron** for precise + logged; use **Heartbeat** for fuzzy patrol + thrift (produces no task).
- ❌ **Driving a tool-equipped agent with a weak, small model** → ✅ Equipped with tools = able to change the world, all the more reason to use a model that's strong, stable, and injection-resistant enough.
- ❌ **Writing skill frontmatter across multiple lines** → ✅ The parser **only recognizes single-line keys**; metadata must be **single-line JSON** — writing it multi-line fails to parse.

## 12. Evolution Path: Personal & Trusted → Tighten Policy → Split the Trust Boundary

The architecture doesn't change, but **policy tightens as exposure grows.** Don't apply "the permissive defaults of a personal single machine" to an "externally exposed" scenario.

| Stage | Scenario | How to set policy (concrete) | What to worry about now |
|---|---|---|---|
| **Personal single machine, trusted** | Only you use it, resident on the local machine | Default **permissive** is fine; `pairing` admission, tools opened on demand | First get the assistant running and comfortable to use |
| **More channels / installing skills** | Multi-channel integration, bringing in third-party skills | **Tighten policy**: `allowlist` for channels, `@bot` for group chats, review third-party skills one by one, sensitive tools through approval + sandbox | The admission surface and the supply chain (a skill = granting trust) |
| **Team / external exposure** | Used by others or in untrusted scenarios | **Split the trust boundary**: separate gateway + separate credentials, and a separate OS user / host if needed; equip tools with the minimal set | Multi-user semantics, attack-surface isolation, least privilege |

## 13. Reusable Takeaways

The "wisdom you can carry away" from this design:

- 💡 **A single control plane converges coordination**: converging sessions/channels/tools/memory into one source of truth (the Gateway) is a general remedy for fragmentation — the same root as a gateway or middle layer "rounding up cross-cutting concerns at one entry point."
- 💡 **Parasitize an existing UI to lower the barrier**: rather than forcing users to install a new client, parasitize the entry point they already use; the cost is that you inherit that entry point's trust boundary along with it — stay clear-eyed.
- 💡 **Make memory auditable plain text**: no hidden state, readable, greppable, version-controllable — transparency beats "a black box remembers more," at the cost of depending on active writes to disk.
- 💡 **Admission is the first and most effective line of defense against prompt injection**: rather than counting on after-the-fact filtering, keep untrusted sources out at the door with `pairing`/`allowlist` — **the cheapest security is often at the entrance.**
- 💡 **Use mechanism to separate "thrifty patrol" from "precise logging"**: the Heartbeat-vs-Cron dual track is, at heart, refusing to force two classes of need — "fuzzy and cost-saving" vs. "precise and auditable" — through a single mechanism.

## 🎯 Quick Quiz

<Quiz
  question="What is the most core premise of OpenClaw's security model?"
  :options="['It is a multi-tenant SaaS with native multi-user isolation', 'It is single-user with a single trust boundary, assuming the machine owner is the only trusted party', 'It has a built-in mechanism that fully solves prompt injection']"
  :answer="1"
  explanation="OpenClaw is a self-hosted, single-trust-boundary personal gateway; its conveniences (resident, local-first, hot-reload) all rest on the machine owner being the only trusted party. To let untrusted people use it, you must split the trust boundary."
/>

---

## 14. Reference Prototypes and Further Reading

> This section lists only **verified** official repos and docs. To get hands-on, start from the repo README, then read deeper by topic.

**🔧 Open-source prototype (read the code directly):**
- [openclaw/openclaw](https://github.com/openclaw/openclaw) — the official repo README, the main entry to the self-hosted personal agent gateway, embodying "a single control plane + parasitizing the chat UI."

**📖 Official docs (by topic):**
- [OpenClaw Docs home](https://docs.openclaw.ai/) — docs overview.
- [Gateway configuration](https://docs.openclaw.ai/gateway/configuration) — `openclaw.json` (JSON5), schema validation, and hot-reload; maps to Section 7.
- [Security model](https://docs.openclaw.ai/gateway/security) — single trust boundary, policy-first tool permissions, admission, and prompt-injection defense; maps to Section 10.
- [Heartbeat scheduling](https://docs.openclaw.ai/gateway/heartbeat) — Heartbeat's thrifty design; maps to Section 6 Scenario 2 and Decision ⑥.
- [Agent action loop](https://docs.openclaw.ai/concepts/agent-loop) — plan→act→observe and hooks; maps to Section 5 component ③.
- [Agent runtimes / harnesses](https://docs.openclaw.ai/concepts/agent-runtimes) — built-in Pi, plugin codex, ACP to Claude Code/Gemini CLI/OpenCode; maps to Decision ③.
- [Memory persistence](https://docs.openclaw.ai/concepts/memory) — plain text on disk, no hidden state; maps to Decision ⑤.
- [Skills mechanism](https://docs.openclaw.ai/tools/skills) — `SKILL.md` + frontmatter + ClawHub; maps to Decision ④.

**🔗 Related templates (this repo):**
- [Hermes](../hermes/README.md) — the **peer sister piece**: also a personal gateway that "wires an agent into chat apps"; compare the differences in trade-offs.
- [Claude Code](../claude-code/README.md) — one of the coding harnesses OpenClaw can reuse via ACP.
- [Codex](../codex/README.md) — another harness reachable via plugin/ACP.
- [AI Agent / Workflow Platform](../ai-agent-platform/README.md) — contrast a "multi-tenant, run other people's tasks" agent platform with this "single-user, run your own work" piece.
- [The Ten Core Architecture Patterns](../../tutorial/04-十大核心架构模式.md) — the parent of trade-offs like "a single control plane" and "if you can avoid using it, don't."

---

> 📌 Remember OpenClaw in one line: **it's a personal agent gateway that lives resident on your own machine, parasitic inside the chat apps you already use — using a single-process control plane to converge sessions/channels/tools/memory all locally, with data and keys never leaving home; it doesn't build its own agent kernel (it embeds Pi and can reuse Claude Code and others via ACP), and memory is plain text on disk with no hidden state; yet all its convenience is bet on the premise of "single-user, single trust boundary" — the moment you must let untrusted people use it, you have to split that trust boundary first.**
