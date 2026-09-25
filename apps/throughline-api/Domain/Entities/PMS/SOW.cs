namespace EpicenterX.Domain.Entities.PMS
{
    public class SOW : BaseIdentifier
    {
        public string? SOWNumber { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal TCValue { get; set; }
        public bool? Status { get; set; }
        public string? Comments { get; set; }


        public List<PODetail>? PODetails { get; set; }
        public List<SOW_CR>? SOW_CRs { get; set; }


        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
        public int? ApprovalStatusId { get; set; }
    }
}
