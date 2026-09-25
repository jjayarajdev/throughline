import { Readable } from 'node:stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '../config/s3.js';
import { AppError } from '../lib/app-error.js';

/**
 * Document parser — Phase 16.
 *
 * Downloads a file from S3 by key, detects its format (PDF or DOCX),
 * and extracts plaintext content for LLM processing.
 */

// ── S3 download helper ──────────────────────────────────────

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

async function downloadFromS3(s3Key: string): Promise<Buffer> {
  try {
    const obj = await s3Client.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
    );
    if (!obj.Body) {
      throw new Error('Empty S3 object body');
    }
    return await streamToBuffer(obj.Body as Readable);
  } catch (err) {
    throw AppError.badRequest(
      `Failed to download file from storage: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ── PDF extraction ──────────────────────────────────────────

async function extractPdfText(buffer: Buffer): Promise<string> {
  const mod = await import('pdf-parse');
  const pdfParse = (mod as any).default ?? mod;
  const result = await pdfParse(buffer);
  return result.text?.trim() ?? '';
}

// ── DOCX extraction ─────────────────────────────────────────

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? '';
}

// ── Public API ──────────────────────────────────────────────

/**
 * Download a document from S3 and extract its plaintext content.
 * Supports PDF and DOCX formats.
 */
export async function extractText(s3Key: string, mimeType?: string): Promise<string> {
  const buffer = await downloadFromS3(s3Key);

  // Detect format from mime type or file extension
  const mime = mimeType?.toLowerCase() ?? '';
  const key = s3Key.toLowerCase();

  if (mime.includes('pdf') || key.endsWith('.pdf')) {
    return extractPdfText(buffer);
  }

  if (
    mime.includes('wordprocessingml') ||
    mime.includes('docx') ||
    key.endsWith('.docx')
  ) {
    return extractDocxText(buffer);
  }

  throw AppError.badRequest(
    `Unsupported document format. Expected PDF or DOCX, got: ${mimeType ?? 'unknown'}`,
  );
}

/**
 * Download a document from S3 and return the raw buffer.
 * Used when you need both the buffer and the text (avoids double download).
 */
export async function downloadDocument(s3Key: string): Promise<Buffer> {
  return downloadFromS3(s3Key);
}

/**
 * Extract text from a buffer directly (when you already have the bytes).
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  const mime = mimeType.toLowerCase();

  if (mime.includes('pdf')) {
    return extractPdfText(buffer);
  }

  if (mime.includes('wordprocessingml') || mime.includes('docx')) {
    return extractDocxText(buffer);
  }

  throw AppError.badRequest(
    `Unsupported document format: ${mimeType}`,
  );
}
