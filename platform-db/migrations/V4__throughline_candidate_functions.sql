-- V4: Candidate-bin / duplicate-detection functions ported from the SQL Server (dbo) objects:
--   dbo.InitCap, dbo.NormalizePhone, dbo.GetCandidateIntakeStatus,
--   dbo.FindDuplicateCandidates, dbo.FindDuplicateCandidatesSummary, dbo.UpdateDuplicateCandidateCode,
--   dbo.InsertCandidatesFromUpload, dbo.AddCandidateForm, dbo.ValidateCandidates, dbo.UploadValidatedCandidates
--
-- Conventions
--   * Table-valued parameters (dbo.UploadCandidateType, dbo.CandidateBinDtoType) become a jsonb array of
--     objects whose keys are the PascalCase DTO property names (System.Text.Json default serialisation);
--     the functions unpack them with jsonb_to_recordset.
--   * Result sets keep the exact CamelCase column names of the SQL Server procedures because EF Core maps the
--     keyless result entities (MarkDuplicateCandidate, CandidateResult, CandidateBulkUpload) by column name.
--   * SQL Server's default collation is case-insensitive; string equality on user data (emails, master-data
--     names, codes, Yes/No flags) is therefore compared with lower() so behaviour is preserved on PostgreSQL.
--   * GETUTCDATE()/SYSUTCDATETIME() -> (now() at time zone 'utc');  GETDATE() -> localtimestamp.
--   * CandidateBin keeps PrimarySkillIds/SecondarySkillIds/PreferredWorkLocationIds as JSON text ("[1,2]"),
--     while CandidateForms / CandidateFormHistory / CandidateUploadResults use native integer[];
--     throughline.json_int_array() converts between the two.
--   * The SQL Server tables carried a CurrentCTC column that does not exist in the EF model / PostgreSQL
--     schema; it is dropped from AddCandidateForm and InsertCandidatesFromUpload.

-- ---------------------------------------------------------------------------------------------------------
-- Helper: JSON text "[1,2,3]" -> integer[]   (NULL / '' / 'null' -> NULL)
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.json_int_array(p_json text)
RETURNS integer[]
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
    SELECT CASE
             WHEN btrim(p_json) = '' OR lower(btrim(p_json)) = 'null' THEN NULL
             ELSE ARRAY(SELECT e::integer FROM jsonb_array_elements_text(p_json::jsonb) AS e)
           END;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.InitCap : upper-cases the character following a space, lower-cases everything else.
-- (Deliberately NOT PostgreSQL initcap(), which also capitalises after '-', '.', digits, etc.)
-- T-SQL returned '' for NULL input (the WHILE loop never ran) - preserved.
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.init_cap(p_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_result    text := '';
    v_prev_char text := ' ';
    v_char      text;
    v_len       integer;
    v_index     integer := 1;
BEGIN
    -- T-SQL LEN() ignores trailing spaces
    v_len := length(rtrim(p_input, ' '));

    WHILE v_index <= v_len LOOP
        v_char := substr(p_input, v_index, 1);

        IF v_prev_char = ' ' THEN
            v_result := v_result || upper(v_char);
        ELSE
            v_result := v_result || lower(v_char);
        END IF;

        v_prev_char := v_char;
        v_index     := v_index + 1;
    END LOOP;

    RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.NormalizePhone : keep digits only; if more than 10 digits keep the last 10 (drops country code).
-- T-SQL returned '' for NULL input - preserved (callers rely on it, see update_duplicate_candidate_code).
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.normalize_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
             WHEN length(d.digits) > 10 THEN right(d.digits, 10)
             ELSE d.digits
           END
    FROM (SELECT coalesce(regexp_replace(p_phone, '[^0-9]', '', 'g'), '') AS digits) AS d;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.GetCandidateIntakeStatus
--   16001/16002/16003 = INTERVIEW_ROUND.SCREENING / CODE_ASSESSMENT / ONLINE_ASSESSMENT
--   15002 = CANDIDATE_INTAKE_STATUS.SCREENING, 15003 = CANDIDATE_INTAKE_STATUS.INTERVIEWING
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.get_candidate_intake_status(p_hiring_request_id integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_status integer;
BEGIN
    IF EXISTS (SELECT 1
               FROM throughline."InterviewRounds" ir
               WHERE ir."HiringRequestId" = p_hiring_request_id
                 AND ir."RoundNameId" IN (16001, 16002, 16003)) THEN
        v_status := 15002;
    ELSIF EXISTS (SELECT 1
                  FROM throughline."InterviewRounds" ir
                  WHERE ir."HiringRequestId" = p_hiring_request_id
                    AND ir."RoundNameId" NOT IN (16001, 16002, 16003)) THEN
        v_status := 15003;
    ELSE
        v_status := NULL;
    END IF;

    RETURN v_status;
END;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.FindDuplicateCandidates
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.find_duplicate_candidates(p_email text, p_phone text)
RETURNS TABLE (
    "Id"                 integer,
    "CandidateCode"      text,
    "FullName"           text,
    "Email"              text,
    "PhoneNumber"        text,
    "EffectiveCreatedAt" timestamp without time zone,
    "IntakeStatusId"     integer,
    "HiringRequestId"    integer
)
LANGUAGE sql
STABLE
AS $$
    WITH params AS (
        SELECT p_email AS email,
               CASE WHEN p_phone IS NOT NULL THEN throughline.normalize_phone(p_phone) END AS normalized_phone
    ),
    matched_candidates AS (
        SELECT cf."Id", cf."CandidateCode", cf."FullName", cf."Email", cf."PhoneNumber",
               cf."CreatedAt", cf."IntakeStatusId", cf."HiringRequestId"
        FROM throughline."CandidateForms" cf
        CROSS JOIN params p
        WHERE cf."IsActive" = true
          AND (
                (p.email IS NOT NULL AND lower(cf."Email") = lower(p.email))
                OR
                (p.normalized_phone IS NOT NULL AND cf."PhoneNumber" IS NOT NULL
                    AND throughline.normalize_phone(cf."PhoneNumber") = p.normalized_phone)
              )
    ),
    distinct_candidates AS (
        SELECT t.*
        FROM (SELECT mc.*,
                     row_number() OVER (PARTITION BY mc."CandidateCode" ORDER BY mc."CreatedAt" DESC) AS rn
              FROM matched_candidates mc) t
        WHERE t.rn = 1
    ),
    candidate_with_latest_interview AS (
        SELECT dc."Id", dc."CandidateCode", dc."FullName", dc."Email", dc."PhoneNumber",
               coalesce(max(isa."InterviewRoundCompleteDate"), dc."CreatedAt") AS "EffectiveCreatedAt",
               dc."IntakeStatusId", dc."HiringRequestId"
        FROM distinct_candidates dc
        LEFT JOIN throughline."InterviewSlotAllocation" isa ON isa."CandidateId" = dc."Id"
        GROUP BY dc."Id", dc."CandidateCode", dc."FullName", dc."Email", dc."PhoneNumber", dc."CreatedAt",
                 dc."IntakeStatusId", dc."HiringRequestId"
    )
    SELECT c."Id", c."CandidateCode", c."FullName", c."Email", c."PhoneNumber", c."EffectiveCreatedAt",
           c."IntakeStatusId", c."HiringRequestId"
    FROM candidate_with_latest_interview c
    ORDER BY c."EffectiveCreatedAt" DESC;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.FindDuplicateCandidatesSummary  -> always exactly one row (EF entity MarkDuplicateCandidate)
--   15005,15006,15010,15012,15013 = intake statuses REJECTED / DROP / DECLINED / FREEZED ...
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.find_duplicate_candidates_summary(p_email text, p_phone text)
RETURNS TABLE (
    "IsDuplicate"           boolean,
    "ExistingCandidateCode" text,
    "AllowToUpdate"         boolean
)
LANGUAGE sql
STABLE
AS $$
    WITH params AS (
        SELECT p_email AS email,
               CASE WHEN p_phone IS NOT NULL THEN throughline.normalize_phone(p_phone) END AS normalized_phone,
               (now() AT TIME ZONE 'utc') AS now_utc
    ),
    matched_candidates AS (
        SELECT cf."Id", cf."CandidateCode", cf."CreatedAt", cf."IntakeStatusId"
        FROM throughline."CandidateForms" cf
        CROSS JOIN params p
        WHERE cf."IsActive" = true
          AND (
                (p.email IS NOT NULL AND lower(cf."Email") = lower(p.email))
                OR
                (p.normalized_phone IS NOT NULL AND cf."PhoneNumber" IS NOT NULL
                    AND throughline.normalize_phone(cf."PhoneNumber") = p.normalized_phone)
              )
    ),
    distinct_candidates AS (
        SELECT t.*
        FROM (SELECT mc.*,
                     row_number() OVER (PARTITION BY mc."CandidateCode" ORDER BY mc."CreatedAt" DESC) AS rn
              FROM matched_candidates mc) t
        WHERE t.rn = 1
    ),
    candidate_with_latest_interview AS (
        SELECT dc."Id", dc."CandidateCode",
               coalesce(max(isa."InterviewRoundCompleteDate"), dc."CreatedAt") AS "EffectiveCreatedAt",
               dc."IntakeStatusId"
        FROM distinct_candidates dc
        LEFT JOIN throughline."InterviewSlotAllocation" isa ON isa."CandidateId" = dc."Id"
        GROUP BY dc."Id", dc."CandidateCode", dc."CreatedAt", dc."IntakeStatusId"
    )
    SELECT
        EXISTS (SELECT 1 FROM candidate_with_latest_interview)                               AS "IsDuplicate",
        (SELECT c."CandidateCode"
         FROM candidate_with_latest_interview c
         ORDER BY c."EffectiveCreatedAt" DESC
         LIMIT 1)                                                                            AS "ExistingCandidateCode",
        EXISTS (SELECT 1
                FROM candidate_with_latest_interview c
                CROSS JOIN params p
                WHERE c."EffectiveCreatedAt" <= p.now_utc - interval '90 days'
                  AND c."IntakeStatusId" IN (15005, 15006, 15010, 15012, 15013))            AS "AllowToUpdate";
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.UpdateDuplicateCandidateCode
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.update_duplicate_candidate_code(
    p_current_review_candidate_id integer,
    p_candidate_code              text,
    p_email                       text,
    p_phone                       text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_normalized_phone text;
BEGIN
    v_normalized_phone := throughline.normalize_phone(p_phone);

    UPDATE throughline."CandidateBin" cb
    SET "ExistingCandidateCode" = p_candidate_code,
        "IsDuplicate"           = true
    FROM (
        SELECT b."Id", b."IsDuplicate"
        FROM throughline."CandidateBin" b
        WHERE b."IsActive" = true
          AND b."Id" <> p_current_review_candidate_id
          AND (
                (b."Email" IS NOT NULL AND lower(b."Email") = lower(p_email))
                OR
                (b."PhoneNumber" IS NOT NULL AND throughline.normalize_phone(b."PhoneNumber") = v_normalized_phone)
              )
    ) d
    WHERE cb."Id" = d."Id"
      AND d."IsDuplicate" = false;
END;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.InsertCandidatesFromUpload   (@Candidates dbo.CandidateBinDtoType -> jsonb array of CandidateBinBulkUploadDto)
-- Result columns = EF keyless entity CandidateBulkUpload (DbSet CandidateUploadResults).
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.insert_candidates_from_upload(p_candidates jsonb)
RETURNS TABLE (
    "PartnerId"                integer,
    "FullName"                 text,
    "PhoneNumber"              text,
    "Email"                    text,
    "RoleHiredFor"             text,
    "Diversity"                text,
    "NoticePeriod"             integer,
    "RelevantExperience"       integer,
    "CurrentlyWorking"         text,
    "CurrentOrganisation"      text,
    "LastWorkingDay"           timestamp without time zone,
    "IsDuplicate"              boolean,
    "HiringRequestId"          integer,
    "PrimarySkillIds"          integer[],
    "SecondarySkillIds"        integer[],
    "PreferredWorkLocationIds" integer[],
    "ExistingCandidateCode"    text,
    "IsSingleEntry"            boolean,
    "CountryId"                integer,
    "StateId"                  integer,
    "CityId"                   integer,
    "CreatedAt"                timestamp without time zone
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH src AS (
        SELECT c."PartnerId",
               c."FullName",
               throughline.normalize_phone(c."PhoneNumber") AS "PhoneNumber",   -- normalised before insert, as in T-SQL
               c."Email",
               c."RoleHiredFor",
               c."Diversity",
               c."NoticePeriod",
               c."RelevantExperience",
               c."CurrentlyWorking",
               c."CurrentOrganisation",
               c."LastWorkingDay",
               c."HiringRequestId",
               c."PrimarySkillIds",
               c."SecondarySkillIds",
               c."PreferredWorkLocationIds",
               c."IsSingleEntry",
               c."CountryId",
               c."StateId",
               c."CityId"
        FROM jsonb_to_recordset(coalesce(p_candidates, '[]'::jsonb)) AS c (
               "PartnerId"                integer,
               "FullName"                 text,
               "PhoneNumber"              text,
               "Email"                    text,
               "RoleHiredFor"             text,
               "Diversity"                text,
               "NoticePeriod"             integer,
               "RelevantExperience"       integer,
               "CurrentlyWorking"         text,
               "CurrentOrganisation"      text,
               "LastWorkingDay"           timestamp without time zone,
               "HiringRequestId"          integer,
               "PrimarySkillIds"          text,
               "SecondarySkillIds"        text,
               "PreferredWorkLocationIds" text,
               "IsSingleEntry"            boolean,
               "CountryId"                integer,
               "StateId"                  integer,
               "CityId"                   integer)
    ),
    ins AS (
        INSERT INTO throughline."CandidateBin" (
            "PartnerId", "FullName", "PhoneNumber", "Email", "RoleHiredFor", "Diversity", "NoticePeriod",
            "RelevantExperience", "CurrentlyWorking", "CurrentOrganisation", "LastWorkingDay",
            "IsDuplicate", "HiringRequestId", "PrimarySkillIds", "SecondarySkillIds",
            "PreferredWorkLocationIds", "ExistingCandidateCode", "IsSingleEntry",
            "CountryId", "StateId", "CityId", "CreatedAt", "IsActive")
        SELECT
            c."PartnerId",
            c."FullName",
            c."PhoneNumber",
            c."Email",
            c."RoleHiredFor",
            c."Diversity",
            c."NoticePeriod",
            c."RelevantExperience",
            c."CurrentlyWorking",
            c."CurrentOrganisation",
            c."LastWorkingDay",
            EXISTS (SELECT 1
                    FROM throughline."CandidateForms" cf
                    WHERE throughline.normalize_phone(cf."PhoneNumber") = c."PhoneNumber"
                       OR lower(cf."Email") = lower(c."Email")),
            c."HiringRequestId",
            c."PrimarySkillIds",
            c."SecondarySkillIds",
            c."PreferredWorkLocationIds",
            (SELECT cf."CandidateCode"
             FROM throughline."CandidateForms" cf
             WHERE throughline.normalize_phone(cf."PhoneNumber") = c."PhoneNumber"
                OR lower(cf."Email") = lower(c."Email")
             ORDER BY cf."CandidateCode" DESC
             LIMIT 1),
            coalesce(c."IsSingleEntry", false),
            c."CountryId",
            c."StateId",
            c."CityId",
            (now() AT TIME ZONE 'utc'),
            true
        FROM src c
        RETURNING
            "CandidateBin"."PartnerId", "CandidateBin"."FullName", "CandidateBin"."PhoneNumber", "CandidateBin"."Email",
            "CandidateBin"."RoleHiredFor", "CandidateBin"."Diversity", "CandidateBin"."NoticePeriod",
            "CandidateBin"."RelevantExperience", "CandidateBin"."CurrentlyWorking", "CandidateBin"."CurrentOrganisation",
            "CandidateBin"."LastWorkingDay", "CandidateBin"."IsDuplicate", "CandidateBin"."HiringRequestId",
            "CandidateBin"."PrimarySkillIds", "CandidateBin"."SecondarySkillIds", "CandidateBin"."PreferredWorkLocationIds",
            "CandidateBin"."ExistingCandidateCode", "CandidateBin"."IsSingleEntry", "CandidateBin"."CountryId",
            "CandidateBin"."StateId", "CandidateBin"."CityId", "CandidateBin"."CreatedAt"
    )
    SELECT
        i."PartnerId", i."FullName", i."PhoneNumber", i."Email", i."RoleHiredFor", i."Diversity", i."NoticePeriod",
        i."RelevantExperience", i."CurrentlyWorking", i."CurrentOrganisation", i."LastWorkingDay", i."IsDuplicate",
        i."HiringRequestId",
        throughline.json_int_array(i."PrimarySkillIds"),
        throughline.json_int_array(i."SecondarySkillIds"),
        throughline.json_int_array(i."PreferredWorkLocationIds"),
        i."ExistingCandidateCode", i."IsSingleEntry", i."CountryId", i."StateId", i."CityId", i."CreatedAt"
    FROM ins i;
END;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.AddCandidateForm   -> always exactly one row (EF keyless entity CandidateResult)
-- The C# call sites also pass @IsRequestException; the stored procedure source did not declare it, so the
-- extra parameter is accepted (defaulted) and unused, exactly like the original.
-- Errors are caught and reported in ErrorMessage / Severity (16 = T-SQL user-error severity) after rollback.
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.add_candidate_form(
    p_review_candidate_id     integer,
    p_is_acknoledged          boolean,
    p_is_duplicate            boolean,
    p_allowed_to_update       boolean,
    p_existing_candidate_code text,
    p_is_request_exception    boolean DEFAULT NULL)
RETURNS TABLE (
    "CandidateId"  integer,
    "ErrorMessage" text,
    "Severity"     integer
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
DECLARE
    v_candidate_id   integer := NULL;
    v_error_message  text    := NULL;
    v_severity       integer := NULL;
    v_now_utc        timestamp without time zone := (now() AT TIME ZONE 'utc');
BEGIN
    BEGIN
        IF p_is_duplicate = false THEN
            -- Insert new candidate from the bin row
            INSERT INTO throughline."CandidateForms" (
                "PartnerId", "HiringRequestId", "IsSingleEntry", "FullName", "PhoneNumber", "Email", "CountryId", "StateId",
                "CityId", "Diversity", "NoticePeriod", "RelevantExperience", "CurrentlyWorking", "CurrentOrganisation",
                "LastWorkingDay", "ResumeId", "EmployeeId", "ResourceTypeId", "PCLifecycleId", "RequestedMicrosoftAccount",
                "ConsideredForFutureRequirements", "IsReferred", "ReferredBy", "IntakeStatusId", "IsAgreedForTermsConditions",
                "ResumeUploadedOn", "LastOrganisation", "RoleHiredFor", "PrimarySkillIds", "SecondarySkillIds",
                "PreferredWorkLocationIds", "IsActive", "CreatedBy", "CreatedAt", "ReUploadedCandidateOn")
            SELECT
                cb."PartnerId", cb."HiringRequestId", cb."IsSingleEntry", cb."FullName", cb."PhoneNumber", cb."Email",
                cb."CountryId", cb."StateId", cb."CityId", cb."Diversity", cb."NoticePeriod", cb."RelevantExperience",
                cb."CurrentlyWorking", cb."CurrentOrganisation", cb."LastWorkingDay", cb."ResumeId", cb."EmployeeId",
                cb."ResourceTypeId", cb."PCLifecycleId", cb."RequestedMicrosoftAccount", cb."ConsideredForFutureRequirements",
                cb."IsReferred", cb."ReferredBy",
                throughline.get_candidate_intake_status(cb."HiringRequestId"),
                p_is_acknoledged,
                cb."ResumeUploadedOn", cb."LastOrganisation", cb."RoleHiredFor",
                throughline.json_int_array(cb."PrimarySkillIds"),
                throughline.json_int_array(cb."SecondarySkillIds"),
                throughline.json_int_array(cb."PreferredWorkLocationIds"),
                true, cb."CreatedBy", v_now_utc, v_now_utc
            FROM throughline."CandidateBin" cb
            WHERE cb."Id" = p_review_candidate_id
            RETURNING "CandidateForms"."Id" INTO v_candidate_id;

            -- Candidate history
            INSERT INTO throughline."CandidateFormHistory" (
                "CandidateId", "PartnerId", "HiringRequestId", "IsSingleEntry", "FullName", "PhoneNumber", "Email", "CountryId",
                "StateId", "CityId", "Diversity", "NoticePeriod", "RelevantExperience", "CurrentlyWorking", "CurrentOrganisation",
                "LastWorkingDay", "ResumeId", "EmployeeId", "ResourceTypeId", "PCLifecycleId", "RequestedMicrosoftAccount",
                "ConsideredForFutureRequirements", "IsReferred", "ReferredBy", "IntakeStatusId", "IsAgreedForTermsConditions",
                "ResumeUploadedOn", "LastOrganisation", "PrimarySkillIds", "SecondarySkillIds",
                "IsActive", "CreatedBy", "CreatedAt", "CandidateCode", "ReUploadedCandidateOn")
            SELECT
                cf."Id", cf."PartnerId", cf."HiringRequestId", cf."IsSingleEntry", cf."FullName", cf."PhoneNumber", cf."Email",
                cf."CountryId", cf."StateId", cf."CityId", cf."Diversity", cf."NoticePeriod", cf."RelevantExperience",
                cf."CurrentlyWorking", cf."CurrentOrganisation", cf."LastWorkingDay", cf."ResumeId", cf."EmployeeId",
                cf."ResourceTypeId", cf."PCLifecycleId", cf."RequestedMicrosoftAccount", cf."ConsideredForFutureRequirements",
                cf."IsReferred", cf."ReferredBy", cf."IntakeStatusId", cf."IsAgreedForTermsConditions", cf."ResumeUploadedOn",
                cf."LastOrganisation", cf."PrimarySkillIds", cf."SecondarySkillIds",
                cf."IsActive", cf."CreatedBy", cf."CreatedAt", cf."CandidateCode", cf."ReUploadedCandidateOn"
            FROM throughline."CandidateForms" cf
            WHERE cf."Id" = v_candidate_id;

            IF v_candidate_id > 0 THEN
                DELETE FROM throughline."CandidateBin" WHERE "Id" = p_review_candidate_id;
            END IF;

        ELSIF p_is_duplicate = true AND p_allowed_to_update = true THEN
            -- Update the existing candidate from the bin row.
            -- NB: IntakeStatusId is derived from the candidate's *previous* HiringRequestId, as in the T-SQL
            -- (SET expressions see the pre-update row).
            UPDATE throughline."CandidateForms" cf
            SET "PartnerId"                       = cb."PartnerId",
                "HiringRequestId"                 = cb."HiringRequestId",
                "IsSingleEntry"                   = cb."IsSingleEntry",
                "FullName"                        = cb."FullName",
                "PhoneNumber"                     = cb."PhoneNumber",
                "Email"                           = cb."Email",
                "CountryId"                       = cb."CountryId",
                "StateId"                         = cb."StateId",
                "CityId"                          = cb."CityId",
                "Diversity"                       = cb."Diversity",
                "NoticePeriod"                    = cb."NoticePeriod",
                "RelevantExperience"              = cb."RelevantExperience",
                "CurrentlyWorking"                = cb."CurrentlyWorking",
                "CurrentOrganisation"             = cb."CurrentOrganisation",
                "LastWorkingDay"                  = cb."LastWorkingDay",
                "ResumeId"                        = cb."ResumeId",
                "EmployeeId"                      = cb."EmployeeId",
                "ResourceTypeId"                  = cb."ResourceTypeId",
                "PCLifecycleId"                   = cb."PCLifecycleId",
                "RequestedMicrosoftAccount"       = cb."RequestedMicrosoftAccount",
                "ConsideredForFutureRequirements" = cb."ConsideredForFutureRequirements",
                "IsReferred"                      = cb."IsReferred",
                "ReferredBy"                      = cb."ReferredBy",
                "IntakeStatusId"                  = throughline.get_candidate_intake_status(cf."HiringRequestId"),
                "IsAgreedForTermsConditions"      = cb."IsAgreedForTermsConditions",
                "ResumeUploadedOn"                = cb."ResumeUploadedOn",
                "LastOrganisation"                = cb."LastOrganisation",
                "RoleHiredFor"                    = cb."RoleHiredFor",
                "PrimarySkillIds"                 = throughline.json_int_array(cb."PrimarySkillIds"),
                "SecondarySkillIds"               = throughline.json_int_array(cb."SecondarySkillIds"),
                "PreferredWorkLocationIds"        = throughline.json_int_array(cb."PreferredWorkLocationIds"),
                "IsActive"                        = true,
                "UpdatedBy"                       = cb."CreatedBy",
                "UpdatedAt"                       = v_now_utc,
                "ReUploadedCandidateOn"           = v_now_utc
            FROM throughline."CandidateBin" cb
            WHERE cb."Id" = p_review_candidate_id
              AND cf."CandidateCode" = p_existing_candidate_code;

            -- Capture updated CandidateId
            SELECT cf."Id" INTO v_candidate_id
            FROM throughline."CandidateForms" cf
            WHERE cf."CandidateCode" = p_existing_candidate_code
            LIMIT 1;

            -- Insert into history
            INSERT INTO throughline."CandidateFormHistory" (
                "CandidateId", "PartnerId", "HiringRequestId", "IsSingleEntry", "FullName", "PhoneNumber", "Email", "CountryId",
                "StateId", "CityId", "Diversity", "NoticePeriod", "RelevantExperience", "CurrentlyWorking", "CurrentOrganisation",
                "LastWorkingDay", "ResumeId", "EmployeeId", "ResourceTypeId", "PCLifecycleId", "RequestedMicrosoftAccount",
                "ConsideredForFutureRequirements", "IsReferred", "ReferredBy", "IntakeStatusId", "IsAgreedForTermsConditions",
                "ResumeUploadedOn", "LastOrganisation", "PrimarySkillIds", "SecondarySkillIds",
                "IsActive", "CreatedBy", "CreatedAt", "CandidateCode", "ReUploadedCandidateOn")
            SELECT
                cf."Id", cf."PartnerId", cf."HiringRequestId", cf."IsSingleEntry", cf."FullName", cf."PhoneNumber", cf."Email",
                cf."CountryId", cf."StateId", cf."CityId", cf."Diversity", cf."NoticePeriod", cf."RelevantExperience",
                cf."CurrentlyWorking", cf."CurrentOrganisation", cf."LastWorkingDay", cf."ResumeId", cf."EmployeeId",
                cf."ResourceTypeId", cf."PCLifecycleId", cf."RequestedMicrosoftAccount", cf."ConsideredForFutureRequirements",
                cf."IsReferred", cf."ReferredBy", cf."IntakeStatusId", cf."IsAgreedForTermsConditions", cf."ResumeUploadedOn",
                cf."LastOrganisation", cf."PrimarySkillIds", cf."SecondarySkillIds",
                cf."IsActive", cf."CreatedBy", cf."CreatedAt", cf."CandidateCode", v_now_utc
            FROM throughline."CandidateForms" cf
            WHERE cf."CandidateCode" = p_existing_candidate_code;

            IF p_existing_candidate_code IS NOT NULL THEN
                DELETE FROM throughline."CandidateBin" WHERE "Id" = p_review_candidate_id;
            END IF;
        END IF;

        -- Mark remaining bin rows that match the (new / updated) candidate as duplicates
        IF v_candidate_id IS NOT NULL OR p_existing_candidate_code IS NOT NULL THEN
            UPDATE throughline."CandidateBin" cb
            SET "IsDuplicate"           = true,
                "ExistingCandidateCode" = cf."CandidateCode"
            FROM throughline."CandidateForms" cf
            WHERE cf."Id" = v_candidate_id
              AND (
                    (cb."Email" IS NOT NULL AND lower(cb."Email") = lower(cf."Email"))
                    OR
                    (cb."PhoneNumber" IS NOT NULL AND cb."PhoneNumber" = cf."PhoneNumber")
                  )
              AND (cb."IsDuplicate" IS NULL OR cb."IsDuplicate" = false);
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- the block above is rolled back (sub-transaction), report the error like the T-SQL CATCH did
        v_candidate_id  := NULL;
        v_error_message := SQLERRM;
        v_severity      := 16;
    END;

    RETURN QUERY SELECT v_candidate_id, v_error_message, v_severity;
END;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.ValidateCandidates   (@CandidatesTVP dbo.UploadCandidateType -> jsonb array; keys = TVP column names)
-- Returns one row per candidate that has at least one validation error (Dapper -> CandidateValidationResultDto).
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.validate_candidates(p_candidates jsonb, p_partner_id integer DEFAULT NULL)
RETURNS TABLE (
    "FullName"     text,
    "Email"        text,
    "PhoneNumber"  text,
    "HrqId"        text,
    "CountryName"  text,
    "StateName"    text,
    "CityName"     text,
    "PartnerId"    integer,
    "ErrorMessage" text
)
LANGUAGE sql
STABLE
AS $$
    WITH candidates AS (
        SELECT c.*
        FROM jsonb_to_recordset(coalesce(p_candidates, '[]'::jsonb)) AS c (
               "PartnerId"                  integer,
               "PartnerCode"                text,
               "HiringRequestId"            integer,
               "HrqId"                      text,
               "JobTitle"                   text,
               "FullName"                   text,
               "PhoneNumber"                text,
               "Email"                      text,
               "RoleHiredFor"               text,
               "PrimarySkillNames"          text,
               "SecondarySkillNames"        text,
               "PreferredWorkLocationNames" text,
               "Diversity"                  text,
               "CountryName"                text,
               "StateName"                  text,
               "CityName"                   text,
               "NoticePeriod"               integer,
               "RelevantExperience"         integer,
               "CurrentlyWorking"           text,
               "CurrentOrganisation"        text,
               "LastWorkingDay"             timestamp without time zone,
               "IsDuplicate"                boolean,
               "PrimarySkillIds"            text,
               "SecondarySkillIds"          text,
               "PreferredWorkLocationIds"   text,
               "ExistingCandidateCode"      text,
               "IsSingleEntry"              boolean,
               "CountryId"                  integer,
               "StateId"                    integer,
               "CityId"                     integer)
    ),
    validated AS (
        SELECT
            c."FullName",
            c."Email",
            c."PhoneNumber",
            c."HrqId",
            c."CountryName",
            c."StateName",
            c."CityName",
            c."PartnerId",

            -- Check Partner
            CASE
                WHEN p."Id" IS NULL THEN concat('Invalid Partner: ', c."PartnerCode")
                WHEN p_partner_id IS NOT NULL AND p."Id" IS NOT NULL AND p_partner_id <> p."Id"
                     THEN concat('Invalid PartnerCode: ', c."PartnerCode")
                WHEN p_partner_id IS NOT NULL THEN NULL
                WHEN hrp."Id" IS NULL THEN concat('Invalid Partner: ', 'Partner is not assigned with the HrqId : ', c."HrqId")
                ELSE NULL
            END AS partner_error,

            -- Check HRQ
            CASE
                WHEN h."Id" IS NULL THEN concat('Invalid HRQID: ', c."HrqId")
                WHEN h."IsParentHRQ" = false THEN concat('Cannot add candidates to child hiring requests. HrqId : ', c."HrqId")
                WHEN jd."Id" IS NULL THEN concat('Missing JobDetails HRQ: ', c."HrqId")
                WHEN pc."Id" IS NULL THEN concat('Missing PartnerCategory HRQ: ', c."HrqId")
                WHEN NOT EXISTS (SELECT 1 FROM throughline."InterviewRounds" ir WHERE ir."HiringRequestId" = h."Id")
                     THEN concat('Please ensure at least one interview round is scheduled. HRQ ID: ', c."HrqId")
                WHEN pc."IsProxyPartner" = true THEN concat('Cannot add candidates to proxy hiring requests.', c."HrqId")
                ELSE NULL
            END AS hrq_error,

            -- Check Email
            CASE
                WHEN c."Email" IS NULL OR c."Email" NOT LIKE '%_@__%.__%' THEN concat('Invalid Email: ', c."Email")
                ELSE NULL
            END AS email_error,

            -- Check Phone
            CASE
                WHEN c."PhoneNumber" IS NULL OR c."PhoneNumber" !~ '^[6-9]' OR length(c."PhoneNumber") <> 10
                     THEN concat('Invalid Phone: ', c."PhoneNumber")
                ELSE NULL
            END AS phone_error,

            -- Check Country / State / City
            CASE WHEN mc."Id"  IS NULL THEN concat('Invalid Country: ', c."CountryName") END AS country_error,
            CASE WHEN ms."Id"  IS NULL THEN concat('Invalid State: ',   c."StateName")   END AS state_error,
            CASE WHEN mci."Id" IS NULL THEN concat('Invalid City: ',    c."CityName")    END AS city_error,

            -- Check Diversity / CurrentlyWorking
            CASE WHEN c."Diversity" IS NOT NULL AND lower(c."Diversity") NOT IN ('yes', 'no')
                 THEN 'Invalid Diversity' END AS diversity_error,
            CASE WHEN c."CurrentlyWorking" IS NOT NULL AND lower(c."CurrentlyWorking") NOT IN ('yes', 'no')
                 THEN 'Invalid CurrentlyWorking' END AS currently_working_error,

            -- Primary / Secondary skills: error only when none of the ';'-separated names is a known skill
            CASE
                WHEN c."PrimarySkillNames" IS NOT NULL AND NOT EXISTS (
                        SELECT 1
                        FROM unnest(string_to_array(c."PrimarySkillNames", ';')) AS s(value)
                        WHERE EXISTS (SELECT 1 FROM throughline."M_Skills" sk WHERE lower(sk."Name") = lower(s.value)))
                THEN concat('Invalid Primary Skills: ', c."PrimarySkillNames")
                ELSE NULL
            END AS primary_skill_error,
            CASE
                WHEN c."SecondarySkillNames" IS NOT NULL AND NOT EXISTS (
                        SELECT 1
                        FROM unnest(string_to_array(c."SecondarySkillNames", ';')) AS s(value)
                        WHERE EXISTS (SELECT 1 FROM throughline."M_Skills" sk WHERE lower(sk."Name") = lower(s.value)))
                THEN concat('Invalid Secondary Skills: ', c."SecondarySkillNames")
                ELSE NULL
            END AS secondary_skill_error,

            -- Preferred work locations must be among the HRQ's primary/secondary cities
            -- (T-SQL split this list on ',' whereas the other lists use ';' - preserved as-is)
            CASE
                WHEN EXISTS (SELECT 1
                             FROM unnest(jd."PrimaryCityIds") AS j(city_id)
                             JOIN throughline."M_Cities" m ON m."Id" = j.city_id
                             WHERE lower(m."Name") IN (SELECT lower(v) FROM unnest(string_to_array(c."PreferredWorkLocationNames", ',')) AS v))
                  OR EXISTS (SELECT 1
                             FROM unnest(jd."SecondaryCityIds") AS j(city_id)
                             JOIN throughline."M_Cities" m ON m."Id" = j.city_id
                             WHERE lower(m."Name") IN (SELECT lower(v) FROM unnest(string_to_array(c."PreferredWorkLocationNames", ',')) AS v))
                THEN NULL
                ELSE concat('Invalid Work Locations: ', c."PreferredWorkLocationNames")
            END AS work_location_error
        FROM candidates c
        LEFT JOIN throughline."Partners"          p   ON lower(p."PartnerCode") = lower(c."PartnerCode")
        LEFT JOIN throughline."Hiring"            h   ON lower(h."HrqId") = lower(c."HrqId") AND h."IsParentHRQ" = true
        LEFT JOIN throughline."JobDetails"        jd  ON jd."HiringRequestId" = h."Id"
        LEFT JOIN throughline."PartnerCategories" pc  ON pc."HiringRequestId" = h."Id"
        LEFT JOIN throughline."HiringReqPartner"  hrp ON hrp."PartnerCategoryId" = pc."Id" AND hrp."PartnerId" = p."Id"
        LEFT JOIN throughline."M_Countries"       mc  ON lower(mc."Name")  = lower(c."CountryName")
        LEFT JOIN throughline."M_States"          ms  ON lower(ms."Name")  = lower(c."StateName")
        LEFT JOIN throughline."M_Cities"          mci ON lower(mci."Name") = lower(c."CityName")
    )
    SELECT
        v."FullName",
        v."Email",
        v."PhoneNumber",
        v."HrqId",
        v."CountryName",
        v."StateName",
        v."CityName",
        v."PartnerId",
        concat(v."FullName" || ' : ', string_agg(e.err, ', ' ORDER BY e.ord)) AS "ErrorMessage"
    FROM validated v
    CROSS JOIN LATERAL (VALUES
        (1,  v.partner_error),
        (2,  v.hrq_error),
        (3,  v.email_error),
        (4,  v.phone_error),
        (5,  v.country_error),
        (6,  v.state_error),
        (7,  v.city_error),
        (8,  v.diversity_error),
        (9,  v.currently_working_error),
        (10, v.primary_skill_error),
        (11, v.secondary_skill_error),
        (12, v.work_location_error)
    ) AS e(ord, err)
    WHERE e.err IS NOT NULL
    GROUP BY v."FullName", v."Email", v."PhoneNumber", v."HrqId", v."CountryName", v."StateName", v."CityName", v."PartnerId";
$$;

-- ---------------------------------------------------------------------------------------------------------
-- dbo.UploadValidatedCandidates  (@CandidatesTVP dbo.UploadCandidateType -> jsonb array; keys = TVP column names)
-- Validates every row; if any row has an error nothing is inserted and all rows are returned with ErrorMessage,
-- otherwise all rows are inserted into CandidateBin and returned with ErrorMessage NULL.
-- Result columns are consumed by Dapper into GetCandidateBinDto (PrimarySkillIdStr etc. are JSON text).
-- ---------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION throughline.upload_validated_candidates(
    p_candidates jsonb,
    p_partner_id integer,
    p_user_id    integer)
RETURNS TABLE (
    "PartnerId"                  integer,
    "HiringRequestId"            integer,
    "IsSingleEntry"              boolean,
    "FullName"                   text,
    "PhoneNumber"                text,
    "Email"                      text,
    "CountryId"                  integer,
    "StateId"                    integer,
    "CityId"                     integer,
    "Diversity"                  text,
    "NoticePeriod"               integer,
    "RelevantExperience"         integer,
    "CurrentlyWorking"           text,
    "CurrentOrganisation"        text,
    "LastWorkingDay"             timestamp without time zone,
    "IsActive"                   boolean,
    "CreatedBy"                  integer,
    "CreatedAt"                  timestamp without time zone,
    "IsDuplicate"                boolean,
    "PrimarySkillIdStr"          text,
    "SecondarySkillIdStr"        text,
    "PreferredWorkLocationIdStr" text,
    "ExistingCandidateCode"      text,
    "ErrorMessage"               text
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
DECLARE
    v_now timestamp without time zone := localtimestamp;   -- T-SQL used GETDATE()
BEGIN
    BEGIN
        IF to_regclass('pg_temp.tmp_upload_validation') IS NOT NULL THEN
            DROP TABLE tmp_upload_validation;
        END IF;
        CREATE TEMP TABLE tmp_upload_validation ON COMMIT DROP AS
        SELECT
            row_number() OVER ()                       AS candidate_row_id,
            p."Id"                                     AS "PartnerId",
            h."Id"                                     AS "HiringRequestId",
            false                                      AS "IsSingleEntry",
            c."FullName",
            c."PhoneNumber",
            c."Email",
            mc."Id"                                    AS "CountryId",
            ms."Id"                                    AS "StateId",
            mci."Id"                                   AS "CityId",
            CASE WHEN c."Diversity" IS NULL THEN NULL
                 WHEN lower(c."Diversity") = 'yes' THEN 'Yes'
                 WHEN lower(c."Diversity") = 'no'  THEN 'No'
                 ELSE NULL END                         AS "Diversity",
            c."NoticePeriod",
            c."RelevantExperience",
            CASE WHEN c."CurrentlyWorking" IS NULL THEN NULL
                 WHEN lower(c."CurrentlyWorking") = 'yes' THEN 'Yes'
                 WHEN lower(c."CurrentlyWorking") = 'no'  THEN 'No'
                 ELSE NULL END                         AS "CurrentlyWorking",
            c."CurrentOrganisation",
            c."LastWorkingDay",
            -- Skill and location ids as JSON text "[1,2]" (CandidateBin stores them as text)
            (SELECT '[' || string_agg(sk."Id"::text, ',') || ']'
             FROM unnest(string_to_array(c."PrimarySkillNames", ';')) AS s(value)
             JOIN throughline."M_Skills" sk ON lower(sk."Name") = lower(s.value))   AS "PrimarySkillIds",
            (SELECT '[' || string_agg(sk."Id"::text, ',') || ']'
             FROM unnest(string_to_array(c."SecondarySkillNames", ';')) AS s(value)
             JOIN throughline."M_Skills" sk ON lower(sk."Name") = lower(s.value))   AS "SecondarySkillIds",
            (SELECT '[' || string_agg(m."Id"::text, ',') || ']'
             FROM unnest(string_to_array(c."PreferredWorkLocationNames", ';')) AS s(value)
             JOIN throughline."M_Cities" m ON lower(m."Name") = lower(s.value))     AS "PreferredWorkLocationIds",
            -- ExistingCandidateCode if email or phone matches
            (SELECT cf."CandidateCode"
             FROM throughline."CandidateForms" cf
             WHERE lower(cf."Email") = lower(c."Email") OR cf."PhoneNumber" = c."PhoneNumber"
             LIMIT 1)                                  AS "ExistingCandidateCode",
            EXISTS (SELECT 1
                    FROM throughline."CandidateForms" cf
                    WHERE lower(cf."Email") = lower(c."Email") OR cf."PhoneNumber" = c."PhoneNumber") AS "IsDuplicate",
            -- Validation errors
            concat_ws(', ',
                CASE WHEN p_partner_id IS NULL AND p."Id" IS NULL THEN concat('Invalid Partner: ', c."PartnerCode")
                     WHEN p_partner_id IS NOT NULL AND p."Id" IS NOT NULL AND p_partner_id <> p."Id"
                          THEN concat('Invalid PartnerCode: ', c."PartnerCode") END,
                CASE WHEN h."Id" IS NULL THEN concat('Invalid HRQID: ', c."HrqId")
                     WHEN h."IsParentHRQ" = false THEN concat('Cannot add candidates to child HRQ: ', c."HrqId")
                     WHEN jd."Id" IS NULL THEN concat('Missing JobDetails HRQ: ', c."HrqId")
                     WHEN pc."Id" IS NULL THEN concat('Missing PartnerCategory HRQ: ', c."HrqId")
                     WHEN pc."IsProxyPartner" = true THEN concat('Cannot add candidates to proxy HRQ: ', c."HrqId")
                     WHEN NOT EXISTS (SELECT 1 FROM throughline."InterviewRounds" ir WHERE ir."HiringRequestId" = h."Id")
                          THEN concat('No interview rounds scheduled HRQ: ', c."HrqId") END,
                CASE WHEN c."Email" IS NULL OR c."Email" NOT LIKE '%_@__%.__%' THEN concat('Invalid Email: ', c."Email") END,
                CASE WHEN c."PhoneNumber" IS NULL OR c."PhoneNumber" !~ '^[6-9]' OR length(c."PhoneNumber") <> 10
                          THEN concat('Invalid Phone: ', c."PhoneNumber") END,
                CASE WHEN mc."Id"  IS NULL THEN concat('Invalid Country: ', c."CountryName") END,
                CASE WHEN ms."Id"  IS NULL THEN concat('Invalid State: ',   c."StateName")   END,
                CASE WHEN mci."Id" IS NULL THEN concat('Invalid City: ',    c."CityName")    END,
                CASE WHEN c."Diversity" IS NOT NULL AND lower(c."Diversity") NOT IN ('yes', 'no') THEN 'Invalid Diversity' END,
                CASE WHEN c."CurrentlyWorking" IS NOT NULL AND lower(c."CurrentlyWorking") NOT IN ('yes', 'no') THEN 'Invalid CurrentlyWorking' END
            )                                          AS "ErrorMessage"
        FROM jsonb_to_recordset(coalesce(p_candidates, '[]'::jsonb)) AS c (
               "PartnerId"                  integer,
               "PartnerCode"                text,
               "HiringRequestId"            integer,
               "HrqId"                      text,
               "JobTitle"                   text,
               "FullName"                   text,
               "PhoneNumber"                text,
               "Email"                      text,
               "RoleHiredFor"               text,
               "PrimarySkillNames"          text,
               "SecondarySkillNames"        text,
               "PreferredWorkLocationNames" text,
               "Diversity"                  text,
               "CountryName"                text,
               "StateName"                  text,
               "CityName"                   text,
               "NoticePeriod"               integer,
               "RelevantExperience"         integer,
               "CurrentlyWorking"           text,
               "CurrentOrganisation"        text,
               "LastWorkingDay"             timestamp without time zone,
               "IsDuplicate"                boolean,
               "PrimarySkillIds"            text,
               "SecondarySkillIds"          text,
               "PreferredWorkLocationIds"   text,
               "ExistingCandidateCode"      text,
               "IsSingleEntry"              boolean,
               "CountryId"                  integer,
               "StateId"                    integer,
               "CityId"                     integer)
        LEFT JOIN throughline."Partners"          p   ON lower(p."PartnerCode") = lower(c."PartnerCode")
        LEFT JOIN throughline."Hiring"            h   ON lower(h."HrqId") = lower(c."HrqId") AND h."IsParentHRQ" = true
        LEFT JOIN throughline."JobDetails"        jd  ON jd."HiringRequestId" = h."Id"
        LEFT JOIN throughline."PartnerCategories" pc  ON pc."HiringRequestId" = h."Id"
        LEFT JOIN throughline."M_Countries"       mc  ON lower(mc."Name")  = lower(c."CountryName")
        LEFT JOIN throughline."M_States"          ms  ON lower(ms."Name")  = lower(c."StateName")
        LEFT JOIN throughline."M_Cities"          mci ON lower(mci."Name") = lower(c."CityName");

        -- Any error -> return everything without inserting
        IF EXISTS (SELECT 1 FROM tmp_upload_validation t WHERE t."ErrorMessage" IS NOT NULL AND t."ErrorMessage" <> '') THEN
            RETURN QUERY
            SELECT t."PartnerId", t."HiringRequestId", t."IsSingleEntry", t."FullName", t."PhoneNumber", t."Email",
                   t."CountryId", t."StateId", t."CityId", t."Diversity", t."NoticePeriod", t."RelevantExperience",
                   t."CurrentlyWorking", t."CurrentOrganisation", t."LastWorkingDay", true, p_user_id, v_now,
                   t."IsDuplicate", t."PrimarySkillIds", t."SecondarySkillIds", t."PreferredWorkLocationIds",
                   t."ExistingCandidateCode", t."ErrorMessage"
            FROM tmp_upload_validation t
            ORDER BY t.candidate_row_id;
            RETURN;
        END IF;

        -- Otherwise insert into CandidateBin
        INSERT INTO throughline."CandidateBin" (
            "PartnerId", "HiringRequestId", "IsSingleEntry", "FullName", "PhoneNumber", "Email",
            "CountryId", "StateId", "CityId", "Diversity", "NoticePeriod", "RelevantExperience",
            "CurrentlyWorking", "CurrentOrganisation", "LastWorkingDay", "IsActive",
            "CreatedBy", "CreatedAt", "IsDuplicate", "PrimarySkillIds", "SecondarySkillIds",
            "PreferredWorkLocationIds", "ExistingCandidateCode")
        SELECT t."PartnerId", t."HiringRequestId", t."IsSingleEntry", t."FullName", t."PhoneNumber", t."Email",
               t."CountryId", t."StateId", t."CityId", t."Diversity", t."NoticePeriod", t."RelevantExperience",
               t."CurrentlyWorking", t."CurrentOrganisation", t."LastWorkingDay", true,
               p_user_id, v_now, t."IsDuplicate", t."PrimarySkillIds", t."SecondarySkillIds",
               t."PreferredWorkLocationIds", t."ExistingCandidateCode"
        FROM tmp_upload_validation t
        ORDER BY t.candidate_row_id;

        RETURN QUERY
        SELECT t."PartnerId", t."HiringRequestId", t."IsSingleEntry", t."FullName", t."PhoneNumber", t."Email",
               t."CountryId", t."StateId", t."CityId", t."Diversity", t."NoticePeriod", t."RelevantExperience",
               t."CurrentlyWorking", t."CurrentOrganisation", t."LastWorkingDay", true, p_user_id, v_now,
               t."IsDuplicate", t."PrimarySkillIds", t."SecondarySkillIds", t."PreferredWorkLocationIds",
               t."ExistingCandidateCode", NULL::text
        FROM tmp_upload_validation t
        ORDER BY t.candidate_row_id;

    EXCEPTION WHEN OTHERS THEN
        -- T-SQL CATCH: a single row carrying only the error message
        RETURN QUERY
        SELECT NULL::integer, NULL::integer, NULL::boolean, NULL::text, NULL::text, NULL::text,
               NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::integer, NULL::integer,
               NULL::text, NULL::text, NULL::timestamp without time zone, NULL::boolean, NULL::integer,
               NULL::timestamp without time zone, NULL::boolean, NULL::text, NULL::text, NULL::text,
               NULL::text, SQLERRM;
    END;
END;
$$;
