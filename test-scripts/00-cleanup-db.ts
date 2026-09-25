/**
 * 00-cleanup-db.ts — Delete all data except admin user + platform settings.
 *
 * Run:  cd platform && npx tsx test-scripts/00-cleanup-db.ts
 *
 * Uses PrismaPg driver adapter (Prisma 7).
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = resolve(__dirname, '..');
loadEnv({ path: resolve(monorepoRoot, '.env.development') });

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set — check .env.development');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('━━━ GigCruite DB Cleanup ━━━');

  // Delete in FK-safe order (children first)

  console.log('-> Deleting submission status events...');
  const e1 = await prisma.submissionStatusEvent.deleteMany({});
  console.log(`   ${e1.count} events deleted`);

  console.log('-> Deleting earnings...');
  const e2 = await prisma.earning.deleteMany({});
  console.log(`   ${e2.count} earnings deleted`);

  console.log('-> Deleting submissions...');
  const e3 = await prisma.submission.deleteMany({});
  console.log(`   ${e3.count} submissions deleted`);

  console.log('-> Deleting wallet transactions...');
  const e4 = await prisma.walletTransaction.deleteMany({});
  console.log(`   ${e4.count} wallet transactions deleted`);

  console.log('-> Deleting payout requests...');
  const e5 = await prisma.payoutRequest.deleteMany({});
  console.log(`   ${e5.count} payout requests deleted`);

  console.log('-> Deleting payout batches...');
  const e6 = await prisma.payoutBatch.deleteMany({});
  console.log(`   ${e6.count} payout batches deleted`);

  console.log('-> Deleting company wallets...');
  const e7 = await prisma.companyWallet.deleteMany({});
  console.log(`   ${e7.count} company wallets deleted`);

  console.log('-> Deleting roles...');
  const e8 = await prisma.role.deleteMany({});
  console.log(`   ${e8.count} roles deleted`);

  console.log('-> Deleting recruiter profiles...');
  const e9 = await prisma.recruiterProfile.deleteMany({});
  console.log(`   ${e9.count} recruiter profiles deleted`);

  console.log('-> Deleting company profiles...');
  const e10 = await prisma.companyProfile.deleteMany({});
  console.log(`   ${e10.count} company profiles deleted`);

  console.log('-> Deleting audit logs...');
  const e11 = await prisma.auditLog.deleteMany({});
  console.log(`   ${e11.count} audit logs deleted`);

  console.log('-> Deleting non-admin users...');
  const e12 = await prisma.user.deleteMany({
    where: { role: { not: 'admin' } },
  });
  console.log(`   ${e12.count} users deleted`);

  // Clear state file
  const { existsSync, unlinkSync } = await import('node:fs');
  const stateFile = resolve(__dirname, '.state', 'state.env');
  if (existsSync(stateFile)) {
    unlinkSync(stateFile);
    console.log('-> Cleared .state/state.env');
  }

  console.log('━━━ Cleanup complete ━━━');
}

main()
  .catch((err) => {
    console.error('[cleanup] fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
