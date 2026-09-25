using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;

namespace EpicenterX.Domain.Entities.CMS
{
    public class InterviewSlotAllocationHistory : HistoryBaseIdentifier
    {
        public int? HiringRequestId { get; set; }
        public HiringRequest? HiringRequest { get; set; }
        public int? CandidateId { get; set; }
        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
        public int? CurrentRoundId { get; set; }
        public InterviewRound? CurrentRound { get; set; }
        public DateTime? Date { get; set; }
        public TimeSpan? Time { get; set; }
        public List<int>? Panel { get; set; }

        public int? ValidityHours { get; set; }
        public int? Duration { get; set; }
        public bool? IsPartnerAccepted { get; set; }
        public string? RejectedReason { get; set; }
        public DateTime? RejectedOn { get; set; }

        public int? RejectionCount { get; set; }
        public bool? IsResheduled { get; set; }

        public string? Feedback { get; set; }
        public IEnumerable<CandidateInterviewFeedBack>? CandidateRating { get; set; }

        public int? CandidateInterviewStatusId { get; set; }
        public M_MasterData? CandidateInterviewStatus { get; set; }

        public DateTime? AddedAt { get; set; }
    }
}
