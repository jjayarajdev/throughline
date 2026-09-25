using EpicenterX.Application.Extensions;
using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Application.DTOs.CMS.Candidate
{
    public class AddCandidateDto : BaseIdentifierDto
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

        public int? EmployeeTypeId { get; set; }
        public string? PCLifecycleId { get; set; }
        public bool RequestedMicrosoftAccount { get; set; }
        public bool ConsideredForFutureRequirements { get; set; }
        public string? IsReferred { get; set; }
        public string? ReferredBy { get; set; }

        public int? IntakeStatusId { get; set; }
        public string? IntakeStatusName { get; set; }


        public int? CandidateStatusId { get; set; }
        public string? CandidateStatusName { get; set; }


        public bool? IsDuplicate { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }
        public DateTime? ResumeUploadedOn { get; set; }

        public bool? EnableCandidateHrqTransfer { get; set; }

        public string? RoleHiredFor { get; set; }
        public List<int>? PrimarySkillIds { get; set; }
        public List<int>? SecondarySkillIds { get; set; }
        public List<int>? PreferredWorkLocationIds { get; set; }
        public List<string>? PreferredWorkLocationNames { get; set; }

    }

    public class AcceptInterviewSlotDto
    {
        public int InterviewSlotId { get; set; }
        public bool IsAccepted { get; set; }
        public string? Comments { get; set; }
    }

    public class ReconsiderCandidateDto
    {
        public int CandidateId { get; set; }
        public int? HiringRequestId { get; set; }
        public int? ReconsiderReasonId { get; set; }
        public string? ReconsiderComments { get; set; }
    }

    public class EditInterviewSlotDto
    {
        public int InterviewSlotId { get; set; }
        public List<int>? Panel { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan Time { get; set; }
        public int? ValidityHours { get; set; }
        public int? Duration { get; set; }
        public string? HMAdditionalComments { get; set; }
        public int? CandidateInterviewStatusId { get; set; }
    }

    public class TransferCandidateDto
    {
        public int? HiringRequestId { get; set; }
        public int? CandidateId { get; set; }
        public int? TransferredBy { get; set; }
    }

    public class CandidateConfirmOfferDto
    {
        public int? CandidateId { get; set; }
        public bool? OfferStatus { get; set; }
        public string? Comments { get; set; }
    }

    public class CandidateJoinConfirmationDto
    {
        public int? CandidateId { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }
        public int? JoiningStatusId { get; set; }
        public DateTime? FinalOnboaridngDate { get; set; }
        public string? Comments { get; set; }
    }

    public class ApproveOnboardingDateDto
    {
        public int? CandidateId { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }
        public bool? Approve { get; set; }
        public DateTime? FinalOnboaridngDate { get; set; }
        public string? Comments { get; set; }
    }

    public class ApproveBGVDto
    {
        public int? CandidateId { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }
        public bool? Approve { get; set; }
        public string? Comments { get; set; }
    }

    public class CandidateDropOrReintiateDto
    {
        public string? DropOrReintiateByUserComments { get; set; }
    }
}
