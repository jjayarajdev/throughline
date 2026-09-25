-- =====================================================================
--  project-core.sql — project the legacy throughline.* tables into core.*
--
--  Idempotent: every core table this script fills is emptied first (DELETE in
--  child -> parent order, so it fails loudly instead of cascading if some other
--  system already hung rows off the migrated data, e.g. core.documents).
--
--  Run inside ONE transaction as a role that bypasses RLS (postgres / core owner):
--      docker exec -i throughline-pg psql -U postgres -d platform -v ON_ERROR_STOP=1 -1 \
--          -f - < scripts/project-core.sql
--  or via scripts/project-core-report.py, which runs it and prints the migration
--  report from the mig_* temp tables this script leaves behind in the session.
--
--  Mapping rules are documented next to each section; the judgement calls are
--  summarised in docs/db/core-migration-report.md.
-- =====================================================================

SET LOCAL TIME ZONE 'Asia/Kolkata';   -- legacy timestamps are IST wall-clock (timestamp without time zone)
SET LOCAL client_min_messages = warning;
-- citext/pgcrypto were installed into schema core in this database, and core.upsert_person()
-- declares an unqualified citext variable, so core must be on the search_path for it to compile.
SET LOCAL search_path = public, core;

-- ---------------------------------------------------------------------
--  0. session helpers + report tables (temp; read by project-core-report.py)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.slug(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g'))
$$;

-- Legacy candidate emails sometimes carry a phone number or a second address
-- ("a@x.com 9876543210", "a@x.com/b@y.com", "user @gmail.com"). Keep the first
-- well-formed address; if none, keep the whitespace-stripped raw value when it
-- still looks like user@host; else NULL (the phone then identifies the person).
CREATE OR REPLACE FUNCTION pg_temp.clean_email(raw text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    substring(raw from '[A-Za-z0-9._%+''-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}'),
    substring(regexp_replace(raw, '\s', '', 'g') from '[A-Za-z0-9._%+''-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}'),
    CASE WHEN regexp_replace(coalesce(raw, ''), '\s', '', 'g') ~ '^[^@\s]+@[^@\s]+$'
         THEN regexp_replace(raw, '\s', '', 'g') END)
$$;

DROP TABLE IF EXISTS mig_note, mig_dangling, mig_users_skipped, mig_person_map, mig_people_skipped,
                     mig_app_src, mig_app_dupes, mig_app_skipped, mig_status_map, mig_run;
CREATE TEMP TABLE mig_note          (section text, key text, detail text, n bigint);
CREATE TEMP TABLE mig_dangling      (source text, ref text, legacy_id int, n bigint);
CREATE TEMP TABLE mig_users_skipped (user_id int, email text, full_name text, reason text, kept_user_id int);
CREATE TEMP TABLE mig_person_map    (candidate_id int PRIMARY KEY, person_id uuid, created boolean,
                                     full_name text, email text, phone text);
CREATE TEMP TABLE mig_people_skipped(candidate_id int, candidate_code text, full_name text, email text, phone text);
CREATE TEMP TABLE mig_app_dupes     (candidate_id int, candidate_code text, kept_candidate_id int, kept_candidate_code text,
                                     hrq text, full_name text, email text, phone text, partner_code text,
                                     created_at timestamp, stage text);
CREATE TEMP TABLE mig_app_skipped   (candidate_id int, candidate_code text, reason text);
CREATE TEMP TABLE mig_status_map    (kind text, legacy_id int, legacy_name text, core_value text, n bigint);
CREATE TEMP TABLE mig_run           (k text PRIMARY KEY, v bigint);

-- ---------------------------------------------------------------------
--  1. Empty what we fill (child -> parent). core.outbox is handled at the end.
-- ---------------------------------------------------------------------
DELETE FROM core.applications;                 -- cascades: application_stage_history, screening_results
DELETE FROM core.people;                       -- cascades: person_skills, person_preferred_locations, person_verifications
DELETE FROM core.jobs;                         -- cascades: job_skills, job_locations, job_sourcing_*
DELETE FROM core.organisations;                -- cascades: organisation_domains/skills/members
DELETE FROM core.users;
DELETE FROM core.skill_aliases;
DELETE FROM core.skills;
DELETE FROM core.job_levels;
DELETE FROM core.lookups;
DELETE FROM core.sub_domains;
DELETE FROM core.domains;
DELETE FROM core.cities;
DELETE FROM core.states;
DELETE FROM core.countries;
ALTER SEQUENCE core.application_stage_history_id_seq RESTART WITH 1;

-- ---------------------------------------------------------------------
--  2. Taxonomy — legacy integer ids are reused as core ids (all fit smallint/int)
-- ---------------------------------------------------------------------
-- countries: iso2 from CountryCode when it is a 2-letter code, else 'IN' for India,
-- else the first two letters of the name. currency by iso2 (unknown -> USD).
INSERT INTO core.countries (id, iso2, name, currency, legacy_master_id)
SELECT c."Id", c.iso2, coalesce(nullif(trim(c."Name"), ''), 'Country ' || c."Id"),
       CASE c.iso2 WHEN 'IN' THEN 'INR' WHEN 'MY' THEN 'MYR' WHEN 'US' THEN 'USD' WHEN 'GB' THEN 'GBP'
                   WHEN 'SG' THEN 'SGD' WHEN 'AE' THEN 'AED' WHEN 'AU' THEN 'AUD' WHEN 'CA' THEN 'CAD' ELSE 'USD' END,
       c."Id"
FROM (SELECT m.*,
             CASE WHEN m."CountryCode" ~ '^[A-Za-z]{2}$' THEN upper(m."CountryCode")
                  WHEN lower(trim(m."Name")) = 'india' THEN 'IN'
                  ELSE upper(left(regexp_replace(coalesce(m."Name", ''), '[^A-Za-z]', '', 'g') || 'XX', 2)) END AS iso2
      FROM throughline."M_Countries" m) c
ORDER BY c."Id";

INSERT INTO core.states (id, country_id, name, legacy_master_id)
SELECT s."Id", s."CountryId", coalesce(nullif(trim(s."Name"), ''), 'State ' || s."Id"), s."Id"
FROM throughline."M_States" s JOIN core.countries c ON c.id = s."CountryId"
ORDER BY s."Id";
INSERT INTO mig_dangling SELECT 'M_States.CountryId', 'country', s."CountryId", count(*)
FROM throughline."M_States" s WHERE NOT EXISTS (SELECT 1 FROM core.countries c WHERE c.id = s."CountryId") GROUP BY 3;

INSERT INTO core.cities (id, state_id, name, legacy_master_id)
SELECT c."Id", c."StateId", coalesce(nullif(trim(c."Name"), ''), 'City ' || c."Id"), c."Id"
FROM throughline."M_Cities" c JOIN core.states s ON s.id = c."StateId"
ORDER BY c."Id";
INSERT INTO mig_dangling SELECT 'M_Cities.StateId', 'state', c."StateId", count(*)
FROM throughline."M_Cities" c WHERE NOT EXISTS (SELECT 1 FROM core.states s WHERE s.id = c."StateId") GROUP BY 3;

INSERT INTO core.domains (id, name, is_active, legacy_master_id)
SELECT d."Id", coalesce(nullif(trim(d."Name"), ''), 'Domain ' || d."Id"), coalesce(d."IsActive", true), d."Id"
FROM throughline."M_Domains" d ORDER BY d."Id";

INSERT INTO core.sub_domains (id, domain_id, name, is_active, legacy_master_id)
SELECT s."Id", s."DomainId", coalesce(nullif(trim(s."Name"), ''), 'Sub-domain ' || s."Id"), coalesce(s."IsActive", true), s."Id"
FROM throughline."M_SubDomains" s JOIN core.domains d ON d.id = s."DomainId"
ORDER BY s."Id";
INSERT INTO mig_dangling SELECT 'M_SubDomains.DomainId', 'domain', s."DomainId", count(*)
FROM throughline."M_SubDomains" s WHERE NOT EXISTS (SELECT 1 FROM core.domains d WHERE d.id = s."DomainId") GROUP BY 3;

-- skills: slug = lower(name), non-alphanumerics -> '-', trimmed. If two skills slug to the
-- same value the later id gets '<slug>-<id>' and the collision is noted (no alias rows are
-- needed: every legacy skill keeps its own row and id).
INSERT INTO core.skills (id, name, slug, is_primary, is_active, legacy_master_id)
SELECT x."Id", x.nm, CASE WHEN x.rn = 1 THEN x.s ELSE x.s || '-' || x."Id" END,
       coalesce(x."IsPrimary", true), coalesce(x."IsActive", true), x."Id"
FROM (SELECT k."Id", k."IsPrimary", k."IsActive",
             coalesce(nullif(trim(k."Name"), ''), 'Skill ' || k."Id") AS nm,
             coalesce(nullif(pg_temp.slug(k."Name"), ''), 'skill-' || k."Id") AS s,
             row_number() OVER (PARTITION BY coalesce(nullif(pg_temp.slug(k."Name"), ''), 'skill-' || k."Id") ORDER BY k."Id") AS rn
      FROM throughline."M_Skills" k) x
ORDER BY x."Id";
INSERT INTO mig_note SELECT 'skills', 'slug collision', k.id || ': ' || k.name || ' -> ' || k.slug, 1
FROM core.skills k WHERE k.slug ~ ('-' || k.id || '$');

INSERT INTO core.job_levels (id, name, experience_min, experience_max, sort_order, legacy_master_id)
SELECT j."Id", coalesce(nullif(trim(j."Name"), ''), 'Level ' || j."Id"), j."DefaultExperience", j."ExperienceRange",
       coalesce(j."OrderId", 0), j."Id"
FROM throughline."M_JobLevel" j ORDER BY j."Id";

-- lookups: M_MasterData groups that are reference lists (not workflow statuses).
-- list = snake_case of the MASTER_TYPE enum member (a few shortened to the names the
-- core DDL comments use), code = slug(Name), id = legacy id.
INSERT INTO core.lookups (id, list, code, label, sort_order, is_active, legacy_master_id)
SELECT DISTINCT ON (l.list, pg_temp.slug(m."Name"))
       m."Id", l.list, pg_temp.slug(m."Name"), trim(m."Name"), coalesce(m."OrderId", 0), coalesce(m."IsActive", true), m."Id"
FROM throughline."M_MasterData" m
JOIN (VALUES ( 1, 'agreement_type'),      ( 2, 'business_unit'),        ( 7, 'employee_type'),
             ( 9, 'engagement_type'),     (13, 'hiring_type'),          (14, 'hiring_activity_type'),
             (16, 'interview_round'),     (18, 'priority'),             (21, 'po_type'),
             (23, 'record_type'),         (24, 'rejection_reason'),     (33, 'feedback_category'),
             (40, 'resource_type'),       (41, 'interview_mode'),       (56, 'sow_cr_type'),
             (61, 'diversity'),           (66, 'hrq_onhold_reason'),    (83, 'partner_category'),
             (86, 'partner_tier'),        (87, 'candidate_drop_reason'),(88, 'candidate_reinitiate_reason'),
             (89, 'candidate_reconsider_reason')) AS l(type_id, list) ON l.type_id = m."MasterTypeId"
WHERE nullif(pg_temp.slug(m."Name"), '') IS NOT NULL
ORDER BY l.list, pg_temp.slug(m."Name"), m."Id";
INSERT INTO mig_status_map
SELECT 'lookup_list', m."MasterTypeId", NULL, l.list, count(*)
FROM throughline."M_MasterData" m JOIN core.lookups l ON l.id = m."Id" GROUP BY 2, 4;

-- ---------------------------------------------------------------------
--  3. Users — dedupe on lower(email), keep the lowest UserId
-- ---------------------------------------------------------------------
WITH u AS (
  SELECT "UserId", "Email", "FullName", lower(trim("Email")) AS em,
         row_number() OVER (PARTITION BY lower(trim("Email")) ORDER BY "UserId") AS rn,
         min("UserId")  OVER (PARTITION BY lower(trim("Email"))) AS keep
  FROM throughline."Users" WHERE nullif(trim("Email"), '') IS NOT NULL)
INSERT INTO mig_users_skipped
SELECT "UserId", "Email", "FullName", 'duplicate email (kept UserId ' || keep || ')', keep FROM u WHERE rn > 1
UNION ALL
SELECT "UserId", "Email", "FullName", 'blank email', NULL FROM throughline."Users" WHERE nullif(trim("Email"), '') IS NULL;

INSERT INTO core.users (email, full_name, phone, status, origin, legacy_throughline_user_id, created_at, updated_at)
SELECT trim(u."Email"),
       coalesce(nullif(trim(u."FullName"), ''),
                nullif(trim(concat_ws(' ', u."FirstName", u."MiddleName", u."LastName")), ''),
                nullif(trim(u."Username"), ''), 'User ' || u."UserId"),
       nullif(trim(u."Phone"), ''),
       CASE WHEN u."IsActive" IS FALSE THEN 'inactive' ELSE 'active' END,
       'throughline', u."UserId",
       coalesce(u."CreatedAt", now()), coalesce(u."UpdatedAt", u."CreatedAt", now())
FROM throughline."Users" u
WHERE NOT EXISTS (SELECT 1 FROM mig_users_skipped s WHERE s.user_id = u."UserId")
ORDER BY u."UserId";

-- ---------------------------------------------------------------------
--  4. Organisations — the platform org that owns every legacy job, then vendors
-- ---------------------------------------------------------------------
INSERT INTO core.organisations (kind, code, legal_name, display_name, status, country_id, origin)
VALUES ('platform', 'THROUGHLINE', 'Throughline', 'Throughline', 'active',
        (SELECT id FROM core.countries WHERE iso2 = 'IN'), 'migration');

-- Partner status: the data uses the PARTNER_STATUS group (19001..19004); the
-- ACTIVE_INACTIVE_STATUS ids (25001/25002) are accepted too.
INSERT INTO core.organisations (kind, code, legal_name, display_name, status, country_id, state_id, city_id,
                                address, pincode, origin, legacy_throughline_partner_id, created_at, updated_at)
SELECT 'vendor', nullif(trim(p."PartnerCode"), ''),
       coalesce(nullif(trim(p."PartnerName"), ''), 'Partner ' || p."Id"),
       coalesce(nullif(trim(p."PartnerName"), ''), 'Partner ' || p."Id"),
       CASE p."PartnerStatusId" WHEN 19001 THEN 'active' WHEN 25001 THEN 'active'
                                WHEN 19002 THEN 'inactive' WHEN 25002 THEN 'inactive'
                                WHEN 19003 THEN 'pending_approval' WHEN 19004 THEN 'rejected'
                                ELSE 'draft' END::core.org_status,
       (SELECT id FROM core.countries WHERE id = p."CountryId"),
       (SELECT id FROM core.states    WHERE id = p."StateId"),
       (SELECT id FROM core.cities    WHERE id = p."CityId"),
       nullif(trim(p."Address"), ''), nullif(trim(p."Pincode"), ''),
       'throughline', p."Id", coalesce(p."CreatedAt", now()), coalesce(p."UpdatedAt", p."CreatedAt", now())
FROM throughline."Partners" p ORDER BY p."Id";
INSERT INTO mig_status_map
SELECT 'partner_status', p."PartnerStatusId", m."Name", o.status::text, count(*)
FROM throughline."Partners" p JOIN core.organisations o ON o.legacy_throughline_partner_id = p."Id"
LEFT JOIN throughline."M_MasterData" m ON m."Id" = p."PartnerStatusId" GROUP BY 2, 3, 4;

INSERT INTO core.organisation_domains (organisation_id, sub_domain_id)
SELECT DISTINCT o.id, x
FROM throughline."Partners" p JOIN core.organisations o ON o.legacy_throughline_partner_id = p."Id",
     unnest(p."SubDomainIds") x
WHERE EXISTS (SELECT 1 FROM core.sub_domains s WHERE s.id = x);
INSERT INTO mig_dangling SELECT 'Partners.SubDomainIds', 'sub_domain', x, count(*)
FROM throughline."Partners" p, unnest(p."SubDomainIds") x
WHERE NOT EXISTS (SELECT 1 FROM core.sub_domains s WHERE s.id = x) GROUP BY 3;

INSERT INTO core.organisation_skills (organisation_id, skill_id)
SELECT DISTINCT o.id, x
FROM throughline."Partners" p JOIN core.organisations o ON o.legacy_throughline_partner_id = p."Id",
     unnest(p."SkillIds") x
WHERE EXISTS (SELECT 1 FROM core.skills s WHERE s.id = x);
INSERT INTO mig_dangling SELECT 'Partners.SkillIds', 'skill', x, count(*)
FROM throughline."Partners" p, unnest(p."SkillIds") x
WHERE NOT EXISTS (SELECT 1 FROM core.skills s WHERE s.id = x) GROUP BY 3;
INSERT INTO mig_dangling SELECT 'Partners.CityId', 'city', p."CityId", count(*) FROM throughline."Partners" p
WHERE p."CityId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.cities c WHERE c.id = p."CityId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'Partners.StateId', 'state', p."StateId", count(*) FROM throughline."Partners" p
WHERE p."StateId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.states c WHERE c.id = p."StateId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'Partners.CountryId', 'country', p."CountryId", count(*) FROM throughline."Partners" p
WHERE p."CountryId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.countries c WHERE c.id = p."CountryId") GROUP BY 3;

-- organisation_members: ContactMatrices (role by ContactMatrixTypeId) + EscalationMatrices
-- (role 'escalation', level = ContactTypeId - 10000), only where the contact email is a core user.
INSERT INTO core.organisation_members (organisation_id, user_id, role, escalation_level, is_primary)
SELECT DISTINCT ON (o.id, u.id, r.role) o.id, u.id, r.role, NULL::smallint, false
FROM throughline."ContactMatrices" cm
JOIN core.organisations o ON o.legacy_throughline_partner_id = cm."PartnerId"
JOIN core.users u ON u.email = trim(cm."Email")
JOIN (VALUES (1, 'hiring_spoc'::core.contact_role), (2, 'account_manager'), (3, 'hr_spoc'),
             (4, 'finance_spoc'), (5, 'compliance_spoc')) AS r(type_id, role) ON r.type_id = cm."ContactMatrixTypeId"
WHERE coalesce(cm."IsActive", true)
ORDER BY o.id, u.id, r.role, cm."Id";
INSERT INTO core.organisation_members (organisation_id, user_id, role, escalation_level, is_primary)
SELECT DISTINCT ON (o.id, u.id) o.id, u.id, 'escalation',
       CASE WHEN em."ContactTypeId" BETWEEN 10001 AND 10999 THEN em."ContactTypeId" - 10000 END, false
FROM throughline."EscalationMatrices" em
JOIN core.organisations o ON o.legacy_throughline_partner_id = em."PartnerId"
JOIN core.users u ON u.email = trim(em."Email")
WHERE coalesce(em."IsActive", true)
ORDER BY o.id, u.id, em."ContactTypeId", em."Id"
ON CONFLICT DO NOTHING;
INSERT INTO mig_note SELECT 'organisation_members', 'contact rows without a matching core.users email', NULL, count(*)
FROM throughline."ContactMatrices" cm WHERE NOT EXISTS (SELECT 1 FROM core.users u WHERE u.email = trim(cm."Email"));
INSERT INTO mig_note SELECT 'organisation_members', 'escalation rows without a matching core.users email', NULL, count(*)
FROM throughline."EscalationMatrices" em WHERE NOT EXISTS (SELECT 1 FROM core.users u WHERE u.email = trim(em."Email"));

-- ---------------------------------------------------------------------
--  5. Jobs — Hiring JOIN JobDetails (one JobDetails per Hiring; LEFT JOIN so a
--     requisition without details still comes across)
--
--  status (HiringStatusId):  12001 NEW -> pending_approval, 12002 WIP -> published,
--     12003 OFFER_ACCEPTED -> published, 12004 CANDIDATE_IDENTIFIED -> published
--     (both are "in-progress" per the enum comments), 12005 ON_HOLD -> on_hold,
--     12006 CALLED_OFF -> cancelled, 12007 CLOSED -> closed, 12008 CANCELLED -> cancelled,
--     anything else -> draft.
--  employment_type: 7001 -> permanent / 7002 -> contract from EngagementTypeId or
--     HiringTypeId; the legacy data never uses those ids there (EngagementTypeId holds
--     9001 "Labour", HiringTypeId holds 13xxx deal types), so fall back to
--     JobDetails.ResourceTypeId 40002 "Contract" -> contract, else permanent.
-- ---------------------------------------------------------------------
INSERT INTO core.jobs (hrq_number, origin, owner_organisation_id, title, description, employment_type, status,
                       domain_id, sub_domain_id, job_level_id, priority_lookup_id, country_id,
                       experience_min, experience_max, open_positions,
                       requested_by_user_id, hiring_manager_user_id, published_at, closed_at,
                       legacy_throughline_hiring_id, created_at, updated_at)
SELECT nullif(trim(h."HrqId"), ''), 'throughline',
       (SELECT id FROM core.organisations WHERE kind = 'platform' AND code = 'THROUGHLINE'),
       coalesce(nullif(trim(h."JobTitle"), ''), h."HrqId", 'HRQ ' || h."Id"),
       nullif(trim(j."JobDescription"), ''),
       CASE WHEN 7001 IN (h."EngagementTypeId", h."HiringTypeId") THEN 'permanent'
            WHEN 7002 IN (h."EngagementTypeId", h."HiringTypeId") THEN 'contract'
            WHEN j."ResourceTypeId" = 40002 THEN 'contract'
            ELSE 'permanent' END::core.employment_type,
       CASE h."HiringStatusId" WHEN 12001 THEN 'pending_approval' WHEN 12002 THEN 'published'
                               WHEN 12003 THEN 'published'        WHEN 12004 THEN 'published'
                               WHEN 12005 THEN 'on_hold'          WHEN 12006 THEN 'cancelled'
                               WHEN 12007 THEN 'closed'           WHEN 12008 THEN 'cancelled'
                               ELSE 'draft' END::core.job_status,
       (SELECT id FROM core.domains     WHERE id = h."DomainId"),
       (SELECT id FROM core.sub_domains WHERE id = j."SubDomainId"),
       (SELECT id FROM core.job_levels  WHERE id = j."JobLevelId"),
       (SELECT id FROM core.lookups     WHERE id = j."JobPriorityId"),
       (SELECT id FROM core.countries   WHERE id = j."CountryId"),
       j."RelevantExperience",
       CASE WHEN j."TotalExperience" >= coalesce(j."RelevantExperience", 0) THEN j."TotalExperience" END,
       greatest(coalesce(h."NumberOfPositions", 1), 1),
       (SELECT id FROM core.users WHERE legacy_throughline_user_id = h."RequestorId"),
       (SELECT id FROM core.users WHERE legacy_throughline_user_id = h."HiringMangerId"),
       h."RequestCreationDate",
       coalesce(h."ClosedDate", CASE WHEN h."HiringStatusId" IN (12006, 12008) THEN h."CancelledDate" END),
       h."Id", coalesce(h."CreatedAt", h."RequestCreationDate", now()), coalesce(h."UpdatedAt", h."CreatedAt", now())
FROM throughline."Hiring" h
LEFT JOIN throughline."JobDetails" j ON j."HiringRequestId" = h."Id"
ORDER BY h."Id";

INSERT INTO mig_status_map
SELECT 'hiring_status', h."HiringStatusId", m."Name", jb.status::text, count(*)
FROM throughline."Hiring" h JOIN core.jobs jb ON jb.legacy_throughline_hiring_id = h."Id"
LEFT JOIN throughline."M_MasterData" m ON m."Id" = h."HiringStatusId" GROUP BY 2, 3, 4;
INSERT INTO mig_status_map
SELECT 'employment_type(EngagementTypeId/HiringTypeId/ResourceTypeId)',
       coalesce(j."ResourceTypeId", 0),
       concat_ws(' / ', 'EngagementTypeId ' || coalesce(h."EngagementTypeId"::text, 'null'),
                        'HiringTypeId ' || coalesce(h."HiringTypeId"::text, 'null'),
                        'ResourceTypeId ' || coalesce(j."ResourceTypeId"::text, 'null')),
       jb.employment_type::text, count(*)
FROM throughline."Hiring" h JOIN core.jobs jb ON jb.legacy_throughline_hiring_id = h."Id"
LEFT JOIN throughline."JobDetails" j ON j."HiringRequestId" = h."Id" GROUP BY 2, 3, 4;

INSERT INTO mig_dangling SELECT 'Hiring.DomainId', 'domain', h."DomainId", count(*) FROM throughline."Hiring" h
WHERE h."DomainId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.domains d WHERE d.id = h."DomainId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'Hiring.RequestorId', 'user', h."RequestorId", count(*) FROM throughline."Hiring" h
WHERE h."RequestorId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.users u WHERE u.legacy_throughline_user_id = h."RequestorId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'Hiring.HiringMangerId', 'user', h."HiringMangerId", count(*) FROM throughline."Hiring" h
WHERE h."HiringMangerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.users u WHERE u.legacy_throughline_user_id = h."HiringMangerId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'JobDetails.SubDomainId', 'sub_domain', j."SubDomainId", count(*) FROM throughline."JobDetails" j
WHERE j."SubDomainId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.sub_domains d WHERE d.id = j."SubDomainId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'JobDetails.JobLevelId', 'job_level', j."JobLevelId", count(*) FROM throughline."JobDetails" j
WHERE j."JobLevelId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.job_levels d WHERE d.id = j."JobLevelId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'JobDetails.JobPriorityId', 'lookup', j."JobPriorityId", count(*) FROM throughline."JobDetails" j
WHERE j."JobPriorityId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.lookups d WHERE d.id = j."JobPriorityId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'JobDetails.CountryId', 'country', j."CountryId", count(*) FROM throughline."JobDetails" j
WHERE j."CountryId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.countries d WHERE d.id = j."CountryId") GROUP BY 3;

-- job_skills: PrimarySkills mandatory, SecondarySkills optional (primary wins on overlap)
INSERT INTO core.job_skills (job_id, skill_id, is_mandatory)
SELECT DISTINCT ON (jb.id, x) jb.id, x, m
FROM throughline."JobDetails" j JOIN core.jobs jb ON jb.legacy_throughline_hiring_id = j."HiringRequestId"
CROSS JOIN LATERAL (SELECT unnest(j."PrimarySkills") AS x, true AS m
                    UNION ALL SELECT unnest(j."SecondarySkills"), false) s
WHERE EXISTS (SELECT 1 FROM core.skills k WHERE k.id = x)
ORDER BY jb.id, x, m DESC;
INSERT INTO mig_dangling SELECT 'JobDetails.PrimarySkills', 'skill', x, count(*) FROM throughline."JobDetails" j, unnest(j."PrimarySkills") x
WHERE NOT EXISTS (SELECT 1 FROM core.skills k WHERE k.id = x) GROUP BY 3;
INSERT INTO mig_dangling SELECT 'JobDetails.SecondarySkills', 'skill', x, count(*) FROM throughline."JobDetails" j, unnest(j."SecondarySkills") x
WHERE NOT EXISTS (SELECT 1 FROM core.skills k WHERE k.id = x) GROUP BY 3;

-- job_locations: PrimaryCityIds primary, SecondaryCityIds secondary (primary wins on overlap)
INSERT INTO core.job_locations (job_id, city_id, is_primary)
SELECT DISTINCT ON (jb.id, x) jb.id, x, p
FROM throughline."JobDetails" j JOIN core.jobs jb ON jb.legacy_throughline_hiring_id = j."HiringRequestId"
CROSS JOIN LATERAL (SELECT unnest(j."PrimaryCityIds") AS x, true AS p
                    UNION ALL SELECT unnest(j."SecondaryCityIds"), false) s
WHERE EXISTS (SELECT 1 FROM core.cities c WHERE c.id = x)
ORDER BY jb.id, x, p DESC;
INSERT INTO mig_dangling SELECT 'JobDetails.PrimaryCityIds', 'city', x, count(*) FROM throughline."JobDetails" j, unnest(j."PrimaryCityIds") x
WHERE NOT EXISTS (SELECT 1 FROM core.cities c WHERE c.id = x) GROUP BY 3;
INSERT INTO mig_dangling SELECT 'JobDetails.SecondaryCityIds', 'city', x, count(*) FROM throughline."JobDetails" j, unnest(j."SecondaryCityIds") x
WHERE NOT EXISTS (SELECT 1 FROM core.cities c WHERE c.id = x) GROUP BY 3;

-- ---------------------------------------------------------------------
--  6. People — through core.upsert_person() in CandidateForms.Id order, so merges
--     (same normalised email OR same last-10-digit phone) are deterministic.
-- ---------------------------------------------------------------------
DO $$
DECLARE r record; v uuid;
BEGIN
  FOR r IN
    SELECT c."Id", c."CandidateCode", nullif(trim(c."FullName"), '') AS fn,
           pg_temp.clean_email(c."Email") AS em, nullif(trim(c."PhoneNumber"), '') AS ph,
           (SELECT id FROM core.countries WHERE id = c."CountryId") AS country_id,
           (SELECT id FROM core.cities    WHERE id = c."CityId")    AS city_id
    FROM throughline."CandidateForms" c ORDER BY c."Id"
  LOOP
    IF nullif(lower(trim(r.em)), '') IS NULL AND core.phone_norm(r.ph) IS NULL THEN
      INSERT INTO mig_people_skipped VALUES (r."Id", r."CandidateCode", r.fn, r.em, r.ph);
      CONTINUE;
    END IF;
    v := core.upsert_person(coalesce(r.fn, 'Candidate ' || r."CandidateCode"), r.em, r.ph, 'migration',
                            r.country_id::smallint, r.city_id);
    INSERT INTO mig_person_map
    VALUES (r."Id", v, NOT EXISTS (SELECT 1 FROM mig_person_map WHERE person_id = v), r.fn, r.em, r.ph);
  END LOOP;
END $$;
INSERT INTO mig_note SELECT 'people', 'emails cleaned (first well-formed address kept)', c."Id" || ': ' || c."Email" || ' -> ' || coalesce(pg_temp.clean_email(c."Email"), 'NULL'), 1
FROM throughline."CandidateForms" c
WHERE nullif(trim(c."Email"), '') IS NOT NULL AND pg_temp.clean_email(c."Email") IS DISTINCT FROM trim(c."Email");

-- remaining person columns from the FIRST candidate row of each person (lowest Id);
-- talent_pool_consent is true if ANY of the person's rows consented.
UPDATE core.people p SET
  state_id                  = (SELECT id FROM core.states WHERE id = f."StateId"),
  current_organisation      = nullif(trim(f."CurrentOrganisation"), ''),
  last_organisation         = nullif(trim(f."LastOrganisation"), ''),
  currently_working         = CASE lower(trim(f."CurrentlyWorking")) WHEN 'yes' THEN true WHEN 'no' THEN false END,
  relevant_experience_years = f."RelevantExperience",
  notice_period_days        = f."NoticePeriod",
  last_working_day          = f."LastWorkingDay"::date,
  talent_pool_consent       = f.consent,
  talent_pool_consent_at    = CASE WHEN f.consent THEN f.first_created END,
  legacy_throughline_candidate_code = f."CandidateCode",
  created_at                = coalesce(f.first_created, p.created_at)
FROM (SELECT DISTINCT ON (m.person_id) m.person_id, c.*,
             bool_or(coalesce(c."ConsideredForFutureRequirements", false)) OVER (PARTITION BY m.person_id) AS consent,
             min(c."CreatedAt") OVER (PARTITION BY m.person_id) AS first_created
      FROM mig_person_map m JOIN throughline."CandidateForms" c ON c."Id" = m.candidate_id
      ORDER BY m.person_id, m.candidate_id) f
WHERE p.id = f.person_id;

INSERT INTO core.person_skills (person_id, skill_id, is_primary)
SELECT DISTINCT ON (m.person_id, x) m.person_id, x, pr
FROM mig_person_map m JOIN throughline."CandidateForms" c ON c."Id" = m.candidate_id
CROSS JOIN LATERAL (SELECT unnest(c."PrimarySkillIds") AS x, true AS pr
                    UNION ALL SELECT unnest(c."SecondarySkillIds"), false) s
WHERE EXISTS (SELECT 1 FROM core.skills k WHERE k.id = x)
ORDER BY m.person_id, x, pr DESC;
INSERT INTO mig_dangling SELECT 'CandidateForms.PrimarySkillIds', 'skill', x, count(*) FROM throughline."CandidateForms" c, unnest(c."PrimarySkillIds") x
WHERE NOT EXISTS (SELECT 1 FROM core.skills k WHERE k.id = x) GROUP BY 3;
INSERT INTO mig_dangling SELECT 'CandidateForms.SecondarySkillIds', 'skill', x, count(*) FROM throughline."CandidateForms" c, unnest(c."SecondarySkillIds") x
WHERE NOT EXISTS (SELECT 1 FROM core.skills k WHERE k.id = x) GROUP BY 3;

INSERT INTO core.person_preferred_locations (person_id, city_id)
SELECT DISTINCT m.person_id, x
FROM mig_person_map m JOIN throughline."CandidateForms" c ON c."Id" = m.candidate_id, unnest(c."PreferredWorkLocationIds") x
WHERE EXISTS (SELECT 1 FROM core.cities k WHERE k.id = x);
INSERT INTO mig_dangling SELECT 'CandidateForms.PreferredWorkLocationIds', 'city', x, count(*) FROM throughline."CandidateForms" c, unnest(c."PreferredWorkLocationIds") x
WHERE NOT EXISTS (SELECT 1 FROM core.cities k WHERE k.id = x) GROUP BY 3;
INSERT INTO mig_dangling SELECT 'CandidateForms.CityId', 'city', c."CityId", count(*) FROM throughline."CandidateForms" c
WHERE c."CityId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.cities k WHERE k.id = c."CityId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'CandidateForms.StateId', 'state', c."StateId", count(*) FROM throughline."CandidateForms" c
WHERE c."StateId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.states k WHERE k.id = c."StateId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'CandidateForms.CountryId', 'country', c."CountryId", count(*) FROM throughline."CandidateForms" c
WHERE c."CountryId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.countries k WHERE k.id = c."CountryId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'CandidateForms.PartnerId', 'organisation', c."PartnerId", count(*) FROM throughline."CandidateForms" c
WHERE c."PartnerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.organisations o WHERE o.legacy_throughline_partner_id = c."PartnerId") GROUP BY 3;
INSERT INTO mig_dangling SELECT 'CandidateForms.HiringRequestId', 'job', c."HiringRequestId", count(*) FROM throughline."CandidateForms" c
WHERE NOT EXISTS (SELECT 1 FROM core.jobs j WHERE j.legacy_throughline_hiring_id = c."HiringRequestId") GROUP BY 3;

-- ---------------------------------------------------------------------
--  7. Applications — one per (job, person, source organisation); on collision the
--     EARLIEST CandidateForms row (CreatedAt, then Id) is kept, the rest are listed.
--
--  stage precedence (first match wins; IntakeStatusId holds the 15xxx pipeline ids):
--     1 joined         CandidateJoinedOn set  OR IntakeStatusId 15008 ONBOARDED
--     2 offer_accepted OfferAcceptedOn set    OR 15011 OFFER_ACCEPTED
--     3 offered        OfferRolledOutOn set   OR 15007 OFFER_ROLLED_OUT
--     4 withdrawn      OfferDeclinedOn set    OR 15012 OFFER_DECLINED   (candidate declined)
--     5 rejected       CandidateRejectedOn set OR 15005 REJECTED
--     6 dropped        CandidateDroppedOn set OR 15010 CANDIDATE_DROP
--     7 on_hold        CandidateOnholdOn set  OR 15006 ONHOLD
--     8 shortlisted    15009 CANDIDATE_IDENTIFIED
--     9 interviewing   15003 INTERVIEWING or 15004 FEEDBACK_PENDING
--    10 screening      15002 SCREENING
--    11 submitted      anything else
-- ---------------------------------------------------------------------
CREATE TEMP TABLE mig_app_src AS
SELECT c."Id" AS candidate_id, c."CandidateCode" AS candidate_code, jb.id AS job_id, jb.hrq_number,
       m.person_id, o.id AS org_id, o.code AS partner_code, m.full_name, m.email, m.phone,
       c."CreatedAt" AS created_at, coalesce(c."UpdatedAt", c."CreatedAt") AS updated_at,
       c."IntakeStatusId", c."CandidateStatusId", c."NoticePeriod", nullif(trim(c."EmployeeId"), '') AS employee_id,
       (SELECT id FROM core.users u WHERE u.legacy_throughline_user_id = c."CreatedBy") AS submitted_by,
       st.stage, st.stage_at, c."CandidateJoinedOn"::date AS joined_at,
       row_number() OVER (PARTITION BY jb.id, m.person_id, o.id ORDER BY c."CreatedAt" NULLS LAST, c."Id") AS rn,
       first_value(c."Id") OVER (PARTITION BY jb.id, m.person_id, o.id ORDER BY c."CreatedAt" NULLS LAST, c."Id") AS keep_id
FROM throughline."CandidateForms" c
JOIN mig_person_map m ON m.candidate_id = c."Id"
JOIN core.jobs jb ON jb.legacy_throughline_hiring_id = c."HiringRequestId"
LEFT JOIN core.organisations o ON o.legacy_throughline_partner_id = c."PartnerId"
CROSS JOIN LATERAL (
  SELECT CASE
    WHEN c."CandidateJoinedOn"   IS NOT NULL OR c."IntakeStatusId" = 15008 THEN 'joined'
    WHEN c."OfferAcceptedOn"     IS NOT NULL OR c."IntakeStatusId" = 15011 THEN 'offer_accepted'
    WHEN c."OfferRolledOutOn"    IS NOT NULL OR c."IntakeStatusId" = 15007 THEN 'offered'
    WHEN c."OfferDeclinedOn"     IS NOT NULL OR c."IntakeStatusId" = 15012 THEN 'withdrawn'
    WHEN c."CandidateRejectedOn" IS NOT NULL OR c."IntakeStatusId" = 15005 THEN 'rejected'
    WHEN c."CandidateDroppedOn"  IS NOT NULL OR c."IntakeStatusId" = 15010 THEN 'dropped'
    WHEN c."CandidateOnholdOn"   IS NOT NULL OR c."IntakeStatusId" = 15006 THEN 'on_hold'
    WHEN c."IntakeStatusId" = 15009 THEN 'shortlisted'
    WHEN c."IntakeStatusId" IN (15003, 15004) THEN 'interviewing'
    WHEN c."IntakeStatusId" = 15002 THEN 'screening'
    ELSE 'submitted' END AS stage,
  coalesce(
    CASE
      WHEN c."CandidateJoinedOn"   IS NOT NULL OR c."IntakeStatusId" = 15008 THEN c."CandidateJoinedOn"
      WHEN c."OfferAcceptedOn"     IS NOT NULL OR c."IntakeStatusId" = 15011 THEN c."OfferAcceptedOn"
      WHEN c."OfferRolledOutOn"    IS NOT NULL OR c."IntakeStatusId" = 15007 THEN c."OfferRolledOutOn"
      WHEN c."OfferDeclinedOn"     IS NOT NULL OR c."IntakeStatusId" = 15012 THEN c."OfferDeclinedOn"
      WHEN c."CandidateRejectedOn" IS NOT NULL OR c."IntakeStatusId" = 15005 THEN c."CandidateRejectedOn"
      WHEN c."CandidateDroppedOn"  IS NOT NULL OR c."IntakeStatusId" = 15010 THEN c."CandidateDroppedOn"
      WHEN c."CandidateOnholdOn"   IS NOT NULL OR c."IntakeStatusId" = 15006 THEN c."CandidateOnholdOn"
      WHEN c."IntakeStatusId" = 15009 THEN c."CandidateIdentifiedOn"
      WHEN c."IntakeStatusId" IN (15003, 15004) THEN c."ScreeningCompletedOn"
    END, c."UpdatedAt", c."CreatedAt", now()) AS stage_at) st;

INSERT INTO mig_app_skipped
SELECT c."Id", c."CandidateCode",
       CASE WHEN NOT EXISTS (SELECT 1 FROM mig_person_map m WHERE m.candidate_id = c."Id") THEN 'person not upserted (no email / 10-digit phone)'
            ELSE 'no core.jobs row for HiringRequestId ' || c."HiringRequestId" END
FROM throughline."CandidateForms" c
WHERE NOT EXISTS (SELECT 1 FROM mig_app_src s WHERE s.candidate_id = c."Id");

INSERT INTO core.applications (job_id, person_id, channel, source_organisation_id, submitted_by_user_id,
                               notice_period_days, stage, stage_changed_at, is_duplicate, joined_at, employee_id,
                               origin, legacy_throughline_candidate_id, created_at, updated_at)
SELECT job_id, person_id, 'throughline_partner', org_id, submitted_by,
       "NoticePeriod", stage::core.application_stage, stage_at, false, joined_at, employee_id,
       'migration', candidate_id, coalesce(created_at, now()), coalesce(updated_at, now())
FROM mig_app_src WHERE rn = 1 ORDER BY candidate_id;

INSERT INTO mig_app_dupes
SELECT s.candidate_id, s.candidate_code, s.keep_id, k.candidate_code, s.hrq_number, s.full_name, s.email, s.phone,
       s.partner_code, s.created_at, s.stage
FROM mig_app_src s JOIN mig_app_src k ON k.candidate_id = s.keep_id
WHERE s.rn > 1 ORDER BY s.hrq_number, s.keep_id, s.candidate_id;

INSERT INTO mig_status_map
SELECT 'candidate_intake_status -> stage', s."IntakeStatusId", m."Name", s.stage, count(*)
FROM mig_app_src s LEFT JOIN throughline."M_MasterData" m ON m."Id" = s."IntakeStatusId" GROUP BY 2, 3, 4;
INSERT INTO mig_status_map
SELECT 'candidate_status (3xxx, informational) -> stage', s."CandidateStatusId", m."Name", s.stage, count(*)
FROM mig_app_src s LEFT JOIN throughline."M_MasterData" m ON m."Id" = s."CandidateStatusId" GROUP BY 2, 3, 4;

-- ---------------------------------------------------------------------
--  8. Outbox — the insert triggers wrote candidate.submitted (origin migration) and
--     requisition.published (origin throughline, because jobs are origin throughline)
--     events for every migrated row. A migration must not replay events to partners,
--     so remove everything this run produced. application_stage_history is kept.
-- ---------------------------------------------------------------------
WITH d AS (
  DELETE FROM core.outbox o
  WHERE o.origin = 'migration'
     OR (o.aggregate_type = 'job' AND o.aggregate_id IN (SELECT id::text FROM core.jobs WHERE legacy_throughline_hiring_id IS NOT NULL))
  RETURNING 1)
INSERT INTO mig_run SELECT 'outbox_deleted', count(*) FROM d;
INSERT INTO mig_run SELECT 'outbox_remaining', count(*) FROM core.outbox;
INSERT INTO mig_run SELECT 'stage_history_rows', count(*) FROM core.application_stage_history;
