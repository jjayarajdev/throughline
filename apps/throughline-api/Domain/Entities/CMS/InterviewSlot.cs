using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;

namespace EpicenterX.Domain.Entities.CMS
{
    public class InterviewSlot : BaseIdentifier
    {
        //InterviewSlot Allocation
        public DateTime? InterviewRoundStartDate { get; set; } 
        public DateTime? InterviewRoundCompleteDate { get; set; }


        public int? CandidateId { get; set; }
        public Candidate? Candidate { get; set; }
        public int? CurrentRoundId { get; set; }
        public InterviewRound? CurrentRound { get; set; }
        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
        public List<int>? Panel { get; set; }
        public DateTime? Date { get; set; }
        public TimeSpan? Time { get; set; }
        public int? ValidityHours { get; set; }
        public int? Duration { get; set; }
        public string? HMAdditionalComments { get; set; }
        public int? CandidateInterviewStatusId { get; set; }
        public M_MasterData? CandidateInterviewStatus { get; set; }
        public DateTime? LastStatusUpdated { get; set; }


        // Partner Manage Interview slot
        public bool? IsPartnerAccepted { get; set; }
        public string? PartnerInterviewAcceptanceComments { get; set; }
        public int? RejectionCount { get; set; }
        public DateTime? PartenrAcceptedOn { get; set; }



        //Partner Confirmation on candidate interview
        public bool? IsInterviewCompleted { get; set; }
        public int? ResheduledOrDropped { get; set; }
        public int? ResheduleIntiatedBy { get; set; }
        public string? PartnerInterviewCompletedComments { get; set; }
        public DateTime? PartnerInterviewConfirmedOn { get; set; }
        public int? RescheduleCount { get; set; }


        //Panel feedback
        public string? Feedback { get; set; }
        public IEnumerable<CandidateInterviewFeedBack>? CandidateRating { get; set; }
        public DateTime? PanelFeedbackGivenOn { get; set; }
        public int? FeedbackGivenByUserId { get; set; }
        public Users? FeedbackGivenByUser { get; set; }


        public bool? IsResheduled { get; set; }
    }
}
