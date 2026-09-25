import { z } from 'zod';

export const DepositCreateOrderSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .finite()
      .positive('Amount must be greater than zero')
      .max(10_00_000, 'Single deposit cannot exceed ₹10,00,000'),
  })
  .strict();

export const DepositVerifySchema = z
  .object({
    razorpayOrderId: z.string().min(1, 'Order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
    razorpaySignature: z.string().min(1, 'Signature is required'),
  })
  .strict();

export const WalletTransactionsQuerySchema = z
  .object({
    page: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().int().min(1).max(10_000).optional(),
      )
      .optional(),
    pageSize: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().int().min(1).max(100).optional(),
      )
      .optional(),
    type: z.string().optional(),
    search: z.string().max(100).optional(),
  })
  .strict();

export type DepositCreateOrderBody = z.infer<typeof DepositCreateOrderSchema>;
export type DepositVerifyBody = z.infer<typeof DepositVerifySchema>;
export type WalletTransactionsQuery = z.infer<typeof WalletTransactionsQuerySchema>;
