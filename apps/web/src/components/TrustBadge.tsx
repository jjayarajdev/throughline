import { type ReputationTier } from '@gigcruite/types';

const TIER_CONFIG: Record<ReputationTier, { label: string; color: string; bg: string }> = {
  bronze: { label: 'Bronze', color: 'text-warning', bg: 'bg-warning/10' },
  silver: { label: 'Silver', color: 'text-muted-foreground', bg: 'bg-muted' },
  gold: { label: 'Gold', color: 'text-success', bg: 'bg-success/10' },
  platinum: { label: 'Platinum', color: 'text-primary', bg: 'bg-primary/10' },
};

interface TrustBadgeProps {
  tier: ReputationTier;
  score: number;
  compact?: boolean;
}

export function TrustBadge({ tier, score, compact }: TrustBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.bronze;
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  }
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 ${config.bg}`}>
      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
      <span className={`text-xs ${config.color} opacity-75`}>{score}/100</span>
    </div>
  );
}
