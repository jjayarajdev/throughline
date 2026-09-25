using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Application.DTOs.CMS
{
    public class CandidateBinHistoryDto : BaseIdentifierDto
    {
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }

        public int? HiringRequestId { get; set; }
        public bool IsSingleEntry { get; set; }
        public string? HrqId { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public int? CountryId { get; set; }
        public int? StateId { get; set; }
        public string? State { get; set; }
        public int? CityId { get; set; }
        public string? City { get; set; }
        public string? Diversity { get; set; }
        public int? NoticePeriod { get; set; }
        public int? RelevantExperience { get; set; }
        public string? CurrentlyWorking { get; set; }
        public string? CurrentOrganisation { get; set; }
        public string? LastOrganisation { get; set; }
        public DateTime? LastWorkingDay { get; set; }
        public int? ResumeId { get; set; }
        public DocumentDetailDto? Resume { get; set; }
        public string? EmployeeId { get; set; }
        public int? ResourceTypeId { get; set; }
        public string? ResourceType { get; set; }
        public string? PCLifecycleId { get; set; }
        public bool? RequestedMicrosoftAccount { get; set; }
        public bool? ConsideredForFutureRequirements { get; set; }
        public string? IsReferred { get; set; }
        public string? ReferredBy { get; set; }
        public int? IntakeStatusId { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }
        public string? IntakeStatus { get; set; }
        public bool? IsRequestException { get; set; }
        public DateTime? ResumeUploadedOn { get; set; }

        public bool? IsDuplicate { get; set; }
        public string? ExistingCandidateCode { get; set; }

        public string? PartnerComments { get; set; }
        public int? ExceptionApprovalStatusId { get; set; }
        public bool? IsManagerApproved { get; set; }
        public DateTime? ManagerApprovedOn { get; set; }
        public string? ManagerApprovalComments { get; set; }
        public string? ApprovedOrDeclinedByName { get; set; }

        public string? RoleHiredFor { get; set; }
        public List<int>? PrimarySkillIds { get; set; }
        public List<int>? SecondarySkillIds { get; set; }
        public List<int>? PreferredWorkLocationIds { get; set; }
    }
}
