namespace EpicenterX.Application.DTOs.CMS
{
    public class CandidateCaseHistoryDto : BaseIdentifierDto
    {
        public string? HrqId { get;set; }
        public string? CandidateCode { get;set; }
        public string? CandidateProfileUrl { get;set; }
        public string? CandidateEmail { get;set; }
        public string? InterviewHistory { get;set; }
        public string? PartnerName { get;set; }
        public string? InterviewStatus { get;set; }
    }
}
