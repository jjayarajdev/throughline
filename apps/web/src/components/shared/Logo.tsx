import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Render without a wrapping <Link>. Use this inside layouts where the
   *  logo sits on the same route as the home link. */
  asPlainText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'h-5 w-5', text: 'text-base' },
  md: { icon: 'h-6 w-6', text: 'text-lg' },
  lg: { icon: 'h-8 w-8', text: 'text-2xl' },
} as const;

/**
 * fastalent brand mark. Icon (briefcase) + wordmark. Wraps in a router
 * <Link> by default so every layout's header can drop it in and get a
 * working "go home" affordance for free.
 */
export function Logo({ size = 'md', asPlainText = false, className }: LogoProps) {
  const { icon, text } = sizeMap[size];
  const content = (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', text, className)}>
      <Briefcase className={cn(icon, 'text-primary')} aria-hidden />
      <span>fastalent</span>
    </span>
  );
  if (asPlainText) return content;
  return (
    <Link to="/" viewTransition className="inline-flex">
      {content}
    </Link>
  );
}
