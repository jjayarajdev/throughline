namespace EpicenterX.Domain.Entities.CMS
{
    public class InterviewActionLog :BaseIdentifier
    {
        public int InterviewSlotId { get; set; }
        public InterviewSlot? InterviewSlot { get; set; }

        public int ActionType { get; set; } // Enum
        public DateTime ActionTime { get; set; } = DateTime.UtcNow;

        public string? Comments { get; set; }
        public int? PerformedByUserId { get; set; }
    }
}
