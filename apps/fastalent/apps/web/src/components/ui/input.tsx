import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * shadcn v4 Input — minimal, fully controllable from the outside.
 *
 * Intentionally does not set a `type` default so the caller is always
 * explicit about whether this is `email`, `password`, `tel`, `url`, etc.
 * Styling tokens follow the `input`/`ring`/`destructive` CSS variables so
 * dark mode + theme toggling just work.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/40',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
