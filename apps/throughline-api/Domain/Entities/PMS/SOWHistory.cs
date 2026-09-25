namespace EpicenterX.Domain.Entities.PMS
{
    public class SOWHistory : BaseIdentifier
    {
        public int? SOWID { get; set; }
        public string? SOWNumber { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TCValue { get; set; }
        public bool? Status { get; set; }

        public int? CRTypeId { get; set; }
        public string? CRNumber { get; set; }
        public DateTime? CRRequestDate { get; set; }
        public DateTime? ExtendedDate { get; set; }
        public string? Comments { get; set; }

        public bool? IsRateChanged { get; set; }

        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
    }
}
