/**
 * Client-side CV file validation — Phase 2 Wave 2.
 *
 * Mirrors `apps/api/src/lib/file-validation.ts` so the user gets an
 * immediate rejection without a round-trip for obviously bad files.
 * The server re-runs everything (and more — it ranged-GETs the
 * already-uploaded object) so this is purely a UX layer.
 *
 * Importantly, we detect the MIME by sniffing magic bytes rather than
 * trusting `file.type`, which is notoriously unreliable across
 * browsers (Firefox on Windows sometimes returns empty for `.docx`).
 */

export const MAX_CV_SIZE_BYTES = 10_485_760; // 10 MB — must stay in sync with server

export const ALLOWED_CV_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedCvMime = (typeof ALLOWED_CV_MIME)[number];

/** Human-readable max size label for toasts / tooltips. */
export const MAX_CV_SIZE_LABEL = `${MAX_CV_SIZE_BYTES / 1_048_576} MB`;

/**
 * Read the first 8 bytes of a File and return whichever of our two
 * supported formats it matches, or `null` on miss.
 *
 * PDF: 25 50 44 46 2D (`%PDF-`)
 * DOCX: 50 4B 03 04 (ZIP local file header — DOCX is a ZIP container)
 */
export async function sniffFile(file: File): Promise<'pdf' | 'docx' | null> {
  const slice = file.slice(0, 8);
  const buf = await slice.arrayBuffer();
  if (buf.byteLength < 4) return null;
  const view = new DataView(buf);
  const b0 = view.getUint8(0);
  const b1 = view.getUint8(1);
  const b2 = view.getUint8(2);
  const b3 = view.getUint8(3);

  // PDF needs 5 bytes.
  if (buf.byteLength >= 5) {
    const b4 = view.getUint8(4);
    if (
      b0 === 0x25 &&
      b1 === 0x50 &&
      b2 === 0x44 &&
      b3 === 0x46 &&
      b4 === 0x2d
    ) {
      return 'pdf';
    }
  }

  if (b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04) {
    return 'docx';
  }

  return null;
}

export type CvFileValidationResult =
  | { ok: true; detectedMime: AllowedCvMime }
  | { ok: false; error: string };

/**
 * Full client-side validation: size + magic bytes.
 *
 * The returned `detectedMime` is what should be sent to the server —
 * NOT `file.type`, because the browser can lie about it.
 */
export async function validateCvFileClientSide(
  file: File,
): Promise<CvFileValidationResult> {
  if (file.size <= 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (file.size > MAX_CV_SIZE_BYTES) {
    return {
      ok: false,
      error: `File is too large (max ${MAX_CV_SIZE_LABEL})`,
    };
  }

  const kind = await sniffFile(file);
  if (kind === null) {
    return {
      ok: false,
      error: 'Only PDF or DOCX files are accepted',
    };
  }

  const detectedMime: AllowedCvMime =
    kind === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  return { ok: true, detectedMime };
}
