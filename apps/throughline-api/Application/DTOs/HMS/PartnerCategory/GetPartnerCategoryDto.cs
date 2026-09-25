using EpicenterX.Application.DTOs.HMS;

namespace EpicenterX.Application.DTOs.HMS.PartnerCategory
{
	public class GetPartnerCategoryDto : BaseIdentifierDto
	{
        public int HiringRequestId { get; set; } // Foreign Key
        public bool IsSpecificPartner { get; set; } // Radio Button
        public bool IsProxyPartner { get; set; }
        public bool IsRecommendThePartner { get; set; }
        public List<HiringReqPartnerDto>? SelectedPartners { get; set; }
        public int? ProfileCAP { get; set; }
        public string Comments { get; set; } = string.Empty;
    }
}
