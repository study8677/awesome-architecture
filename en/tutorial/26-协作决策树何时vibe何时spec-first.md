# 26 · Collaboration Decision Tree: When to Vibe, When to Spec-First

> The thesis in one line: **the question is not "should we use AI to write code" — it is "for this particular piece, should we let it vibe freely, or lock down the spec first and then let it write." Prototype all you want by vibing; close out production work with judgment. This chapter distills the previous three chapters (spec / review / eval) into a decision tree you can actually follow, and closes the AI-collaborative design track.**

---

> **🤝 Final chapter of the AI-collaborative design track.** You have walked through four capabilities: **reading systems and designing from scratch ([01–09](01-为什么先有架构思维.md)) → taming the hard rock of distributed, critical systems ([10–17](10-分布式系统的硬道理.md)) → applying the methods to real AI systems ([18–22](18-读地图用框架拆解陌生系统.md)) → learning to write constraints for AI, review it, and guard its quality ([23–25](23-规格即架构约束怎么写给AI.md))**. This chapter collects the final three weapons into one workflow.

---

## Opening: three weapons, which one and when?

Chapters [23](https://github.com/study8677/awesome-architecture/blob/main/tutorial/23-规格即架构约束怎么写给AI.md) / [24](https://github.com/study8677/awesome-architecture/blob/main/tutorial/24-审查清单AI产出默认缺什么.md) / [25](https://github.com/study8677/awesome-architecture/blob/main/tutorial/25-评测驱动把够好写进架构.md) gave you three weapons for collaborating with AI:

```
   Spec (23)    ── before: write constraints as guardrails the AI must respect
   Review (24)  ── after:  use the checklist to fill what AI missed, item by item
   Eval (25)    ── ongoing: use evals to guard the quality distribution
```

But deploying all three weapons has a cost — writing ADRs, building evals, going through the checklist line by line all take time. **Applying the whole stack to a weekend toy is just another form of over-engineering.** So the last, and most important, judgment is:

> **Is this piece of code / this system actually worth suiting up fully? — or should you just let AI fly?**

---

## 1. The first fork: what is this thing?

Everything starts with this question (the expansion of [Chapter 17](https://github.com/study8677/awesome-architecture/blob/main/tutorial/17-大模型时代的架构判断.md)'s "vibe toys freely, close out production with judgment"):

```
   What is this code / system?
        │
        ├─ Toy / prototype / exploration / one-off script / demo
        │     → [Vibe freely] faster is better, do not over-engineer
        │        (echoing Ch. 04 "avoid it if you can first" and Ch. 09 restraint aesthetic)
        │        Review? If it runs, fine. Eval? Not needed. Spec? In your head is enough.
        │
        ├─ Middle ground (internal tools, small features that do not touch money)
        │     → [Vibe a draft, close out with judgment]
        │        Generate quickly → pick the relevant checklist items, one review pass (24) → ship
        │
        └─ Production / critical path / touches money or data / long-term maintenance / team-wide
              → [Spec-first] lock down the spec, then let AI write within the guardrails
                 Spec (23) → generate → review (24) → eval gate (25) → ship
```

> **Key: vibe and spec-first are not "beginner vs expert" — they are different scenarios.** Vibing a production system straight to production is the danger [Chapter 17](https://github.com/study8677/awesome-architecture/blob/main/tutorial/17-大模型时代的架构判断.md) warned against (handing users a house whose blueprints you have never read); but writing a full set of ADRs + evals for a one-off script is burning time on a trade-off that was never on the table. **Judgment shows itself first in recognizing which scenario you are in.**

---

## 2. The full spec-first loop (connecting all three weapons)

Once you have judged "this is production-grade," the three weapons form a **loop** — and a loop that **compounds** (this is exactly the "judgment + record" compounding loop at the end of [Chapter 08](https://github.com/study8677/awesome-architecture/blob/main/tutorial/08-架构决策记录与演进.md), now in AI-era form):

```
        ┌──────────────────────────────────────────────┐
        │                                              │
        ▼                                              │
   ① Spec (23)               ② AI generates impl      │
   ADR + AGENTS.md      ──▶  vibe a draft within       │
   + fitness functions        guardrails               │
        ▲                     (impl is cheap, let it   │
        │                      go fast)                │
        │                        │                     │
   ⑤ Evolution: new            ③ Review (24)           │
   constraints written   ◀──  fill what AI missed,     │
   back into spec               item by item           │
        │                        │                     │
        │                        ▼                     │
        └──────────  ④ Eval gate (25)                  │
                     ship only when quality passes,    │
                     hold the line against regression ─┘
```

Every cycle makes your **spec library (ADR + AGENTS.md + eval suite) one layer thicker** — the next time AI writes more in-spec, reviews cost less effort, regressions become harder to sneak in. **This is exactly what [Chapter 08](https://github.com/study8677/awesome-architecture/blob/main/tutorial/08-架构决策记录与演进.md) said: judgment compounds with every cycle.** The only difference is that in the past the whole loop ran on human hands; now the "generate" step is handed to AI, while **spec, review, gate — the judgment part — is still yours.**

---

## 3. Quantifying the fork: a few rulers

"Production vs toy" is not always black and white. Measure it with a few rulers (all from earlier chapters):

| Dimension | Leans toward vibe | Leans toward spec-first | From |
|---|---|---|---|
| **Reversibility** | Wrong? Delete and redo anytime | Wrong and hard to roll back (touched money / data / already out the door) | [12](https://github.com/study8677/awesome-architecture/blob/main/tutorial/12-为失败而设计.md) |
| **Blast radius** | Affects only yourself / one demo | Affects real users / the whole site | [16](https://github.com/study8677/awesome-architecture/blob/main/tutorial/16-安全与多租户架构.md) |
| **Touches money / sensitive data** | No | Yes (money, privacy, compliance) | [19](https://github.com/study8677/awesome-architecture/blob/main/tutorial/19-完整设计演练中等复杂度系统.md) |
| **Lifespan** | One-off / short-lived | Long-term maintenance, multiple people handing it off | [08](https://github.com/study8677/awesome-architecture/blob/main/tutorial/08-架构决策记录与演进.md) |
| **Quality tolerance** | Occasional errors do not matter | Must be stable, must not regress | [25](https://github.com/study8677/awesome-architecture/blob/main/tutorial/25-评测驱动把够好写进架构.md) |

> The further right you land, the more the "spec + review + eval" cost is worth paying. **This table is essentially an application of [Chapter 06's quality attributes](https://github.com/study8677/awesome-architecture/blob/main/tutorial/06-质量属性与取舍.md)**: you are not choosing "whether to be rigorous" — you are judging "whether the benefit of being rigorous is worth its cost for this system."

---

## 4. The same judgment also decides "how much autonomy to unleash"

This decision tree and [Chapter 22](https://github.com/study8677/awesome-architecture/blob/main/tutorial/22-AI原生系统设计.md)'s "workflow vs autonomous Agent" are **two forms of the same judgment**:

```
   When writing code:    if the spec is knowable, go spec-first — do not vibe raw into production
   When building AI systems:  if a deterministic workflow works, skip the autonomous Agent (Ch. 22)
                  ╲                    ╱
                   both are the same restraint:
           "if you can solve it in a predictable, controllable way, do not choose the uncontrollable one"
```

Whether you are "letting AI write code" or "letting AI act autonomously at runtime," the more freedom you unleash, the more you need spec, guardrails, review, eval, and human sign-off to close it out. **Predictability is an engineering virtue** — a thread that runs from [04](https://github.com/study8677/awesome-architecture/blob/main/tutorial/04-十大核心架构模式.md) (monolith before microservices), through [22](https://github.com/study8677/awesome-architecture/blob/main/tutorial/22-AI原生系统设计.md) (workflow before Agent), all the way to this chapter (spec before raw vibing into production).

---

## 5. Back to the beginning: what you have actually been training

At the end of the AI-collaborative design track, we return to [Chapter 01](01-为什么先有架构思维.md) and the reason this repo exists:

> **Writing code is becoming cheap; architectural judgment is becoming unprecedentedly scarce and valuable.**

From start to finish, this tutorial has never taught a framework or a syntax — AI can produce those in seconds. It taught something **that does not depreciate**:

```
   Will depreciate (AI is making it cheap)      Will not depreciate (what these chapters train)
   ──────────────────────────────────         ──────────────────────────────────────────────────────────
   • Memorizing an API / syntax               • Take a vague requirement and ask the right questions (02/07)
   • Hand-writing boilerplate impl            • Make well-reasoned decisions amid trade-offs (06/08)
   • Getting code right and fast              • See where the system will die and what to swap (12/13/14)
                                              • Write constraints for AI, review it, guard its quality (23-25)
   ────────────────────────────               ──────────────────────────────────────────────────────────
   → Hand off to AI                           → This is you, in the AI era
```

And the AI-collaborative track (23–26) is really saying one thing: **architectural judgment is not obsolete in the AI era — it has a brand-new, extremely high-leverage arena: through the interface of "spec / review / eval / decision," you turn your judgment into the behavioral constraints of an AI army.** You are no longer just "designing a system" — you are "**designing the guardrails and process that continuously produce good systems through AI**." Judgment is amplified, not replaced.

> **Architectural wisdom**: **vibe coding is not the end of judgment — it is its lever.** A person with judgment + AI = the output of ten people; a person without judgment + AI = ten times the speed of building systems you cannot read, cannot sustain, and cannot change. What decides the outcome has never been how powerful the AI is, but whether the person holding the wheel can read the map clearly.

---

## 🎯 Quick check

<Quiz
  question="You are writing a small script over the weekend to scrape some public data — you use it once and throw it away. According to this chapter's decision tree, the most reasonable approach is?"
  :options="['Write ADRs first, build an eval suite, add a CI gate — rigor above all', 'Vibe freely — it is one-off, reversible, touches no money, blast radius is just yourself; generate and run, that is enough', 'Do not use AI at all; hand-coding is the only reliable option']"
  :answer="1"
  explanation="The first fork in the decision tree is 'what is this thing?' A one-off, reversible, money-free, self-only toy/script is exactly the scenario for vibing freely; imposing the full spec+eval stack on it is just another form of over-engineering. Spec-first is reserved for production, critical paths, systems that touch money or data, and long-term maintenance work. Judgment shows itself first in recognizing which scenario you are in."
/>

<Quiz
  question="In the AI era, what does this tutorial consider the most core and irreplaceable developer capability?"
  :options="['Writing implementation code faster than the AI can', 'Architectural judgment — asking the right questions, making well-reasoned trade-offs, seeing where systems will die, and turning that judgment into guardrails the AI respects through spec/review/eval', 'Memorizing as many frameworks and APIs as possible']"
  :answer="1"
  explanation="Implementation has been commoditized by AI; writing faster or memorizing more APIs are both depreciating. What does not depreciate is architectural judgment: thinking clearly before touching a keyboard about what the system should look like, where it will die, and what it trades for what — then turning that judgment into behavioral constraints for an AI through spec/review/eval. Judgment is amplified, not replaced."
/>

---

## Chapter summary

- **The first fork is about nature**: toy / prototype / one-off → vibe freely; production / critical path / touches money or data / long-term maintenance → spec-first; middle ground → vibe a draft + close out with judgment. Vibe vs spec-first is a difference in scenario, not in skill level.
- **Spec-first is a compounding loop**: spec (23) → AI generates → review (24) → eval gate (25) → evolution writes back into spec. Each cycle thickens the spec library; this is the AI-era version of [Chapter 08](https://github.com/study8677/awesome-architecture/blob/main/tutorial/08-架构决策记录与演进.md)'s judgment+record compounding loop — implementation goes to AI, judgment stays with you.
- **Use rulers to measure the fork**: reversibility, blast radius, whether it touches money/data, lifespan, quality tolerance — this is fundamentally the trade-off of [Chapter 06](https://github.com/study8677/awesome-architecture/blob/main/tutorial/06-质量属性与取舍.md): judging "whether the benefit of rigor is worth its cost."
- **The same restraint**: spec before raw vibing into production; workflow before unleashing an Agent ([22](https://github.com/study8677/awesome-architecture/blob/main/tutorial/22-AI原生系统设计.md)); monolith before microservices ([04](https://github.com/study8677/awesome-architecture/blob/main/tutorial/04-十大核心架构模式.md)) — predictability is an engineering virtue.
- **Judgment is a lever, not a replacement**: person with judgment + AI = amplified output; person without judgment + AI = ten times the speed of building systems that cannot hold up.

---

## 🤝 AI-collab track close: judgment keeps going

Up to Chapter 26, the through-line has been:

```
   01–09  Read systems, design a small-to-medium system from scratch      —— build judgment
   10–17  Tame distributed / failure / scale / evolution / org / security  —— conquer hard rock
   18–22  Apply the methods to real AI systems (read → design →            —— hands-on practice
          evolve → decompose → AI-native)
   23–26  Write constraints for AI, review, eval, decision collaboration   —— work with AI
   ────────────────────────────────────────────────────────────────────────────────────────────
   The thread throughout:  code will change, frameworks will swap, but the judgment of
                           "read the map before hitting the road" keeps compounding
                           throughout your entire career.
```

What this tutorial gave you was never conclusions — it was **the ability to ask questions**. When you can naturally ask, of every technical choice and every piece of AI output, "**why this one? what is the cost? where will it die?**" — you are already thinking like an architect.

> **Keep going.** Once you can design systems and collaborate with AI, real projects keep asking "what technology should we use?" The next track starts with [27 · Programming languages and backend frameworks](27-编程语言与后端框架选型.md), applying the same architectural judgment to languages, databases, cache, APIs, deployment, observability, and AI infrastructure.
>
> If you want a coach to walk with you, use the companion [architecture-copilot](https://github.com/study8677/architecture-copilot) skill — it turns this tutorial into an interactive partner inside Claude Code / Cursor / Codex that **guides you through architectural judgment step by step**.

---

## Related links

- The three weapons: [23 · Spec as architecture: constraints for AI](https://github.com/study8677/awesome-architecture/blob/main/tutorial/23-规格即架构约束怎么写给AI.md) · [24 · Review checklist: what AI output omits by default](https://github.com/study8677/awesome-architecture/blob/main/tutorial/24-审查清单AI产出默认缺什么.md) · [25 · Eval-driven: bake "good enough" into architecture](https://github.com/study8677/awesome-architecture/blob/main/tutorial/25-评测驱动把够好写进架构.md)
- Back to the beginning: [01 · Why architectural thinking comes first](https://github.com/study8677/awesome-architecture/blob/main/tutorial/01-为什么先有架构思维.md) · [17 · Architecting in the age of LLMs](https://github.com/study8677/awesome-architecture/blob/main/tutorial/17-大模型时代的架构判断.md) · [08 · ADRs & evolution](https://github.com/study8677/awesome-architecture/blob/main/tutorial/08-架构决策记录与演进.md) (compounding loop)
- The same restraint: [22 · AI-native system design](https://github.com/study8677/awesome-architecture/blob/main/tutorial/22-AI原生系统设计.md) (workflow vs Agent), [04 · Ten core patterns](https://github.com/study8677/awesome-architecture/blob/main/tutorial/04-十大核心架构模式.md) (monolith before microservices)
- Walk with it: [architecture-copilot](https://github.com/study8677/architecture-copilot) · all [templates/](https://github.com/study8677/awesome-architecture/blob/main/templates/README.md)
