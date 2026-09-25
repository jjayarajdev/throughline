namespace EpicenterX.Domain.Entities.PMS
{
    public class PartnerApprovalHistory : BaseIdentifier
    {
        public string? PartnerStatus { get; set; }
        public string? Comments { get; set; }
        public bool? IsReinitiated { get; set; }


        public int PartnerId { get; set; }
        public virtual Partner? Partner { get; set; }
    }
}