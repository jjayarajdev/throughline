# EpiCenter — Bring-Up Runbook

> **Status (25 Sep 2026): brought up and verified locally.** Login → dashboard → Hiring /
> Candidate lists all work against a local SQL Server. Three things in the sections below
> are now superseded — read this box first:
>
> 1. **The DB blocker is solved.** `8. Database Schema.sql` (UTF-16 SSMS export, 22 Oct 2025)
>    is the real schema: 68 tables, 23 procs, 12 views, UDTs. No data rows. The EF model has
>    drifted past it (3 tables, 28 columns); `scripts/schema-drift-patch.sql` closes the gap.
>    Option B (EF migrations) is no longer needed.
> 2. **`dotnet user-secrets` does NOT work here.** `EpicenterX.csproj` sets
>    `GenerateAssemblyInfo=false`, which drops the `UserSecretsId` assembly attribute, so
>    secrets are silently ignored and the committed Azure connection string is used. Pass
>    `ConnectionStrings__EpicConnection` and `Jwt__SecretKey` as **environment variables**
>    instead — `scripts/start-local.sh` does this.
> 3. **`azure-sql-edge` is retired and crashes on current Docker Desktop.** Use
>    `mcr.microsoft.com/mssql/server:2025-latest` (runs on Apple Silicon via Rosetta).
>
> Also: `npm install` needs `--legacy-peer-deps` (eslint 8 vs @typescript-eslint peer
> conflict). The .NET 8 SDK can be installed without sudo to `~/.dotnet` via
> `dotnet-install.sh`; `sqlcmd` comes from `brew install sqlcmd`.
>
> **Fast path:** `./scripts/setup-local.sh` then `./scripts/start-local.sh`, log in as
> `jjayaraj@gmail.com` with any password. With `Migrated Data-Till-23rdJune2025.xlsx` in the
> project root, setup also loads the legacy data (lookups, users, partners, SOWs, HRQs,
> candidates, interviews) — see §10.

How to stand up the EpiCenter stack (API + UI) on a local/dev machine, what blocks
you, and the order to do it in. Written for macOS (Apple Silicon/Intel); notes for
Windows/Linux where they differ.

---

## 1. What you're bringing up

| Component | Stack | Repo | Dev port | Entry |
|-----------|-------|------|----------|-------|
| Backend API | .NET 8 Web API, EF Core + SQL Server | `EpiCenter-backend-main` | `http://localhost:5084` (HTTP), `https://localhost:7202` (HTTPS) | `Program.cs`, Swagger at `/swagger` |
| Frontend | Next.js 15 (App Router), React 19, TS | `UI-Epicenter-main` | `http://localhost:3000` | `next dev` |
| Database | SQL Server (Azure SQL in prod) | — (not in repo) | 1433 | — |

Flow: **UI → `NEXT_PUBLIC_API_BASE_URL` → API → SQL Server**. The UI sends the JWT as
`Authorization: Bearer` *and* `withCredentials: true`; CORS on the API currently allows
all origins, so cross-origin works locally without extra config.

---

## 2. Prerequisites

```bash
# .NET 8 SDK
brew install --cask dotnet-sdk        # or download from dotnet.microsoft.com
dotnet --version                      # need 8.x

# Node (UI). Next 15 needs Node >= 18.18; use 20 LTS.
brew install node@20
node --version

# EF Core CLI (only if you generate the DB schema from the model — see §3, Option B)
dotnet tool install --global dotnet-ef

# SQL Server — you need a reachable instance (see §3)
```

---

## 3. THE blocker: the database

**There is no schema in the repo.** No EF migrations, no `.sql`/`.bacpac`/`.dacpac`, no
`EnsureCreated`/`Migrate`/`HasData` seed calls. The app is **database-first** against 59
entity classes and an existing populated database (`EDMaster` / `Epicenterv2`). The
connection strings in `appsettings*.json` point at HPE-internal and Azure SQL servers you
almost certainly cannot reach from a laptop.

So the API will *start* with no DB, but **every data call (including login) fails** until a
database exists. You have three options:

**Option A — Get a copy of the real DB (best, highest fidelity).**
Ask whoever owns the existing environment for a `.bacpac` (Azure SQL → Export) or a `.bak`
backup. Spin up SQL Server locally and restore it. This is the only way to get the real
stored procedures, views, computed columns, and seed/reference data the code depends on.

```bash
# Local SQL Server on macOS via Docker
# Apple Silicon: use azure-sql-edge; Intel: mssql/server works too
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_Pass1" \
  -p 1433:1433 -d --name epicenter-sql mcr.microsoft.com/azure-sql-edge
# then restore the .bak/.bacpac (sqlpackage for .bacpac, RESTORE DATABASE for .bak)
```

**Option B — Generate the schema from the EF model (self-contained, partial fidelity).**
Lets you boot with an empty-but-correct schema. **Caveat:** any raw SQL / stored procedures
/ views the services call won't be created by a migration, so some endpoints will 500 until
you add them. Good enough to get the app running and exercise CRUD.

```bash
cd EpiCenter-backend-main
# point the dev connection string at your local SQL (see §4), then:
dotnet ef migrations add Init
dotnet ef database update
```
You'll still need to **seed minimum data to log in**: at least one row in `Roles`,
`Users` (with your email), and `UserRoles` linking them. Insert these by hand (SSMS / Azure
Data Studio / `sqlcmd`). The password column is irrelevant — see §6.

**Option C — Reach the existing remote DB.** Only if you're on the corp VPN and the
firewall allows it. Unlikely from a personal machine, and you'd be writing to a shared env.

> Recommendation: **Option A if you can get a dump, otherwise Option B** to make progress.

---

## 4. Backend bring-up

### 4a. Configuration (do NOT edit appsettings.json with real secrets)
The committed `appsettings.json` / `appsettings.Production.json` now carry **placeholders**
(connection string, JWT key, Azure Function key were scrubbed on 25 Sep 2026 before the code
was pushed to GitHub; the originals live untracked in `EpiCenter-backend-main/.secrets/`). The
old values had been committed in the source drop and must be rotated regardless (see §8). For local bring-up, override them with
**.NET user-secrets** so you don't commit anything:

```bash
cd EpiCenter-backend-main
dotnet user-secrets init    # UserSecretsId already set in the .csproj
dotnet user-secrets set "ConnectionStrings:EpicConnection" \
  "Server=localhost,1433;Initial Catalog=Epicenterv2;User ID=sa;Password=Your_strong_Pass1;Encrypt=True;TrustServerCertificate=True;"
dotnet user-secrets set "Jwt:SecretKey" "dev-only-key-min-32-bytes-long-change-me!!"
```
Notes:
- `TrustServerCertificate=True` is needed for the local Docker SQL self-signed cert.
- `Jwt:SecretKey` must be **≥ 32 bytes** or token creation throws (`AuthService.cs:57`).

### 4b. SAML / SSO — will not work locally, and that's fine
`SustainsysSaml2.IdentityProviders[0].MetadataLocation` is a Windows path
(`file:///C:/inetpub/.../SAML_cert.xml`) and that file is **not in the repo** (no `sso/`
dir). SSO login is dead locally. You don't need it — log in via the password endpoint
instead (§6). Metadata is loaded lazily, so a missing cert shouldn't crash startup, but if
`AddSaml2` errors on boot, comment out the `.AddSaml2(...)` block in `Program.cs:57-60`
for local dev.

### 4c. Run

```bash
cd EpiCenter-backend-main
dotnet restore
dotnet build
dotnet run            # serves http://localhost:5084, Swagger at /swagger
```

Verify: open `http://localhost:5084/swagger`. If Swagger loads, the app booted. Hit a
read endpoint — a 500 there means the DB isn't reachable/seeded (back to §3).

### 4d. Backend gotchas to expect
- **Background services start automatically** — `EpicenterHourlyService` and
  `EpiCenterDailyService` are registered as hosted services (`ServiceExtensions.cs:206-207`)
  and will hit the DB on their schedule; expect logged errors until the DB is up. The email
  hosted service is already commented out.
- **Preview NuGet packages** — `Microsoft.Data.SqlClient 6.1.0-preview`,
  `Microsoft.Identity.Client 4.71.2-preview`, `Azure.Storage.Blobs 12.24.0-beta`. If
  `restore` is flaky, ensure the NuGet preview feed is enabled, or pin to stable versions.
- **EPPlus 8** (Excel export) requires a license context to be set at startup or it throws
  at first use. If export endpoints 500 with a license error, that's why.
- **File storage** writes to a relative `Uploads` / `EpiCenterV2Documents` folder
  (`DocumentSettings:StoragePath`); it'll be created under the working dir locally.

---

## 5. Frontend bring-up

The UI reads the API base URL from `NEXT_PUBLIC_API_BASE_URL`, and **there is no `.env`
file in the repo** — you must create one.

```bash
cd UI-Epicenter-main
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:5084/api
EOF

npm install
npm run dev            # http://localhost:3000
```

Notes:
- The axios base URL is `process.env.NEXT_PUBLIC_API_BASE_URL` (`src/lib/axiosInstance.ts:11`);
  endpoints are called as `/Auth/login`, `/FileServer/...`, etc., so include the `/api` suffix
  to match the API's `[Route("api/[controller]")]`.
- `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `package.json` build is
  `next build --no-lint`, so `npm run build` will succeed even with type errors. Fine for
  bring-up; a liability long-term (see §8).
- The `xlsx` dependency is pulled from a **CDN tarball** (not npm), so `npm install` needs
  network access to `cdn.sheetjs.com`. If install fails there, that's the cause.

---

## 6. Logging in (how auth actually behaves)

Two important realities that make local bring-up *easier* but are security problems:

1. **The password is never checked.** `AuthService.ValidateUser` authenticates on the
   email alone (looks up the user, checks `IsActive` and that a role is assigned) and issues
   a JWT — it ignores `model.Password` entirely. So to log in you only need a `Users` row
   with your email, marked active, with a `UserRole`. Any password works.
2. **Tokens last 1 year** and CORS allows any origin — convenient locally, dangerous in
   prod.

To get in: seed a user (Option B) or use one from the restored DB (Option A), then log in
through the UI login form or `POST /api/Auth/login` with `{ "email": "you@example.com",
"password": "anything" }`. SSO (`/api/Auth/callback`) is not available locally.

> ⚠️ The UI route-protection middleware is in `src/middlewares.ts` (plural) — Next.js only
> loads `middleware.ts` (singular), so **it never runs**. Route protection today is just a
> client-side check that `sessionStorage['hp-storage']` exists (`app/home/layout.tsx`). This
> doesn't block bring-up, but means the UI has no real auth gate (see §8).

---

## 7. Smoke-test checklist

- [ ] SQL Server reachable; `Epicenterv2`/`EDMaster` exists with schema (§3)
- [ ] At least one Role + User + UserRole seeded
- [ ] `dotnet run` → `http://localhost:5084/swagger` loads
- [ ] A Swagger read endpoint returns data (not 500)
- [ ] `.env.local` created with `NEXT_PUBLIC_API_BASE_URL`
- [ ] `npm run dev` → `http://localhost:3000` loads the login page
- [ ] Login with a seeded email succeeds and lands on `/home`
- [ ] A data grid (e.g. partners/candidates) loads through the API

---

## 8. Must-fix before this leaves a laptop

These don't block local bring-up, but **must** be fixed before any shared/staging/prod
deployment. Details and file:line references are in the full code review.

**Critical**
1. **Auth bypass** — implement real password verification (or commit fully to SSO and remove
   the password endpoint). `AuthService.cs:19-42`.
2. **Rotate & remove committed secrets** — DB credentials, JWT key,
   Azure Function code in `appsettings*.json`. Move to a secret store; scrub git history.
3. **CORS** — lock to the known origins list instead of `SetIsOriginAllowed(_ => true)` +
   `AllowCredentials()`. `ServiceExtensions.cs:54-65`.
4. **UI middleware never runs** — rename `src/middlewares.ts` → `src/middleware.ts` and
   verify the token server-side; stop trusting client-set role cookies.
5. **Unauthenticated file endpoints + path traversal** — re-enable `[Authorize]` on
   `FileServerController` and sanitize file paths (`FileService.cs:44,71`).
6. **IDOR** — owner-scope single-record candidate get/update (`CandidateFormService.cs`).

**High**
- JWT lifetime 1 year → minutes/hours + refresh; move UI token to an `HttpOnly` cookie.
- Re-enable `[Authorize]` (currently commented/absent) on `Templates`, `RCMS`, `Master`,
  `EmailTemplate`, `JoiningRescheduleHistory`, `TestMedia`; add a global fallback auth policy.
- Stop returning internal exception messages to clients (`ExceptionMiddleware.cs`,
  `BaseService.cs`, `AuthController.cs:74`).
- Re-enable TS type checking / lint in CI (`next.config.ts`, build script).

---

## 9. TL;DR fastest path to a running app

A scripted Option-B setup is provided. **Prerequisite:** install the .NET 8 SDK first
(`brew install --cask dotnet-sdk`) — Docker and Node are already present on this machine.

```bash
# One command: starts local SQL, sets user-secrets, generates+applies the EF schema,
# seeds an ADMIN user, and writes the UI .env.local. Idempotent / re-runnable.
./scripts/setup-local.sh

# Then run the two apps:
cd EpiCenter-backend-main && dotnet run        # http://localhost:5084/swagger
cd UI-Epicenter-main && npm install && npm run dev   # http://localhost:3000

# Log in with: jjayaraj@gmail.com  (any password — backend ignores it)
```

Artifacts created for you:
- `scripts/setup-local.sh` — the orchestrator above
- `scripts/seed.sql` — ADMIN role (RoleId=1) + user + `UserRolesMapping` row
- `UI-Epicenter-main/.env.local` — `NEXT_PUBLIC_API_BASE_URL=http://localhost:5084/api`

Manual equivalent (if you'd rather not use the script):

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_Pass1" \
  -p 1433:1433 -d --name epicenter-sql mcr.microsoft.com/azure-sql-edge
cd EpiCenter-backend-main
dotnet user-secrets set "ConnectionStrings:EpicConnection" \
  "Server=localhost,1433;Initial Catalog=Epicenterv2;User ID=sa;Password=Your_strong_Pass1;Encrypt=True;TrustServerCertificate=True;"
dotnet user-secrets set "Jwt:SecretKey" "dev-only-key-min-32-bytes-long-change-me!!"
dotnet ef migrations add Init && dotnet ef database update
# apply ../scripts/seed.sql against the Epicenterv2 DB, then:
dotnet run
```

---

## 10. Legacy data load (25 Sep 2026)

`scripts/migrate-excel.py` maps the legacy-system export `Migrated Data-Till-23rdJune2025.xlsx`
(sheets: Users, Domains, Roles, SubDomains, SOW Details, Partners, Hiring, Interview Slots)
onto the Epicenterv2 schema and emits one transactional SQL script. `setup-local.sh` runs it
automatically when the workbook is present; it is re-runnable (clears and reloads every
table it owns, leaves the rest alone).

What it loads (counts from the 23-June-2025 workbook):

| Target | Rows | Source / notes |
|---|---|---|
| `M_MasterData` | 197 | Generated from `Domain/Enums/MasterType.cs` (id = type×1000+n) plus a few values the enums don't define (resource types, BU "Lifecycle Services", on-hold reasons, tiers) |
| `M_JobLevel`, geography, `QuarterDateRanges` (HPE FY: Q1 = Nov–Jan), `M_Configuration`, `Roles` | — | Hand-seeded |
| `Users` | 986 | Users sheet (legacy id + 1) + one login user per partner (`<partner>@partner.local`, role PARTNER) + `jjayaraj@gmail.com` (ADMIN) |
| `UserRolesMapping` | 232 | Roles inferred from evidence only: hiring-manager emails → HIRINGMANAGER, resource managers → RMOwner, approver → BETApprover, domain/sub-domain leaders → DomainManager, interview panel emails → PANEL. ~750 legacy users have no role and therefore cannot log in. |
| `M_Domains` / `M_SubDomains` | 24 / 114 | Domains + SubDomains sheets; Hiring-sheet names fuzzy-matched (cutoff 0.8) |
| `M_Skills` | 103 | Split from the free-text Primary/Secondary Skill columns |
| `Partners` (+`Engagements`, `PartnerEmpanel`) | 39 | Partners sheet; SOW vendor names fuzzy-matched (one new partner created: Sysnet) |
| `SOWDetails` / `SOWCRS` / `PODetails` | 47 / 13 / 60 | SOW Details sheet; CR rows attach to the vendor's SOW |
| `Hiring` (+`JobDetails`, `JobPositions`, `RCMSDetails`, `PartnerCategories`, `HiringReqPartner`) | 289 | Hiring sheet. **HRQ numbers shift**: `HrqId` is a computed column (`'HRQ' + …Id`), so legacy `HRQ0572` becomes `HRQ1572` (row Id = 572). Parent/child links are not in the export (`ParentHrqId` is NULL). |
| `CandidateForms` (+`CandidateFormHistory`) | 3 938 | One per (HRQ, candidate email) from Interview Slots. Intake status derived from Final status + last round result. The candidate grid reads the *history* table, hence the snapshot. |
| `InterviewRounds` / `InterviewSlotAllocation` | 523 / 6 104 | One round per (HRQ, round order); one slot per Interview Slots row. `ValidityHours` is NULL on purpose (see bug below). |

Data caveats worth knowing:
- The export replaced the string "LS" with "Life Cycle Services" everywhere (e.g. "CaLife Cycle Servicesoft" = Calsoft); the script fixes the one partner name affected.
- 27 candidate locations and a handful of names/emails don't resolve; the run prints an
  `UNMATCHED` section listing them. Rows are kept with NULL FKs.
- `List<int>` entity properties (skills, panel, city ids, freeze types) are stored as JSON
  arrays; anything else in those columns crashes EF's JSON reader for the whole grid.
- Resumes, contact/escalation matrices, feedback, rate cards, BGV and onboarding details are
  not in the workbook and stay empty.

**Backend bug surfaced by real data — fixed 25 Sep 2026.** The slot-allocation query
(`InterviewSlotService.GetPartnerInterviewSlotPendingApprovalRequests`) auto-cancels any PENDING
slot whose `ValidityHours` has elapsed and archives it to `InterviewSlotAllocationHistory`. That
failed for two reasons and 400'd the whole Slot Allocation page:
1. `AppDBContext` mapped the entity `HasNoKey()` although the table has an identity `Id` (and
   `CandidateInterviewFeedBack.InterviewSlotAllocationHistoryId` references it), so EF refused to
   track/insert it. Now mapped with `HasKey(Id)` and the feedback relationship declared.
2. The service copied the slot's navigation objects (Partner, CurrentRound, CandidateInterviewStatus,
   CandidateRating) onto the new history row; the slot came from a no-tracking query, so EF tried to
   INSERT those rows again (duplicate PK on `M_MasterData`). It now copies only the FK ids, and the
   archive insert + slot delete run in one `_context.Database` transaction (both repositories share
   the scoped DbContext), so a failure in either leaves the database untouched.
Verified by expiring a real pending slot: with the delete forced to fail, no history row is written and
the slot survives; without the fault, the endpoint returns 200, one history row exists, slot removed.
Migrated slots keep `ValidityHours = NULL` so historical data is never auto-cancelled.
