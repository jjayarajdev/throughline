import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Globe, Briefcase, Users, FileText, Clock } from 'lucide-react';
import { useAdminRoleDetail, useRoleStatusHistory } from '@/features/admin/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function getStatusVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'draft': return 'secondary';
    case 'submitted': return 'warning';
    case 'published': return 'success';
    case 'rejected': return 'destructive';
    case 'paused': return 'warning';
    case 'closed': return 'destructive';
    case 'filled': return 'default';
    default: return 'secondary';
  }
}

function fmt(v: string | null | undefined) {
  if (!v) return '--';
  return Number(v).toLocaleString('en-IN');
}

export default function AdminRoleDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: role, isLoading } = useAdminRoleDetail(id);
  const { data: history } = useRoleStatusHistory(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-4">
        <Link to="/a/roles">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Roles</Button>
        </Link>
        <p className="text-muted-foreground">Role not found.</p>
      </div>
    );
  }

  const payoutSummary = () => {
    const parts: string[] = [];
    if (role.shortlistPayoutMode && role.shortlistPayoutValue) {
      parts.push(
        `Shortlist: ${role.shortlistPayoutMode === 'percentage' ? `${role.shortlistPayoutValue}% of CTC` : `${fmt(role.shortlistPayoutValue)} flat`}`,
      );
    }
    if (role.hirePayoutMode && role.hirePayoutValue) {
      parts.push(
        `Hire: ${role.hirePayoutMode === 'percentage' ? `${role.hirePayoutValue}% of CTC` : `${fmt(role.hirePayoutValue)} flat`}`,
      );
    }
    return parts.length ? parts.join(' | ') : 'Not configured';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/a/roles">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{role.title}</h1>
            <Badge variant={getStatusVariant(role.status)}>{role.status}</Badge>
            <Badge variant="secondary" className="capitalize">{role.roleType.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">ID: {role.id}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payout Config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payout Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payout Type</span>
              <span className="capitalize font-medium">{role.payoutType.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payout Details</span>
              <span className="font-medium text-right max-w-[60%]">{payoutSummary()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Commission</span>
              <span className="font-medium">{role.platformCommissionPct ? `${role.platformCommissionPct}%` : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor Benchmark</span>
              <span className="font-medium">{role.vendorBenchmarkPct ? `${role.vendorBenchmarkPct}%` : '--'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{role.location}</span>
              {role.isRemote && <Badge variant="secondary" className="text-xs">Remote</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{role.country} / {role.currency}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="capitalize">{role.employmentType.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CTC Range</span>
              <span className="font-medium">{fmt(role.ctcMin)} - {fmt(role.ctcMax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Experience</span>
              <span className="font-medium">{role.experienceMin} - {role.experienceMax} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Positions</span>
              <span className="font-medium">{role.openPositions}</span>
            </div>
            {role.jdOriginalFilename && (
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{role.jdOriginalFilename}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {role.skills.length > 0
                ? role.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)
                : <span className="text-sm text-muted-foreground">No skills specified</span>}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submissions</span>
              <span className="font-medium">{role.submissionsCount} / {role.maxSubmissions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shortlisted</span>
              <span className="font-medium">{role.shortlistedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hired</span>
              <span className="font-medium">{role.hiredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max per Recruiter</span>
              <span className="font-medium">{role.maxPerRecruiter}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{role.description}</p>
        </CardContent>
      </Card>

      {/* Status History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Status History</CardTitle>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {h.fromStatus && (
                        <>
                          <Badge variant="secondary" className="text-xs">{h.fromStatus}</Badge>
                          <span className="text-muted-foreground">&rarr;</span>
                        </>
                      )}
                      <Badge variant={getStatusVariant(h.toStatus)} className="text-xs">{h.toStatus}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {new Date(h.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {h.changedByEmail && (
                      <p className="text-xs text-muted-foreground mt-0.5">by {h.changedByEmail}</p>
                    )}
                    {h.comment && (
                      <p className="text-xs mt-1 bg-muted/50 rounded px-2 py-1">{h.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No status history recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
