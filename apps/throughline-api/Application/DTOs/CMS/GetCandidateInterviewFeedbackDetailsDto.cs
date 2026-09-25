namespace EpicenterX.Application.DTOs.CMS
{
    public class GetCandidateInterviewFeedbackDetailsDto 
    {
        public int? CandidateId { get; set; }
        public string? CandidateName { get; set; }
        public string? CandidateCode { get; set; }
        public string? FinalStatus { get; set; }
        public List<GetCnadidateInterviewRoundFeedbackDetailsDto>? GetCnadidateInterviewRoundFeedbackDetailsDtos { get; set; }
    }

    public class GetCnadidateInterviewRoundFeedbackDetailsDto
    {
        public int? InterviewSlotId { get; set; }
        public string? InterviewRoundName { get; set; }
        public List<int>? InterviewPanel { get; set; }
        public string? InterviewPanelNames { get; set; }
        public List<int>? InterviewAdditionalPanel { get; set; }
        public string? InterviewAdditionalPanelNames { get; set; }
        public string? InterviewModeName { get; set; }
        public DateTime? InterviewDate { get; set; }
        public TimeSpan? InterviewTime { get; set; }
        public string? Comments { get; set; }
        public string? PanelFeedbackComments { get; set; }
        public string? FeedbackCategoryName { get; set; }
        public string? CandidateInterviewStatusName { get; set; }

        public DateTime? FeedbackGivenOn { get; set; }
        public int? FeedbackGivenByUserId { get; set; }
        public string? FeedbackGivenByUserName { get; set; }
        public string? FeedbackGivenByUserRoleName { get; set; }

        public List<GetFeedbackCategoryDetailsDto>? FeedbackCategoryDetails { get; set; }
    }

    public class GetFeedbackCategoryDetailsDto
    {
        public string? CriteriaOptionName { get; set; }
        public int? Rating { get; set; }
        public string? Comments { get; set; }
    }

    public class CandidateInterviewGroupKey
    {
        public int Id { get; set; } // Candidate Id
        public string FullName { get; set; } = string.Empty;

        public int? InterviewSlotId { get; set; } // isa.Id
        public string? PanelFeedbackComments { get; set; } // isa.Feedback
        public int? FeedbackGivenByUserId { get; set; }
        public string? FeedbackGivenByUserName { get; set; }
        public string? FeedbackGivenByUserRoleName { get; set; }
    }
}
