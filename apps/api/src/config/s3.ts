import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

/**
 * Shared S3 client. Constructed once at module load using the
 * IAM credentials of the `gigcruite-api` user (scoped to the dev
 * bucket). Re-used by `s3.service.ts` for both the presigner and the
 * HeadObject / Range-GET verification round-trip.
 */
export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET = env.AWS_S3_BUCKET;
