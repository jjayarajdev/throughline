# Roadmap: fastalent

## Milestones

- [x] **v1.0 MVP / Pilot** - Phases 1-4 (shipped 2026-04-13)
- [x] **v2.0 UI/UX Overhaul + Rebrand + Platform Features** - Phases 5-11 (shipped 2026-04-23)
- [x] **v3.0 Hiring Intelligence** - Phases 12-16 (shipped 2026-05-07)

## Phases

<details>
<summary>v1.0 MVP / Pilot (Phases 1-4) -- SHIPPED 2026-04-13</summary>

- Phase 1: Foundation -- monorepo, auth, RBAC, profiles, encryption, CI
- Phase 2: Core Marketplace -- roles, submissions, CV upload, 7-state lifecycle
- Phase 3: Wallet & Payouts -- double-entry ledger, Razorpay, earnings, platform fees
- Phase 4: Marketplace Intelligence -- visibility, invitations, notifications, trust score, admin dashboard

</details>

<details>
<summary>v2.0 UI/UX Overhaul + Rebrand + Platform Features (Phases 5-11) -- SHIPPED 2026-04-23</summary>

- Phase 5: Design System Foundation -- Deep Teal OKLCH palette, Inter font, dark mode, fastalent rebrand
- Phase 6: Core Components + Layout -- 15 shadcn primitives restyled, AppShell, breadcrumbs, StatCardV2
- Phase 7: Navigation + Data Tables -- DataTable library, slide-over panels, View Transitions
- Phase 8: Dashboard Visualization -- 7 Recharts charts, AnimatedMetric, 3 dashboard redesigns
- Phase 9: Micro-Interactions -- framer-motion (lazy), CSS hover/press, dialog animations
- Phase 10: Page-by-Page Rollout -- all pages on design system, color audit, codebase cleanup
- Phase 11: Platform Feature Overhaul -- payout modes, role approval, country config, savings, admin detail pages

</details>

### v3.0 Hiring Intelligence

- [x] **Phase 12: Data Foundation** - Schema evolution for analytics capture, denormalized timestamps, structured rejection reasons, recruiter activity tracking, backfill migration
- [x] **Phase 13: Analytics API** - Hiring funnel, time-to-fill, recruiter scorecards, company cost metrics, platform health endpoints
- [x] **Phase 14: Role Performance UI** - Company hiring analytics, recruiter performance dashboard, admin intelligence dashboard, evolve CompanySavings
- [x] **Phase 15: Analytics AI** - Anomaly detection, smart notifications, explainable predictions
- [x] **Phase 16: Matching AI** - JD extraction, resume-JD matching, PII redaction, bias audit

## Phase Details

<details>
<summary>v2.0 Phase Details (Phases 5-11) -- click to expand</summary>

### Phase 5: Design System Foundation
- Deep Teal OKLCH palette, Inter font, next-themes dark mode, fastalent rebrand, WCAG AA contrast

### Phase 6: Core Components + Layout
- 15 shadcn primitives restyled, AppShell/Topbar accent remap, breadcrumbs, PageHeader, StatCardV2, shimmer skeletons, AiSlot, form validation UX

### Phase 7: Navigation + Data Tables
- DataTable component library (TanStack Table v8 + 6 subcomponents), RoleQuickView/SubmissionQuickView slide-overs, View Transitions CSS, NotificationBell sheet

### Phase 8: Dashboard Visualization
- 7 Recharts chart components, AnimatedMetric, FeeCalculator, 3 dashboard redesigns

### Phase 9: Micro-Interactions
- framer-motion (lazy), CSS button hover/press, card hover lift, dialog scale-in, notification stagger

### Phase 10: Page-by-Page Rollout
- All pages on design system, zero hardcoded colors, legacy component cleanup, TransactionQuickView/EarningQuickView/PayoutQuickView slide-overs, wallet search+filters

### Phase 11: Platform Feature Overhaul
- PayoutMode (flat/percentage), RoleStatus approval workflow, CountryConfig CRUD, CompanySavings, AdminRoleDetail, AdminUserDetail, split registration, formatCurrency multi-currency, 36/36 E2E tests

</details>

### Phase 12: Data Foundation
**Goal**: Capture the data that fuels every analytics feature — denormalized timestamps, structured rejection reasons, and recruiter activity signals. Every day without this is lost benchmark data.

**Depends on**: Phase 11 (schema must be stable before adding analytics columns)

**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05

**Success Criteria** (what must be TRUE):
  1. `Role.publishedAt` is auto-set when admin approves, and backfilled for all existing published/filled roles from RoleStatusHistory
  2. Every rejection event stores a structured `rejectionReason` enum alongside the free-text `reason`
  3. `RecruiterProfile.lastSubmissionAt` updates on every new submission, and `submissionsLast30Days` is correct after backfill
  4. When a role is filled/closed, a `HiringMetric` row is created with: daysToFill, submissionCount, shortlistCount, hireCount, costPerHire, submissionToHireRatio
  5. All existing data is backfilled correctly — migration is idempotent and can be re-run safely

**Plans**: Complete (commit 7cf39ff)

### Phase 13: Analytics API
**Goal**: Expose hiring intelligence as API endpoints that the frontend can consume — funnel analysis, recruiter scorecards, company cost metrics, and platform health, all computed from the platform's OWN growing dataset.

**Depends on**: Phase 12 (analytics columns and HiringMetric must exist)

**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06

**Success Criteria** (what must be TRUE):
  1. Company can request submission funnel for their roles with conversion rates (submitted → shortlisted → interview → hired → joined) filtered by date range
  2. Recruiter can see their personal scorecard with conversion rate, avg time-to-hire, placement count, consistency score, and how they compare to platform average
  3. Admin can view platform health metrics — total roles, submissions, hires, revenue, active users, recruiter tier distribution — for any date range
  4. All analytics queries use indexed columns and respond in <500ms on current dataset size
  5. Time-to-fill statistics compare against the platform's OWN historical data, not fabricated industry benchmarks

**Plans**: Complete (commit 0992c70)

### Phase 14: Role Performance UI
**Goal**: Transform raw analytics into actionable dashboards — companies see their hiring efficiency, recruiters see their performance trajectory, admins see marketplace health. CompanySavings evolves into a full cost analytics page.

**Depends on**: Phase 13 (analytics endpoints must be live)

**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05

**Success Criteria** (what must be TRUE):
  1. Company sees hiring analytics page with time-to-fill trend chart, submission funnel per role, cost-per-hire comparison, top-performing recruiters, and evolved CompanySavings with trend over time
  2. Recruiter sees performance dashboard with personal funnel chart (submissions → hires), earnings trend, tier progression, consistency gauge, and platform average comparison
  3. Admin sees intelligence dashboard with platform funnel chart, recruiter leaderboard (sortable by conversion/speed/volume), company spend trends, time-to-fill trends by role type
  4. All dashboards load with skeleton states, render charts with Recharts, and work responsively at desktop and tablet widths
  5. Date range picker on all dashboards allows filtering by last 7/30/90 days or custom range

**Plans**: Complete (commit 076d81c)

### Phase 15: Analytics AI
**Goal**: The platform detects anomalies, surfaces actionable insights, and proactively notifies users of opportunities — all based on rule-based intelligence built on platform data.

**Depends on**: Phase 13 (analytics data must exist), Phase 14 (dashboards provide surface for alerts)

**Requirements**: AIAI-01, AIAI-02, AIAI-03, AINF-01, AINF-02, AINF-03

**Success Criteria** (what must be TRUE):
  1. System detects and surfaces anomalies: stale roles (14+ days no submissions), declining recruiter activity (50% drop in 30-day submission rate), unusual rejection rates (>80% rejection in role)
  2. Smart notifications delivered via existing notification system: "This role matches your expertise" for recruiters, "3 roles have no submissions this week" for companies/admins
  3. Each alert shows the triggering factors — "No submissions in 16 days (platform avg: 3 days for similar roles)"
  4. AI infrastructure ready: provider-agnostic abstraction layer with OpenAI as default, BullMQ queue for async AI processing, token tracking middleware with cost monitoring
  5. All AI predictions include explanations — no black-box recommendations

**Plans**: Complete (commit 5b21c8c)

### Phase 16: Matching AI
**Goal**: AI extracts structured crux from job descriptions and matches candidate resumes semantically, helping recruiters identify best-fit submissions before they submit.

**Depends on**: Phase 15 (AI infrastructure must exist)

**Requirements**: MTCH-01, MTCH-02, MTCH-03, MTCH-04, MTCH-05, AINF-04, AINF-05

**Success Criteria** (what must be TRUE):
  1. When company uploads a role with JD (PDF/docx), AI extracts structured crux (key skills, experience requirements, must-haves vs nice-to-haves, seniority level) and stores it
  2. Extracted JD crux is displayed on role detail page as AI-summarized brief visible to recruiters
  3. When recruiter submits candidate, AI compares resume against JD crux and produces match score (0-100) with category breakdown (skills %, experience %, qualifications %)
  4. Match score displayed before submission with explanation of why it's not 100% — missing skills, experience gap, qualification mismatch
  5. PII redaction in place before sending resume to AI provider — names, emails, phones, addresses stripped, bias audit tooling detects >10% score disparity across diverse name variations

**Plans**: Complete (commit df69532)

## Progress

**Execution Order:** 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-4 | v1.0 | -- | Complete | 2026-04-13 |
| 5-11 | v2.0 | 20 | Complete | 2026-04-23 |
| 12. Data Foundation | v3.0 | -- | Complete | 2026-04-24 |
| 13. Analytics API | v3.0 | -- | Complete | 2026-04-24 |
| 14. Role Performance UI | v3.0 | -- | Complete | 2026-04-24 |
| 15. Analytics AI | v3.0 | -- | Complete | 2026-05-07 |
| 16. Matching AI | v3.0 | -- | Complete | 2026-05-07 |

## Dependencies

```
v1.0 (Phases 1-4) → v2.0 (Phases 5-11) → v3.0 (Phases 12-16)

Phase 12 (data foundation — schema + backfill)
  |
  v
Phase 13 (analytics API — compute from captured data)
  |
  v
Phase 14 (performance UI — render analytics)
  |
  +---> Phase 15 (analytics AI — anomaly detection, smart notifications)
  |       |
  |       v
  |     Phase 16 (matching AI — JD extraction, resume matching)
```

**Key insight**: Phase 12 shipped 2026-04-24 (commit 7cf39ff). Phases 13-14 are the analytics track (deterministic, low-risk). Phases 15-16 are the AI track (probabilistic, high-risk) — built on AI infrastructure with provider abstraction, cost monitoring, PII redaction, and bias auditing.

**Phase separation rationale**: Phase 15 (Analytics AI) builds the AI infrastructure and applies it to analytics data (anomaly detection, smart notifications). Phase 16 (Matching AI) uses that infrastructure for resume-JD matching. Separating them allows Phase 15 to validate the AI layer before adding the complexity of document extraction and semantic matching.
