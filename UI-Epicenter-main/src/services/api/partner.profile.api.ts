import { PoPayload } from "@/components/partner-form/sow/AddPoForm";
import api from "@/lib/axiosInstance";
import { z } from "zod";

// Form Schema
export const profileFormSchema = z.object({
  partnerId: z.string().optional(),
  partnerName: z.string().min(1, "Partner Name is required"),
  nickname: z.string().min(1, "Nickname is required").optional(),
  partnerStatus: z.string().min(1, "Partner Status is required"),
  startDate: z.string().min(1, "Start Date is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  domain: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .min(1, "Domain is required"),
  subDomain: z.string().min(1, "Sub-Domain is required"),
  skills: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .min(1, "Skills are required"),
  capabilitiesDeck: z.object({
    attachmentName: z.string().min(1, "Capabilities Deck is required"),
    attachmentURL: z.string().min(1, "Capabilities Deck URL is required"),
  }),
});

// API Payload Type
export interface PartnerPayload {
  id: number | string;
  isActive: boolean;
  partnerCode: string | null;
  partnerName: string;
  nickname: string;
  partnerStatusId: number;
  startDate: string;
  countryId: number;
  stateId: number;
  cityId: number;
  address: string;
  domainIds: number[];
  subDomainIds: number[];
  skillIds: number[];
  capabilitiesDeckId?: string;
  capabilitiesDeck: Array<{
    id: number;
    attachmentName: string;
    attachmentURL: string;
  }>;
}

export interface ContactMatrixPayload {
  id: number | string;
  isActive: boolean;
  contactMatrixTypeId?: number;
  escalationMatrixTypeId?: number;
  name: string;
  email: string;
  contactNumber: string;
  countryId: string;
  designation: string | undefined;
  statusId: string;
  partnerId: string;
  contactTypeId?: number;
}

export const engagementFormSchema = z
  .object({
    isActive: z.boolean(),
    engagementStatusId: z.string().min(1, "Engagement status is required"),
    engagementTypeId: z.string().min(1, "Engagement type is required"),
    evaluationStartDate: z.string().min(1, "Evaluation start date is required"),
    evaluationEndDate: z.string().min(1, "Evaluation end date is required"),
    evaluationPeriod: z.string().min(1, "Evaluation period is required"),
    evaluatedBy: z.string().min(1, "Evaluated by is required"),
    businessId: z.string().min(1, "Business unit is required"),
    evaluationStatusId: z.string().min(1, "Evaluation status is required"),
    businessCenter: z.string(),
    mruCode: z.string(),
    comments: z.string(),
    extendedComments: z.string().optional(),
    evaluationExtendedDate: z.string().optional(),
    rejectionReasonId: z.string().optional(),
    rejectionReason: z.string().optional(),
    partnerId: z.string(),
    isEditMode: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isEditMode && data.evaluationStatusId === "11003") {
      if (!data.evaluationExtendedDate) {
        ctx.addIssue({
          path: ["evaluationExtendedDate"],
          code: z.ZodIssueCode.custom,
          message: "Extended date is required",
        });
      }

      if (!data.extendedComments) {
        ctx.addIssue({
          path: ["extendedComments"],
          code: z.ZodIssueCode.custom,
          message: "Comments are required",
        });
      }
    }

    if (data.evaluationStatusId === "11004") {
      if (!data.rejectionReasonId) {
        ctx.addIssue({
          path: ["rejectionReasonId"],
          code: z.ZodIssueCode.custom,
          message: "Rejection reason is required",
        });
      }

      if (!data.rejectionReason) {
        ctx.addIssue({
          path: ["rejectionReason"],
          code: z.ZodIssueCode.custom,
          message: "Rejection note is required",
        });
      }
    }
  });

export const empanelmentFormSchema = z
  .object({
    isActive: z.boolean(),
    partnerId: z.number().or(z.null()),
    isEmpaneledPartner: z.boolean(),
    empanelmentStartDate: z.string().optional(),
    sowSigningDate: z.string().optional(),
    gpApprovalDate: z.string().optional(),
    sowQuoteDocuments: z.array(
      z.object({
        id: z.number().optional(),
        attachmentName: z.string(),
        attachmentURL: z.string(),
        partnerEmpanelId: z.number().optional(),
      })
    ),
    agreementTypeId: z.string().optional(),
    empanelmentComments: z.string().optional(),
    isThisGPApproved: z.boolean().optional(),
    contractId: z.string().optional(),
    gpId: z.string().optional(),
    panid: z.string().optional(),
    gstid: z.string().optional(),
    tanid: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isThisGPApproved) {
        return !!data.sowSigningDate;
      }
      return true;
    },
    {
      message: "SOW Signing Date is required when GP is approved",
      path: ["sowSigningDate"],
    }
  )
  .refine(
    (data) => {
      if (data.isThisGPApproved) {
        return data.sowQuoteDocuments?.length > 0;
      }
      return true;
    },
    {
      message:
        "At least one SOW Quote Document is required when GP is approved",
      path: ["sowQuoteDocuments"],
    }
  );

export interface EngagementPayload {
  isActive: boolean;
  engagementStatusId: string;
  engagementTypeId: string;
  evaluationStartDate: string;
  evaluationEndDate: string;
  evaluationPeriod: string;
  evaluationStatusId: string;
  evaluatedBy: string;
  businessId: string;
  businessCenter: string;
  isExtendEvaluation: boolean;
  mruCode: string;
  rejectionReasonId?: string;
  rejectionReason?: string | undefined;
  partnerId: number | string;
}
export const poDetailSchema = z.object({
  poTypeId: z.string().min(1, "PO number is required"),
  poNumber: z.string().min(1, "PO number is required"),
  sowNumber: z.string().optional(),
  sowStartDate: z.string().min(1, "SOW start date is required"),
  sowEndDate: z.string().min(1, "SOW end date is required"),
  poValue: z.string().min(1, "PO value is required"),
  poStatusId: z.string().optional(),
  poDocuments: z.any().optional(),
  thresholdPercentage: z.string().optional(),
  amendmentValue: z.string().optional(),
  extensionDate: z.string().optional(),
  extendedBy: z.string().optional(),
  crId: z.string().optional(),
});

export interface PoDetailsPayload {
  id: number | string;
  isActive: boolean;
  poTypeId: string;
  poNumber: string;
  sowNumber?: string;
  sowStartDate: string;
  sowEndDate: string;
  poValue: string;
  poStatusId?: string;
  poDocuments?: any;
  thresholdPercentage?: number;
  amendmentValue?: string | number;
  partnerId?: string | number;
  extensionDate?: string;
  extendedBy?: string;
  crId?: string;
}
export interface PagedRequest {
  pageNumber?: number;
  pageSize?: number;
  searchColumn?: string | null;
  searchText?: string | null;
  isBin?: boolean;
  intakeStatusId?: number[];
  statusId?: number[];
  sortColumns?: { column: string; descending: boolean }[];
}

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

export interface Partner {
  id: number;
  partnerCode: string;
  partnerName: string;
  nickname: string;
  engagementTypeName: string;
  startDate: string;
  approvedStatus: boolean;
  isEmpaneled: boolean;
  approverName: string | null;
  partnerStatusName: "Active" | "Under Evaluation" | "Rejected" | "Inactive";
}

export const partnerApi = {
  //all partner list
  getAllPartner: async () => {
    const response = await api.get("/Partner/list");
    return response.data;
  },

  //partner Approval
  partnerApproval: async (partnerId: string, data: any) => {
    const response = await api.patch(
      `/Partner/approve-partner?partnerId=${partnerId}`,
      data
    );
    return response.data;
  },

  //prfile api
  createPartner: async (data: PartnerPayload) => {
    const response = await api.post("/partner", data);
    return response.data;
  },

  getPartnerProfile: async (id: string) => {
    const response = await api.get(`/Partner/profile?partnerCode=${id}`);
    return response.data;
  },

  getPartnerProfileForm: async (id: number) => {
    const response = await api.get(`/Partner/${id}`);
    return response.data;
  },

  updatePartnerProfile: async (id: number, data: PartnerPayload) => {
    const response = await api.put(`/partner/${id}`, data);
    return response.data;
  },

  //contact matrix api

  getContactMatrix: async (id: string | undefined) => {
    const response = await api.get(`/ContactMatrix/list?partnerId=${id}`);
    return response.data;
  },

  createPartnerContactMatrix: async (data: ContactMatrixPayload) => {
    const response = await api.post("/ContactMatrix", data);
    return response.data;
  },

  updateContactMatrix: async (id: string, data: ContactMatrixPayload) => {
    const response = await api.put(`/ContactMatrix/${id}`, data);
    return response.data;
  },

  //escalation matrix api

  createPartnerEscalationMatrix: async (data: ContactMatrixPayload) => {
    const response = await api.post("/EscalationMatrix", data);
    return response.data;
  },

  getEscalationMatrix: async (id: string | undefined) => {
    const response = await api.get(`/EscalationMatrix/list?partnerId=${id}`);
    return response.data;
  },

  updateEscalationMatrix: async (id: string, data: ContactMatrixPayload) => {
    const response = await api.put(`/EscalationMatrix/${id}`, data);
    return response.data;
  },

  //engagement api

  getEngagement: async (id: string) => {
    const response = await api.get(`/Engagement/list?partnerId=${id}`);
    return response.data;
  },

  createEngagement: async (data: EngagementPayload) => {
    const response = await api.post("/Engagement", data);
    return response.data;
  },

  updatePartnerEngagement: async (id: number, data: any) => {
    const response = await api.put(`/Engagement/${id}`, data);
    return response.data;
  },

  //engament list based on status
  getEngagementListByEvaluationStatus: async (
    params: any,
    evaluationStatusId: string,
    partnerId: string
  ) => {
    const response = await api.post(
      `/Engagement/list/evaluation-status/${evaluationStatusId}?partnerId=${partnerId}`,
      params
    );
    return response.data;
  },

  //empanellment

  getEmpanelment: async (id: string) => {
    const response = await api.get(`/Empanelment/partner/${id}`);
    return response.data;
  },

  submitEmpanelment: async (data: any) => {
    const response = await api.post("/Empanelment", data);
    return response.data;
  },

  updateEmpanelment: async (id: number, data: any) => {
    const response = await api.put(`/Empanelment/${id}`, data);
    return response.data;
  },

  //podetails api

  createPoDetails: async (data: PoDetailsPayload) => {
    const response = await api.post("/PODetail", data);
    return response.data;
  },

  getPoDetails: async (id: string) => {
    const response = await api.get(`/PODetail/list?partnerId=${id}`);
    return response.data;
  },

  getPartners: async (
    params: PagedRequest,
    statusId?: number[],
    isVMApproved?: boolean
  ): Promise<PagedResponse<Partner>> => {
    let url = `/partner/paged?isVMApproved=${isVMApproved}`;
    const query = new URLSearchParams();

    if (statusId && statusId.length > 0) {
      query.append("statusId", statusId.join(","));
    }

    const queryString = query.toString();
    if (queryString) {
      url += `&${queryString}`;
    }

    const response = await api.post(url, params);
    return response.data;
  },

  updatePoDetails: async (id: number, data: PoDetailsPayload) => {
    const response = await api.put(`/PODetail/${id}`, data);
    return response.data;
  },

  //active hirign req
  activeHiringReq: async (id: string, params: PagedRequest) => {
    const response = await api.post(
      `/Partner/paged/open-list?partnerId=${id}`,
      params
    );
    return response.data;
  },
  createSow: async (data: SowPayload) => {
    const response = await api.post("/SOW", data);
    return response.data;
  },
  createPo: async (data: poPayload) => {
    const response = await api.post("/SOW/poDetails", data);
    return response.data;
  },

  getSow: async (partnerId: string, params: any) => {
    const response = await api.post(`/SOW/paged/${partnerId}`, params);
    return response.data.data;
  },

  //getsow for sow management page
  getSowDetails: async (
    sowCategoryId: number,
    partnerId?: string | null,
    params?: any
  ) => {
    const response = await api.post(
      `/SOW/paged/category/${sowCategoryId}?partnerId=${partnerId}`,
      params
    );
    return response.data;
  },

  //complete sow list
  getCompleteSowList: async (sowCategoryId: number, params: any) => {
    const response = await api.post(
      `/SOW/paged/category/${sowCategoryId}?partnerId=`,
      params
    );
    return response.data;
  },

  //po / sow tabs api

  updateSow: async (id: number, data: SowPayload) => {
    const response = await api.put(`/SOW/${id}`, data);
    return response.data;
  },

  updatePo: async (id: number, data: PoPayload) => {
    const response = await api.put(`/sow/poDetails/${id}`, data);
    return response.data;
  },

  getMasterData: async (type: number) => {
    const response = await api.get(`/Master/${type}`);
    return response.data.data;
  },

  getPoMasterData: async (type: number) => {
    const response = await api.get(`/Master/${type}`);
    return response.data.data;
  },
  getEvaluationExtended: async (EngagementId: string, params: any) => {
    const response = await api.post(
      `/Engagement/history/paged/${EngagementId}`,
      params
    );
    return response.data.data;
  },
  getcapabilityDeckDocuments: async (url: any, params: any) => {
    const response = await api.post(url, params);
    return response.data.data;
  },
};

export interface SowPayload {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: number;
  status: boolean;
  partnerId: string;
}
export interface poPayload {
  poNumber: string;
  startDate: string;
  endDate: string;
  poValue: number;
  status: boolean;
  sowId: number;
}
