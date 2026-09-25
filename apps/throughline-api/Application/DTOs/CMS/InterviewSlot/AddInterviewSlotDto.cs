using System.ComponentModel.DataAnnotations;
using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.CMS.InterviewSlot
{
    public class AddScreeningSlotDto : BaseIdentifierDto
    {
        public int CandidateId { get; set; }

        [Required(ErrorMessage = "CurrentRoundId is required")]
        public int? CurrentRoundId { get; set; }
        [Required(ErrorMessage = "Screenig Status is required")]
        public int? ScreeningStatusId { get; set; }
        public string? Comments { get; set; }
    }

    public class AddInterviewSlotDto : BaseIdentifierDto
    {
        [Required(ErrorMessage = "HiringRequestId is required")]
        public int? HiringRequestId { get; set; }

        [Required(ErrorMessage = "CandidateId is required")]
        public int? CandidateId { get; set; }

        [Required(ErrorMessage = "CurrentRoundId is required")]
        public int? CurrentRoundId { get; set; }

        public List<int>? Panel { get; set; }
        public int? ValidityHours { get; set; }
        public int? Duration { get; set; }

        public DateTime Date { get; set; }
        public TimeSpan Time { get; set; }
        public int? PartnerId { get; set; }
        public string? Comments { get; set; }
        public int? CandidateInterviewStatusId { get; set; }
        public bool? IsResheduled { get; set; }
    }

    public class AddFeedbackDto
    {
        public int? InterviewSlotId { get; set; }
        public string? Feedback { get; set; }

        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.INTERVIEW_SLOT_STATUS)]
        public int? InterviewStatusId { get; set; }

    }

    public class InterviewResheduleDto : BaseIdentifierDto
    {
        public bool? IsResheduled { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan Time { get; set; }

        [Required(ErrorMessage = "Panel is required")]
        public List<string>? Panel { get; set; }
    }


    public class CandidateInterviewUpdateDto
    {
        public int InterviewSlotId { get; set; }
        public bool? IsInterviewCompleted { get; set; }
        public int? ResheduledOrDropped { get; set; }
        public int? ResheduleIntiatedBy { get; set; }
        public string? PartnerInterviewCompletedComments { get; set; }

    }
}
