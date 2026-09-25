-- CreateEnum
CREATE TYPE "RoleVisibility" AS ENUM ('open', 'preferred', 'invite_only');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('submission_status_changed', 'role_published', 'role_invitation', 'earning_created', 'payout_update', 'system_announcement');

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "visibility" "RoleVisibility" NOT NULL DEFAULT 'open';

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_invitations" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "recruiter_profile_id" UUID NOT NULL,
    "invited_by_user_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "message" VARCHAR(500),
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "role_invitations_recruiter_profile_id_status_idx" ON "role_invitations"("recruiter_profile_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "role_invitations_role_id_recruiter_profile_id_key" ON "role_invitations"("role_id", "recruiter_profile_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_invitations" ADD CONSTRAINT "role_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_invitations" ADD CONSTRAINT "role_invitations_recruiter_profile_id_fkey" FOREIGN KEY ("recruiter_profile_id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_invitations" ADD CONSTRAINT "role_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
