-- V1: core schema — the shared source of truth for fastalent and Throughline.
-- Generated from docs/db/unified-schema.sql (core section). Additive-only from here on:
-- later changes go in new versioned migrations, never by editing this file.
-- =====================================================================
--  Unified platform database — fastalent + Throughline
--  PostgreSQL 16 · one cluster · three schemas
--
--    core         shared source of truth (this file defines it fully)
--    fastalent    marketplace-only tables (only the tables that change
--                 are defined here; the rest move over unchanged)
--    throughline  hiring-ops-only tables (same: only the tables that
--                 change are defined here)
--
--  Rules
--    1. Product schemas may hold foreign keys INTO core, never into
--       each other.
--    2. Every core row has one writing application, recorded in the
--       row's `origin` column and enforced by row-level security.
--    3. Core migrations are additive only. Deprecate, never drop.
--    4. Anything another system must hear about leaves through
--       core.outbox exactly once (transactional outbox).
--
--  Legacy ids are kept on core rows so the migration from
--  Epicenterv2 (SQL Server) and from the fastalent Prisma schema is
--  reversible and auditable.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive emails

CREATE SCHEMA IF NOT EXISTS core;

-- Phone identity: digits only, last 10 (India mobile); NULL if fewer than 10 digits.
CREATE OR REPLACE FUNCTION core.phone_norm(p text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN length(d) >= 10 THEN right(d, 10) END
  FROM (SELECT regexp_replace(coalesce(p,''), '\D', '', 'g') AS d) x
$$;
CREATE SCHEMA IF NOT EXISTS fastalent;
CREATE SCHEMA IF NOT EXISTS throughline;

-- ---------------------------------------------------------------------
--  Application roles (one login per app; grants below implement rule 2)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_owner')     THEN CREATE ROLE core_owner NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_fastalent')  THEN CREATE ROLE app_fastalent LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_throughline') THEN CREATE ROLE app_throughline LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_screening')  THEN CREATE ROLE app_screening LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_hub')        THEN CREATE ROLE app_hub LOGIN; END IF;
END $$;

-- =====================================================================
--  core · enumerations
-- =====================================================================
CREATE TYPE core.origin_app       AS ENUM ('throughline', 'fastalent', 'screening', 'migration');
CREATE TYPE core.org_kind         AS ENUM ('client_company', 'staffing_agency', 'vendor', 'platform');
CREATE TYPE core.org_status       AS ENUM ('draft', 'pending_approval', 'active', 'inactive', 'rejected', 'suspended');
CREATE TYPE core.employment_type  AS ENUM ('permanent', 'contract', 'contract_to_hire');
CREATE TYPE core.job_status       AS ENUM ('draft', 'pending_approval', 'published', 'on_hold', 'closed', 'cancelled');
CREATE TYPE core.application_channel AS ENUM ('throughline_partner', 'fastalent_marketplace', 'referral', 'direct', 'migration');
-- The pipeline stages both products agree on. Product-specific sub-states
-- live in fastalent.submissions / throughline.candidates.
CREATE TYPE core.application_stage AS ENUM
  ('submitted', 'screening', 'shortlisted', 'interviewing', 'offered',
   'offer_accepted', 'joined', 'rejected', 'withdrawn', 'on_hold', 'dropped');
CREATE TYPE core.document_kind    AS ENUM ('jd', 'cv', 'capability_deck', 'sow', 'po', 'offer_letter', 'id_proof', 'other');
CREATE TYPE core.screening_kind   AS ENUM ('profile_vs_jd', 'ai_interview', 'phone_screen', 'liveness', 'coding');
CREATE TYPE core.screening_provider AS ENUM ('internal', 'incruiter', 'berribot', 'other');
CREATE TYPE core.contact_role     AS ENUM ('hiring_spoc', 'account_manager', 'hr_spoc', 'finance_spoc', 'compliance_spoc', 'escalation', 'recruiter', 'admin');

-- =====================================================================
--  core · taxonomy  (writer: Throughline admin screens)
--  Ids are stable and additive. `legacy_master_id` keeps the
--  Throughline M_MasterData / M_* id so both apps can map back.
-- =====================================================================
CREATE TABLE core.countries (
  id            smallint      PRIMARY KEY,
  iso2          char(2)       NOT NULL UNIQUE,
  name          text          NOT NULL,
  currency      char(3)       NOT NULL,
  legacy_master_id int
);

CREATE TABLE core.states (
  id            smallint      PRIMARY KEY,
  country_id    smallint      NOT NULL REFERENCES core.countries,
  name          text          NOT NULL,
  legacy_master_id int,
  UNIQUE (country_id, name)
);

CREATE TABLE core.cities (
  id            int           PRIMARY KEY,
  state_id      smallint      NOT NULL REFERENCES core.states,
  name          text          NOT NULL,
  legacy_master_id int,
  UNIQUE (state_id, name)
);

CREATE TABLE core.domains (
  id            smallint      PRIMARY KEY,
  name          text          NOT NULL UNIQUE,
  is_active     boolean       NOT NULL DEFAULT true,
  legacy_master_id int
);

CREATE TABLE core.sub_domains (
  id            smallint      PRIMARY KEY,
  domain_id     smallint      NOT NULL REFERENCES core.domains,
  name          text          NOT NULL,
  is_active     boolean       NOT NULL DEFAULT true,
  legacy_master_id int,
  UNIQUE (domain_id, name)
);

CREATE TABLE core.skills (
  id            int           PRIMARY KEY,
  name          text          NOT NULL,
  slug          text          NOT NULL UNIQUE,            -- normalised key used to match free text
  is_primary    boolean       NOT NULL DEFAULT true,
  is_active     boolean       NOT NULL DEFAULT true,
  legacy_master_id int
);
CREATE TABLE core.skill_aliases (                          -- "ReactJS", "React.js" -> React
  alias         text          PRIMARY KEY,
  skill_id      int           NOT NULL REFERENCES core.skills
);

CREATE TABLE core.job_levels (                             -- Throughline M_JobLevel 17001..17005
  id            smallint      PRIMARY KEY,
  name          text          NOT NULL UNIQUE,
  experience_min numeric(4,1),
  experience_max numeric(4,1),
  sort_order    smallint      NOT NULL DEFAULT 0,
  legacy_master_id int
);

-- Small, named lists that both apps need but that are not worth a
-- table each: engagement types, hiring types, priorities, resource types…
CREATE TABLE core.lookups (
  id            int           PRIMARY KEY,
  list          text          NOT NULL,                    -- 'engagement_type', 'hiring_type', 'priority', 'resource_type', 'diversity', ...
  code          text          NOT NULL,
  label         text          NOT NULL,
  sort_order    smallint      NOT NULL DEFAULT 0,
  is_active     boolean       NOT NULL DEFAULT true,
  legacy_master_id int,
  UNIQUE (list, code)
);

-- =====================================================================
--  core · identities
-- =====================================================================
CREATE TABLE core.users (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext        NOT NULL UNIQUE,
  full_name     text          NOT NULL,
  phone         text,
  status        text          NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','locked')),
  auth_subject  text          UNIQUE,                      -- SSO subject once identity is shared
  origin        core.origin_app NOT NULL,
  legacy_throughline_user_id int UNIQUE,
  legacy_fastalent_user_id   text UNIQUE,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);
-- Product roles stay in the product schema (throughline.user_roles,
-- fastalent.recruiter_profiles / company_members).

-- =====================================================================
--  core · organisations  (vendors, agencies, client companies)
-- =====================================================================
CREATE TABLE core.organisations (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          core.org_kind NOT NULL,
  code          text          UNIQUE,                      -- Throughline PartnerCode for vendors
  legal_name    text          NOT NULL,
  display_name  text          NOT NULL,
  status        core.org_status NOT NULL DEFAULT 'draft',
  country_id    smallint      REFERENCES core.countries,
  state_id      smallint      REFERENCES core.states,
  city_id       int           REFERENCES core.cities,
  address       text,
  pincode       text,
  website       text,
  gst_number    text,
  industry      text,
  size_band     text,
  logo_document_id uuid,                                  -- FK added after core.documents
  origin        core.origin_app NOT NULL,
  legacy_throughline_partner_id int UNIQUE,
  legacy_fastalent_company_id   text UNIQUE,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX ON core.organisations (kind, status);

CREATE TABLE core.organisation_domains (
  organisation_id uuid      NOT NULL REFERENCES core.organisations ON DELETE CASCADE,
  sub_domain_id   smallint  NOT NULL REFERENCES core.sub_domains,
  PRIMARY KEY (organisation_id, sub_domain_id)
);
CREATE TABLE core.organisation_skills (
  organisation_id uuid      NOT NULL REFERENCES core.organisations ON DELETE CASCADE,
  skill_id        int       NOT NULL REFERENCES core.skills,
  PRIMARY KEY (organisation_id, skill_id)
);

-- Who belongs to / speaks for an organisation. Replaces Throughline
-- ContactMatrix + EscalationMatrix and fastalent's agency membership.
CREATE TABLE core.organisation_members (
  organisation_id uuid      NOT NULL REFERENCES core.organisations ON DELETE CASCADE,
  user_id         uuid      NOT NULL REFERENCES core.users,
  role            core.contact_role NOT NULL,
  escalation_level smallint,                               -- 1..n when role = 'escalation'
  is_primary      boolean   NOT NULL DEFAULT false,
  PRIMARY KEY (organisation_id, user_id, role)
);

-- =====================================================================
--  core · documents  (metadata only; bytes live in S3 / file server)
-- =====================================================================
CREATE TABLE core.documents (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          core.document_kind NOT NULL,
  storage       text          NOT NULL CHECK (storage IN ('s3','fileserver')),
  bucket        text,
  object_key    text          NOT NULL,
  filename      text          NOT NULL,
  mime_type     text          NOT NULL,
  size_bytes    bigint        NOT NULL,
  sha256        bytea,
  uploaded_by   uuid          REFERENCES core.users,
  origin        core.origin_app NOT NULL,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (storage, bucket, object_key)
);
ALTER TABLE core.organisations
  ADD CONSTRAINT organisations_logo_fk FOREIGN KEY (logo_document_id) REFERENCES core.documents;

-- =====================================================================
--  core · people  (candidates; the talent pool)
--  Written by both apps through core.upsert_person() so the merge
--  rule lives in exactly one place.
-- =====================================================================
CREATE TABLE core.people (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text          NOT NULL,
  email         citext,
  phone         text,
  email_norm    citext        GENERATED ALWAYS AS (NULLIF(lower(trim(email)), '')) STORED,
  phone_norm    text          GENERATED ALWAYS AS (core.phone_norm(phone)) STORED,   -- last 10 digits
  country_id    smallint      REFERENCES core.countries,
  state_id      smallint      REFERENCES core.states,
  city_id       int           REFERENCES core.cities,
  current_organisation text,
  last_organisation    text,
  currently_working    boolean,
  total_experience_years    numeric(4,1),
  relevant_experience_years numeric(4,1),
  notice_period_days   smallint,
  last_working_day     date,
  diversity_lookup_id  int  REFERENCES core.lookups,
  cv_document_id       uuid REFERENCES core.documents,     -- latest CV
  talent_pool_consent  boolean NOT NULL DEFAULT false,     -- DPDP gate for reuse across jobs
  talent_pool_consent_at timestamptz,
  origin        core.origin_app NOT NULL,
  legacy_throughline_candidate_code text,                  -- first HRQ-scoped CandidateCode seen
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX people_email_norm_uq ON core.people (email_norm) WHERE email_norm IS NOT NULL;
CREATE UNIQUE INDEX people_phone_norm_uq ON core.people (phone_norm) WHERE phone_norm IS NOT NULL;
ALTER TABLE core.people ADD CONSTRAINT people_contact_chk CHECK (email_norm IS NOT NULL OR phone_norm IS NOT NULL);

CREATE TABLE core.person_skills (
  person_id     uuid          NOT NULL REFERENCES core.people ON DELETE CASCADE,
  skill_id      int           NOT NULL REFERENCES core.skills,
  is_primary    boolean       NOT NULL DEFAULT true,
  PRIMARY KEY (person_id, skill_id)
);
CREATE TABLE core.person_preferred_locations (
  person_id     uuid          NOT NULL REFERENCES core.people ON DELETE CASCADE,
  city_id       int           NOT NULL REFERENCES core.cities,
  PRIMARY KEY (person_id, city_id)
);

-- =====================================================================
--  core · jobs  (the requisition: HRQ on Throughline, Role on fastalent)
-- =====================================================================
CREATE TABLE core.jobs (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  hrq_number    text          UNIQUE,                      -- 'HRQ1572' — set when Throughline owns the requisition
  origin        core.origin_app NOT NULL,                  -- who created and therefore who edits the row
  owner_organisation_id uuid  NOT NULL REFERENCES core.organisations,  -- the client company hiring
  title         text          NOT NULL,
  description   text,                                      -- JD text
  jd_document_id uuid         REFERENCES core.documents,
  employment_type core.employment_type NOT NULL DEFAULT 'permanent',
  status        core.job_status NOT NULL DEFAULT 'draft',
  domain_id     smallint      REFERENCES core.domains,
  sub_domain_id smallint      REFERENCES core.sub_domains,
  job_level_id  smallint      REFERENCES core.job_levels,
  priority_lookup_id int      REFERENCES core.lookups,
  country_id    smallint      REFERENCES core.countries,
  is_remote     boolean       NOT NULL DEFAULT false,
  experience_min numeric(4,1),
  experience_max numeric(4,1),
  ctc_min       numeric(14,2),
  ctc_max       numeric(14,2),
  currency      char(3),
  open_positions smallint     NOT NULL DEFAULT 1,
  requested_by_user_id     uuid REFERENCES core.users,
  hiring_manager_user_id   uuid REFERENCES core.users,
  published_at  timestamptz,
  closed_at     timestamptz,
  legacy_throughline_hiring_id int UNIQUE,
  legacy_fastalent_role_id     text UNIQUE,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX ON core.jobs (owner_organisation_id, status);
CREATE INDEX ON core.jobs (status, published_at DESC);

CREATE TABLE core.job_skills (
  job_id        uuid          NOT NULL REFERENCES core.jobs ON DELETE CASCADE,
  skill_id      int           NOT NULL REFERENCES core.skills,
  is_mandatory  boolean       NOT NULL DEFAULT true,
  PRIMARY KEY (job_id, skill_id)
);
CREATE TABLE core.job_locations (
  job_id        uuid          NOT NULL REFERENCES core.jobs ON DELETE CASCADE,
  city_id       int           NOT NULL REFERENCES core.cities,
  is_primary    boolean       NOT NULL DEFAULT true,
  PRIMARY KEY (job_id, city_id)
);

-- Which supply may work a job. Answers the channel-conflict question:
-- open to the marketplace, agency/vendor only, or an exclusive window.
CREATE TABLE core.job_sourcing_policy (
  job_id        uuid          PRIMARY KEY REFERENCES core.jobs ON DELETE CASCADE,
  marketplace_open boolean    NOT NULL DEFAULT false,
  exclusive_until  timestamptz,
  ownership_window_days smallint NOT NULL DEFAULT 90       -- first valid application owns the person for this long
);
CREATE TABLE core.job_sourcing_organisations (             -- vendors/agencies explicitly allowed on the job
  job_id          uuid        NOT NULL REFERENCES core.jobs ON DELETE CASCADE,
  organisation_id uuid        NOT NULL REFERENCES core.organisations,
  PRIMARY KEY (job_id, organisation_id)
);

-- =====================================================================
--  core · applications  (one person on one job — the pipeline row)
--  Throughline's Candidate and fastalent's Submission both hang off
--  this. The stage here is the cross-product truth; hire.joined is
--  emitted when stage becomes 'joined'.
-- =====================================================================
CREATE TABLE core.applications (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid          NOT NULL REFERENCES core.jobs,
  person_id     uuid          NOT NULL REFERENCES core.people,
  channel       core.application_channel NOT NULL,
  source_organisation_id uuid REFERENCES core.organisations,   -- vendor or agency that submitted
  submitted_by_user_id   uuid REFERENCES core.users,           -- recruiter / partner user
  cv_document_id uuid         REFERENCES core.documents,       -- CV as submitted for this job
  expected_ctc  numeric(14,2),
  notice_period_days smallint,
  stage         core.application_stage NOT NULL DEFAULT 'submitted',
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  is_duplicate  boolean       NOT NULL DEFAULT false,      -- lost the ownership race
  owner_application_id uuid   REFERENCES core.applications,  -- the application that owns the person on this job
  joined_at     date,
  employee_id   text,                                      -- HR-system id after hire.joined round-trips
  origin        core.origin_app NOT NULL,
  legacy_throughline_candidate_id int UNIQUE,
  legacy_fastalent_submission_id  text UNIQUE,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (job_id, person_id, source_organisation_id)
);
CREATE INDEX ON core.applications (job_id, stage);
CREATE INDEX ON core.applications (person_id);
CREATE INDEX ON core.applications (source_organisation_id, stage);

CREATE TABLE core.application_stage_history (
  id            bigserial     PRIMARY KEY,
  application_id uuid         NOT NULL REFERENCES core.applications ON DELETE CASCADE,
  from_stage    core.application_stage,
  to_stage      core.application_stage NOT NULL,
  changed_by_user_id uuid     REFERENCES core.users,
  reason        text,
  origin        core.origin_app NOT NULL,
  changed_at    timestamptz   NOT NULL DEFAULT now()
);

-- =====================================================================
--  core · screening results  (writer: Screening Service)
-- =====================================================================
CREATE TABLE core.screening_results (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid         NOT NULL REFERENCES core.applications ON DELETE CASCADE,
  kind          core.screening_kind NOT NULL,
  provider      core.screening_provider NOT NULL DEFAULT 'internal',
  provider_ref  text,                                      -- vendor's interview/session id
  score         numeric(5,2),                              -- 0..100
  verdict       text          CHECK (verdict IN ('pass','fail','review')),
  breakdown     jsonb,                                     -- per-skill scores, must-have coverage, flags
  report_document_id uuid     REFERENCES core.documents,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX ON core.screening_results (application_id, kind);

-- Identity / liveness verification, kept separate from scores because
-- it travels with the person, not the application.
CREATE TABLE core.person_verifications (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id     uuid          NOT NULL REFERENCES core.people ON DELETE CASCADE,
  provider      core.screening_provider NOT NULL,
  check_type    text          NOT NULL,                    -- 'liveness', 'lip_sync', 'id_match', 'deepfake'
  passed        boolean       NOT NULL,
  evidence      jsonb,
  verified_at   timestamptz   NOT NULL DEFAULT now()
);

-- =====================================================================
--  core · outbox  (writer: any app inside the same transaction;
--                  reader: Hiring Event Hub relay)
-- =====================================================================
CREATE TABLE core.outbox (
  id            bigserial     PRIMARY KEY,
  event_id      uuid          NOT NULL DEFAULT gen_random_uuid() UNIQUE,  -- idempotency key for consumers
  event_type    text          NOT NULL,   -- requisition.published, candidate.submitted, candidate.status_changed,
                                          -- screening.completed, interview.scheduled, interview.completed, hire.joined,
                                          -- partner.empanelled, partner.status_changed, taxonomy.changed
  aggregate_type text         NOT NULL,   -- 'job', 'application', 'organisation', 'taxonomy'
  aggregate_id  text          NOT NULL,
  payload       jsonb         NOT NULL,
  origin        core.origin_app NOT NULL,
  occurred_at   timestamptz   NOT NULL DEFAULT now(),
  published_at  timestamptz
);
CREATE INDEX ON core.outbox (published_at) WHERE published_at IS NULL;

-- =====================================================================
--  core · functions
-- =====================================================================
CREATE OR REPLACE FUNCTION core.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','organisations','people','jobs','applications'] LOOP
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON core.%I FOR EACH ROW EXECUTE FUNCTION core.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- The one place a person is created or merged. Both apps call this.
-- Match on normalised email OR last-10-digit phone; fill blanks, never overwrite.
CREATE OR REPLACE FUNCTION core.upsert_person(
  p_full_name text, p_email text, p_phone text, p_origin core.origin_app,
  p_country_id smallint DEFAULT NULL, p_city_id int DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid; v_email citext := NULLIF(lower(trim(p_email)),''); v_phone text := core.phone_norm(p_phone);
BEGIN
  IF v_email IS NULL AND v_phone IS NULL THEN RAISE EXCEPTION 'person needs an email or a 10-digit phone'; END IF;
  SELECT id INTO v_id FROM core.people
   WHERE (v_email IS NOT NULL AND email_norm = v_email) OR (v_phone IS NOT NULL AND phone_norm = v_phone)
   ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF v_id IS NULL THEN
    INSERT INTO core.people (full_name, email, phone, country_id, city_id, origin)
    VALUES (p_full_name, p_email, p_phone, p_country_id, p_city_id, p_origin) RETURNING id INTO v_id;
  ELSE
    UPDATE core.people SET
      full_name  = COALESCE(NULLIF(full_name,''), p_full_name),
      email      = COALESCE(email, p_email),
      phone      = COALESCE(phone, p_phone),
      country_id = COALESCE(country_id, p_country_id),
      city_id    = COALESCE(city_id, p_city_id)
    WHERE id = v_id;
  END IF;
  RETURN v_id;
END $$;

-- Stage change = history row + outbox event, atomically.
CREATE OR REPLACE FUNCTION core.applications_stage_events() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO core.application_stage_history (application_id, from_stage, to_stage, origin)
    VALUES (NEW.id, NULL, NEW.stage, NEW.origin);
    INSERT INTO core.outbox (event_type, aggregate_type, aggregate_id, payload, origin)
    VALUES ('candidate.submitted', 'application', NEW.id::text,
            jsonb_build_object('applicationId', NEW.id, 'jobId', NEW.job_id, 'personId', NEW.person_id,
                               'channel', NEW.channel, 'sourceOrganisationId', NEW.source_organisation_id), NEW.origin);
  ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO core.application_stage_history (application_id, from_stage, to_stage, origin)
    VALUES (NEW.id, OLD.stage, NEW.stage, NEW.origin);
    INSERT INTO core.outbox (event_type, aggregate_type, aggregate_id, payload, origin)
    VALUES (CASE WHEN NEW.stage = 'joined' THEN 'hire.joined' ELSE 'candidate.status_changed' END,
            'application', NEW.id::text,
            jsonb_build_object('applicationId', NEW.id, 'jobId', NEW.job_id, 'personId', NEW.person_id,
                               'from', OLD.stage, 'to', NEW.stage, 'joinedAt', NEW.joined_at), NEW.origin);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER applications_stage_events AFTER INSERT OR UPDATE OF stage ON core.applications
  FOR EACH ROW EXECUTE FUNCTION core.applications_stage_events();

CREATE OR REPLACE FUNCTION core.jobs_publish_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
    INSERT INTO core.outbox (event_type, aggregate_type, aggregate_id, payload, origin)
    VALUES ('requisition.published', 'job', NEW.id::text,
            jsonb_build_object('jobId', NEW.id, 'hrqNumber', NEW.hrq_number, 'title', NEW.title,
                               'ownerOrganisationId', NEW.owner_organisation_id, 'employmentType', NEW.employment_type), NEW.origin);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER jobs_publish_event BEFORE INSERT OR UPDATE OF status ON core.jobs
  FOR EACH ROW EXECUTE FUNCTION core.jobs_publish_event();

-- =====================================================================
--  core · grants and row-level security  (rule 2)
-- =====================================================================
GRANT USAGE ON SCHEMA core TO app_fastalent, app_throughline, app_screening, app_hub;
GRANT SELECT ON ALL TABLES IN SCHEMA core TO app_fastalent, app_throughline, app_screening, app_hub;

-- taxonomy: Throughline admin is the only writer
GRANT INSERT, UPDATE ON core.countries, core.states, core.cities, core.domains, core.sub_domains,
                       core.skills, core.skill_aliases, core.job_levels, core.lookups TO app_throughline;

-- shared entities: both apps insert; each app updates only rows it originated
GRANT INSERT, UPDATE ON core.users, core.organisations, core.organisation_domains, core.organisation_skills,
                       core.organisation_members, core.documents, core.people, core.person_skills,
                       core.person_preferred_locations, core.jobs, core.job_skills, core.job_locations,
                       core.job_sourcing_policy, core.job_sourcing_organisations, core.applications,
                       core.application_stage_history, core.outbox
  TO app_fastalent, app_throughline;
GRANT INSERT ON core.screening_results, core.person_verifications, core.outbox TO app_screening;
GRANT UPDATE (published_at) ON core.outbox TO app_hub;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO app_fastalent, app_throughline, app_screening;

ALTER TABLE core.jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_read        ON core.jobs FOR SELECT USING (true);
CREATE POLICY jobs_fastalent   ON core.jobs TO app_fastalent   USING (origin = 'fastalent')   WITH CHECK (origin = 'fastalent');
CREATE POLICY jobs_throughline ON core.jobs TO app_throughline USING (origin = 'throughline') WITH CHECK (origin = 'throughline');

CREATE POLICY apps_read        ON core.applications FOR SELECT USING (true);
CREATE POLICY apps_fastalent   ON core.applications TO app_fastalent   USING (origin = 'fastalent')   WITH CHECK (origin = 'fastalent');
CREATE POLICY apps_throughline ON core.applications TO app_throughline USING (origin = 'throughline') WITH CHECK (origin = 'throughline');

CREATE POLICY orgs_read        ON core.organisations FOR SELECT USING (true);
CREATE POLICY orgs_fastalent   ON core.organisations TO app_fastalent   USING (kind IN ('client_company','staffing_agency')) WITH CHECK (kind IN ('client_company','staffing_agency'));
CREATE POLICY orgs_throughline ON core.organisations TO app_throughline USING (kind IN ('vendor','client_company'))           WITH CHECK (kind IN ('vendor','client_company'));

-- =====================================================================
--  Cross-schema rule check (rule 1): no FK may point from fastalent.*
--  to throughline.* or back. Run after every migration.
-- =====================================================================
CREATE OR REPLACE VIEW core.v_cross_product_fks AS
SELECT c.conname, n1.nspname AS from_schema, r1.relname AS from_table, n2.nspname AS to_schema, r2.relname AS to_table
FROM pg_constraint c
JOIN pg_class r1 ON r1.oid = c.conrelid JOIN pg_namespace n1 ON n1.oid = r1.relnamespace
JOIN pg_class r2 ON r2.oid = c.confrelid JOIN pg_namespace n2 ON n2.oid = r2.relnamespace
WHERE c.contype = 'f'
  AND n1.nspname IN ('fastalent','throughline') AND n2.nspname IN ('fastalent','throughline')
  AND n1.nspname <> n2.nspname;
