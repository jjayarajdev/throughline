/**
 * Prisma 7 config
 *
 * In Prisma 7 the datasource `url` moved OUT of schema.prisma into this file.
 * This config is consumed by the Prisma CLI for `migrate`, `generate`, `db seed`, etc.
 *
 * At runtime, the application code (src/config/prisma.ts) uses the PrismaPg
 * driver adapter directly — this config file is CLI-only.
 */

import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

// Load the monorepo-root .env.development so DATABASE_URL is available here.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = resolve(__dirname, '../..');
const envFile = process.env['NODE_ENV'] === 'production' ? '.env.production' : '.env.development';
loadEnv({ path: resolve(monorepoRoot, envFile) });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
