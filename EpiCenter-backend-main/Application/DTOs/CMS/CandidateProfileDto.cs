namespace EpicenterX.Application.DTOs.CMS
{
    public class CandidateProfileDto
    {
        public string? CandidateCode { get; set; }
        public string? FullName { get; set; }
        public string? PartnerName { get; set; }
        public int? NoticePeriod { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? CityName { get; set; }
        public int? RelevantExperience { get; set; }
        public int? StatusId { get; set; }
        public string? StatusName { get; set; }
        public List<CandidateCaseHistoryDto>? CandidateCaseHistory { get; set; }
    }
}
