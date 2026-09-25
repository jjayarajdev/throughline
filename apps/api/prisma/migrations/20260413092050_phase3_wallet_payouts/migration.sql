-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('company_deposit', 'company_lock', 'company_unlock', 'company_debit', 'recruiter_credit', 'recruiter_withdrawal', 'platform_commission', 'refund');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('pending', 'payable', 'processing', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "EarningType" AS ENUM ('shortlist_payout', 'hire_payout');

-- CreateEnum
CREATE TYPE "PayoutBatchStatus" AS ENUM ('created', 'processing', 'completed', 'partial_failure', 'failed');

-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled');

-- AlterTable
ALTER TABLE "recruiter_profiles" ADD COLUMN     "bank_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bank_verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "platform_commission_pct" DECIMAL(5,2) NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "company_wallets" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "locked_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balance_before" DECIMAL(14,2) NOT NULL,
    "balance_after" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(500),
    "company_wallet_id" UUID,
    "recruiter_profile_id" UUID,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "earning_type" "EarningType" NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'pending',
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "platform_commission_pct" DECIMAL(5,2) NOT NULL,
    "platform_commission" DECIMAL(14,2) NOT NULL,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "payout_batch_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_batches" (
    "id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "status" "PayoutBatchStatus" NOT NULL DEFAULT 'created',
    "total_amount" DECIMAL(14,2) NOT NULL,
    "earnings_count" INTEGER NOT NULL,
    "razorpay_payout_id" VARCHAR(255),
    "failure_reason" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'pending_approval',
    "amount" DECIMAL(14,2) NOT NULL,
    "bank_details_snapshot" JSONB,
    "admin_user_id" UUID,
    "admin_note" TEXT,
    "rejected_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "payout_batch_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "description" VARCHAR(500),
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_wallets_company_id_key" ON "company_wallets"("company_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_company_wallet_id_created_at_idx" ON "wallet_transactions"("company_wallet_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "wallet_transactions_recruiter_profile_id_created_at_idx" ON "wallet_transactions"("recruiter_profile_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "wallet_transactions_reference_type_reference_id_idx" ON "wallet_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "earnings_recruiter_id_status_created_at_idx" ON "earnings"("recruiter_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "earnings_role_id_status_idx" ON "earnings"("role_id", "status");

-- CreateIndex
CREATE INDEX "earnings_status_created_at_idx" ON "earnings"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "earnings_submission_id_earning_type_key" ON "earnings"("submission_id", "earning_type");

-- CreateIndex
CREATE INDEX "payout_batches_recruiter_id_status_created_at_idx" ON "payout_batches"("recruiter_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payout_batches_status_created_at_idx" ON "payout_batches"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payout_requests_recruiter_id_status_created_at_idx" ON "payout_requests"("recruiter_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payout_requests_status_created_at_idx" ON "payout_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "platform_settings_category_idx" ON "platform_settings"("category");

-- AddForeignKey
ALTER TABLE "company_wallets" ADD CONSTRAINT "company_wallets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_company_wallet_id_fkey" FOREIGN KEY ("company_wallet_id") REFERENCES "company_wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_recruiter_profile_id_fkey" FOREIGN KEY ("recruiter_profile_id") REFERENCES "recruiter_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_payout_batch_id_fkey" FOREIGN KEY ("payout_batch_id") REFERENCES "payout_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
