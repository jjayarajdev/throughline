import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { createDepositOrder, verifyDeposit, type VerifyDepositPayload } from '@/features/wallet/api';
import RazorpayCheckout, { type RazorpaySuccess } from '@/components/wallet/RazorpayCheckout';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format-currency';

const PRESETS = [5_000, 10_000, 25_000, 50_000];

export default function CompanyFund() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const [customInput, setCustomInput] = useState('');
  const [orderData, setOrderData] = useState<{
    orderId: string;
    amount: number;
  } | null>(null);
  const [triggerRzp, setTriggerRzp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useMutation({
    mutationFn: createDepositOrder,
    onSuccess: (data) => {
      setOrderData({ orderId: data.orderId, amount: data.amount });
      setTriggerRzp(true);
    },
    onError: (err) => setError(err.message),
  });

  const verify = useMutation({
    mutationFn: (payload: VerifyDepositPayload) => verifyDeposit(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wallet'] });
      navigate('/c/wallet');
    },
    onError: (err) => setError(err.message),
  });

  const effectiveAmount = amount || Number(customInput) || 0;

  function handlePay() {
    if (effectiveAmount < 100) {
      setError('Minimum amount is ₹100');
      return;
    }
    setError(null);
    createOrder.mutate(effectiveAmount);
  }

  function handleSuccess(res: RazorpaySuccess) {
    setTriggerRzp(false);
    verify.mutate(res);
  }

  function handleDismiss() {
    setTriggerRzp(false);
    setOrderData(null);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/c/wallet')}>
        <ArrowLeft className="h-4 w-4" /> Back to wallet
      </Button>

      <PageHeader>
        <div>
          <PageTitle>Add funds</PageTitle>
          <PageDescription>Choose an amount to fund your company wallet</PageDescription>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Presets */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <Button
                key={p}
                variant={amount === p ? 'default' : 'outline'}
                onClick={() => {
                  setAmount(p);
                  setCustomInput('');
                }}
              >
                {formatCurrency(p)}
              </Button>
            ))}
          </div>

          {/* Custom */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Or enter custom amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₹
              </span>
              <Input
                id="custom-amount"
                type="number"
                min={100}
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  setAmount(0);
                }}
                placeholder="e.g. 15000"
                className="pl-8"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handlePay}
            disabled={effectiveAmount < 100 || createOrder.isPending || verify.isPending}
            className="w-full"
            size="lg"
          >
            {createOrder.isPending
              ? 'Creating order...'
              : verify.isPending
                ? 'Verifying...'
                : `Pay ${effectiveAmount >= 100 ? formatCurrency(effectiveAmount) : ''}`}
          </Button>
        </CardContent>
      </Card>

      {orderData && (
        <RazorpayCheckout
          orderId={orderData.orderId}
          amount={orderData.amount}
          onSuccess={handleSuccess}
          onDismiss={handleDismiss}
          trigger={triggerRzp}
        />
      )}
    </div>
  );
}
