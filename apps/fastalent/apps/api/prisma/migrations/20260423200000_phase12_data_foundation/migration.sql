-- Phase 12: Data Foundation (Hiring Intelligence v3.0)
-- Schema additions + backfill from existing data

-- 1. RejectionReason enum
CREATE TYPE "RejectionReason" AS ENUM ('overqualified', 'underqualified', 'salary_mismatch', 'cultural_fit', 'experience_mismatch', 'skills_gap', 'accepted_elsewhere', 'other');

-- 2. Add publishedAt and firstSubmissionAt to roles
ALTER TABLE "roles" ADD COLUMN "published_at" TIMESTAMP(3);
ALTER TABLE "roles" ADD COLUMN "first_submission_at" TIMESTAMP(3);

-- 3. Add lastSubmissionAt to recruiter_profiles
ALTER TABLE "recruiter_profiles" ADD COLUMN "last_submission_at" TIMESTAMP(3);

-- 4. Add rejectionReason to submission_status_events
ALTER TABLE "submission_status_events" ADD COLUMN "rejection_reason" "RejectionReason";

-- 5. Create hiring_metrics table
CREATE TABLE "hiring_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "days_to_fill" INTEGER,
    "days_to_first_sub" INTEGER,
    "submission_count" INTEGER NOT NULL DEFAULT 0,
    "shortlist_count" INTEGER NOT NULL DEFAULT 0,
    "interview_count" INTEGER NOT NULL DEFAULT 0,
    "hire_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "withdrawn_count" INTEGER NOT NULL DEFAULT 0,
    "sub_to_hire_ratio" DECIMAL(5,2),
    "total_payout_amount" DECIMAL(14,2),
    "cost_per_hire" DECIMAL(14,2),
    "unique_recruiters" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hiring_metrics_role_id_key" ON "hiring_metrics"("role_id");
CREATE INDEX "hiring_metrics_created_at_idx" ON "hiring_metrics"("created_at" DESC);

ALTER TABLE "hiring_metrics" ADD CONSTRAINT "hiring_metrics_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- BACKFILL: Populate denormalized fields from existing data
-- =============================================================

-- 6. Backfill publishedAt from role_status_history (first transition TO published)
UPDATE "roles" r
SET "published_at" = sub.first_published
FROM (
    SELECT "role_id", MIN("created_at") AS first_published
    FROM "role_status_history"
    WHERE "to_status" = 'published'
    GROUP BY "role_id"
) sub
WHERE r."id" = sub."role_id"
  AND r."published_at" IS NULL;

-- For roles that are published/filled but have no status history (legacy),
-- fall back to created_at as approximate published_at
UPDATE "roles"
SET "published_at" = "created_at"
WHERE "status" IN ('published', 'filled', 'closed', 'paused')
  AND "published_at" IS NULL;

-- 7. Backfill firstSubmissionAt from submissions
UPDATE "roles" r
SET "first_submission_at" = sub.first_sub
FROM (
    SELECT "role_id", MIN("created_at") AS first_sub
    FROM "submissions"
    GROUP BY "role_id"
) sub
WHERE r."id" = sub."role_id"
  AND r."first_submission_at" IS NULL;

-- 8. Backfill lastSubmissionAt on recruiter_profiles
UPDATE "recruiter_profiles" rp
SET "last_submission_at" = sub.last_sub
FROM (
    SELECT "recruiter_id", MAX("created_at") AS last_sub
    FROM "submissions"
    GROUP BY "recruiter_id"
) sub
WHERE rp."id" = sub."recruiter_id"
  AND rp."last_submission_at" IS NULL;

-- 9. Backfill HiringMetric for already-filled/closed roles
INSERT INTO "hiring_metrics" (
    "role_id",
    "days_to_fill",
    "days_to_first_sub",
    "submission_count",
    "shortlist_count",
    "interview_count",
    "hire_count",
    "rejected_count",
    "withdrawn_count",
    "sub_to_hire_ratio",
    "total_payout_amount",
    "cost_per_hire",
    "unique_recruiters"
)
SELECT
    r."id",
    -- daysToFill: publishedAt to closedAt
    CASE
        WHEN r."published_at" IS NOT NULL AND r."closed_at" IS NOT NULL
        THEN EXTRACT(DAY FROM r."closed_at" - r."published_at")::INT
        ELSE NULL
    END,
    -- daysToFirstSubmission: publishedAt to firstSubmissionAt
    CASE
        WHEN r."published_at" IS NOT NULL AND r."first_submission_at" IS NOT NULL
        THEN GREATEST(0, EXTRACT(DAY FROM r."first_submission_at" - r."published_at")::INT)
        ELSE NULL
    END,
    r."submissions_count",
    r."shortlisted_count",
    -- interview count from submissions
    (SELECT COUNT(*) FROM "submissions" s
     WHERE s."role_id" = r."id"
       AND s."status" IN ('interview', 'hired', 'joined')),
    r."hired_count",
    (SELECT COUNT(*) FROM "submissions" s WHERE s."role_id" = r."id" AND s."status" = 'rejected'),
    (SELECT COUNT(*) FROM "submissions" s WHERE s."role_id" = r."id" AND s."status" = 'withdrawn'),
    -- submissionToHireRatio
    CASE
        WHEN r."submissions_count" > 0
        THEN ROUND((r."hired_count"::DECIMAL / r."submissions_count") * 100, 2)
        ELSE NULL
    END,
    -- totalPayoutAmount from earnings
    (SELECT COALESCE(SUM(e."gross_amount"), 0) FROM "earnings" e WHERE e."role_id" = r."id"),
    -- costPerHire
    CASE
        WHEN r."hired_count" > 0
        THEN (SELECT COALESCE(SUM(e."gross_amount"), 0) FROM "earnings" e WHERE e."role_id" = r."id") / r."hired_count"
        ELSE NULL
    END,
    -- uniqueRecruiters
    (SELECT COUNT(DISTINCT s."recruiter_id") FROM "submissions" s WHERE s."role_id" = r."id")
FROM "roles" r
WHERE r."status" IN ('filled', 'closed')
  AND NOT EXISTS (SELECT 1 FROM "hiring_metrics" hm WHERE hm."role_id" = r."id");
