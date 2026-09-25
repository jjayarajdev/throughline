namespace EpicenterX.Domain.Entities.PMS
{
    public class PODetailHistory : BaseIdentifier
    {
        public int? PODetailId { get; set; }
        public string? PONumber { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? POValue { get; set; }
        public decimal? Threshold { get; set; }
        public bool? Status { get; set; }


        public int? CRTypeId { get; set; }
        public string? CRNumber { get; set; }
        public DateTime? CRRequestDate { get; set; }
        public DateTime? ExtendedDate { get; set; }
        public string? Comments { get; set; }


        public int? SowId { get; set; }
    }
}
