namespace EpicenterX.Application.DTOs.CMS.Onboarding.ProfileTracker
{
    public class AddProfileTrackerDto : BaseIdentifierDto
    {
        public bool? IsEmployeeIdGenerated { get; set; }
        public string? EmployeeNameAsPerId { get; set; }
        public int? EmployeeId { get; set; }
        public string? HPEEmailId { get; set; }
        public DateTime? ProfileCreatedOn { get; set; }
        public string? SmartProfileId { get; set; }
        public DateTime? ProfileApprovalDate { get; set; }
        public string? LHCCCode { get; set; }
        public int? CostCenterId { get; set; }
        public string? CostCenterName { get; set; }
        public int CandidatePersonalDetailsId { get; set; }
    }

    public class GetProfileTrackerDto : BaseIdentifierDto
    {
        public bool? IsEmployeeIdGenerated { get; set; }
        public string? EmployeeNameAsPerId { get; set; }
        public int? EmployeeId { get; set; }
        public string? HPEEmailId { get; set; }
        public DateTime? ProfileCreatedOn { get; set; }
        public string? SmartProfileId { get; set; }
        public DateTime? ProfileApprovalDate { get; set; }
        public string? LHCCCode { get; set; }
        public int? CostCenterId { get; set; }
        public string? CostCenterName { get; set; }

        public int CandidatePersonalDetailsId { get; set; }
    }
}
