# Throughline — local bring-up

Throughline now runs on **PostgreSQL 16** with a Flyway-managed platform database. The legacy
SQL Server (Epicenterv2) is only needed once, to copy the historical data across.

```
apps/throughline-api     .NET 8 Web API (EpicenterX) — EF Core 8 + Npgsql, Serilog
apps/throughline-web     Next.js 15 / React 19 / Ant Design 6 UI
platform-db              Flyway config + versioned migrations (core + throughline schemas)
scripts                  setup-local.sh, start-local.sh, flyway.sh, data copy/projection, smoke test
docs/db                  unified data model, ERD, migration report
legacy                   the original SQL Server schema script and the drift patch (reference only)
```

## Quick start

```bash
scripts/setup-local.sh     # Postgres container + Flyway migrate (+ legacy copy if epicenter-sql is running) + builds
scripts/start-local.sh     # API on http://localhost:5084, UI on http://localhost:3000
scripts/smoke-api.sh       # logs in and hits the endpoints behind every screen
```

Log in with `jjayaraj@gmail.com` and any password (the legacy auth ignores the password; the user is ADMIN).

Requirements: Docker, .NET 8 SDK in `~/.dotnet` (`dotnet-install.sh --channel 8.0`), Node 20+, Python 3.11 with
`pip install pymssql "psycopg[binary]"` (only for the legacy copy).

## Database

| Item | Value |
|---|---|
| Container | `throughline-pg` (postgres:16), volume `throughline-pg-data` |
| Host port / db / user | 5433 / `platform` / `postgres` (password `Your_strong_Pass1` locally) |
| Connection string (API) | `Host=localhost;Port=5433;Database=platform;Username=postgres;Password=…` via env `ConnectionStrings__EpicConnection` |
| Schemas | `core` (shared source of truth), `throughline` (application tables, CamelCase quoted), `fastalent` (reserved) |
| Migrations | `platform-db/migrations/V*.sql`, run with `scripts/flyway.sh migrate|info|validate|repair` (Docker image flyway/flyway:10) |

Migrations so far:

| Version | What |
|---|---|
| V1 | `core` schema: taxonomy, users, organisations, documents, people, jobs, applications, screening results, outbox, RLS and grants |
| V2 | `throughline` baseline, generated from the EF model with `dotnet ef dbcontext script` (63 tables) |
| V3 | Sub-domain name index made non-unique (legacy data repeats names across domains) |
| V4 | Candidate-bin functions ported from T-SQL (duplicate detection, bin validation/upload, add candidate form, InitCap, NormalizePhone) |
| V5 | Reporting functions ported from T-SQL (partner HRQ grid, candidate export, interview feedback export, master data) |

`user-secrets` are ignored by this csproj (`GenerateAssemblyInfo=false`), so configuration comes from environment
variables; `scripts/start-local.sh` exports the connection string and `Jwt__SecretKey`.

## Legacy data migration (SQL Server → Postgres)

1. `scripts/copy-sqlserver-to-postgres.py` copies every table of the EF model from `epicenter-sql` (Epicenterv2) into
   the `throughline` schema: columns matched by name, JSON-text id lists converted to `integer[]`, FKs bypassed
   during the load, identity sequences reset, computed columns (HRQ/partner/candidate codes) compared afterwards.
   Last run: 19,801 rows across 63 tables, 0 computed-column mismatches. Columns that exist only in SQL Server
   (unused by the app) are listed in the run report and dropped.
2. `scripts/project-core-report.py` (runs `scripts/project-core.sql`) projects `throughline` into `core` and writes
   `docs/db/core-migration-report.md`: taxonomy, 986 users, 39 vendors, 289 jobs, 3,938 candidate rows → 3,772 people
   (154 merged by email/phone), 3,938 applications with mapped stages, 0 dangling ids. It is idempotent.

## What changed in the port

- EF provider `Microsoft.EntityFrameworkCore.SqlServer` → `Npgsql.EntityFrameworkCore.PostgreSQL 8.0.11`
  (`Program.cs` uses `UseNpgsql`; `Npgsql.EnableLegacyTimestampBehavior` is on because the code uses `DateTime.Now`).
- Default schema `throughline`; computed columns rewritten in PostgreSQL syntax.
- 14 T-SQL objects (11 procedures, 3 functions) became PL/pgSQL functions; the C# call sites use
  `SELECT * FROM throughline.fn(...)` with `NpgsqlParameter`, table-valued parameters became `jsonb`.
  `sp_GetCandidate_HRQ_InterviewDetails` never existed in SQL Server and is a documented reconstruction.
- Dynamic grid search (`SearchExpressionHelper`) uses `ILIKE`, so search stays case-insensitive.
- `List<int>` properties without an explicit JSON converter are native `integer[]` columns.
- The 12 SQL Server views and 12 dashboard procedures (`usp_*`) are not referenced by the API and were not ported.

## Verified

- `scripts/smoke-api.sh`: 24 endpoints, all 200.
- UI walkthrough on Postgres: login, dashboard (39 partners, 960 candidates, 50 open requests), partner grid,
  hiring grid (all tabs), candidate grid and search, slot allocation, onboarding, SOW, exception approvals,
  engagement, feedback, master. No console errors.

## Known differences

- Background jobs (hourly slot expiry, daily on-hold auto-reject) run on start-up against whatever data is loaded.
- Search-column masters (`M_SearchColumn`) are empty in the legacy data, so grid search boxes fall back to the
  page's default column (for candidates: CandidateCode).
- Partner grid needs `?statusId=…`; the UI supplies it, the smoke test passes `25001,25002`.
