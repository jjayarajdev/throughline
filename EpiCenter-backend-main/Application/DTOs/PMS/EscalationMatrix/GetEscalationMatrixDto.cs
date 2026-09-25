using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.PMS.EscalationMatrix
{
	public class GetEscalationMatrixDto : BaseIdentifierDto
	{
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.ESCALATION_MATRIX_CONTACT_TYPE)]
        public int? ContactTypeId { get; set; } //Foreign Key to M_ContactType Leadership 1, 2, 3

        public string? Name { get; set; }
        public string? Email { get; set; }
        public int? CountryId { get; set; } // Foreign Key to M_Country
        public string? ContactNumber { get; set; }
        public string? Designation { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.ACTIVE_INACTIVE_STATUS)]
        public int? StatusId { get; set; }


        public string? EscalationMatrixTypeName { get; set; }
        public string? StatusName { get; set; }
        public string? CountryName { get; set; }
        public string? PartnerName { get; set; }
        public int PartnerId { get; set; } // Foreign Key
        public int? ApprovalStatusId { get; set; }
    }
}
