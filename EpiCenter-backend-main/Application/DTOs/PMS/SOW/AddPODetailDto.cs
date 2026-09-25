namespace EpicenterX.Application.DTOs.PMS.SOW
{
    public class AddPODetailDto :BaseIdentifierDto
    {
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

        public List<AddPO_CRDto>? PO_CRs { get; set; }

        public int? SowId { get; set; }
        public string? SowNumber { get; set; }
    }
}
