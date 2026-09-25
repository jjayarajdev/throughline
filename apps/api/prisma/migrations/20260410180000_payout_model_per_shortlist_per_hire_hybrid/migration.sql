-- Payout model overhaul: FLAT/PERCENTAGE → PER_SHORTLIST/PER_HIRE/HYBRID
-- Replace single payoutValue with payoutPerShortlist + payoutPerHire

-- 1. Add new columns first (nullable so existing rows don't break)
ALTER TABLE "roles" ADD COLUMN "payout_per_shortlist" DECIMAL(10,2);
ALTER TABLE "roles" ADD COLUMN "payout_per_hire" DECIMAL(10,2);

-- 2. Migrate existing data: flat → per_hire (flat amount), percentage → per_hire (store value as-is for now)
UPDATE "roles" SET "payout_per_hire" = "payout_value" WHERE "payout_type" = 'flat';
UPDATE "roles" SET "payout_per_hire" = "payout_value" WHERE "payout_type" = 'percentage';

-- 3. Drop old column
ALTER TABLE "roles" DROP COLUMN "payout_value";

-- 4. Replace enum values: create new type, swap, drop old
CREATE TYPE "PayoutType_new" AS ENUM ('per_shortlist', 'per_hire', 'hybrid');
ALTER TABLE "roles" ALTER COLUMN "payout_type" TYPE "PayoutType_new" USING 'per_hire'::"PayoutType_new";
DROP TYPE "PayoutType";
ALTER TYPE "PayoutType_new" RENAME TO "PayoutType";
