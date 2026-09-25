using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.HMS
{
    public class HiringGridViewDto : BaseIdentifierDto
    {
        public string? HrqId { get; set; }
        public string? BusinessName { get; set; }
        public string? RcMsProjectId { get; set; }
        public string? RcMsResourceRequestId { get; set; }
        public string? ProjectName { get; set; }
        public string? RequestorName { get; set; }
        public string? RequestApproverName { get; set; }
        public string? JobTitle { get; set; }
        public DateTime RequestCreationDate { get; set; }
        public DateTime RequestStartDate { get; set; }
        public string? ParentHrqId { get; set; }
        public string? HiringStatusName { get; set; }
        public string? RMOwnerName { get; set; }

        public int TatInDays { get; set; }

        public bool? IsRMOwnerAccepted { get; set; }

        public int? TotalHeadCount { get; set; }
        public int? OpenHeadCount { get; set; }
        public int? ClosedHeadCount { get; set; }
        public int? CancelledHeadCount { get; set; }
        public int? IdentifiedHeadCount { get; set; }
        public int? OnholdHeadCount { get; set; }
        public int? CurrentStatusHeadCount { get; set; }
    }

    public class OnholdHiringGridViewDto
    {
        public int? OnholdRequestId {  get; set; }
        public int? HiringRequestId { get; set; }
        public string? HrqId { get; set; }
        public string? RoleHiredFor { get; set; }
        public string? ParentHrqId { get; set; }
        public string? HiringStatusName { get; set; }
        public string? OnholdCategoryName { get; set; }
        public DateTime? OnholdRequestedDate { get; set; }
        public string? OnholdRequestedByRoleName { get; set; }
        public string? OnholdRaisedByUserName { get; set; }



        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.HRQ_ONHOLD_REASONS)]
        public String? OnholdReasonName { get; set; }
        public string? OnholdComments { get; set; }
        public List<string>? FreezeCandidateTypeNames { get; set; }

        public string? ReviewedByName { get; set; }
        public string? ReviewStatusName { get; set; }
        public DateTime?ReviewedDate { get; set; }
        public string? ReviewComments { get; set; }
    }
}
