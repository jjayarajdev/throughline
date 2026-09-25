namespace EpicenterX.Application.DTOs.HMS
{
    public class PartnerHrqsGridDto
    {
        public int HiringRequestId { get; set; }
        public bool? IsProxyPartner { get; set; }
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public int PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? PartnerCode { get; set; }
        public int BusinessId { get; set; }
        public string? BusinessName { get; set; }
        public DateTime? PartnerAssignedDate { get; set; }
        public int? RMOwnerId { get; set; }
        public string? RMOwnerName { get; set; }
        public int? RequestApproverId { get; set; }
        public string? RequestApproverName { get; set; }
        public int? HiringStatusId { get; set; }
        public string? HiringStatusName { get; set; }
        public int? NumberOfPositions { get; set; }
        public int? JobPriorityId { get; set; }
        public string? JobPriorityName { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public int? CurrentStatusHeadCount { get; set; }
        public string? PrimarySkills { get;  set; }

        public int? TotalSubmission { get; set; }
        public int? Rejects { get; set; }
        public int? Drops { get; set; }
        public int? Identified { get; set; }
        public string? SecondarySkills { get; set; } 

        public DateTime? RequestStartDate { get; set; }
        public DateTime? OnholdDate { get; set; }
        public DateTime? ClosedDate { get; set; }

        public int? FinancialYear { get; set; }
    }
}