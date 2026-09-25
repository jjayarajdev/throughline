import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, KeyRound } from 'lucide-react';
import {
  useAdminUserDetail,
  useUpdateUserStatus,
  useForcePasswordReset,
  useUpdateCompanyCommission,
} from '@/features/admin/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';

function statusVariant(s: string): 'success' | 'secondary' | 'destructive' | 'warning' {
  switch (s) {
    case 'active': return 'success';
    case 'blocked': return 'destructive';
    case 'pending_verification': return 'warning';
    default: return 'secondary';
  }
}

function roleStatusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (s) {
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

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useAdminUserDetail(id);
  const updateStatus = useUpdateUserStatus();
  const resetPassword = useForcePasswordReset();
  const updateCommission = useUpdateCompanyCommission();

  const [resetDialog, setResetDialog] = useState(false);
  const [commissionInput, setCommissionInput] = useState('');
  const [editingCommission, setEditingCommission] = useState(false);

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

  if (!user) {
    return (
      <div className="space-y-4">
        <Link to="/a/users">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Users</Button>
        </Link>
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { userId: user.id, status: newStatus },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to update status')),
      },
    );
  };

  const handleResetPassword = () => {
    resetPassword.mutate(user.id, {
      onSuccess: (res) => {
        toast.success(`Password reset email sent to ${res.email}`);
        setResetDialog(false);
      },
      onError: (err) => toast.error(extractErrorMessage(err, 'Failed to send reset')),
    });
  };

  const handleSaveCommission = () => {
    if (!user.companyProfile) return;
    const val = commissionInput.trim() === '' ? null : Number(commissionInput);
    if (val !== null && (isNaN(val) || val < 0 || val > 100)) {
      toast.error('Commission must be 0-100 or blank to clear');
      return;
    }
    updateCommission.mutate(
      { companyId: user.companyProfile.id, defaultCommissionPct: val },
      {
        onSuccess: () => {
          toast.success('Commission updated');
          setEditingCommission(false);
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to update commission')),
      },
    );
  };

  const cp = user.companyProfile;
  const rp = user.recruiterProfile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/a/users">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{user.email}</h1>
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            <Badge variant={statusVariant(user.status)}>{user.status.replace(/_/g, ' ')}</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
            {user.lastLoginAt && <span>Last login {new Date(user.lastLoginAt).toLocaleDateString('en-IN')}</span>}
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.emailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Company Profile */}
        {cp && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{cp.companyName}</span></div>
              {cp.industry && <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span className="font-medium">{cp.industry}</span></div>}
              {cp.companySize && <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span className="font-medium capitalize">{cp.companySize.replace(/_/g, ' ')}</span></div>}
              {cp.headquarters && <div className="flex justify-between"><span className="text-muted-foreground">Headquarters</span><span className="font-medium">{cp.headquarters}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Country / Currency</span><span className="font-medium">{cp.country} / {cp.currency}</span></div>
            </CardContent>
          </Card>
        )}

        {/* Recruiter Profile */}
        {rp && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recruiter Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{rp.fullName}</span></div>
              {rp.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{rp.phone}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Trust Tier</span><Badge variant="secondary" className="capitalize">{rp.reputationTier}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Placements</span><span className="font-medium">{rp.totalPlacements}</span></div>
              {rp.yearsOfExperience !== null && <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span className="font-medium">{rp.yearsOfExperience} years</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Country / Currency</span><span className="font-medium">{rp.country} / {rp.currency}</span></div>
              {rp.specializations.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Specializations</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rp.specializations.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Commission (company only) */}
        {cp && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Commission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!editingCommission ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Default Commission</p>
                    <p className="text-lg font-semibold">{cp.defaultCommissionPct ? `${cp.defaultCommissionPct}%` : 'Not set (uses global)'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCommissionInput(cp.defaultCommissionPct ?? '');
                      setEditingCommission(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission % (blank to clear)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="commission"
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={commissionInput}
                      onChange={(e) => setCommissionInput(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-32"
                    />
                    <Button size="sm" onClick={handleSaveCommission} disabled={updateCommission.isPending}>
                      {updateCommission.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCommission(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wallet */}
        {(cp?.wallet || rp) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {cp?.wallet && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className="font-medium">{Number(cp.wallet.balance).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Locked</span><span className="font-medium">{Number(cp.wallet.lockedBalance).toLocaleString('en-IN')}</span></div>
                </>
              )}
              {rp && (
                <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className="font-medium">{Number(rp.walletBalance).toLocaleString('en-IN')}</span></div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Roles (company) */}
      {user.recentRoles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.recentRoles.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <Link to={`/a/roles/${r.id}`} className="font-medium hover:underline truncate max-w-[60%]">
                    {r.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleStatusVariant(r.status)} className="text-xs">{r.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recruiter submissions count */}
      {rp && user.recentSubmissionsCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm"><span className="font-medium">{user.recentSubmissionsCount}</span> total submissions</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          {user.role !== 'admin' && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status</Label>
              <Select
                value={user.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateStatus.isPending}
                className="h-8 text-sm"
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetDialog(true)}
          >
            <KeyRound className="mr-1 h-3.5 w-3.5" />
            Send Password Reset
          </Button>
        </CardContent>
      </Card>

      {/* Reset password dialog */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Password Reset</DialogTitle>
            <DialogDescription>
              This will send a password reset email to <strong>{user.email}</strong> and log them out of all sessions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
