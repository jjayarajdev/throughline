using EpicenterX.Application.Extensions;
using EpicenterX.Domain.Enums;

namespace EpicenterX.Application.DTOs.PMS.ContactMatrix
{
    public class AddContactMatrixDto : BaseIdentifierDto
    {
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.CONTACT_MATRIX_CONTACT_TYPE)]
        public int? ContactMatrixTypeId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public int? CountryId { get; set; }
        public string? ContactNumber { get; set; }
        public string? Designation { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.ACTIVE_INACTIVE_STATUS)]
        public int? StatusId { get; set; }

        public int PartnerId { get; set; }
        public bool? ContinueToAdd { get; set; }

        public bool? IsApprovedAction { get; set; }
    }

    public class UpdateContactMatrixDto : BaseIdentifierDto
    {
        public CONTACT_MATRIX_STATUS ApprovalStatusId { get; set; }
    }
}
