using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.PMS.Engagement
{
    public class AddEngagementDto : BaseIdentifierDto
    {
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.ENGAGEMENT_STATUS)]
        public int? EngagementStatusId { get; set; }


        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.ENGAGEMENT_TYPE)]
        public int? EngagementTypeId { get; set; }

        public DateTime EvaluationStartDate { get; set; }
        public DateTime EvaluationEndDate { get; set; }
        public int? EvaluationPeriod { get; set; }
        public string? EvaluatedBy { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.BUSINESS_UNIT)]
        public int? BusinessId { get; set; }

        public bool? IsExtendedEvaluation { get; set; }
        public bool? IsCompletedEvaluation { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.EVALUATION_STATUS)]
        public int? EvaluationStatusId { get; set; }
        public string? BusinessCenter { get; set; }
        public string? MRUCode { get; set; }
        public string? Comments { get; set; }

        public DateTime? EvaluationExtendedDate { get; set; }
        public string? ExtendedComments { get; set; }
        public int? RejectionReasonId { get; set; }
        public string? RejectionReason { get; set; }

        public int? PartnerId { get; set; }
    }
}
