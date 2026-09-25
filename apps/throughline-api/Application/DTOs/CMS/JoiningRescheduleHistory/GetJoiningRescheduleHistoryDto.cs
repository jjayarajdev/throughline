namespace EpicenterX.Application.DTOs.CMS.JoiningRescheduleHistory
{
    public class GetJoiningRescheduleHistoryDto : BaseIdentifierDto
    {
        public DateTime? FinalOnboardingDate { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? Modifiedby { get; set; }
        public string? ModifiedbyUsername { get; set; }
        public string? Comments { get; set; }
        public int? CandidateId { get; set; }
        public int? PersonalDetailsId { get; set; }
    }
}
