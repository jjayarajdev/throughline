namespace EpicenterX.Application.DTOs
{
    public class GetCandidateCDANDAApprovalListDto
    {

        public int? HiringRequestId { get; set; }
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? ResourceTypeName { get; set; }

        public int? CandidateId { get; set; }
        public string? CandidateCode { get; set; }
        public string? CandidateName { get; set; }
        public string? EmployeeId { get; set; }
        public string? CandidateEmail { get; set; }
        public string? CandidateContact { get; set; }
        public int? IntakeStatusId { get; set; }
        public string? IntakeStatusName { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }
        public bool? CandidateBGVCompleted { get; set; }
        public bool? IsUploadedBGVDocs{ get; set; }

        public DocumentDetailDto? CDADoc { get; set; }

        public DocumentDetailDto? NDADoc { get; set; }

        public int? PartnerId { get; set; }
        public string? NickName { get; set; }

        public DateTime? LastUpdated { get; set; }
    }
}
