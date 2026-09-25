import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  height?: number;
  action?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, loading = false, height, action, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full rounded-lg" style={{ height: height ?? 256 }} />
        ) : (
          <div className="w-full" style={{ height: height ?? 256, minHeight: 200 }}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
