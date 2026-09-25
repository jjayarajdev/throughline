-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "jd_mime_type" VARCHAR(100),
ADD COLUMN     "jd_original_filename" VARCHAR(255),
ADD COLUMN     "jd_s3_key" VARCHAR(500),
ADD COLUMN     "jd_size_bytes" INTEGER;
