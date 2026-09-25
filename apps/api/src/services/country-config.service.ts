import type { CountryConfigResponse, CountryConfigInput } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';

export async function listCountryConfigs(activeOnly = false): Promise<CountryConfigResponse[]> {
  const where = activeOnly ? { isActive: true } : {};
  const rows = await prisma.countryConfig.findMany({ where, orderBy: { countryName: 'asc' } });
  return rows.map(projectCountryConfig);
}

export async function getCountryConfig(countryCode: string): Promise<CountryConfigResponse> {
  const row = await prisma.countryConfig.findUnique({ where: { countryCode } });
  if (!row) throw AppError.notFound(`Country config not found for code: ${countryCode}`);
  return projectCountryConfig(row);
}

export async function createCountryConfig(input: CountryConfigInput): Promise<CountryConfigResponse> {
  const existing = await prisma.countryConfig.findUnique({ where: { countryCode: input.countryCode } });
  if (existing) throw AppError.conflict(`Country config already exists for code: ${input.countryCode}`);
  const row = await prisma.countryConfig.create({ data: mapInput(input) });
  return projectCountryConfig(row);
}

export async function updateCountryConfig(countryCode: string, input: Partial<CountryConfigInput>): Promise<CountryConfigResponse> {
  const existing = await prisma.countryConfig.findUnique({ where: { countryCode } });
  if (!existing) throw AppError.notFound(`Country config not found for code: ${countryCode}`);
  const row = await prisma.countryConfig.update({ where: { countryCode }, data: mapInput(input) });
  return projectCountryConfig(row);
}

function mapInput(input: Partial<CountryConfigInput>): any {
  const data: any = {};
  if (input.countryCode !== undefined) data.countryCode = input.countryCode;
  if (input.countryName !== undefined) data.countryName = input.countryName;
  if (input.currencyCode !== undefined) data.currencyCode = input.currencyCode;
  if (input.currencySymbol !== undefined) data.currencySymbol = input.currencySymbol;
  if (input.shortlistFlatMin !== undefined) data.shortlistFlatMin = input.shortlistFlatMin;
  if (input.shortlistFlatMax !== undefined) data.shortlistFlatMax = input.shortlistFlatMax;
  if (input.shortlistPctMin !== undefined) data.shortlistPctMin = input.shortlistPctMin;
  if (input.shortlistPctMax !== undefined) data.shortlistPctMax = input.shortlistPctMax;
  if (input.hireFlatMin !== undefined) data.hireFlatMin = input.hireFlatMin;
  if (input.hireFlatMax !== undefined) data.hireFlatMax = input.hireFlatMax;
  if (input.hirePctMin !== undefined) data.hirePctMin = input.hirePctMin;
  if (input.hirePctMax !== undefined) data.hirePctMax = input.hirePctMax;
  if (input.vendorBenchmarkPct !== undefined) data.vendorBenchmarkPct = input.vendorBenchmarkPct;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  return data;
}

function projectCountryConfig(row: any): CountryConfigResponse {
  return {
    id: row.id,
    countryCode: row.countryCode,
    countryName: row.countryName,
    currencyCode: row.currencyCode,
    currencySymbol: row.currencySymbol,
    shortlistFlatMin: row.shortlistFlatMin.toString(),
    shortlistFlatMax: row.shortlistFlatMax.toString(),
    shortlistPctMin: row.shortlistPctMin.toString(),
    shortlistPctMax: row.shortlistPctMax.toString(),
    hireFlatMin: row.hireFlatMin.toString(),
    hireFlatMax: row.hireFlatMax.toString(),
    hirePctMin: row.hirePctMin.toString(),
    hirePctMax: row.hirePctMax.toString(),
    vendorBenchmarkPct: row.vendorBenchmarkPct.toString(),
    isActive: row.isActive,
  };
}
