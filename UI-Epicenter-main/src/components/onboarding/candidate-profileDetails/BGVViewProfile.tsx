'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, FileText, FileDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InfoBlock from './InfoBlock';
import { useQuery } from '@tanstack/react-query';
import { MasterTypes } from '@/constants/masterTypes';
import { dropdownApi } from '@/services/api/master';
import { isPartner } from '@/store/userStore';
import { TatIndicator } from '../ITPCSetup';


interface Attachment {
  attachmentName?: string;
  attachmentURL?: string;
}

interface BGVProfileData {
  startDate?: string;
  vendorName?: string;
  pguName?: string;
  ndaAvailability?: boolean;
  cdaAvailability?: boolean;
  ndaAvailabilityDoc?: Attachment;
  cdaAvailabilityDoc?: Attachment;
  isBGVAvailableWithPartner?: boolean;
  bgvCompletionDate?: string;
  bgvCategoryId?: string;
  bgvStatusId?: string;
  uploadBGVDoc?: Attachment;
  candidateBGVCompleted?:boolean;
  comments?:string;
}
interface IProps{
  personalDetails:any
}
export default function BGVViewProfile({ candidateData,personalDetails }: { candidateData: BGVProfileData ,personalDetails:IProps}) {

  
   const { data: bgvCategory = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_CATEGORY],
    queryFn: async () => {
      const res = await dropdownApi.fetchDropdown(MasterTypes.BGV_CATEGORY);
      return res;
    },
    retry: 1,
  });

  const { data: bgvStatusTypes = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_STATUS_TYPES],
    queryFn: async () => {
      const res = await dropdownApi.fetchDropdown(MasterTypes.BGV_STATUS_TYPES);
      return res;
    },
    retry: 1,
  });

   const categoryName = getLabelById(bgvCategory, Number(candidateData?.bgvCategoryId));
     const bgvStatusName = getLabelById(bgvStatusTypes, Number(candidateData?.bgvStatusId));
  return (
    <Card className="shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <ShieldCheck className="h-6 w-6 mr-2 text-green-600" />
          Background Verification (BGV)
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-10">

        {/* ✅ Section 1: Basic Information */}
        <div>
           {!isPartner && <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
                  <div>
                   {/* <h3 className="text-sm font-medium text-gray-600">Background Verification TAT</h3> */}
                    <p className="text-sm text-gray-900">
                     <TatIndicator
                      startDate={personalDetails?.dateOfJoining}
                      endDate={candidateData?.bgvCompletionDate}
                      />
                    </p>
                  </div>
                </div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoBlock label="Start Date" value={formatDate(candidateData?.startDate)} />
            <InfoBlock label="Vendor" value={candidateData?.vendorName || 'N/A'} />
            <InfoBlock label="PGU ID" value={candidateData?.pguName || 'N/A'} />
            <InfoBlock label="NDA Availability" value={renderBool(candidateData?.ndaAvailability)} />
            <InfoBlock label="CDA Availability" value={renderBool(candidateData?.cdaAvailability)} />
          </div>
    <div className="flex gap-6 mt-4">

  <div className="space-y-4 max-w-[540px] flex-1">
    {candidateData?.ndaAvailabilityDoc?.attachmentName && (
      <DownloadRow
        label="NDA Document"
        doc={candidateData.ndaAvailabilityDoc}
      />
    )}
    {candidateData?.cdaAvailabilityDoc?.attachmentName && (
      <DownloadRow
        label="CDA Document"
        doc={candidateData.cdaAvailabilityDoc}
      />
    )}
  </div>

  {/* Right: Action By + Comments */}
  <div className="w-[550px] border rounded-lg p-3 space-y-2">
    <h3 className="text-sm font-semibold">Status</h3>
   <p
  className={`${
    candidateData?.candidateBGVCompleted ? "text-green-700" : "text-red-700"
  } text-base font-bold`}
>
  {candidateData?.candidateBGVCompleted ? "Accept" : "Reject"}
</p>


    <h3 className="text-sm font-semibold mt-3">Comments</h3>
    <textarea
      placeholder="Add comments..."
      className="w-full text-lg font-medium leading-relaxed border rounded p-2"
      value={candidateData?.comments}
      rows={4}
    />
  </div>
</div>

        </div>

        {/* ✅ Section 2: BGV Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">BGV Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoBlock
              label="BGV Available With Partner"
              value={renderBool(candidateData?.isBGVAvailableWithPartner)}
            />
            <InfoBlock
              label="BGV Completion Date"
              value={formatDate(candidateData?.bgvCompletionDate)}
            />
            <InfoBlock
              label="BGV Category ID"
              value={categoryName || 'N/A'}
            />
            <InfoBlock
              label="BGV Status ID"
              value={bgvStatusName || 'N/A'}
            />
          </div>

          <div className="space-y-4 mt-4">
            {candidateData?.uploadBGVDoc?.attachmentName && (
              <DownloadRow label="BGV Document" doc={candidateData.uploadBGVDoc} />
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

// Utils
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderBool(value?: boolean): string {
  if (value === true) return 'Yes ✅';
  if (value === false) return 'No ❌';
  return 'N/A';
}

function DownloadRow({ label, doc }: { label: string; doc: Attachment }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-muted">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium flex-1 truncate">
        {label}: {doc.attachmentName}
      </span>
      <Button variant="outline" size="sm" asChild>
        <a href={doc.attachmentURL} target="_blank" rel="noopener noreferrer">
           <Download className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
function getLabelById(list: { id: number; name: string }[], id?: number): string {
  if (!id) return "N/A";
  const item = list.find(option => option.id === Number(id));
  return item?.name || "N/A";
}