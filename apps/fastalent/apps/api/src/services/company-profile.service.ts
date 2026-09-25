import type { CompanyProfile } from '@prisma/client';
import type { CompanyProfileResponse } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import {
  fromPrismaCompanySize,
  toPrismaCompanySize,
} from '../lib/enum-bridge.js';
import type { UpdateCompanyProfileInput } from '../validators/company-profile.js';

/**
 * Company profile service.
 *
 * Plain CRUD — company profiles have no encrypted fields. The one
 * boundary concern is `CompanySize`: it uses Prisma `@map()` on each
 * enum value, so the Prisma client runtime identifier
 * (`"SIZE_11_50"`) and the public-API value (`"11-50"`) differ and
 * must be translated in both directions via `enum-bridge.ts`.
 */

function projectCompanyProfile(row: CompanyProfile): CompanyProfileResponse {
  return {
    id: row.id,
    userId: row.userId,
    companyName: row.companyName,
    industry: row.industry,
    companySize: fromPrismaCompanySize(row.companySize),
    website: row.website,
    logoUrl: row.logoUrl,
    description: row.description,
    foundedYear: row.foundedYear,
    headquarters: row.headquarters,
    contactPerson: row.contactPerson,
    contactPhone: row.contactPhone,
    gstNumber: row.gstNumber,
    country: row.country,
    currency: row.currency,
    defaultCommissionPct: row.defaultCommissionPct?.toString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCompanyProfile(
  userId: string,
): Promise<CompanyProfileResponse> {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    throw AppError.notFound('Company profile not found');
  }
  return projectCompanyProfile(profile);
}

export async function updateCompanyProfile(
  userId: string,
  input: UpdateCompanyProfileInput,
): Promise<CompanyProfileResponse> {
  const existing = await prisma.companyProfile.findUnique({
    where: { userId },
  });
  if (!existing) {
    throw AppError.notFound('Company profile not found');
  }

  // Prisma `undefined` = skip, `null` = explicit clear. The validator
  // already normalised empty strings → null for optional fields.
  const updated = await prisma.companyProfile.update({
    where: { userId },
    data: {
      ...(input.companyName !== undefined
        ? { companyName: input.companyName }
        : {}),
      ...(input.industry !== undefined ? { industry: input.industry } : {}),
      ...(input.companySize !== undefined
        ? { companySize: toPrismaCompanySize(input.companySize) }
        : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.foundedYear !== undefined
        ? { foundedYear: input.foundedYear }
        : {}),
      ...(input.headquarters !== undefined
        ? { headquarters: input.headquarters }
        : {}),
      ...(input.contactPerson !== undefined
        ? { contactPerson: input.contactPerson }
        : {}),
      ...(input.contactPhone !== undefined
        ? { contactPhone: input.contactPhone }
        : {}),
      ...(input.gstNumber !== undefined ? { gstNumber: input.gstNumber } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.defaultCommissionPct !== undefined
        ? { defaultCommissionPct: input.defaultCommissionPct }
        : {}),
    },
  });

  return projectCompanyProfile(updated);
}
