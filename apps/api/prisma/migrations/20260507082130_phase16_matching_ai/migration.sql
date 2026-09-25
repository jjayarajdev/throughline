-- CreateEnum
CREATE TYPE "JdCruxStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "match_breakdown" JSONB,
ADD COLUMN     "match_explanation" TEXT,
ADD COLUMN     "match_score" INTEGER;

-- CreateTable
CREATE TABLE "jd_crux" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "JdCruxStatus" NOT NULL DEFAULT 'pending',
    "key_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nice_to_have_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "must_haves" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seniority_level" VARCHAR(50),
    "experience_min" INTEGER,
    "experience_max" INTEGER,
    "summary" TEXT,
    "raw_text" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jd_crux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jd_crux_role_id_key" ON "jd_crux"("role_id");

-- AddForeignKey
ALTER TABLE "jd_crux" ADD CONSTRAINT "jd_crux_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
