export interface FeatureFlags {
  analytics_dashboards: boolean;
  analytics_ai: boolean;
  matching_ai: boolean;
}

export interface FeatureFlagRecord {
  id: string;
  key: string;
  enabled: boolean;
  scope: 'GLOBAL' | 'COMPANY' | 'RECRUITER';
  scopeId: string;
  createdAt: string;
  updatedAt: string;
}
