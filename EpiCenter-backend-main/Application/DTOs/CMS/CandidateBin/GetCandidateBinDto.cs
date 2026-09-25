using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.CMS.CandidateBin
{
    public class GetCandidateBinDto : BaseIdentifierDto
    {
        public int CandidateBinId { get; set; }
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? NickName { get; set; }
        public int? HiringStatusId { get; set; }
        public string? HiringStatusName { get; set; }
        public string? JobTitle { get; set; }
        public int? CandidateId { get; set; }
        public string? CandidateCode { get; set; }
        public bool IsSingleEntry { get; set; } = true;
        public int HiringRequestId { get; set; }
        public string? HrqId { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public int? ResourceTypeId { get; set; }
        public int? CountryId { get; set; }
        public string? CountryName { get; set; }
        public int? StateId { get; set; }
        public string? StateName { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public string? Diversity { get; set; }
        public int? NoticePeriod { get; set; }
        public int? RelevantExperience { get; set; }
        public string? CurrentlyWorking { get; set; }
        public string? CurrentOrganisation { get; set; }
        public string? LastOrganisation { get; set; }
        public DateTime? LastWorkingDay { get; set; }

        public bool? IsManagerApproved { get; set; }
        public DateTime? ManagerApprovedOn { get; set; }
        public string? ManagerApprovalComments { get; set; }
        public int? ApprovedOrDeclinedByUserId { get; set; }
        public string? ApprovedOrDeclinedByName { get; set; }

        public int? ResumeId { get; set; }
        public DocumentDetailDto? Resume { get; set; }
        public string? EmployeeId { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.EMPLOYEE_TYPE)]
        public int? EmployeeTypeId { get; set; }
        public string? PCLifecycleId { get; set; }
        public bool RequestedMicrosoftAccount { get; set; }
        public bool ConsideredForFutureRequirements { get; set; }
        public string? IsReferred { get; set; }
        public string? ReferredBy { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.CANDIDATE_INTAKE_STATUS)]
        public int? IntakeStatusId { get; set; }
        public string? IntakeStatusName { get; set; }
        public bool? IsDuplicate { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }

        public bool? IsRequestException { get; set; }

        public string? ExistingCandidateCode { get; set; }

        public DateTime? ResumeUploadedOn { get; set; }

        public string? PartnerComments { get; set; }

        public string? PartnerCode { get; set; }
        public string? RoleHiredFor { get; set; }
        public List<int>? PrimarySkillIds { get; set; }
        public List<int>? SecondarySkillIds { get; set; }
        public string? PrimarySkillIdStr { get; set; }
        public string? SecondarySkillIdStr { get; set; }
        public List<string>? PrimarySkillNames { get; set; }
        public List<string>? SecondarySkillNames { get; set; }
        public List<int>? PreferredWorkLocationIds { get; set; }
        public string? PreferredWorkLocationIdStr { get; set; }
        public List<string>? PreferredWorkLocationNames { get; set; }

        public List<MasterDto>? PreferredWorkLocations { get; set; }

        public DateTime? ProfileCreatedAt { get; set; }


        public string? ErrorMessage { get; set; }
    }

    public class CandidateValidationResultDto
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? HrqId { get; set; }
        public string? CountryName { get; set; }
        public string? StateName { get; set; }
        public string? CityName { get; set; }
        public int? PartnerId { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
