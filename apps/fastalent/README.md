# GigCruite Platform

> AI-Powered, Trust-First Gig Recruiting Marketplace SaaS

A monorepo housing the GigCruite platform — connecting companies with vetted recruiting agencies and independent recruiters through reputation-driven matchmaking, intelligent candidate scoring, and protected escrow payments.

**Org**: xLabs · **Founder**: Mahender Rakashi

---

## Monorepo Structure

```
platform/
├── apps/
│   ├── web/          # React 18 + Vite 6 SPA  (@gigcruite/web)
│   └── api/          # Express 5 + Prisma 7   (@gigcruite/api)
├── packages/
│   ├── types/        # Shared Zod schemas, enums, interfaces  (@gigcruite/types)
│   └── ui/           # Shared shadcn/ui components            (@gigcruite/ui)
├── package.json      # Workspaces root
├── turbo.json        # Turborepo task pipeline
└── tsconfig.base.json
```

## Tech Stack

| Layer        | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| Frontend     | React 18 · Vite 6 · React Router v7 · Tailwind v4 · shadcn/ui v4  |
| Server State | TanStack Query v5 (with custom Cache Invalidation Registry)       |
| Client State | Zustand v5                                                        |
| Backend      | Node.js 22 LTS · Express 5 · TypeScript                           |
| ORM          | Prisma 7 (pure JS engine)                                         |
| Database     | PostgreSQL 16 (AWS EC2 Docker)                                    |
| Cache/RL     | Redis 7 (AWS EC2 Docker) · ioredis                                |
| Validation   | Zod (shared FE/BE schemas)                                        |
| Auth         | JWT (15min access · 7d refresh rotation) · bcrypt factor 12       |
| Encryption   | AES-256-GCM (PAN, bank accounts)                                  |
| Monorepo     | Turborepo 2                                                       |

## Infrastructure

- **PostgreSQL 16** + **Redis 7** run on AWS EC2 (`ap-south-1`) via Docker Compose.
- Local dev (Express + Vite) connects remotely. **No Docker Desktop required.**
- See `../.aws/AWS_RESOURCES.md` for live infrastructure details.

## Local Port Conventions

GigCruite lives in the **4000-4099** range. The 3000-3008 block is reserved
for another local application on this machine — do not move services back
into 3xxx.

| Service                     | Port |
| --------------------------- | ---- |
| API (Express)               | 4000 |
| Web (Vite dev server)       | 4001 |
| Prisma Studio (when opened) | 4555 |
| Reserved for future workers | 4002-4099 |

## Prerequisites

- **Node.js** ≥ 22.0.0
- **npm** ≥ 10.0.0
- A working network route to the AWS EC2 instance (dev IP must be in the security group allow-list).

## Getting Started

```bash
# 1. Install dependencies (workspace-aware)
npm install

# 2. Run all dev servers in parallel (api + web)
npm run dev

# 3. Type-check, lint, build the entire monorepo
npm run type-check
npm run lint
npm run build
```

## Scripts

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Run all `dev` scripts in workspaces (parallel, hot)   |
| `npm run build`        | Build every package/app via Turborepo                 |
| `npm run lint`         | Lint every workspace                                  |
| `npm run type-check`   | TypeScript noEmit across workspaces                   |
| `npm run test`         | Run tests across workspaces                           |
| `npm run format`       | Prettier write across the monorepo                    |
| `npm run format:check` | Prettier check (CI)                                   |
| `npm run clean`        | Clean Turborepo + workspace build outputs             |

## Implementation Phases

**Phase 1 (current)** — Foundation & Infrastructure: monorepo, auth, RBAC, profiles
Phase 2 — Gigs, applications, candidate tracking
Phase 3 — Escrow + bulk payouts
Phase 4 — Real-time messaging
Phase 5 — AI matching + scoring
Phase 6 — Reviews + reputation
Phase 7 — Admin + analytics
Phase 8 — Production hardening + AWS deploy

## License

UNLICENSED — Proprietary © xLabs
