using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.CMS
{
    public class CandidateInterviewFeedBack : BaseIdentifier
    {
        public int? InterviewSlotId { get; set; }
        public int? CandidateId { get; set; }
        public int? FeedbackCategoryId { get; set; }
        public M_MasterData? FeedbackCategory { get; set; }
        public int? CriteriaOptionId { get; set; }
        public M_MasterData? CriteriaOption { get; set; }
        public int? Rating { get; set; }
        public string? Comments { get; set; }
    }
}
