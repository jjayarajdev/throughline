import api from "@/lib/axiosInstance";
import { CandidateDetailsTypes } from "@/components/slot-management/types";
import { isDomainManager, isHiringManager } from "@/store/userStore";

export const slotApi = {
  getScreenlist: async () => {
    const response = await api.get(`/CandidateForm/candidates/screening-list`);
    return response.data.data;
  },
  getScreenlistPartner: async (partnerId: string) => {
    const response = await api.get(
      `/CandidateForm/candidates/interview-slot-notifications/${partnerId}`
    );
    return response.data.data;
  },

  getInterviewList: async () => {
    const response = await api.get(`/CandidateForm/candidates/interview-list`);
    return response.data.data;
  },

  assigSlot: async (data: CandidateDetailsTypes) => {
    const response = await api.post(
      "/CandidateForm/assign-interview-slots",
      data
    );
    return response.data;
  },
  updateassigSlot: async (data: CandidateDetailsTypes) => {
    const response = await api.put(
      "/CandidateForm/partner/edit-interview-slot",
      data
    );
    return response.data;
  },

  screeningAccept: async (data: screeningAccept) => {
    const response = await api.patch(
      "/CandidateForm/update-screening-status",
      data
    );
    return response.data;
  },

  acceptSlot: async (data: acceptSlot) => {
    const response = await api.put(
      "/CandidateForm/partner/accept-interview-slot",
      data
    );
    return response.data;
  },
  confirmInterview: async (data: confirmInterview) => {
    const response = await api.put(
      "/CandidateForm/partner/update-interview-status",
      data
    );
    return response.data;
  },

  addFeedbackInterviewList: async (data: addFeedback) => {
    const response = await api.post(
      "/CandidateForm/update-interview-feedback",
      data
    );
    return response.data;
  },
  transferCandidate: async (data: addFeedback) => {
    const response = await api.patch("/HiringRequest/transfer-candidate", data);
    return response.data;
  },

  submitPanelFeedback: async (data: FeedbackPayload) => {
    const response = await api.post("/Panel", data);
    return response.data;
  },

  getpanelFeedback: async (id: number) => {
    const response = await api.get(`/Panel/feedback?interviewSlotId=${id}`);

    return response.data;
  },

  getScreeningList: async (
    params: PaginationPayload,
  ) => {
    let url = `/CandidateForm/candidates/screening-list`;
    const response = await api.post(url, params);
    return response.data;
  },
  getParnterSlot: async (id: number, params: PaginationPayload) => {
    const response = await api.post(
      `/CandidateForm/candidates/interview-slot-notifications?partnerId=${id}`,
      params
    );
    return response.data;
  },

  getCompletedInterview: async (params: PaginationPayload) => {
    const response = await api.post(
      `/CandidateForm/candidates/selected-list`,
      params
    );
    return response.data;
  },
  getUnallocatedCandidate: async (params: PaginationPayload,durationId:number) => {
    const response = await api.post(
      `/CandidateForm/partner/unallocated-candidate-list?durationId=${durationId}`,
      params
    );
    return response.data;
  },
  getFeedbackPending: async (
    params: PaginationPayload,
  ) => {
    let url = `/CandidateForm/candidates/interview-feedback-pending`;
    const response = await api.post(
      url,
      params
    );
    return response.data;
  },

  getInterviewLists: async (
    params: PaginationPayload
  ) => {
    const response = await api.post(
      `/CandidateForm/candidates/interview-list`,
      params
    );
    return response.data;
  },
  getPartnerSlot: async (
    id: number,
    partnerId: number,
    params: PaginationPayload,
    durationId: number
  ) => {
    let url = `/CandidateForm/candidates/interview-slot-notifications`;
    if (partnerId === 0) {
      url += `?categoryId=${id}&durationId=${durationId}`;
    } else {
      url += `?partnerId=${partnerId}&categoryId=${id}&durationId=${durationId}`;
    }
    const response = await api.post(url, params);
    return response.data;
  },
};

export interface PaginationPayload {
  pageNumber: number;
  pageSize: number;
  searchColumn?: string;
  searchText?: string;
}
export interface screeningAccept {
  candidateId: number;
  currentRoundId: number;
  screeningStatus: boolean;
  comments: string;
}
export interface AssignSlotPayload {
  hiringRequestId?: number;
  candidateId?: number;
  date?: string;
  time?: string;
  partnerId?: number;
  currentRoundId?: number;
  panelMember?: string | undefined;
  isRescheduled?: boolean;
  interviewStatusId?: number;
  duration?: string;
  panelName?: string[];
  isReschedule?: boolean;
}

export interface acceptSlot {
  isAccepted: boolean;
  comments: string;
  interviewSlotId: number | string;
}
export interface confirmInterview {
  interviewSlotId: number | string;
  isInterviewCompleted: boolean;
  resheduledOrDropped: number;
  resheduleIntiatedBy: number;
  partnerInterviewCompletedComments: string;
}
export interface addFeedback {
  id: number;
  interviewStatusId: string;
  feedback: string;
}
export type FeedbackPayloadItem = {
  interviewSlotId: number;
  candidateId: number;
  feedbackCategoryId: number;
  criteriaOptionId: number;
  rating: number;
  comments: string;
  isActive: boolean;
};

export type FeedbackPayload = FeedbackPayloadItem[];
