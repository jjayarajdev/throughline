namespace EpicenterX.Domain.Entities.CMS
{
    public class JoiningRescheduleHistory : BaseIdentifier
    {
        public DateTime? FinalOnboardingDate { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? Modifiedby { get; set; }
        public Users? ModifiedbyUser { get; set; }
        public string? Comments { get; set; }
        public int? CandidateId { get; set; }
        public int? PersonalDetailsId { get; set; }
    }
}
