import { Navigate } from 'react-router-dom';
import { useFeatureFlags, type FeatureFlags } from '@/features/feature-flags';

interface FeatureGateProps {
  flag: keyof FeatureFlags;
  fallback: string;
  children: React.ReactNode;
}

export function FeatureGate({ flag, fallback, children }: FeatureGateProps) {
  const flags = useFeatureFlags();

  if (!flags[flag]) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
