import api from "@/lib/axiosInstance";
import { PagedRequest } from "./partner.profile.api";

export interface PagedResponse<T> {
  data: {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    currentPage: number;
  };
}

export interface Candidate {
  [x: string]: any;
  isSingleEntry: boolean;
  fullName: string;
  phoneNumber: string;
  email: string;
  skills: number[];
  isDiverse: boolean;
  noticePeriod: number;
  relevantExperience: number;
  currentlyWorking: string;
  currentOrganization: string;
  currentCTC: number;
  lastWorkingDay: string;
  employeeId: string;
  pcLifecycleId: string;
  requestedMicrosoftAccount: boolean;
  consideredForFutureRequirements: boolean;
  isReferred: boolean;
  id: number;
  isActive: boolean;
}

interface candidatePayload {
  id: number;
  isActive: true;
  hiringRequestId: string;
  hrqId: string;
  partnerId: string;
  partnerName: string;
  jobTitle: string;
  hrqStatusId: string;
  intakeStatusId: string;
  resourceTypeId: string;
  isAgreedForTermsConditions: true;
  candidateFormId: string;
}

export const candidateApi = {
  //candidate list BIN
  fetchBinCandidateList: async (
    params: PagedRequest,
    userId: number | null
  ): Promise<PagedResponse<Candidate>> => {
    const response = await api.post(`/CandidateBin/paged/${userId}`, params);
    return response.data;
  },

  fetchCandidateApprovalList: async (
    params: PagedRequest,partnerId?:number
  ): Promise<PagedResponse<Candidate>> => {
    let url =`/CandidateBin/manage-candidate-approval`
    if (partnerId) {
      url += `?partnerId=${partnerId}`;
    }
    const response = await api.post(url,params
    );
    return response.data;
  },

  fetchCandidateList: async (
    params: PagedRequest,
    isBin: boolean,
    partnerId?: number,
    statusId?: number[],
  ): Promise<PagedResponse<Candidate>> => {
let url = `/CandidateForm/paged/${isBin}`;

const query = new URLSearchParams();

if (partnerId) {
  query.append("partnerId", String(partnerId));
}
if (statusId && statusId.length > 0) {
  query.append("intakeStatusId", statusId.join(",")); 
}

const queryString = query.toString();
if (queryString) {
  url += `?${queryString}`;
}
    const response = await api.post(url, params);
    return response.data;
  },

  fetchCandidate: async (id: number) => {
    const res = await api.get(`/Candidate/${id}`);
    return res.data.data;
  },

  fetchCandidateDetails: async (id: number) => {
    const res = await api.get(`/CandidateForm/${id}`);
    return res.data.data;
  },

  //candidate review details
  fetchCandidateReviewDetails: async (id: number) => {
    const res = await api.get(`/CandidateBin/${id}`);
    return res.data.data;
  },

  //update candidate review details
  updateReviewCandidate: async (id: number, data: any) => {
    const response = await api.put(`/CandidateBin/${id}`, data);
    return response.data;
  },

  fetchCandidateStatus: async () => {
    const res = await api.get("/Master/3");
    return res.data.data;
  },

  //candidate Profile
  candidateProfile: async (id: string) => {
    const res = await api.get(`/CandidateForm/profile/${id}`);
    return res.data.data;
  },

  //candidate intake
  createCandidateIntake: async (data: candidatePayload) => {
    const response = await api.post("/CandidateIntake", data);
    return response.data;
  },

  //candidate form

  createCandidateUserIdBased: async (data: any, userId: number | null) => {
    const response = await api.post(`/CandidateBin/single/${userId}`, data);
    return response.data;
  },

  createCandiate: async (data: any) => {
    const response = await api.post("/CandidateForm", data);
    return response.data;
  },

  updateCandidate: async (id: number, data: any) => {
    const response = await api.put(`/CandidateForm/${id}`, data);
    return response.data;
  },

  getHrqid: async (partnerId: number | null) => {
    if (partnerId) {
      const response = await api.get(`/Master/52?partnerId=${partnerId}`);
      return response.data.data;
    } else {
      const response = await api.get(`/Master/52?partnerId=`);
      return response.data.data;
    }
  },
   getCandidateFeedback: async (candidateId: string) => {
    const response = await api.get(`/CandidateForm/candidate-feedback-details?candidateId=${candidateId}`);
    return response.data?.data;
  },
  fetchBinCandidateHistory: async (
  params: PagedRequest,
  intakeStatusId?: number
): Promise<PagedResponse<Candidate>> => {
  let url = `/CandidateForm/all-candidates/paged`;
    url += `?intakeStatusId=${intakeStatusId}`;
   const response = await api.post(url, params);
  return response.data;
},
};
