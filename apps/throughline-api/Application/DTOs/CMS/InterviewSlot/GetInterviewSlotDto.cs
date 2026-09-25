namespace EpicenterX.Application.DTOs.CMS.InterviewSlot
{
    public class GetInterviewSlotDto : BaseIdentifierDto
    {

        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? CandidateCode { get; set; }
        public string? CandidateName { get; set; }
        public string? PartnerName { get; set; }
        public string? PartnerCode { get; set; }

        public string? Nickname { get; set; }
        public string? IntakeStatusName { get; set; }
        public int? CurrentRoundNumber { get; set; }
        public string? CurrentRoundName { get; set; }
        public string? HMComments { get; set; }
        public string? HMAdditionalComments { get; set; }
        public string? InterviewModeName { get; set; }
        public DateTime? Date { get; set; }
        public TimeSpan? Time { get; set; }
        public List<int>? Panel { get; set; }
        public string? PanelNames{ get; set; }
        public List<int>? AdditionalPanel { get; set; }
        public string? AdditionalPanelNames { get; set; }
        public List<string>? AvailableDays { get; set; }
        public int TatInDays { get; set; }
        public int? NoticePeriod { get; set; }
        public string? Phone { get; set; }



        public int? HiringRequestId { get; set; }
        public int? HiringManagerId { get; set; }
        public int? DomainManagerId { get; set; }
        public int? CandidateId { get; set; }
        public int? PartnerId { get; set; }
        public int? IntakeStatusId { get; set; }
        public int? CurrentRoundId { get; set; }
        public bool? IsSlotAssigned { get; set; }
        public int? InterviewModeId { get; set; }



        public DocumentDetailDto? Resume { get; set; }
        public int? ValidityHours { get; set; }
        public int? Duration { get; set; }

        

        public string? PartnerComments { get; set; }
        public DateTime? SlotCreatedAt { get; set; }


        public int? RejectionCount { get; set; }
        public bool? IsResheduled { get; set; }
        public bool? IsInterviewCompleted { get; set; }
        public int? RescheduleCount { get; set; }


        public string? Feedback { get; set; }
        public int? CandidateInterviewStatusId { get; set; }
        public string? CandidateInterviewStatusName { get; set; }

        public int? FeedbackGivenByUserId { get; set; }
        public string? FeedbackGivenByUserName { get; set; }
        public string? FeedbackGivenByUserRoleName { get; set; }

        public bool? HasInterviewFeedback { get; set; }


        public int? InterviewSlotId { get; set; }


    }
}
