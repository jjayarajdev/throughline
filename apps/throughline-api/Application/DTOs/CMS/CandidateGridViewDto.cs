namespace EpicenterX.Application.DTOs.CMS
{
    public class CandidateGridViewDto : BaseIdentifierDto
    {
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
        public string? HrqId { get; set; }
        public string? CandidateCode { get; set; }
        public string? HrqStatus { get; set; }
        public int? CandidateId { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? JobTitle { get; set; }
        public int? RelevantExperience { get; set; }
        public DocumentDetailDto? Resume { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }
        public string? IntakeStatusName { get; set; }
        public string? CandidateStatusName { get; set; }
        public bool? IsDuplicate { get; set; }
        public DateTime? ProfileCreatedAt { get; set; }
        public DateTime? ScreeningCompletedOn { get; set; }
        public DateTime? InterviewCompletedOn { get; set; }
        public int? TATInDays { get; set; }
        public DateTime? HrqAssignDate { get; set; }
        public string? DomainName { get; set; }
        public string? SubDomainName { get; set; }
        public DateTime? ResumeUploadDate { get; set; }
        public DateTime? HrqOnHoldDate { get; set; }
        public DateTime? HiringClosedDate { get; set; }
        public DateTime? HiringStartDate { get; set; }
        public string? HiringManagerName { get; set; }
        public string? LastInterviewRound { get; set; }
        public string? LastInterviewStatus { get; set; }
        public string? LastInterviewFeedback { get; set; }
    }
}
