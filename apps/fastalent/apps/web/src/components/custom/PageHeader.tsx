import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Composable page header: PageHeader > PageTitle + PageDescription + PageActions
 *
 * Usage:
 * <PageHeader>
 *   <div>
 *     <PageTitle>Roles</PageTitle>
 *     <PageDescription>Manage your active and draft roles</PageDescription>
 *   </div>
 *   <PageActions>
 *     <Button>Create Role</Button>
 *   </PageActions>
 * </PageHeader>
 */

export function PageHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}
      {...props}
    />
  );
}

export function PageTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn('text-xl font-semibold tracking-tight text-foreground', className)}
      {...props}
    />
  );
}

export function PageDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function PageActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  );
}
