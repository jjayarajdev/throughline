import { Prisma } from '@prisma/client';
import type { SavingsResponse, SavingsRoleBreakdown } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';

export async function getCompanySavings(userId: string): Promise<SavingsResponse> {
  const company = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true, country: true, currency: true },
  });
  if (!company) throw AppError.internal('Company profile missing');

  // Country config is still used for currencySymbol display, but NOT for
  // benchmark calculation — that uses the per-role frozen snapshot.
  const countryConfig = await prisma.countryConfig.findUnique({
    where: { countryCode: company.country },
    select: { currencySymbol: true, vendorBenchmarkPct: true },
  });

  // Get all hire earnings for this company's roles that are payable or paid.
  // Include role.vendorBenchmarkPct — the frozen benchmark at approve time.
  const hireEarnings = await prisma.earning.findMany({
    where: {
      role: { companyId: company.id },
      earningType: 'hire_payout',
      status: { in: ['payable', 'paid'] },
    },
    include: {
      submission: { select: { acceptedCtc: true } },
      role: { select: { id: true, title: true, vendorBenchmarkPct: true } },
    },
  });

  const totalHires = hireEarnings.length;
  let totalAcceptedCtc = new Prisma.Decimal(0);
  let totalPlatformSpend = new Prisma.Decimal(0);
  let totalTraditionalCost = new Prisma.Decimal(0);

  // Per-role aggregation — each role uses its OWN frozen benchmark
  const roleMap = new Map<string, {
    title: string;
    hires: number;
    totalCtc: Prisma.Decimal;
    actualCost: Prisma.Decimal;
    benchmarkPct: Prisma.Decimal;
  }>();

  // Fallback benchmark for roles that were published before this feature
  // (vendorBenchmarkPct is null). Uses current country config as best-effort.
  const fallbackBenchmark = countryConfig?.vendorBenchmarkPct ?? new Prisma.Decimal(8.33);

  for (const e of hireEarnings) {
    const ctc = e.submission.acceptedCtc ?? new Prisma.Decimal(0);
    const roleBenchmark = e.role.vendorBenchmarkPct ?? fallbackBenchmark;

    totalAcceptedCtc = totalAcceptedCtc.add(ctc);
    totalPlatformSpend = totalPlatformSpend.add(e.grossAmount);
    totalTraditionalCost = totalTraditionalCost.add(
      ctc.mul(roleBenchmark).div(100).toDecimalPlaces(2),
    );

    const existing = roleMap.get(e.role.id);
    if (existing) {
      existing.hires += 1;
      existing.totalCtc = existing.totalCtc.add(ctc);
      existing.actualCost = existing.actualCost.add(e.grossAmount);
    } else {
      roleMap.set(e.role.id, {
        title: e.role.title,
        hires: 1,
        totalCtc: ctc,
        actualCost: e.grossAmount,
        benchmarkPct: roleBenchmark,
      });
    }
  }

  const savings = totalTraditionalCost.sub(totalPlatformSpend);
  const savingsPct = totalTraditionalCost.greaterThan(0)
    ? savings.div(totalTraditionalCost).mul(100).toDecimalPlaces(2)
    : new Prisma.Decimal(0);

  const perRoleBreakdown: SavingsRoleBreakdown[] = Array.from(roleMap.entries()).map(([roleId, data]) => {
    const trad = data.totalCtc.mul(data.benchmarkPct).div(100).toDecimalPlaces(2);
    return {
      roleId,
      roleTitle: data.title,
      hires: data.hires,
      totalCtc: data.totalCtc.toString(),
      traditionalCost: trad.toString(),
      actualCost: data.actualCost.toString(),
      saved: trad.sub(data.actualCost).toString(),
      vendorBenchmarkPct: data.benchmarkPct.toString(),
    };
  });

  return {
    totalHires,
    totalAcceptedCtc: totalAcceptedCtc.toString(),
    vendorBenchmarkPct: fallbackBenchmark.toString(),
    traditionalCost: totalTraditionalCost.toString(),
    actualCost: totalPlatformSpend.toString(),
    savings: savings.toString(),
    savingsPct: savingsPct.toString(),
    currency: company.currency,
    currencySymbol: countryConfig?.currencySymbol ?? null,
    perRoleBreakdown,
  };
}
