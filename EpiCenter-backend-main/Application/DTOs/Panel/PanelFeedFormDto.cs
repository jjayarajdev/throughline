namespace EpicenterX.Application.DTOs.Panel
{
    public class GetPanelFeedFormDto
    {
        public int? InterviewSlotId { get; set; }
        public int? CandidateId { get; set; }
        public string? CandidateName { get; set; }
        public string? CandidateCode { get; set; }
        public int? InterviewRoundNumber { get; set; }
        public List<int>? InterviewPanelMember { get; set; }
        public List<int>? InterviewAdditionalPanelMember { get; set; }
        public string? InterviewAdditionalPanelMemberNames { get; set; }
        public string? InterviewPanelNames { get; set; }
        public DropdownDto? CandidateInterviewStatus { get; set; }
        public DateTime? InterviewDate { get; set; }
        public DropdownDto? InterviewType { get; set; }
        public DropdownDto? InterviewMode { get; set; }

        public int? FeedbackGivenByUserId { get; set; }
        public string? FeedbackGivenByUserName { get; set; }
        public string? FeedbackGivenByUserRoleName { get; set; }

        public List<DropdownDto>? FeedbackCritriaOptions { get; set; }
    }

    public class UpdatePanelFeedbackFormDto
    {
        public int? InterviewSlotId { get; set; }
        public int? CandidateId { get; set; }
        public int? CandidateInterviewStatusId { get; set; }
        public int? FeedbackCategoryId { get; set; }
        public int? CriteriaOptionId { get; set; }
        public int? Rating { get; set; }
        public string? Comments { get; set; }
        public bool? IsActive { get; set; }

    }

}
