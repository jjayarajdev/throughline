import { useState, type FormEvent } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';

interface Props {
  open: boolean;
  onClose: () => void;
  availableBalance: string;
  minWithdrawal?: number;
  bankVerified?: boolean;
  onSubmit: (amount: number) => void;
  isSubmitting?: boolean;
}

export default function WithdrawalDialog({
  open,
  onClose,
  availableBalance,
  minWithdrawal = 500,
  bankVerified = false,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const [amount, setAmount] = useState('');
  const available = Number(availableBalance);
  const parsedAmount = Number(amount);
  const isValid =
    !isNaN(parsedAmount) &&
    parsedAmount >= minWithdrawal &&
    parsedAmount <= available &&
    bankVerified;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    onSubmit(parsedAmount);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Request Withdrawal
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!bankVerified && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Please add and verify your bank details before requesting a withdrawal.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Available balance: <span className="font-semibold text-success">{formatCurrency(availableBalance)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: {formatCurrency(minWithdrawal)}
            </p>
          </div>

          <div>
            <label htmlFor="wd-amount" className="mb-1 block text-sm font-medium">
              Amount (INR)
            </label>
            <input
              id="wd-amount"
              type="number"
              min={minWithdrawal}
              max={available}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${minWithdrawal}`}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring"
              disabled={!bankVerified}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
