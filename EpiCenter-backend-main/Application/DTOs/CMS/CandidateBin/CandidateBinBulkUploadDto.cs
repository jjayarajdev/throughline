namespace EpicenterX.Application.DTOs.CMS.CandidateBin
{
    public class CandidateBinBulkUploadDto
    {
        public int? PartnerId { get; set; }
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? RoleHiredFor { get; set; }
        public string? PrimarySkillNames { get; set; }
        public string? SecondarySkillNames { get; set; }
        public string? PreferredWorkLocationNames { get; set; }
        public string? Diversity { get; set; }
        public string? CountryName { get; set; }
        public string? StateName { get; set; }
        public string? CityName { get; set; }
        public int? NoticePeriod { get; set; }
        public int? RelevantExperience { get; set; }
        public string? CurrentlyWorking { get; set; }
        public string? CurrentOrganisation { get; set; }
        public DateTime? LastWorkingDay { get; set; }
        public bool? IsDuplicate { get; set; }

        public int? HiringRequestId { get; set; }
        public string? PrimarySkillIds { get; set; }
        public string? SecondarySkillIds { get; set; }
        public string? PreferredWorkLocationIds { get; set; }
        public string? ExistingCandidateCode { get; set; }
        public bool? IsSingleEntry { get; set; }
        public int? CountryId { get; set; }
        public int? StateId { get; set; }
        public int? CityId { get; set; }
    }
}
