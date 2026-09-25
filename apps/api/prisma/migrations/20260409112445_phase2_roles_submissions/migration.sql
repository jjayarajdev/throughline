-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('regular', 'headhunting');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('draft', 'active', 'paused', 'closed', 'filled');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('flat', 'percentage');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('submitted', 'shortlisted', 'interview', 'hired', 'joined', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "role_type" "RoleType" NOT NULL DEFAULT 'regular',
    "status" "RoleStatus" NOT NULL DEFAULT 'draft',
    "location" VARCHAR(255) NOT NULL,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "employment_type" VARCHAR(50) NOT NULL,
    "experience_min" INTEGER NOT NULL,
    "experience_max" INTEGER NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ctc_min" DECIMAL(12,2) NOT NULL,
    "ctc_max" DECIMAL(12,2) NOT NULL,
    "payout_type" "PayoutType" NOT NULL,
    "payout_value" DECIMAL(12,4) NOT NULL,
    "max_submissions" INTEGER NOT NULL DEFAULT 50,
    "max_per_recruiter" INTEGER NOT NULL DEFAULT 5,
    "submissions_count" INTEGER NOT NULL DEFAULT 0,
    "shortlisted_count" INTEGER NOT NULL DEFAULT 0,
    "hired_count" INTEGER NOT NULL DEFAULT 0,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "candidate_name" VARCHAR(255) NOT NULL,
    "candidate_email" VARCHAR(255) NOT NULL,
    "candidate_phone" VARCHAR(20) NOT NULL,
    "candidate_fingerprint" VARCHAR(64) NOT NULL,
    "cv_s3_key" VARCHAR(500) NOT NULL,
    "cv_original_filename" VARCHAR(255) NOT NULL,
    "cv_size_bytes" INTEGER NOT NULL,
    "cv_mime_type" VARCHAR(100) NOT NULL,
    "cover_note" TEXT,
    "expected_ctc" DECIMAL(12,2) NOT NULL,
    "notice_period_days" INTEGER NOT NULL,
    "current_location" VARCHAR(255),
    "current_company" VARCHAR(255),
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "accepted_ctc" DECIMAL(12,2),
    "final_payout_inr" DECIMAL(12,2),
    "contact_viewed_by_company" BOOLEAN NOT NULL DEFAULT false,
    "contact_viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_status_events" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "from_status" "SubmissionStatus" NOT NULL,
    "to_status" "SubmissionStatus" NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "actor_role" "UserRole" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_status_created_at_idx" ON "roles"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "roles_company_id_status_idx" ON "roles"("company_id", "status");

-- CreateIndex
CREATE INDEX "roles_role_type_status_idx" ON "roles"("role_type", "status");

-- CreateIndex
CREATE INDEX "submissions_role_id_status_idx" ON "submissions"("role_id", "status");

-- CreateIndex
CREATE INDEX "submissions_recruiter_id_status_created_at_idx" ON "submissions"("recruiter_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "submissions_status_created_at_idx" ON "submissions"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "submissions_role_id_candidate_fingerprint_key" ON "submissions"("role_id", "candidate_fingerprint");

-- CreateIndex
CREATE INDEX "submission_status_events_submission_id_created_at_idx" ON "submission_status_events"("submission_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "submission_status_events_to_status_created_at_idx" ON "submission_status_events"("to_status", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_status_events" ADD CONSTRAINT "submission_status_events_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
