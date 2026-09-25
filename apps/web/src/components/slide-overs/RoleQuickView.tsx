import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Percent } from 'lucide-react';
import { PayoutMode } from '@gigcruite/types';
import { formatCurrency } from '@/lib/format-currency';
import { useRole } from '@/features/role/hooks';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface RoleQuickViewProps {
  roleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'published':
      return 'success';
    case 'paused':
      return 'warning';
    case 'closed':
      return 'outline';
    case 'filled':
      return 'default';
    default:
      return 'secondary';
  }
}

export function RoleQuickView({ roleId, open, onOpenChange }: RoleQuickViewProps) {
  const { data: role, isLoading } = useRole(open && roleId ? roleId : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:w-[600px]">
        {isLoading ? (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">Loading role</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </>
        ) : role ? (
          <>
            <SheetHeader>
              <div className="flex items-start gap-3 flex-wrap">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-1" />
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-xl">{role.title}</SheetTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={statusBadgeVariant(role.status)}>{role.status}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {role.roleType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="px-6 space-y-6 pb-20">
              {/* Fee Structure */}
              <section>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Fee Structure</h3>
                <div className="grid grid-cols-2 gap-3">
                  {role.shortlistPayoutValue && (
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <div className="text-xs text-muted-foreground mb-1">Per Shortlist</div>
                      <div className="text-base font-semibold flex items-center gap-1">
                        {role.shortlistPayoutMode === PayoutMode.PERCENTAGE ? (
                          <>
                            <Percent className="h-3.5 w-3.5" />
                            {role.shortlistPayoutValue}% of CTC
                          </>
                        ) : (
                          <>{formatCurrency(role.shortlistPayoutValue!, role.currency)}</>
                        )}
                      </div>
                    </div>
                  )}
                  {role.hirePayoutValue && (
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <div className="text-xs text-muted-foreground mb-1">Per Hire</div>
                      <div className="text-base font-semibold flex items-center gap-1">
                        {role.hirePayoutMode === PayoutMode.PERCENTAGE ? (
                          <>
                            <Percent className="h-3.5 w-3.5" />
                            {role.hirePayoutValue}% of CTC
                          </>
                        ) : (
                          <>{formatCurrency(role.hirePayoutValue!, role.currency)}</>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Location & Details */}
              <section>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>
                      {role.location}
                      {role.isRemote ? ' · Remote' : ''}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">Employment:</span>
                    <span className="capitalize">{role.employmentType.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">CTC Range:</span>
                    <span>
                      {formatCurrency(role.ctcMin, role.currency)} – {formatCurrency(role.ctcMax, role.currency)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">Open Positions:</span>
                    <span>{role.openPositions}</span>
                  </div>
                </div>
              </section>

              {/* Description */}
              {role.description && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Description</h3>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{role.description}</p>
                </section>
              )}

              {/* Stats */}
              <section>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Submission Stats</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-center">
                    <div className="text-lg font-semibold">{role.submissionsCount}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Submissions
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-center">
                    <div className="text-lg font-semibold">{role.shortlistedCount}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Shortlisted
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-center">
                    <div className="text-lg font-semibold">
                      {role.hiredCount}
                      {role.openPositions > 1 ? `/${role.openPositions}` : ''}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Hired
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sticky bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 border-t bg-background px-6 py-4">
              <Button asChild className="w-full">
                <Link to={`/c/roles/${roleId}`} viewTransition>
                  View Full Details
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <SheetHeader>
            <SheetDescription>Role not found.</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
