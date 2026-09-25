import type {
  TransactionType,
  EarningStatus,
  EarningType,
  PayoutBatchStatus,
  PayoutRequestStatus,
} from '../enums/wallet.js';

// --------------------------------------------------------------------
// Company Wallet
// --------------------------------------------------------------------

export interface CompanyWalletResponse {
  id: string;
  companyId: string;
  /** Available (unencumbered) balance in INR. */
  balance: string;
  /** Funds reserved for active role payouts. */
  lockedBalance: string;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------
// Wallet Transactions (immutable ledger)
// --------------------------------------------------------------------

export interface WalletTransactionResponse {
  id: string;
  transactionType: TransactionType;
  /** Amount in INR (always positive — direction conveyed by type). */
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// --------------------------------------------------------------------
// Earnings
// --------------------------------------------------------------------

export interface EarningResponse {
  id: string;
  submissionId: string;
  recruiterId: string;
  roleId: string;
  earningType: EarningType;
  status: EarningStatus;
  grossAmount: string;
  platformCommissionPct: string;
  platformCommission: string;
  netAmount: string;
  payoutBatchId: string | null;
  createdAt: string;
  updatedAt: string;

  /** Optionally populated with submission + role info for list views. */
  submission?: {
    candidateName: string;
    status: string;
  };
  role?: {
    id: string;
    title: string;
    companyName: string;
  };
}

export interface EarningSummaryResponse {
  totalEarned: string;
  totalPending: string;
  totalPayable: string;
  totalPaid: string;
  totalCommission: string;
  earningsCount: number;
}

// --------------------------------------------------------------------
// Payout Batches
// --------------------------------------------------------------------

export interface PayoutBatchResponse {
  id: string;
  recruiterId: string;
  status: PayoutBatchStatus;
  totalAmount: string;
  earningsCount: number;
  razorpayPayoutId: string | null;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------
// Payout Requests
// --------------------------------------------------------------------

export interface PayoutRequestResponse {
  id: string;
  recruiterId: string;
  status: PayoutRequestStatus;
  amount: string;
  adminNote: string | null;
  rejectedAt: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  payoutBatchId: string | null;
  createdAt: string;
  updatedAt: string;

  /** Populated in admin views. */
  recruiter?: {
    id: string;
    fullName: string;
    bankVerified: boolean;
  };
}

// --------------------------------------------------------------------
// Platform Settings
// --------------------------------------------------------------------

export interface PlatformSettingResponse {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  updatedAt: string;
}

// --------------------------------------------------------------------
// Inputs
// --------------------------------------------------------------------

export interface DepositCreateOrderInput {
  /** Amount in INR (whole number or up to 2 decimal places). */
  amount: number;
}

export interface DepositVerifyInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PayoutRequestInput {
  /** Withdrawal amount in INR. Must be >= min_withdrawal_amount. */
  amount: number;
}
