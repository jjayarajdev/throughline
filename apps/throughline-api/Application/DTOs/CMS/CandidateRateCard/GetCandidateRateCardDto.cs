namespace EpicenterX.Application.DTOs.CMS.CandidateRateCard
{
    public class GetCandidateRateCardDto : BaseIdentifierDto
    {
        public int CandidateId { get; set; }
        public decimal? PartnerRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int? CandidateCategotyId { get; set; }
        public string? CandidateCategotyName { get; set; }
        public bool? IsCustomisedRateCard { get; set; }
        public DateTime? DOJ { get; set; }
    }
}
