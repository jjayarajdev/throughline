import { useNavigate, useParams } from 'react-router-dom';
import { RoleStatus, type RoleOwnerResponse } from '@gigcruite/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';
import { useRole, useUpdateRole } from '@/features/role/hooks';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom';
import RoleForm from './RoleForm';
import {
  DEFAULT_ROLE_FORM,
  toCreatePayload,
  type RoleFormValues,
} from './role-form-schema';

function roleToFormValues(role: RoleOwnerResponse): RoleFormValues {
  return {
    title: role.title,
    visibility: role.visibility,
    description: role.description,
    roleType: role.roleType,
    location: role.location,
    isRemote: role.isRemote,
    employmentType: role.employmentType as RoleFormValues['employmentType'],
    experienceMin: role.experienceMin,
    experienceMax: role.experienceMax,
    skillsCsv: (role.skills ?? []).join(', '),
    ctcMin: Number(role.ctcMin),
    ctcMax: Number(role.ctcMax),
    payoutType: role.payoutType,
    shortlistPayoutValue: role.shortlistPayoutValue ? Number(role.shortlistPayoutValue) : undefined,
    hirePayoutValue: role.hirePayoutValue ? Number(role.hirePayoutValue) : undefined,
    maxSubmissions: role.maxSubmissions,
    maxPerRecruiter: role.maxPerRecruiter,
    openPositions: role.openPositions,
    jdS3Key: null,
    jdOriginalFilename: role.jdOriginalFilename ?? null,
    jdSizeBytes: role.jdSizeBytes ?? null,
    jdMimeType: role.jdMimeType ?? null,
  };
}

export default function RoleEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const query = useRole(id);
  const update = useUpdateRole(id ?? '');

  const role = query.data;
  const editable =
    role?.status === RoleStatus.DRAFT || role?.status === RoleStatus.PAUSED;

  const onSubmit = (values: RoleFormValues) => {
    update.mutate(toCreatePayload(values), {
      onSuccess: () => {
        toast.success('Role updated');
        navigate(`/c/roles/${id}`);
      },
      onError: (err) => {
        toast.error(extractErrorMessage(err, 'Could not update role'));
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageTitle>Edit Role</PageTitle>
          <PageDescription>
            {editable
              ? 'You can edit a role while it is in draft or paused status.'
              : 'Pause this role first to make edits.'}
          </PageDescription>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Role details</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : query.isError ? (
            <p className="text-sm text-destructive">
              {extractErrorMessage(query.error, 'Could not load role')}
            </p>
          ) : role ? (
            <RoleForm
              initial={roleToFormValues(role) ?? DEFAULT_ROLE_FORM}
              submitLabel="Save changes"
              disabled={!editable}
              isSubmitting={update.isPending}
              onSubmit={onSubmit}
              onCancel={() => navigate(`/c/roles/${id}`)}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
