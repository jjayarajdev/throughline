---
marp: true
theme: default
paginate: true
title: Throughline Platform — Technical Overview
version: v0.2
company: Syntegreti
---

<!-- _class: lead -->

# Throughline
## Enterprise Hiring & Partner Management Platform

**Technical Overview Deck · v0.2**

A full-stack platform for orchestrating recruitment partners, hiring requisitions,
candidate pipelines and interview workflows — built on .NET 8 + Next.js 15.

> A Syntegreti product.

---

## What is Throughline?

A centralized recruitment operating system that unifies three sub-systems:

- **HMS — Hiring Management System**
  Job requisitions (HRQs), interview rounds, panels, calibration
- **PMS — Partner Management System**
  Vendor onboarding, empanelment, engagements, SOWs, escalation matrices
- **CMS — Candidate Management System**
  Candidate pipeline (cart/bin), background verification, training, onboarding,
  asset allocation, post-joining profile tracking

> Built for enterprise staffing operations with strict workflow, audit and RBAC needs.

---

## High-Level Architecture

```
 ┌────────────────────┐         ┌─────────────────────────┐
 │   Next.js 15 UI    │  HTTPS  │   ASP.NET Core 8 API    │
 │   (React 19, TS)   │ ──────► │   (Clean Architecture)  │
 └─────────┬──────────┘  JWT /  └───────┬─────────────────┘
           │             SAML           │
           │                            │ EF Core / Dapper
           ▼                            ▼
   sessionStorage +              ┌──────────────────┐
   Zustand + React Query         │  Azure SQL DB    │
                                 │  (Epicenterv2)   │
                                 └──────────────────┘
                                          │
                       ┌──────────────────┼──────────────────┐
                       ▼                  ▼                  ▼
                Azure Blob          Azure Function     MS Graph / LDAP
                (file storage)     (Send Email)        Okta SAML SSO
```

Two repositories: `EpiCenter-backend-main` (API) and `UI-Epicenter-main` (web).

---

## Backend — Tech Stack

| Layer | Choice |
|---|---|
| Runtime | **.NET 8 (LTS)** — ASP.NET Core Web API |
| Database | **Azure SQL Server** (`Epicenterv2`) |
| ORM | **EF Core 8** + **Dapper** + EFCore.BulkExtensions |
| Auth | **JWT (HS256)** + **SAML 2.0** (Sustainsys / Okta) + Azure AD |
| Mapping | **AutoMapper 13** |
| Logging | **Serilog 9** (rolling daily file sinks) |
| Docs | **Swashbuckle / Swagger** |
| Email | **MailKit** + delegated **Azure Function** (`SendEmailFunction`) |
| Files | **Azure Blob Storage** (SAS URL) |
| Office | **ClosedXML / EPPlus** for Excel I/O |
| Identity | **Microsoft Graph 5**, **System.DirectoryServices** (LDAP) |

---

## Backend — Project Structure

Clean Architecture-style separation across **287 C# files**:

```
EpiCenter-backend-main/
├── Controllers/         31 HTTP endpoints (resource-per-controller)
├── Application/         Services, DTOs, business orchestration
├── Domain/              59 entities grouped by CMS / HMS / PMS / Masters
├── Infrastructure/      DbContext, repositories, LINQ queries
├── BackgroundServices/  Hourly + Daily + Email workers
├── Middleware/          Exception + Request-logging
├── Extensions/          DI, CORS, Serilog, AutoMapper wiring
└── Program.cs           Composition root
```

Not strict CQRS/DDD, but cleanly layered with repositories and DI throughout.

---

## Backend — Controllers (31 APIs)

**Auth & Users** — `AuthController`, `UserController`

**Hiring (HMS)** — `HiringRequestController`, `JobDetailsController`,
`InterviewRoundController`, `InterviewSlotController`, `CandidateFormController`,
`CalibrationController`, `PanelController`

**Candidates (CMS)** — `CandidateBinController`, `CandidateBgvController`,
`CandidatePersonalDetailsController`, `AssetDetailsController`,
`TrainingDetailsController`, `ProfileTrackerController`,
`JoiningRescheduleHistoryController`

**Partners (PMS)** — `PartnerController`, `PartnerCategoryController`,
`EmpanelmentController`, `EngagementController`, `ContactMatrixController`,
`EscalationMatrixController`, `SOWController`

**Ops** — `DashboardController`, `NotificationController`, `EmailTemplateController`,
`MasterController`, `FileServerController`, `SearchColumnController`, `RCMSController`

---

## Backend — Domain Model (59 entities)

**CMS** — `Candidate`, `CandidateHistory`, `CandidateBin`, `CandidatePersonalDetails`,
`CandidateBgvDetails`, `AssetDetails`, `TrainingDetails`, `ProfileTracker`,
`CandidateRateCard`, `InterviewSlot`, `InterviewActionLog`, `CandidateInterviewFeedBack`

**HMS** — `HiringRequest`, `JobDetails`, `InterviewRound`, `Calibration`,
`Feedback / FeedbackDetail`, `PanelHistory`, `OnholdHiringRequest`

**PMS** — `Partner`, `PartnerCategory`, `PartnerEmpanel`, `Engagement`,
`ContactMatrix`, `EscalationMatrix`, `SOW`, `SOW_CR`, `PODetail`

**Masters** — `M_Country/State/City`, `M_Domain/SubDomain`, `M_Skill`, `M_JobLevel`,
`M_MasterData`, `M_Configuration`, `M_Module/Form/RoleFormAccess`,
`Users / Role / UserRole` (RBAC)

> Heavy use of `*History` entities — full audit trails are first-class.

---

## Backend — Background Workers

**`EpiCenterHourlyService`** — every hour
- Auto-expire pending interview slots beyond validity hours
- Mark candidates as *dropped* after 3 rejections
- Refresh interview slot counts

**`EpiCenterDailyService`** — once per day
- Detect inactive partners (no uploads 30d+)
- Auto-deactivate partners with expired evaluation periods
- Reassign HRQs to RM owners past acceptance threshold
- Reject on-hold candidates exceeding hold duration
- Trigger escalations on stalled requisitions

**`EpicenterEmailService`** — wired in, currently disabled — workflow-driven emails.

---

## Backend — Cross-Cutting Concerns

- **`ExceptionMiddleware`** — global error handler, returns uniform
  `ApiResponseDto<T>`, logs full inner-exception chain to Serilog.
- **`RequestLoggingMiddleware`** — per-request timing & correlation.
- **CORS** — permissive (`AnyOrigin / AnyMethod / AnyHeader` + credentials)
  to support multi-host deployments.
- **JWT validation** — issuer, audience, lifetime, signing key all enforced.
- **Serilog** — structured logs to `Logs/requests-*.log`, daily rolling.
- **Swagger** — generated from XML comments for all controllers.

---

## Backend — Deployment

- **Dockerfile** — multi-stage: SDK 8.0 build → ASP.NET 8.0 runtime
  - Exposes 8080 / 8081, entrypoint `dotnet EpicenterX.dll`
- **GitHub Actions** — `.github/workflows/deploy_backend.yml`
  - `master` branch → production, runs `~/dbackend.sh` on Azure VM
  - `Development` branch → dev, runs `~/development_backend.sh`
  - SSH-based deploy (key from secrets) to `52.159.149.78`
- **Config** — `appsettings.json` + `appsettings.Production.json` overrides,
  secrets via .NET User Secrets

---

## Frontend — Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15.2** (App Router, **Turbopack**) on **React 19** |
| Language | **TypeScript 5** (strict) |
| UI Kit | **shadcn/ui** on **Radix** + **Tailwind CSS 4** + **Lucide** icons |
| Client state | **Zustand 5** (persisted to sessionStorage) |
| Server state | **TanStack React Query 5** |
| HTTP | **Axios** with interceptors (token + 401/5xx handling) |
| Forms | **React Hook Form 7** + **Zod 3** |
| Tables | **TanStack Table 8** + **react-window** virtualization |
| Charts | **Recharts**, **react-gauge-chart** |
| Files | **mammoth** (DOCX), **react-pdftotext** (PDF), **xlsx** export |
| Misc | **Sonner** toasts, **next-themes** dark mode, **Lottie** animations |

---

## Frontend — App Router Map

```
/                                  Login (Zod-validated)
/unauthorized                      403 page
/panel-feedback/[id]               Standalone interview-feedback form

/home/                             Authenticated shell (sidebar + header)
  ├─ dashboard                     KPIs, charts, role-filtered views
  ├─ partner-onboarding            Add / edit partner, [profile]
  ├─ partner-engagement            Performance tracking
  ├─ partner-podetails             PO details
  ├─ (hiring-management)/...       HRQs, review requests, details
  ├─ candidate-management          Create / edit / profile
  ├─ candidate-approval            Cart / Bin approval flows
  ├─ candidate-onboarding          Post-hire workflows
  ├─ candidate-feedback-review     Interview feedback
  ├─ (interview-slot)/slot-management
  ├─ application-roles  /  master  Admin & master data
  └─ edit-profile
```

---

## Frontend — Feature Highlights

- **Dashboard** (`DashboardDemo.tsx`) — active partners / candidates / HRQs,
  weekly submission trends (bar), candidate stage summary (pie), interview KPIs;
  views differ per role.
- **Cart / Bin model** — approved candidates go to *cart*, rejected/flagged
  go to *bin* with re-evaluation flows.
- **Hiring workflow** — Create → BET Approver → RM Owner accept → Slot allocation
  → Candidate submission → Feedback → Hire.
- **Resume parsing** — DOCX (mammoth) and PDF (react-pdftotext) extracted client-side.
- **Slot management** — partner self-service + admin allocation with conflicts.

---

## Frontend — State, Auth & API

**Stores (Zustand)** — `userStore`, `useHiringStore`, `useCandidateStore`,
`useCandidateOnboarding`, `userPartnerStore`. Persisted under sessionStorage key `hp-storage`.

**Auth flow**
1. POST `/Auth/login` (email + password, Zod schema)
2. Receive token + roles → write to `userStore` + cookies (`authToken`, `roles`)
3. `redirectBasedOnRole()` routes user to the right landing screen

**Roles** — Admin, Vendor Manager, Hiring Manager, Partner, Panel,
BET Approver/Member, Domain Manager, RM Owner, HIRINGTEAM, Onboarding SPOC.
Permission flags (`isHiringCreate`, `isHiringEdit`, `isShowslotAllocation`, …) gate UI.

**API layer** — `/src/services/api/*` (hiring, candidate, partner, slot, onboarding,
user, master). Axios base URL from `NEXT_PUBLIC_API_BASE_URL`; interceptor injects
Bearer token and handles 401 / 5xx centrally.

---

## Frontend — Components & Build

**~206 component files**, organized by feature:

```
src/components/
├── ui/              34 shadcn primitives
├── layout/          AppHeader, AppSidebar, UserRoles
├── dashboard/       DashboardDemo, skeletons
├── hiring-forms/    HiringForm, HiringTable, CartTable
├── candidate/       Profile, CartTable, BinTable
├── partner-form/  partner-profile/  onboarding/
├── slot-management/ form-fields/  common/  error/
└── providers.tsx    Query / Theme / Sidebar providers
```

**Run**: `npm run dev` (Turbopack) · `npm run build` · `npm start` on port 8080
**Deploy**: PM2 (`start_epicenter.json`) — typically behind Windows IIS reverse proxy.

---

## Security Posture

- **Auth** — JWT bearer (HS256, validated for issuer/audience/lifetime/signature)
  with optional **SAML 2.0 SSO** via Okta and **Azure AD** support.
- **RBAC** — `M_Module / M_Form / M_RoleFormAccess` matrix in DB; UI mirrors
  permission flags per role.
- **Audit** — `*History` entities track candidate, engagement, panel, bin, PO,
  joining-reschedule changes.
- **Transport** — HTTPS enforced; sensitive config via .NET User Secrets.
- ⚠ **Open items to review**
  - CORS is fully open (`AnyOrigin + credentials`) — tighten per-environment.
  - `next.config.ts` ignores TypeScript errors during build.
  - Email service currently commented out in DI registration.

---

## Roadmap / Talking Points

- **Tighten CORS** to a per-environment allow-list.
- **Re-enable** `EpicenterEmailService` once template QA is signed off.
- **Re-enable Next.js type-checking** in CI (don't suppress in `next.config.ts`).
- **Move secrets** from `appsettings*.json` to Azure Key Vault.
- Consider **CQRS / MediatR** as controller bodies grow; introduce
  integration tests around the Hourly / Daily background services.
- Frontend: extract a typed API client from the Axios services using
  the OpenAPI spec already produced by Swashbuckle.

---

<!-- _class: lead -->

# Thank you

**Repos**
- `EpiCenter-backend-main` — .NET 8 API
- `UI-Epicenter-main` — Next.js 15 UI

**Quick links**
- Swagger: `/swagger` on the API host
- Logs: `Logs/requests-*.log` (Serilog daily rolling)
- CI: `.github/workflows/deploy_backend.yml`

Questions?
