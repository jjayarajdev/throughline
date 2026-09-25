
export interface CandidateDetailsTypes {
  hmComments?: string | undefined;
  candidateInterviewStatusId?: any;
  candidateId?: number;
  hrqId?: string;
  candidateCode?: string;
  candidateName?: string;
  jobTitle?: string;
  partnerName?: string;
  partnerId?: number;
  interviewSlotId?: string;
  intakeStatusName?: string;
  currentRoundId?: number;
  hiringRequestId?: number;
  candidateInterviewStatusName?: string;
  interviewStatusId?: number | undefined;
  email?: string;
  date?: string;
  time?: string;
  resume?: string;
  status?: string;
  noticePeriod?: number;
  phone?: string;
  interviewModeName?: string | null | undefined;
  availableDays?: string | string[] | null;
  rejectionCount?: any;
  panelMember?: any;
  duration?: number;
  validityHours?:number;
  tat?:number;
  partnerComments?: string;
  tatDate?: string;
  comments?: string;
  enableCandidateHrqTransfer?: boolean;
  rescheduleCount?: boolean;
  fullName?:string;
  currentRoundName?:string;
  panelNames?:string;
  panel?:string;
  nickname?:string;
}
interface Resume {
  id: number;
  attachmentName: string;
  attachmentURL: string;
}

export interface SelectedCandidate {
  candidateInterviewStatusName: string;
  hiringRequestId: number;
  hrqId: string;
  candidateId: number;
  candidateCode: string;
  candidateName: string;
  jobTitle: string;
  partnerId: number;
  partnerName: string;
  intakeStatusId: number;
  intakeStatusName: string;
  currentRoundId: number;
  currentRoundName: string;
  resume: Resume;
  id: number;
  isActive: boolean;
  rejectionCount:number;
}

export interface Column {
  id: keyof CandidateDetailsTypes | "actions";
  label: string;
  visible: boolean;
  sortable?: boolean;
}

export type SortConfig = {
  key: string;
  direction: "asc" | "desc";
} | null;


