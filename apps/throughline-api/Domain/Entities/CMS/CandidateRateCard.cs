using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.CMS
{
    public class CandidateRateCard : BaseIdentifier
    {
        public int CandidateId { get; set; } // Foreign Key (Candidate)
        public decimal? PartnerRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public int? CategoryId { get; set; }
        public M_MasterData? Category { get; set; }
        public int? CandidateCategotyId { get; set; }
        public M_MasterData? CandidateCategoty { get; set; }
        public bool? IsCustomisedRateCard { get; set; }
        public DateTime? DOJ { get; set; }
    }
}
