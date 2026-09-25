import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  MAX_CV_SIZE_LABEL,
  validateCvFileClientSide,
  type AllowedCvMime,
} from '@/lib/file-validation';
import { useCreateJdUploadIntent } from '@/features/role/hooks';
import { extractErrorMessage } from '@/lib/error';

export interface UploadedJdMeta {
  s3Key: string;
  filename: string;
  sizeBytes: number;
  mimeType: AllowedCvMime;
}

export interface JdUploadDropzoneProps {
  onUploaded: (meta: UploadedJdMeta) => void;
  existingFilename?: string | null;
  disabled?: boolean;
}

export default function JdUploadDropzone({
  onUploaded,
  existingFilename,
  disabled,
}: JdUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedMeta, setUploadedMeta] = useState<UploadedJdMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [cleared, setCleared] = useState(false);
  const createIntent = useCreateJdUploadIntent();

  const reset = () => {
    setUploadedMeta(null);
    setCleared(true);
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
      const intent = await createIntent.mutateAsync({
        filename: file.name,
        sizeBytes: file.size,
        mimeType: validation.detectedMime,
      });

      await axios.put(intent.uploadUrl, file, {
        headers: { 'Content-Type': validation.detectedMime },
        withCredentials: false,
        onUploadProgress: (e) => {
          const total = typeof e.total === 'number' && e.total > 0 ? e.total : file.size;
          setProgress(Math.min(100, Math.round((e.loaded / total) * 100)));
        },
      });

      const meta: UploadedJdMeta = {
        s3Key: intent.s3Key,
        filename: file.name,
        sizeBytes: file.size,
        mimeType: validation.detectedMime,
      };
      setUploadedMeta(meta);
      setCleared(false);
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

  const displayName = cleared ? null : (uploadedMeta?.filename ?? existingFilename);

  if (displayName && !uploading && !error) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {uploadedMeta
                ? `${formatSize(uploadedMeta.sizeBytes)} — uploaded`
                : 'Previously uploaded'}
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

  const containerClass = [
    'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
    dragActive
      ? 'border-primary bg-primary/5'
      : 'border-muted-foreground/25 hover:border-muted-foreground/50',
    disabled || uploading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
  ].join(' ');

  return (
    <div className="space-y-2">
      <div
        className={containerClass}
        onDrop={onDrop}
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragActive(true);
        }}
        onDragLeave={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragActive(false);
        }}
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
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          disabled={disabled || uploading}
        />
        {uploading ? (
          <>
            <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
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
            <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">
                Drop a JD here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF or DOCX · up to {MAX_CV_SIZE_LABEL} · optional
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
