using DocumentFormat.OpenXml.Office2013.Drawing.ChartStyle;
using DocumentFormat.OpenXml.Wordprocessing;
using EpicenterX.Domain.Entities.PMS;

namespace EpicenterX.Application.DTOs
{
    public class DashboardDto
    {

        public int? ActivePartners { get; set; }
        public int? ActiveCandidates { get; set; }
        public int? ActiveRequests { get; set; }
        public int? CurrentWeekInterviews { get; set; }
        public int? UnassignedHiringRequestCount { get; set; }

        public List<KeyValues>? PartnersDistibutions { get; set; }
        public List<KeyValues>? WeeklySubmissions { get; set; }
        public List<KeyValues>? CandidateStageSummary { get; set; }



        public int? InterviewsScheduled { get; set; }
        public int? InterviewsCompleted { get; set; }
        public int? FeedbackGiven { get; set; }
        public int? FeedbackPending { get; set; }
    }

    public class KeyValues
    {
        public string? Name { get; set; }
        public int? Count { get; set; }
    }
}
