namespace EpicenterX.Application.DTOs.HMS
{
    public class FeedbackCritriaOptionsDto : BaseIdentifierDto
    {
        public int? CriteriaOptionId { get; set; }
        public string? Name { get; set; }
        public bool? Value { get; set; }
        public int? FeedbackCategoryId { get; set; }
        public int? InterviewRoundId { get; set; }
    }
}
