import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MAX_CV_SIZE_BYTES,
  MAX_CV_SIZE_LABEL,
  validateCvFileClientSide,
  type AllowedCvMime,
} from '@/lib/file-validation';
import { submissionApi } from '@/features/submission/api';
import { useCreateUploadIntent } from '@/features/submission/hooks';
import { extractErrorMessage } from '@/lib/error';

/**
 * CvUploadDropzone — Phase 2 Wave 2.
 *
 * Flow:
 *   1. User drags/selects a file.
 *   2. Client-side magic-byte + size validation (`validateCvFileClientSide`).
 *   3. POST /upload/cv-intent to get a pre-signed PUT URL.
 *   4. Raw axios PUT to the pre-signed URL with a progress callback.
 *   5. On success, call `onUploaded` with the metadata the parent
 *      needs to include in POST /submissions.
 */

export interface UploadedCvMeta {
  s3Key: string;
  filename: string;
  sizeBytes: number;
  mimeType: AllowedCvMime;
}

export interface CvUploadDropzoneProps {
  onUploaded: (meta: UploadedCvMeta) => void;
  disabled?: boolean;
}

export default function CvUploadDropzone({
  onUploaded,
  disabled,
}: CvUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedMeta, setUploadedMeta] = useState<UploadedCvMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const createIntent = useCreateUploadIntent();

  const reset = () => {
    setUploadedMeta(null);
    setUploading(false);
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploadedMeta(null);
    setProgress(0);

    const validation = await validateCvFileClientSide(file);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    try {
      // Step 1: intent. Use the sniffed MIME, not file.type.
      const intent = await createIntent.mutateAsync({
        filename: file.name,
        sizeBytes: file.size,
        mimeType: validation.detectedMime,
      });

      // Step 2: upload bytes directly to S3.
      await submissionApi.uploadToS3(
        intent.uploadUrl,
        file,
        validation.detectedMime,
        (loaded, total) => {
          const pct =
            total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          setProgress(pct);
        },
      );

      const meta: UploadedCvMeta = {
        s3Key: intent.s3Key,
        filename: file.name,
        sizeBytes: file.size,
        mimeType: validation.detectedMime,
      };
      setUploadedMeta(meta);
      onUploaded(meta);
    } catch (err) {
      setError(extractErrorMessage(err, 'Upload failed — please retry'));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) setDragActive(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const containerClass = [
    'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
    dragActive
      ? 'border-primary bg-primary/5'
      : 'border-muted-foreground/25 hover:border-muted-foreground/50',
    disabled || uploading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
  ].join(' ');

  // Uploaded state
  if (uploadedMeta && !uploading && !error) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {uploadedMeta.filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(uploadedMeta.sizeBytes)} — uploaded
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={reset}
            disabled={disabled}
          >
            Replace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={containerClass}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        aria-disabled={disabled || uploading}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={onSelect}
          disabled={disabled || uploading}
        />
        {uploading ? (
          <>
            <FileText
              className="h-8 w-8 text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm font-medium">Uploading… {progress}%</p>
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload
              className="h-8 w-8 text-muted-foreground"
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium">
                Drop a CV here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF or DOCX · up to {MAX_CV_SIZE_LABEL}
              </p>
            </div>
          </>
        )}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive"
            aria-hidden
          />
          <div className="flex-1">
            <p className="text-destructive">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-1 h-7 px-2"
              onClick={reset}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

// Re-export for clarity if anyone imports the constant alongside the component.
export { MAX_CV_SIZE_BYTES };
