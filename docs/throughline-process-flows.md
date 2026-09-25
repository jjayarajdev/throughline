---
marp: true
theme: default
paginate: true
title: Throughline — Process Flow Diagrams
version: v0.2
company: Syntegreti
---

<!-- _class: lead -->

# Throughline
## Process Flow Diagrams

How work moves through the platform — at a glance.

> Same shape as how a GCC already operates — just enforced and instrumented.
>
> A Syntegreti product · v0.2

---

## 1 · Master Flow — Requisition to Day-90

```mermaid
flowchart LR
    A([1 · Raise HRQ<br/><i>Hiring Mgr</i>]):::hms
      --> B([2 · BET Approval<br/><i>BET Approver</i>]):::hms
      --> C([3 · RM Owner Accept<br/><i>RM Owner</i>]):::hms
      --> D([4 · Vendor Allocation<br/><i>Partner</i>]):::pms
      --> E([5 · Slot &amp; Interview<br/><i>Panel</i>]):::pms
      --> F([6 · Feedback &amp; Offer<br/><i>Hiring Mgr</i>]):::pms
      --> G([7 · BGV &amp; Onboarding<br/><i>SPOC</i>]):::cms
      --> H([8 · Day 30/60/90<br/><i>TA Lead</i>]):::tracker

    classDef hms     fill:#0B1F3A,stroke:#0B1F3A,color:#fff
    classDef pms     fill:#00A3A1,stroke:#00A3A1,color:#fff
    classDef cms     fill:#F58A07,stroke:#F58A07,color:#fff
    classDef tracker fill:#2E8B57,stroke:#2E8B57,color:#fff
```

**Background automation that quietly keeps the pipeline moving**

| Cadence | What runs |
|---|---|
| **Hourly** | Expire stale slots · drop candidates after 3 rejections |
| **Daily**  | Reassign aged HRQs · deactivate idle vendors · trigger escalations |
| **Always** | Audit log · email alerts · role-based dashboards |

> Eight stages, three sub-systems, one audit trail.

---

## 2 · HRQ Lifecycle — with Auto-Reassign Loop

```mermaid
flowchart LR
    A([HRQ Created]):::hms --> B([BET Review]):::hms --> C([RM Owner Inbox]):::hms
    C --> D{Accepted<br/>in SLA?}:::dec
    D -- Yes --> E([Open for Submissions]):::pms
    D -- No  --> R([Auto-Reassign]):::auto
    R -. loop until accepted .-> C
    E --> F([Submissions]):::pms
      --> G([Interview Rounds]):::pms
      --> H([Offer · Hire]):::ok

    classDef hms  fill:#0B1F3A,stroke:#0B1F3A,color:#fff
    classDef pms  fill:#00A3A1,stroke:#00A3A1,color:#fff
    classDef ok   fill:#2E8B57,stroke:#2E8B57,color:#fff
    classDef dec  fill:#F58A07,stroke:#F58A07,color:#fff
    classDef auto fill:#C0392B,stroke:#C0392B,color:#fff
```

> Every HRQ has a clock. If the RM Owner doesn't accept in SLA, Throughline
> reassigns it automatically — no chasing.

---

## 3 · Partner Lifecycle (PMS)

```mermaid
flowchart LR
    A([Add Partner]):::pms --> B([Empanelment]):::pms
      --> C([SOW · Rate Card]):::pms
      --> D([Active Engagement]):::pms
      --> E([Performance Score]):::pms
      --> F{Meeting SLA &<br/>active in 30d?}:::dec
    F -- Yes --> G([Renew · Continue]):::ok
    F -- No  --> H([Auto-Deactivate]):::stop
    H -. re-empanel later .-> A

    classDef pms  fill:#0B1F3A,stroke:#0B1F3A,color:#fff
    classDef dec  fill:#F58A07,stroke:#F58A07,color:#fff
    classDef ok   fill:#2E8B57,stroke:#2E8B57,color:#fff
    classDef stop fill:#C0392B,stroke:#C0392B,color:#fff
```

> Vendors run as a portfolio. 30 days of inactivity triggers an automatic
> deactivation; re-empanelment is a deliberate decision later.

---

## 4 · Candidate Journey — Cart vs Bin

```mermaid
flowchart LR
    S([Submission]):::sub --> R{Initial<br/>Review?}:::dec
    R -- Approved --> Cart([Cart]):::ok
    R -- Flagged  --> Bin([Bin]):::stop

    Cart --> IR([Interview Rounds]):::sub --> Off([Offer · Hire]):::ok

    Bin --> RE{Re-evaluate?}:::dec
    RE -- Yes --> Cart
    RE -- No  --> Drop([Dropped]):::stop

    classDef sub  fill:#00A3A1,stroke:#00A3A1,color:#fff
    classDef ok   fill:#2E8B57,stroke:#2E8B57,color:#fff
    classDef stop fill:#C0392B,stroke:#C0392B,color:#fff
    classDef dec  fill:#F58A07,stroke:#F58A07,color:#fff
```

**Auto-rule** — 3 rejections from interviews → candidate moved to **Bin** and flagged for review.

> Cart accelerates approved candidates. Bin is the safety net — nothing leaves
> the system without an explicit decision.

---

## 5 · Interview Slot — Self-Serve Flow

```mermaid
flowchart LR
    P([Panel<br/>Publishes Slot]):::pms --> V([Vendor<br/>Views Slot]):::hms
      --> B([Vendor Books<br/>Candidate]):::hms
      --> D{Booked in<br/>validity?}:::dec
    D -- Yes --> I([Interview Held]):::pms --> F([Feedback Captured]):::ok
    D -- No  --> X([Slot Auto-Expires]):::stop
    X -. capacity returns to pool .-> P

    classDef hms  fill:#0B1F3A,stroke:#0B1F3A,color:#fff
    classDef pms  fill:#00A3A1,stroke:#00A3A1,color:#fff
    classDef ok   fill:#2E8B57,stroke:#2E8B57,color:#fff
    classDef stop fill:#C0392B,stroke:#C0392B,color:#fff
    classDef dec  fill:#F58A07,stroke:#F58A07,color:#fff
```

**Hourly job** — candidates rejected from 3 slots are auto-dropped from the active pipeline.

> Self-serve booking eliminates email back-and-forth. Auto-expiry means
> unbooked capacity is recycled — not lost.

---

## 6 · Onboarding — Day 0 → Day 90

```mermaid
timeline
    title Joiner Lifecycle
    Day 0  : Offer Accepted
    Day 1  : BGV Initiated
    Day 7  : Joining Date : Asset Allocation
    Day 14 : Training
    Day 30 : 30-Day Profile Check
    Day 60 : 60-Day Profile Check
    Day 90 : 90-Day Profile Check
```

**Continuously tracked on the candidate record**

- BGV status · Asset register · Training records
- Joining-reschedule history (with reason)
- 30 / 60 / 90-day progress

> One record from offer through Day 90. Reschedules and missed milestones
> surface immediately — joiners don't slip.

---

## 7 · Who Touches What — Roles × Stages

| Role | Raise HRQ | BET Approval | RM Accept | Vendor Alloc. | Slot & Interview | Feedback & Offer | BGV & Onboarding | Day 30/60/90 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Hiring Manager**  | ● | ○ | ○ |   | ○ | ● |   | ○ |
| **BET Approver**    |   | ● |   |   |   |   |   |   |
| **RM Owner**        |   | ○ | ● | ● | ○ | ○ |   | ○ |
| **Partner / Vendor**|   |   |   | ● | ● |   |   |   |
| **Panel**           |   |   |   |   | ● | ● |   |   |
| **Onboarding SPOC** |   |   |   |   |   | ○ | ● | ○ |
| **TA Lead**         | ○ |   |   |   |   |   | ○ | ● |

`●` Primary owner   ·   `○` Involved / approver

> One owner per stage. Other stakeholders are involved but never ambiguous
> about who's accountable.

---

<!-- _class: lead -->

# That's the flow.

Same shape as how a GCC already operates — just enforced and instrumented.

**Next**
- Walk one of these flows on your real data — 30-min discovery.
- Pick two domains for a 6-week pilot — measure TAT lift.
