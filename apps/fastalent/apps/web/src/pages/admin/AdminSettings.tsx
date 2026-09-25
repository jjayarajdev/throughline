import { useState } from 'react';
import { Save, Settings, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { useAdminSettings, useUpdateAdminSetting } from '@/features/admin/hooks';
import { useAdminFeatureFlags, useFlushFeatureFlagCache } from '@/features/feature-flags';
import { toast } from '@/components/ui/sonner';
import { PageHeader, PageTitle, PageDescription } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

const SCOPE_LABELS: Record<string, string> = {
  GLOBAL: 'Global default',
  COMPANY: 'Company override',
  RECRUITER: 'Recruiter override',
};

export default function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const { data: featureFlags, isLoading: ffLoading } = useAdminFeatureFlags();
  const flushCache = useFlushFeatureFlagCache();
  const update = useUpdateAdminSetting();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  function handleSave(key: string) {
    const value = edits[key];
    if (value === undefined) return;
    update.mutate(
      { key, value },
      {
        onSuccess: () => {
          setSaved(key);
          setEdits((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setTimeout(() => setSaved(null), 2000);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader>
          <PageTitle>Platform Settings</PageTitle>
          <PageDescription>Configure platform-wide settings</PageDescription>
        </PageHeader>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader>
        <PageTitle>Platform Settings</PageTitle>
        <PageDescription>Configure platform-wide settings</PageDescription>
      </PageHeader>

      {settings?.length ? (
        <div className="space-y-4">
          {settings.map((s) => {
            const edited = edits[s.key] !== undefined;
            const currentValue = edited ? edits[s.key] : s.value;
            return (
              <Card key={s.key}>
                <CardContent className="pt-6">
                  <div className="mb-1 flex items-center justify-between">
                    <Label className="text-sm font-semibold">{s.key}</Label>
                    {saved === s.key && (
                      <span className="text-xs text-success">Saved</span>
                    )}
                  </div>
                  {s.description && (
                    <p className="mb-2 text-xs text-muted-foreground">{s.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={currentValue}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [s.key]: e.target.value }))
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSave(s.key)}
                      disabled={!edited || update.isPending}
                      size="sm"
                    >
                      <Save className="h-4 w-4" /> Save
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last updated: {new Date(s.updatedAt).toLocaleString('en-IN')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No settings configured" icon={<Settings />} />
      )}

      {/* Feature Flags — read-only status table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Feature Flags</CardTitle>
          <Button
            variant="outline"
            size="sm"
            disabled={flushCache.isPending}
            onClick={() => {
              flushCache.mutate(undefined, {
                onSuccess: (data) => toast.success(`Flushed ${data.flushed} cached flag(s)`),
                onError: () => toast.error('Failed to flush cache'),
              });
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${flushCache.isPending ? 'animate-spin' : ''}`} aria-hidden />
            Flush Cache
          </Button>
        </CardHeader>
        <CardContent>
          {ffLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !featureFlags?.length ? (
            <p className="text-sm text-muted-foreground">No feature flags configured. Run the seed to create defaults.</p>
          ) : (
            <div className="space-y-2">
              {featureFlags.map((ff) => (
                <div
                  key={ff.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {ff.enabled ? (
                      <ToggleRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{ff.key}</p>
                      <p className="text-xs text-muted-foreground">
                        {SCOPE_LABELS[ff.scope] ?? ff.scope}
                        {ff.scope !== 'GLOBAL' && (
                          <span className="ml-1 font-mono text-[10px]">({ff.scopeId.slice(0, 8)}…)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ff.enabled ? 'default' : 'secondary'}>
                    {ff.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
