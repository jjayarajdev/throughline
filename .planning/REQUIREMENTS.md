# Requirements — v3.0 Hiring Intelligence

**Defined:** 2026-04-24
**Core Value:** Companies and recruiters transact on verified placements with escrowed payouts, trust scores, and full audit trails — now powered by analytics and AI-driven matching.

## v3.0 Requirements

### Data Foundation (DATA) — SHIPPED (Phase 12)

- [x] **DATA-01**: publishedAt auto-set on role approval, backfilled for existing roles
- [x] **DATA-02**: firstSubmissionAt set on first submission per role
- [x] **DATA-03**: Structured RejectionReason enum on submission status events (8 values)
- [x] **DATA-04**: HiringMetric snapshot computed on role fill/close (daysToFill, costPerHire, submissionToHireRatio, funnel counts)
- [x] **DATA-05**: lastSubmissionAt tracked on recruiter profile, updated on every submission

### Analytics API (ANLY) — SHIPPED (Phase 13)

- [x] **ANLY-01**: API returns submission funnel (submitted → shortlisted → interview → hired → joined) with counts and conversion rates, filterable by role/company/recruiter/date range
- [x] **ANLY-02**: API returns time-to-fill statistics (average, median, P90) grouped by role type, company, or time period with trend over time
- [x] **ANLY-03**: API returns recruiter scorecard (conversion rate, avg time-to-hire, placement count, earnings total, tier trajectory, consistency score via stddev)
- [x] **ANLY-04**: API returns company cost metrics (cost per hire, effective agency fee %, savings trend, submission quality ratio, recruiter diversity)
- [x] **ANLY-05**: API returns platform health (marketplace funnel, total commission revenue, payout volume, active users, recruiter tier distribution)
- [x] **ANLY-06**: All analytics endpoints support `?from=&to=` date range filters and respond in <500ms on current dataset

### Dashboards (DASH) — SHIPPED (Phase 14)

- [x] **DASH-01**: Company sees hiring analytics page with time-to-fill trend chart, submission funnel per role, cost-per-hire comparison across roles, top-performing recruiters
- [x] **DASH-02**: Recruiter sees performance dashboard with personal funnel (submissions → hires), earnings trend, tier progression chart, consistency gauge, comparison against platform average
- [x] **DASH-03**: Admin sees intelligence dashboard with platform funnel chart, recruiter leaderboard (sortable by conversion/speed/volume), company spend trends, time-to-fill trends, KPI cards
- [x] **DASH-04**: CompanySavings is evolved into a tab within the broader Hiring Analytics page (not standalone)
- [x] **DASH-05**: All dashboards use lazy-loaded Recharts, skeleton loading states, responsive at desktop and tablet widths, date range pickers

### Analytics AI (AIAI) — SHIPPED (Phase 15)

- [x] **AIAI-01**: System detects anomalies — stale roles (14+ days no submissions), declining recruiter activity, unusual rejection rates — and surfaces actionable alerts
- [x] **AIAI-02**: Smart notifications delivered via existing notification system ("This role matches your expertise" for recruiters, "3 roles have no submissions this week" for admins)
- [x] **AIAI-03**: All AI predictions are explainable — each alert/recommendation shows the factors that triggered it

### Matching AI (MTCH) — SHIPPED (Phase 16)

- [x] **MTCH-01**: When a role has a JD (PDF/docx) and/or description, AI extracts structured crux (key skills, experience requirements, must-haves vs nice-to-haves, seniority level)
- [x] **MTCH-02**: Extracted JD crux is stored and surfaced to recruiters on the role detail/browse page as an AI-summarized brief
- [x] **MTCH-03**: When a recruiter is about to submit a candidate, AI compares CV/resume against the role's JD crux and produces a match rating (0-100 with category breakdown)
- [x] **MTCH-04**: Match score is displayed to the recruiter before submission with breakdown by skills match, experience match, qualification match
- [x] **MTCH-05**: System uses OpenAI embeddings + pgvector for semantic matching, not just keyword comparison

### AI Infrastructure (AINF) — SHIPPED (Phases 15-16)

- [x] **AINF-01**: Provider-agnostic AI abstraction layer — OpenAI as default implementation, swappable to Claude/Gemini by implementing interface
- [x] **AINF-02**: BullMQ async job queue for AI processing with rate limiting (respects OpenAI RPM), exponential backoff retry, priority queues
- [x] **AINF-03**: Token tracking middleware with cost monitoring, daily spend alerts, hard spend limits
- [x] **AINF-04**: PII redaction before sending resume/CV content to external AI provider (names, emails, phones, addresses stripped)
- [x] **AINF-05**: Bias audit tooling — test match scores with diverse name variations, flag >10% score disparity for review

## Future Requirements (v3.1+)

### Deferred Analytics
- **ANLY-F01**: Export analytics to CSV/PDF
- **ANLY-F02**: Custom date range presets (this quarter, YTD, fiscal year)
- **ANLY-F03**: Scheduled email reports (weekly/monthly digest)

### Deferred AI
- **MTCH-F01**: AI-suggested submission notes — pre-fill notes with match reasoning
- **MTCH-F02**: Resume gap analysis — show missing skills with severity (critical/nice-to-have)
- **MTCH-F03**: Performance trend predictions — "Role will fill in X days at current submission rate"
- **MTCH-F04**: Recruiter-role match prediction — suggest which recruiters to invite for a role
- **MTCH-F05**: Contextual role recommendations — "Similar roles you might fit" on recruiter dashboard

### Deferred Quality
- **QUAL-F01**: Quality-of-hire scorecard (performance, retention, ramp-up, manager satisfaction) — requires post-hire tracking
- **QUAL-F02**: ML-based anomaly detection — rule-based sufficient initially, ML when 6+ months dense data
- **QUAL-F03**: Diversity analytics by pipeline stage — requires opt-in demographic collection + legal review

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video interview AI analysis | Immature tech, high bias risk, low candidate trust |
| Real-time WebSocket analytics | TanStack Query polling sufficient at current scale |
| Mobile native dashboards | Web-first SPA, mobile native is separate effort |
| Multi-language resume parsing | English-only for MVP, defer internationalization |
| Candidate self-service AI tools | Recruiter-mediated platform — candidates don't interact directly |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | 12 | Complete |
| DATA-02 | 12 | Complete |
| DATA-03 | 12 | Complete |
| DATA-04 | 12 | Complete |
| DATA-05 | 12 | Complete |
| ANLY-01 | 13 | Complete |
| ANLY-02 | 13 | Complete |
| ANLY-03 | 13 | Complete |
| ANLY-04 | 13 | Complete |
| ANLY-05 | 13 | Complete |
| ANLY-06 | 13 | Complete |
| DASH-01 | 14 | Complete |
| DASH-02 | 14 | Complete |
| DASH-03 | 14 | Complete |
| DASH-04 | 14 | Complete |
| DASH-05 | 14 | Complete |
| AIAI-01 | 15 | Complete |
| AIAI-02 | 15 | Complete |
| AIAI-03 | 15 | Complete |
| AINF-01 | 15 | Complete |
| AINF-02 | 15 | Complete |
| AINF-03 | 15 | Complete |
| MTCH-01 | 16 | Complete |
| MTCH-02 | 16 | Complete |
| MTCH-03 | 16 | Complete |
| MTCH-04 | 16 | Complete |
| MTCH-05 | 16 | Complete |
| AINF-04 | 16 | Complete |
| AINF-05 | 16 | Complete |

**Coverage:**
- v3.0 requirements: 27 total (27 shipped)
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-24*
*Last updated: 2026-05-11 — all v3.0 requirements marked complete after Phase 16 ship*
