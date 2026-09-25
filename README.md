# Throughline platform

Monorepo for the Throughline hiring platform and its shared data layer.

| Path | What |
|---|---|
| `apps/throughline-api` | .NET 8 Web API (EF Core 8 on PostgreSQL via Npgsql) |
| `apps/throughline-web` | Next.js 15 + Ant Design 6 UI |
| `apps/fastalent` | fastalent sourcing marketplace (Express 5 + Prisma 7 API, React SPA) — imported from GitJayKay/gigcruite |
| `platform-db` | Flyway migrations for the one PostgreSQL cluster: `core` (shared source of truth), `throughline`, `fastalent` |
| `docs` | architecture diagrams, unified data model (`docs/db`), migration report, business docs |
| `scripts` | local setup/start, Flyway wrapper, legacy data copy and core projection, API smoke test |
| `legacy` | original SQL Server schema and drift patch, kept for reference |

Start here: [BRING-UP.md](BRING-UP.md). Data model: [docs/db/unified-schema.md](docs/db/unified-schema.md).
