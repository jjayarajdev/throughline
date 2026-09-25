namespace EpicenterX.Application.DTOs.HMS.Calibration
{
    public class GetCalibrationDto : BaseIdentifierDto
    {
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? Attendees { get; set; }
        public DateTime CalibrationDate { get; set; }
        public string? PrimarySkills { get; set; }
        public string? SecondarySkills { get; set; }
        public string? Certifications { get; set; }
        public DocumentDetailDto? Documents { get; set; }
        public string? Comments { get; set; }

        public int? HiringRequestId { get; set; }

    }
}
