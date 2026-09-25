-- CreateEnum
CREATE TYPE "PayoutMode" AS ENUM ('flat', 'percentage');

-- AlterEnum: add new NotificationType values
ALTER TYPE "NotificationType" ADD VALUE 'role_submitted_for_review';
ALTER TYPE "NotificationType" ADD VALUE 'role_approved';
ALTER TYPE "NotificationType" ADD VALUE 'role_rejected';

-- CreateTable: role_status_history (must exist BEFORE enum swap references it)
CREATE TABLE "role_status_history" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "from_status" "RoleStatus",
    "to_status" "RoleStatus" NOT NULL,
    "changed_by" UUID NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_status_history_pkey" PRIMARY KEY ("id")
);

-- AlterEnum: RoleStatus (active → published, add submitted/rejected)
-- Data migration: convert existing 'active' rows to 'published' text before swap
BEGIN;

-- Step 1: Create new enum with desired values
CREATE TYPE "RoleStatus_new" AS ENUM ('draft', 'submitted', 'published', 'rejected', 'paused', 'closed', 'filled');

-- Step 2: Convert roles.status — map 'active' to 'published'
ALTER TABLE "public"."roles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "roles" ALTER COLUMN "status" TYPE TEXT;
UPDATE "roles" SET "status" = 'published' WHERE "status" = 'active';
ALTER TABLE "roles" ALTER COLUMN "status" TYPE "RoleStatus_new" USING ("status"::"RoleStatus_new");

-- Step 3: Convert role_status_history columns (table is empty, just change type)
ALTER TABLE "role_status_history" ALTER COLUMN "from_status" TYPE "RoleStatus_new" USING ("from_status"::text::"RoleStatus_new");
ALTER TABLE "role_status_history" ALTER COLUMN "to_status" TYPE "RoleStatus_new" USING ("to_status"::text::"RoleStatus_new");

-- Step 4: Swap enum names
ALTER TYPE "RoleStatus" RENAME TO "RoleStatus_old";
ALTER TYPE "RoleStatus_new" RENAME TO "RoleStatus";
DROP TYPE "public"."RoleStatus_old";

-- Step 5: Restore default
ALTER TABLE "roles" ALTER COLUMN "status" SET DEFAULT 'draft';

COMMIT;

-- AlterTable: company_profiles
ALTER TABLE "company_profiles" ADD COLUMN     "country" VARCHAR(2) NOT NULL DEFAULT 'IN',
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
ADD COLUMN     "default_commission_pct" DECIMAL(5,2);

-- AlterTable: recruiter_profiles
ALTER TABLE "recruiter_profiles" ADD COLUMN     "country" VARCHAR(2) NOT NULL DEFAULT 'IN',
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR';

-- AlterTable: roles — drop old payout columns, add new ones
ALTER TABLE "roles" DROP COLUMN "payout_per_hire",
DROP COLUMN "payout_per_shortlist",
ADD COLUMN     "country" VARCHAR(2) NOT NULL DEFAULT 'IN',
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
ADD COLUMN     "hire_payout_mode" "PayoutMode",
ADD COLUMN     "hire_payout_value" DECIMAL(14,2),
ADD COLUMN     "shortlist_payout_mode" "PayoutMode",
ADD COLUMN     "shortlist_payout_value" DECIMAL(14,2),
ALTER COLUMN "platform_commission_pct" DROP NOT NULL,
ALTER COLUMN "platform_commission_pct" DROP DEFAULT;

-- AlterTable: submissions — rename finalPayoutInr → finalPayout
ALTER TABLE "submissions" DROP COLUMN "final_payout_inr",
ADD COLUMN     "final_payout" DECIMAL(14,2);

-- CreateTable: country_configs
CREATE TABLE "country_configs" (
    "id" UUID NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "currency_symbol" VARCHAR(5),
    "shortlist_flat_min" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shortlist_flat_max" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shortlist_pct_min" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "shortlist_pct_max" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "hire_flat_min" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "hire_flat_max" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "hire_pct_min" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "hire_pct_max" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vendor_benchmark_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_configs_country_code_key" ON "country_configs"("country_code");

-- CreateIndex
CREATE INDEX "role_status_history_role_id_created_at_idx" ON "role_status_history"("role_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "role_status_history" ADD CONSTRAINT "role_status_history_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_status_history" ADD CONSTRAINT "role_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
