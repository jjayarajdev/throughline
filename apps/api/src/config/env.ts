import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

// Resolve monorepo root .env.development (apps/api/src/config → ../../../..)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = resolve(__dirname, '../../../..');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

loadEnv({ path: resolve(monorepoRoot, envFile) });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // API port 4000 — 3000-3008 is reserved for another local app on this machine.
  API_PORT: z.coerce.number().int().positive().default(4000),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Encryption (AES-256-GCM requires 32-byte key = 44 chars base64)
  ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, {
      message: 'ENCRYPTION_KEY must be 32 bytes (base64-encoded)',
    }),

  // CORS — Vite dev server runs on 4001 (not the default 5173)
  CORS_ORIGIN: z.string().default('http://localhost:4001'),

  // Email
  //   console — log the link to stdout (Phase 1 default, still supported for CI/tests)
  //   smtp    — send via nodemailer to a local SMTP catcher (MailHog/Mailpit)
  //   ses     — Amazon SES (wired once the gigcruite.com domain is verified)
  EMAIL_PROVIDER: z.enum(['console', 'smtp', 'ses']).default('console'),
  EMAIL_FROM: z.string().default('GigCruite <noreply@gigcruite.local>'),

  // SMTP — only read when EMAIL_PROVIDER=smtp. The default host/port
  // point at the shared MailHog container used by the zephyrflow project
  // (http://localhost:8025 for the inbox UI, :1025 for SMTP). MailHog
  // accepts unauthenticated sends in its default config, so SMTP_USER /
  // SMTP_PASS are optional and only come into play when we swap in an
  // authenticated relay (Mailtrap, an internal MTA, etc.).
  SMTP_HOST: z.string().default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Bootstrap admin
  ADMIN_EMAIL: z.string().email().default('admin@gigcruite.com'),
  ADMIN_PASSWORD: z.string().min(12).default('Admin@GigCruite2026'),

  // AWS S3 — Phase 2 Wave 2 (CV uploads via pre-signed PUT).
  // All four core vars are required at boot; the IAM user `gigcruite-api`
  // is scoped to the dev bucket in .aws/Keys.txt (kept outside any repo).
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_ACCESS_KEY_ID: z.string().min(1),
  AWS_S3_SECRET_ACCESS_KEY: z.string().min(1),
  // 5-minute expiry on pre-signed PUT URLs. Short window shrinks the
  // replay surface; the client uploads immediately after receiving the
  // intent so even 60s would usually work.
  AWS_S3_PRESIGN_EXPIRY_SECONDS: z.coerce.number().int().positive().default(300),

  // Razorpay — Phase 3 (Checkout for company deposits, RazorpayX for recruiter payouts).
  // Optional at boot: when empty, Razorpay endpoints will return 503 "payment provider not configured".
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAYX_ACCOUNT_NUMBER: z.string().optional(),

  // AI — Phase 15 (Analytics AI) + Phase 16 (Matching AI).
  // Optional at boot: anomaly detection is rule-based (no LLM). Phase 16
  // JD extraction / resume matching requires a valid key.
  OPENAI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  // How often (hours) the anomaly detection sweep runs. 0 = disabled.
  AI_ANOMALY_INTERVAL_HOURS: z.coerce.number().int().min(0).default(6),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
export type Env = typeof env;

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
