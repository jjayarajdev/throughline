using EpicenterX.Application.Extensions;
using EpicenterX.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace EpicenterX.Application.DTOs.CMS.CandidateBin
{
    public class AddCandidateBinDto
    {
        public int CandidateBinId { get; set; }
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public int? HiringStatusId { get; set; }
        public string? HiringStatusName { get; set; }
        public string? JobTitle { get; set; }
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

        public int? ResumeId { get; set; }
        public DocumentDetailDto? Resume { get; set; }
        public string? EmployeeId { get; set; }

        public int? EmployeeTypeId { get; set; }
        public string? PCLifecycleId { get; set; }
        public bool RequestedMicrosoftAccount { get; set; }
        public bool ConsideredForFutureRequirements { get; set; }
        public string? IsReferred { get; set; }
        public string? ReferredBy { get; set; }

        public int? IntakeStatusId { get; set; }
        public string? IntakeStatusName { get; set; }
        public bool? IsDuplicate { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }

        public bool? IsRequestException { get; set; }
        public bool? IsActive { get; set; }

        public string? ExistingCandidateCode { get; set; }

        public DateTime? ResumeUploadedOn { get; set; }
        public string? PartnerComments { get; set; }
        public DateTime? ReUploadedCandidateOn { get; set; }

        public string? PartnerCode { get; set; }
        public string? RoleHiredFor { get; set; }
        public string? PrimarySkillIds { get; set; }

        [NotMapped]
        public List<int>? PrimarySkillIdList
        {
            get => PrimarySkillIds == null ? null : JsonSerializer.Deserialize<List<int>>(PrimarySkillIds);
            set => PrimarySkillIds = value == null ? null : JsonSerializer.Serialize(value);
        }

        public string? SecondarySkillIds { get; set; }

        [NotMapped]
        public List<int>? SecondarySkillIdList
        {
            get => SecondarySkillIds == null ? null : JsonSerializer.Deserialize<List<int>>(SecondarySkillIds);
            set => SecondarySkillIds = value == null ? null : JsonSerializer.Serialize(value);
        }

        public string? PreferredWorkLocationIds { get; set; }

        [NotMapped]
        public List<int>? PreferredWorkLocationIdList
        {
            get => PreferredWorkLocationIds == null ? null : JsonSerializer.Deserialize<List<int>>(PreferredWorkLocationIds);
            set => PreferredWorkLocationIds = value == null ? null : JsonSerializer.Serialize(value);
        }
        public List<string>? PrimarySkillNames { get; set; }
        public List<string>? SecondarySkillNames { get; set; }
        public List<string>? PreferredWorkLocationNames { get; set; }
    }

    public class CandidateBinResumeUploadDto
    {
        public DocumentDetailDto? Resume { get; set; }
    }

    public class CandidateBinRequestForExceptionDto
    {
        public int? CandidateBinId { get; set; }
        public string? PartnerComments { get; set; }
    }

    public class ConfirmCandidateBinDto
    {
        public int CandidateBinId { get; set; }
        public string? ExistingCandidateCode { get; set; }
        public bool? IsApproved { get; set; }
        public string? ManagerApprovalComments { get; set; }
    }

    public class ApproveMatrixDto
    {
        public int? Id { get; set; }
        public CONTACT_MATRIX_STATUS NewStatus { get; set; }
        public MATRIX_TYPE Type { get; set; }
    }

    public class AssignOpenHiringListDto
    {
        public List<int>? HiringList { get; set; }
    }
}
