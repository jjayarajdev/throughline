using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.DTOs.CMS
{
    public class CandidateProfileAndHistoryDto
    {
        public string? CandidateCode { get; set; }
        public int? CandidateId { get; set; }
        public string? FullName { get; set; }
        public int? NoticePeriod { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? CityName { get; set; }
        public int? RelevantExperience { get; set; }
        public string? Status { get; set; }
        public string? CurrentRoundName { get; set; }
        public DocumentDetails? Resume { get; set; }
        public string? CurrentHrqId { get; set; }
        public int? HiringRequestId { get; set; }
        public int? PreviousHiringRequestId { get; set; }

        public int? CurrentRoundId { get; set; }

        public List<CurrentHRQRounds>? CurrentHRQRounds { get; set; }
        public IEnumerable<InterviewSlotStats>? HistoricInterviewSlotsStats { get; set; }
    }



    public class CurrentHRQRounds
    {
        public int? Id { get; set; }
        public int? Order { get; set; }
        public int? RoundId { get; set; }
        public string? RoundName { get; set; }
        public int? RoundStatusId { get; set; }
        public string? RoundStatus { get; set; }
    }

    public class InterviewSlotStats
    {
        public string? HrqId { get; set; }
        public int? HiringRequestId { get; set; }
        public int? PreviousHiringRequestId { get; set; }
        public int? LastRoundNumber { get; set; }
        public string? LastRoundName { get; set; }
        public string? LastRoundStatus { get; set; }
        public int? LastRoundStatusId { get; set; }
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
        public DateTime? InterviewDate { get; set; }
        public int? LastRoundId { get; set; }
        public string? Time { get; set; }
        public string? JobTitle { get; set; }
        public List<int>? Panel { get; set; }
        public string? PanelNames { get; set; }
        public string? Status { get; set; }
        public DateTime? PanelFeedbackGivenOn { get; set; }
        public bool? IsCompleted { get; set; }
        public int TatInDays { get; set; }
    }
}
