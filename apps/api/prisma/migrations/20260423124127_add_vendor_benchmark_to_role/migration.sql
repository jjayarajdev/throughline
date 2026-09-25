-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "vendor_benchmark_pct" DECIMAL(5,2);

-- Backfill: stamp existing published/filled/closed roles with their country's benchmark
UPDATE "roles" r
SET "vendor_benchmark_pct" = cc."vendor_benchmark_pct"
FROM "country_configs" cc
WHERE r."country" = cc."country_code"
  AND r."status" IN ('published', 'filled', 'closed', 'paused')
  AND r."vendor_benchmark_pct" IS NULL;
