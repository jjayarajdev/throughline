using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Application.DTOs.HMS
{
    public class FeedbackCategoryDto : BaseIdentifierDto
    {
        public int CategoryId { get; set; }
        public bool? Value { get; set; }
        public string? CategoryName { get; set; }
        public List<FeedbackCritriaOptionsDto>? FeedbackCritriaOptions { get; set; }
        public int? InterviewRoundId { get; set; }
    }
}
