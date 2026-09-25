namespace EpicenterX.Domain.Entities.HMS
{
    public class PartnerCategory : BaseIdentifier
    {
        public bool IsSpecificPartner { get; set; } // Radio Button
        public bool IsProxyPartner { get; set; }
        public bool IsRecommendThePartner { get; set; }
        public List<HiringReqPartner>? SelectedPartners { get; set; }
        public int? ProfileCAP { get; set; }
        public string Comments { get; set; } = string.Empty;

        public int HiringRequestId { get; set; } // Foreign Key
        public HiringRequest? HiringRequest { get; set; }
    }
}
