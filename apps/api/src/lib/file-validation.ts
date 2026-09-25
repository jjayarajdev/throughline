import yauzl from 'yauzl';
import { AppError } from './app-error.js';

/**
 * CV file validation — Phase 2 + Phase 3.
 *
 * Three layers of defence:
 *
 *   1. `validateCvMetadata` — cheap shape check (filename, size, MIME)
 *      used at intent time BEFORE we hand the client a pre-signed URL.
 *
 *   2. `verifyMagicBytes` — byte-level sniff of the first bytes AFTER upload.
 *
 *   3. `verifyDocxDeep` (Phase 3) — walks ZIP central directory to verify
 *      presence of `word/document.xml` AND `[Content_Types].xml`, rejecting
 *      crafted ZIPs that pass the 4-byte PK check but aren't real DOCX files.
 */

export const MAX_CV_SIZE_BYTES = 10_485_760; // 10 MB

export const ALLOWED_CV_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedCvMime = (typeof ALLOWED_CV_MIME)[number];

const ALLOWED_CV_MIME_SET = new Set<string>(ALLOWED_CV_MIME);

export function isAllowedCvMime(value: string): value is AllowedCvMime {
  return ALLOWED_CV_MIME_SET.has(value);
}

/**
 * Cheap metadata guard. Throws AppError.badRequest with a user-friendly
 * message so the API client can surface it directly.
 */
export function validateCvMetadata(input: {
  filename: string;
  sizeBytes: number;
  mimeType: string;
}): void {
  const { filename, sizeBytes, mimeType } = input;

  if (typeof filename !== 'string' || filename.trim().length === 0) {
    throw AppError.badRequest('Filename is required');
  }
  if (filename.length > 255) {
    throw AppError.badRequest('Filename must be 255 characters or fewer');
  }

  if (!Number.isFinite(sizeBytes) || !Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    throw AppError.badRequest('File size must be a positive integer');
  }
  if (sizeBytes > MAX_CV_SIZE_BYTES) {
    throw AppError.badRequest(
      `File is too large (max ${MAX_CV_SIZE_BYTES / 1_048_576} MB)`,
    );
  }

  if (!isAllowedCvMime(mimeType)) {
    throw AppError.badRequest(
      'Only PDF or DOCX files are accepted',
    );
  }
}

/**
 * Strip anything that looks like a path segment, plus control chars,
 * and clamp to 255. The same s3Key generator appends a random UUID
 * prefix so collisions are not a concern — this is purely an
 * anti-path-traversal + display sanity filter.
 */
export function sanitizeFilename(raw: string): string {
  // Remove path separators (both flavours), control chars, and leading dots.
  // Collapse whitespace runs to a single space.
  const stripped = raw
    .replace(/[\\/]+/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '');
  const clamped = stripped.slice(0, 255);
  return clamped.length > 0 ? clamped : 'cv';
}

// --------------------------------------------------------------------
// Magic-byte sniffers
// --------------------------------------------------------------------

/** PDF: `%PDF-` (25 50 44 46 2D). */
export function sniffPdf(buf: Buffer): boolean {
  if (buf.length < 5) return false;
  return (
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46 &&
    buf[4] === 0x2d
  );
}

/**
 * DOCX is a ZIP — local file header starts with `PK\x03\x04`
 * (50 4B 03 04). See the TODO(phase3) at the top of this file: deep
 * verification requires walking the central directory looking for
 * `word/document.xml`; Phase 2 ships the first-4-bytes check only.
 */
export function sniffDocxFirstBytes(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  return (
    buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04
  );
}

/**
 * Dispatch to the right sniffer based on the declared MIME type.
 * Throws AppError.badRequest on mismatch — the caller (s3Service)
 * catches and turns this into a 400 with the message below.
 */
export function verifyMagicBytes(mimeType: string, firstBytes: Buffer): void {
  if (mimeType === 'application/pdf') {
    if (!sniffPdf(firstBytes)) {
      throw AppError.badRequest(
        'Uploaded file does not look like a PDF (magic bytes mismatch)',
      );
    }
    return;
  }
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    if (!sniffDocxFirstBytes(firstBytes)) {
      throw AppError.badRequest(
        'Uploaded file does not look like a DOCX (magic bytes mismatch)',
      );
    }
    return;
  }
  throw AppError.badRequest('Unsupported file type for magic-byte verification');
}

// --------------------------------------------------------------------
// Deep DOCX verification (Phase 3 carry-forward)
// --------------------------------------------------------------------

/**
 * Walk the ZIP central directory of a DOCX file and verify it contains
 * both `word/document.xml` and `[Content_Types].xml`. Rejects crafted
 * ZIPs that pass the first-4-bytes PK check but aren't real DOCX files.
 *
 * Uses yauzl which has built-in ZIP-bomb protection.
 *
 * @param fileBuffer - Complete file contents (up to 10 MB cap)
 * @throws AppError.badRequest if the file is not a valid DOCX
 */
export async function verifyDocxDeep(fileBuffer: Buffer): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    yauzl.fromBuffer(fileBuffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        return reject(
          AppError.badRequest('Uploaded file is not a valid ZIP/DOCX archive'),
        );
      }

      let hasDocumentXml = false;
      let hasContentTypes = false;

      zipfile.on('entry', (entry: yauzl.Entry) => {
        const name = entry.fileName;
        if (name === 'word/document.xml') hasDocumentXml = true;
        if (name === '[Content_Types].xml') hasContentTypes = true;

        if (hasDocumentXml && hasContentTypes) {
          zipfile.close();
          return resolve();
        }
        zipfile.readEntry();
      });

      zipfile.on('end', () => {
        if (!hasDocumentXml || !hasContentTypes) {
          return reject(
            AppError.badRequest(
              'Uploaded file is a ZIP but not a valid DOCX (missing word/document.xml or [Content_Types].xml)',
            ),
          );
        }
        resolve();
      });

      zipfile.on('error', () => {
        reject(AppError.badRequest('Failed to parse DOCX file'));
      });

      zipfile.readEntry();
    });
  });
}
