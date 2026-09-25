-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
