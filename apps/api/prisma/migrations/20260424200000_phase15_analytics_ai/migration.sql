-- Phase 15: Analytics AI
-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('stale_role', 'declining_activity', 'high_rejection_rate');

-- CreateEnum
CREATE TYPE "AnomalySeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "AnomalyStatus" AS ENUM ('active', 'acknowledged', 'resolved', 'expired');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ai_anomaly_alert';
ALTER TYPE "NotificationType" ADD VALUE 'ai_role_match';

-- AlterTable
ALTER TABLE "hiring_metrics" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "anomaly_alerts" (
    "id" UUID NOT NULL,
    "type" "AnomalyType" NOT NULL,
    "severity" "AnomalySeverity" NOT NULL,
    "status" "AnomalyStatus" NOT NULL DEFAULT 'active',
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "explanation" TEXT NOT NULL,
    "factors" JSONB NOT NULL DEFAULT '[]',
    "fingerprint" VARCHAR(128) NOT NULL,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomaly_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "operation" VARCHAR(50) NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "cost_usd" DECIMAL(10,6) NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "reference_type" VARCHAR(20),
    "reference_id" UUID,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_alerts_fingerprint_key" ON "anomaly_alerts"("fingerprint");

-- CreateIndex
CREATE INDEX "anomaly_alerts_user_id_status_created_at_idx" ON "anomaly_alerts"("user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "anomaly_alerts_type_status_idx" ON "anomaly_alerts"("type", "status");

-- CreateIndex
CREATE INDEX "ai_usage_logs_provider_created_at_idx" ON "ai_usage_logs"("provider", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_usage_logs_operation_created_at_idx" ON "ai_usage_logs"("operation", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "anomaly_alerts" ADD CONSTRAINT "anomaly_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

