using EpicenterX.Domain.Shared;

namespace EpicenterX.Domain.Entities.HMS
{
    public class Calibration : BaseIdentifier
    {
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? Attendees { get; set; }
        public DateTime? CalibrationDate { get; set; }
        public string? PrimarySkillsChanges { get; set; }
        public string? SecondarySkillsChnages { get; set; }
        public string? Certifications { get; set; }
        public int? DocumentId { get; set; }
        public DocumentDetails? Documents { get; set; }
        public string? Comments { get; set; }

        public int? HiringRequestId { get; set; }   
    }
}
