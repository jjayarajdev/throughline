# Stack Research — Hiring Intelligence AI Features

**Domain:** AI-Powered Analytics & Matching for Recruiting Marketplace SaaS
**Researched:** 2026-04-24
**Confidence:** HIGH

## Recommended Stack

### Core AI Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `openai` | ^6.34.0 | OpenAI API client for embeddings, text generation, and structured outputs | Official TypeScript library with excellent type safety (TS >= 4.9). Most mature SDK for OpenAI models, supports streaming, retry logic, and structured outputs. Industry standard for production LLM integration. |
| `@openai/agents` | latest | Provider-agnostic agent orchestration framework | Lightweight, production-ready multi-agent framework from OpenAI supporting OpenAI APIs and other providers. Includes formal primitives for Agents, Handoffs, Guardrails, and built-in Tracing. Enables future provider switching without architectural changes. |
| `pgvector` | ^0.2.0 | PostgreSQL vector similarity search | Node.js/TypeScript support for pgvector extension. Enables embedding storage and similarity search directly in existing PostgreSQL 16 database without adding separate vector DB infrastructure. Production-ready with <20ms query times at 1M vectors with HNSW indexing. |
| `bullmq` | ^5.32.3 | Redis-based job queue for background AI processing | Actively maintained successor to Bull with TypeScript-native design. Handles async AI operations (embedding generation, batch analysis) with retry logic, rate limiting, and priority queues. Superior performance and architecture compared to alternatives (Bee-Queue, Agenda). |

### Document Parsing

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pdf-parse` | ^1.1.1 | PDF text extraction | Resume/CV parsing in PDF format. 2M weekly downloads, proven stability. Simple API returns full text + metadata. Works synchronously for files <1MB, async API for larger files. Wraps pdf.js with minimal overhead. |
| `unpdf` | ^0.14.0 | Modern PDF extraction (alternative) | If edge runtime support needed or TypeScript-first DX preferred. Newer library (~200K weekly downloads) with excellent type definitions and ESM support. More future-proof than pdf-parse but less battle-tested. |
| `mammoth` | ^1.11.0 | DOCX to text/HTML conversion | Job Description parsing when uploaded as .docx. Converts .docx files from Word/Google Docs/LibreOffice to clean HTML or plain text. Includes TypeScript definitions (added v1.4.19). Best for semantic extraction from styled documents. |

### Analytics Computation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `simple-statistics` | ^7.8.8 | Statistical calculations (percentiles, variance, std dev) | Computing performance benchmarks, percentile rankings, distribution analysis for KPIs. Lightweight (~10KB), pure JS with no dependencies. Provides mean, median, mode, variance, standard deviation, percentile. Ideal for application-layer analytics. |
| `ioredis` | ^5.10.1 (existing) | Redis client for caching analytics aggregates | Already in stack. Use for caching computed percentiles, funnel metrics, and time-series aggregates to avoid recomputation. TTL-based cache invalidation for dashboard data. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^3.25.76 (existing) | Schema validation for AI inputs/outputs | Already in stack. Use for validating OpenAI structured outputs, JD parsing results, and analytics API responses. Ensures type safety at AI boundaries. |
| `node-cron` | ^4.2.1 (existing) | Scheduled analytics computation | Already in stack. Use for nightly/weekly analytics backfill jobs, model re-training triggers, anomaly detection sweeps. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Prisma Studio | Inspect vector embeddings and metrics | Run on port 4555. Useful for debugging pgvector data, viewing embedding dimensions, inspecting HiringMetric computations. |
| BullMQ Dashboard | Monitor AI job queues | Web UI for job inspection. Track embedding generation jobs, batch processing, retry failures. Available via `@bull-board/express`. |

## Installation

```bash
# Core AI (add to apps/api/package.json dependencies)
npm install openai@^6.34.0 @openai/agents pgvector@^0.2.0 bullmq@^5.32.3

# Document parsing
npm install pdf-parse@^1.1.1 mammoth@^1.11.0

# Analytics computation
npm install simple-statistics@^7.8.8

# Optional: unpdf as pdf-parse alternative
npm install unpdf@^0.14.0

# Dev tools (optional)
npm install -D @bull-board/express
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `openai` + `@openai/agents` | Vercel AI SDK (`ai` + `@ai-sdk/openai`) | If building streaming chat UI or need unified interface for 25+ providers from day one. Vercel AI SDK excels at streaming text generation and provider abstraction but adds framework overhead. Our use case (embeddings + structured outputs) doesn't benefit from streaming-first design. |
| `pgvector` (PostgreSQL extension) | Pinecone / Weaviate / Qdrant | If needing >10M vectors, complex metadata filtering at scale, or multi-tenancy isolation. Dedicated vector DBs offer better performance at massive scale but add infrastructure complexity, cost, and operational overhead. PostgreSQL 16 + pgvector handles <5M vectors efficiently and keeps data co-located with relational tables. |
| `pdf-parse` | `unpdf` | If deploying to edge runtimes (Cloudflare Workers, Deno Deploy) or prioritizing modern DX over battle-tested stability. `unpdf` has better TypeScript support and ESM-first design but 10x fewer downloads. Use `pdf-parse` for Node.js production workloads. |
| `bullmq` | `bee-queue` | If needing minimal dependencies and simple use cases without priority queues or monitoring UI. Bee-Queue is faster for basic jobs but lacks BullMQ's production features (built-in retries, rate limiting, job events, dashboard integration). Our AI workloads need sophisticated retry logic. |
| PostgreSQL native window functions | TimescaleDB extension | If time-series data exceeds 100M rows or need automatic data retention policies. TimescaleDB v2.26 (March 2026) adds 3.5x faster analytical queries via columnar storage. Our hiring metrics dataset (<1M rows/year) doesn't justify the complexity. Use native PostgreSQL window functions (`time_bucket()`, `PARTITION BY`) with continuous aggregates pattern. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain.js | Over-engineered for our use case. Adds 50+ dependencies for features we don't need (multi-step chains, memory systems, agent tooling). High abstraction layer obscures costs and rate limits. | Direct `openai` SDK + `@openai/agents` for orchestration. Explicit is better than implicit for production AI. |
| `node-nlp` or `wink-nlp` | Named Entity Recognition (NER) libraries designed for chatbots, not resume parsing. Require training data and can't match GPT-4o's zero-shot extraction quality. Added complexity with marginal accuracy gains. | OpenAI structured outputs with Zod schemas. Let the model handle entity extraction from resumes/JDs—no training required, higher accuracy. |
| InfluxDB / MongoDB for analytics | Separate time-series or document DBs add operational overhead (backups, monitoring, security). PostgreSQL 16 window functions + materialized views handle time-series analytics efficiently up to 10M rows. | PostgreSQL native features: `LAG()`, `LEAD()`, `ROW_NUMBER()`, materialized views with `REFRESH CONCURRENTLY`. Keep analytics queries in same DB as transactional data. |
| `bcrypt` for token hashing | Silent truncation at 72 bytes. Already documented in project memory—bcrypt is for passwords only. AI API keys and webhook secrets exceed 72 bytes. | `SHA-256` + `crypto.timingSafeEqual()` for token comparison (already pattern in codebase). |
| `bull` (deprecated) | Bull reached EOL in 2026. No new features, security patches only. Maintainers shifted focus to BullMQ. | `bullmq` — TypeScript-native successor with better architecture, active maintenance, and superior performance. |

## Stack Patterns by Variant

### Provider-Agnostic AI Pattern

**Current approach (OpenAI-first with abstraction):**
```typescript
// apps/api/src/lib/ai/provider.ts
interface AIProvider {
  generateEmbedding(text: string): Promise<number[]>;
  extractStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>;
}

class OpenAIProvider implements AIProvider {
  constructor(private client: OpenAI) {}

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async extractStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
    const response = await this.client.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [{ role: 'user', content: prompt }],
      response_format: zodResponseFormat(schema, 'result'),
    });
    return response.choices[0].message.parsed;
  }
}

// Singleton instance — swap for AnthropicProvider later if needed
export const ai = new OpenAIProvider(openai);
```

**Why this pattern:**
- Interface defines capabilities (embeddings, structured extraction)
- OpenAI is default implementation
- Swapping to Anthropic/Gemini requires implementing interface, not rewriting services
- No framework overhead (LangChain), just TypeScript interfaces

### Embedding Storage Pattern

**PostgreSQL + pgvector schema:**
```prisma
// prisma/schema.prisma
model JobDescriptionEmbedding {
  id        String   @id @default(uuid()) @db.Uuid
  roleId    String   @unique @map("role_id") @db.Uuid
  embedding Unsupported("vector(1536)")  // text-embedding-3-small dimension
  content   String   @db.Text           // Original JD text for re-embedding
  createdAt DateTime @default(now()) @map("created_at")

  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@map("job_description_embeddings")
}

model ResumeEmbedding {
  id           String   @id @default(uuid()) @db.Uuid
  submissionId String   @unique @map("submission_id") @db.Uuid
  embedding    Unsupported("vector(1536)")
  content      String   @db.Text
  createdAt    DateTime @default(now()) @map("created_at")

  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@map("resume_embeddings")
}
```

**Migration (Prisma + raw SQL):**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index for cosine similarity search
CREATE INDEX job_description_embeddings_embedding_idx
  ON job_description_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX resume_embeddings_embedding_idx
  ON resume_embeddings
  USING hnsw (embedding vector_cosine_ops);
```

**Similarity search (application-level with pgvector helper):**
```typescript
import { toSql } from 'pgvector/pg';

// Find top 10 resumes matching a JD
const jdEmbedding = await ai.generateEmbedding(jobDescription);

const results = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
  SELECT
    re.submission_id AS id,
    1 - (re.embedding <=> ${toSql(jdEmbedding)}) AS similarity
  FROM resume_embeddings re
  WHERE re.submission_id = ANY(${submissionIds}::uuid[])
  ORDER BY re.embedding <=> ${toSql(jdEmbedding)}
  LIMIT 10
`;
```

**Why pgvector over application-level cosine:**
- Indexed search: HNSW provides <20ms queries at 1M vectors (95%+ recall)
- Native operators: `<=>` (cosine), `<->` (L2), `<#>` (inner product)
- Co-located data: embeddings live next to relational Role/Submission records
- No separate infrastructure: uses existing PostgreSQL 16 + Redis stack

### Background AI Processing Pattern

**BullMQ integration for async AI tasks:**
```typescript
// apps/api/src/queues/ai.queue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { ai } from '../lib/ai/provider';

export const aiQueue = new Queue('ai-processing', { connection: redis });

export const aiWorker = new Worker(
  'ai-processing',
  async (job) => {
    switch (job.name) {
      case 'generate-jd-embedding':
        const { roleId, content } = job.data;
        const embedding = await ai.generateEmbedding(content);
        await prisma.jobDescriptionEmbedding.create({
          data: { roleId, embedding: toSql(embedding), content },
        });
        break;

      case 'match-resume-to-roles':
        // Batch processing for 100 resumes
        const { submissionIds } = job.data;
        for (const id of submissionIds) {
          // Rate-limited matching logic
        }
        break;
    }
  },
  {
    connection: redis,
    concurrency: 5,  // Max 5 parallel OpenAI requests
    limiter: {
      max: 60,       // 60 jobs per minute (OpenAI tier 1 = 500 RPM, keep buffer)
      duration: 60000,
    },
    settings: {
      backoffStrategy: (attemptsMade) => Math.min(attemptsMade * 2000, 30000),
    },
  }
);
```

**Why BullMQ for AI:**
- **Rate limiting:** OpenAI enforces RPM limits—BullMQ prevents 429 errors
- **Retry with backoff:** Transient failures (network, OpenAI downtime) auto-retry
- **Priority queues:** Urgent embeddings (new submission) > batch backfill
- **Observability:** Built-in job events, error tracking, completion metrics

### Analytics Computation Pattern

**PostgreSQL window functions + application-level percentiles:**
```typescript
// Database: time-to-fill trends with window functions
const trends = await prisma.$queryRaw<Array<{ month: string; avgDays: number; delta: number }>>`
  SELECT
    DATE_TRUNC('month', r.closed_at) AS month,
    AVG(hm.days_to_fill) AS avg_days,
    AVG(hm.days_to_fill) - LAG(AVG(hm.days_to_fill)) OVER (ORDER BY DATE_TRUNC('month', r.closed_at)) AS delta
  FROM hiring_metrics hm
  JOIN roles r ON r.id = hm.role_id
  WHERE r.company_id = ${companyId}
    AND r.status = 'filled'
    AND r.closed_at >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', r.closed_at)
  ORDER BY month DESC
`;

// Application: percentile ranking (simple-statistics)
import ss from 'simple-statistics';

const allTimeToFill = await prisma.hiringMetric.findMany({
  where: { daysToFill: { not: null } },
  select: { daysToFill: true },
});

const values = allTimeToFill.map(m => m.daysToFill!);
const p50 = ss.quantile(values, 0.5);  // Median
const p75 = ss.quantile(values, 0.75);
const p90 = ss.quantile(values, 0.90);

// Compare company's current role against platform benchmarks
const currentRoleDays = 14;
const percentileRank = ss.quantileRank(values, currentRoleDays);
// Returns: "Your role is faster than 68% of platform roles"
```

**Why hybrid approach:**
- **PostgreSQL for time-series aggregates:** `LAG()`, `LEAD()`, `DATE_TRUNC()` handle month-over-month trends efficiently
- **Application-level for percentiles:** `simple-statistics` provides distribution analysis without complex SQL
- **Caching layer (Redis):** Store computed percentiles with 24hr TTL, invalidate on new role closures

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `openai@^6.34.0` | Node.js >= 18, TypeScript >= 4.9 | Official SDK requires modern Node (fetch API). Works with existing Express 5 + Prisma 7 stack. |
| `pgvector@^0.2.0` | PostgreSQL >= 11, Prisma >= 5.0 | Requires `pgvector` extension installed in PG16 instance (already running on EC2 `i-07e43ad3a1c571e3d`). Use `Unsupported("vector(1536)")` in Prisma schema until Prisma 7 native support lands. |
| `bullmq@^5.32.3` | ioredis >= 5.0, Redis >= 6.2 | Already using ioredis@^5.10.1 and Redis 7 on EC2. Direct compatibility. |
| `pdf-parse@^1.1.1` | Node.js >= 18 | Pure JS, no native dependencies. Works in existing stack. |
| `mammoth@^1.11.0` | Node.js >= 18 | Pure JS, includes TypeScript definitions. |
| `simple-statistics@^7.8.8` | Node.js >= 12, works in browser | Zero dependencies, pure JS. Lightweight (10KB). |

## PostgreSQL Extension Setup

**Enable pgvector on existing EC2 PostgreSQL 16 instance:**

```bash
# SSH into EC2 instance (3.110.106.118)
ssh -i ~/.ssh/gigcruite-ec2-key.pem ubuntu@3.110.106.118

# Install pgvector extension
sudo apt update
sudo apt install postgresql-16-pgvector

# Connect to database
psql -U postgres -d gigcruite_dev

# Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Prisma migration for vector columns:**
```bash
# Create migration with raw SQL
npx prisma migrate dev --name add_vector_embeddings --create-only

# Edit migration file to add:
# CREATE EXTENSION IF NOT EXISTS vector;
# ALTER TABLE job_description_embeddings ADD COLUMN embedding vector(1536);
# CREATE INDEX ... USING hnsw (embedding vector_cosine_ops);

npx prisma migrate dev
```

## Cost Estimates (OpenAI API)

**Embedding generation (text-embedding-3-small):**
- Cost: $0.02 per 1M tokens (~750K words)
- Batch API: $0.01 per 1M tokens (50% discount for non-real-time)
- Average JD: ~500 tokens → $0.00001 per embedding
- Average resume: ~800 tokens → $0.000016 per embedding
- **1000 roles/month:** $0.01 + 5000 submissions → $0.08 = **~$0.10/month for embeddings**

**Structured extraction (gpt-4o-2024-08-06):**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- JD crux extraction: ~500 input + 150 output tokens → $0.0026 per extraction
- Resume key points: ~800 input + 200 output tokens → $0.0040 per extraction
- **1000 JDs/month:** $2.60 + 5000 resumes → $20.00 = **~$25/month for structured extraction**

**Total estimated AI costs: ~$25-30/month at current scale (1K roles, 5K submissions/month)**

## Analytics Architecture Decisions

### Use PostgreSQL Window Functions (Not TimescaleDB)

**Rationale:**
- Current dataset: <100K roles/year, <500K submissions/year → 1M rows over 2 years
- PostgreSQL 16 window functions (`LAG()`, `LEAD()`, `PARTITION BY`, `ROW_NUMBER()`) handle this efficiently
- TimescaleDB v2.26 (March 2026) offers 3.5x faster analytical queries via columnar storage BUT:
  - Adds extension complexity (hypertables, continuous aggregates, compression policies)
  - Operational overhead (separate backup strategy, version compatibility)
  - Overkill for current scale—benefits appear at 10M+ rows
- Decision: Use native PostgreSQL window functions + materialized views. Revisit TimescaleDB if dataset exceeds 5M rows.

### Use Application-Level Percentiles (Not SQL)

**Rationale:**
- PostgreSQL `percentile_cont()` requires array aggregation or window frame—complex SQL, hard to debug
- `simple-statistics` library provides clean API: `ss.quantile(values, 0.9)` for P90
- Cached in Redis with 24hr TTL → compute once daily, serve from cache
- Pattern: DB aggregates raw data → app computes distribution metrics → cache result
- Trade-off: Network overhead to fetch raw values vs SQL complexity. At <10K values, network cost is negligible (<100ms).

### Use Cosine Similarity (Not L2 or Inner Product)

**Rationale:**
- OpenAI `text-embedding-3-small` produces normalized embeddings (unit vectors)
- Cosine similarity (`<=>` operator) measures angle, invariant to magnitude
- L2 distance (`<->`) measures Euclidean distance—sensitive to magnitude, worse for text
- Inner product (`<#>`) equivalent to cosine for normalized vectors but less intuitive
- pgvector HNSW index supports all three—cosine is standard for text embeddings
- **Decision:** Use `<=>` (cosine) for all resume-JD matching queries

### Use HNSW Index (Not IVFFlat)

**Rationale:**
- HNSW (Hierarchical Navigable Small World): Better recall (95%+), faster queries (<20ms at 1M vectors)
- IVFFlat (Inverted File Flat): More memory-efficient but lower recall (~85%), slower queries
- Trade-off: HNSW uses ~2x RAM but our dataset is <100K embeddings (<500MB index size)
- Current EC2 instance: t3.micro (1GB RAM) may need upgrade to t3.small (2GB) when embeddings exceed 50K
- **Decision:** Use HNSW for production. Monitor RAM usage, upgrade instance if needed.

## Anomaly Detection Strategy

**Simple threshold-based approach (not ML library):**

**Why NOT `anomaly` npm package or Python libraries:**
- `anomaly` (GitHub: 19h/anomaly) — last updated 2016, unmaintained
- Most time-series anomaly detection is Python-focused (Orion, Prophet, etc.)
- Our use case: detect outliers in time-to-fill, sudden cost spikes, quality drops
- Simple z-score or IQR-based detection sufficient for MVP

**Recommended approach:**
```typescript
import ss from 'simple-statistics';

// Detect if current time-to-fill is anomalous
const recentRoles = await prisma.hiringMetric.findMany({
  where: {
    daysToFill: { not: null },
    createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 days
  },
  select: { daysToFill: true },
});

const values = recentRoles.map(m => m.daysToFill!);
const mean = ss.mean(values);
const stdDev = ss.standardDeviation(values);

const currentDays = 45;
const zScore = (currentDays - mean) / stdDev;

if (Math.abs(zScore) > 2) {
  // Anomaly: >2 standard deviations from mean
  // Trigger notification, flag for admin review
}

// Alternative: IQR method (more robust to outliers)
const q1 = ss.quantile(values, 0.25);
const q3 = ss.quantile(values, 0.75);
const iqr = q3 - q1;
const lowerBound = q1 - 1.5 * iqr;
const upperBound = q3 + 1.5 * iqr;

if (currentDays < lowerBound || currentDays > upperBound) {
  // IQR-based anomaly
}
```

**Why this is sufficient:**
- **Statistical validity:** Z-score (normal distribution assumption) or IQR (non-parametric, outlier-robust)
- **No training data required:** Works from day one with <30 data points
- **Interpretable:** Admins understand "2 standard deviations" or "outside typical range"
- **Low complexity:** No model training, no Python dependencies, no ML pipeline
- **Upgrade path:** If false positives become issue, swap to Isolation Forest or Prophet via Python microservice

## Sources

### High Confidence (Official Docs + npm registry)

- [OpenAI npm package](https://www.npmjs.com/package/openai) — Version 6.34.0, TypeScript >= 4.9 support
- [OpenAI API Reference (TypeScript)](https://developers.openai.com/api/reference/typescript) — Official TypeScript library documentation
- [OpenAI Agents SDK (TypeScript)](https://openai.github.io/openai-agents-js/) — Provider-agnostic agent framework
- [@openai/agents npm](https://www.npmjs.com/package/@openai/agents) — Installation and usage guide
- [pgvector GitHub](https://github.com/pgvector/pgvector) — PostgreSQL vector similarity search extension
- [pgvector-node GitHub](https://github.com/pgvector/pgvector-node) — Node.js/TypeScript support for pgvector
- [BullMQ Documentation](https://docs.bullmq.io/) — Rate limiting, retry strategies, job patterns
- [BullMQ GitHub](https://github.com/taskforcesh/bullmq) — TypeScript-native Redis job queue
- [PostgreSQL Window Functions Docs](https://www.postgresql.org/docs/current/functions-window.html) — Official PostgreSQL 18 documentation
- [simple-statistics npm](https://www.npmjs.com/package/simple-statistics) — Version 7.8.8, statistical methods
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse) — Version 1.1.1, PDF text extraction
- [mammoth npm](https://www.npmjs.com/package/mammoth) — Version 1.11.0, DOCX to HTML/text conversion

### Medium Confidence (Verified Community Sources)

- [LangChain vs Vercel AI SDK vs OpenAI SDK: 2026 Guide](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) — Framework comparison for LLM integration
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/foundations/providers-and-models) — Provider abstraction patterns
- [unpdf vs pdf-parse comparison (2026)](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026) — PDF library performance analysis
- [Bull vs BullMQ performance (2026)](https://pocketlantern.dev/briefs/bull-vs-bullmq-node-job-queue-performance-2026) — Job queue comparison after Bull EOL
- [PostgreSQL Analytics Optimization (2026)](https://oneuptime.com/blog/post/2026-01-25-optimize-postgresql-analytics-workloads/view) — work_mem tuning, query optimization
- [BullMQ Retry with Exponential Backoff (2026)](https://oneuptime.com/blog/post/2026-01-21-bullmq-retry-exponential-backoff/view) — Retry strategy best practices
- [TimescaleDB with Node.js (2026)](https://oneuptime.com/blog/post/2026-02-02-timescaledb-nodejs/view) — Time-series database patterns
- [PostgreSQL Vector Search Guide (pgvector)](https://calmops.com/database/postgresql-vector-search-pgvector-2026/) — HNSW vs IVFFlat indexing strategies
- [OpenAI Embeddings Pricing (April 2026)](https://costgoat.com/pricing/openai-embeddings) — text-embedding-3-small cost calculator
- [Text Embedding Models Compared (2026)](https://ofox.ai/blog/text-embedding-models-compared-2026/) — OpenAI vs Gemini embedding performance

### Low Confidence (WebSearch Only — Verify Before Use)

- [7 PDF Parsing Libraries for Node.js](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025) — General overview of PDF extraction options
- [Time-Series Anomaly Detection Libraries](https://github.com/rob-med/awesome-TS-anomaly-detection) — GitHub awesome list, mostly Python-focused

---
*Stack research for: GigCruite v3.0 — Hiring Intelligence (Phases 12-15)*
*Researched: 2026-04-24*
*Confidence: HIGH — All core recommendations verified with official docs or npm registry*
