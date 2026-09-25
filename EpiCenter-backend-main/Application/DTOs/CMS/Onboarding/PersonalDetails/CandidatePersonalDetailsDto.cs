using EpicenterX.Application.DTOs.CMS.Onboarding.AssetDetails;
using EpicenterX.Application.DTOs.CMS.Onboarding.CandidateBgvDetails;
using EpicenterX.Application.DTOs.CMS.Onboarding.ProfileTracker;
using EpicenterX.Application.DTOs.CMS.Onboarding.TrainingDetails;
using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Application.DTOs.CMS.Onboarding.PersonalDetails
{
    public class AddCandidatePersonalDetailsDto : BaseIdentifierDto
    {
        public int? CandidateId { get; set; }
        public int? HiringRequestId { get; set; }
        public string? RoleHiredFor { get; set; }
        public int? CategoryId { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public int? OnboardingManagerId { get; set; }
        public string? PersonalMailId { get; set; }
        public string? CurrentAddress { get; set; }
        public DateTime? FinalOnboaridngDate { get; set; }
        public string? AadharLast4Digits { get; set; }
        public string? NameAsPerAadhar { get; set; }
        public string? JobLocation { get; set; }
        public string? DOB { get; set; }
        public int? GenderId { get; set; }
        public int? TransportRequirementId { get; set; }
        public int? CountryId { get; set; }
        public int? StateId { get; set; }
        public int? CityId { get; set; }
        public string? Pincode {  get; set; }
        public int? DomainId { get; set; }
        public int? SubDomainId { get; set; }
        public string? Phone { get; set; }

    }

    public class SubmitOnboardingDetailsDto
    {
        public int? CandidateId { get; set; }
        public int? HiringRequestId { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }
        public bool? CandidateBGVCompleted { get; set; }
    }

    public class GetCandidatePersonalDetailsDto : BaseIdentifierDto
    {
        public int? CandidateId { get; set; }
        public string? CandidateName { get; set; }
        public int? HiringRequestId { get; set; }
        public string? CandidateCode { get; set; }
        public string? HrqId { get; set; }
        public int? HiringManagerId { get; set; }
        public string? HiringManagerName { get; set; }
        public int? SourceId { get; set; }
        public string? SourceName { get; set; }
        public string? RoleHiredFor { get; set; }
        public int? CategoryId { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public int? OnboardingManagerId { get; set; }
        public string? OnboardingManagerName { get; set; }
        public int? CountryId { get; set; }
        public string? CountryName { get; set; }
        public int? StateId { get; set; }
        public string? StateName { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public string? Pincode { get; set; }
        public int? DomainId { get; set; }
        public string? DomainName { get; set; }
        public int? SubDomainId { get; set; }
        public string? SubDomainName { get; set; }
        public string? PersonalMailId { get; set; }
        public string? CurrentAddress { get; set; }
        public DateTime? FinalOnboaridngDate { get; set; }
        public string? Phone { get; set; }
        public string? AadharLast4Digits { get; set; }
        public string? NameAsPerAadhar { get; set; }

        public string? DOB { get; set; }
        public int? GenderId { get; set; }
        public string? GenderName { get; set; }
        public int? TransportRequirementId { get; set; }
        public string? TransportRequirementName { get; set; }
        public bool? CandidateBGVCompleted { get; set; }

        public int? PGUId { get; set; }
        public string? PGUName { get; set; }

        public GetProfileTrackerDto? ProfileTracker { get; set; }
        public GetAssetDetailsDto? AssetDetails { get; set; }
        public GetTrainingDetailsDto? TrainingDetails { get; set; }
        public GetCandidateBgvDetailsDto? CandidateBgvDetails { get; set; }



        public string? JobLocation { get; set; }
        public int? ResourceTypeId { get; set; }
        public string? ResourceTypeName { get; set; }
    }
}
