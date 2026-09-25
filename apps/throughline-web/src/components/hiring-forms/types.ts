export interface getHiringType {
  hiringMangerId(hiringMangerId: any): string | undefined;
  betApproverName?: string;
  domainManager(domainManager: any): string | undefined;
  domainId(domainId: any): string | undefined;
  rmOwnerName: string;
  jobTitle: string;
  hrqId: string;
  rcMsProjectId: string;
  rcMsResourceRequestId: string;
  projectName: string;
  requestStartDate: string; // ISO date
  requestCreationDate: string; // ISO date
  businessId: number;
  hiringTypeId: number;
  hiringStatusId: number;
  projectDurationMonths: number;
  approverUpdatedDate: string; // ISO date-time
  approverComments: string;
  approvalStatusId: number;
  isSinglePosition: boolean;
  isMultiplePositions: boolean;
  numberOfPositions: number;
  approverEmail: string;
  businessName: string;
  hiringTypeName: string;
  hiringStatusName: string;
  approvalStatusName: string;
  id: number;
  isActive: boolean;
  employeeId: string;
  referredHrqId: string;
  hiringManagerName: string;
  rcmsProjectId: string;
  partnerAssignedDate?: string;
}
export interface HiringSummaryProps {
  hrqid: string;
  jobDetail: string;
  skipScreening?:boolean;
}
