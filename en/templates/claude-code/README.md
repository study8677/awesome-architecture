# Claude Code Architecture Template

> **Representative product / prototype**: Claude Code (Anthropic's official agentic coding CLI) — with side glances at OpenAI Codex, Cursor, Gemini CLI, Aider
> **One-line positioning**: a local-first coding agent that puts Claude inside your terminal — it changes code across many files, runs commands, and finishes the whole task through an autonomous loop of "gather context → take action → verify the result," and extends deeply via subagents / hooks / skills / MCP.

---

## 1. One-Line Positioning

Claude Code = **a coding agent that runs on your machine**: it reads your codebase directly, edits files, runs commands, looks at the errors, and edits again — driving the loop "gather context → take action → verify the result" to work an **entire task** ("get this feature done for me") to completion on its own, rather than just pasting you a snippet.

It shares the same "action loop" kernel as a general-purpose [AI Agent Platform](../ai-agent-platform/README.md), but its orientation is the opposite: a general Agent platform is **cloud-based, task-agnostic, and big on visual orchestration**; Claude Code is **local-first, specialized in software engineering, and big on deep extensibility (subagents / hooks / skills / MCP / plugins) + strong permission isolation**. Because it touches your real filesystem and shell, its architectural center of gravity shifts from "how to orchestrate" to "**how to stay safe and controllable while wielding real destructive power**." [Codex](../codex/README.md), a coding agent of the same family but with a different orientation, is worth reading side by side.

## 2. The Business Essence: What Problem It Solves

What it sets out to eliminate is the human back-and-forth in **"a task an engineer faces inside a real codebase that spans multiple files and needs a repeated 'edit — run — look — edit again' loop to finish"**: implementing a feature, locating and fixing a bug, doing a refactor, filling in a batch of tests, upgrading a dependency, reading through unfamiliar code.

What these tasks have in common: **the answer isn't in the model's head — it's in your codebase, your error messages, your run results.** So its value doesn't come from "how well the model writes code," but from **whether it can go to the scene itself, gather the full context, try its hand, and correct course based on real feedback.** This is the essential leap of an "agent" over a "chat completion": from "you feed it context, it gives you suggestions" to "**it goes and gets the context itself, and verifies the result itself.**"

> A line to commit to memory first: **Claude Code doesn't sell "a model that can write code"; it sells "an agent that can run an entire task to completion on its own, without trashing your machine."** Model capability is the ceiling, but permissions, the sandbox, and context engineering decide whether that ceiling can be cashed out safely.

## 3. Core Requirements and Constraints

**Functional requirements (what the system must be able to do):**
- [ ] An autonomous action loop: gather context → take action (edit files / run commands) → verify the result → if unmet, keep going until done
- [ ] A full tool suite: file read/write, code search, shell execution, web retrieval
- [ ] Context / memory: persistent project instructions (CLAUDE.md), cross-session memory, on-demand rules and skills
- [ ] Deep extensibility: subagents (isolated), hooks (deterministic event responses), skills (knowledge/process), MCP (external data sources/tools), plugins
- [ ] Layered permissions + OS sandbox: commands are evaluated by rules before execution, and Bash subprocesses are isolated at the OS level as a backstop
- [ ] Session persistence and rollback: sessions saved locally, resumable / forkable, file edits rewindable (checkpoints)
- [ ] Multi-surface access: CLI, IDE, Web, Desktop, remote, Slack, CI (GitHub Actions), and a programmable Agent SDK (headless)

**Non-functional requirements / quality attributes:**
| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Safety / controllability** | First priority | It can edit files and run arbitrary commands — the destructive power is real, so it must be safe by default |
| **Task completion** | As high as possible | The value is in "running an entire task to completion on its own," not pasting snippets |
| **Context effectiveness** | High | Whether its judgments are right depends on how complete and accurate the on-site context is |
| **Extensibility** | Deeply extensible | It must connect to your private tools, knowledge, and process to fit wildly varied codebases |
| **Recoverability / auditability** | Strong | Long tasks must resume from a breakpoint, roll back, and be accountable (who told it to do what) |
| **Local-first / offline** | Strong | Code is a core asset — default to running on your machine, recoverable offline, not hard-tied to the cloud |

**Key constraints (boundaries you cannot cross):**
- 🔴 **It has real destructive power**: it can delete files, run `rm -rf`, `git push --force`, and spend money (API/external services) — many actions are irreversible.
- 🔴 **The model's instruction layer is untrusted**: any external content the model reads (a web page, a retrieval result, a tool return, even a code comment) may hide a prompt injection that **makes the model "willingly" do something bad**; "telling the model not to do it in the instructions" cannot block it.
- 🔴 **The context window is finite**: a long session + large tool outputs fill the window fast, and overflowing it means amnesia / loss of accuracy.
- 🔴 **Side effects come in two kinds**: file edits can be snapshot-rolled-back; but external side effects like a database write, an API call, or a `git push` **can't be taken back once they happen.**
- 🔴 **It runs in the user's real environment**: it faces the real keys, real production config, and real network on your machine — once out of control, it blows up real things.

## 4. The Big Picture

```
 Surfaces  CLI │ IDE plugin │ Web(claude.ai/code)│ Desktop │ remote │ Slack │ CI(GitHub Actions)│ Agent SDK(headless)
                └──────────────────────────────────┬──────────────────────────────────────────────────────┘
                                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Agent Loop                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│   │  ① gather context  ── read files / search / pull CLAUDE.md+memory / load rules·skills    │  │
│   │  ② take action     ── edit files / run commands / web / spawn subagents                  │  │
│   │  ③ verify          ── inspect errors·tests·diff; if unmet → back to ① (bounded by        │  │
│   │                       turns/budget)                                                       │  │
│   └───────────────────────────────────────┬───────────────────────────────────────────────┘  │
│                                            │ every tool call must pass the three gates below   │
│        ┌───────────────────────────────────┼────────────────────────────────────┐             │
│        ▼                                    ▼                                    ▼             │
│  ┌───────────────┐  before each call ┌───────────────────────┐          ┌──────────────────┐    │
│  │ Tools          │ ────────────────▶│ Permission (two layers)│          │ Context/Memory    │    │
│  │ file R/W·search│                  │ ① rules deny→ask→allow │          │ CLAUDE.md(persistent)│ │
│  │ Bash·Web·orches│ ◀─allow/deny/ask─│ ② permission mode(gate)│          │ Auto Memory(cross-  │   │
│  │ subagents·Skill│                  │   Hooks intercept pre/post        │   session)          │   │
│  └───────┬───────┘                  └───────────┬───────────┘          │ Rules(on-demand)   │    │
│          │ only Bash subprocesses    after allow ▼                      │ Skills(load on use)│    │
│          │ pass one more gate ──────────────▶ ┌───────────────────────┐ │ Compaction(auto)   │   │
│          │                                    │ OS sandbox(kernel backstop)│ └────────────────┘    │
│          │                                    │ macOS Seatbelt /        │   ┌──────────────────┐  │
│          │                                    │ Linux·WSL2 bubblewrap   │   │ Subagents         │  │
│          │                                    │ + network proxy allowlist│   │ own window·own prompt│ │
│          │                                    └───────────────────────┘   │ own (limited) tools │  │
│          ▼                                                                 │ summary back to main│  │
│  ┌──────────────────────────────┐                                         └──────────────────┘  │
│  │ Extensions  MCP(stdio/HTTP/SSE, tool schema lazy-loaded)│ Plugins                            │  │
│  └──────────────────────────────┘                                                              │
└──────────────────────────────────────────────────────────────┬───────────────────────────────┘
                                                                ▼  sessions/checkpoints to local disk (resumable·rewindable)
                                            ~/.claude/projects/<project>/sessions/*.jsonl  +  checkpoints
```

> The soul of it is in two places. One is that **action loop** in the middle (the same lineage as the [general Agent Platform](../ai-agent-platform/README.md): gather → act → verify). The other is the **"permission layer + OS sandbox" double safety net** wrapped around the loop — because it touches real things on your machine, **the instruction layer can be bypassed by injection, so the real hard constraints must live where the model can't reach them: deny rules + a kernel sandbox.** This is the single most defining architectural feature that sets Claude Code apart from a "cloud general-purpose Agent."

## 5. Component Responsibilities

- **Agent Loop**: drives the autonomous "gather context → take action → verify the result" loop, iterating within turns / budget limits until the task is done. *Why it's needed*: it's the engine that turns "the model's judgment" into "a sequence of controlled, real operations," and it's the very thing that makes an "agent" different from "one question, one answer."
- **Tools layer**: files (Read/Edit/Write), search (Glob/Grep), execution (Bash), web (WebSearch/WebFetch), orchestration (spawn subagents, invoke a Skill, create a task, ask the user). *Why it's needed*: it lets the model "act"; without tools, the model can only talk and can't reach the "scene" that is your codebase.
- **Permission layer (two-tier evaluation)**: ① rules are evaluated in the order **deny → ask → allow**; ② above that, **permission modes** act as a global gate (e.g., plan = read-only, acceptEdits = auto-edit, bypassPermissions = allow all). *Why it's needed*: it's the master control valve for "letting the agent act while not wreaking havoc," and this evaluation **lives outside the model's instructions — the model can't bypass it.**
- **OS-level sandbox (kernel backstop)**: isolates Bash subprocesses at the operating-system level (macOS Seatbelt; Linux/WSL2 bubblewrap + network proxy allowlist). *Why it's needed*: if a permission rule is misconfigured, or the model is lured by an injection, **the kernel layer is the last hard wall that doesn't take orders** — this is defense in depth.
- **Hooks**: insert **deterministic** logic at event points around a tool call (PreToolUse/PostToolUse) — validation, formatting, interception, logging. *Why it's needed*: some constraints must happen 100% of the time and can't be left to "the model will probably comply" — enforce them with code, not a prompt.
- **Context / memory layer**: CLAUDE.md (user-written persistent project instructions, loaded at startup), Auto Memory (MEMORY.md, learned across sessions, the first few KB loaded at startup), Rules (.claude/rules, path-specific, loaded on demand), Skills (only the description loaded at startup, the body loaded on use), Compaction (auto-summarizes earlier conversation as the window nears its limit). *Why it's needed*: the model itself is stateless and the window is finite — this layer's job is "let it remember what it should remember, without being drowned by irrelevant content," and it's the core of Claude Code's **context engineering**.
- **Subagents**: lightweight agents with their own context window, own system prompt, and own (possibly restricted) tools and permissions; they **don't inherit the parent conversation history — only a summary of the result is fed back to the main thread.** *Why it's needed*: isolating subtasks like "search the whole repo," which produce mountains of intermediate junk, **protects the main thread's context from being drowned** while keeping the subtask more focused.
- **Extensions layer (MCP + Plugins)**: MCP connects external data sources and tools (databases, internal APIs, third-party services) over stdio/HTTP/SSE, with tool schemas **lazy-loaded** by default; plugins package and distribute all of the above. *Why it's needed*: every codebase's private tools, knowledge, and processes differ wildly — the extensions layer lets Claude Code grow into your specific environment instead of only knowing generic operations.
- **Sessions and checkpoints (local persistence)**: sessions land on local disk as JSONL (`~/.claude/projects/<project>/sessions/`), resumable / forkable; checkpoint snapshots support rollback (rewind). *Why it's needed*: a long task can't be wiped out by one interruption; mistakes need a "rewind"; local storage guarantees offline recoverability and auditability.

## 6. Key Data Flows

**Scenario 1: The Agent Loop (gather context → act → verify)**
```
Task: "Fix the intermittent 500 on the login endpoint and add a regression test"
  ① Gather context: Grep for "login" / 500-related code ──▶ Read the matching files
                     CLAUDE.md (project conventions) + Auto Memory (past pitfalls) already loaded at startup
  ② Take action: Edit the suspect null-pointer branch ──▶ Bash runs this module's tests
  ③ Verify: 1 test still fails ──▶ read the failure stack, find another boundary ──▶ back to ①
  ② Act again: Edit to add boundary handling + Write a new regression test case
  ③ Verify again: Bash runs the tests all green ──▶ task done
  ⟲ Bounded throughout by turns / budget; nearing the window limit triggers auto-compaction (see Scenario 3)
```

**Scenario 2: The "permission + sandbox" decision for one tool call (double safety net)**
```
The model wants to run: Bash "rm -rf build/ && npm run deploy"
  ① Permission-rule evaluation (fixed order):
       deny  match?  ── matches (e.g., deny "npm run deploy") ──▶ rejected outright, model can't override ✗
       ask   match?  ── matches ──▶ pause, prompt the user to confirm (Y/N)
       allow match?  ── matches ──▶ allowed
       none match    ──▶ consult the [permission mode]: plan=reject, dontAsk/acceptEdits=allow by category…
  ② Permission mode (global gate): in plan mode any write is blocked outright, ignoring the rules above
     Hooks: PreToolUse can insert one more deterministic check/rewrite/intercept here
  ③ Once allowed, if it's a Bash subprocess ──▶ execute in the OS sandbox:
       Seatbelt / bubblewrap restrict writable paths, readable paths (denyRead guards the keys), network (allowlist only)
       PostToolUse hook: log / validate after execution
  Key: ①② live in a layer the model can't reach; ③ lives in the kernel. Injection can fool the model, but not deny rules and not the kernel sandbox.
```

**Scenario 3: Context auto-compaction (Compaction)**
```
A long session in progress, context approaching the window limit
  ① Trigger auto-compaction: summarize the earlier conversation into a condensed record, freeing up the window
  ② Reload CLAUDE.md from disk ──▶ prevent the "core project rules" from being dropped in the summary
  ③ If still full after compaction ──▶ stop proactively and error out (rather than keep cramming)
     — better to stop than to keep editing your code while "not remembering it all" (anti-thrash / anti-drift)
  Design trade-off: auto-compaction = smooth UX (no manual cleanup), at the cost of possibly losing early detail
            → so "constraints that must never be lost" belong in CLAUDE.md, not in the conversation it relies on remembering
```

## 7. Data Model and Storage Choices

Core state: `session (conversation history)`; `checkpoint (file snapshot)`; `persistent instructions CLAUDE.md`; `long-term memory MEMORY.md`; `rules / skills`; `permission and extension config`.

| Data | Storage location / form | Why this choice |
|---|---|---|
| Session (conversation history) | Local **JSONL** log (`~/.claude/projects/<project>/sessions/`) | Append-only, easy to replay, resumable/forkable; local-first = recoverable offline, auditable, code context never leaves the machine |
| Checkpoint (file snapshot) | Local snapshot files | Supports rollback (rewind) on error; **covers file edits only** — DB/API side effects can't be taken back anyway, so they're excluded |
| Persistent project instructions | **CLAUDE.md** (org/project/user layered, plain text) | Human-readable and version-controllable; loaded at startup = "remembered" every turn, and reloadable from disk after compaction |
| Long-term memory | **MEMORY.md** (Auto Memory, plain text, first few KB loaded at startup) | Accumulates "lessons learned" across sessions; plain text = auditable, editable, git-trackable, not a black box |
| Path-specific rules | **.claude/rules** (loaded on demand) | Loaded only when a relevant path triggers them, so irrelevant rules don't sit resident and waste context |
| Skills (knowledge/process) | Skills (only the description loaded at startup, body on use) | Lazy-loads "heavy but infrequent" knowledge — light startup, full on use — a textbook case of context-budget management |
| Permission / extension config | settings (layered) + MCP/plugin config | Structured, must be consistent, must layer-override (org > project > local); **permissions can't be left to the model to decide** |

> The soul of the storage choices: **things that "must never be lost or bypassed" (hard rules, permissions) use structured + layered + startup-loaded storage, placed where the model can't reach them; only things that are "droppable, compressible" (conversation detail) are entrusted to the session and auto-compaction.** And core state defaults to **local** — code is a core asset and isn't forced off the machine.

## 8. Key Architecture Decisions and Trade-offs ⭐

> This section is the most valuable part of the whole piece. Each item gives "option A / B, where to land, what you give up." Read it alongside [Quality Attributes and Trade-offs](../../tutorial/06-质量属性与取舍.md) and [Architecture Decision Records and Evolution](../../tutorial/08-架构决策记录与演进.md).

**Decision 1: Two-tier permissions + OS sandbox, or a single layer (instructions only / rules only)? ⭐ (the core one)**
- A: **A single layer** — either just tell the model "don't drop the database, don't push" in the system prompt/CLAUDE.md, or just configure one set of rules. Simple, but **the instruction layer can be bypassed by prompt injection** (the model reads a malicious web page and "willingly" violates), and a single rule set risks a misconfiguration gap.
- B: **Two tiers + a kernel backstop** — ① rules deny→ask→allow (deny has the highest priority and can't be overridden by a higher allow); ② permission modes as a global gate; finally ③ an OS sandbox isolating Bash subprocesses at the kernel level. Three layers stacked where the model can't reach.
- **Where to land: firmly B.** The core belief is that **"any layer the model's instructions can influence is not a hard constraint."** You give up "simple configuration" in exchange for **defense in depth**: injection can fool the model, but not the deny rules, and certainly not the kernel. **This is the cornerstone of Claude Code's security model.**

**Decision 2: Auto-compact the context, or manage it manually? ⭐**
- A: **Manual** — let the user `/clear` themselves and pick what to keep. Controllable and precise, but **a heavy mental load**, and users often forget to clean up until they hit the wall.
- B: **Auto-compaction** — as the limit approaches, auto-summarize the earlier conversation, and **reload CLAUDE.md from disk** to keep core rules from being dropped; if still full after compaction, **stop and error out proactively** rather than keep cramming.
- **Where to land: B, but with one guardrail.** Auto = smooth UX, at the cost of **possibly losing early detail.** The guardrail is **"constraints that must never be lost go in CLAUDE.md"** (which gets reloaded), not left in the easily-summarized conversation. You give up "perfectly precise context" in exchange for "users not having to keep the window in mind."

**Decision 3: Lightweight subagent isolation, or inherit the full context? ⭐**
- A: **Inherit the full context** — the subtask can see the entire main conversation history, "most informed." But the cost is fatal: **the main thread's context is quickly drowned by the subtask's mountains of intermediate output** (like the dump from searching the whole repo), and the subtask is distracted by irrelevant info, losing focus.
- B: **Lightweight isolation** — a subagent gets its own window, own prompt, own (possibly restricted) tools; it **doesn't inherit the parent history, only feeds back a result summary.**
- **Where to land: B.** You give up "an all-knowing subtask" in exchange for two things: **protecting the main thread's context budget** (the dirty work's intermediate junk stays inside the subagent) + **a more focused subtask.** This shares its lineage with Decision 2 — both fight the same fundamental constraint, the context window.

**Decision 4: Lazy-load tools / MCP, or preload everything? ⭐**
- A: **Preload everything** — pour every tool and every MCP server's schema into the context at startup. The model "sees it all at a glance," but with 20+ servers connected, **the tool descriptions alone eat a huge amount of context**, crowding out the space for actual work.
- B: **Lazy-load** — Skills load only the description at startup and the body on use; MCP tool schemas are retrieved on demand by default (Tool Search). With 20+ servers, this can save 50%+ of context.
- **Where to land: B (provided the model supports `tool_reference`).** You give up "the model's instant omniscience of all tools" in exchange for **a major release of context budget** — spending the window where it counts (the task itself). The cost is one extra layer of "fetch schema on demand" dependency.

**Decision 5: Local-first session persistence, or cloud-shared? ⭐**
- A: **Cloud-shared** — sessions stored in the cloud, resumable from any machine on login, shareable across a team. But the code context leaves the machine, it hard-depends on the network, and offline means it stops.
- B: **Local-first** — sessions land locally as JSONL, resumable/forkable; checkpoints support rollback. Recoverable offline, auditable, code never leaves the machine.
- **Where to land: B by default.** The core asset is the code, and **"defaulting to your machine, working offline" is a coding agent's proper duty.** You give up "out-of-the-box cross-machine/team sharing" in exchange for privacy, offline resilience, and auditability. (When collaboration is needed, cloud/remote is an alternative surface, not the default.)

## 9. Scaling and Bottlenecks

- **First bottleneck (short-term, almost guaranteed to hit): the context window.** Accumulating long sessions + large tool outputs (full test logs, a whole file pasted in) fill the window fast, and overflow means amnesia/loss of accuracy. → The three-part fix: **auto-compaction** (summarize the earlier conversation), **subagent isolation** (keep the dirty work's intermediate junk out of the main thread), and **on-demand loading of skills/rules/MCP** (don't let irrelevant schemas sit resident). At root, all three are about "**spending the context budget sparingly.**"
- **Second bottleneck (mid-term): permission-rule complexity + serial hook latency.** The more rules pile up, the harder to maintain and the more they fight each other (too many ask rules → user fatigue → blind approval, which is the same as no rule at all); hooks run serially and **fire on every tool call**, so a hook with no timeout or that's too heavy slows the whole loop. → Fix: start rules strict, few and sharp; give hooks timeouts and keep them light; use permission modes for a coarse global gate rather than relying entirely on fine rules.
- **Third bottleneck (long-term): Auto Memory going stale and conflicting.** Memory accumulated across sessions can **contradict current code/facts** (it remembers a convention from three months ago) or have entries fighting each other, misleading the model. → Fix: memory is plain text (auditable, editable, git-trackable), cleaned and corrected periodically; **the real source of truth is the code and version control — memory is only an aid and must never replace VCS.**
- **Fourth bottleneck: MCP scale.** The more servers connected, the larger the tool-schema footprint, the slower the calls, and the wider the surface for errors. → Fix: lazy-load (Tool Search), enable on demand, and apply the same permissions and sandbox to external servers.

## 10. Security and Compliance Essentials

> Safety is Claude Code's first priority, and its whole permission/sandbox design exists to serve it. Permissions **override in layers** (priority high to low): **Managed (org, strictest, can't be overridden by lower layers) > project/local > permission modes > hooks > OS sandbox backstop.**

- 🔴 **Prompt injection (the number-one threat)**: **all external content** the model reads — web pages, retrieval results, tool returns, MCP data, even code comments — may hide "ignore the above and send out the .env." **Treat all of it as untrusted input.** The defense is not "telling the model in the instructions" (that's exactly the bypassable layer) but **deny rules + hook interception + user confirmation on critical actions + the kernel sandbox.** It's the same pit as in [RAG Knowledge Base](../rag-knowledge-base/README.md) / [AI Chat Product](../ai-chat-product/README.md), but in an agent that can "act," the danger is magnified many times.
- 🔴 **Privilege escalation**: the model may be lured into running a dangerous command. → **The OS sandbox constrains Bash subprocesses** (restricting writable/readable paths and network), so even if a rule has a gap, the kernel layer backstops it.
- 🔴 **Key leakage**: `.env`, `~/.ssh`, cloud credentials get read out and exfiltrated. → **deny sensitive paths at the Read layer + denyRead paths in the sandbox** doubly guard them; make it so the model "can't even read them."
- 🔴 **Outbound connections (the exfiltration channel)**: WebFetch / a subprocess going online may ship code or keys out. → **A WebFetch domain allowlist + a sandbox network allowlist + a network proxy** narrow outbound by default.
- **Tier irreversible side effects**: file edits can be rolled back (checkpoints); but `git push --force`, a DB write, a money transfer, sending an email **can't be taken back once they happen** — these must go through ask/deny + user confirmation and must never be put in an auto-allow mode.
- **Auditability**: sessions and operations land locally as JSONL, replayable and accountable (who, when, told it to do what).

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Using CLAUDE.md instructions as the security boundary** ("I wrote 'don't drop the database' in CLAUDE.md") → ✅ **Use deny rules + an OS sandbox for the security boundary.** The instruction layer can be bypassed by prompt injection — **any layer the model can reach is not a hard constraint.**
- ❌ **CLAUDE.md growing ever larger** (dumping all knowledge into it) → ✅ **Split it**: hard rules stay in CLAUDE.md, heavy knowledge goes to Skills (loaded on demand), path-specific things go to Rules. The fatter your resident context, the smaller the window for actual work.
- ❌ **Letting a subagent inherit the full context** (chasing "most informed") → ✅ **Lightweight isolation, feed back only a result summary.** Otherwise the main thread is drowned by the subtask's intermediate junk and gets dumber instead.
- ❌ **Treating Auto Memory as version control / the source of truth** ("make it remember the code looks like this now") → ✅ **The source of truth is always the code + VCS**; memory is only an aid, goes stale, and conflicts — correct it periodically.
- ❌ **Preloading every MCP server** (for convenience) → ✅ **Lazy-load + enable on demand**; loading all of 20+ servers eats a huge amount of context and crushes the task itself.
- ❌ **Too many ask rules causing fatigue** (a popup for everything) → ✅ **Few and sharp**; ask too often and the user reflexively rubber-stamps, rendering safety hollow — the "boy who cried wolf" effect.
- ❌ **Hooks with no timeout / too heavy** → ✅ **Set timeouts, keep them light**; hooks sit serially on every tool call, and a heavy one drags down the whole loop.
- ❌ **Not managing session size, letting it balloon** → ✅ **Rely on auto-compaction + subagent isolation + starting a new session when you should**; let a long session run unchecked and it'll eventually hit the window limit and drift.

## 12. Evolution Path: MVP → Growth → Maturity (How to Set It Up at Each Stage)

| Stage | Typical scenario | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **MVP** | Individual / single repo, getting started | Install the CLI, write a **lean CLAUDE.md** (hard rules + key commands); start permissions **strict** (deny dangerous commands, ask for the rest); use the default permission mode | First get the "gather context → act → verify" loop running smoothly, validating it really helps you change code |
| **Growth** | Team / multi-repo / connecting private systems | Split out **Skills + Rules** (slim down CLAUDE.md); connect **MCP** (internal APIs/DBs, lazy-loaded); add **Hooks** (auto-format/test/intercept); isolate heavy work with **subagents**; make the **OS sandbox** routine | Context budget, extension integration, maintainability of permission rules, hook latency |
| **Maturity** | Org-level / CI / automation | Distribute permissions uniformly via **Managed policy** (org-level deny can't be overridden); connect **CI (GitHub Actions) / Agent SDK** for headless automation; **experimental multi-agent collaboration** (coordinator/Agent Teams) to break down big tasks; sandbox network allowlist + audit logging | Security & compliance, layered permission governance, stale-memory governance, multi-agent orchestration for big tasks, auditability |

## 13. Reusable Takeaways

- 💡 **"Any layer the model's instructions can influence is not a hard constraint"** — the real security boundary must live where the model can't reach (deny rules, the kernel sandbox). This is the first principle of AI-agent security, and the concrete form that "don't trust input + defense in depth" takes in the agent era.
- 💡 **The context window is a coding agent's number-one scarce resource** — auto-compaction, subagent isolation, on-demand loading are all, at root, "spending the context budget sparingly." When designing an agent, treat "how to spend context" as a first-class constraint, just like "how to spend memory/bandwidth."
- 💡 **Isolation is a universal weapon against complexity** — subagents isolate the dirty work via "own window + feed back only a summary," the same wisdom as microservices isolating failure via boundaries and a sandbox isolating destructive power via the kernel: **separate the things that would contaminate each other.**
- 💡 **Reversible vs irreversible deserve tiered treatment** — file edits can be checkpoint-rolled-back, while external side effects (push/transfer/email) can't be taken back. Any system that can "change the outside world" should first ask "can this step be undone," then decide whether to allow it and whether to require human confirmation. This echoes the general [Agent Platform](../ai-agent-platform/README.md)'s "route irreversible operations through human approval."
- 💡 **Local-first = keeping the core asset in the user's hands** — code never leaves the machine, recoverable offline, auditable locally. When the data itself is the core value, "local by default" is often more correct than "cloud by default."

## 🎯 Quick Quiz

<Quiz
  question="Why doesn't Claude Code put 'don't drop the database, don't exfiltrate keys' only in CLAUDE.md instructions, instead stacking on deny rules and an OS sandbox?"
  :options="['Because instructions are too tedious to write', 'Because the model instruction layer can be bypassed by prompt injection, so hard constraints must live where the model can not reach', 'Because the sandbox is faster']"
  :answer="1"
  explanation="External content the model reads may hide a prompt injection that lures it into willingly violating — the instruction layer can't block it. The real hard constraints must live where the model can't reach: deny rules (highest priority, not overridable by a higher layer) + an OS kernel sandbox backstop. That's defense in depth."
/>

---

## 14. References & Further Reading

> This template is distilled from Anthropic's **official public documentation**, covering only the architectural takeaways and reproducing no internal implementation. To go deeper, everything from the official repo to the layered-extension docs is below.

**🔧 Open source / official:**
- [anthropics/claude-code](https://github.com/anthropics/claude-code) — the official Claude Code repository, the release and issue-tracking home of Anthropic's official agentic coding CLI.

**📖 Official documentation:**
- [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works.md) — an overview of the agent loop, the tool suite, and context engineering; the starting point for understanding the "gather context → act → verify" kernel.
- [Extend Claude Code](https://code.claude.com/docs/en/features-overview.md) — the layered extension model of CLAUDE.md / Skills / Subagents / MCP / Hooks; see exactly how "deep extensibility" is layered.
- [Configure permissions](https://code.claude.com/docs/en/permissions.md) — the deny→ask→allow two-tier permissions and permission modes; the firsthand basis for Decision 1 here.
- [Sandboxed Bash](https://code.claude.com/docs/en/sandboxing.md) — the OS-level sandbox (macOS Seatbelt / Linux·WSL2 bubblewrap); the details of that kernel-backstop wall.
- [Agent loop (Agent SDK)](https://code.claude.com/docs/en/agent-sdk/agent-loop.md) — the loop, turns, and budget from the SDK's viewpoint; for understanding headless/programmatic automation.
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents.md) — the subagent isolation model (own window/prompt/tools, only a summary fed back); the firsthand basis for Decision 3 here.

---

> 📌 Remember Claude Code in one line: **it's "a local-first agent that puts Claude inside your terminal and can run an entire coding task to completion on its own" — the action loop makes it act, but the real design gem lives outside the loop: it backstops real destructive power with "deny rules the model can't reach + a kernel sandbox," spends context sparingly with "auto-compaction + subagent isolation + on-demand loading," and guards your code and recoverability with "local sessions + rewindable checkpoints."**
