import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SubmissionStatus } from '@gigcruite/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';
import { useTransitionSubmission } from '@/features/submission';

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  [SubmissionStatus.SUBMITTED]: 'Submitted',
  [SubmissionStatus.SHORTLISTED]: 'Shortlisted',
  [SubmissionStatus.INTERVIEW]: 'Interview',
  [SubmissionStatus.HIRED]: 'Hired',
  [SubmissionStatus.JOINED]: 'Joined',
  [SubmissionStatus.REJECTED]: 'Rejected',
  [SubmissionStatus.WITHDRAWN]: 'Withdrawn',
};

export interface StatusActionModalProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  candidateName: string;
  currentStatus: SubmissionStatus;
  targetStatus: SubmissionStatus;
}

export function StatusActionModal({
  open,
  onClose,
  submissionId,
  candidateName,
  currentStatus,
  targetStatus,
}: StatusActionModalProps) {
  const [reason, setReason] = useState('');
  const [acceptedCtc, setAcceptedCtc] = useState('');
  const transition = useTransitionSubmission();

  const needsCtc = targetStatus === SubmissionStatus.HIRED;
  const needsReason =
    targetStatus === SubmissionStatus.REJECTED ||
    targetStatus === SubmissionStatus.WITHDRAWN;

  const handleConfirm = () => {
    const payload: {
      toStatus: SubmissionStatus;
      reason?: string;
      acceptedCtc?: number;
    } = { toStatus: targetStatus };

    if (needsReason && reason.trim()) {
      payload.reason = reason.trim();
    }
    if (needsCtc) {
      const ctcNum = Number(acceptedCtc);
      if (!Number.isFinite(ctcNum) || ctcNum <= 0) {
        toast.error('Please enter a valid accepted CTC');
        return;
      }
      payload.acceptedCtc = ctcNum;
    }

    transition.mutate(
      { submissionId, payload },
      {
        onSuccess: () => {
          toast.success(
            `${candidateName} moved to ${STATUS_LABELS[targetStatus]}`,
          );
          setReason('');
          setAcceptedCtc('');
          onClose();
        },
        onError: (err) => {
          toast.error(extractErrorMessage(err, 'Transition failed'));
        },
      },
    );
  };

  const isDestructive =
    targetStatus === SubmissionStatus.REJECTED ||
    targetStatus === SubmissionStatus.WITHDRAWN;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {STATUS_LABELS[targetStatus]} — {candidateName}
          </DialogTitle>
          <DialogDescription>
            Move from {STATUS_LABELS[currentStatus]} to{' '}
            {STATUS_LABELS[targetStatus]}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {needsCtc ? (
            <div className="space-y-1.5">
              <label
                htmlFor="accepted-ctc"
                className="text-sm font-medium"
              >
                Accepted CTC (INR / year)
              </label>
              <Input
                id="accepted-ctc"
                type="number"
                min={0}
                placeholder="e.g. 1200000"
                value={acceptedCtc}
                onChange={(e) => setAcceptedCtc(e.target.value)}
              />
            </div>
          ) : null}

          {needsReason ? (
            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason (optional)
              </label>
              <Textarea
                id="reason"
                rows={3}
                maxLength={2000}
                placeholder="Why is this submission being moved?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={transition.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={transition.isPending}
          >
            {transition.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
