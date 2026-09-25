namespace EpicenterX.Application.DTOs.HMS
{
    public class LabourHRQDetailDto
    {
        public bool? IsAssignedTothePartner { get; set; }
        public int? HiringRequestId { get; set; }
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? RMOwnerName { get; set; }
        public int? NoOfPositions { get; set; }
        public int? OpenPositions { get; set; }
        public int? ClosedPositions { get; set; }
        public int? Experience { get; set; }
        public string? JobLocation { get; set; }
        public string? ResourceTypeName { get; set; }
        public string? DomainName { get; set; }
    }
}
