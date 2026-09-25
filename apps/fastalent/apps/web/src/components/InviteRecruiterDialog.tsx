import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSearchRecruiters, useInviteRecruiter } from '@/features/role-invitation';

interface InviteRecruiterDialogProps {
  roleId: string;
  open: boolean;
  onClose: () => void;
}

export default function InviteRecruiterDialog({
  roleId,
  open,
  onClose,
}: InviteRecruiterDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { data: results = [] } = useSearchRecruiters(search);
  const invite = useInviteRecruiter(roleId);

  if (!open) return null;

  const handleInvite = async () => {
    if (!selectedId) return;
    try {
      await invite.mutateAsync({
        recruiterProfileId: selectedId,
        message: message.trim() || undefined,
      });
      toast.success('Invitation sent');
      setSearch('');
      setSelectedId(null);
      setMessage('');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invitation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">Invite Recruiter</h3>

        <Input
          placeholder="Search recruiters by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedId(null);
          }}
          className="mb-3"
        />

        {results.length > 0 && !selectedId && (
          <div className="mb-3 max-h-48 overflow-y-auto rounded border border-border">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setSelectedId(r.id);
                  setSearch(r.fullName);
                }}
              >
                <span className="font-medium">{r.fullName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {r.reputationTier} ({r.reputationScore})
                </span>
                {r.specializations.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {r.specializations.slice(0, 3).join(', ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedId && (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">
              Message (optional)
            </label>
            <Textarea
              rows={3}
              placeholder="Why you'd like this recruiter on this role..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSearch('');
              setSelectedId(null);
              setMessage('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!selectedId || invite.isPending}
          >
            {invite.isPending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
