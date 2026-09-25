import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/s3.js';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';
import {
  sanitizeFilename,
  validateCvMetadata,
  verifyMagicBytes,
  verifyDocxDeep,
} from '../lib/file-validation.js';

/**
 * S3 service — Phase 2 Wave 2.
 *
 * Contract:
 *
 *   - `createUploadIntent` hands the client a pre-signed PUT URL that
 *     is bound to a specific `ContentType` and `ContentLength`. The
 *     client MUST send those two headers unchanged or S3 rejects the
 *     PUT. That's one half of the guard rail.
 *
 *   - `verifyUploadedObject` is the other half: after the PUT, the
 *     server HEADs the object to confirm the declared size/type and
 *     ranged-GETs the first ~512 bytes to magic-byte check the
 *     payload. Only after both pass does the submission row land.
 *
 *   - `deleteObject` is best-effort cleanup — used by the submission
 *     service when a submission create fails AFTER the object is
 *     already in the bucket, so we don't orphan bytes.
 *
 *   - `createDownloadUrl` is exported but unused in W2 (recruiter flow
 *     only). Wave 3 wires it into POST /submissions/:id/download.
 */

export interface CreateUploadIntentInput {
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

export interface CreateUploadIntentResult {
  uploadUrl: string;
  s3Key: string;
  expiresAt: string;
}

export async function createUploadIntent(
  recruiterId: string,
  input: CreateUploadIntentInput,
): Promise<CreateUploadIntentResult> {
  validateCvMetadata(input);

  const sanitized = sanitizeFilename(input.filename);
  const s3Key = `cv/${recruiterId}/${randomUUID()}-${sanitized}`;


  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: env.AWS_S3_PRESIGN_EXPIRY_SECONDS,
  });

  const expiresAt = new Date(
    Date.now() + env.AWS_S3_PRESIGN_EXPIRY_SECONDS * 1000,
  ).toISOString();

  return { uploadUrl, s3Key, expiresAt };
}

/**
 * Consume an SDK GetObject `Body` stream into a Buffer. Node SDK v3
 * returns a `Readable` (web Streams would need a different branch,
 * but on Node we never see those in practice).
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

/**
 * Post-upload verification. Runs AFTER the client has PUT the object
 * to S3 (the pre-signed URL binds size + MIME, but only at the S3
 * perimeter — we still need our own sniff to catch a bytes-vs-type
 * lie). Throws AppError.badRequest on any mismatch; the submission
 * service catches, deletes the orphaned object, and rethrows.
 */
export async function verifyUploadedObject(
  s3Key: string,
  expectedSizeBytes: number,
  expectedMime: string,
): Promise<void> {
  let head;
  try {
    head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      }),
    );
  } catch (err) {
    throw AppError.badRequest(
      'Uploaded file was not found in storage (upload may have failed or expired)',
      { s3Key, cause: err instanceof Error ? err.message : String(err) },
    );
  }

  if (typeof head.ContentLength !== 'number' || head.ContentLength !== expectedSizeBytes) {
    throw AppError.badRequest(
      `Uploaded file size (${head.ContentLength ?? 'unknown'}) does not match declared size (${expectedSizeBytes})`,
    );
  }

  // S3 sometimes appends charset or other parameters; accept any
  // ContentType that starts with the declared MIME.
  if (
    typeof head.ContentType !== 'string' ||
    !head.ContentType.startsWith(expectedMime)
  ) {
    throw AppError.badRequest(
      `Uploaded file MIME (${head.ContentType ?? 'unknown'}) does not match declared MIME (${expectedMime})`,
    );
  }

  // Range-GET the first 512 bytes for magic-byte verification. That's
  // more than enough for the PDF/DOCX headers we inspect.
  let firstBytes: Buffer;
  try {
    const obj = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Range: 'bytes=0-511',
      }),
    );
    if (!obj.Body) {
      throw new Error('Empty object body on range GET');
    }
    firstBytes = await streamToBuffer(obj.Body as Readable);
  } catch (err) {
    throw AppError.badRequest(
      'Could not read uploaded file for verification',
      { s3Key, cause: err instanceof Error ? err.message : String(err) },
    );
  }

  verifyMagicBytes(expectedMime, firstBytes);

  // Phase 3: Deep DOCX validation — fetch full object and walk ZIP central directory
  if (
    expectedMime ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const fullObj = await s3Client.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
      );
      if (fullObj.Body) {
        const fullBuffer = await streamToBuffer(fullObj.Body as Readable);
        await verifyDocxDeep(fullBuffer);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest('Failed to verify DOCX file structure');
    }
  }
}

/**
 * Best-effort delete. Used as rollback cleanup — logs on failure but
 * never throws (we don't want a rollback path to mask the original
 * error with an unrelated S3 hiccup).
 */
export async function deleteObject(s3Key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      }),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[s3] deleteObject failed (non-fatal)', {
      s3Key,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Pre-signed GET URL for CV download. Exported but unused in W2 —
 * Wave 3 wires the company-only POST /submissions/:id/download route
 * through this helper. Kept here so the s3 boundary lives in one
 * file instead of growing an outrigger later.
 */
export async function createDownloadUrl(
  s3Key: string,
  expiresSec: number = env.AWS_S3_PRESIGN_EXPIRY_SECONDS,
): Promise<{ downloadUrl: string; expiresAt: string }> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });
  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresSec,
  });
  const expiresAt = new Date(Date.now() + expiresSec * 1000).toISOString();
  return { downloadUrl, expiresAt };
}

/**
 * JD (Job Description) upload intent — same dance as CV but keyed to
 * the company instead of the recruiter. Reuses the same CV file
 * validation (PDF/DOCX, 10 MB) since JDs follow the same constraints.
 */
export async function createJdUploadIntent(
  companyId: string,
  input: CreateUploadIntentInput,
): Promise<CreateUploadIntentResult> {
  validateCvMetadata(input);

  const sanitized = sanitizeFilename(input.filename);
  const s3Key = `jd/${companyId}/${randomUUID()}-${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: env.AWS_S3_PRESIGN_EXPIRY_SECONDS,
  });

  const expiresAt = new Date(
    Date.now() + env.AWS_S3_PRESIGN_EXPIRY_SECONDS * 1000,
  ).toISOString();

  return { uploadUrl, s3Key, expiresAt };
}
