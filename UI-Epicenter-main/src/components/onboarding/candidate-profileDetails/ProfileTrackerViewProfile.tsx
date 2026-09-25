'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck } from 'lucide-react';
import InfoBlock from './InfoBlock';
import { Badge } from '@/components/ui/badge';

interface CandidateProfileData {
  profileCreatedOn?: string;
  smartProfileId?: string;
  profileApprovalDate?: string;
  lhccCode?: string;
  costCenter?: string;
  employeeId?: number;
  employeeNameAsPerId?: string;
  hpeEmailId?: string;
  isEmployeeIdGenerated?: boolean;
  candidatePersonalDetailsId?: number;
  costCenterName?:string
}

export default function ProfileTrackerViewProfile({ candidateData }: { candidateData: CandidateProfileData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileCheck className="h-5 w-5 mr-2" />
          Profile Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoBlock label="Employee ID" value={candidateData?.employeeId?.toString() || 'N/A'} />
          <InfoBlock label="Employee Name As Per ID" value={candidateData?.employeeNameAsPerId || 'N/A'} />
          <InfoBlock label="Company Email ID" value={candidateData?.hpeEmailId || 'N/A'} />
          <InfoBlock label="Smart Profile ID" value={candidateData?.smartProfileId || 'N/A'} />
          <InfoBlock label="LHCC (IN97/IN99)" value={candidateData?.lhccCode || 'N/A'} />
          <InfoBlock label="Cost Center" value={candidateData?.costCenterName || 'N/A'} />
          <InfoBlock label="Profile Created On" value={formatDate(candidateData?.profileCreatedOn)} />
          <InfoBlock label="Profile Approval Date" value={formatDate(candidateData?.profileApprovalDate)} />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Employee ID Generated</p>
            <Badge variant={candidateData?.isEmployeeIdGenerated ? 'default' : 'outline'} className="mt-1">
              {candidateData?.isEmployeeIdGenerated ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
