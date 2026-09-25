interface EngagementItem {
    engagementStatusId: number;
    engagementTypeId: number;
    evaluationStartDate: string;
    evaluationEndDate: string;
    evaluationPeriod: number;
    evaluatedBy: string;
    businessId: number;
    evaluationStatusId: number;
    tenuareInDays: number;
    businessCenter: string;
    mruCode: string;
    partnerId: number;
    partnerName: string;
    engagementStatusName: string;
    engagementTypeName: string;
    businessUnitName: string;
    evaluationStatusName: string;
    partnerCode: string;
    id: number;
    isActive: boolean;
}

export interface EngagementResponse {
    status: boolean;
    statusCode: string;
    message: string;
    data: {
        items: EngagementItem[];
        totalCount: number;
        pageSize: number;
        currentPage: number;
        totalPages: number;
        hasPrevious: boolean;
        hasNext: boolean;
    };
}

export interface statusTableProps {
    statusId: string;
}