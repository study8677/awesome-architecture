---
layout: home

hero:
  name: "Awesome Architecture"
  text: "Think like an architect"
  tagline: "Writing code is disappearing; judgment is what's getting valuable. 34 architecture-thinking chapters + 25 real-system architecture maps + 6 end-to-end cases — architecture only, no syntax."
  actions:
    - theme: brand
      text: Start the tutorial →
      link: /en/tutorial/README
    - theme: alt
      text: Read 6 cases
      link: /en/cases/README
    - theme: alt
      text: Browse in 中文
      link: /
    - theme: alt
      text: GitHub
      link: https://github.com/study8677/awesome-architecture

features:
  - icon: 🧠
    title: Judgment, not syntax
    details: No language or framework lock-in. A transferable way of thinking — requirements → constraints → quality attributes → trade-offs — now applied to technology stack selection.
  - icon: 🗺️
    title: 25 architecture maps
    details: From e-commerce, social feeds, chat and video to AI gateways, RAG and inference serving — each explains why it's built that way and where it breaks.
  - icon: 🧪
    title: 6 end-to-end cases
    details: Ticketing, SaaS, enterprise RAG, realtime collaboration, content distribution, and coding Agents — each pushed from zero into real pressure.
  - icon: ⚖️
    title: Decisions & trade-offs first
    details: Every template lists the real forks in the road, what was given up, and the first bottleneck at scale.
  - icon: 🔗
    title: Real prototypes
    details: Each template links to real open-source projects and engineering papers (vLLM, LiteLLM, TigerBeetle, Uber H3, Figma…).
---

> ✅ **Fully bilingual.** All 34 tutorial chapters, 25 templates, and the first 6 cases are available in English — use the language switch (top-right) or browse `en/` in the repo. [Contributions welcome](https://github.com/study8677/awesome-architecture).

## 🗺️ Browse all 25 architecture maps

Click a category to filter, then click any card to jump to that template's architecture map.

<ArchExplorer />

## 🧪 Read the first 6 cases

The case track is not more templates. It is a full product walkthrough: starting architecture, quantified trigger signals, ADRs, data flow, failure fallbacks, and quick checks. 👉 [Enter the case track](/en/cases/README)

## 🧰 Learn technology stack selection

The new technology stack selection track (27–34) is not a framework tutorial. It teaches the architectural judgment behind language, databases, cache, APIs, deployment, observability, and AI infrastructure. 👉 [Start from Chapter 27](/en/tutorial/27-编程语言与后端框架选型)

## ⚖️ Architecture is a series of forks in the road

The most valuable section of every template is "Key Decisions & Trade-offs." Try this interactive starter:

<DecisionCard
  title="Monolith or Microservices?"
  a="Monolith"
  aDesc="One deployable unit, in-process function calls. Simple, debuggable, light on ops."
  b="Microservices"
  bDesc="Multiple independently deployed services calling each other over the network. Independent scaling and release, but you inherit the full burden of distributed systems."
  verdict="Default to a 'modular monolith' first. Microservices first solve a *people* scaling problem (multiple teams blocking each other in one codebase), not a *machine* performance problem — splitting prematurely, without the org size, independent-deployment need, and platform muscle in place, is self-inflicted pain."
/>

## 🤔 First, a warm-up

Before diving in, check your gut sense of 'architecture':

<Quiz
  question="Which of the following is closest to the essence of 'architecture'?"
  :options="['A diagram with a few boxes connected by lines', 'A set of decisions that are hard to change, cross-cutting, and decide quality attributes', 'Just use the newest frameworks and microservices']"
  :answer="1"
  explanation="Architecture = the decisions that, once made, are hard to change, affect the whole system, and decide whether it is *good*. Diagrams are how decisions get expressed; the *why* behind decisions is the soul."
/>

Ready? 👉 [Start from Chapter 01](/en/tutorial/01-为什么先有架构思维), or browse [25 architecture maps](https://github.com/study8677/awesome-architecture/tree/main/en/templates) on GitHub.
