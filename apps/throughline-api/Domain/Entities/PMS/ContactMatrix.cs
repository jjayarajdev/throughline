using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.PMS
{
    public class ContactMatrix : BaseIdentifier
    {
        public int? ContactMatrixTypeId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? ContactNumber { get; set; }
        public int? CountryId { get; set; }
        public string? CountryCode { get; set; }
        public string? Designation { get; set; }
        public int? StatusId { get; set; }

        public M_MasterData? ContactMatrixType { get; set; }

        public M_Country? Country { get; set; }
        public M_MasterData? Status { get; set; }

        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
        public int? ApprovalStatusId { get; set; }
    }
}
