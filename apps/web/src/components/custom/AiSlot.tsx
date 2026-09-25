import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

type AiSlotVariant = 'panel' | 'badge' | 'inline';

interface AiSlotProps {
  /** Variant determines size and layout */
  variant?: AiSlotVariant;
  /** Feature label for the placeholder text */
  label?: string;
  /** Whether to show the placeholder or be completely hidden */
  visible?: boolean;
  className?: string;
}

/**
 * AI-ready design surface placeholder.
 *
 * Reserves layout space for upcoming AI features (next milestone).
 * Shows a subtle "coming soon" indicator when visible, or renders
 * nothing when hidden (default). Pages opt-in to visibility.
 *
 * Variants:
 * - panel: Full-width card (dashboard recommendation panel, ~200px height)
 * - badge: Inline badge-sized slot (match score on submission cards)
 * - inline: Expandable search bar area (browse pages)
 */
export function AiSlot({ variant = 'panel', label = 'AI feature', visible = false, className }: AiSlotProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-dashed border-primary/20 bg-primary/5 text-muted-foreground',
        variant === 'panel' && 'min-h-[200px] justify-center p-6',
        variant === 'badge' && 'px-2 py-0.5 text-xs',
        variant === 'inline' && 'px-3 py-2 text-sm',
        className,
      )}
      role="presentation"
      aria-hidden="true"
    >
      <Sparkles className={cn('text-primary/40', variant === 'badge' ? 'h-3 w-3' : 'h-4 w-4')} />
      <span className="text-muted-foreground/60">
        {variant === 'badge' ? label : `${label} - Coming soon`}
      </span>
    </div>
  );
}
