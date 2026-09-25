import type { WalletTransactionResponse } from '@gigcruite/types';
import { apiGet, apiPost } from '@/lib/api-client';

// Recruiter wallet uses the same CompanyWalletResponse shape
// but the API returns it at /wallet/balance for the authed recruiter.
export interface RecruiterWalletBalance {
  id: string;
  recruiterId: string;
  balance: string;
  lockedBalance: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactions {
  transactions: WalletTransactionResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchWalletBalance(): Promise<RecruiterWalletBalance> {
  return apiGet<RecruiterWalletBalance>('/wallet/balance');
}

export function fetchWalletTransactions(
  page: number,
  pageSize: number,
  type?: string,
  search?: string,
): Promise<PaginatedTransactions> {
  return apiGet<PaginatedTransactions>('/wallet/transactions', {
    params: { page, pageSize, ...(type && { type }), ...(search && { search }) },
  });
}

export function fetchTransaction(id: string): Promise<WalletTransactionResponse> {
  return apiGet<WalletTransactionResponse>(`/wallet/transactions/${id}`);
}

// ---- Company deposit (Razorpay) ----

export interface CreateDepositOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyDepositPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyDepositResponse {
  transactionId: string;
  amount: string;
  status: string;
}

export function createDepositOrder(amount: number): Promise<CreateDepositOrderResponse> {
  return apiPost<CreateDepositOrderResponse>('/wallet/deposit/create-order', { amount });
}

export function verifyDeposit(payload: VerifyDepositPayload): Promise<VerifyDepositResponse> {
  return apiPost<VerifyDepositResponse>('/wallet/deposit/verify', payload);
}

// ---- Company earnings ----

export interface CompanyEarnings {
  totalSpent: string;
  totalFees: string;
  placements: number;
}

export function fetchCompanyEarnings(): Promise<CompanyEarnings> {
  return apiGet<CompanyEarnings>('/earnings/company');
}
