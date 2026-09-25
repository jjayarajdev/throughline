namespace EpicenterX.Domain.Entities.HMS
{
    public class Feedback : BaseIdentifier
    {
        public string? Category { get; set; }
        public string? Comments { get; set; }

        public List<FeedbackDetail>? FeedbackDetails { get; set; }
    }
}
