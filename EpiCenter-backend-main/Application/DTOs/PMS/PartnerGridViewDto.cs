namespace EpicenterX.Application.DTOs.PMS
{
    public class PartnerGridViewDto : BaseIdentifierDto
    {
        public int? PartnerId { get; set; }
        public string? PartnerCode { get; set; }
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
        public string? EngagementTypeName { get; set; }
        public DateTime? StartDate { get; set; }
        public string? PartnerStatusName { get; set; }
        public string? PartnerTireName { get; set; }
        public string? ApproverName { get; set; }
        public bool? ApprovedStatus { get; set; }
        public bool? IsReintiated { get; set; }
        public bool? IsEmpaneled { get; set; }
        public string? PartnerCategoryName { get; set; }
    }
}
