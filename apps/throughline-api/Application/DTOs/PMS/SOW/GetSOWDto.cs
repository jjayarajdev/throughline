using EpicenterX.Domain.Enums;

namespace EpicenterX.Application.DTOs.PMS.SOW
{
    public class GetSOWDto : BaseIdentifierDto
    {
        public string? SOWNumber { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TCValue { get; set; }
        public bool? Status { get; set; }


        public int? CRTypeId { get; set; }
        public string? CRNumber { get; set; }
        public DateTime? CRRequestDate { get; set; }
        public DateTime? ExtendedDate { get; set; }

        public bool? IsRateChanged { get; set; }

        public string? Comments { get; set; }

        public List<GetPODetailDto>? PODetails { get; set; }
        public List<GetSOW_CRDto>? SOW_CRs { get; set; }

        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? PartnerCode { get; set; }

        public int ApprovalStatusId { get; set; }
    }

    public class UpdateSOWMatrixDto : BaseIdentifierDto
    {
        public int Id { get; set; }
        public CONTACT_MATRIX_STATUS ApprovalStatusId { get; set; }

    }
}
