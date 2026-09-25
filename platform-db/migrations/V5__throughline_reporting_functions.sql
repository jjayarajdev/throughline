-- V5: Throughline reporting / grid functions (ported from SQL Server stored procedures).
--
-- Source procs (dbo.*):  GetHiringRequestDetails, sp_GetCandidateHiringDetails,
--                        sp_GetCandidateInterviewFeedback, GetMasterData
-- plus a reconstruction of sp_GetCandidate_HRQ_InterviewDetails (never existed in the
-- SQL Server schema; see notes on that function).
--
-- Result column names are the quoted CamelCase names the EF keyless entities expect
-- (PartnerHrqsGrid, GetExportCandidate, GetExportFeedbackCandidate,
--  GetExportCandidateInterviewDetails) and the MasterDto reader in MasterService.
-- Callers:  SELECT * FROM throughline.<fn>(...)
--
-- Porting notes that apply to all functions
--   * SQL Server IntListType TVPs became int[] parameters; NULL or empty array = "no filter".
--   * Comma separated id strings are parsed with string_to_array(...)::int[].
--   * JSON-text List<int> columns that are native integer[] in Postgres (InterviewRounds.Panel,
--     InterviewSlotAllocation.Panel, CandidateForms.*SkillIds/PreferredWorkLocationIds,
--     M_MasterData.RoundNameIds) are queried with = ANY(...) / && instead of STRING_SPLIT/LIKE.
--   * COUNT(*) results are cast to int so EF can materialise them into int properties.


-- ============================================================================
-- GetHiringRequestDetails
-- ============================================================================
-- The SQL Server proc in source control only declares @PartnerId, but the C# call sites
-- (HiringRequestService.GetPagedPartnerHiringRequests / ExportPartnerHiringRequestsToExcel)
-- pass @PartnerId, @HiringStatusIds, @FinancialYearStart, @FinancialYearEnd, so the
-- function takes all four:
--   p_partner_id          C# sends 0 when no partner is selected -> treated like NULL and the
--                         proc's "no partner" branch is used (on SQL Server 0 simply matched
--                         no partner row).
--   p_hiring_status_ids   comma separated M_MasterData ids; NULL/empty keeps the proc's
--                         hard-coded filter HiringStatusId IN (12002, 12004).
--   p_fy_start/p_fy_end   optional inclusive date window applied to Hiring.RequestStartDate
--                         (the same column the LINQ list filters use for financial quarters).
CREATE OR REPLACE FUNCTION throughline.get_hiring_request_details(
    p_partner_id        integer,
    p_hiring_status_ids text,
    p_fy_start          timestamp without time zone,
    p_fy_end            timestamp without time zone)
RETURNS TABLE (
    "HiringRequestId"        integer,
    "HrqId"                  text,
    "IsProxyPartner"         boolean,
    "JobTitle"               text,
    "PartnerId"              integer,
    "PartnerName"            text,
    "PartnerCode"            text,
    "BusinessId"             integer,
    "BusinessName"           text,
    "PartnerAssignedDate"    timestamp without time zone,
    "RMOwnerId"              integer,
    "RMOwnerName"            text,
    "HiringStatusId"         integer,
    "HiringStatusName"       text,
    "NumberOfPositions"      integer,
    "JobPriorityId"          integer,
    "JobPriorityName"        text,
    "CreatedAt"              timestamp without time zone,
    "UpdatedAt"              timestamp without time zone,
    "CurrentStatusHeadCount" integer)
LANGUAGE plpgsql STABLE
AS $$
#variable_conflict use_column
DECLARE
    v_status_ids integer[];
BEGIN
    IF p_hiring_status_ids IS NULL OR btrim(p_hiring_status_ids) = '' THEN
        v_status_ids := ARRAY[12002, 12004];
    ELSE
        v_status_ids := string_to_array(regexp_replace(p_hiring_status_ids, '\s', '', 'g'), ',')::integer[];
    END IF;

    IF p_partner_id IS NOT NULL AND p_partner_id <> 0 THEN
        RETURN QUERY
        SELECT
            h."Id"                                   AS "HiringRequestId",
            h."HrqId"                                AS "HrqId",
            pc."IsProxyPartner"                      AS "IsProxyPartner",
            h."JobTitle"                             AS "JobTitle",
            p."Id"                                   AS "PartnerId",
            p."PartnerName"                          AS "PartnerName",
            p."PartnerCode"                          AS "PartnerCode",
            COALESCE(bu."Id", 0)                     AS "BusinessId",
            bu."Name"                                AS "BusinessName",
            hrp."AssignedOn"                         AS "PartnerAssignedDate",
            rm."UserId"                              AS "RMOwnerId",
            rm."FullName"                            AS "RMOwnerName",
            hs."Id"                                  AS "HiringStatusId",
            hs."Name"                                AS "HiringStatusName",
            CASE
                WHEN h."IsParentHRQ" = true THEN
                    (SELECT COUNT(*)::integer FROM throughline."Hiring" h2
                      WHERE (h2."ParentHrqId" = h."HrqId" OR h2."HrqId" = h."HrqId")
                        AND h2."HiringStatusId" <> 12008
                        AND h2."BETApproverId" IS NOT NULL)
                WHEN h."IsParentHRQ" = false THEN 1
            END                                      AS "NumberOfPositions",
            jd."JobPriorityId"                       AS "JobPriorityId",
            jp."Name"                                AS "JobPriorityName",
            h."CreatedAt"                            AS "CreatedAt",
            h."UpdatedAt"                            AS "UpdatedAt",
            CASE
                WHEN h."HiringStatusId" IN (12002, 12004) THEN
                    (SELECT COUNT(*)::integer FROM throughline."Hiring" h2
                      WHERE (h2."ParentHrqId" = h."HrqId" OR h2."HrqId" = h."HrqId")
                        AND h2."HiringStatusId" = h."HiringStatusId")
                ELSE 0
            END                                      AS "CurrentStatusHeadCount"
        FROM throughline."Hiring" h
        LEFT JOIN throughline."JobDetails"        jd  ON jd."HiringRequestId" = h."Id"
        LEFT JOIN throughline."M_MasterData"      jp  ON jp."Id" = jd."JobPriorityId"
        LEFT JOIN throughline."M_MasterData"      bu  ON bu."Id" = h."BusinessId"
        LEFT JOIN throughline."M_MasterData"      hs  ON hs."Id" = h."HiringStatusId"
        LEFT JOIN throughline."Users"             rm  ON rm."UserId" = h."RmOwnerId"
        LEFT JOIN throughline."PartnerCategories" pc  ON pc."HiringRequestId" = h."Id"
        LEFT JOIN throughline."HiringReqPartner"  hrp ON hrp."PartnerCategoryId" = pc."Id"
        LEFT JOIN throughline."Partners"          p   ON p."Id" = hrp."PartnerId"
        WHERE p."Id" = p_partner_id
          AND h."HiringStatusId" = ANY (v_status_ids)
          AND (h."IsParentHRQ" = true OR h."IsParentHRQ" IS NULL)
          AND jd."Id" IS NOT NULL
          AND pc."Id" IS NOT NULL
          AND EXISTS (SELECT 1 FROM throughline."InterviewRounds" r WHERE r."HiringRequestId" = h."Id")
          AND (p_fy_start IS NULL OR p_fy_end IS NULL
               OR h."RequestStartDate"::date BETWEEN p_fy_start::date AND p_fy_end::date);
    ELSE
        RETURN QUERY
        SELECT
            h."Id"                                   AS "HiringRequestId",
            h."HrqId"                                AS "HrqId",
            pc."IsProxyPartner"                      AS "IsProxyPartner",
            h."JobTitle"                             AS "JobTitle",
            0                                        AS "PartnerId",      -- NULL on SQL Server; entity property is non-nullable int
            NULL::text                               AS "PartnerName",
            NULL::text                               AS "PartnerCode",
            COALESCE(bu."Id", 0)                     AS "BusinessId",
            bu."Name"                                AS "BusinessName",
            pc."CreatedAt"                           AS "PartnerAssignedDate",
            rm."UserId"                              AS "RMOwnerId",
            rm."FirstName"                           AS "RMOwnerName",
            hs."Id"                                  AS "HiringStatusId",
            hs."Name"                                AS "HiringStatusName",
            CASE
                WHEN h."IsParentHRQ" = true THEN
                    (SELECT COUNT(*)::integer FROM throughline."Hiring" h2
                      WHERE (h2."ParentHrqId" = h."HrqId" OR h2."HrqId" = h."HrqId")
                        AND h2."HiringStatusId" <> 12008
                        AND h2."BETApproverId" IS NOT NULL)
                WHEN h."IsParentHRQ" = false THEN 1
            END                                      AS "NumberOfPositions",
            jd."JobPriorityId"                       AS "JobPriorityId",
            jp."Name"                                AS "JobPriorityName",
            h."CreatedAt"                            AS "CreatedAt",
            h."UpdatedAt"                            AS "UpdatedAt",
            CASE
                WHEN h."HiringStatusId" IN (12002, 12004) THEN
                    (SELECT COUNT(*)::integer FROM throughline."Hiring" h2
                      WHERE (h2."ParentHrqId" = h."HrqId" OR h2."HrqId" = h."HrqId")
                        AND h2."HiringStatusId" = h."HiringStatusId")
                ELSE 0
            END                                      AS "CurrentStatusHeadCount"
        FROM throughline."Hiring" h
        LEFT JOIN throughline."JobDetails"        jd ON jd."HiringRequestId" = h."Id"
        LEFT JOIN throughline."M_MasterData"      jp ON jp."Id" = jd."JobPriorityId"
        LEFT JOIN throughline."M_MasterData"      bu ON bu."Id" = h."BusinessId"
        LEFT JOIN throughline."M_MasterData"      hs ON hs."Id" = h."HiringStatusId"
        LEFT JOIN throughline."Users"             rm ON rm."UserId" = h."RmOwnerId"
        LEFT JOIN throughline."PartnerCategories" pc ON pc."HiringRequestId" = h."Id"
        WHERE h."HiringStatusId" = ANY (v_status_ids)
          AND (h."IsParentHRQ" = true OR h."IsParentHRQ" IS NULL)
          AND jd."Id" IS NOT NULL
          AND pc."Id" IS NOT NULL
          AND EXISTS (SELECT 1 FROM throughline."InterviewRounds" r WHERE r."HiringRequestId" = h."Id")
          AND (p_fy_start IS NULL OR p_fy_end IS NULL
               OR h."RequestStartDate"::date BETWEEN p_fy_start::date AND p_fy_end::date);
    END IF;
END;
$$;


-- ============================================================================
-- sp_GetCandidateHiringDetails  ->  get_candidate_hiring_details
-- ============================================================================
-- Consumed by CandidateFormService.ExportLatestCandidateDetails (DbDataReader -> GetExportCandidate).
-- Latest CandidateFormHistory row per CandidateCode, joined to the live CandidateForms row.
-- OUTER APPLY (TOP 1 ... ORDER BY CreatedAt DESC) became LEFT JOIN LATERAL (... LIMIT 1).
-- All InterviewRounds of an HRQ share one CreatedAt, so the proc's TOP 1 was an arbitrary tie on
-- SQL Server; here the tie is broken deterministically (highest RoundNumber, then Id; latest Id
-- for the slot allocation).
-- The role check keeps the proc's literal "role id 2" test.
CREATE OR REPLACE FUNCTION throughline.get_candidate_hiring_details(
    p_intake_status_ids    integer[],
    p_partner_id           integer,
    p_logged_in_partner_id integer,
    p_logged_in_role_id    integer)
RETURNS TABLE (
    "HrqId"               text,
    "HiringStatus"        text,
    "CandidateCode"       text,
    "CandidateName"       text,
    "Email"               text,
    "PhoneNumber"         text,
    "RoleHiredFor"        text,
    "DomainName"          text,
    "SubDomainName"       text,
    "Experience"          integer,
    "Partner"             text,
    "IntakeStatusName"    text,
    "ProfileCreatedAt"    timestamp without time zone,
    "OnholdDate"          timestamp without time zone,
    "RequestStartDate"    timestamp without time zone,
    "ClosedDate"          timestamp without time zone,
    "HiringManagerName"   text,
    "LastInterviewRound"  text,
    "LastInterviewStatus" text)
LANGUAGE plpgsql STABLE
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH latest_candidate_history AS (
        SELECT cfh.*,
               ROW_NUMBER() OVER (PARTITION BY cfh."CandidateCode"
                                  ORDER BY COALESCE(cfh."UpdatedAt", cfh."CreatedAt") DESC) AS rn
        FROM throughline."CandidateFormHistory" cfh
    ),
    rows_ AS (
        SELECT DISTINCT
            hr."HrqId"                          AS "HrqId",
            hs."Name"                           AS "HiringStatus",
            lc."CandidateCode"                  AS "CandidateCode",
            cf."FullName"                       AS "CandidateName",
            cf."Email"                          AS "Email",
            cf."PhoneNumber"                    AS "PhoneNumber",
            hr."JobTitle"                       AS "RoleHiredFor",
            d."Name"::text                      AS "DomainName",
            sd."Name"::text                     AS "SubDomainName",
            jd."RelevantExperience"             AS "Experience",
            p."Nickname"                        AS "Partner",
            ist."Name"                          AS "IntakeStatusName",
            cf."CreatedAt"                      AS "ProfileCreatedAt",
            hr."OnholdDate"                     AS "OnholdDate",
            hr."RequestStartDate"               AS "RequestStartDate",
            hr."ClosedDate"                     AS "ClosedDate",
            hm."FullName"                       AS "HiringManagerName",
            rn_."Name"                          AS "LastInterviewRound",
            COALESCE(ics."Name", 'Pending')     AS "LastInterviewStatus"
        FROM latest_candidate_history lc
        INNER JOIN throughline."CandidateForms" cf  ON cf."CandidateCode" = lc."CandidateCode"
        LEFT JOIN  throughline."Partners"       p   ON p."Id" = lc."PartnerId"
        LEFT JOIN  throughline."Hiring"         hr  ON hr."Id" = lc."HiringRequestId"
        LEFT JOIN  throughline."M_MasterData"   hs  ON hs."Id" = hr."HiringStatusId"
        LEFT JOIN  throughline."M_Domains"      d   ON d."Id" = hr."DomainId"
        LEFT JOIN  throughline."JobDetails"     jd  ON jd."HiringRequestId" = hr."Id"
        LEFT JOIN  throughline."M_SubDomains"   sd  ON sd."Id" = jd."SubDomainId"
        LEFT JOIN  throughline."Users"          hm  ON hm."UserId" = hr."HiringMangerId"
        LEFT JOIN  throughline."M_MasterData"   ist ON ist."Id" = cf."IntakeStatusId"
        LEFT JOIN LATERAL (
            SELECT isa_."CandidateInterviewStatusId"
            FROM throughline."InterviewSlotAllocation" isa_
            WHERE isa_."CandidateId" = lc."CandidateId"
            ORDER BY isa_."CreatedAt" DESC, isa_."Id" DESC
            LIMIT 1
        ) isa ON TRUE
        LEFT JOIN  throughline."M_MasterData"   ics ON ics."Id" = isa."CandidateInterviewStatusId"
        LEFT JOIN LATERAL (
            SELECT ir_."RoundNameId"
            FROM throughline."InterviewRounds" ir_
            WHERE ir_."HiringRequestId" = hr."Id"
            ORDER BY ir_."CreatedAt" DESC, ir_."RoundNumber" DESC, ir_."Id" DESC
            LIMIT 1
        ) ir ON TRUE
        LEFT JOIN  throughline."M_MasterData"   rn_ ON rn_."Id" = ir."RoundNameId"
        WHERE lc.rn = 1
          AND (p_intake_status_ids IS NULL OR cardinality(p_intake_status_ids) = 0
               OR cf."IntakeStatusId" = ANY (p_intake_status_ids))
          AND (p_partner_id IS NULL OR lc."PartnerId" = p_partner_id)
          AND (p_logged_in_role_id IS NULL OR p_logged_in_role_id <> 2
               OR lc."PartnerId" = p_logged_in_partner_id)
    )
    SELECT r.* FROM rows_ r
    ORDER BY r."ProfileCreatedAt" DESC;
END;
$$;


-- ============================================================================
-- sp_GetCandidateInterviewFeedback  ->  get_candidate_interview_feedback
-- ============================================================================
-- Consumed by CandidateFormService.ExportInterviewFeedback (EF keyless GetExportFeedbackCandidate).
-- Ported literally, including the proc's own quirks:
--   * "LatestCandidateHistory" is built over CandidateForms (not the history table), so rn is
--     always 1; the history table is then joined by CandidateCode (one row per history version).
--   * InterviewSlotAllocation is joined on CandidateFormHistory.Id = InterviewSlotAllocation.CandidateId,
--     exactly as in the proc.
--   * PanelDetails: InterviewRounds.Panel is integer[] here, so STRING_SPLIT/TRY_CAST became = ANY().
CREATE OR REPLACE FUNCTION throughline.get_candidate_interview_feedback(
    p_intake_status_ids    integer[],
    p_partner_id           integer,
    p_logged_in_partner_id integer,
    p_logged_in_role_id    integer)
RETURNS TABLE (
    "HrqId"            text,
    "PartnerName"      text,
    "CandidateCode"    text,
    "FullName"         text,
    "Email"            text,
    "PhoneNumber"      text,
    "RoundName"        text,
    "RoundStatus"      text,
    "RoundNumber"      integer,
    "DateOfInterview"  timestamp without time zone,
    "Feedbackgivenby"  text,
    "FeebackDate"      timestamp without time zone,
    "PanelComments"    text,
    "ProfileCreatedAt" timestamp without time zone,
    "PanelDetails"     text,
    "IsLastInterview"  integer)
LANGUAGE plpgsql STABLE
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH latest_candidate_history AS (
        SELECT cfh.*,
               ROW_NUMBER() OVER (PARTITION BY cfh."CandidateCode"
                                  ORDER BY COALESCE(cfh."UpdatedAt", cfh."CreatedAt") DESC) AS rn
        FROM throughline."CandidateForms" cfh
    ),
    max_round_per_hiring AS (
        SELECT "HiringRequestId", MAX("RoundNumber") AS max_round_number
        FROM throughline."InterviewRounds"
        GROUP BY "HiringRequestId"
    ),
    candidate_feedback AS (
        SELECT
            hr."HrqId"                                   AS "HrqId",
            ps."PartnerName"                             AS "PartnerName",
            lc."CandidateCode"                           AS "CandidateCode",
            cf."FullName"                                AS "FullName",
            cf."Email"                                   AS "Email",
            cf."PhoneNumber"                             AS "PhoneNumber",
            ird."Name"                                   AS "RoundName",
            COALESCE(ics."Name", 'Pending')              AS "RoundStatus",
            ir."RoundNumber"                             AS "RoundNumber",
            isa."InterviewRoundStartDate"                AS "DateOfInterview",
            usr."FullName"                               AS "Feedbackgivenby",
            isa."PanelFeedbackGivenOn"                   AS "FeebackDate",
            isa."Feedback"                               AS "PanelComments",
            cf."CreatedAt"                               AS "ProfileCreatedAt",
            CASE
                WHEN ir."Panel" IS NOT NULL THEN
                    (SELECT string_agg(u."FullName", ', ')
                     FROM throughline."Users" u
                     WHERE u."UserId" = ANY (ir."Panel"))
                ELSE ''
            END                                          AS "PanelDetails",
            CASE WHEN ir."RoundNumber" = mr.max_round_number THEN 1 ELSE NULL END AS "IsLastInterview",
            ROW_NUMBER() OVER (PARTITION BY lc."CandidateCode", ird."Name"
                               ORDER BY cf."CreatedAt" DESC)                     AS rn_dedupe
        FROM latest_candidate_history lc
        LEFT JOIN throughline."Hiring"                  hr  ON hr."Id" = lc."HiringRequestId"
        LEFT JOIN throughline."CandidateFormHistory"    cf  ON cf."CandidateCode" = lc."CandidateCode"
        LEFT JOIN throughline."InterviewSlotAllocation" isa ON isa."CandidateId" = cf."Id"
        LEFT JOIN throughline."Partners"                ps  ON ps."Id" = cf."PartnerId"
        LEFT JOIN throughline."InterviewRounds"         ir  ON ir."Id" = isa."CurrentRoundId"
        LEFT JOIN max_round_per_hiring                  mr  ON mr."HiringRequestId" = ir."HiringRequestId"
        LEFT JOIN throughline."M_MasterData"            ird ON ird."Id" = ir."RoundNameId"
        LEFT JOIN throughline."M_MasterData"            ics ON ics."Id" = isa."CandidateInterviewStatusId"
        LEFT JOIN throughline."Users"                   usr ON usr."UserId" = isa."FeedbackGivenByUserId"
        WHERE lc.rn = 1
          AND (p_intake_status_ids IS NULL OR cardinality(p_intake_status_ids) = 0
               OR cf."IntakeStatusId" = ANY (p_intake_status_ids))
          AND (p_partner_id IS NULL OR lc."PartnerId" = p_partner_id)
          AND (p_logged_in_role_id IS NULL OR p_logged_in_role_id <> 2
               OR lc."PartnerId" = p_logged_in_partner_id)
    )
    SELECT
        c."HrqId", c."PartnerName", c."CandidateCode", c."FullName", c."Email", c."PhoneNumber",
        c."RoundName", c."RoundStatus", c."RoundNumber", c."DateOfInterview", c."Feedbackgivenby",
        c."FeebackDate", c."PanelComments", c."ProfileCreatedAt", c."PanelDetails", c."IsLastInterview"
    FROM candidate_feedback c
    WHERE c.rn_dedupe = 1
    ORDER BY c."ProfileCreatedAt" DESC, c."RoundNumber" DESC;
END;
$$;


-- ============================================================================
-- sp_GetCandidate_HRQ_InterviewDetails  ->  get_candidate_hrq_interview_details
-- ============================================================================
-- *** RECONSTRUCTION ***  This procedure is referenced by
-- CandidateFormService.ExportCandidateInterviewFeedback but never existed in the SQL Server
-- schema (the export therefore always failed there). It is rebuilt from the consuming entity
-- GetExportCandidateInterviewDetails (one column per property, same names) and from the
-- filters / joins used by sp_GetCandidateInterviewFeedback and sp_GetCandidateHiringDetails:
--   * one row per live CandidateForms row and per InterviewSlotAllocation of that candidate
--     (candidates with no interview yet still appear once, with the interview columns NULL);
--   * same filter parameters and semantics as the two sibling procs;
--   * Primary/SecondarySkills   -> M_Skills names (comma separated)
--     WorkLocation              -> M_Cities names for PreferredWorkLocationIds
--     Organisation              -> CurrentOrganisation, else LastOrganisation
--     PartnerId / PartnerAlias  -> Partners.PartnerCode / Partners.Nickname
--     FinalStatus               -> candidate intake status name; HRQStatus -> hiring status name
--     InterviewTaken            -> 1 when the slot's IsInterviewCompleted is true, else 0
--     Comment                   -> PartnerInterviewCompletedComments, else HMAdditionalComments
--     DeclineCount              -> InterviewSlotAllocation.RejectionCount
--     Panel                     -> user names from the slot's Panel (falls back to the round's Panel)
--     LastInterview             -> 1 when the round is the highest RoundNumber of the HRQ
--     ScheduleTime              -> HH24:MI:SS text (the C# side TimeSpan.TryParse's it).
CREATE OR REPLACE FUNCTION throughline.get_candidate_hrq_interview_details(
    p_intake_status_ids    integer[],
    p_partner_id           integer,
    p_logged_in_partner_id integer,
    p_logged_in_role_id    integer)
RETURNS TABLE (
    "HrqId"                       text,
    "CandidateId"                 text,
    "FullName"                    text,
    "PhoneNumber"                 text,
    "Email"                       text,
    "RoleHiredFor"                text,
    "PrimarySkills"               text,
    "SecondarySkills"             text,
    "Diversity"                   text,
    "CurrentCountry"              text,
    "CurrentState"                text,
    "CurrentCity"                 text,
    "WorkLocation"                text,
    "NoticePeriod"                integer,
    "RelevantExperience"          integer,
    "CurrentlyWorking"            text,
    "Organisation"                text,
    "PartnerId"                   text,
    "LastWorkingDay"              timestamp without time zone,
    "PartnerAlias"                text,
    "Domain"                      text,
    "SubDomain"                   text,
    "HiringManager"               text,
    "InterviewRoundOrder"         integer,
    "InterviewRoundName"          text,
    "InterviewStatus"             text,
    "FinalStatus"                 text,
    "HRQStatus"                   text,
    "HRQHoldDate"                 timestamp without time zone,
    "ScheduledDate"               timestamp without time zone,
    "ScheduleTime"                text,
    "InterviewComments_Feedbacks" text,
    "FeedbackDate"                timestamp without time zone,
    "FeedbackUpdatedBy"           text,
    "InterviewTaken"              integer,
    "Comment"                     text,
    "RescheduleCount"             integer,
    "DeclineCount"                integer,
    "Panel"                       text,
    "LastInterview"               integer,
    "ProfileCreatedAt"            timestamp without time zone)
LANGUAGE plpgsql STABLE
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH max_round_per_hiring AS (
        SELECT "HiringRequestId", MAX("RoundNumber") AS max_round_number
        FROM throughline."InterviewRounds"
        GROUP BY "HiringRequestId"
    )
    SELECT
        hr."HrqId"                                              AS "HrqId",
        cf."CandidateCode"                                      AS "CandidateId",
        cf."FullName"                                           AS "FullName",
        cf."PhoneNumber"                                        AS "PhoneNumber",
        cf."Email"                                              AS "Email",
        COALESCE(cf."RoleHiredFor", hr."JobTitle")              AS "RoleHiredFor",
        (SELECT string_agg(s."Name", ', ' ORDER BY s."Name")
           FROM throughline."M_Skills" s
          WHERE s."Id" = ANY (cf."PrimarySkillIds"))            AS "PrimarySkills",
        (SELECT string_agg(s."Name", ', ' ORDER BY s."Name")
           FROM throughline."M_Skills" s
          WHERE s."Id" = ANY (cf."SecondarySkillIds"))          AS "SecondarySkills",
        cf."Diversity"                                          AS "Diversity",
        co."Name"::text                                         AS "CurrentCountry",
        st."Name"::text                                         AS "CurrentState",
        ci."Name"::text                                         AS "CurrentCity",
        (SELECT string_agg(wl."Name", ', ' ORDER BY wl."Name")
           FROM throughline."M_Cities" wl
          WHERE wl."Id" = ANY (cf."PreferredWorkLocationIds"))  AS "WorkLocation",
        cf."NoticePeriod"                                       AS "NoticePeriod",
        cf."RelevantExperience"                                 AS "RelevantExperience",
        cf."CurrentlyWorking"                                   AS "CurrentlyWorking",
        COALESCE(cf."CurrentOrganisation", cf."LastOrganisation") AS "Organisation",
        p."PartnerCode"                                         AS "PartnerId",
        cf."LastWorkingDay"                                     AS "LastWorkingDay",
        p."Nickname"                                            AS "PartnerAlias",
        d."Name"::text                                          AS "Domain",
        sd."Name"::text                                         AS "SubDomain",
        hm."FullName"                                           AS "HiringManager",
        ir."RoundNumber"                                        AS "InterviewRoundOrder",
        rn_."Name"                                              AS "InterviewRoundName",
        CASE WHEN isa."Id" IS NULL THEN NULL
             ELSE COALESCE(ics."Name", 'Pending') END           AS "InterviewStatus",
        ist."Name"                                              AS "FinalStatus",
        hs."Name"                                               AS "HRQStatus",
        hr."OnholdDate"                                         AS "HRQHoldDate",
        isa."Date"                                              AS "ScheduledDate",
        CASE WHEN isa."Time" IS NULL THEN NULL
             ELSE to_char(isa."Time", 'HH24:MI:SS') END         AS "ScheduleTime",
        isa."Feedback"                                          AS "InterviewComments_Feedbacks",
        isa."PanelFeedbackGivenOn"                              AS "FeedbackDate",
        fu."FullName"                                           AS "FeedbackUpdatedBy",
        CASE WHEN isa."Id" IS NULL THEN NULL
             WHEN isa."IsInterviewCompleted" = true THEN 1 ELSE 0 END AS "InterviewTaken",
        COALESCE(isa."PartnerInterviewCompletedComments", isa."HMAdditionalComments") AS "Comment",
        isa."RescheduleCount"                                   AS "RescheduleCount",
        isa."RejectionCount"                                    AS "DeclineCount",
        (SELECT string_agg(u."FullName", ', ' ORDER BY u."FullName")
           FROM throughline."Users" u
          WHERE u."UserId" = ANY (COALESCE(isa."Panel", ir."Panel")))  AS "Panel",
        CASE WHEN ir."RoundNumber" IS NOT NULL AND ir."RoundNumber" = mr.max_round_number
             THEN 1 ELSE NULL END                               AS "LastInterview",
        cf."CreatedAt"                                          AS "ProfileCreatedAt"
    FROM throughline."CandidateForms" cf
    LEFT JOIN throughline."Hiring"                  hr  ON hr."Id" = cf."HiringRequestId"
    LEFT JOIN throughline."M_MasterData"            hs  ON hs."Id" = hr."HiringStatusId"
    LEFT JOIN throughline."M_MasterData"            ist ON ist."Id" = cf."IntakeStatusId"
    LEFT JOIN throughline."Partners"                p   ON p."Id" = cf."PartnerId"
    LEFT JOIN throughline."M_Countries"             co  ON co."Id" = cf."CountryId"
    LEFT JOIN throughline."M_States"                st  ON st."Id" = cf."StateId"
    LEFT JOIN throughline."M_Cities"                ci  ON ci."Id" = cf."CityId"
    LEFT JOIN throughline."M_Domains"               d   ON d."Id" = hr."DomainId"
    LEFT JOIN throughline."JobDetails"              jd  ON jd."HiringRequestId" = hr."Id"
    LEFT JOIN throughline."M_SubDomains"            sd  ON sd."Id" = jd."SubDomainId"
    LEFT JOIN throughline."Users"                   hm  ON hm."UserId" = hr."HiringMangerId"
    LEFT JOIN throughline."InterviewSlotAllocation" isa ON isa."CandidateId" = cf."Id"
    LEFT JOIN throughline."InterviewRounds"         ir  ON ir."Id" = isa."CurrentRoundId"
    LEFT JOIN max_round_per_hiring                  mr  ON mr."HiringRequestId" = ir."HiringRequestId"
    LEFT JOIN throughline."M_MasterData"            rn_ ON rn_."Id" = ir."RoundNameId"
    LEFT JOIN throughline."M_MasterData"            ics ON ics."Id" = isa."CandidateInterviewStatusId"
    LEFT JOIN throughline."Users"                   fu  ON fu."UserId" = isa."FeedbackGivenByUserId"
    WHERE (p_intake_status_ids IS NULL OR cardinality(p_intake_status_ids) = 0
           OR cf."IntakeStatusId" = ANY (p_intake_status_ids))
      AND (p_partner_id IS NULL OR cf."PartnerId" = p_partner_id)
      AND (p_logged_in_role_id IS NULL OR p_logged_in_role_id <> 2
           OR cf."PartnerId" = p_logged_in_partner_id)
    ORDER BY cf."CreatedAt" DESC, cf."Id", ir."RoundNumber" NULLS FIRST, isa."CreatedAt";
END;
$$;


-- ============================================================================
-- GetMasterData  ->  get_master_data
-- ============================================================================
-- Consumed by MasterService.GetMasterDataByIdListAsync, which reads exactly the columns
-- Id, Name, SubDomainManagerId, SubDomainManagerName, IsActive with the non-nullable
-- DbDataReader getters (GetInt32/GetString/GetBoolean), so those are COALESCEd.
--   p_master_type_id = 41 (INTERVIEW_MODE): interview modes whose RoundNameIds contains any of
--       p_round_name_ids. SQL Server did `RoundNameIds LIKE '%<id>%'` on the JSON text (which
--       also matched e.g. 11 for id 1); RoundNameIds is integer[] here so this uses array overlap.
--       An empty/NULL list returns no rows, as the INNER JOIN on the TVP did.
--   p_master_type_id = 30 (SUBDOMAIN): M_SubDomains, optionally filtered by p_domain_ids
--       (NULL/empty = all).
--   any other type id returns no rows (the proc had no ELSE branch).
CREATE OR REPLACE FUNCTION throughline.get_master_data(
    p_master_type_id integer,
    p_round_name_ids integer[] DEFAULT NULL,
    p_domain_ids     integer[] DEFAULT NULL)
RETURNS TABLE (
    "Id"                   integer,
    "Name"                 text,
    "SubDomainManagerId"   integer,
    "SubDomainManagerName" text,
    "IsActive"             boolean)
LANGUAGE plpgsql STABLE
AS $$
#variable_conflict use_column
BEGIN
    IF p_master_type_id = 41 THEN
        RETURN QUERY
        SELECT DISTINCT
            m."Id"                         AS "Id",
            COALESCE(m."Name", '')         AS "Name",
            0                              AS "SubDomainManagerId",
            ''::text                       AS "SubDomainManagerName",
            COALESCE(m."IsActive", false)  AS "IsActive"
        FROM throughline."M_MasterData" m
        WHERE p_round_name_ids IS NOT NULL
          AND m."RoundNameIds" && p_round_name_ids
        ORDER BY m."Id";
    ELSIF p_master_type_id = 30 THEN
        RETURN QUERY
        SELECT DISTINCT
            m."Id"                                  AS "Id",
            COALESCE(m."Name", '')::text            AS "Name",
            COALESCE(m."SubDomainManagerId", 0)     AS "SubDomainManagerId",
            COALESCE(u."FullName", '')              AS "SubDomainManagerName",
            COALESCE(m."IsActive", false)           AS "IsActive"
        FROM throughline."M_SubDomains" m
        LEFT JOIN throughline."Users" u ON u."UserId" = m."SubDomainManagerId"
        WHERE p_domain_ids IS NULL
           OR cardinality(p_domain_ids) = 0
           OR m."DomainId" = ANY (p_domain_ids)
        ORDER BY m."Id";
    END IF;
    RETURN;
END;
$$;
