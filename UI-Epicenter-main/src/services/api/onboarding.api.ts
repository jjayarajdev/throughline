import api from "@/lib/axiosInstance";
import { HiringPageRequest } from "./hiring.api";


export const onboarding = {
  createOnboarding: async (data: any, endpoint: string) => {
    const response = await api.post(`/onboarding${endpoint}`, data);
    return response.data;
  },

  updateOnboarding: async (id: number, data: any, endpoint: string) => {
    const response = await api.put(`/onboarding${endpoint}/${id}`, data);
    return response.data;
  },
  getCandidatePersonalDetails: async (id: number) => {
    const res = await api.get(`/onboarding/CandidatePersonalDetails/${id}`);
    return res.data.data;
  },
  getProfileTracker: async (id: number) => {
    const res = await api.get(`/onboarding/ProfileTracker/${id}`);
    return res.data.data;
  },
  getAssetDetails: async (id: number) => {
    const res = await api.get(`/onboarding/AssetDetails/${id}`);
    return res.data.data;
  },
  getTrainingDetails: async (id: number) => {
    const res = await api.get(`/onboarding/TrainingDetails/${id}`);
    return res.data.data;
  },
  getCandidateBgvDetails: async (id: number) => {
    const res = await api.get(`/onboarding/CandidateBgv/${id}`);
    return res.data.data;
  },
  getOnboarding: async (id: number) => {
    const response = await api.get(`/CandidateOnboarding/${id}`);
    return response.data;
  },
  getAllOnboarding: async (statusId: number, params: HiringPageRequest) => {
    const response = await api.post(
      `/CandidateOnboarding/paged/${statusId}`,
      params
    );
    return response.data;
  },
  getEmployeeCategory: async (type: number, params?: object) => {
    const response = await api.get(`/Master/${type}`, { params });
    return response.data;
  },
  getCandidateFormById: async (id: string) => {
    const response = await api.get(`/CandidateForm/details/${id}`);
    return response.data;
  },
  createCandidateBgv: async (data: any) => {
    const response = await api.post(`/CandidateBgv`, data);
    return response.data;
  },
  updateCandidateBgv: async (id: number, data: any) => {
    const response = await api.put(`/CandidateBgv/${id}`, data);
    return response.data;
  },
  getCandidateBgv: async (id: number) => {
    const response = await api.put(`/CandidateBgv/${id}`);
    return response.data;
  },
  getAllTypeCandidates: async (url:string,params: HiringPageRequest) => {
    const response = await api.post(url,params);
    return response.data;
  },
  moveToRec: async (data: any) => {
    const response = await api.post("/CandidateForm/move-to-hrq", data);
    return response.data;
  },
  moveToOnboarding: async (data: any) => {
    const response = await api.post(
      "/CandidateForm/move-to-offer-rolled-out",
      data
    );
    return response.data;
  },
  offerAcceptance: async (data: any) => {
    const response = await api.post(
      "/CandidateForm/candidate-confirm-offer",
      data
    );
    return response.data;
  },
  joiningConfirmation: async (data: any) => {
    const response = await api.post(
      "/CandidateForm/candidate-joining-confirmation",
      data
    );
    return response.data;
  },
  getRateCard: async (id: number|null|undefined) => {
    const res = await api.get(`/CandidateForm/rate-card/${id}`);
    return res.data.data;
  },getSow: async (partnerId: string,) => {
        const response = await api.get(`/SOW/${partnerId}`);
        return response.data.data;
    },getPo: async (id: number) => {
        const response = await api.get(`/SOW/poDetails/${id}`);
        return response.data.data;
    },
  submitBGVVerification: async (data: {
  candidateId: number;
  hiringRequestId: number;
  candidatePersonalDetailsId: number;
  candidateBGVCompleted: boolean;
}) => {
  const response = await api.post("/onboarding/CandidatePersonalDetails/submit", data);
  return response.data;
},
 fetchOnboardApprovalList: async (
    params: any,partnerId?:number
  ): Promise<any> => {
    let url =`CandidateForm/paged/request-exception-list`
    const response = await api.post(url,params
    );
    return response.data;
  },
  docsApprovalList: async (
    params: any,partnerId?:number
  ): Promise<any> => {
    let url =`CandidateForm/paged/bgv-docs-verification-list`
    const response = await api.post(url,params
    );
    return response.data;
  },
  getJoiningRescheduleHistory: async (id:any) => {
    const response = await api.get(`/JoiningRescheduleHistory/list?personalDetailsId=${id}`);
    return response.data;
  },
  fetchContactMatrixformApprovalList: async (
    params: any,partnerId?:number
  ): Promise<any> => {
    let url =`/Partner/pending-all`
    const response = await api.post(url,params
    );
    return response.data;
  },fetchSowformApprovalList: async (
    params: any,partnerId?:number
  ): Promise<any> => {
    let url =`/Partner/pending-all-SOW`
    const response = await api.post(url,params
    );
    return response.data;
  },fetchOnholdApprovalList: async (
    params: any,partnerId?:number
  ): Promise<any> => {
    let url =`/HiringRequest/on-hold/paged`
    const response = await api.post(url,params
    );
    return response.data;
  },
fetchDropdownPaged: async (params: any) => {
    const url = `/Master/paged`;

    const body:any = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchColumn: params.searchColumn || "",
      searchText: params.searchText || "",
      sortColumns: params.sortColumns || [],
      masterTypeId: params.masterTypeId,
      domainId: params.domainId || 0,
      countryId: params.countryId || 0,
      stateId: params.stateId || 0,
      activeStatus: params.activeStatus ?? true,
    };

    const response = await api.post(url, body);
    return response.data;
  },

};
