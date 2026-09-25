# fastalent

## What This Is

AI-powered, trust-first gig recruiting marketplace SaaS. Companies post roles with agency fee structures (6-9% regular, 15-20% headhunting), recruiters browse and submit candidates with CVs, and the platform manages the full lifecycle — submissions, status transitions, wallet funding, earnings, payouts — with built-in trust scoring, admin oversight, and hiring intelligence analytics. Branded as **fastalent**.

## Core Value

Companies and recruiters transact on verified placements with escrowed payouts, trust scores, and full audit trails — eliminating the opacity of traditional agency relationships.

## Current Milestone: v3.0 Hiring Intelligence

**Goal:** Turn fastalent from a transaction platform into an intelligence platform — analytics, dashboards, and AI-powered matching.

**Target features:**
- Data foundation for analytics (schema + backfill) — SHIPPED (Phase 12)
- Analytics API (funnel, time-to-fill, scorecards, cost metrics)
- Role performance dashboards (company, recruiter, admin)
- Analytics AI (prediction, anomaly detection, smart notifications)
- Matching AI (JD crux extraction, resume-JD match scoring)

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ **AUTH**: Full auth system — register, login, JWT refresh rotation, reuse detection, RBAC, email verify/reset (v1.0 Phase 1)
- ✓ **PROFILES**: Recruiter + company profiles with AES-256-GCM PAN/bank encryption + masking (v1.0 Phase 1)
- ✓ **ROLES**: Role CRUD — create/publish/edit/pause/resume/close, payout validation, visibility (v1.0 Phase 2 + 4)
- ✓ **SUBMISSIONS**: Candidate submissions with S3 CV upload, magic-byte validation, SHA-256 dedup, race-safe caps, 7-state lifecycle (v1.0 Phase 2)
- ✓ **WALLET**: Double-entry wallet ledger, Razorpay funding + payouts, platform fee engine (v1.0 Phase 3)
- ✓ **EARNINGS**: Auto-created on shortlist/hire, commission calculation, payout requests + admin approval (v1.0 Phase 3)
- ✓ **VISIBILITY**: Role invite_only/preferred filtering, invitation CRUD, recruiter search (v1.0 Phase 4)
- ✓ **NOTIFICATIONS**: In-app notification system with triggers on status transitions, payouts, invitations (v1.0 Phase 4)
- ✓ **TRUST**: Reputation score/tier (bronze/silver/gold/platinum) from placement history (v1.0 Phase 4)
- ✓ **ADMIN**: Dashboard metrics, user management, role/earnings oversight, payout approval (v1.0 Phase 4)
- ✓ **CI**: GitHub Actions lint + type-check + build on PR (v1.0 Phase 1)
- ✓ **REBRAND**: fastalent identity — Deep Teal OKLCH palette, Inter font, all 33 pages restyled (v2.0 Phases 5-10)
- ✓ **DESIGN SYSTEM**: CSS tokens, shadcn/ui restyling, DataTable library, Recharts charts, skeletons, empty states (v2.0 Phases 5-10)
- ✓ **LAYOUT**: AppShell with sidebar + topbar, slide-over panels, View Transitions, responsive (v2.0 Phases 6-7)
- ✓ **ANIMATIONS**: framer-motion (lazy), micro-interactions, reduced-motion support (v2.0 Phase 9)
- ✓ **PLATFORM FEATURES**: PayoutMode, role approval workflow, CountryConfig, CompanySavings, admin detail pages (v2.0 Phase 11)
- ✓ **DATA FOUNDATION**: publishedAt/firstSubmissionAt on Role, lastSubmissionAt on RecruiterProfile, RejectionReason enum, HiringMetric model, backfill migration (v3.0 Phase 12)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Analytics API — funnel, time-to-fill, recruiter scorecards, company cost metrics, platform health
- [ ] Role Performance UI — company hiring analytics, recruiter performance dashboard, admin intelligence dashboard
- [ ] Analytics AI — recruiter-role matching prediction, anomaly detection, smart notifications
- [ ] Matching AI — JD crux extraction, resume-JD match scoring for recruiters

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- WebSocket real-time updates — TanStack Query polling sufficient for current scale
- Mobile native app — web-first SPA, mobile native is separate future effort
- PII redaction feature flag — future phase
- Candidate self-service accounts — recruiter-mediated always
- Next.js — React 18 + Vite 6 SPA only

## Context

- **Stack**: React 18 + Vite 6 + TypeScript strict, Tailwind v4 CSS-first, shadcn/ui, Express 5 + Prisma 7, PostgreSQL 16 + Redis 7 on AWS EC2
- **AI provider**: OpenAI (default), provider-agnostic abstraction for future swap to Claude/Gemini/etc
- **Current state**: 33 pages fully restyled, design system locked, Phase 12 data foundation shipped (HiringMetric, timestamps, rejection reasons)
- **Port allocation**: API=4000, Web=4001 (3xxx forbidden)
- **Infra**: AWS ap-south-1, S3 for CVs, Razorpay for payments, MailHog for dev email

## Constraints

- **Tech stack**: React 18 + Vite 6 SPA only (no Next.js, no SSR)
- **Tailwind v4**: CSS-first config (`@theme inline`), no `tailwind.config.js`
- **AI provider**: OpenAI default, must be provider-agnostic (clean abstraction layer)
- **Self-referential benchmarks**: All analytics compare against platform's OWN dataset, no fake industry benchmarks
- **Existing design system**: All new UI surfaces inherit v2.0 design system (tokens, DataTable, Recharts, slide-overs)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Deep Teal primary | People/trust-centric, recruiting warmth + professionalism | ✓ Good |
| Inter typography | Clean, professional, widely available, variable-weight | ✓ Good |
| Recharts for viz | Lightweight React charting, good DX, composable | ✓ Good |
| Rebrand to fastalent | Fresh identity, one word, memorable | ✓ Good |
| Phase UI before AI | AI surfaces inherit design system, no retrofitting | ✓ Good |
| Self-referential benchmarks | Platform's own data, not made-up industry averages | ✓ Good |
| OpenAI + provider-agnostic | Start with OpenAI, abstraction allows swap later | — Pending |
| Split AI into two phases | Phase 15 analytics AI, Phase 16 matching AI — cleaner atomic phases | — Pending |

---
*Last updated: 2026-04-24 after Phase 12 completion, expanding v3.0 scope with AI matching*
