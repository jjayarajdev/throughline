'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Calendar,
  Upload,
  Download,
  Timer,
  Settings,
  UserCheck,
  BookOpenCheck,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import InfoBlock from './InfoBlock';
import { Badge } from '@/components/ui/badge';
import { MasterTypes } from '@/constants/masterTypes';
import { useQuery } from '@tanstack/react-query';
import { onboarding } from '@/services/api/onboarding.api';
import { isPartner } from '@/store/userStore';
import { useEffect, useState } from 'react';
import { differenceInCalendarDays, isValid } from 'date-fns';
import { TatIndicator } from '../ITPCSetup';

interface Attachment {
  id: number;
  attachmentName: string;
  attachmentURL: string;
}

interface TrainingProfileData {
  trainingSharedOn?: string;
  trainingCompleted?: string;
  orientationDate?: string;
  orientationStatusName?: string;
  rcmsUploadStatusName?: string;
  reasonForReschedule?: string;
  resumeUploaded?: Attachment;
  isTrainingCompleted?: boolean;
  orientationCompletionDate?: string;
  releaseToOperationsDate?: string;
  trainingModuleIds?: number[];
  orientationSharedOn?: string;
  rescheduleOrientationDate?: string;
  sessionTakenByManagerName?: string;
  isMovedToManager?: boolean;
  isOrientationCompleted?: boolean;
}

interface IProps {
  dateOfJoining?: string;
}

export default function TrainingViewProfile({
  candidateData,
  personalDetails
}: {
  candidateData: TrainingProfileData;
  personalDetails: IProps;
}) {
  const { data: TRAINING_MODULE = [], isFetched: isTrainingFetched } = useQuery({
    queryKey: ['getOrientationStatus', MasterTypes.TRAINING_MODULE],
    queryFn: () =>
      onboarding.getEmployeeCategory(MasterTypes.TRAINING_MODULE).then((res) => res.data),
    retry: 1
  });

  const assignedModuleIds = candidateData?.trainingModuleIds || [];

  const completedModules = TRAINING_MODULE.filter((mod) => assignedModuleIds.includes(mod.id));
  const pendingModules = TRAINING_MODULE.filter((mod) => !assignedModuleIds.includes(mod.id));

  return (
    <Card>
  <CardHeader>
    <CardTitle className="flex items-center text-xl font-semibold text-gray-800 dark:text-white">
      <Calendar className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-300" />
      Training Details
    </CardTitle>
  </CardHeader>

  <CardContent className="space-y-6">
    {/* Training Section */}
    <div className="border p-4 rounded-xl shadow-sm">
    {!isPartner &&  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
        <h2 className="text-lg font-semibold">Training</h2>
        <div>
          {/* <p className="text-sm font-medium text-gray-600">Training TAT</p> */}
          <p className="text-sm text-gray-900">
           <TatIndicator
            startDate={personalDetails?.dateOfJoining}
            endDate={candidateData?.trainingCompleted}
                       />
          </p>
        </div>
      </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        <InfoBlock label="Training Shared On" value={formatDate(candidateData?.trainingSharedOn)} />
        <InfoBlock label="Training Completed" value={candidateData?.isTrainingCompleted ? 'Yes' : 'No'} />
        <InfoBlock label="Training Completed Date" value={formatDate(candidateData?.trainingCompleted)} />
      </div>
    </div>

    {/* Release to Operations Section */}
    <div className="border p-4 rounded-xl shadow-sm">
    {!isPartner &&  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
        <h2 className="text-lg font-semibold">Release to Operations</h2>
        <div>
          {/* <p className="text-sm font-medium text-gray-600">Release To Operations TAT</p> */}
          <p className="text-sm text-gray-900">
            <TatIndicator
            startDate={personalDetails?.dateOfJoining}
            endDate={candidateData?.releaseToOperationsDate}
                       />
          </p>
        </div>
      </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <InfoBlock label="Release To Operations Date" value={formatDate(candidateData?.releaseToOperationsDate)} />
        <InfoBlock label="Moved To Manager" value={candidateData?.isMovedToManager ? 'Yes' : 'No'} />
      </div>
    </div>

    {/* Orientation Section */}
    <div className="border p-4 rounded-xl shadow-sm">
      {!isPartner &&<div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
        <h2 className="text-lg font-semibold">Orientation</h2>
        <div>
          {/* <p className="text-sm font-medium text-gray-600">Orientation TAT</p> */}
          <p className="text-sm text-gray-900">
           <TatIndicator
            startDate={personalDetails?.dateOfJoining}
            endDate={candidateData?.orientationCompletionDate}
                       />
          </p>
        </div>
      </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        <InfoBlock label="Orientation Scheduled On Date" value={formatDate(candidateData?.orientationSharedOn)} />
        <InfoBlock label="Orientation Completed" value={candidateData?.isOrientationCompleted ? 'Yes' : 'No'} />
        <InfoBlock label="Orientation Completed" value={formatDate(candidateData?.orientationCompletionDate)} />
        <InfoBlock label="Orientation Status" value={candidateData?.orientationStatusName || 'N/A'} />
        <InfoBlock label="Reschedule Orientation Date" value={formatDate(candidateData?.rescheduleOrientationDate)} />
        <InfoBlock label="Reason for Reschedule" value={candidateData?.reasonForReschedule || 'N/A'} />
        <InfoBlock label="Session Taken By Managers" value={candidateData?.sessionTakenByManagerName || 'N/A'} />
        <InfoBlock label="RCMS Upload Status" value={candidateData?.rcmsUploadStatusName || 'N/A'} />
      </div>
    </div>

    {/* Resume Section */}
     <p className="text-sm font-medium text-muted-foreground mb-2">Resume Uploaded</p>
    {candidateData?.resumeUploaded?.attachmentName && (
      <div className="border p-4 max-w-[540px] rounded-xl shadow-sm">
       
        <div className="flex items-center justify-between space-x-3">
          <div className='flex items-center gap-2'>
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-base">{candidateData.resumeUploaded.attachmentName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (candidateData.resumeUploaded?.attachmentURL) {
                window.open(candidateData.resumeUploaded.attachmentURL, "_blank");
              }
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )}

    {/* Modules */}
    <div className="border p-4 rounded-xl shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
        <BookOpenCheck className="w-4 h-4 text-muted-foreground" />
        All Training Modules
      </h3>
      {isTrainingFetched ? (
        TRAINING_MODULE.length > 0 ? (
          <>
            {completedModules.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-green-600 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Completed
                </p>
                <ul className="ml-6 list-disc space-y-1 text-sm">
                  {completedModules.map((mod) => (
                    <li key={mod.id} className="text-green-600 font-medium">
                      {mod.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingModules.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-500 flex items-center gap-1 mb-1">
                  <XCircle className="w-4 h-4" /> Pending
                </p>
                <ul className="ml-6 list-disc space-y-1 text-sm">
                  {pendingModules.map((mod) => (
                    <li key={mod.id} className="text-red-500 font-medium">
                      {mod.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm italic text-muted-foreground">No modules found.</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground italic">Fetching modules...</p>
      )}
    </div>
  </CardContent>
</Card>

  );
}


// Date Formatter
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

