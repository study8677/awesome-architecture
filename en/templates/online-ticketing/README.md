# Online Ticketing / Ticket Rush — Architecture Template

> **Representative products / prototypes**: Ticketmaster, SeatGeek, Damai, 12306, and all kinds of "flash sales"
> **One-line definition**: When a flood of users fight over a limited supply of seats / inventory the instant sales open, guarantee no overselling, relative fairness, and that the system isn't knocked over.

---

## 1. One-Line Definition

A ticket-rush system = **the head-on battlefield where "extreme instantaneous concurrency" collides with "limited, scarce resources."**

A million people fight over tens of thousands of tickets in the same second. It's the extreme version of an [e-commerce flash sale](../ecommerce-platform/README.md), with one extra dimension: **a ticket is often "a specific seat"** (there's only one Row 3, Seat 12). Its entire design works to satisfy three nearly conflicting things at once: **never oversell, be as fair as possible, and don't crash.**

## 2. Business Essence: What Problem Does It Solve?

It sells **an extremely limited resource (tickets / seats), in an extremely concentrated window of time (the instant sales open), to an extremely huge crowd.**

What makes this special is "sale-open equals peak": no traffic normally, then traffic spikes thousands-fold the instant sales open, then settles back to calm a few minutes later. Architecting for this kind of **spike** is a completely different mindset from architecting for "steady growth."

> Three iron rules, in priority order: **no overselling (the bottom line) > no crashing (the prerequisite) > fairness (the experience).** Selling a ticket that doesn't exist is an incident; if the system crashes, no one gets anything; if it's unfair, the reputation collapses.

## 3. Core Requirements & Constraints

**Functional requirements:**
- [ ] Releasing tickets / inventory management (possibly down to the seat)
- [ ] Grabbing tickets: decrement inventory / lock a seat
- [ ] Seat locking (hold it while an order is placed but unpaid) + timeout release
- [ ] Order placement, payment, ticket issuance
- [ ] Queuing, purchase limits, anti-bot

**Non-functional requirements / quality attributes:**
| Quality attribute | Target | Why it matters for this kind of system |
|---|---|---|
| **No overselling** | Absolute | Selling a non-existent ticket is a major incident |
| **Peak capacity** | Withstand the instant-sale-open flood | Low normally, exploding the instant sales open — a classic spike |
| **Fairness** | First-come-first-served / anti-bot | Swept clean by scalper scripts, reputation collapses |
| **Real-time inventory** | Accurate remaining-tickets / seat status | Users want to see "how many are left" |

**Key constraints (boundaries you cannot cross):**
- 🔴 **Inventory is limited and precise**: each seat is unique and can't be sold twice.
- 🔴 **Concurrency is extreme and instantaneous**: the write contention the instant sales open is concentrated on a tiny number of "hot inventory" rows.
- 🔴 **There's a "locking" intermediate state**: a user has placed an order but not yet paid — the ticket can neither be sold to someone else nor held forever.
- 🔪 **Scalpers / scripts**: professional gangs use machines to grab, so fairness faces real adversarial pressure.

## 4. Architecture Overview

```
   The instant sales open: a million users pour in
   ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼
┌──────────────────────────────────────────────┐
│  Virtual waiting room / queue                  │
│  (hold the flood [outside] the core system)    │
│  • Everyone enters the waiting room first,      │
│    gets a queue number                          │
│  • Admit in batches at [a rate the system can   │
│    bear] into the ticket rush                   │
│  • Anti-bot: verification, rate-limiting, risk  │
│    control filter once at this layer            │
└───────────────────────┬──────────────────────┘
                        ▼ Admission tokens (a trickle, not a flood)
┌──────────────────────────────────────────────┐
│  Ticket-rush / inventory service               │
│  • [Atomic] inventory decrement (hot inventory  │
│    in memory, never oversell)                   │
│  • Lock the seat (temporary hold)               │
└───────────────────────┬──────────────────────┘
                        ▼ Grabbed → create order (status = pending payment)
┌──────────────────────────────────────────────┐
│  Order state machine → payment → ticket issue   │
│  ⏰ Payment times out ──▶ auto-release the locked  │
│     ticket, return it to available              │
└──────────────────────────────────────────────┘
```

> The soul is that top layer, the **virtual waiting room**: its job isn't "to make everyone queue," but **to hold the flood outside the core system and "reshape" the traffic into a steady stream matched to the system's real capacity**. Without it, the core system gets knocked flat in the very second sales open.

## 5. Component Responsibilities

- **Virtual waiting room / queue**: when sales open, everyone enters the queue first and is admitted in batches per the system's capacity. *Why it's needed*: this is the foundation of withstanding the flood — protecting the core system from being killed by instantaneous traffic (see Decision 1).
- **Ticket-rush / inventory service**: decrements inventory with an **atomic operation**, never overselling. *Why it's needed*: preventing overselling is the bottom line, and a plain "read-modify-write" will inevitably oversell under high concurrency (see Decision 2).
- **Seat locking**: temporarily holds a seat when an order is placed, giving the user time to pay. *Why it's needed*: a seat has a "currently being bought by someone" intermediate state.
- **Timeout release**: reclaims locks that are "held but unpaid." *Why it's needed*: otherwise tickets get held to death, neither sellable nor returnable (see Decision 3).
- **Order state machine**: manages "pending payment → paid → issued / cancelled." *Why it's needed*: issuance concerns money and inventory, so state must not get out of order.
- **Anti-bot risk control**: identifies bots / scalpers. *Why it's needed*: fairness faces professional adversaries.

## 6. Key Data Flows

**Scenario 1: The ticket rush when sales open (from flood to issuance)**
```
1. Sales open, a million people pour in ──▶ all enter the [virtual waiting room],
   get a queue number
2. The system admits in batches at a rate of "N per second it can handle" ──▶
   into the ticket-rush service
3. Rush: do an [atomic decrement] on the hot session's inventory
      Decrement succeeds ──▶ lock the seat, create order (pending payment, 10 min)
      Inventory is 0 ──▶ return "sold out"
4. User pays ──▶ issue the ticket, inventory officially sold
5. ⏰ Not paid in 10 minutes ──▶ auto-release, this ticket returns to the available pool
```

**Scenario 2: Why no overselling (atomic decrement)**
```
✗ Wrong: read the remaining count first (reads 1) → both requests think there's still
        one → both decrement → 2 tickets sold (oversold!)
✓ Right: use an [atomic operation] "decrement and return the result" — only one request
        can bring the last 1 down to 0, and the other atomic operation returns
        "insufficient" → only 1 ticket sold
```

## 7. Data Model & Storage Choices

Core entities: `inventory / seat (status: available / locked / sold)`; `order (state machine)`; `queue token`.

| Data | Storage type | Why |
|---|---|---|
| Hot-session inventory | In-memory KV (atomic operations) | Write contention is extremely hot; DB row locks can't take the instantaneous flood |
| Seat map / status | In-memory + relational for the ledger | High real-time demand, must ultimately persist |
| Orders | Relational (strongly consistent) | Concern money and issuance, need transactions |
| Queue tokens | In-memory KV | High-frequency, ephemeral |

> Teaching point: **"hot inventory" is a super write hotspot** — one blockbuster session's inventory is fought over by a million requests on the same row in an instant. Putting it in in-memory storage for atomic decrement, rather than making one DB row bear it, is the key to surviving the flood.

## 8. Key Architecture Decisions & Trade-offs ⭐

**Decision 1: The virtual waiting room for peak-shaving (the foundation of withstanding the flood) ⭐**
- No peak-shaving, letting everyone hit the core system directly: the core system gets knocked flat the instant sales open, and nobody gets anything.
- Virtual waiting room: hold people outside the door in a queue, admit them per the system's capacity.
- **Leaning**: large ticket rushes must add a waiting room. **Holding the flood outside the door is far more effective than frantically adding machines inside it** — this is the first principle for handling spike traffic.

**Decision 2: How do you guarantee inventory decrement doesn't oversell? ⭐**
- DB "read remaining - subtract remaining - write back": non-atomic, will inevitably oversell under high concurrency.
- DB row lock / optimistic lock: can prevent overselling, but the hot row becomes a bottleneck under the flood.
- In-memory atomic decrement (single-threaded atomic operation): fast and oversell-free.
- **Leaning**: **for modest concurrency use a DB row lock / optimistic lock; for hot, flooded sessions use in-memory atomic decrement**, then persist asynchronously. See Section 12 for details.

**Decision 3: The seat-locking intermediate state — what about "held but unpaid"? ⭐**
- No lock: the user picks a seat, hasn't paid, and it's grabbed by someone else → an experience disaster.
- Locked with no timeout: held but unpaid, the ticket can never be sold.
- Lock + auto-release on timeout.
- **Leaning**: must do "lock + timeout release." **This is the universal pattern for "temporarily holding a scarce resource"** — same as distributed locks and inventory reservation.

**Decision 4: Grab eligibility synchronously, run the flow asynchronously.**
- Make "grabbing eligibility (decrementing inventory)" synchronous, blazing fast, and atomic; make the subsequent "order placement, payment" an asynchronous flow.
- **Leaning**: the better the core contention point — lighter and faster — the better; push the heavy lifting to after you've grabbed it and do it slowly.

## 9. Scaling & Bottlenecks

- **First bottleneck: the sale-open peak.** → Fix: virtual waiting room peak-shaving (the fundamental means) + front-end staticization + CDN.
- **Second bottleneck: write contention on hot inventory.** → Fix: hot inventory in memory with atomic decrement; when extremely hot, **segment the inventory** (split 1000 tickets into 10 segments of 100 each, spreading the contention).
- **Third bottleneck: read amplification from checking remaining tickets.** → Fix: multi-level caching (cache the remaining-tickets status, tolerate a few seconds of lag).
- **Fourth bottleneck: the queue system itself must withstand everyone.** → Fix: the waiting room itself must be made dead-simple and massively horizontally scalable.

## 10. Security & Compliance Essentials

- 🔴 **Anti-bot / anti-script ticket grabbing**: CAPTCHA, device fingerprinting, risk control, real-name + purchase limits, to fight scalpers — this is the technical line of defense for fairness.
- **Overselling protection**: atomic decrement is a security matter (overselling = selling a non-existent asset).
- **Anti-scraping interfaces**: pre-sale probing and remaining-tickets-scraping interfaces must all be rate-limited.
- **Payment security**: see the [payment system template](../payment-system/README.md).

## 11. Common Pitfalls / Anti-patterns

- ❌ **Letting everyone hit the core system directly when sales open** → ✅ virtual waiting room peak-shaving, hold the flood outside the door.
- ❌ **Using non-atomic "read remaining - subtract remaining" decrement** → ✅ atomic operation / row lock, or it will inevitably oversell.
- ❌ **Locking a seat with no timeout** → ✅ auto-release on timeout, don't let tickets get held to death.
- ❌ **Cramming hot inventory into a plain database to bear the writes** → ✅ hot inventory in memory with atomic decrement, segment it when necessary.
- ❌ **No bot defense** → ✅ risk control + real-name + purchase limits, hold the line on fairness.

## 12. Evolution Path: MVP → Growth → Maturity (how to set it up at each stage)

| Stage | Scale | How to set it up (specifics) | What to worry about now |
|---|---|---|---|
| **MVP** | Small event sign-ups | A DB **row lock / optimistic lock** to decrement inventory is enough; concurrency is modest, no need for a heavyweight approach | First guarantee no overselling, don't over-engineer |
| **Growth** | Medium ticket rushes | Hot inventory in **in-memory atomic decrement**, seat-lock timeout release, purchase limits, basic anti-scraping, async order placement | Hot-write contention, overselling, seat-hold release |
| **Maturity** | Damai / 12306 scale | **Virtual waiting room** peak-shaving, segmented inventory, multi-level cache for remaining tickets, risk control vs scalpers, end-to-end async | Peak capacity, fairness adversaries, stability |

## 13. Reusable Takeaways

- 💡 **"Holding the flood outside the door" is more fundamental than "adding machines inside it."** Queuing / waiting rooms / rate-limiting are the first choice for handling instantaneous spike traffic — this shares roots with [message-queue peak-shaving](../../tutorial/04-十大核心架构模式.md).
- 💡 **Atomic operations are the lifeblood of preventing overselling**: any scenario of "fighting over a limited resource" (flash sale, coupon rush, seat rush) must use atomic decrement, not "read-modify-write."
- 💡 **"Hold + timeout release" is the universal pattern for handling "temporarily holding a scarce resource"**: seat reservation, inventory reservation, distributed locks — all are it.
- 💡 **Put super-hot data in memory**: making one database row bear a million concurrent writes is a doomed bottleneck; only in-memory atomic operations can take it.

## 🎯 Quick Quiz

<Quiz
  question="What is the most fundamental means of withstanding the instant-sale-open ticket-rush flood?"
  :options="['Frantically add servers and brute-force it', 'A virtual waiting room: hold the flood outside the core system and admit by capacity', 'Cap the total number of tickets sold']"
  :answer="1"
  explanation="Holding the flood outside the door is far more effective than frantically adding machines inside it — this is the first principle for handling instantaneous spike traffic."
/>

---

## References & Further Reading

> This template is compiled from the following **public engineering materials**. The core difficulties of ticket-rush / ticketing systems (virtual waiting room, peak-shaving, seat locking) are explained thoroughly in the pieces below.

**📖 Engineering articles / solutions:**
- [Queue-it: Virtual Waiting Room](https://www.queue-it.com/virtual-waiting-room) — the commercial virtual-waiting-room solution: FIFO + randomized queuing, controlling outflow by "admissions per minute," preventing peaks from crushing the system and blocking bots.
- [AWS: Managing peak traffic on AWS using Queue-it's virtual waiting room](https://aws.amazon.com/blogs/apn/how-to-manage-peak-traffic-on-aws-using-queue-its-virtual-waiting-room/) — AWS's official blog, laying out the implementation architecture of a virtual waiting room (queue-state storage, admission control).
- [InfoQ: How SeatGeek handles high-demand on-sales](https://www.infoq.com/presentations/ticketing-system-virtual-waiting-room/) — a SeatGeek engineering talk on using a virtual waiting room to handle high-demand on-sales (seat locking / queuing / rate-limiting).

---

> 📌 Remember a ticket-rush system in one line: **it isn't "a website that sells tickets" — it's "a battlefield where an extreme instantaneous flood fights over scarce resources." Every design decision answers one question: 'How do we simultaneously achieve no overselling, no crashing, and relative fairness?' — hold the flood outside the door, guard inventory with atomic operations, and put a timeout on seat holds.**
