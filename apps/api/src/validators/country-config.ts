import { z } from 'zod';

const decimalRange = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().min(min).max(max),
  );

export const CreateCountryConfigSchema = z
  .object({
    countryCode: z.string().trim().length(2, 'Country code must be 2 characters').toUpperCase(),
    countryName: z.string().trim().min(2).max(100),
    currencyCode: z.string().trim().length(3, 'Currency code must be 3 characters').toUpperCase(),
    currencySymbol: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
      z.string().trim().max(5).nullable().optional(),
    ),
    shortlistFlatMin: decimalRange(0, 99999999),
    shortlistFlatMax: decimalRange(0, 99999999),
    shortlistPctMin: decimalRange(0, 100),
    shortlistPctMax: decimalRange(0, 100),
    hireFlatMin: decimalRange(0, 99999999),
    hireFlatMax: decimalRange(0, 99999999),
    hirePctMin: decimalRange(0, 100),
    hirePctMax: decimalRange(0, 100),
    vendorBenchmarkPct: decimalRange(0, 100),
    isActive: z.boolean().optional(),
  })
  .strict();

export const UpdateCountryConfigSchema = z
  .object({
    countryName: z.string().trim().min(2).max(100).optional(),
    currencyCode: z.string().trim().length(3).toUpperCase().optional(),
    currencySymbol: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
      z.string().trim().max(5).nullable().optional(),
    ),
    shortlistFlatMin: decimalRange(0, 99999999).optional(),
    shortlistFlatMax: decimalRange(0, 99999999).optional(),
    shortlistPctMin: decimalRange(0, 100).optional(),
    shortlistPctMax: decimalRange(0, 100).optional(),
    hireFlatMin: decimalRange(0, 99999999).optional(),
    hireFlatMax: decimalRange(0, 99999999).optional(),
    hirePctMin: decimalRange(0, 100).optional(),
    hirePctMax: decimalRange(0, 100).optional(),
    vendorBenchmarkPct: decimalRange(0, 100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type CreateCountryConfigBody = z.infer<typeof CreateCountryConfigSchema>;
export type UpdateCountryConfigBody = z.infer<typeof UpdateCountryConfigSchema>;
