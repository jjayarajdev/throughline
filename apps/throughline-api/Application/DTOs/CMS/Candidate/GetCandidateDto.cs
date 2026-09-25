using EpicenterX.Application.Extensions;
using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Application.DTOs.CMS.Candidate
{
    public class GetCandidateDto : BaseIdentifierDto
    {
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? NickName { get; set; }
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
        public string? ResourceTypeName { get; set; }
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

        public int? ChildHRQCount { get; set; }
        public int? CandidateStatusId { get; set; }
        public string? CandidateStatusName { get; set; }

        public bool? IsDuplicate { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }
        public DateTime? ResumeUploadedOn { get; set; }

        public bool? EnableCandidateHrqTransfer { get; set; }
        public bool? IsParentHrq { get; set; }

        public int? CandidateRateCardId { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }

        public DateTime? DOJ { get; set; }
        public bool? IsPCAllocated { get; set; }
        public bool? IsJoinConfirmed { get; set; }
        public DateTime? PCAllocationDate { get; set; }
        public DateTime? ReleaseToOperationsDate { get; set; }
        public DateTime? PCConfigurationDate { get; set; }
        public bool? CandidateBGVCompleted { get; set; }
        public string? JoiningConfirmationComments { get; set; }
        public string? CurrentInterviewRoundId { get; set; }
        public string? PartnerCode { get; set; }
        public string? RoleHiredFor { get; set; }
        public List<int>? PrimarySkillIds { get; set; }
        public List<int>? SecondarySkillIds { get; set; }
        public List<string>? PrimarySkillNames { get; set; }
        public List<string>? SecondarySkillNames { get; set; }
        public List<int>? PreferredWorkLocationIds { get; set; }
        public List<string>? PreferredWorkLocationNames { get; set; }
        public List<MasterDto>? PreferredWorkLocations { get; set; }
        public List<MasterDto>? PrimarySkills { get; set; }
        public List<MasterDto>? SecondarySkills { get; set; }
        public DateTime? InterviewTatStartDate { get; set; }
        public DateTime? InterviewTatEndDate { get; set; }
        public int TatInDays { get; set; }
        public string? FreezedStatus { get; set; }

    }

    public class CandidateDetailsDto : BaseIdentifierDto
    {
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? CandidateCode { get; set; }
        public string? CandidateId { get; set; }
        public string? HrqId { get; set; }
        public int? CountryId { get; set; }
        public string? CountryName { get; set; }
        public int? StateId { get; set; }
        public string? StateName { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public string? Role { get; set; }
        public int HiringRequestId { get; set; }
        public int? HiringManagerId { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? HiringManager { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public int? EmployeeStatusId { get; set; }
        public M_MasterData? EmployeeStatus { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public List<int>? Domains { get; set; }
        public List<int>? SubDomains { get; set; }
        public M_MasterData? BusinessUnit { get; set; }
    }

    public class MarkDuplicateCandidateDto
    {
        public bool? IsDuplicate { get; set; }
        public string? ExistingCandidateCode { get; set; }
        public string? ExistingPartnerCode { get; set; }
        public string? Remarks { get; set; }
        public bool? AllowToUpdate { get; set; }
    }

    public class MarkDuplicateCandidateBinDto
    {
        public bool? IsDuplicate { get; set; }
        public List<int>? ExistingCandidateBinIds { get; set; }
        public string? ExistingPartnerCode { get; set; }
        public string? Remarks { get; set; }
    }

    public class GetFinalCandidateDto : BaseIdentifierDto
    {
        public string? HrqId { get; set; }
        public string? CandidateCode { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? JobTitle { get; set; }
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
        public int? IntakeStatusId { get; set; }
        public string? IntakeStatusName { get; set; }
        public int? HiringStatusId { get; set; }
        public string? HiringStatusName { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }
        public bool? EnableCandidateHrqTransfer { get; set; }

    }

    public class CandidateDataDto : BaseIdentifierDto
    {
        public int? CandidateId { get; set; }
        public string? FullName { get; set; }
        public string? CandidateCode { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? PrimarySkills { get; set; }
        public string? SecondarySkills { get; set; }
        public string? Country { get; set; }
        public string? State { get; set; }
        public string? CityName { get; set; }
        public string Address => string.Join(", ", new[] { CityName, State, Country }.Where(x => !string.IsNullOrWhiteSpace(x)));
        public string? Diversity { get; set; }
        public int? NoticePeriodDays { get; set; }
        public int? RelevantExperienceYears { get; set; }
        public string? CurrentlyWorking { get; set; }
        public int? IntakeStatusId { get; set; }
        public string? IntakeStatus { get; set; }
        public string? CurrentLastOrganisation { get; set; }
        public DateTime? LastWorkingDate { get; set; }
        public DocumentDetailDto? Resume { get; set; }
        public string? IsReferred { get; set; }
        public string? ReferredByEmail { get; set; }
        public int? EmployeeId { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public List<CandidateInterviewHistoryDto>? CandidateHistory { get; set; }

        public DateTime? CandidateDroppedOrReintiatedOn { get; set; }
        public int? CandidateDropOrReintiateByUserId { get; set; }
        public string? CandidateDropOrReintiateByUserName { get; set; }
        public string? CandidateDropOrReintiateByUserComments { get; set; }
        public bool? IsDropped { get; set; }
    }

    public class CandidateInterviewHistoryDto
    {
        public int? Id { get; set; }
        public int? HiringRequestId { get; set; }
        public DateTime? ProfileUploadedOn { get; set; }
        public string? HrqId { get; set; }
        public string? RoleHiredFor { get; set; }
        public int TatInDays { get; set; }
        public string? Partner { get; set; }
        public string? HiringStatus { get; set; }
        public List<CandidateInterviewFeedbackDto>? CandidateInterviewFeedback { get; set; }
    }

    public class CandidateInterviewFeedbackDto
    {
        public int? InterviewRoundNumber { get; set; }
        public string? InterviewRoundName { get; set; }
        public string? InterviewPanelNames { get; set; }
        public string? InterviewAdditionalPanelNames { get; set; }
        public string? InterviewModeName { get; set; }
        public DateTime? InterviewDate { get; set; }
        public TimeSpan? InterviewTime { get; set; }
        public string? Comments { get; set; }
        public string? PanelFeedbackComments { get; set; }
        public string? CandidateInterviewStatusName { get; set; }
        public DateTime? FeedbackGivenOn { get; set; }
        public DateTime? InterviewStartDate { get; set; }
        public DateTime? InterviewCompletedDate { get; set; }
        public int? FeedbackGivenByUserId { get; set; }
        public string? FeedbackGivenByUserName { get; set; }
        public string? FeedbackGivenByUserRoleName { get; set; }
        public List<FeedbackCategoryDetailDto>? FeedbackCategoryDetails { get; set; }
        public int TatInDays { get; set; }

    }

    public class FeedbackCategoryDetailDto
    {
        public string? CriteriaOptionName { get; set; }
        public int? Rating { get; set; }
        public string? Comments { get; set; }
    }

    public class GetExportCandidateDetails
    {
        public string? HrqId { get; set; }
        public string? CandidateCode { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? JobTitle { get; set; }
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
        public int? IntakeStatusId { get; set; }
        public string? IntakeStatusName { get; set; }
        public int? RelevantExperience { get; set; }
        public DateTime? ProfileCreatedAt { get; set; }

        public string? CandidateStatus { get; set; }
        public string? HiringStatusName { get; set; }
        public DateTime? RequestStartDate { get; set; }
        public DateTime? ClosedDate { get; set; }
        public DateTime? OnholdDate { get; set; }
        public string? DomainName { get; set; }
        public string? SubDomainName { get; set; }
        public string? HiringManagerName { get; set; }
        public string? LastInterviewRound { get; set; }
        public string? LastInterviewStatus { get; set; }
        public DateTime? DateOfInterview { get; set; }
        public string? Feedbackgivenby { get; set; }
        public DateTime? FeebackDate { get; set; }
        public string? PanelDetails { get; set; }
        public string? PanelComments { get; set; }
        public string? RoundName { get; set; }
        public string? RoundStatus { get; set; }
    }

    public class GetExportCandidate
    {
        public string? HrqId { get; set; }
        public string? HiringStatus { get; set; }
        public string? CandidateCode { get; set; }
        public string? CandidateName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? RoleHiredFor { get; set; }
        public string? DomainName { get; set; }
        public string? SubDomainName { get; set; }
        public int? Experience { get; set; }
        public string? Partner { get; set; }
        public string? IntakeStatusName { get; set; }
        public DateTime? ProfileCreatedAt { get; set; }
        public DateTime? OnholdDate { get; set; }
        public DateTime? RequestStartDate { get; set; }
        public DateTime? ClosedDate { get; set; }
        public string? HiringManagerName { get; set; }
        public string? LastInterviewRound { get; set; }
        public string? LastInterviewStatus { get; set; }
    }

    public class GetExportFeedbackCandidate
    {
        public string? HrqId { get; set; }
        public string? CandidateCode { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? RoundName { get; set; }
        public string? RoundStatus { get; set; }

        public int? RoundNumber { get; set; }
        public DateTime? DateOfInterview { get; set; }
        public string? Feedbackgivenby { get; set; }
        public DateTime? FeebackDate { get; set; }
        public string? PanelComments { get; set; }
        public string? PanelDetails { get; set; }

        public int? IsLastInterview { get; set; }
        public string? PartnerName { get; set; }
    }

    public class GetExportCandidateInterviewDetails
    {
        public string? HrqId { get; set; }
        public string? CandidateId { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? RoleHiredFor { get; set; }
        public string? PrimarySkills { get; set; }
        public string? SecondarySkills { get; set; }
        public string? Diversity { get; set; }
        public string? CurrentCountry { get; set; }
        public string? CurrentState { get; set; }
        public string? CurrentCity { get; set; }
        public string? WorkLocation { get; set; }
        public int? NoticePeriod { get; set; }
        public int? RelevantExperience { get; set; }
        public string? CurrentlyWorking { get; set; }
        public string? Organisation { get; set; }
        public string? PartnerId { get; set; }
        public DateTime? LastWorkingDay { get; set; }
        public string? PartnerAlias { get; set; }
        public string? Domain { get; set; }
        public string? SubDomain { get; set; }
        public string? HiringManager { get; set; }
        public int? InterviewRoundOrder { get; set; }
        public string? InterviewRoundName { get; set; }
        public string? InterviewStatus { get; set; }
        public string? FinalStatus { get; set; }
        public string? HRQStatus { get; set; }
        public DateTime? HRQHoldDate { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string? ScheduleTime { get; set; }
        public string? InterviewComments_Feedbacks { get; set; }
        public DateTime? FeedbackDate { get; set; }
        public string? FeedbackUpdatedBy { get; set; }
        public int? InterviewTaken { get; set; }
        public string? Comment { get; set; }
        public int? RescheduleCount { get; set; }
        public int? DeclineCount { get; set; }
        public string? Panel { get; set; }
        public int? LastInterview { get; set; }
        public DateTime? ProfileCreatedAt { get; set; }
    }


}
