import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';

interface FeeCalculatorProps {
  payoutAmount: number;
  feeType: 'regular' | 'headhunting';
}

export function FeeCalculator({ payoutAmount, feeType: initialType }: FeeCalculatorProps) {
  const [feeType, setFeeType] = useState(initialType);

  // Fee ranges: regular = 6-9% (mid 7.5%), headhunting = 15-20% (mid 17.5%)
  const feePercentage = feeType === 'regular' ? 7.5 : 17.5;
  const feeAmount = (payoutAmount * feePercentage) / 100;
  const totalEarning = payoutAmount - feeAmount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Estimated fee breakdown</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Estimates based on mid-range fees. Actual commission is set per-role
                  during admin approval. Regular roles: 6-9%, headhunting: 15-20%.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge
            variant={feeType === 'regular' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFeeType('regular')}
          >
            Regular (6-9%)
          </Badge>
          <Badge
            variant={feeType === 'headhunting' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFeeType('headhunting')}
          >
            Headhunting (15-20%)
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role payout</span>
            <span className="font-medium">{formatCurrency(payoutAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee ({feePercentage}%)</span>
            <span className="font-medium text-error">-{formatCurrency(feeAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-semibold">Your earning</span>
            <span className="font-semibold text-primary">{formatCurrency(totalEarning)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Estimates based on mid-range fees. Actual commission set per-role during admin approval.
        </p>
      </CardContent>
    </Card>
  );
}
