using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.HMS
{
    public class InterviewRound : BaseIdentifier
    {
        public int? RoundNumber { get; set; }
        public int? RoundNameId { get; set; }
        public M_MasterData? RoundName { get; set; }
        public List<int>? Panel { get; set; } = [];
        public int? ModeOfInterview { get; set; }
        public M_MasterData? InterviewMode { get; set; }
        public string? Comments { get; set; }

        public bool? IsAddSpecificCandidates { get; set; }
        public List<int>? Candidates { get; set; }


        public bool? AddFeedbackCritria { get; set; }
        public int? CategoryId { get; set; }

        //public List<FeedbackCategory>? FeedbackCategories { get; set; }
        public List<FeedbackCritriaOptions>? FeedbackCritriaOptions { get; set; }



        public int? HiringRequestId { get; set; }
        public HiringRequest? HiringRequest { get; set; }

        public bool? SkipScreening { get; set; }

        public int? ScreeningCap { get; set; }
        public List<string>? AvailableDays { get; set; }
    }

    public class FeedbackCategory : BaseIdentifier
    {
        public int CategoryId { get; set; }
        public bool? Value { get; set; }
        public M_MasterData? Category { get; set; }
        public List<FeedbackCritriaOptions>? FeedbackCritriaOptions { get; set; }

        // Refernce to InterviewRound
        public int? InterviewRoundId { get; set; }
        public InterviewRound? InterviewRound { get; set; }
    }
    public class FeedbackCritriaOptions : BaseIdentifier
    {
        public int? CriteriaOptionId { get; set; }
        public bool? Value { get; set; }
        public M_MasterData? CriteriaOption { get; set; }

        // Refernce to FeedbackCategories
        public int? FeedbackCategoryId { get; set; }
        //public FeedbackCategory? FeedbackCategory { get; set; }

        public int? InterviewRoundId { get; set; }
        //public InterviewRound? InterviewRound { get; set; }
    }
}
