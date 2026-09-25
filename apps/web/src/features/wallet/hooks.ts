import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { WalletTransactionResponse } from '@gigcruite/types';
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  fetchTransaction,
  type RecruiterWalletBalance,
  type PaginatedTransactions,
} from './api';

export function useWalletBalance() {
  return useQuery<RecruiterWalletBalance>({
    queryKey: ['wallet', 'balance'],
    queryFn: fetchWalletBalance,
    staleTime: 30_000,
  });
}

export function useWalletTransactions(
  page: number,
  pageSize: number,
  type?: string,
  search?: string,
) {
  return useQuery<PaginatedTransactions>({
    queryKey: ['wallet', 'transactions', { page, pageSize, type, search }],
    queryFn: () => fetchWalletTransactions(page, pageSize, type, search),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery<WalletTransactionResponse>({
    queryKey: ['wallet', 'transaction', id],
    queryFn: () => fetchTransaction(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}
