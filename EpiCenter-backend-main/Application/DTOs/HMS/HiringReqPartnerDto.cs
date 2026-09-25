namespace EpicenterX.Application.DTOs.HMS
{
    public class HiringReqPartnerDto :BaseIdentifierDto
    {
        public int? PartnerId { get; set; }
        public DateTime? AssignedOn { get; set; }
        public int? PartnerCategoryId { get; set; }
    }
}
