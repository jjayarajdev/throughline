import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { extractErrorMessage } from '@/lib/error';
import { useCreateRole } from '@/features/role/hooks';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom';
import RoleForm from './RoleForm';
import { toCreatePayload, type RoleFormValues } from './role-form-schema';

export default function RoleCreate() {
  const navigate = useNavigate();
  const create = useCreateRole();

  const onSubmit = (values: RoleFormValues) => {
    create.mutate(toCreatePayload(values), {
      onSuccess: (role) => {
        toast.success('Role created as draft');
        navigate(`/c/roles/${role.id}`);
      },
      onError: (err) => {
        toast.error(extractErrorMessage(err, 'Could not create role'));
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageTitle>Post a New Role</PageTitle>
          <PageDescription>
            Roles start as drafts. Publish when you're ready for recruiters to see them.
          </PageDescription>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Role details</CardTitle>
          <CardDescription>
            You can edit everything until the role is published, and again any time it's paused.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleForm
            submitLabel="Save as draft"
            isSubmitting={create.isPending}
            onSubmit={onSubmit}
            onCancel={() => navigate('/c/roles')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
