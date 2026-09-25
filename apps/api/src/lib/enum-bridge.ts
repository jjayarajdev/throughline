import { CompanySize as PrismaCompanySize } from '@prisma/client';
import { CompanySize } from '@gigcruite/types';

/**
 * Bridge between `@gigcruite/types.CompanySize` and
 * `@prisma/client.CompanySize`.
 *
 * The Prisma schema applies `@map()` to each `CompanySize` enum VALUE:
 *
 *   enum CompanySize {
 *     SIZE_1_10     @map("1-10")
 *     SIZE_11_50    @map("11-50")
 *     ...
 *   }
 *
 * As a result the Prisma client's runtime enum uses the schema
 * IDENTIFIERS (`"SIZE_11_50"`) while our public API enum — consumed by
 * the frontend, the OpenAPI contract, and the smoke tests — uses the
 * mapped DB values (`"11-50"`). Prisma translates schema-id → DB-value
 * on the wire via `@map()`, but the client-side boundary still speaks
 * schema identifiers, so we must translate between the two naming
 * schemes ourselves when values cross the service layer.
 *
 * A naked `as PrismaCompanySize` cast (the previous approach) silently
 * hands the public `"11-50"` straight to Prisma, which then throws
 * `PrismaClientValidationError` because `"11-50"` is not a valid
 * client-side identifier.
 *
 * All other enums in the schema (`UserRole`, `UserStatus`,
 * `ReputationTier`) have identifier === DB value, so a plain cast is
 * still correct for them. `CompanySize` is the only enum in the
 * Phase 1 schema that needs this bridge.
 */

const TO_PRISMA: Record<CompanySize, PrismaCompanySize> = {
  [CompanySize.SIZE_1_10]: PrismaCompanySize.SIZE_1_10,
  [CompanySize.SIZE_11_50]: PrismaCompanySize.SIZE_11_50,
  [CompanySize.SIZE_51_200]: PrismaCompanySize.SIZE_51_200,
  [CompanySize.SIZE_201_500]: PrismaCompanySize.SIZE_201_500,
  [CompanySize.SIZE_500_PLUS]: PrismaCompanySize.SIZE_500_PLUS,
};

const FROM_PRISMA: Record<PrismaCompanySize, CompanySize> = {
  [PrismaCompanySize.SIZE_1_10]: CompanySize.SIZE_1_10,
  [PrismaCompanySize.SIZE_11_50]: CompanySize.SIZE_11_50,
  [PrismaCompanySize.SIZE_51_200]: CompanySize.SIZE_51_200,
  [PrismaCompanySize.SIZE_201_500]: CompanySize.SIZE_201_500,
  [PrismaCompanySize.SIZE_500_PLUS]: CompanySize.SIZE_500_PLUS,
};

/**
 * Convert a public-API CompanySize (or null/undefined) to the Prisma
 * client's enum identifier used for write operations.
 */
export function toPrismaCompanySize(
  value: CompanySize | null | undefined,
): PrismaCompanySize | null {
  return value == null ? null : TO_PRISMA[value];
}

/**
 * Convert a Prisma client CompanySize (read from a row) to the
 * public-API enum value returned to clients.
 */
export function fromPrismaCompanySize(
  value: PrismaCompanySize | null | undefined,
): CompanySize | null {
  return value == null ? null : FROM_PRISMA[value];
}
