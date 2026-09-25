using EpicenterX.Application.Extensions;
using EpicenterX.Domain.Entities;

namespace EpicenterX.Application.DTOs.CMS
{
    public class CandidateHistoryDto : BaseIdentifierDto
    {
        public int? PartnerId { get; set; } // Foreign Key (Partner)
        public string? PartnerName { get; set; }
        public int? HiringStatusId { get; set; }
        public string? HiringStatusName { get; set; }
        public string? JobTitle { get; set; }

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
        public string? currentOrganisation { get; set; }
        public string? LastOrganisation { get; set; }
        public DateTime? LastWorkingDay { get; set; }
        public DocumentDetailDto? Resume { get; set; }
        public string? EmployeeId { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.EMPLOYEE_TYPE)]
        public int? EmployeeTypeId { get; set; }
        public string? PCLifecycleId { get; set; }
        public bool RequestedMicrosoftAccount { get; set; }
        public bool ConsideredForFutureRequirements { get; set; }
        public string? IsReferred { get; set; }
        public bool? IsBin { get; set; }
        public string? ReferredBy { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.CANDIDATE_INTAKE_STATUS)]
        public int? IntakeStatusId { get; set; }
        public string? IntakeStatusName { get; set; }

        public bool? IsDuplicate { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }
    }
}
