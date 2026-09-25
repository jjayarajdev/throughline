using System.ComponentModel.DataAnnotations;
using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.HMS.HiringRequest
{
    public class AddHiringRequestDto : BaseIdentifierDto
    {
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.REC_TYPE)]
        public int? RecordTypeId { get; set; }

        public string? ReferredHrqId { get; set; }

        public string JobTitle { get; set; } = string.Empty;
        public int? RmOwnerId { get; set; }
        public int? HiringMangerId { get; set; }
        public string RcMsProjectId { get; set; } = string.Empty;
        public string RcMsResourceRequestId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.BUSINESS_UNIT)]
        public int? BusinessId { get; set; } // Business Master

        public DateTime RequestStartDate { get; set; }
        public DateTime RequestCreationDate { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.HIRING_TYPE)]
        public int? HiringTypeId { get; set; } // HiringType Master
        public int? ProjectDurationd { get; set; }
        public int ProjectDurationMonths { get; set; }


        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.HIRING_STATUS)]
        public int? HiringStatusId { get; set; } // HiringStatus Master

        public bool IsSinglePosition { get; set; }
        public bool IsMultiplePositions { get; set; }
        public int? NumberOfPositions { get; set; } // Enabled if "Multi" is selected

        public int? DomainId { get; set; }
        public int? BETApproverId { get; set; }
        public int? RequestorId { get; set; }

    }

    public class AddChildHiringRequestsDto
    {
        public int? ParentHiringRequestId { get; set; }
        public int? NoOfPositions { get; set; }
    }

    public class UpdateApprovalStatusDto : BaseIdentifierDto
    {
        public DateTime? ApproverUpdatedDate { get; set; } = DateTime.UtcNow;

        public string? ApproverComments { get; set; }
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.APPROVAL_STATUS)]

        public int? ApprovalStatusId { get; set; }

        public bool ProceedToCancelChildHrqs { get; set; }
    }

    public class AddOnholdHiringRequestDto
    {
        public int? HiringRequestId { get; set; }

        public int? OnholdCategoryId { get; set; }
        public DateTime? OnholdRequestedDate { get; set; }
        public int? OnholdRequestedByRoleId { get; set; }
        public int? OnholdRaisedByUserId { get; set; }
        public int? OnholdReasonId { get; set; }
        public string? OnholdComments { get; set; }
        public List<int>? FreezeCandidateTypes { get; set; }
    }
}
