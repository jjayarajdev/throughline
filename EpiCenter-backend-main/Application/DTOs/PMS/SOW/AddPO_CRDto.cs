namespace EpicenterX.Application.DTOs.PMS.SOW
{
    public class AddPO_CRDto : BaseIdentifierDto
    {
        public int? CRTypeId { get; set; }
        public string? CRNumber { get; set; }
        public decimal? CRValue { get; set; }
        public DateTime? CRRequestDate { get; set; }
        public DateTime? ExtendedDate { get; set; }
        public bool? IsRateChanged { get; set; }
        public string? Comments { get; set; }


        public int? POId { get; set; }
    }
}
