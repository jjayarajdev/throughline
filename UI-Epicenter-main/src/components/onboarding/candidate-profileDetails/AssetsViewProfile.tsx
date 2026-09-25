'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Building, Settings, Timer } from 'lucide-react';
import InfoBlock from './InfoBlock';
import { useQuery } from '@tanstack/react-query';
import { MasterTypes } from '@/constants/masterTypes';
import { onboarding } from '@/services/api/onboarding.api';
import { isPartner } from '@/store/userStore';
import { useEffect, useState } from 'react';
import { differenceInCalendarDays, isValid } from 'date-fns';
import { TatIndicator } from '../ITPCSetup';

interface AssetProfileData {
  pcRequestCreatedDate?: string;
  pcRequestRefNo?: string;
  pcSerialNo?: string;
  pcAllocationDate?: string;
  modeOfPcShipmentId?: number;
  modeOfPcShipmentName?: string;
  pcReceivedOn?: string;
  pcConfigurationDate?: string;
  itAssetStatusID?: number;
  itAssetStatusName?: string;
  complianceFollowedId?: number;
  complianceFollowedName?: string;
  delayCategoryName?: string;
  pcIssueTat?: number;
  releaseToOperationsTat?: number;
  tatOnFinalConfiguration?: number;
  comments?: string;
  isJoinConfirmed?:boolean;
  isPCAllocated?:boolean
}

interface IProps{
  personalDetails:any
}

export default function AssetsViewProfile({
  candidateData,
  personalDetails
}: {
  candidateData: AssetProfileData;
  personalDetails:IProps
}) {
  
 
  const { data: pcShipmentOptions = [] } = useQuery({
    queryKey: ['getPcShipmentModes', MasterTypes.PC_SHIPMENT_MODE],
    queryFn: () =>
      onboarding.getEmployeeCategory(MasterTypes.PC_SHIPMENT_MODE).then((res) => res.data),
    retry: 1,
  });

  const { data: itAssetStatusOptions = [] } = useQuery({
    queryKey: ['getItAssetStatus', MasterTypes.IT_ASSET_STATUS],
    queryFn: () =>
      onboarding.getEmployeeCategory(MasterTypes.IT_ASSET_STATUS).then((res) => res.data),
    retry: 1,
  });

  const { data: complianceOptions = [] } = useQuery({
    queryKey: ['getComplianceOptions', MasterTypes.YES_OR_NO],
    queryFn: () =>
      onboarding.getEmployeeCategory(MasterTypes.YES_OR_NO).then((res) => res.data),
    retry: 1,
  });

  const shipmentLabel = getLabelById(pcShipmentOptions, candidateData?.modeOfPcShipmentId);
  const assetStatusLabel = getLabelById(itAssetStatusOptions, candidateData?.itAssetStatusID);
  const complianceLabel = getLabelById(complianceOptions, candidateData?.complianceFollowedId);

  return (
    <Card>
      <CardHeader>
  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
    <CardTitle className="flex items-center">
      <Building className="h-5 w-5 mr-2" />
      Asset Details
    </CardTitle>

    {!isPartner&&<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full md:w-auto">
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-900 shadow">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
          <Timer className="w-5 h-5 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">PC Allocation TAT</p>
          <p className="text-lg font-semibold text-gray-800 dark:text-white">
          <TatIndicator
            startDate={personalDetails?.dateOfJoining}
            endDate={candidateData?.pcAllocationDate}
            />
          </p>
        </div>
      </div>

      {/* PC Configuration TAT */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-900 shadow">
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
          <Settings className="w-5 h-5 text-purple-600 dark:text-purple-300" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">PC Configuration TAT</p>
          <p className="text-lg font-semibold text-gray-800 dark:text-white">
           <TatIndicator
            startDate={personalDetails?.dateOfJoining}
            endDate={candidateData?.pcConfigurationDate}
            />
          </p>
        </div>
      </div>
    </div>}
  </div>
</CardHeader>

     <CardContent>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <InfoBlock
      label="Join Confirmed"
      value={candidateData?.isJoinConfirmed ? "Yes" : "No"}
    />
    <InfoBlock
      label="PC Allocated"
      value={candidateData?.isPCAllocated ? "Yes" : "No"}
    />
    <InfoBlock
      label="PC Request Created Date"
      value={formatDate(candidateData?.pcRequestCreatedDate)}
    />
    <InfoBlock
      label="PC Request Ref No."
      value={candidateData?.pcRequestRefNo || "N/A"}
    />
    <InfoBlock
      label="PC Serial No."
      value={candidateData?.pcSerialNo || "N/A"}
    />
    <InfoBlock
      label="PC Allocation Date"
      value={formatDate(candidateData?.pcAllocationDate)}
    />
    <InfoBlock
      label="Mode of PC Shipment"
      value={shipmentLabel || "N/A"}
    />
    <InfoBlock
      label="PC Received On"
      value={formatDate(candidateData?.pcReceivedOn)}
    />
    <InfoBlock
      label="PC Configuration Date"
      value={formatDate(candidateData?.pcConfigurationDate)}
    />
    <InfoBlock
      label="IT Asset Status"
      value={assetStatusLabel || "N/A"}
    />
    <InfoBlock
      label="Compliance Followed"
      value={candidateData?.complianceFollowedName || "N/A"}
    />
    <InfoBlock
      label="Delay Category"
      value={candidateData?.delayCategoryName || "N/A"}
    />
  </div>

  {candidateData?.comments && (
    <div className="mt-6">
      <p className="text-sm font-medium text-muted-foreground mb-2">Comments</p>
      <p className="text-base bg-muted p-3 rounded-md">{candidateData.comments}</p>
    </div>
  )}
</CardContent>

    </Card>
  );
}

function getLabelById(list: { id: number; name: string }[], id?: number): string {
  if (!id) return 'N/A';
  const item = list.find((option) => option.id === Number(id));
  return item?.name || 'N/A';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
