# AI Agent / Workflow Platform Architecture Template

> **Representative products / prototypes**: Dify, Coze, LangGraph, LangChain, AutoGPT, CrewAI
> **One-line positioning**: let the large model do more than just "answer" — let it "plan → call a tool → observe the result → decide again," completing tasks autonomously over multiple steps; the platform handles orchestration, memory, tool integration, and controllability.

---

## 1. One-Line Positioning

An Agent platform = **bolting "hands and feet (tools) + memory + an action loop" onto a large model**, turning it from "can talk" into "can do."

What sets it apart from an [AI Chat Product](https://github.com/study8677/awesome-architecture/blob/main/templates/ai-chat-product/README.md) is "autonomy": a chat product is basically "you ask, I answer"; an Agent **decides for itself what to do next** — look something up, call an API, run code, and then decide the next step based on the result, round after round until the task is done. The platform's core job is to make this autonomous behavior **orchestratable, memory-capable, controllable, and observable**.

## 2. The Business Essence: What Problem It Solves

What it sets out to automate are **tasks that require "multi-step reasoning + tool use" to complete**: producing a research report, handling a customer-service ticket end to end, writing and debugging a piece of code, running a business process to completion.

What these tasks have in common: **they can't be settled in one question and one answer; they need an intermediate loop of "do something + see the feedback + adjust."** What an Agent platform sells is exactly "**automating this kind of complex, multi-step task**."

> Anthropic's key insight is worth committing to memory up front: **if a deterministic workflow can solve it, don't reach for an autonomous Agent.** Workflows are predictable, controllable, and cheap; Agents are flexible, but more expensive, slower, and less controllable. This shares its lineage with the line from [Architecture Patterns](https://github.com/study8677/awesome-architecture/blob/main/tutorial/04-十大核心架构模式.md): "if you can avoid using it, don't."

## 3. Core Requirements and Constraints

**Functional requirements:**
- [ ] Tool / function calling (let the model invoke external capabilities)
- [ ] Multi-step planning and an action loop (plan → act → observe → repeat)
- [ ] Memory: short-term (this session's context) + long-term (across sessions, often via vector retrieval)
- [ ] Workflow orchestration (solidify the deterministic steps)
- [ ] Human-in-the-loop: let a human approve the critical steps
- [ ] Observability: what each step is doing, traceable and debuggable

**Non-functional requirements / quality attributes:**
| Quality Attribute | Target | Why It Matters for This Kind of System |
|---|---|---|
| **Task success rate** | As high as possible | The Agent's fundamental value |
| **Controllable / predictable** | High | The more autonomous, the harder to control — you need a fallback |
| **Cost** | Controllable | Multi-step = multiple model calls; cost accumulates with the number of steps |
| **Observability** | Traceable throughout | A multi-step black box is brutal to debug; tracing is non-negotiable |
| **Safety** | Mandatory | Tools can "change the world" — they have side effects |

**Key constraints (boundaries you cannot cross):**
- 🔴 **The model makes mistakes and goes off the rails**: the loop may not converge (spinning in place, infinite loops).
- 🔴 **Tool calls have side effects**: send an email, modify data, spend money — many actions are irreversible.
- 🔴 **Cost grows linearly with steps**: a dozen-step task is a dozen LLM calls.
- 🔴 **Multi-step accumulates error**: get one step wrong and it drifts further off with each step.
- 🔴 **Unpredictable**: the same task can take different paths on two runs.

## 4. The Big Picture

```
   User task: "Research competitor pricing and put it in a table"
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  Orchestrator                                                  │
│   ┌──────────────────── Action loop ─────────────────────┐    │
│   │  ① Model plans: what's the next step?                  │    │
│   │  ② Call a tool (search / code / API…) — run in sandbox │    │
│   │  ③ Observe the result, feed it back to the model       │    │
│   │  ④ Not done? Back to ① (bounded by [step / cost /      │    │
│   │     timeout limits])                                   │    │
│   └────────────────────────┬───────────────────────────┘    │
│        │                    │                    │            │
│        ▼                    ▼                    ▼            │
│  ┌──────────┐      ┌────────────────┐    ┌──────────────┐    │
│  │ Tool      │      │ Memory          │    │ State /       │    │
│  │ sandbox   │      │ short + long    │    │ checkpoint    │    │
│  │ (isolated │      │ term (vector)   │    │ (long tasks   │    │
│  │  exec)    │      │                 │    │  resumable)   │    │
│  └──────────┘      └────────────────┘    └──────────────┘    │
│                                                               │
│   ⚠ High-risk/irreversible actions ──▶ [human-in-the-loop     │
│      gate], executed only after approval                      │
└──────────────────────────┬───────────────────────────────────┘
                           ▼  full trace written to the observability system
                       Task result
```

> The soul of it is that **action loop** in the middle, and the **control valves** wrapped around it (step / cost / timeout limits, human approval, sandbox). **An Agent loop without control valves is a machine that burns money on its own and may also wreak havoc.**

## 5. Component Responsibilities

- **Orchestrator**: drives the "plan → act → observe" loop, or executes a solidified workflow. *Why it's needed*: it's the hub that turns the model's "ideas" into a "controlled sequence of actions."
- **Tool registry and execution (sandbox)**: registers the available tools and actually executes the operations the model requests in an **isolated environment**. *Why it's needed*: lets the model "do things"; the sandbox exists because executing external code / operations is risky.
- **Memory**: short-term (this round's context) + long-term (across sessions, often retrieved via a [vector store](https://github.com/study8677/awesome-architecture/blob/main/templates/vector-database/README.md)). *Why it's needed*: both multi-step tasks and long-term assistants need to "remember."
- **State / checkpoint**: persists the progress of a long task so it can resume after an interruption. *Why it's needed*: Agent tasks can run a long time and can't be wiped out by a single interruption (durable execution).
- **Human-in-the-loop gate**: pauses before high-risk / irreversible operations to wait for human approval. *Why it's needed*: gives autonomy a "brake a human can press."
- **Observability / trace**: records every step's reasoning, tool calls, and results. *Why it's needed*: a multi-step black box is simply undebuggable without a trace.

## 6. Key Data Flows

**Scenario 1: An autonomous Agent's action loop**
```
Task: "Look up East China region sales last quarter and draw a trend chart"
  ① Model: I need to query the data first ──▶ call the "database query" tool
  ② Sandbox executes ──▶ returns [Q1, Q2, Q3 sales]
  ③ Feed back to model: Model: got the data, now draw the chart ──▶ call the "code execution" tool
  ④ Sandbox runs the plotting code ──▶ returns an image
  ⑤ Model: task complete ──▶ output the result
  ⟲ Bounded throughout by "max 10 steps / max $0.5 / 60s timeout" — exceed it and it stops
```

**Scenario 2: A deterministic workflow (the more controllable choice)**
```
Fixed flow: [receive ticket] → [classify] → [search knowledge base] → [draft reply]
            → [human review] → [send]
  Each step is predefined; the model only makes judgments at certain nodes
  ✓ Predictable, easy to debug, cheap — suited to tasks with a clear process
  (Contrast: an autonomous Agent suits tasks with an uncertain process that need to improvise)
```

## 7. Data Model and Storage Choices

Core entities: `task / session`; `step trace`; `memory`; `tool definitions`; `checkpoint`.

| Data | Storage Type | Why |
|---|---|---|
| Task state / checkpoint | Relational / durable log | Long tasks must be reliable and resumable |
| Long-term memory | Vector store | Retrieve "relevant past" by semantics |
| Step trace | Time-series / logs | Massive, replayable by time, used for debugging and evaluation |
| Tool definitions / config | Relational | Structured, must be consistent |

## 8. Key Architecture Decisions and Trade-offs ⭐

**Decision 1: Deterministic workflow, or autonomous Agent? (the most important judgment) ⭐**
- Workflow: steps are orchestrated in advance; the model only makes limited judgments at nodes. Predictable, cheap, easy to debug — but inflexible.
- Autonomous Agent: the model decides each step itself. Flexible, can handle open-ended tasks — but expensive, slow, uncontrollable.
- **Where to land**: **default to a workflow; reach for an autonomous Agent only when "the task is genuinely open-ended and must improvise."** This is the core of Anthropic's advice to "avoid Agents if you can."

**Decision 2: How does the loop converge / fall back? (the lifeline against losing control) ⭐**
- No limits: the model may spin in place, loop forever, and burn through the budget.
- Set limits: max steps, max cost, timeout, repetition detection.
- **Where to land**: **you must set multiple limits.** The more autonomy, the more you need a hard "brake."

**Decision 3: The safety boundary for tool execution ⭐**
- Give the Agent unlimited permissions: it may delete data by mistake, fire off emails, cause a big mess.
- Sandbox isolation + least privilege + human confirmation for high-risk operations.
- **Where to land**: execute all tools in a sandbox; route irreversible / high-impact operations through human-in-the-loop approval.

**Decision 4: Single Agent, or multi-Agent collaboration?**
- Single Agent: simple, but on complex tasks it has to wear many hats.
- Multi-Agent (e.g., "planner + executor + reviewer"): clear division of labor, but coordination overhead, cost, and latency all rise.
- **Where to land**: start with a single Agent; split into multi-Agent only when the task gets complex enough that "one role can't carry it."

## 9. Scaling and Bottlenecks

- **First bottleneck: cost and latency amplified by step count.** → Fix: use a workflow when you can, limit steps, use a small model for simple subtasks (model routing), and cache.
- **Second bottleneck: state management for long tasks.** → Fix: persist checkpoints, support interrupt-and-resume (durable execution).
- **Third bottleneck: concurrency and isolation of tool execution.** → Fix: a sandbox pool, timeouts, resource quotas.
- **Fourth bottleneck: hard to debug (a multi-step black box).** → Fix: full trace + observability, laying every step out in the open.

## 10. Security and Compliance Essentials

- 🔴 **Tools can "change the world"**: send email, transfer money, modify a database — they must be sandboxed + least-privilege + human-confirmed for irreversible operations.
- 🔴 **Prompt injection is most dangerous inside an Agent**: if a retrieval result / tool return / web page hides "go delete the data," and the Agent has tool permissions, the consequences are severe. Treat all external content as **untrusted input**.
- **Loss-of-control protection**: step / cost / timeout limits to prevent an infinite money-burning loop.
- **Audit**: leave a trail of every step and every tool call, so accountability is traceable.

## 11. Common Pitfalls / Anti-Patterns

- ❌ **Forcing an autonomous Agent where a fixed process would do** → ✅ use a workflow for simple / clear tasks — predictable and cheap.
- ❌ **No limits on the loop** → ✅ multiple fallbacks: step / cost / timeout.
- ❌ **Giving the Agent unlimited tool permissions** → ✅ least privilege + sandbox + human confirmation for high-risk operations.
- ❌ **Trusting the content returned by tools / retrieval** → ✅ treat it as untrusted input, guard hard against injection.
- ❌ **No observability, a fully black-box multi-step run** → ✅ full trace, or you can't debug and optimize.

## 12. Evolution Path: MVP → Growth → Maturity (How to Set It Up at Each Stage)

| Stage | Scale | How to Set It Up (Specifics) | What to Worry About Now |
|---|---|---|---|
| **MVP** | Validation | Use **Dify / Coze** to drag-and-drop a **fixed workflow** or a single Agent + a few tools; set step / cost limits properly | First validate whether "automating this task" is reliable at all |
| **Growth** | At scale | Use custom orchestration like **LangGraph**: add long-term memory, human-in-the-loop, state persistence, trace observability | Success rate, controllability, cost, debuggability |
| **Maturity** | Complex / high-value tasks | Multi-Agent collaboration, durable long tasks, fine-grained permissions and sandboxing, model routing to control cost, continuous success-rate evaluation | Success rate, safety, cost, disaster recovery, evaluation |

## 13. Reusable Takeaways

- 💡 **"If you can be deterministic, don't be autonomous" — predictability is an engineering virtue.** It's the same restraint as "if you can avoid a pattern, don't" and "if a monolith will do, don't go microservices."
- 💡 **Any autonomous loop must have a fallback**: limits, timeouts, circuit breakers. Bolting a brake onto anything you set free is a universal rule of system safety.
- 💡 **Operations with side effects must be controllable + auditable**: sandbox, least privilege, human confirmation, an audit trail — this kit applies to any system that "can change the outside world."
- 💡 **External content is forever untrusted**: an Agent's tool permissions amplify the danger of prompt injection, all the more reason to stay wary.
- 💡 **State persistence makes long processes resumable**: storing progress as checkpoints echoes the operation-log idea in [Collaborative Docs](https://github.com/study8677/awesome-architecture/blob/main/templates/collaborative-doc/README.md).

## 🎯 Quick Quiz

<Quiz
  question="Regarding autonomous Agents, what does the industry (e.g., Anthropic) advise?"
  :options="['Use an autonomous Agent wherever you can — the more autonomous, the more advanced', 'If a deterministic workflow can solve it, do not reach for an autonomous Agent', 'The higher the complexity, the better']"
  :answer="1"
  explanation="Workflows are predictable, controllable, and cheap; autonomous Agents are flexible but expensive, slow, and hard to control. If you can be deterministic, don't set it free — predictability is an engineering virtue."
/>

---

## References & Further Reading

> This template is distilled from the following **real open-source projects** and **public engineering resources**. If you want to get hands-on, there's everything from drag-and-drop platforms to code-level orchestration frameworks.

**🔧 Open-source prototypes (read the code directly):**
- [langgenius/dify](https://github.com/langgenius/dify) — a visual LLM application / Agent workflow platform with built-in tools, RAG, and observability, great for rapid building.
- [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) — an orchestration framework that models stateful, long-running Agents as a "graph," supporting durable execution and human-in-the-loop.
- [langchain-ai/langchain](https://github.com/langchain-ai/langchain) — the most classic LLM application framework, one of the de facto standards for tool calling / memory / chained orchestration.
- [yylo-dev/yylo](https://github.com/yylo-dev/yylo) — a command-line orchestrator for coding agents: typed tasks, validation, and merge boundaries in a dedicated git worktree, for receipt-backed repository changes.

**📖 Engineering articles:**
- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — a must-read. It makes the "workflow vs Agent" boundary clear, along with the engineering philosophy of "keep it simple, add complexity only as needed."

---

> 📌 Remember the Agent platform in one line: **it "bolts hands, feet, and an action loop onto the model" so it can do things — but every design decision answers one question: "how do I make autonomous action both useful and not out of control?" Use a workflow if you can rather than setting it free; if you do set it free, you absolutely must bolt on a brake, a sandbox, and human approval.**
