namespace EpicenterX.Domain.Entities.PMS
{
    public class PODetail : BaseIdentifier
    {
        public string? PONumber { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? POValue { get; set; }
        public decimal? Threshold { get; set; }
        public bool? Status { get; set; }


        public List<PO_CR>? PO_CRs { get; set; }


        public int? SowId { get; set; }
        public SOW? Sow { get; set; }
    }
}
