# Notification / Push System — Architecture Template

> **Representative products / prototypes**: Novu, Courier, all kinds of "message centers / push platforms," built on top of FCM / APNs
> **One-line definition**: Reliably deliver "something happened" to the right people, according to their preferences, across multiple channels (in-app / push / SMS / email / IM) — without duplicating, without bombarding, and with retries on failure.

---

## 1. One-Line Definition

A notification system = **one unified "event → reach" pipeline**.

It turns the various things that happen in a system (an order shipped, someone @-ed you, a suspicious login) into a notification the user receives on the right channel at the right moment. It's a fusion of [event-driven](../../tutorial/04-十大核心架构模式.md) + [message queues](../../tutorial/04-十大核心架构模式.md) + **channel adapters** — the core difficulties being **fan-out (one event notifies a huge number of people), channel abstraction (channels differ wildly), and "don't disturb."**

## 2. Business Essence: What Problem Does It Solve?

Notifications are the lifeline a product uses to **pull users back and deliver critical information**: transaction status, security alerts, social interactions, marketing re-engagement. A timely "your package has arrived" improves the experience; a "login detected from a new location" can stop an account takeover.

But it's a double-edged sword: **too many notifications = harassment = push turned off = uninstall.** So the sophistication of this system isn't in "being able to send," but in "**sending with restraint**" — the right people, the right things, the right frequency.

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Multiple channels: in-app inbox, app push, SMS, email, IM (e.g. WeCom / Slack)
- [ ] Template and multi-language rendering
- [ ] User preferences and subscriptions (what to receive, what not to, do-not-disturb hours)
- [ ] Dedup, rate-limiting, aggregation (merge many into one digest)
- [ ] Retries, scheduled / batch sending, read status

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **Reliable delivery** | Important notifications aren't lost | Losing a "transaction / security" notification is an incident |
| **Timeliness** | Seconds to minutes | An @-mention or a verification code is useless late |
| **Fan-out capacity** | One event → a huge number of recipients | Marketing / announcements may push to hundreds of millions |
| **Don't disturb** | Rate-limit / aggregate | Bombarding users = user churn |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Channel protocols / limits differ wildly**: app push must go through APNs (iOS) / FCM (Android), SMS through carrier gateways, each with its own rate and format limits.
- 🔴 **Third-party channels are unreliable**: push / SMS gateways lag and fail; you must retry + track status.
- 🔴 **Marketing peaks**: during a big sale, one announcement fans out to hundreds of millions in an instant.
- 🔴 **Compliance**: you must support unsubscribe, do-not-disturb, and anti-spam (or it's illegal and damages the brand).

## 4. Architecture Overview

```
   Event sources (orders / social / security / marketing…)
        │ "X happened"
        ▼
┌──────────────────────────────────────────────────────────────┐
│  Notification service                                          │
│  ① Check user preferences / subscriptions (do they want it?    │
│     is it do-not-disturb hours right now?)                     │
│  ② Template rendering (fill in content, multi-language)        │
│  ③ Dedup + rate-limit + aggregate (no duplicates, no bombing)  │
│  ④ Decide which channels, by priority                          │
└───────────────────────────┬──────────────────────────────────┘
                            ▼  Enqueue (async, smooth peaks + retry)
                  ┌──────────────────────┐
                  │  Message queue        │  Transactional > marketing
                  │  (priority-tiered)    │
                  └──────────┬───────────┘
                            ▼
        ┌────────────────────────────────────────────┐
        │  Channel adapters (translate a unified        │
        │  instruction into each channel's protocol)    │
        └──┬─────────┬──────────┬──────────┬──────────┘
           ▼         ▼          ▼          ▼
        ┌─────┐  ┌──────┐  ┌───────┐  ┌──────┐
        │In-  │  │ Push │  │ SMS   │  │Email │  → User
        │app  │  │FCM/  │  │gateway│  │      │
        │inbox│  │APNs  │  │       │  │      │
        └─────┘  └──────┘  └───────┘  └──────┘
           Failure ──▶ retry; delivery receipts ──▶ status tracking
```

> The soul is this: **steps ① and ③ (preferences + dedup/rate-limit) are "restraint," the queue is "peak-smoothing + reliability," and the channel adapters are "shielding heterogeneity."** A notification system that can only "send one for every event that arrives" will eventually drive its users away.

## 5. Component Responsibilities

- **Event ingestion**: receives events thrown in by the various business systems. *Why it's needed*: decoupling — the business just shouts "X happened" and doesn't care how the notification goes out.
- **Preference / subscription management**: records what each user wants to receive and their do-not-disturb hours. *Why it's needed*: respecting user choice is the bottom line of both experience and compliance.
- **Template engine**: renders an event + data into the copy for each channel. *Why it's needed*: content must be tailored by channel (SMS 70 chars vs email rich text) and by language.
- **Dedup / rate-limit / aggregation**: prevents duplicates and bombing, and merges many into a digest. *Why it's needed*: this is the technical implementation of "don't disturb."
- **Queue (priority-tiered)**: a buffer for peak-smoothing + async + retry. *Why it's needed*: marketing peaks need smoothing, and sending notifications must never block the business (see Decision 1).
- **Channel adapters**: translate a unified instruction into the APNs / FCM / SMS / email protocols. *Why it's needed*: shields channel differences — same idea as the adapters in the [AI gateway](../ai-gateway/README.md).
- **Delivery status tracking**: records whether each notification went out and whether it succeeded. *Why it's needed*: the foundation of reliable delivery and observability.

## 6. Key Data Flows

**Scenario 1: The journey of one notification**
```
1. Event "order shipped (user U)" ──▶ notification service
2. Check U's preferences: they've enabled "logistics notifications," and it's
   not do-not-disturb hours ──▶ continue
3. Render the template: "Your order has shipped, expected delivery tomorrow"
4. Dedup check: this one hasn't been sent ──▶ enqueue (priority: transactional = high)
5. Channel adapter: U has the app installed ──▶ go via FCM push; also drop an
   in-app message
6. FCM returns success ──▶ record delivery status; on failure, retry / fall back to SMS
```

**Scenario 2: Rate-limited aggregation (anti-bombing)**
```
A post gets 50 likes within 1 minute:
  ✗ Dumb way: push 50 "XX liked you" ──▶ user is bombarded, turns off push
  ✓ Aggregate: collect a time window, merge into one "50 people liked your post"
  ── Technical capability must serve the product wisdom of "don't disturb"
```

## 7. Data Model & Storage Choices

Core entities: `notification`; `user preferences / subscriptions`; `template`; `delivery record`; `in-app message`.

| Data | Storage type | Why |
|---|---|---|
| User preferences / subscriptions | Relational | Structured, needs consistency, queried often |
| In-app inbox | See the inbox model in [social feed](../social-feed/README.md) | The write-fanout / read-fanout trade-off |
| Delivery records / status | Time-series / columnar | Massive, aggregated by time to compute delivery rates |
| Pending-send queue | Message queue | Peak-smoothing, retry, priority |

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: Send synchronously or asynchronously? ⭐**
- Synchronous: the business calls the notification API and waits for it to finish before continuing. Simple, but **the moment a channel slows down or dies, the business's main flow is dragged to death**.
- Asynchronous: the business just drops the event into a queue and returns immediately; the notification service sends at its own pace.
- **Leaning**: asynchronous, no question. **Sending notifications is a non-critical path and must never block the business**, and the queue naturally gives you peak-smoothing and retry.

**Decision 2: Dedup and rate-limiting (the core of "don't disturb") ⭐**
- Not doing it: the same event may trigger multiple notifications, and a hot event bombards madly.
- Doing it: idempotent dedup (send a given notification only once) + rate-limiting (a cap per unit time) + aggregation (merge into a digest).
- **Leaning**: must do it. **"Don't disturb" is the product's lifeline, and the tech must serve it.**

**Decision 3: Push channel — build your own or use a platform?**
- Connecting to devices yourself: impossible — iOS / Android push **must** go through APNs / FCM.
- **Leaning**: app push always goes via APNs / FCM; the system only "drives these platforms well," there's no bypassing them.

**Decision 4: Delivery guarantee — at-least-once + idempotency**
- For important notifications, rather resend than lose (at-least-once), but resending makes users receive duplicates.
- **Leaning**: at-least-once retry on the server, idempotent dedup on the client / channel side. **Same as [payments](../payment-system/README.md): rather resend than lose, with idempotency catching the duplicates.**

## 9. Scaling & Bottlenecks

- **First bottleneck: the marketing fan-out peak (hundreds of millions).** → Fix: queue peak-smoothing + batch sending + parallel sharding by user.
- **Second bottleneck: channel rate limits (SMS / push have rate caps).** → Fix: queue by per-channel quota, send smoothly.
- **Third bottleneck: transactional notifications squeezed out by the marketing peak.** → Fix: a **priority queue** — transactional / security notifications take a high-priority dedicated lane.
- **Fourth bottleneck: massive delivery-status data.** → Fix: time-series storage + aggregated delivery-rate stats.

## 10. Security & Compliance Essentials

- **Unsubscribe and do-not-disturb**: must support one-click unsubscribe and do-not-disturb hours to satisfy anti-spam / privacy regulations (or it's illegal).
- **Anti-bombing / anti-abuse**: rate-limiting is both UX and security (prevents the system being used to harass).
- **Content security**: templates must guard against injection (user data filled into a template shouldn't be exploitable); notification content may contain sensitive info and must be masked.
- **Channel credential security**: APNs certificates / SMS gateway keys are sensitive credentials.

## 11. Common Pitfalls / Anti-patterns

- ❌ **Sending notifications synchronously, blocking the business's main flow** → ✅ async queue; notifications are a non-critical path.
- ❌ **No dedup, no rate-limiting, bombing madly** → ✅ dedup + rate-limit + aggregated digest.
- ❌ **Transactional and marketing notifications sharing one priority** → ✅ tier by priority / lane, important ones arrive first.
- ❌ **Ignoring user preferences and forcing sends** → ✅ preferences + unsubscribe + do-not-disturb.
- ❌ **Sending one by one, no batching** → ✅ big fan-outs must batch.
- ❌ **Assuming a channel always succeeds** → ✅ retry + delivery-status tracking + fallback.

## 12. Evolution Path: MVP → Growth → Maturity (how to set it up at each stage)

| Stage | Scale | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **MVP** | Just starting | One or two channels (email / push), hook directly into FCM / an email service, a simple async queue | First get "the things that should be notified actually get notified" working |
| **Growth** | Multi-channel / scaling up | Use something like **Novu** or build your own: multi-channel + templates + preferences + dedup/rate-limit + async queue + retry | Reliable delivery, don't-disturb, fan-out capacity |
| **Maturity** | Hundred-million fan-out | Priority queues, smart aggregation (digests), cross-channel orchestration (push first, SMS if unread), A/B, delivery-rate observability | Scale, priority guarantees, conversion, compliance |

## 13. Reusable Takeaways

- 💡 **An async queue for peak-smoothing + retry is the standard stance for handling a "non-critical path."** Sending notifications, sending email, writing logs — none should block the main flow.
- 💡 **Channel adapters shield heterogeneous third parties**: one instruction set internally, N adapters externally — the same move as the [AI gateway](../ai-gateway/README.md) "adapting to multiple vendors."
- 💡 **At-least-once + idempotent dedup**: rather resend than lose, with dedup catching the duplicates — echoing the [payment system](../payment-system/README.md).
- 💡 **"Don't disturb" is a model case of product wisdom outranking technical capability.** Being able to send doesn't mean you should — a good system knows restraint.

## 🎯 Quick Quiz

<Quiz
  question="What's the correct way to send notifications?"
  :options="['Send synchronously, and continue the business only after it finishes', 'Enqueue asynchronously + dedup and rate-limit, never blocking the main business flow', 'Send one immediately for every event that arrives']"
  :answer="1"
  explanation="Sending notifications is a non-critical path and must never block the business; and 'dedup + rate-limit' is the technical implementation of 'don't disturb' — being able to send doesn't mean you should."
/>

---

## References & Further Reading

> This template is compiled from the following **real open-source projects** and **official documentation**.

**🔧 Open-source prototypes (you can read the code directly):**
- [novuhq/novu](https://github.com/novuhq/novu) — open-source notification infrastructure, a unified API covering in-app / email / SMS / push / Slack channels, demonstrating multi-channel fan-out, templates, and workflow orchestration.

**📖 Official documentation:**
- [Firebase Cloud Messaging architecture overview](https://firebase.google.com/docs/cloud-messaging/fcm-architecture) — Google's official docs on the FCM backend's topic fan-out, transport-layer routing, and delivery; the authoritative reference for push systems.
- [FCM delivering iOS push via APNs](https://firebase.google.com/docs/cloud-messaging/ios/receive-messages) — explains how FCM uses Apple's APNs as its transport layer, illustrating "multi-platform transport-layer integration."

---

> 📌 Remember a notification system in one line: **it isn't "an API that can send SMS" — it's "a pipeline that delivers 'what happened' to the right people with restraint, reliably, and by preference." Every design decision answers one question: 'How do we send to the right people, the right things, at the right frequency, while losing nothing, duplicating nothing, and bombing no one?'**
