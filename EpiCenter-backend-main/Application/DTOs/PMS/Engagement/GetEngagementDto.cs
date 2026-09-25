using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.PMS.Engagement
{
    public class GetEngagementDto : BaseIdentifierDto
    {
        public int? EngagementStatusId { get; set; }
        public int? EngagementTypeId { get; set; }
        public DateTime EvaluationStartDate { get; set; }
        public DateTime EvaluationEndDate { get; set; }
        public int? EvaluationPeriod { get; set; }
        public string? EvaluatedBy { get; set; } 

        public int? BusinessId { get; set; }

        public bool? IsExtendedEvaluation { get; set; }
        public bool? IsCompletedEvaluation { get; set; }


        public int? EvaluationStatusId { get; set; } 
        public string? BusinessCenter { get; set; }
        public string? MRUCode { get; set; }
        public string? Comments { get; set; }

        public DateTime? EvaluationExtendedDate { get; set; }
        public string? ExtendedComments { get; set; }

        public int? RejectionReasonId { get; set; }
        public string? RejectionReason { get; set; }
        public int? PartnerId { get; set; } // Foreign Key

        public int? TenuareInDays { get; set; } // Number of days the from evaluation start date to today
        public string? PartnerName { get; set; }

        public string? Nickname { get; set; }
        public string? PartnerCode { get; set; }
        public string? EngagementStatusName { get; set; }
        public string? EngagementTypeName { get; set; }
        public string? BusinessUnitName { get; set; }
        public string? EvaluationStatusName { get; set; }
        public string? AgreementTypeName { get; set; }
        public string? RejectionReasonTypeName { get; set; }
        public string? CreatedUserName { get; set; }

        public bool? IsEmpaneled { get; set; }
    }
}
