using EpicenterX.Domain.Entities.HMS;
using Newtonsoft.Json;

namespace EpicenterX.Domain.Entities
{
    public class HiringReqPartner : BaseIdentifier
    {
        public int? PartnerId { get; set; }
        public DateTime? AssignedOn { get; set; }
        public int? PartnerCategoryId { get; set; }
    }
}
