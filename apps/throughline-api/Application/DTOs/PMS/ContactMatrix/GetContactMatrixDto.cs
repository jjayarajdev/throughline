using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.PMS.ContactMatrix
{
	public class GetContactMatrixDto : BaseIdentifierDto
	{
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.CONTACT_MATRIX_CONTACT_TYPE)]
        public int? ContactMatrixTypeId { get; set; } // Foreign Key to M_ContactMatrixType
        public string? Name { get; set; }
        public string? Email { get; set; }
        public int? CountryId { get; set; } // Foreign Key to M_Country Master
        public string? ContactNumber { get; set; }
        public string? Designation { get; set; }
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.ACTIVE_INACTIVE_STATUS)]
        public int? StatusId { get; set; }
        public string? ContactMatrixTypeName { get; set; }
        public string? CountryName { get; set; }
        public string? StatusName { get; set; }
        public int? ApprovalStatusId { get; set; }
        public int PartnerId { get; set; } // Foreign Key to Partner
        public string? PartnerName { get; set; }
    }
}
