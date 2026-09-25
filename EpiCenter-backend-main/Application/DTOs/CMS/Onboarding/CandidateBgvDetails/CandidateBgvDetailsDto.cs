using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.DTOs.CMS.Onboarding.CandidateBgvDetails
{
    public class AddCandidateBgvDetailsDto : BaseIdentifierDto
    {
        public int? PGUId { get; set; }
        public int? VendorId { get; set; }
        public string? PGUName { get; set; }
        public DateTime? StartDate { get; set; }
        public bool? NDAAvailability { get; set; }
        public int? NDAAvailabilityDocId { get; set; }
        public DocumentDetailDto? NDAAvailabilityDoc { get; set; }
        public bool? CDAAvailability { get; set; }
        public int? CDAAvailabilityDocId { get; set; }
        public DocumentDetailDto? CDAAvailabilityDoc { get; set; }

        public bool? IsBGVAvailableWithPartner { get; set; }
        public DateTime? BGVStartDate { get; set; }
        public int? BGVStatusId { get; set; }
        public string? BGVStatusName { get; set; }
        public int? BGVCategoryId { get; set; }
        public string? BGVCategoryName { get; set; }
        public DateTime? BGVCompletionDate { get; set; }
        public List<DocumentDetailDto>? UploadBGVDocs { get; set; }
        public List<DocumentDetailDto>? AdditionalDocs { get; set; }

        public int? CandidatePersonalDetailsId { get; set; }

        public bool? IsUploadedBGVDocs { get; set; }
        public bool? CandidateBGVCompleted { get; set; }
       


    }
    public class GetCandidateBgvDetailsDto : BaseIdentifierDto
    {
        public int? VendorId { get; set; }
        public string? VendorName { get; set; }
        public int? PGUId { get; set; }
        public string? PGUName { get; set; }
        public DateTime? StartDate { get; set; }
        public bool? NDAAvailability { get; set; }
        public int? NDAAvailabilityDocId { get; set; }
        public DocumentDetailDto? NDAAvailabilityDoc { get; set; }
        public bool? CDAAvailability { get; set; }
        public int? CDAAvailabilityDocId { get; set; }
        public DocumentDetailDto? CDAAvailabilityDoc { get; set; }
        public bool? IsBGVAvailableWithPartner { get; set; }
        public int? BGVStatusId { get; set; }
        public string? BGVStatusName { get; set; }
        public int? BGVCategoryId { get; set; }
        public string? BGVCategoryName { get; set; }
        public DateTime? BGVCompletionDate { get; set; }
        public List<DocumentDetailDto>? UploadBGVDocs { get; set; }
        public List<DocumentDetailDto>? AdditionalDocs { get; set; }

        public int? CandidatePersonalDetailsId { get; set; }
        public bool? IsUploadedBGVDocs { get; set; }
        public bool? CandidateBGVCompleted { get; set; }

        public DateTime? LastUpdated { get; set; }
        public string? Comments { get; set; }
    }
}
