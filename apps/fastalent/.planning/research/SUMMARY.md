# Project Research Summary

**Project:** GigCruite v3.0 — Hiring Intelligence
**Domain:** AI-Powered Recruiting Analytics & Matching SaaS
**Researched:** 2026-04-24
**Confidence:** HIGH

## Executive Summary

GigCruite v3.0 introduces hiring intelligence through three core capabilities: analytics dashboards with KPI tracking (time-to-fill, cost-per-hire, funnel metrics), AI-powered resume-JD matching with semantic embeddings, and performance benchmarking against platform-native data. Research shows this is a mature domain with established patterns: use OpenAI embeddings for semantic matching, PostgreSQL window functions for analytics (no separate time-series DB needed at current scale), and pgvector for similarity search. The recommended stack is OpenAI SDK + pgvector + BullMQ for async processing, avoiding over-engineered frameworks like LangChain while maintaining provider abstraction for future flexibility.

The key insight from research is that hiring intelligence features fall into two distinct tracks: analytics (deterministic, SQL-heavy, low risk) and AI (probabilistic, API-dependent, high risk). Analytics can be built incrementally with standard web patterns. AI features require careful orchestration: cost monitoring from day one (uncontrolled OpenAI spend is the #1 pitfall), PII redaction for GDPR compliance, human-in-loop for high-stakes decisions, and robust error handling for rate limits and hallucinations. The recommended approach is to build analytics first (Phases 12-13) to establish data foundation and user trust, then layer AI matching (Phase 15) once the platform has historical data to validate against.

Critical risks include OpenAI cost explosion ($50 to $5,000/month without monitoring), AI bias litigation (99% of Fortune 500 use hiring automation, many face discrimination lawsuits), and PDF extraction failures (15-30% of resumes garble without OCR fallback). Mitigation strategies are well-documented: hard spend limits, model selection discipline (GPT-4o-mini for most tasks), embedding caching, bias audits, blind matching options, and DOCX preference over PDF. Research confidence is HIGH — all core recommendations verified with official docs, 2026 benchmarks, and production experience reports.

## Key Findings

### Recommended Stack

The research converged on a pragmatic, cost-effective stack that avoids over-engineering while maintaining flexibility. The core insight is to use OpenAI's official SDK with provider abstraction, PostgreSQL for both transactional and analytical workloads (no separate vector DB or time-series DB needed at <1M rows/year), and BullMQ for async AI processing with rate limit awareness.

**Core technologies:**
- **OpenAI SDK (v6.34+)** for embeddings and structured extraction — official TypeScript library with excellent type safety, supports streaming and retry logic. Use text-embedding-3-small ($0.02/M tokens, 62% MTEB score) for cost-performance balance and GPT-4o-mini ($0.20/M input) for resume analysis. Batch API offers 50% discount for non-real-time workloads.
- **pgvector (PostgreSQL extension)** for vector similarity search — enables embedding storage and similarity search directly in existing PostgreSQL 16 database without separate infrastructure. HNSW indexing provides <20ms queries at 1M vectors with 95%+ recall. Keeps embeddings co-located with relational Role/Submission records.
- **BullMQ (v5.32+)** for async AI job processing — Redis-backed queue with TypeScript-native design, handles rate limiting (OpenAI Tier 1 = 500 RPM), exponential backoff retry logic, and priority queues. Critical for avoiding 429 rate limit cascade failures during burst traffic.
- **pdf-parse (v1.1.1) + mammoth (v1.11.0)** for document extraction — PDF text extraction for resumes, DOCX parsing for job descriptions. pdf-parse is battle-tested (2M weekly downloads) for simple PDFs; DOCX extraction is 6/8 more reliable. OCR fallback (Tesseract.js or cloud) needed for scanned PDFs.
- **simple-statistics (v7.8.8)** for analytics computation — lightweight (10KB) pure JS library for percentiles, variance, standard deviation. Use for application-level distribution analysis (P50/P75/P90 benchmarks) while PostgreSQL handles time-series aggregates via window functions.

**Critical architecture decisions:**
- Use PostgreSQL window functions (LAG, LEAD, PARTITION BY) instead of TimescaleDB — current dataset (<100K roles/year, <500K submissions/year) doesn't justify extension complexity. Revisit at 5M+ rows.
- Use cosine similarity (<=> operator) for resume-JD matching — OpenAI embeddings are normalized unit vectors, cosine is standard for text. HNSW indexing over IVFFlat for better recall (95%+ vs. 85%).
- Provider abstraction from day one — create `src/lib/ai/provider.ts` interface that wraps OpenAI SDK. Enables switching to Anthropic/Gemini in <2 weeks vs. $315,000 average migration cost without abstraction.

### Expected Features

Research identified a clear MVP boundary based on table stakes vs. differentiators vs. future consideration. The 2026 recruiting analytics landscape shows time-to-fill, cost-per-hire, and pipeline funnels are mandatory (users assume they exist), while platform-native benchmarking and explainable AI are competitive differentiators.

**Must have (table stakes — v3.0):**
- Time-to-fill tracking (benchmark: 36-42 days in 2026) — already have publishedAt, firstSubmissionAt timestamps
- Cost-per-hire calculation (benchmark: $4,700 in 2026) — leverage existing commission engine plus platform fee
- Pipeline funnel visualization (3% applicants→interviews, 0.5%→hires industry benchmark) — conversion rates by stage
- Recruiter scorecard with submissions, placements, acceptance rate, avg time-to-fill
- JD structured extraction (required skills, experience, qualifications) via LLM with JSON schema output
- Resume parsing (skills, experience, education) from PDF/DOCX with validation + OCR fallback
- Resume-JD match score (0-100) with explanation — semantic matching, not just keyword
- Match score display on submission flow — show recruiter fit score before submitting candidate
- Anomaly detection (rule-based) — alert on stale roles (14+ days no activity), declining submission rates

**Should have (competitive advantage — v3.1+):**
- Platform-native benchmarking — compare against fastalent's own dataset filtered by role type/company size, not fabricated industry benchmarks
- AI-suggested submission notes — pre-fill notes with match reasoning to save recruiter time
- Resume gap analysis — show missing skills with severity (critical/nice-to-have) and why not 100% match
- Performance trend predictions — "Role will fill in X days at current rate" based on submission velocity
- Contextual role recommendations — "Similar roles you might fit" based on recruiter profile and past placements
- Recruiter-role match prediction — suggest which recruiters to invite based on role requirements + recruiter history

**Defer (v4.0+ — high complexity):**
- Quality-of-hire scorecard (4-pillar: performance, retention, ramp-up, manager satisfaction) — requires post-hire tracking infrastructure, massive scope increase
- Video interview AI analysis — immature tech in 2026, high bias risk, low candidate trust
- ML-based anomaly detection — rule-based sufficient initially, ML when we have 6+ months dense time-series data
- Diversity analytics by stage — requires opt-in demographic collection, GDPR compliance, legal review

### Architecture Approach

The architecture research (from v2.0 UI/UX overhaul) established patterns that extend naturally to v3.0's analytics and AI layers. The existing design system (Tailwind v4 CSS tokens, shadcn/ui primitives, custom wrappers) provides the foundation for dashboard composition. The key architectural insight is to separate analytics (deterministic data transformations) from AI (probabilistic model inference) into distinct service layers with clear boundaries.

**Major components:**
1. **Data Foundation Layer (Phase 12)** — backfill timestamp fields (publishedAt, firstSubmissionAt, lastSubmissionAt), create HiringMetric aggregate model for role performance tracking, add schema support for embeddings (Unsupported("vector(1536)")) and AI extraction results (JDExtraction, ResumeExtraction, MatchScore tables).
2. **Analytics API Layer (Phase 13)** — REST endpoints for funnel metrics, time-series trends, scorecard calculations. Use TanStack Query for caching, PostgreSQL window functions for aggregates, ioredis for caching computed percentiles (24hr TTL). Date range filtering on all endpoints. Export to CSV/PDF deferred to v3.1+.
3. **Dashboard UI Layer (Phase 14)** — compose existing design system primitives (StatCardV2, ChartCard) with Recharts visualizations. Three dashboards: Company (hiring funnel, time-to-fill trend, top roles), Recruiter (submission trends, scorecard, recommended roles), Admin (platform health, top recruiters/companies, anomalies). Responsive design (desktop/tablet required, mobile deferred).
4. **AI Service Layer (Phase 15)** — provider-agnostic interface (`src/lib/ai/provider.ts`) wrapping OpenAI SDK, BullMQ job queue for async processing (embedding generation, batch analysis), pgvector similarity search for resume-JD matching. Token tracking middleware, cost monitoring dashboard, PII redaction with OpenAI Privacy Filter before API calls.

**Key architectural patterns:**
- **CSS-First Design Tokens (Tailwind v4)** — all colors, spacing, typography as CSS custom properties mapped to Tailwind utilities. Enables runtime theme switching.
- **shadcn/ui Wrapper Pattern** — custom components extend shadcn primitives with business logic. Keep ui/ folder pristine, add wrappers in custom/.
- **Recharts Composition with Feature Hooks** — chart components receive typed data from TanStack Query hooks, handle responsive sizing and loading states.
- **Provider Abstraction for AI** — interface defines capabilities (embeddings, structured extraction), OpenAI is default implementation, swappable to Anthropic/Gemini by implementing interface.
- **BullMQ for Background AI Processing** — serialize OpenAI calls with rate limiting (60 jobs/min for Tier 1 500 RPM with buffer), exponential backoff retry, priority queues (urgent submissions > batch backfill).

### Critical Pitfalls

Research identified 10 major pitfalls, with the top 5 posing the highest risk to v3.0 launch:

1. **Uncontrolled OpenAI API Cost Explosion** — monthly bills escalate from $50 to $5,000+ due to per-token billing without monitoring. Prevention: set hard spend limits ($100-500 for MVP), use GPT-4o-mini ($0.20/M input) instead of GPT-4o ($2.50/M), cache embeddings (regenerate only on content change), use Batch API for 50% discount on async workloads, implement token tracking middleware with daily alerts. Estimated cost at 100 resumes/day: $7/month with discipline, $71/month at 1,000/day.

2. **PDF/DOCX Text Extraction Failures** — 15-30% of resumes return garbled text due to ligatures, multi-column layouts, scanned PDFs without OCR, font subset parsing failures. Prevention: prefer DOCX uploads (85-90% reliability vs. 60-75% for text PDFs), integrate OCR fallback (Tesseract.js or Google Vision) for image-based PDFs, validate extracted text (length >100 chars, word count >20), provide user feedback ("Try .docx or recreate PDF as text-based"), flag failed extractions for manual review queue.

3. **AI Hallucination in Resume Analysis & JD Parsing** — LLMs fabricate skills or experiences not present in resume text (15-20% hallucination rate for GPT-4o/GPT-5.x on complex queries in 2026). Prevention: use structured extraction prompts with JSON schema output requiring evidence quotes, set confidence thresholds (reject <80%), implement human-in-loop for shortlisting decisions, cross-reference extracted skills against known taxonomy, set temperature=0 for deterministic extraction, include "do not invent" examples in system prompt.

4. **OpenAI Rate Limit Cascade Failures** — burst traffic (50 resume uploads in 5 minutes) triggers 429 errors, OpenAI SDK throws exception without retry, user sees "System error." Prevention: upgrade to Tier 1 ($5+ spent) for 500 RPM before launch, use BullMQ to serialize OpenAI calls respecting rate limits, configure maxRetries=5 in SDK, implement circuit breaker (pause 60s after 3 consecutive 429s), use Batch API for non-urgent tasks (no rate limits), separate API keys for dev/staging/prod to isolate usage.

5. **PII/GDPR Violations from Sending Resume Data to OpenAI** — full resume text contains 8+ PII categories (names, emails, phones, addresses, URLs, dates) violating GDPR Article 5 (data minimization) and Article 32 (security). Prevention: integrate OpenAI Privacy Filter to redact PII locally before API calls, use regex-based redaction for emails/phones, sign Data Processing Addendum with OpenAI (available for paid tiers), enable Enterprise tier with 0-day retention if needed, obtain user consent ("resume analysis uses AI provider"), minimize payload (send only skills/experience sections, not contact details).

**Other notable pitfalls:**
- Provider lock-in (200+ direct OpenAI SDK calls → $315K average migration cost)
- Embedding quality issues (wrong model or chunking strategy → poor match accuracy)
- Async AI processing UX failures (15s spinners → 40% bounce rate)
- AI bias litigation (systematic name-based discrimination → EEOC investigation)
- Prompt injection attacks (resume contains "Ignore previous instructions" → data leak)

## Implications for Roadmap

Based on research, the optimal phase structure separates data foundation (deterministic, low-risk) from AI features (probabilistic, high-risk), with analytics in between to establish user trust and validate historical data before launching AI matching.

### Phase 12: Data Foundation & Timestamp Backfill
**Rationale:** Analytics and AI both require accurate timestamp tracking (publishedAt, firstSubmissionAt, lastSubmissionAt) to calculate time-to-fill and submission velocity. Schema changes (vector embeddings, AI extraction results) must precede API development. Backfilling existing data ensures historical analytics work correctly.

**Delivers:**
- Timestamp backfill on existing roles/submissions
- HiringMetric aggregate model for role performance tracking
- Schema support for embeddings (Unsupported("vector(1536)"))
- JDExtraction, ResumeExtraction, MatchScore tables for AI results
- pgvector extension installed on PostgreSQL 16 instance
- Migration + backfill script

**Addresses (from FEATURES.md):**
- Foundation for time-to-fill tracking
- Foundation for cost-per-hire calculation
- Foundation for submission-to-hire ratio

**Avoids (from PITFALLS.md):**
- Inaccurate analytics due to missing timestamps
- Schema changes breaking production during AI rollout

**Research flag:** Standard pattern, no additional research needed. Well-documented Prisma migration + PostgreSQL extension setup.

---

### Phase 13: Analytics API & Metrics Computation
**Rationale:** Build analytics endpoints before AI features to establish user trust with deterministic, verifiable metrics. PostgreSQL window functions handle time-series queries efficiently at current scale (<1M rows/year). Caching layer (Redis) reduces query load for dashboard-heavy usage.

**Delivers:**
- REST endpoints: /api/v1/analytics/funnel, /analytics/time-to-fill, /analytics/recruiter-scorecard
- PostgreSQL window function queries (LAG, LEAD, PARTITION BY for month-over-month trends)
- Application-level percentile computation (simple-statistics for P50/P75/P90 benchmarks)
- Redis caching for computed percentiles (24hr TTL, invalidate on role closures)
- Date range filtering on all endpoints (last 7/30/90 days, custom ranges)
- TanStack Query integration for frontend caching

**Uses (from STACK.md):**
- PostgreSQL window functions (no TimescaleDB needed)
- simple-statistics (v7.8.8) for percentiles
- ioredis (existing) for caching aggregates

**Implements (from ARCHITECTURE.md):**
- Analytics API Layer
- Data flow: Page → useFeatureHook() → TanStack Query → Cached Data

**Avoids (from PITFALLS.md):**
- Analytics query performance traps (indexes on createdAt, status, companyId)
- Unbounded context (time-series queries scoped to 12 months max)

**Research flag:** Standard pattern, no additional research needed. Well-established PostgreSQL analytics optimization patterns.

---

### Phase 14: Role Performance UI & Dashboards
**Rationale:** Compose existing design system primitives (StatCardV2, ChartCard from v2.0) with Recharts to visualize analytics data. Three distinct dashboards for company, recruiter, and admin roles. UI layer depends on Analytics API completion (Phase 13).

**Delivers:**
- Company Hiring Analytics page (funnel chart, time-to-fill trend, top roles table, recruiter performance table)
- Recruiter Performance Dashboard (submission trends bar chart, scorecard table with platform benchmarks, recommended roles cards, recent activity timeline)
- Admin Intelligence Dashboard (platform health multi-line chart, top recruiters/companies tables, anomaly alert cards)
- Responsive design (desktop/tablet required, mobile deferred)
- Loading states (skeleton UI), error boundaries
- Date range pickers for all dashboards

**Uses (from STACK.md):**
- Recharts (existing from v2.0) for BarChart, LineChart, FunnelChart
- StatCardV2, ChartCard (custom wrappers from v2.0)
- TanStack Query for data fetching

**Implements (from ARCHITECTURE.md):**
- Dashboard UI Layer
- Recharts Composition with Feature Hooks pattern
- GPU-Accelerated Animations for micro-interactions

**Avoids (from PITFALLS.md):**
- Async UX failures (use skeleton UI during loading, <2s query times)
- Real-time auto-refresh overload (30s polling for active pipeline, 5min for dashboards)

**Research flag:** Standard pattern, no additional research needed. Recharts composition well-documented, existing design system covers all primitives.

---

### Phase 15: AI Layer (Resume Matching, JD Extraction, Anomaly Detection)
**Rationale:** AI features require careful orchestration and risk mitigation. Build provider abstraction from day one to avoid vendor lock-in. Implement cost monitoring, PII redaction, and human-in-loop before exposing AI to users. Validate against historical hiring data from Phases 12-13.

**Delivers:**
- Provider-agnostic AI interface (`src/lib/ai/provider.ts` wrapping OpenAI SDK)
- OpenAI integration: text-embedding-3-small for embeddings, GPT-4o-mini for structured extraction
- BullMQ job queue for async AI processing (rate limiting 60 jobs/min, exponential backoff retry)
- pgvector similarity search for resume-JD matching (cosine distance, HNSW index)
- JD structured extraction (required skills, experience level, qualifications) with JSON schema output
- Resume parsing (skills, experience, education) from PDF/DOCX with validation + OCR fallback
- Match score computation (0-100) with explanation (skills %, experience %, education %)
- Recruiter-role match suggestions ("3 roles match your expertise" on dashboard)
- Anomaly detection (rule-based: stale roles 14+ days, submission velocity drops)
- Token tracking middleware + cost monitoring dashboard
- OpenAI Privacy Filter integration for PII redaction
- Bias audit tooling (test with diverse name variations)

**Uses (from STACK.md):**
- OpenAI SDK (v6.34+), text-embedding-3-small, GPT-4o-mini
- pgvector (v0.2.0) with HNSW indexing
- BullMQ (v5.32.3) for job queue
- pdf-parse (v1.1.1) + mammoth (v1.11.0) for document extraction
- simple-statistics (v7.8.8) for anomaly detection (z-score, IQR)

**Implements (from ARCHITECTURE.md):**
- AI Service Layer
- Provider Abstraction for AI pattern
- BullMQ for Background AI Processing pattern
- Embedding Storage pattern (PostgreSQL + pgvector)

**Avoids (from PITFALLS.md):**
- Uncontrolled OpenAI cost explosion (hard spend limits, caching, Batch API)
- PDF extraction failures (DOCX preference, OCR fallback, validation)
- AI hallucinations (structured extraction, confidence thresholds, human-in-loop)
- Rate limit cascade failures (BullMQ queue, circuit breaker, Tier 1 upgrade)
- PII/GDPR violations (Privacy Filter, DPA signing, user consent)
- Provider lock-in (abstraction layer from day one)
- Embedding quality issues (chunking by section, hybrid search 70% semantic + 30% keyword)
- Async UX failures (SSE streaming, progress indicators, optimistic UI)
- AI bias (blind matching option, bias audit, fairness metrics)
- Prompt injection attacks (input sanitization, output validation, least privilege)

**Research flag:** Complex integration, but well-documented patterns. Monitor closely during implementation:
- OpenAI API integration (rate limits, error handling, streaming)
- pgvector setup (extension installation, index tuning, query optimization)
- BullMQ job patterns (retry strategies, priority queues, concurrency limits)
- PII redaction accuracy (test Privacy Filter against diverse resume formats)
- Bias audit methodology (synthetic resume generation, score disparity measurement)

---

### Phase Ordering Rationale

**Why this order:**
1. **Data Foundation first (Phase 12)** — analytics and AI both depend on accurate timestamp tracking and schema support for embeddings. Backfilling historical data ensures analytics work correctly from day one. Schema changes are risky in production; better to complete before feature development.
2. **Analytics before AI (Phases 13-14)** — analytics features are deterministic, low-risk, and establish user trust. Dashboards provide immediate value (time-to-fill, cost-per-hire) while AI features are being built. Historical analytics data becomes ground truth for validating AI match scores (compare against actual hires).
3. **AI last (Phase 15)** — AI features are high-risk, high-complexity, and depend on historical data from analytics. Provider abstraction, cost monitoring, PII redaction, and bias auditing must be architected carefully. Building AI first (without analytics foundation) would make validation impossible and expose users to unverified recommendations.

**Why this grouping:**
- **Phase 12 (Data)** isolated because schema changes affect all downstream phases — complete first to avoid breaking changes
- **Phases 13-14 (Analytics)** paired because UI directly consumes API endpoints — build API, then UI immediately after for fast feedback loop
- **Phase 15 (AI)** standalone because it's orthogonal to analytics (different service layer, different risk profile, different testing strategy) — can develop in parallel with analytics UI if resources allow, but launch after analytics stabilizes

**How this avoids pitfalls:**
- Analytics-first approach establishes trust before introducing probabilistic AI recommendations
- Historical data from analytics enables AI validation (test match scores against known good hires)
- Phased rollout allows cost monitoring and bias auditing before scaling AI usage
- Clear dependencies prevent "looks done but isn't" scenarios (e.g., AI matching without historical data to validate against)

### Research Flags

**Phases with standard patterns (no additional research needed):**
- **Phase 12 (Data Foundation)** — Prisma migrations, PostgreSQL extensions, backfill scripts are well-documented patterns
- **Phase 13 (Analytics API)** — PostgreSQL window functions, TanStack Query, Redis caching are established patterns
- **Phase 14 (Dashboard UI)** — Recharts composition, existing design system, responsive layouts are proven patterns

**Phases needing close monitoring during implementation:**
- **Phase 15 (AI Layer)** — while core patterns are well-documented, the combination of OpenAI + pgvector + BullMQ + PII redaction + bias auditing is complex. Key risks to monitor:
  - OpenAI rate limit handling in production burst scenarios
  - pgvector query performance at scale (monitor at 10K, 50K, 100K embeddings)
  - PII redaction accuracy across diverse resume formats
  - Bias audit methodology and score disparity thresholds
  - Cost tracking accuracy (token counting middleware)
  - Recommendation: run Phase 15 with feature flag, shadow mode (log AI recommendations without showing to users) for 1-2 weeks to validate before full launch

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies (OpenAI SDK, pgvector, BullMQ, pdf-parse, simple-statistics) verified with official docs and npm registry. Version compatibility confirmed. Cost estimates based on OpenAI pricing calculator. PostgreSQL patterns validated against 2026 analytics optimization guides. |
| Features | MEDIUM | Feature list based on 2026 recruiting analytics benchmarks and competitor analysis (Greenhouse, Lever, Phenom). Table stakes vs. differentiators validated across 10+ industry sources. MVP boundary clear, but v3.1+ prioritization may shift based on user feedback post-launch. |
| Architecture | HIGH | Architecture patterns from v2.0 (design system, TanStack Query, Recharts) proven in production. Provider abstraction, BullMQ job queues, pgvector similarity search are established patterns with extensive documentation. Clear component boundaries and data flow. |
| Pitfalls | HIGH | All 10 critical pitfalls validated with official sources (OWASP Top 10 LLM, OpenAI documentation, University of Washington bias study, GDPR compliance guides). Prevention strategies based on production experience reports and 2026 AI recruiting failure analysis. Recovery costs estimated from industry data ($315K average migration cost for provider lock-in). |

**Overall confidence:** HIGH

### Gaps to Address

While research confidence is high overall, the following areas need validation during implementation:

- **pgvector performance at scale** — research shows <20ms queries at 1M vectors, but production workload patterns (concurrent searches, bulk inserts) need real-world testing. Plan: monitor query performance at 10K, 50K, 100K embeddings; upgrade EC2 instance (t3.micro → t3.small) if RAM exceeds 1GB; consider IVFFlat index if HNSW memory becomes issue.

- **OpenAI Privacy Filter accuracy** — OpenAI's PII redaction model (open-weight, on-device) is new (launched 2026). Accuracy on diverse resume formats (LaTeX PDFs, creative designs, non-English names) unknown. Plan: test against 100 synthetic resumes with varied formats, measure redaction recall (% of PII caught) and precision (% of false positives). If <90% recall, fall back to regex + manual review queue.

- **Bias audit methodology** — research identifies bias risk (University of Washington study: 85% preference for white-associated names), but specific audit methodology for fastalent's context needs design. Plan: generate synthetic resumes with equivalent qualifications but varied names (stereotypically white/Black/Hispanic/Asian, male/female), measure match score disparities, flag >10% difference for manual review. Consult employment lawyer before launch in CA/CO.

- **Cost model validation** — research estimates $7/month at 100 resumes/day, $71/month at 1,000/day based on OpenAI pricing calculator. Real-world prompt lengths and embedding dimensions may vary. Plan: implement token tracking middleware from day one, monitor actual vs. estimated costs weekly, adjust model selection (GPT-4o-mini vs. GPT-4o, text-embedding-3-small vs. -large) based on usage patterns.

- **Platform-native benchmarking thresholds** — research recommends comparing against fastalent's own dataset, but meaningful comparison requires minimum data volume. Plan: defer benchmarking UI to v3.1+ until platform has 50+ closed roles with placement data across multiple role categories. Use simple percentile ranking initially (e.g., "Your time-to-fill is faster than 68% of platform roles").

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- [OpenAI npm package](https://www.npmjs.com/package/openai) — Version 6.34.0, TypeScript SDK documentation
- [OpenAI API Reference (TypeScript)](https://developers.openai.com/api/reference/typescript) — Official API docs
- [@openai/agents npm](https://www.npmjs.com/package/@openai/agents) — Provider-agnostic agent framework
- [pgvector GitHub](https://github.com/pgvector/pgvector) — PostgreSQL vector extension
- [pgvector-node GitHub](https://github.com/pgvector/pgvector-node) — Node.js/TypeScript support
- [BullMQ Documentation](https://docs.bullmq.io/) — Job queue patterns, retry strategies
- [PostgreSQL Window Functions Docs](https://www.postgresql.org/docs/current/functions-window.html) — Official PG18 docs
- [simple-statistics npm](https://www.npmjs.com/package/simple-statistics) — Statistical methods library

**Features Research:**
- [Recruitment Analytics Guide: Unlock Smarter Hiring in 2026 | Klearskill](https://www.klearskill.com/blog/recruitment-analytics)
- [10 Recruitment KPIs for better quality, speed and ROI in 2026 - Tracker](https://www.tracker-rms.com/blog/10-recruitment-kpis/)
- [How AI Resume Parsing & Matching Improve Recruitment Accuracy](https://www.eximius.ai/blog-ai-resume-parsing-and-matching-how-intelligent-algorithms-improve-recruitment-accuracy)
- [AI Scoring for Applicants: How It Works in 2026 | GoPerfect](https://www.goperfect.com/blog/ai-scoring-for-applicants-how-explainable-match-scores-are-changing-recruiting-in-2026)

**Pitfalls Research:**
- [OpenAI Rate Limits Guide](https://developers.openai.com/api/docs/guides/rate-limits) — Official rate limit documentation
- [OpenAI Privacy Filter](https://openai.com/index/introducing-openai-privacy-filter/) — PII redaction model
- [Security and privacy at OpenAI](https://openai.com/security-and-privacy/) — GDPR compliance, DPA
- [LLM01:2025 Prompt Injection - OWASP Gen AI Security Project](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — OWASP Top 10 LLM risks
- [AI tools show biases in ranking job applicants | UW News](https://www.washington.edu/news/2024/10/31/ai-bias-resume-screening-race-gender/) — University of Washington bias study

### Secondary (MEDIUM confidence)

**Stack Research:**
- [LangChain vs Vercel AI SDK vs OpenAI SDK: 2026 Guide](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) — Framework comparison
- [PostgreSQL Analytics Optimization (2026)](https://oneuptime.com/blog/post/2026-01-25-optimize-postgresql-analytics-workloads/view) — work_mem tuning
- [PostgreSQL Vector Search Guide (pgvector)](https://calmops.com/database/postgresql-vector-search-pgvector-2026/) — HNSW vs IVFFlat indexing

**Features Research:**
- [Recruitment Dashboard: Metrics, Examples, & How To Build One - AIHR](https://www.aihr.com/blog/recruitment-dashboard/) — Dashboard UX patterns
- [Quality of hire: The KPI you need to measure in 2026 | Jobylon](https://www.jobylon.com/blog/quality-of-hire) — 4-pillar scorecard approach
- [Why 73% of AI Recruiting Projects Fail (And How to Succeed)](https://www.sensehq.com/blog/why-73-of-ai-recruiting-projects-fail-and-how-to-succeed) — Failure mode analysis

**Pitfalls Research:**
- [AI API Error Handling: Fix 429, 401, 500 Errors (2026)](https://ofox.ai/blog/ai-api-error-handling-troubleshooting-guide-2026/) — Rate limit handling patterns
- [AI Hallucination Statistics: Research Report 2026](https://suprmind.ai/hub/insights/ai-hallucination-statistics-research-report-2026/) — 15-20% hallucination rate
- [OpenAI API Cost In 2026: Every Model Compared](https://www.cloudzero.com/blog/openai-pricing/) — Cost estimation guide
- [OpenAI API Vendor Lock-in: Escape with Multi-Provider Approach](https://modelslab.com/blog/api/openai-vendor-lock-in-multi-provider-api-2026) — Abstraction layer patterns

### Tertiary (LOW confidence)

**Features Research:**
- [10 Best Talent Marketplace Platforms Reviewed In 2026](https://www.recruiterslineup.com/best-talent-marketplace-platforms-reviewed/) — General marketplace patterns (needs validation)

**Pitfalls Research:**
- [Resume Prompt Injection: Why It Fails & What Works (2026)](https://yotru.com/blog/job-seekers-are-hiding-ai-prompts-in-their-resumes-here-s-why-that-s-a-terrible-idea) — Prompt injection UX patterns (anecdotal)

---
*Research completed: 2026-04-24*
*Ready for roadmap: yes*
