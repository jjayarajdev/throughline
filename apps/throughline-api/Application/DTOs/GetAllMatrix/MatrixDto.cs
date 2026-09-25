using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Enums;

namespace EpicenterX.Application.DTOs.GetAllMatrix
{
    public class MatrixDto : BaseIdentifierDto
    {
        public MATRIX_TYPE Type { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public int? CountryId { get; set; }
        public string? ContactNumber { get; set; }
        public string? Designation { get; set; }
        public int? StatusId { get; set; }
        public string? StatusName { get; set; }
        public int PartnerId { get; set; }
        public string? Nickname { get; set; }
        public string? PartnerName { get; set; }
        public int ApprovalStatusId { get; set; }
        public string? ContactTypeName { get; set; }
        public string? EscalationMatrixTypeName { get; set; }
        public string? CountryName { get; set; }



    }

    public class SOWMatrix: BaseIdentifierDto
    {
        public string? SOWNumber { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal TCValue { get; set; }
        public bool? Status { get; set; }
        public int ApprovalStatusId { get; set; }
    }

}