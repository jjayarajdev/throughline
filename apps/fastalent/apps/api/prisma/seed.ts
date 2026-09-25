/**
 * Prisma seed — Phase 1 + Phase 3 + Phase 11 + Demo
 *
 * 1. Applies CHECK constraints that Prisma schema DSL cannot express.
 * 2. Ensures bootstrap admin user (admin@gigcruite.com) exists.
 * 3. Seeds PlatformSetting defaults.
 * 4. Creates CompanyWallet for any existing company that lacks one.
 * 5. Seeds CountryConfig entries (IN, US, GB).
 * 6. (optional) --clean flag: wipes transactional data, keeps users/profiles.
 * 7. (optional) --demo flag: implies --clean, then creates realistic multi-country demo data.
 *
 * Idempotent: safe to run repeatedly.
 *
 * Run: pnpm --filter @gigcruite/api prisma:seed
 *  or: cd apps/api && npm run prisma:seed
 *  or: cd apps/api && npm run prisma:seed -- --clean
 *  or: cd apps/api && npm run prisma:seed -- --demo
 */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  CompanySize,
  RoleType,
  RoleStatus,
  PayoutType,
  PayoutMode,
  RoleVisibility,
  SubmissionStatus,
  EarningType,
  EarningStatus,
  TransactionType,
  FeatureFlagScope,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load monorepo root .env.development
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = resolve(__dirname, '../../..');
loadEnv({ path: resolve(monorepoRoot, '.env.development') });

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set — check .env.development');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@gigcruite.com';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'Admin@GigCruite2026';
const BCRYPT_ROUNDS = 12;

const isDemo = process.argv.includes('--demo');
const isClean = isDemo || process.argv.includes('--clean');

const DEMO_PASSWORD = 'DemoPass@2026!';

// ─── Helpers ────────────────────────────────────────────────────────────────

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Core seed functions ────────────────────────────────────────────────────

async function applyCheckConstraints(): Promise<void> {
  console.log('→ applying CHECK constraints...');

  await prisma.$executeRawUnsafe(
    `ALTER TABLE recruiter_profiles DROP CONSTRAINT IF EXISTS wallet_balance_non_negative`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE recruiter_profiles ADD CONSTRAINT wallet_balance_non_negative CHECK (wallet_balance >= 0)`,
  );

  await prisma.$executeRawUnsafe(
    `ALTER TABLE recruiter_profiles DROP CONSTRAINT IF EXISTS locked_balance_non_negative`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE recruiter_profiles ADD CONSTRAINT locked_balance_non_negative CHECK (locked_balance >= 0)`,
  );

  await prisma.$executeRawUnsafe(
    `ALTER TABLE recruiter_profiles DROP CONSTRAINT IF EXISTS locked_balance_le_wallet`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE recruiter_profiles ADD CONSTRAINT locked_balance_le_wallet CHECK (locked_balance <= wallet_balance)`,
  );

  await prisma.$executeRawUnsafe(
    `ALTER TABLE company_wallets DROP CONSTRAINT IF EXISTS cw_balance_non_negative`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE company_wallets ADD CONSTRAINT cw_balance_non_negative CHECK (balance >= 0)`,
  );

  await prisma.$executeRawUnsafe(
    `ALTER TABLE company_wallets DROP CONSTRAINT IF EXISTS cw_locked_balance_non_negative`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE company_wallets ADD CONSTRAINT cw_locked_balance_non_negative CHECK (locked_balance >= 0)`,
  );

  await prisma.$executeRawUnsafe(
    `ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wt_exactly_one_owner`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE wallet_transactions ADD CONSTRAINT wt_exactly_one_owner CHECK (
      (company_wallet_id IS NOT NULL AND recruiter_profile_id IS NULL) OR
      (company_wallet_id IS NULL AND recruiter_profile_id IS NOT NULL)
    )`,
  );

  console.log('  ✅ CHECK constraints applied');
}

async function cleanDatabase(): Promise<void> {
  console.log('→ cleaning transactional data (--clean flag)...');

  await prisma.$executeRawUnsafe(
    `ALTER TABLE recruiter_profiles DROP CONSTRAINT IF EXISTS locked_balance_le_wallet`,
  );

  const tables = [
    'wallet_transactions',
    'earnings',
    'payout_batches',
    'payout_requests',
    'submission_status_events',
    'submissions',
    'role_invitations',
    'role_status_history',
    'roles',
    'notifications',
    'audit_logs',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    console.log(`  🗑️  truncated ${table}`);
  }

  await prisma.$executeRawUnsafe(
    `UPDATE company_wallets SET balance = 0, locked_balance = 0`,
  );
  console.log('  🗑️  zeroed company_wallets balances');

  await prisma.$executeRawUnsafe(
    `UPDATE recruiter_profiles SET wallet_balance = 0, locked_balance = 0`,
  );
  console.log('  🗑️  zeroed recruiter_profiles balances');

  console.log('  ✅ database cleaned');
}

/** Full wipe for --demo: also removes non-admin users + profiles + wallets. */
async function cleanDatabaseFull(): Promise<void> {
  await cleanDatabase();
  console.log('→ removing non-admin users for demo rebuild...');

  // Delete company wallets, then company profiles, then recruiter profiles, then non-admin users
  await prisma.$executeRawUnsafe(
    `DELETE FROM company_wallets WHERE company_id IN (
      SELECT id FROM company_profiles WHERE user_id IN (
        SELECT id FROM users WHERE role != 'admin'
      )
    )`,
  );
  await prisma.$executeRawUnsafe(
    `DELETE FROM company_profiles WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')`,
  );
  await prisma.$executeRawUnsafe(
    `DELETE FROM recruiter_profiles WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')`,
  );
  await prisma.$executeRawUnsafe(
    `DELETE FROM users WHERE role != 'admin'`,
  );
  console.log('  ✅ non-admin users removed');
}

async function seedAdmin(): Promise<void> {
  console.log(`→ seeding bootstrap admin (${ADMIN_EMAIL})...`);

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log('  ℹ️  admin already exists — skipping');
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.admin,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`  ✅ admin created`);
  console.log(`     email:    ${ADMIN_EMAIL}`);
  console.log(`     password: ${ADMIN_PASSWORD}  (CHANGE ON FIRST LOGIN)`);
}

async function seedPlatformSettings(): Promise<void> {
  console.log('→ seeding platform settings...');

  const defaults: Array<{
    key: string;
    value: string;
    description: string;
    category: string;
  }> = [
    {
      key: 'min_withdrawal_amount',
      value: '1000',
      description: 'Minimum payout request amount in INR',
      category: 'payouts',
    },
    {
      key: 'default_commission_pct',
      value: '20',
      description: 'Default platform commission percentage (recruiter gets 100 - this)',
      category: 'payouts',
    },
    {
      key: 'payout_batch_time',
      value: '18:00',
      description: 'Daily payout batch run time in IST (HH:MM)',
      category: 'payouts',
    },
    {
      key: 'payout_enabled',
      value: 'true',
      description: 'Master toggle for payout processing',
      category: 'payouts',
    },
    {
      key: 'razorpay_enabled',
      value: 'false',
      description: 'Enable Razorpay payment processing (set true when API keys are live)',
      category: 'payments',
    },
  ];

  for (const setting of defaults) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`  ✅ ${defaults.length} platform settings seeded`);
}

async function seedCompanyWallets(): Promise<void> {
  console.log('→ ensuring company wallets exist...');

  const companiesWithoutWallet = await prisma.companyProfile.findMany({
    where: { wallet: null },
    select: { id: true },
  });

  for (const company of companiesWithoutWallet) {
    await prisma.companyWallet.create({
      data: { companyId: company.id },
    });
  }

  console.log(`  ✅ ${companiesWithoutWallet.length} company wallet(s) created`);
}

async function seedCountryConfigs(): Promise<void> {
  console.log('→ seeding country configs...');

  const countries = [
    {
      countryCode: 'IN',
      countryName: 'India',
      currencyCode: 'INR',
      currencySymbol: '₹',
      shortlistFlatMin: 2000,
      shortlistFlatMax: 50000,
      shortlistPctMin: 0.5,
      shortlistPctMax: 2,
      hireFlatMin: 25000,
      hireFlatMax: 2000000,
      hirePctMin: 8,
      hirePctMax: 12,
      vendorBenchmarkPct: 8.33,
    },
    {
      countryCode: 'US',
      countryName: 'United States',
      currencyCode: 'USD',
      currencySymbol: '$',
      shortlistFlatMin: 100,
      shortlistFlatMax: 5000,
      shortlistPctMin: 0.5,
      shortlistPctMax: 2,
      hireFlatMin: 2000,
      hireFlatMax: 250000,
      hirePctMin: 8,
      hirePctMax: 12,
      vendorBenchmarkPct: 20,
    },
    {
      countryCode: 'GB',
      countryName: 'United Kingdom',
      currencyCode: 'GBP',
      currencySymbol: '£',
      shortlistFlatMin: 100,
      shortlistFlatMax: 4000,
      shortlistPctMin: 0.5,
      shortlistPctMax: 2,
      hireFlatMin: 1500,
      hireFlatMax: 200000,
      hirePctMin: 8,
      hirePctMax: 12,
      vendorBenchmarkPct: 15,
    },
  ];

  for (const c of countries) {
    await prisma.countryConfig.upsert({
      where: { countryCode: c.countryCode },
      update: {
        countryName: c.countryName,
        currencyCode: c.currencyCode,
        currencySymbol: c.currencySymbol,
        shortlistFlatMin: c.shortlistFlatMin,
        shortlistFlatMax: c.shortlistFlatMax,
        shortlistPctMin: c.shortlistPctMin,
        shortlistPctMax: c.shortlistPctMax,
        hireFlatMin: c.hireFlatMin,
        hireFlatMax: c.hireFlatMax,
        hirePctMin: c.hirePctMin,
        hirePctMax: c.hirePctMax,
        vendorBenchmarkPct: c.vendorBenchmarkPct,
      },
      create: c,
    });
  }

  console.log(`  ✅ ${countries.length} country configs seeded`);
}

async function seedFeatureFlags(): Promise<void> {
  console.log('→ seeding feature flags (global defaults)...');

  const GLOBAL_SCOPE_ID = '00000000-0000-0000-0000-000000000000';
  const flags = ['analytics_dashboards', 'analytics_ai', 'matching_ai'];

  for (const key of flags) {
    await prisma.featureFlag.upsert({
      where: {
        key_scope_scopeId: { key, scope: FeatureFlagScope.GLOBAL, scopeId: GLOBAL_SCOPE_ID },
      },
      update: {},
      create: { key, enabled: false, scope: FeatureFlagScope.GLOBAL, scopeId: GLOBAL_SCOPE_ID },
    });
  }

  console.log(`  ✅ ${flags.length} global feature flags seeded (all disabled)`);
}

// ─── Demo data ──────────────────────────────────────────────────────────────

async function seedDemoData(): Promise<void> {
  console.log('→ seeding demo data...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  // ── 3 Companies ──

  const tvUser = await prisma.user.create({
    data: {
      email: 'hire@techvista.in',
      passwordHash,
      role: UserRole.company,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: daysAgo(60),
    },
  });
  const tvProfile = await prisma.companyProfile.create({
    data: {
      userId: tvUser.id,
      companyName: 'TechVista Solutions',
      industry: 'Enterprise SaaS',
      companySize: CompanySize.SIZE_51_200,
      website: 'https://techvista.in',
      description: 'Building next-gen HR automation for mid-market enterprises across India.',
      foundedYear: 2018,
      headquarters: 'Bengaluru, India',
      contactPerson: 'Priya Sharma',
      contactPhone: '+919876543210',
      country: 'IN',
      currency: 'INR',
    },
  });
  const tvWallet = await prisma.companyWallet.create({
    data: { companyId: tvProfile.id, balance: 5000000 },
  });

  const cbUser = await prisma.user.create({
    data: {
      email: 'talent@cloudbridge.io',
      passwordHash,
      role: UserRole.company,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: daysAgo(45),
    },
  });
  const cbProfile = await prisma.companyProfile.create({
    data: {
      userId: cbUser.id,
      companyName: 'CloudBridge Inc',
      industry: 'Cloud Infrastructure',
      companySize: CompanySize.SIZE_201_500,
      website: 'https://cloudbridge.io',
      description: 'Multi-cloud orchestration platform used by Fortune 500.',
      foundedYear: 2015,
      headquarters: 'San Francisco, CA',
      contactPerson: 'Mike Chen',
      contactPhone: '+14155551234',
      country: 'US',
      currency: 'USD',
    },
  });
  const cbWallet = await prisma.companyWallet.create({
    data: { companyId: cbProfile.id, balance: 15000 },
  });

  const nhUser = await prisma.user.create({
    data: {
      email: 'ops@nexahire.co.uk',
      passwordHash,
      role: UserRole.company,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: daysAgo(30),
    },
  });
  const nhProfile = await prisma.companyProfile.create({
    data: {
      userId: nhUser.id,
      companyName: 'NexaHire Ltd',
      industry: 'Fintech',
      companySize: CompanySize.SIZE_11_50,
      website: 'https://nexahire.co.uk',
      description: 'Open banking APIs for UK challenger banks and neobanks.',
      foundedYear: 2020,
      headquarters: 'London, UK',
      contactPerson: 'Sarah Williams',
      contactPhone: '+447911123456',
      country: 'GB',
      currency: 'GBP',
    },
  });
  const nhWallet = await prisma.companyWallet.create({
    data: { companyId: nhProfile.id, balance: 8000 },
  });

  console.log('  ✅ 3 companies created');

  // ── 4 Recruiters ──

  const rAnita = await prisma.user.create({
    data: {
      email: 'anita.kapoor@fastmail.com',
      passwordHash,
      role: UserRole.recruiter,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: daysAgo(50),
    },
  });
  const rpAnita = await prisma.recruiterProfile.create({
    data: {
      userId: rAnita.id,
      fullName: 'Anita Kapoor',
      phone: '+919988776655',
      bio: 'Ex-Infosys talent lead, 8 years sourcing senior engineers across India.',
      yearsOfExperience: 8,
      specializations: ['Backend', 'DevOps', 'React'],
      linkedinUrl: 'https://linkedin.com/in/anitakapoor',
      country: 'IN',
      currency: 'INR',
      walletBalance: 125000,
    },
  });

  const rRaj = await prisma.user.create({
    data: {
      email: 'raj.mehta@outlook.com',
      passwordHash,
      role: UserRole.recruiter,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: daysAgo(40),
    },
  });
  const rpRaj = await prisma.recruiterProfile.create({
    data: {
      userId: rRaj.id,
      fullName: 'Raj Mehta',
      phone: '+919112233445',
      bio: 'Specialist in headhunting C-level and VP-level engineering talent.',
      yearsOfExperience: 12,
      specializations: ['CTO', 'VP Engineering', 'Architecture'],
      linkedinUrl: 'https://linkedin.com/in/rajmehta',
      country: 'IN',
      currency: 'INR',
      walletBalance: 350000,
    },
  });

  const rEmily = await prisma.user.create({
    data: {
      email: 'emily.johnson@gmail.com',
      passwordHash,
      role: UserRole.recruiter,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: daysAgo(35),
    },
  });
  const rpEmily = await prisma.recruiterProfile.create({
    data: {
      userId: rEmily.id,
      fullName: 'Emily Johnson',
      phone: '+14155559876',
      bio: 'Tech recruiter based in SF. Former Google recruiting coordinator.',
      yearsOfExperience: 6,
      specializations: ['Full-stack', 'ML/AI', 'Product'],
      linkedinUrl: 'https://linkedin.com/in/emilyjohnson',
      country: 'US',
      currency: 'USD',
      walletBalance: 4200,
    },
  });

  const rJames = await prisma.user.create({
    data: {
      email: 'james.walker@proton.me',
      passwordHash,
      role: UserRole.recruiter,
      status: UserStatus.active,
      emailVerified: true,
      emailVerifiedAt: daysAgo(25),
    },
  });
  const rpJames = await prisma.recruiterProfile.create({
    data: {
      userId: rJames.id,
      fullName: 'James Walker',
      phone: '+447700900123',
      bio: 'London fintech recruiter, 5 years placing quant and payments engineers.',
      yearsOfExperience: 5,
      specializations: ['Payments', 'Quant', 'Node.js'],
      linkedinUrl: 'https://linkedin.com/in/jameswalker',
      country: 'GB',
      currency: 'GBP',
      walletBalance: 3500,
    },
  });

  console.log('  ✅ 4 recruiters created');

  // ── 6 Roles ──

  // TechVista roles (IN/INR)
  const tvRole1 = await prisma.role.create({
    data: {
      companyId: tvProfile.id,
      title: 'Senior Backend Engineer',
      description: 'Design and implement microservices for our HR automation platform. Strong Node.js/TypeScript and PostgreSQL experience required. Must be comfortable with event-driven architectures.',
      roleType: RoleType.regular,
      status: RoleStatus.published,
      visibility: RoleVisibility.open,
      country: 'IN',
      currency: 'INR',
      location: 'Bengaluru',
      isRemote: true,
      employmentType: 'full_time',
      experienceMin: 5,
      experienceMax: 10,
      skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker'],
      ctcMin: 2500000,
      ctcMax: 4000000,
      payoutType: PayoutType.hybrid,
      shortlistPayoutMode: PayoutMode.flat,
      shortlistPayoutValue: 5000,
      hirePayoutMode: PayoutMode.flat,
      hirePayoutValue: 100000,
      platformCommissionPct: 15,
      vendorBenchmarkPct: 8.33,
      maxSubmissions: 20,
      createdAt: daysAgo(30),
    },
  });

  const tvRole2 = await prisma.role.create({
    data: {
      companyId: tvProfile.id,
      title: 'React Frontend Lead',
      description: 'Lead the frontend team building our next-gen dashboard. Deep React 18, design system, and performance optimization experience needed.',
      roleType: RoleType.regular,
      status: RoleStatus.published,
      visibility: RoleVisibility.open,
      country: 'IN',
      currency: 'INR',
      location: 'Bengaluru',
      isRemote: false,
      employmentType: 'full_time',
      experienceMin: 6,
      experienceMax: 12,
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Testing'],
      ctcMin: 3000000,
      ctcMax: 5000000,
      payoutType: PayoutType.per_hire,
      hirePayoutMode: PayoutMode.percentage,
      hirePayoutValue: 8.5,
      platformCommissionPct: 12,
      vendorBenchmarkPct: 8.33,
      maxSubmissions: 15,
      createdAt: daysAgo(20),
    },
  });

  // CloudBridge roles (US/USD)
  const cbRole1 = await prisma.role.create({
    data: {
      companyId: cbProfile.id,
      title: 'Staff Platform Engineer',
      description: 'Architect and build our multi-cloud orchestration layer. Requires deep AWS/GCP/Azure experience and strong Golang skills.',
      roleType: RoleType.headhunting,
      status: RoleStatus.published,
      visibility: RoleVisibility.open,
      country: 'US',
      currency: 'USD',
      location: 'San Francisco, CA',
      isRemote: true,
      employmentType: 'full_time',
      experienceMin: 8,
      experienceMax: 15,
      skills: ['Go', 'Kubernetes', 'AWS', 'GCP', 'Terraform'],
      ctcMin: 200000,
      ctcMax: 350000,
      payoutType: PayoutType.per_hire,
      hirePayoutMode: PayoutMode.percentage,
      hirePayoutValue: 10,
      platformCommissionPct: 18,
      vendorBenchmarkPct: 20,
      maxSubmissions: 10,
      createdAt: daysAgo(15),
    },
  });

  const cbRole2 = await prisma.role.create({
    data: {
      companyId: cbProfile.id,
      title: 'ML Engineer',
      description: 'Build ML-powered capacity planning and anomaly detection for cloud workloads. PyTorch/TensorFlow experience required.',
      roleType: RoleType.regular,
      status: RoleStatus.published,
      visibility: RoleVisibility.open,
      country: 'US',
      currency: 'USD',
      location: 'Remote (US)',
      isRemote: true,
      employmentType: 'full_time',
      experienceMin: 3,
      experienceMax: 8,
      skills: ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'AWS SageMaker'],
      ctcMin: 150000,
      ctcMax: 250000,
      payoutType: PayoutType.hybrid,
      shortlistPayoutMode: PayoutMode.flat,
      shortlistPayoutValue: 500,
      hirePayoutMode: PayoutMode.flat,
      hirePayoutValue: 15000,
      platformCommissionPct: 15,
      vendorBenchmarkPct: 20,
      maxSubmissions: 20,
      createdAt: daysAgo(10),
    },
  });

  // NexaHire roles (GB/GBP)
  const nhRole1 = await prisma.role.create({
    data: {
      companyId: nhProfile.id,
      title: 'Payments Engineer',
      description: 'Build PSD2-compliant payment processing with open banking APIs. Must understand UK/EU payment regulations.',
      roleType: RoleType.regular,
      status: RoleStatus.published,
      visibility: RoleVisibility.open,
      country: 'GB',
      currency: 'GBP',
      location: 'London',
      isRemote: false,
      employmentType: 'full_time',
      experienceMin: 4,
      experienceMax: 8,
      skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Open Banking', 'PSD2'],
      ctcMin: 65000,
      ctcMax: 95000,
      payoutType: PayoutType.per_hire,
      hirePayoutMode: PayoutMode.flat,
      hirePayoutValue: 8000,
      platformCommissionPct: 15,
      vendorBenchmarkPct: 15,
      maxSubmissions: 15,
      createdAt: daysAgo(12),
    },
  });

  const nhRole2 = await prisma.role.create({
    data: {
      companyId: nhProfile.id,
      title: 'VP Engineering',
      description: 'Lead engineering for a fast-growing fintech. Must have scaled teams from 10 to 50+ engineers. Open banking experience strongly preferred.',
      roleType: RoleType.headhunting,
      status: RoleStatus.published,
      visibility: RoleVisibility.open,
      country: 'GB',
      currency: 'GBP',
      location: 'London',
      isRemote: false,
      employmentType: 'full_time',
      experienceMin: 12,
      experienceMax: 20,
      skills: ['Leadership', 'Fintech', 'Architecture', 'Scaling'],
      ctcMin: 130000,
      ctcMax: 200000,
      payoutType: PayoutType.per_hire,
      hirePayoutMode: PayoutMode.percentage,
      hirePayoutValue: 12,
      platformCommissionPct: 20,
      vendorBenchmarkPct: 15,
      maxSubmissions: 8,
      createdAt: daysAgo(8),
    },
  });

  console.log('  ✅ 6 roles created');

  // ── Submissions ──

  const DUMMY_CV_KEY = 'demo/dummy-cv.pdf';

  // Upload a minimal valid PDF to S3 so demo CV downloads don't 404
  const s3Bucket = process.env['S3_BUCKET'];
  if (s3Bucket) {
    const s3 = new S3Client({ region: process.env['AWS_REGION'] ?? 'ap-south-1' });
    try {
      await s3.send(new HeadObjectCommand({ Bucket: s3Bucket, Key: DUMMY_CV_KEY }));
      console.log('  ✅ demo CV already exists in S3');
    } catch {
      const pdf = Buffer.from(
        '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
        '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
        'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n' +
        'trailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF',
      );
      await s3.send(new PutObjectCommand({
        Bucket: s3Bucket,
        Key: DUMMY_CV_KEY,
        Body: pdf,
        ContentType: 'application/pdf',
      }));
      console.log('  ✅ uploaded demo CV to S3');
    }
  } else {
    console.log('  ⚠️  S3_BUCKET not set — skipping demo CV upload');
  }

  interface SubSpec {
    roleId: string;
    recruiterId: string;
    name: string;
    email: string;
    phone: string;
    expectedCtc: number;
    notice: number;
    location: string;
    company: string;
    status: SubmissionStatus;
    acceptedCtc?: number;
    finalPayout?: number;
    daysAgo: number;
  }

  const subs: SubSpec[] = [
    // TechVista: Senior Backend — 4 subs (Anita + Raj)
    { roleId: tvRole1.id, recruiterId: rpAnita.id, name: 'Vikram Patel', email: 'vikram@mail.com', phone: '+919000000001', expectedCtc: 3200000, notice: 30, location: 'Bengaluru', company: 'Wipro', status: SubmissionStatus.joined, acceptedCtc: 3000000, finalPayout: 100000, daysAgo: 28 },
    { roleId: tvRole1.id, recruiterId: rpAnita.id, name: 'Sneha Reddy', email: 'sneha@mail.com', phone: '+919000000002', expectedCtc: 2800000, notice: 60, location: 'Hyderabad', company: 'TCS', status: SubmissionStatus.shortlisted, daysAgo: 25 },
    { roleId: tvRole1.id, recruiterId: rpRaj.id, name: 'Arjun Desai', email: 'arjun@mail.com', phone: '+919000000003', expectedCtc: 3500000, notice: 45, location: 'Pune', company: 'Infosys', status: SubmissionStatus.hired, acceptedCtc: 3400000, finalPayout: 100000, daysAgo: 20 },
    { roleId: tvRole1.id, recruiterId: rpRaj.id, name: 'Meera Iyer', email: 'meera@mail.com', phone: '+919000000004', expectedCtc: 2600000, notice: 30, location: 'Chennai', company: 'Zoho', status: SubmissionStatus.rejected, daysAgo: 22 },

    // TechVista: React Lead — 2 subs (Anita)
    { roleId: tvRole2.id, recruiterId: rpAnita.id, name: 'Rohan Gupta', email: 'rohan@mail.com', phone: '+919000000005', expectedCtc: 4200000, notice: 30, location: 'Bengaluru', company: 'Flipkart', status: SubmissionStatus.interview, daysAgo: 15 },
    { roleId: tvRole2.id, recruiterId: rpAnita.id, name: 'Kavitha Nair', email: 'kavitha@mail.com', phone: '+919000000006', expectedCtc: 3500000, notice: 60, location: 'Mumbai', company: 'Razorpay', status: SubmissionStatus.submitted, daysAgo: 12 },

    // CloudBridge: Staff Platform — 2 subs (Emily)
    { roleId: cbRole1.id, recruiterId: rpEmily.id, name: 'David Kim', email: 'david@mail.com', phone: '+14155550001', expectedCtc: 280000, notice: 14, location: 'Seattle', company: 'AWS', status: SubmissionStatus.hired, acceptedCtc: 300000, finalPayout: 30000, daysAgo: 10 },
    { roleId: cbRole1.id, recruiterId: rpEmily.id, name: 'Sarah Park', email: 'sarah@mail.com', phone: '+14155550002', expectedCtc: 320000, notice: 21, location: 'San Jose', company: 'Google', status: SubmissionStatus.shortlisted, daysAgo: 8 },

    // CloudBridge: ML Engineer — 2 subs (Emily)
    { roleId: cbRole2.id, recruiterId: rpEmily.id, name: 'Alex Rivera', email: 'alex@mail.com', phone: '+14155550003', expectedCtc: 200000, notice: 14, location: 'Austin', company: 'Meta', status: SubmissionStatus.joined, acceptedCtc: 210000, finalPayout: 15000, daysAgo: 7 },
    { roleId: cbRole2.id, recruiterId: rpEmily.id, name: 'Priya Sundar', email: 'priya.s@mail.com', phone: '+14155550004', expectedCtc: 180000, notice: 30, location: 'Remote', company: 'Startup', status: SubmissionStatus.submitted, daysAgo: 5 },

    // NexaHire: Payments — 2 subs (James)
    { roleId: nhRole1.id, recruiterId: rpJames.id, name: 'Oliver Brown', email: 'oliver@mail.com', phone: '+447700000001', expectedCtc: 85000, notice: 30, location: 'London', company: 'Monzo', status: SubmissionStatus.hired, acceptedCtc: 80000, finalPayout: 8000, daysAgo: 9 },
    { roleId: nhRole1.id, recruiterId: rpJames.id, name: 'Emma Davies', email: 'emma@mail.com', phone: '+447700000002', expectedCtc: 75000, notice: 60, location: 'Manchester', company: 'Revolut', status: SubmissionStatus.interview, daysAgo: 6 },

    // NexaHire: VP Eng — 1 sub (Raj — headhunting cross-border)
    { roleId: nhRole2.id, recruiterId: rpRaj.id, name: 'Michael Thompson', email: 'michael@mail.com', phone: '+447700000003', expectedCtc: 170000, notice: 90, location: 'London', company: 'Stripe', status: SubmissionStatus.shortlisted, daysAgo: 5 },
  ];

  const createdSubs: { id: string; spec: SubSpec }[] = [];

  for (const s of subs) {
    const sub = await prisma.submission.create({
      data: {
        roleId: s.roleId,
        recruiterId: s.recruiterId,
        candidateName: s.name,
        candidateEmail: s.email,
        candidatePhone: s.phone,
        candidateFingerprint: sha256(`${s.email}|${s.phone}`),
        cvS3Key: DUMMY_CV_KEY,
        cvOriginalFilename: `${s.name.replace(/ /g, '_')}_CV.pdf`,
        cvSizeBytes: 128000 + Math.floor(Math.random() * 200000),
        cvMimeType: 'application/pdf',
        expectedCtc: s.expectedCtc,
        noticePeriodDays: s.notice,
        currentLocation: s.location,
        currentCompany: s.company,
        status: s.status,
        ...(s.acceptedCtc ? { acceptedCtc: s.acceptedCtc } : {}),
        ...(s.finalPayout ? { finalPayout: s.finalPayout } : {}),
        createdAt: daysAgo(s.daysAgo),
      },
    });
    createdSubs.push({ id: sub.id, spec: s });

    // Create status events for each submission's lifecycle
    const lifecycle = getLifecycle(s.status);
    for (let i = 0; i < lifecycle.length; i++) {
      await prisma.submissionStatusEvent.create({
        data: {
          submissionId: sub.id,
          fromStatus: i === 0 ? SubmissionStatus.submitted : lifecycle[i - 1]!,
          toStatus: lifecycle[i]!,
          actorUserId: tvUser.id,
          actorRole: UserRole.company,
          createdAt: daysAgo(s.daysAgo - i),
        },
      });
    }
  }

  console.log(`  ✅ ${subs.length} submissions created`);

  // ── Earnings for shortlisted/hired/joined ──

  for (const { id, spec } of createdSubs) {
    const role = [tvRole1, tvRole2, cbRole1, cbRole2, nhRole1, nhRole2].find(
      (r) => r.id === spec.roleId,
    )!;
    const commPct = Number(role.platformCommissionPct ?? 15);

    // Shortlist earnings
    if (
      ([SubmissionStatus.shortlisted, SubmissionStatus.interview, SubmissionStatus.hired, SubmissionStatus.joined] as SubmissionStatus[]).includes(spec.status) &&
      role.shortlistPayoutValue
    ) {
      let gross: number;
      if (role.shortlistPayoutMode === PayoutMode.percentage) {
        gross = (spec.expectedCtc * Number(role.shortlistPayoutValue)) / 100;
      } else {
        gross = Number(role.shortlistPayoutValue);
      }
      const commission = (gross * commPct) / 100;
      const net = gross - commission;

      await prisma.earning.create({
        data: {
          submissionId: id,
          recruiterId: spec.recruiterId,
          roleId: spec.roleId,
          earningType: EarningType.shortlist_payout,
          status: EarningStatus.payable,
          grossAmount: gross,
          platformCommissionPct: commPct,
          platformCommission: commission,
          netAmount: net,
          createdAt: daysAgo(spec.daysAgo - 1),
        },
      });
    }

    // Hire earnings
    if (
      ([SubmissionStatus.hired, SubmissionStatus.joined] as SubmissionStatus[]).includes(spec.status) &&
      role.hirePayoutValue
    ) {
      const ctc = spec.acceptedCtc ?? spec.expectedCtc;
      let gross: number;
      if (role.hirePayoutMode === PayoutMode.percentage) {
        gross = (ctc * Number(role.hirePayoutValue)) / 100;
      } else {
        gross = Number(role.hirePayoutValue);
      }
      const commission = (gross * commPct) / 100;
      const net = gross - commission;

      await prisma.earning.create({
        data: {
          submissionId: id,
          recruiterId: spec.recruiterId,
          roleId: spec.roleId,
          earningType: EarningType.hire_payout,
          status: spec.status === SubmissionStatus.joined ? EarningStatus.paid : EarningStatus.payable,
          grossAmount: gross,
          platformCommissionPct: commPct,
          platformCommission: commission,
          netAmount: net,
          createdAt: daysAgo(spec.daysAgo - 2),
        },
      });
    }
  }

  console.log('  ✅ earnings created');

  // ── Wallet transactions ──

  // Company deposits
  for (const { wallet, label, amount } of [
    { wallet: tvWallet, label: 'TechVista', amount: 500000 },
    { wallet: cbWallet, label: 'CloudBridge', amount: 15000 },
    { wallet: nhWallet, label: 'NexaHire', amount: 8000 },
  ]) {
    await prisma.walletTransaction.create({
      data: {
        transactionType: TransactionType.company_deposit,
        amount,
        balanceBefore: 0,
        balanceAfter: amount,
        description: `Initial wallet funding for ${label}`,
        companyWalletId: wallet.id,
        createdAt: daysAgo(55),
      },
    });
  }

  // Recruiter credits (simulated past earnings credited to wallet)
  for (const { profile, amount } of [
    { profile: rpAnita, amount: 125000 },
    { profile: rpRaj, amount: 350000 },
    { profile: rpEmily, amount: 4200 },
    { profile: rpJames, amount: 3500 },
  ]) {
    await prisma.walletTransaction.create({
      data: {
        transactionType: TransactionType.recruiter_credit,
        amount,
        balanceBefore: 0,
        balanceAfter: amount,
        description: 'Accumulated earnings from past placements',
        recruiterProfileId: profile.id,
        createdAt: daysAgo(10),
      },
    });
  }

  console.log('  ✅ wallet transactions created');
  console.log(`  ✅ demo data complete! Password for all demo users: ${DEMO_PASSWORD}`);
}

function getLifecycle(finalStatus: SubmissionStatus): SubmissionStatus[] {
  const full: SubmissionStatus[] = [
    SubmissionStatus.submitted,
    SubmissionStatus.shortlisted,
    SubmissionStatus.interview,
    SubmissionStatus.hired,
    SubmissionStatus.joined,
  ];
  const idx = full.indexOf(finalStatus);
  if (idx >= 0) return full.slice(0, idx + 1);
  // rejected / withdrawn branch off from submitted
  if (finalStatus === SubmissionStatus.rejected) return [SubmissionStatus.submitted, SubmissionStatus.rejected];
  if (finalStatus === SubmissionStatus.withdrawn) return [SubmissionStatus.submitted, SubmissionStatus.withdrawn];
  return [finalStatus];
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('━━━ GigCruite Prisma Seed ━━━');

  if (isDemo) {
    await cleanDatabaseFull();
  } else if (isClean) {
    await cleanDatabase();
  }

  await applyCheckConstraints();
  await seedAdmin();
  await seedPlatformSettings();
  await seedCompanyWallets();
  await seedCountryConfigs();
  await seedFeatureFlags();

  if (isDemo) {
    await seedDemoData();
  }

  console.log('━━━ Seed complete ━━━');
}

main()
  .catch((err) => {
    console.error('[seed] fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
