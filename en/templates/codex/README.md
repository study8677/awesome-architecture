# OpenAI Codex Architecture Template

> **Representative product / prototype**: OpenAI Codex (Codex CLI + Codex Cloud) — with side glances at Claude Code, Cursor Agent, Devin
> **One-line positioning**: OpenAI's agentic software-engineering agent — one kernel, two execution forms: pair in real time in your local terminal, or hand a whole task off to an isolated sandbox in the cloud that runs it to completion asynchronously and hands back a PR; the entire architecture is one long trade-off between "autonomous execution" and "controllability via sandbox + approval."

---

## 1. One-Line Positioning

Codex = **one agentic coding-agent kernel that grows two execution shells**: pair with you in real time on your machine (CLI / IDE — synchronous, step-by-step approval), or delegate an entire task to an isolated container in the cloud that runs it to completion asynchronously and hands back a PR.

It belongs to the same lineage as the [AI Agent Platform](../ai-agent-platform/README.md) — the same "plan → call a tool → observe → decide again" action loop — but Codex narrows "tools" to the vertical of **software engineering**: read/write a codebase, apply patches, run commands, run tests, commit. It solves the same class of problem as its sibling [Claude Code](../claude-code/README.md), but Codex's soul lies in **two execution forms sharing one kernel**, and in describing "how much latitude this agent has" with **two orthogonal axes (sandbox × approval)** rather than a one-dimensional dial.

## 2. The Business Essence: What Problem It Solves

The traditional way to "write code" is a tightly coupled loop where **a human watches, edits one line, runs it once, looks at the result, and edits again** — the human is the bottleneck at every step. What Codex sets out to do is upgrade this from a "real-time manual loop" into **delegable, parallel, asynchronous engineering-task execution**:

- **Delegable**: you say "fix this auth bug / add tests for this module / bump this dependency," and the agent goes and reads the code, edits, runs, and verifies — you don't babysit every step.
- **Parallel**: throw five unrelated tasks into five cloud sandboxes at once, each running on its own, instead of queuing for you to do them one by one by hand.
- **Asynchronous**: the task runs to completion in an isolated cloud environment (possibly tens of minutes) while you do something else; when it's done it opens a PR for your review.

In other words, it frees the engineer from "every step of the loop," keeping you only at the **critical decision points (approval, reviewing the PR)**. What it sells isn't "autocomplete" — it's "**handing off an entire engineering task with a clear goal in one piece**." That also dictates all of its architectural tension: the more "whole and autonomous" the delivery, the more **out-of-control side effects** (editing the wrong file, running a dangerous command, leaking a secret) must be structurally constrained — hence the sandbox and approval.

## 3. Core Requirements and Constraints

**Functional requirements (what the system must be able to do):**
- [ ] Action loop: read the codebase → plan → apply patches / run commands → observe results → decide again, until the task is done
- [ ] Two execution forms: local real-time pairing (CLI / IDE) + cloud asynchronous delegation (isolated container, opens a PR when done)
- [ ] Headless execution (something like `codex exec`): embeddable in CI / scripts, runnable unattended
- [ ] Sandboxed execution: commands the agent runs must land in a controlled, isolated environment
- [ ] Tiered approval: dangerous / out-of-bounds operations can pause for human confirmation; the degree of autonomy is tunable
- [ ] Bidirectional MCP: act as a client to plug in external tools, and expose itself as an MCP server for other agents to call
- [ ] Nearest-wins project instructions (AGENTS.md): let the agent understand this repo's conventions
- [ ] Local ↔ cloud migration: a task started locally can be delegated to the cloud, and cloud results pulled back local

**Non-functional requirements / quality attributes (how well the system must do it):**

| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Task success rate** | As high as possible | The agent's fundamental value; editing wrong / going off-track is negative output |
| **Security / control** | Mandatory, and tunable | The agent can edit code, run commands, touch the network — side effects are real and possibly irreversible |
| **Long-horizon coherence** | Doesn't lose its way on long tasks | Engineering tasks span far; a long context easily leads to repetition, drift, forgetting the goal |
| **Isolation strength** | Kernel-level, un-bypassable | Application-layer "self-discipline" can't stop a runaway or malicious process; isolation must sit below the application |
| **Long-horizon stability** | Long sessions don't crash or stall | A task runs tens of minutes; runtime jitter / memory growth / GC pauses would ruin it |
| **Parallel throughput** | Many tasks at once | Parallelism is the core selling point of cloud delegation |

**Key constraints (boundaries you cannot cross):**
- 🔴 **The sandbox is kernel-enforced, not a gentlemen's agreement**: commands the agent runs (and the child processes they spawn) are caged by OS-level mechanisms, not by the model "behaving."
- 🔴 **In the cloud, the agent phase is offline by default and secrets are already removed**: before the agent actually gets to work, the container cuts off the network and wipes the credentials used during setup — minimizing the exfiltration surface that prompt injection could exploit.
- 🔴 **Under `workspace-write`, `.git/`, `.agents/`, and `.codex/` are recursively read-only**: the agent can't tamper with version history, its own config, or agent metadata (preventing it from "unlocking the locks placed on it").
- 🔴 **The model makes mistakes and goes off the rails**: the loop may not converge, may confidently edit the wrong thing; hence approval and self-review as a fallback.
- 🔴 **No native full sandbox on Windows**: full isolation goes through WSL2 (the Linux subsystem); on the native Windows path, sandbox capability is limited.

## 4. The Big Picture

```
                       One shared kernel (core)
   action loop · model interaction · tool/patch/command dispatch · config · session/history
        ┌──────────────────────────────────────────────────────────┐
        │  config.toml (policy + MCP)   ·   AGENTS.md (nearest-wins) │
        └───────────────┬───────────────────────────┬──────────────┘
                        │                           │
       ┌────── Approval / execution policy layer (two orthogonal axes) ──────┐
       │  sandbox_mode  ×  approval_policy             │  ← decides "how much latitude"
       │  read-only /     untrusted /                  │
       │  workspace-write/ on-request /                │
       │  danger-full     never                        │
       └───────────────┬───────────────────────────┬──┘
                        │                           │
        ┌───────────────▼───────────┐   ┌───────────▼───────────────────┐
        │   Local form (sync pair)   │   │   Cloud form (async delegate)  │
        │  CLI (tui full-screen)/ IDE│   │  chatgpt.com/codex ↔ GitHub    │
        │  · Auto Context: files     │   │  · task → managed isolated     │
        │    you're viewing          │   │    container                   │
        │  · step-by-step approval   │   │  · async / parallel, many at   │
        │                            │   │    once                        │
        │     ┌──────────────────┐   │   │   build container → checkout   │
        │     │  OS-kernel sandbox│   │   │   → setup phase [net · secrets]│
        │     │  macOS: Seatbelt  │   │   │   → agent phase [no net · no   │
        │     │  Linux: bwrap +   │   │   │      secrets] (autonomous      │
        │     │  seccomp + nnp    │   │   │      patch/test in sandbox)    │
        │     │ (caps child procs)│   │   │   → produce diff → open PR     │
        │     └──────────────────┘   │   │   state cached ≤12h → faster   │
        │   headless: codex exec (CI)│   │   next cold start              │
        └────────────────────────────┘   └────────────────────────────────┘
                        ▲                           ▲
                        │  bidirectional MCP (client ⇄ server)│
                ┌───────┴──────────┐        ┌─────────┴──────────┐
                │ external MCP tools│        │ another agent calls│
                │ (Codex as client) │        │ Codex as MCP server│
                └──────────────────┘        └────────────────────┘

        Local ◀───────────  task is migratable  ───────────▶ Cloud
        Final artifact (both roads converge): Git commit / Pull Request
```

> The soul is two things. First, **one `core` kernel, two shells**: the local form hands isolation duty to "the OS-kernel sandbox on your machine," the cloud form to "an OpenAI-managed isolated container" — the agent's *behavior* is from one source, only the *execution environment and isolation mechanism* differ. Second, **"how much latitude" is not a single knob but two orthogonal axes** (sandbox mode × approval policy); read this diagram and you understand what sets Codex apart from other coding agents.

## 5. Component Responsibilities

Each key part above, with **what it does + why it's needed**.

- **Shared kernel (core)**: the agent's brain and hub — drives the action loop, interacts with the model, dispatches "apply patch / run command / call tool," and manages config and session history. *Why it's needed*: it's the physical basis for "local and cloud behave from one source"; the two shells just swap its execution environment and UI, while the decision logic exists in exactly one place, preventing two implementations from drifting apart.
- **Local interaction layer (CLI's full-screen terminal UI / IDE plugin)**: surfaces the agent's reasoning, patches, and commands to you in real time and takes your step-by-step approval; the IDE form additionally has **Auto Context** (automatically tracking the files you're viewing and feeding that focus to the agent) and can sync with cloud tasks on the same project. *Why it's needed*: the value of the local scenario is **real-time pairing** — the human is in the loop and can intercept as it goes.
- **Headless execution (`codex exec`)**: runs the same kernel with no UI, unattended, for CI / scripts to invoke. *Why it's needed*: embeds the agent into automation pipelines; the canonical pairing is `read-only + never` (read-only, no interruption), so it can safely run analysis / checks in CI.
- **Cloud container orchestration**: bound to GitHub via `chatgpt.com/codex`, it spins up a managed isolated container per delegated task, runs the full lifecycle (build container → checkout → setup → agent → diff → open PR), and maintains an environment cache for ≤12h. *Why it's needed*: the physical carrier of **async + parallel**; it fully decouples the task from your machine's resources and your supervision.
- **OS-kernel sandbox executor**: the cage for the commands the agent runs. macOS uses Apple **Seatbelt** (`sandbox-exec`); Linux uses a standalone helper binary — **bubblewrap** to build a read-only root + selectively writable directories + `unshare` to cut the network, plus in-process `PR_SET_NO_NEW_PRIVS` + **seccomp** network filtering (Landlock as a fallback on older kernels). *Why it's needed*: only by putting isolation **below the application** can you constrain the child processes the agent spawns — otherwise a script launched by a single `make` would slip past application-level self-discipline.
- **MCP client / itself an MCP server**: outward, acts as a client to plug into external tools and data sources; inward, can expose itself as an MCP server for other agents to orchestrate. *Why it's needed*: lets Codex both "use others' capabilities" and "be used as a capability by others" — bidirectionally composable in the agent ecosystem.
- **Approval / execution policy layer**: splits "how much latitude" into two orthogonal axes — `sandbox_mode` (isolation strength) × `approval_policy` (when to stop and ask) — and provides `auto_review` (the agent self-reviews before executing, grading data exfiltration / credential probing / destructive operations). *Why it's needed*: this is the system's **master safety valve**, and where the most valuable decision of Section 8 lands.

## 6. Key Data Flows

**Scenario 1: The local agent loop (synchronous pairing, human in the loop)**
```
You: "Fix the null-pointer on the login endpoint, and add a regression test"
  ① Kernel reads the codebase + the nearest AGENTS.md → plan: locate, then patch, then test
  ② propose: the agent offers a patch / the command it wants to run
  ③ approve? ── depends on approval_policy:
        untrusted  → ask you before any state change
        on-request → autonomous inside the sandbox; ask only when "out of bounds"
                     (leaving the workspace / needing the network)
        never      → fully autonomous within the sandbox's limits, no interruption
  ④ Execute in the OS-kernel sandbox (writes confined to the workspace,
     commands constrained by seccomp/Seatbelt)
  ⑤ Feedback: feed stdout / test results / errors back to the kernel → back to ①, until done
  ⟲ Sandbox backstop: even if step ③ green-lights it, the sandbox still holds the physical
     boundary of "where it can write, whether it can reach the network"
```

**Scenario 2: Delegating a task to the cloud (asynchronous, opens a PR when done)**
```
You delegate from CLI / IDE / chatgpt.com: "Bump axios to v1 in this repo and get the tests passing"
  ① Orchestrator builds a managed isolated container (cold start is faster if cached)
  ② checkout: pull the target branch into the container workspace
  ③ setup phase [net · secrets]: install deps, run build prep; any private network /
     credentials needed are consumed here
  ④ —— cut the network, remove the secrets used during setup ——   ← the key state switch
  ⑤ agent phase [no net · no secrets]: autonomously edit code, run tests, iterate in the sandbox
        (anything needing the network must be pre-staged in ③, or ⑤ can't get it)
  ⑥ produce a diff → open a Pull Request on the bound GitHub repo
  ⑦ You come back asynchronously to review that PR (only now does the human re-enter the loop)
  ※ Container state cached ≤12h, reused by the next task on the same environment, amortizing
    the heavy-dependency cost of a cold-start setup
```

> The artifact of both scenarios **converges — both are a Git commit / PR**; the only differences are "when the human is in the loop" (local: throughout vs cloud: only at the closing review) and "to whom isolation is entrusted" (local: the OS kernel vs cloud: a managed container). That **network-cut + secret-wipe state switch in step ④** is the cloud form's structural guardrail against prompt injection — worth committing to memory.

## 7. Data Model and Storage Choices

Core entities: `config / policy`; `project instructions`; `workspace`; `session / history`; `container environment state`; `secrets`; `final artifact (commit / PR)`.

| Data | Storage / Form | Why |
|---|---|---|
| Global config / policy / MCP integrations | `config.toml` (shared, one source for local and cloud) | Sandbox mode, approval policy, MCP services are "consistent across forms"; centralizing them prevents drift |
| Project-level instructions | `AGENTS.md` (nearest-wins, can be overridden per directory) | Lets the agent understand this repo's / subdirectory's conventions; **nearest** means the instructions closest to the change win |
| Code workspace | Container filesystem / local repo | What the agent actually reads and writes; editable under `workspace-write`, but `.git/.agents/.codex` are recursively read-only |
| Session / action history | Kernel session state | The coherence of the action loop rides on it; long tasks need compaction to stay alive |
| Cloud environment state | Container snapshot, **cached ≤12h** | Amortizes the cold-start cost of "install deps / build prep," speeding up the next task on the same environment |
| Secrets / credentials | **Two-phase**: extra-encrypted, available only during setup | Removed before the agent phase begins — so the "window that holds secrets" and the "window that runs untrusted generated code" physically don't overlap |
| Final artifact | **Git commit / Pull Request** | The natural deliverable of an engineering task; landing it in version control makes it auditable, revertible, and reviewable by nature |

> Note one design stance: Codex barely builds a "business database" of its own — its "storage" is **the codebase itself + a shared config + nearest-wins project instructions**. This lets it **attach statelessly to any repo**, with artifacts flowing back into Git — and version control conveniently doubles as its audit and rollback layer.

## 8. Key Architecture Decisions and Trade-offs ⭐

**(The most valuable section of this template.)**

**Decision 1: "Two-axis decoupling" of sandbox and approval — orthogonal axes replacing a one-dimensional dial ⭐ (Codex's soul)**
- The old world: describe autonomy with a one-dimensional preset dial (something like `suggest / auto-edit / full-auto`). Intuitive, but it **conflates** two fundamentally different things — "how large a range the agent can physically touch" and "when it should stop and ask a human."
- The new world: split into two **orthogonal** axes.
  - `sandbox_mode` (isolation strength, the physical boundary): `read-only` / `workspace-write` (default: read, edit and run commands within the workspace, but `.git/.agents/.codex` are read-only and the network is off by default) / `danger-full-access` (boundary removed, high risk).
  - `approval_policy` (when to stop and ask, the process boundary): `untrusted` (ask before any state change) / `on-request` (autonomous in the sandbox, ask only when out of bounds) / `never` (fully autonomous within the sandbox's limits).
- Orthogonal combinations replace the old presets: `Auto = workspace-write + on-request`; `CI = read-only + never`; true full autonomy = `danger-full-access + never`.
- **Where to land**: **use two orthogonal axes.** It lets "physical range of action" and "degree of process interruption" be tuned **independently** — e.g., "physically read-only, but report to me at every step" or "physically able to edit the workspace, but never interrupt me" both become a clear cell rather than a murky "middle setting." **The cost**: a higher cognitive load (you must understand two concepts at once) and easier confusion for newcomers (see Section 11). This is a different answer to the same class of problem as the permission model in the sibling [Claude Code](../claude-code/README.md) — worth reading side by side.

**Decision 2: Local interaction vs cloud asynchrony — share one kernel, delegate isolation duty separately ⭐**
- Option A: build a separate agent logic for local and for cloud. Cost: the two implementations drift in behavior, double the maintenance, inconsistent bugs.
- Option B: **one `core` kernel, two execution shells**; delegate isolation duty by form, locally — to **the OS-kernel sandbox on your machine**, in the cloud — to **an OpenAI-managed isolated container**.
- **Where to land**: **B.** The agent's *decision behavior* exists in exactly one place (one source, maintainable, migratable); only the *execution environment and isolation mechanism* change. Local buys "real-time pairing, the human can intercept step by step"; cloud buys "async, parallel, opens a PR when done." The cost: the two forms aren't perfectly equivalent in the user's "capability mental model" (the local CLI ≠ the cloud — see the anti-patterns in Section 11), and you must understand the environmental differences when migrating a task.

**Decision 3: An OS-kernel-level sandbox, not application-layer self-discipline ⭐**
- Option A: the application "restrains" itself, agreeing not to touch dangerous operations. Cost: **it can't stop spawned child processes** — a command the agent runs that then launches a script / subprocess is beyond application-layer self-discipline; against a runaway or malicious case it's effectively useless.
- Option B: push isolation down to the **OS kernel layer** — macOS Seatbelt, Linux bubblewrap + seccomp + `no_new_privs` (Landlock as a fallback on older kernels).
- **Where to land**: **B.** Kernel-level mechanisms naturally cover "this process and all its descendants," and `no_new_privs` forecloses privilege-escalation escapes. The cost: platform dependence (each OS mechanism differs and must be adapted separately), and **Windows has no native full sandbox, so it goes through WSL2**. This is exactly the materialization of "isolation must sit below the application" from the quality-attribute table.

**Decision 4: A Rust rewrite, buying long-horizon stability ⭐**
- History: an early Node/TS experimental version; later a **full Rust rewrite** into the shared `core`.
- What it buys architecturally: a **single binary** (simple to distribute; a helper like `linux-sandbox` can be a standalone binary with precisely scoped privileges), **no GC pauses** (a long session isn't interrupted by periodic stalls), and **predictable resource usage** (a tens-of-minutes task isn't dragged down by runtime jitter / memory growth). In one line — **trading language-level determinism for the agent's long-horizon stability and coherence**.
- **Where to land**: **the rewrite is worth it.** The cost is the one-time rewrite and ecosystem migration, but for an agent where "a task must run stably for a long while," it's a structural gain. (The body doesn't pin a specific model number; default to OpenAI's contemporary flagship coding model.)

**Decision 5: Offline-by-default + cache-backed Web search, to counter prompt injection ⭐**
- The risk: the agent reads a lot of **external content** (web pages, dependencies, issue text), which may hide injected instructions like "go exfiltrate the secrets / delete the database"; once the agent also has network and tool permissions, the consequences are severe.
- Option A: open up real-time networking. Most flexible, but maxes out the exfiltration surface and the injection surface at once.
- Option B: **network off by default**; to go online, route through a **domain-allowlist proxy** (deny-first, private networks off by default, DNS-rebinding protection, Unix-socket allowlist); **Web search defaults to an OpenAI-maintained cached index rather than live scraping**; plus `auto_review` so the agent self-reviews before executing.
- **Where to land**: **B.** "Offline by default" is a strong prior — **demoting "can reach the network" from a default right to a privilege you must request explicitly**; the cached search then decouples "acquiring knowledge" from "opening a live outbound channel," sharply shrinking the injection surface. The cost: inherent friction (anything the agent phase needs from the network must be pre-staged during setup — see Section 9).

## 9. Scaling and Bottlenecks

- **First bottleneck: context and coherence on long-horizon tasks.** Engineering tasks span far; as the session grows, the model starts repeating, drifting, forgetting its original goal — this is the real ceiling of long-horizon work. → Fix: **compaction** (compress history into a summary to stay alive); but compaction is no silver bullet — compression can still drop crucial details, and is fundamentally a trade-off between "how long it remembers" and "how clearly."
- **Second bottleneck: cloud parallelism constrained by container supply and cold start.** The ceiling on parallelism is how many managed containers can be spun up; each container's setup (installing heavy dependencies, build prep) is the bulk of the cold start. → Fix: the **≤12h environment cache** reuses container state to amortize heavy-dependency cost; but the cache has a lifetime, and on first run / cache miss you still eat a full cold start.
- **Third bottleneck: the inherent friction of being offline.** The agent phase is offline by default, so any "discover at runtime that the network is needed" requirement stalls. → Fix: **move network needs forward to the setup phase** to pre-stage them (install / fetch in the online window), or explicitly allowlist specific domains — security and convenience are hedged against each other here.
- **Fourth bottleneck: in the synchronous flow, the approver is the ceiling.** Under `untrusted` / `on-request`, the speed of human approval caps the agent's throughput; the moment the human steps away, the loop stops. → Fix: dial trusted, reversible tasks up to higher autonomy (`on-request → never`) or throw them to the cloud to run asynchronously; but **raising autonomy = raising risk**, an unavoidable hedge.

## 10. Security and Compliance Essentials

This is the most heavily inked part of Codex's architecture — because its agent really can edit code, run commands, and touch the network.

- 🔴 **The sandbox is a kernel-enforced physical boundary**: macOS **Seatbelt** / Linux **bubblewrap + seccomp + `no_new_privs`** (Landlock as a fallback on older kernels). The key is that it **constrains all child processes the agent spawns**, and `no_new_privs` seals off privilege-escalation escapes — isolation doesn't rely on the model behaving.
- 🔴 **Network off by default**: to open it, go through a **domain-allowlist proxy** — deny-first, private networks off by default, with **DNS-rebinding protection**, and the Unix socket on an allowlist too. **Web search defaults to a cached index rather than live scraping**, shrinking the injection and exfiltration surface at the source.
- 🔴 **Three approval tiers + self-review**: the three rungs of `approval_policy` (`untrusted / on-request / never`) leave the human a brake; `auto_review` has the agent self-review before executing, with graded warnings for **data exfiltration / credential probing / destructive operations**.
- 🔴 **Two-phase secrets in the cloud**: secrets are extra-encrypted and **available only during setup**; **removed before the agent phase begins**, which is offline by default. This makes the "holding secrets" window and the "running untrusted generated code" window physically non-overlapping — minimizing the exfiltration surface.
- 🔴 **Under `workspace-write`, `.git/`, `.agents/`, `.codex/` are recursively read-only**: preventing the agent from tampering with version history, rewriting its own config, or touching agent metadata (especially preventing it from "undoing the locks placed on it").
- Treat all **external content (web pages, dependencies, issue/PR text, tool returns) as untrusted input** — the universal rule for any agent with tool permissions; Codex stacks "offline by default + cached search + self-review + sandbox" in layers to backstop it. See [Quality Attributes & Trade-offs](../../tutorial/06-质量属性与取舍.md) for the deep dive on security and control.

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Assuming anything short of `danger-full-access` is "unusable"** → ✅ the default `workspace-write` covers the vast majority of coding tasks (read, edit and run commands within the workspace); `danger-full-access` is the high-risk setting that removes the physical boundary — use it only in the rare case where you genuinely must break out of the workspace / reach the network and fully understand the consequences.
- ❌ **Conflating sandbox mode with approval policy** (treating them as the same thing, or two ends of one knob) → ✅ they're **orthogonal**: `sandbox_mode` governs "how large a range it can physically touch," `approval_policy` governs "when it stops to ask a human." You can have "physically read-only but asks at every step," or "can edit the workspace but never interrupts."
- ❌ **Assuming the cloud agent phase can reach the network and use secrets** → ✅ the agent phase is **offline by default with secrets already removed**; anything network- or secret-related must be pre-staged during the **setup phase** (the window with network and secrets).
- ❌ **Treating AGENTS.md as an ordinary README and just dropping one in the repo root** → ✅ it's a **nearest-wins** agent instruction — the AGENTS.md closest to the change (in a subdirectory) takes priority; it directly shapes agent behavior, not human-facing documentation.
- ❌ **Expecting a full sandbox on native Windows** → ✅ full isolation goes through **WSL2**; on the native Windows path sandbox capability is limited — don't treat it as equivalent.
- ❌ **Treating the local CLI as the equivalent of the cloud** (assuming the two have identical capability) → ✅ the kernel is one source, but the **execution environment and isolation mechanism differ**: local is synchronous pairing + an OS-kernel sandbox; cloud is asynchronous parallelism + a managed container, with the network-cut / secret-wipe state switch. Understand the difference before migrating a task.

## 12. Evolution Path: MVP → Growth → Maturity

Architecture grows; an agent's "degree of autonomy" should also open up gradually with trust and process maturity.

| Stage | Scale / Trust | How to Set It Up (Specifics) | What to Worry About Now |
|---|---|---|---|
| **MVP** | Individual / probing | Local CLI / IDE, `read-only` (look only) or `workspace-write + on-request` (the default Auto, step-by-step approval); build trust on small tasks first | First validate "is this agent editing things correctly," with the human in the loop throughout |
| **Growth** | Team / semi-trusted | Dial trusted, reversible tasks up to autonomous `workspace-write`, fewer interruptions; keep `auto_review` on; in CI use `codex exec` + `read-only + never` for unattended checks; tidy up AGENTS.md so behavior is predictable | Task success rate, controllability, the approver no longer being the bottleneck |
| **Maturity** | Organization / high throughput | Cloud **parallel delegation** (many containers, cache reuse), open a PR when done for asynchronous review; keep high autonomy for safe tasks, tighten approval for dangerous ones; a fully autonomous CI pipeline | Parallel throughput, security boundaries, container supply and cache cost, org-level audit |

## 13. Reusable Takeaways

- 💡 **A security boundary is clearer as "two orthogonal axes" than as "a one-dimensional dial."** Splitting "physical range of action" and "degree of process interruption" into independent axes (sandbox × approval) is borrowable by any system that needs to describe "autonomy / permission" — a one-dimensional dial looks simple but actually blurs the boundary by conflating different dimensions.
- 💡 **Entrust isolation to a layer "below the application."** Application self-discipline can't stop spawned children or malice; pushing isolation down to the OS kernel (or a managed container) is what covers "this process and all its descendants." This is the universal rule for any system that "executes untrusted code," echoing the "run all tools in a sandbox" of the [AI Agent Platform](../ai-agent-platform/README.md).
- 💡 **"Offline by default" is a strong prior against injection / exfiltration.** Demote "can reach the network" from a default right to a privilege requested explicitly, and decouple "acquiring knowledge" from "opening an outbound channel" (cached search) — sharply lowering the attack surface.
- 💡 **One kernel growing multiple execution shells: behavior from one source, isolation divided.** The decision logic exists in exactly one place (maintainable, migratable), while "execution environment and isolation mechanism" are delegated by scenario — the general paradigm of "one brain, multiple deployment forms."
- 💡 **Keep the "holding credentials" window and the "running untrusted code" window physically non-overlapping.** Two-phase secrets (available during setup, removed before the agent phase) is a transferable security pattern: minimizing the exposure window of sensitive material beats auditing after the fact.

## 🎯 Quick Quiz

<Quiz
  question="What does Codex use to describe how much latitude an agent has?"
  :options="['A one-dimensional dial, from suggest to full-auto', 'Two orthogonal axes: sandbox mode and approval policy', 'Only the raw capability of the model itself']"
  :answer="1"
  explanation="Codex splits it into two orthogonal axes: sandbox_mode governs the physical range of action, approval_policy governs when to stop and ask. Orthogonal combinations replace the old one-dimensional preset dial — clearer, but with a higher cognitive load."
/>

<Quiz
  question="When you delegate a task to Codex Cloud, what is the network and secret state during the agent phase?"
  :options="['Network and secrets available throughout, most convenient', 'The agent phase is offline by default with secrets removed; network/secrets must be pre-staged during setup', 'It can go online once approval is granted']"
  :answer="1"
  explanation="The cloud is two-phase: the setup phase has network and secrets to install dependencies; switching to the agent phase cuts the network and wipes secrets, so the window that runs untrusted generated code and the window that holds credentials physically don't overlap — shrinking the exfiltration surface of prompt injection."
/>

---

## 14. References & Further Reading

> This template is distilled from OpenAI Codex's **official open-source repo** and **official docs**. To go deeper, read the `codex-rs` source directly, or cross-check the sandbox and cloud mechanisms item by item against the official docs.

**🔧 Open-source prototype (read the code directly):**
- [openai/codex](https://github.com/openai/codex) — Codex's official repo (`codex-rs`, the Rust rewrite): the `core` kernel, the `tui` full-screen terminal, the `exec` headless runner, the `cli` aggregate entry point, and the `linux-sandbox` standalone helper binary all live here — the most direct code evidence for this template's "shared kernel + two forms + kernel-level sandbox."

**📖 Official docs:**
- [Codex CLI docs](https://developers.openai.com/codex/cli) — the local form: terminal pairing, configuration, `codex exec` headless usage.
- [Codex Cloud](https://developers.openai.com/codex/cloud) — the cloud form: asynchronous tasks, isolated containers, GitHub-bound PRs.
- [Cloud environment lifecycle](https://developers.openai.com/codex/cloud/environments) — the authoritative account of container / checkout / setup & maintenance / ≤12h cache / two-phase network and secrets.
- [Approvals & security](https://developers.openai.com/codex/agent-approvals-security) — the three approval tiers, `auto_review` self-review, two-phase secrets.
- [Sandboxing concepts](https://developers.openai.com/codex/concepts/sandboxing) — Seatbelt / bubblewrap / WSL2, the three sandbox modes, and the two-axis model of "decoupling sandbox from approval."
- [The AGENTS.md open standard](https://agents.md/) — the spec for nearest-wins, project-level agent instructions.

**🔗 In-repo further reading:**
- The sibling [Claude Code](../claude-code/README.md) — another coding agent's answer; read side by side for the similarities and differences in permission and execution models.
- [AI Agent / Workflow Platform](../ai-agent-platform/README.md) — the larger lineage Codex belongs to: action loop, tools, memory, controllability.
- [AI Chat Product](../ai-chat-product/README.md) — a contrast with the starting point, from "you ask, I answer" to "autonomous action."
- [Ten Core Architecture Patterns](../../tutorial/04-十大核心架构模式.md), [Quality Attributes & Trade-offs](../../tutorial/06-质量属性与取舍.md) — the general patterns and quality trade-offs behind sandboxing, isolation, and control.

---

> 📌 Remember Codex in one line: **one kernel, two shells — pair locally in real time, open a PR asynchronously in the cloud; it uses two orthogonal axes (sandbox × approval), not a one-dimensional dial, to land precisely between "autonomous execution" and "control," and entrusts isolation to layers below the application — the OS kernel and managed containers.**
