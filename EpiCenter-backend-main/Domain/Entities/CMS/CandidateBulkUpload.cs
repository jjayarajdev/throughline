namespace EpicenterX.Domain.Entities.CMS
{
	public class CandidateBulkUpload
	{
        public int? PartnerId { get; set; }
        //public string? HrqId { get; set; }
        //public string? JobTitle { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? RoleHiredFor { get; set; }
        //public string? PrimarySkillNames { get; set; }
        //public string? SecondarySkillNames { get; set; }
        //public string? PreferredWorkLocationNames { get; set; }
        public string? Diversity { get; set; }
        //public string? CountryName { get; set; }
        //public string? StateName { get; set; }
        //public string? CityName { get; set; }
        public int? NoticePeriod { get; set; }
        public int? RelevantExperience { get; set; }
        public string? CurrentlyWorking { get; set; }
        public string? CurrentOrganisation { get; set; }
        public DateTime? LastWorkingDay { get; set; }
        public bool? IsDuplicate { get; set; }
        public int? HiringRequestId { get; set; }

        public List<int>? PrimarySkillIds { get; set; }
        public List<int>? SecondarySkillIds { get; set; }
        public List<int>? PreferredWorkLocationIds { get; set; }

        public string? ExistingCandidateCode { get; set; }
        public bool IsSingleEntry { get; set; }
        public int? CountryId { get; set; }
        public int? StateId { get; set; }
        public int? CityId { get; set; }
        public DateTime? CreatedAt { get; set; }

    }

    public class CandidateResult
    {
        public int? CandidateId { get; set; }
        public string? ErrorMessage { get; set; }
        public int? Severity { get; set; }
    }
}
