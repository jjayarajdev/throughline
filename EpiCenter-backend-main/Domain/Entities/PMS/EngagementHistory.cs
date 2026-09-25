using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.PMS
{
    public class EngagementHistory : BaseIdentifier
    {
        public int? EngagementId { get; set; }
        public int? EngagementStatusId { get; set; }
        public int? EngagementTypeId { get; set; }
        public DateTime EvaluationStartDate { get; set; }
        public DateTime EvaluationEndDate { get; set; }
        public int? EvaluationPeriod { get; set; }
        public string? EvaluatedBy { get; set; }
        public string? BusinessCenter { get; set; }
        public int? BusinessId { get; set; }
        public bool? IsExtendedEvaluation { get; set; }
        public bool? IsCompletedEvaluation { get; set; }
        public int? EvaluationStatusId { get; set; }
        public string? MRUCode { get; set; }
        //public string? Comments { get; set; }


        public DateTime? EvaluationExtendedDate { get; set; }
        public string? ExtendedComments { get; set; }
        public int? RejectionReasonId { get; set; }
        public string? RejectionReason { get; set; }

        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
        public M_MasterData? EngagementStatus { get; set; }
        public M_MasterData? EngagementType { get; set; }
        public M_MasterData? BusinessUnit { get; set; }
        public M_MasterData? EvaluationStatus { get; set; }
        public M_MasterData? RejectionReasonType { get; set; }

        public Users? CreatedUser { get; set; }
    }
}
