namespace EpicenterX.Application.DTOs.CMS.CandidateBin
{
    public class CandidateApprovalDetailsDto
    {
        public int? Id { get; set; }
        public bool? IsManagerApproved { get; set; }
        public DateTime? ManagerApprovedOn { get; set; }
        public string? ManagerApprovalComments { get; set; }
        public bool? IsAcknoledged { get; set; }
    }
}
