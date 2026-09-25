import api from "@/lib/axiosInstance";
import axios from "axios";
import { PagedResponse } from "./partner.profile.api";

export const hiringApi = {
  getHiringByID: async (rcmsID: string, projectId: string) => {
    try {
      const res = await api.get(`/RCMS/${rcmsID}/${projectId}`);
      return res?.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response?.data;
      }
      return error;
    }
  },
  getHiringReplica: async (id: string) => {
    try {
      const response = await api.get(`/HiringRequest/hiring/${id}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response?.data;
      }
      return error;
    }
  },
  gethiringDetailByID: async (id: number) => {
    const response = await api.get(`/HiringRequest/${id}`);
    return response.data?.data;
  },
  getHiringView: async (hrqId: string) => {
    const response = await api.get(`/HiringRequest/view/${hrqId}`);
    return response.data?.data;
  },
  getBETeamApprover: async () => {
    const response = await api.get(`/User/get-bet-approver`);
    return response.data?.data;
  },

  getHiringProfile: async (id: string) => {
    const response = await api.get(`/HiringRequest/hiring-profile?hrqId=${id}`);
    return response?.data?.data;
  },
  getCandidates: async (id: string) => {
    const response = await api.get(
      `/CandidateForm/candidatelist/hiringid/${id}`
    );
    return response.data?.data;
  },

  ApprovedBintoCart: async (
    params: ApprovalPayload
  ): Promise<binToCartResponse> => {
    const response = await api.patch(`/HiringRequest/approval`, params);
    return response.data;
  },
  hiringAcceptrmOwner: async (id: number, userid: number) => {
    const response = await api.patch(
      `/HiringRequest/rm-owner-accept?hiringRequestId=${id}&rmOwnerId=${userid}`
    );
    return response.data;
  },

  getHiringBin: async (
    params: HiringPageRequest
  ): Promise<PagedResponse<Hiring>> => {
    const response = await api.post(`/HiringRequest/paged`, params);
    return response.data;
  },
  getHiringCart: async (
    params: HiringPageRequest,
  ): Promise<PagedResponse<Hiring>> => {
    const response = await api.post('HiringRequest/paged', params);
    return response.data;
  },
  downloadExcel: async (
    statusId?: number,
    userId?: number,
    durationId?: number,
    fyears?: number,
    quarterId?: number,
    showAssigned?: boolean
  ): Promise<PagedResponse<Hiring>> => {
    let url = "";
    if (statusId !== 1) {
      if (durationId === 0) {
        url = `/HiringRequest/download-all-excel?isAssigned=${showAssigned}&hiringStatusId=${statusId}&financialYearStart=${fyears}&quarterId=${quarterId}&userId=${userId}`;
      } else {
        url = `/HiringRequest/download-all-excel?isAssigned=${showAssigned}&hiringStatusId=${statusId}&durationId=${durationId}&financialYearStart=${fyears}&quarterId=${quarterId}&userId=${userId}`;
      }
    } else {
      if (durationId === 0) {
        url = `/HiringRequest/download-all-excel?isAssigned=${showAssigned}&financialYearStart=${fyears}&quarterId=${quarterId}&userId=${userId}`;
      } else {
        url = `/HiringRequest/download-all-excel?isAssigned=${showAssigned}&durationId=${durationId}&financialYearStart=${fyears}&quarterId=${quarterId}&userId=${userId}`;
      }
    }
    const response = await api.get(url, {
      responseType: "blob",
      headers: { accept: "*/*" },
    });
    return response.data;
  },
  createHiring: async (data: HiringReqPayload) => {
    const response = await api.post("/HiringRequest", data);
    return response.data;
  },
  updateHiring: async (id: number, data: HiringReqPayload) => {
    const response = await api.put(`/HiringRequest/${id}`, data);
    return response.data;
  },
  createJobDetails: async (data: JobDetailsPayload) => {
    const response = await api.post("/JobDetails", data);
    return response.data;
  },
  getJobDetails: async (id: number) => {
    const response = await api.get(`/JobDetails/hiring/${id}`);
    return response.data?.data;
  },
  updateJobDetails: async (id: number, data: JobDetailsPayload) => {
    const response = await api.put(`/JobDetails/${id}`, data);
    return response.data;
  },

  CreatePartnerCategories: async (data: PartnerCategoriesPayload) => {
    const response = await api.post("/PartnerCategory ", data);

    return response.data;
  },
  getPartnerCategory: async (id: number) => {
    const response = await api.get(`/PartnerCategory/hiring/${id}`);
    return response.data?.data;
  },
  getInterviewRounds: async (id: number) => {
    const response = await api.get(
      `/InterviewRound/list/?hiringRequestId=${id}`
    );
    return response.data?.data;
  },

  updatePartnerCategories: async (
    id: number,
    data: PartnerCategoriesPayload
  ) => {
    const response = await api.put(`/PartnerCategory/${id}`, data);
    return response.data;
  },
  createInterviewRounds: async (data: InterviewRoundPayload) => {
    const response = await api.post("/InterviewRound ", data);
    return response.data;
  },
  updateInterviews: async (id: number, data: InterviewRoundPayload) => {
    const response = await api.put(`/InterviewRound/${id}`, data);
    return response.data;
  },

  createCalibration: async (data: createCalibrationPayload) => {
    const response = await api.post("/Calibration ", data);
    return response.data;
  },
  getCalibrations: async (id: number) => {
    const response = await api.get(`/Calibration/list/${id}`);
    return response.data?.data;
  },

  updateCalibration: async (id: number, data: createCalibrationPayload) => {
    const response = await api.put(`/Calibration/${id}`, data);
    return response.data;
  },
  getDashboard: async () => {
    const response = await api.get(`/dashboard`);
    return response.data.data;
  },

  changeHiringStatus: async (
    hiringId: number,
    statusid: number
  ): Promise<binToCartResponse> => {
    const response = await api.patch(
      `/HiringRequest/toggle?hiringRequestId=${hiringId}&hiringStatusId=${statusid}`
    );
    return response.data;
  },
  changeRmowner: async (
    hiringId: number,
    rmOwnerId: number
  ): Promise<binToCartResponse> => {
    const response = await api.patch(
      `/HiringRequest/rm-owner-accept?hiringRequestId=${hiringId}&rmOwnerId=${rmOwnerId}`
    );
    return response.data;
  },

  //getHiringRequestFOr Partners
  getHiringRequestForPartners: async (params: any, partnerId: number) => {
    const response = await api.post(
      `/HiringRequest/partner-hrqs?partnerId=${partnerId}`,
      params
    );
    return response.data;
  },
  addSkills: async (type: number, data: addSkillPayload) => {
    const response = await api.post(`/Master/${type}`, data);
    return response.data;
  },
  addHiringPositions: async (data: {
    parentHiringRequestId: number;
    noOfPositions: number;
  }) => {
    const response = await api.post(`/HiringRequest/add-child-hrqs`, data);
    return response.data;
  },
  holdHiringRequest: async (data: any) => {
    const response = await api.patch(
      `HiringRequest/onhold/${data?.hiringRequestId}`,
      data
    );
    return response.data;
  },
};

export interface addSkillPayload {
  isActive: boolean;
  name: string;
  isPrimary: boolean;
}
export interface createCalibrationPayload {
  hrqId?: string;
  jobTitle?: string;
  attendees?: string;
  calibrationDate: string;
  primarySkills?: string;
  secondarySkills?: string;
  certifications?: string;
  comments?: string;
  hiringRequestId: number;
}
export interface InterviewRoundPayload {
  screeningCap: string | undefined;
  availableDays: never[];
  skipScreening: boolean;
  id: number;
  Criteria?: number[]; // feedback criteria IDs
  hiringRequestId?: number;
  roundNumber?: number;
  roundNameId?: number;
  panelName?: string[]; // email addresses
  modeOfInterview?: number;
  comments?: string;
  isAddSpecificCandidates?: boolean;
  candidates?: number[]; // candidate IDs
  addFeedbackCritria?: boolean;
  categoryId?: number;
  feedbackCritriaOptions?: {
    criteriaOptionId: number;
    name: string;
  }[];
  roundName?: string;
  panel?: number[]; // panel member IDs
  isActive?: boolean; // Optional, defaults to true
}
interface binToCartResponse {
  status: boolean;
  message: string;
  data: string;
}
export interface HiringPageRequest {
  pageNumber: number;
  pageSize: number;
  searchColumn?: string;
  searchText?: string;
  showAssigned?: boolean; // Optional, defaults to false
  statusId?: number;
  durationId?: number;
  fyears?: number;
  quarterId?: number;
  hiringStatusId?: number[];
}
interface ApprovalPayload {
  id: number;
  approverComments: string;
  approvalStatusId: number;
}
export interface HiringPageResponse<T> {
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
export interface Hiring {
  tatEndDate(
    tatDate: string | number | Date | undefined,
    tatEndDate: any
  ): string;
  hiringMangerId: number | undefined;
  parentHrqId: any;
  requestCreationDate: string | number | Date;
  approverUpdatedDate: any;
  isRMOwnerAccepted: any;
  tatDate?: string | number | Date;
  hiringStatusId?: number;
  domainId(domainId: any): string | undefined;
  id?: number;
  hrqId?: string;
  businessName?: string;
  rcMsProjectId?: string;
  rcMsResourceRequestId?: string;
  projectName?: string;
  requestStartDate?: string;
  hiringStatusName?: string;
  jobTitle?: string;
  recordTypeName?: string;
  rmOwnerId?: number;
  requestor?: string;
  rmOwner?: string;
  approverEmail?: string;
  rmOwnerName?: string;
  hiringManagerName?: string;
  businessId?: number;
  rcmsProjectId?: string;
  isMultiplePositions: boolean;
  numberOfPositions: number;
  hiringTypeId: number;
  projectDurationMonths: number;
  employeeId: string;
  referredHrqId: string;
  requestorName?: string;
  betApproverName?: string;
  totalHeadCount?: number;
  currentStatusHeadCount?: number;
}

export interface HiringReqPayload {
  jobTitle?: string;
  rmOwnerName?: string;
  hiringManagerName?: string;
  hrqId?: string;
  rcmsProjectId?: string;
  rcMsResourceRequestId?: string;
  projectName?: string;
  businessId?: string;
  requestStartDate?: string;
  requestCreationDate?: string;
  hiringTypeId?: string;
  projectDurationMonths?: string;
  hiringStatusName?: string;
  isMultiplePositions?: boolean;
  numberOfPositions?: number;
  approverEmail?: string;
}

interface JobDetailsPayload {
  id: string;
  isActive: boolean;
  jobDescription?: string;
  hiringActivityId?: number;
  jobPriorityId?: number;
  hiringDate?: string;
  jobLevelId?: number;
  relevantExperience?: number;
  totalExperience?: number;
  resourceTypeId?: number;
  countryId?: number;
  stateId?: number;
  primaryCityId?: number;
  secondaryCityId?: number | string;
  domainId?: number;
  subDomainId?: number;
  domainManagerId?: number;
  subDomainManagerId?: number;
  primarySkills?: number[];
  secondarySkills?: number[];
  mandatoryCertification?: string;
  hiringRequestId?: number;
}
export interface PartnerCategoriesPayload {
  isSpecificPartner: boolean;
  isProxyPartner: boolean;
  isRecommendThePartner: boolean;
  selectedPartners: number[]; // array of partner IDs
  profileCAP: number;
  comments: string;
}
