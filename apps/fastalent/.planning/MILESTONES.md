# Milestones

## v1.0 — MVP / Pilot (Phases 1-4)

**Status:** Complete
**Phases:** 1-4
**Closed:** 2026-04-13

### What shipped:
- Phase 1: Foundation — monorepo, auth, RBAC, profiles, encryption, CI
- Phase 2: Core Marketplace — roles, submissions, CV upload, 7-state lifecycle, dedup
- Phase 3: Wallet & Payouts — double-entry ledger, Razorpay, earnings, platform fees
- Phase 4: Marketplace Intelligence — visibility, invitations, notifications, trust score, admin dashboard

### Verification:
- Phase 1: 17/17 smoke tests PASS
- Phase 2: 34/34 smoke tests PASS, 13 verification items GREEN
- Phase 3: No automated suite (gap)
- Phase 4: 28 E2E scripts (00-27), 43 verification checks GREEN

### Last phase number: 4

---

## v2.0 — UI/UX Overhaul + Rebrand + Platform Features (Phases 5-11)

**Status:** Complete
**Phases:** 5-11
**Closed:** 2026-04-23

### What shipped:
- Phase 5: Design System Foundation — Deep Teal OKLCH palette, Inter font, next-themes dark mode, fastalent rebrand, WCAG AA contrast
- Phase 6: Core Components + Layout — 15 shadcn primitives restyled, AppShell with role accents, breadcrumbs, PageHeader, StatCardV2, shimmer skeletons, AiSlot placeholder, form validation UX
- Phase 7: Navigation + Data Tables — TanStack Table v8 DataTable component library, RoleQuickView/SubmissionQuickView slide-overs, View Transitions CSS, NotificationBell sheet
- Phase 8: Dashboard Visualization — 7 Recharts chart components, AnimatedMetric, FeeCalculator, 3 dashboard redesigns
- Phase 9: Micro-Interactions — framer-motion (lazy), CSS button hover/press, card hover lift, dialog scale-in, notification stagger
- Phase 10: Page-by-Page Rollout — all pages migrated to design system, zero hardcoded colors, legacy component cleanup, TransactionQuickView, EarningQuickView, PayoutQuickView slide-overs, wallet search+filters
- Phase 11: Platform Feature Overhaul — PayoutMode (flat/percentage), RoleStatus approval workflow (submit→approve/reject with commission override), CountryConfig CRUD, CompanySavings calculator, AdminRoleDetail, AdminUserDetail, split registration, formatCurrency multi-currency, 36/36 E2E tests

### Verification:
- Phase 5: 5/5 must-haves PASSED, 6/6 requirements satisfied
- Phase 6: 24/24 must-haves PASSED, 9/9 requirements satisfied
- Phase 7: 23/23 must-haves PASSED, 5/5 requirements satisfied
- Phase 8: Dashboards functional with charts, animated metrics, tooltips
- Phase 9: 10/10 must-haves PASSED, 2/2 requirements satisfied
- Phase 10: Zero hardcoded colors, all pages on design system, codebase cleanup complete
- Phase 11: 36/36 E2E tests PASS, migration verified, type-check 3/3 clean

### Key metrics:
- 20 plans executed across 7 phases
- ~64 files changed in Phase 11 alone (+3303/-738 lines)
- Rebranded from GigCruite to fastalent across entire codebase
- 3 country configs seeded (IN, US, GB)

### Last phase number: 11

---

## v3.0 — Hiring Intelligence (Phases 12-16)

**Status:** Complete
**Phases:** 12-16
**Started:** 2026-04-23
**Closed:** 2026-05-07

### Vision:
Turn fastalent from a transaction platform into an intelligence platform. The KPI trifecta:
1. **Time-to-fill + consistency** — not just fast, but predictably fast (low stddev)
2. **Cost savings** — evolve CompanySavings into trend analytics with per-role drill-down
3. **Quality-of-hire** — correlate recruiter trust tier with hire retention, submission-to-hire ratio

### Key principle:
Compare against the platform's OWN growing dataset. No made-up industry benchmarks — every metric is relative to fastalent's historical performance.

### What shipped:
- Phase 12: Data Foundation — schema evolution, denormalized timestamps, structured rejection reasons, recruiter activity tracking, backfill migration (2026-04-24, commit 7cf39ff)
- Phase 13: Analytics API — 5 endpoints: funnel, time-to-fill, scorecard, cost-metrics, platform-health (2026-04-24, commit 0992c70)
- Phase 14: Role Performance UI — 3 dashboards: CompanyAnalytics (/c/analytics), RecruiterPerformance (/r/performance), AdminIntelligence (/a/intelligence) (2026-04-24, commit 076d81c)
- Phase 15: Analytics AI — anomaly detection (3 detectors), smart notifications, AI provider abstraction, BullMQ queues, AnomalyAlert + AiUsageLog models, AiAlertPanel, AdminAiDashboard (/a/ai) (2026-05-07, commit 5b21c8c)
- Phase 16: Matching AI — JD extraction, resume-JD matching (multi-signal scoring), PII redaction, bias audit, document parser (PDF/DOCX), matching worker, JdCrux model, JdCruxPanel, MatchScoreCard (2026-05-07, commit df69532)

### Verification:
- Phase 12: Schema verified, backfill migration applied
- Phase 13: 5 endpoints type-checked, API routes registered
- Phase 14: 3 dashboard pages with chart components, type-checked
- Phase 15: Anomaly service + AI provider + BullMQ worker, type-checked
- Phase 16: 4 services + routes + worker + frontend components, full monorepo build PASS

### Requirements: 27 (27 shipped)

### Last phase number: 16
