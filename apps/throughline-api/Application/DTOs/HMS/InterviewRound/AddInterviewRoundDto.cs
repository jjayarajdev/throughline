using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.HMS.InterviewRound
{
    public class AddInterviewRoundDto : BaseIdentifierDto
    {
        public int HiringRequestId { get; set; } // Foreign Key
        public int RoundNumber { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.INTERVIEW_ROUND)]
        public int? RoundNameId { get; set; } //Round Master: Screening, Technical, etc.
        public List<int> Panel { get; set; } = []; // Multi-selection

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.INTERVIEW_MODE)]
        public int? ModeOfInterview { get; set; }
        public string? ModeOfInterviewName { get; set; }
        public string Comments { get; set; } = string.Empty;
        public string? RoundNameName { get; set; }
        public bool? IsAddSpecificCandidates { get; set; }
        public List<int>? Candidates { get; set; }

        public bool? AddFeedbackCritria { get; set; }
        public int? CategoryId { get; set; }


        public bool? SkipScreening { get; set; }
        public int? ScreeningCap { get; set; }
        public List<string>? AvailableDays{ get; set; }

        public List<FeedbackCritriaOptionsDto>? FeedbackCritriaOptions { get; set; }
    }
}
