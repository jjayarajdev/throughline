using EpicenterX.Application.DTOs.HMS.JobDetails;

namespace EpicenterX.Application.DTOs.HMS.HiringRequest
{
    public class GetHiringRequestDto : BaseIdentifierDto
    {
        public int? RecordTypeId { get; set; }
        public string? RcMsId { get; set; }
        public string? JobTitle { get; set; }
        public int? RmOwnerId { get; set; }
        public DateTime? RmOwnerAcceptedOn { get; set; }
        public int? EngagementTypeId { get; set; }
        public string? EngagementTypeName { get; set; }
        public bool? IsRMOwnerAccepted { get; set; }
        public int? HiringMangerId { get; set; }
        public string? HiringManagerName { get; set; }
        public string? HrqId { get; set; }

        public bool? IsParentHRQ { get; set; }
        public string? ParentHrqId { get; set; }

        public string RcMsProjectId { get; set; } = string.Empty; // Auto-populated
        public string RcMsResourceRequestId { get; set; } = string.Empty; // Auto-populated
        public string ProjectName { get; set; } = string.Empty;
        public DateTime RequestStartDate { get; set; }
        public DateTime RequestCreationDate { get; set; }
        public int? BusinessId { get; set; } // Business Master
        public int? HiringTypeId { get; set; } // HiringType Master
        public int? ProjectDurationd { get; set; }
        public int? HiringStatusId { get; set; } // HiringStatus Master
        public int ProjectDurationMonths { get; set; }
        public int? DomainId { get; set; }
        public string? EmployeeId { get; set; }
        public string? ReferredHrqId { get; set; }
        public int? BETApproverId { get; set; }

        public int? RequestApproverId { get; set; }
        public string? RequestApproverName { get; set; }
        public string? RequestApproverFieldName { get; set; }

        public DateTime? ApproverUpdatedDate { get; set; }
        public string? ApproverComments { get; set; }
        public int? ApprovalStatusId { get; set; }

        public bool IsSinglePosition { get; set; }
        public bool IsMultiplePositions { get; set; }
        public int? NumberOfPositions { get; set; } // Enabled if "Multi" is selected
        public string? ApproverEmail { get; set; }

        public bool? SkipScreening { get; set; }

        public int TatInDays { get; set; }


        ///OnHold Status Details
        public int? OnholdRequestedBy { get; set; }
        public string? OnholdRequestedByRoleName { get; set; }
        public int? OnholdRaisedBy { get; set; }
        public string? OnholdRaisedByUserName { get; set; }
        public DateTime? OnholdRequestedDate { get; set; }
        public int? OnholdReasonId { get; set; }
        public string? OnholdReasonName { get; set; }
        public string? OnholdComments { get; set; }
        public List<int>? FreezeCandidateTypes { get; set; }

        public DateTime? OnholdDate { get; set; } /// OnHold Reviewed Date
        public int? OnholdReviewedByUserId { get; set; }
        public string? OnholdReviewedByUserName { get; set; }
        public int? OnHoldReviewStatusId { get; set; }
        public string? OnHoldReviewStatusName { get; set; }


        public int? ResourceTypeId { get; set; }
        public int? RequestorId { get; set; }
        public string? DomainName { get; set; }
        public string? DomainManagerName { get; set; }
        public string? RequestorName { get; set; }
        public string? RecordTypeName { get; set; }
        public string? RMOwnerName { get; set; }
        public string? BusinessName { get; set; }
        public string? HiringTypeName { get; set; }
        public string? HiringStatusName { get; set; }
        public string? ApprovalStatusName { get; set; }
        public string? BETApproverName { get; set; }

        public bool? HasChildRequests { get; set; }

        public List<MasterDto>? JobLocations { get; set; }


        public bool? HasJobDetails { get; set; }
        public bool? HasPartnerCategory{ get; set; }
        public bool? HasInterviewRounds{ get; set; }
        public string? RMOwnerComments { get; set; }
    }

    public class ValidatedHiringRequestDetailsDto
    {
        public int? HiringRequestId { get; set; }
        public string? HrqId { get; set; }
        public int? ResourceTypeId { get; set; }
        public string? ResourceTypeName { get; set; }
        public int? HiringStatusId { get; set; }
        public string? HiringStatusName { get; set; }
        public string? JobTitle { get; set; }
        public List<MasterDto>? JobLocations { get; set; }
        public int? InterviewRoundsCount { get; set; }
        public bool? IsJobDetailsAdded { get; set; }
        public bool? IsPartnerCategoryAdded { get; set; }
        public GetJobDetailsDto? JobDetails { get; set; }

    }

    public class GetHiringRequestExportDto
    {
        public string? HrqId { get; set; }
        public string? BusinessName { get; set; }
        public string? RCMSProjectId { get; set; }
        public string? ParentHrqId { get; set; }
        public string? ProjectName { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? RequestStartDate { get; set; }
        public DateTime? HiringCreatedAt { get; set; }
        public string? HiringStatusName { get; set; }
        public string? RMOwnerName { get; set; }
        public int? TAT { get; set; }
        public DateTime? RequestClosedDate { get; set; }
        public int? TotalHeadCount { get; set; }
        public int? CurrentStatusHeadCount { get; set; }
    }
}
