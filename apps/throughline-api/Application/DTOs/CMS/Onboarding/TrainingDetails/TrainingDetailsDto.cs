namespace EpicenterX.Application.DTOs.CMS.Onboarding.TrainingDetails
{

    public class AddTrainingDetailsDto : BaseIdentifierDto
    {
        public DateTime? ReleaseToOperationsDate { get; set; }
        public List<int>? TrainingModuleIds { get; set; }
        public int? SessionTakenByManagerId { get; set; }
        public bool? IsTrainingCompleted { get; set; }
        public bool? IsMovedToManager { get; set; }
        public DateTime? TrainingSharedOn { get; set; }
        public DateTime? TrainingCompleted { get; set; }
        public bool? IsOrientationCompleted { get; set; }
        public DateTime? OrientationDate { get; set; }
        public DateTime? OrientationCompletionDate { get; set; }
        public DateTime? RescheduleOrientationDate { get; set; }
        public DateTime? OrientationSharedOn { get; set; }
        public int? OrientationStatusId { get; set; }
        public string? ReasonForReschedule { get; set; }
        public int? ResumeUploadId { get; set; }
        public DocumentDetailDto? ResumeUploaded { get; set; }
        public int? RCMSUploadStatusId { get; set; }

        public int? CandidatePersonalDetailsId { get; set; }
    }

    public class GetTrainingDetailsDto : BaseIdentifierDto
    {
        public DateTime? DOJ { get; set; }
        public DateTime? ReleaseToOperationsDate { get; set; }
        public List<int>? TrainingModuleIds { get; set; }
        public bool? IsMovedToManager { get; set; }
        public int? SessionTakenByManagerId { get; set; }
        public string? SessionTakenByManagerName { get; set; }
        public bool? IsTrainingCompleted { get; set; }
        public DateTime? TrainingSharedOn { get; set; }
        public DateTime? TrainingCompleted { get; set; }
        public bool? IsOrientationCompleted { get; set; }
        public DateTime? OrientationDate { get; set; }
        public DateTime? OrientationCompletionDate { get; set; }
        public DateTime? RescheduleOrientationDate { get; set; }
        public DateTime? OrientationSharedOn { get; set; }
        public int? OrientationStatusId { get; set; }
        public string? OrientationStatusName { get; set; }
        public string? ReasonForReschedule { get; set; }
        public int? ResumeUploadId { get; set; }
        public DocumentDetailDto? ResumeUploaded { get; set; }
        public int? RCMSUploadStatusId { get; set; }
        public string? RCMSUploadStatusName { get; set; }

        public int? CandidatePersonalDetailsId { get; set; }
    }
}
