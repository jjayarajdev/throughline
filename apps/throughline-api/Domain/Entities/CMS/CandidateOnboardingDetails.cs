using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Domain.Entities.CMS
{
    public class CandidatePersonalDetails : BaseIdentifier
    {
        public string? RoleHiredFor { get; set; }
        public int? CategoryId { get; set; }
        public M_MasterData? Category { get; set; }

        public DateTime? DateOfJoining { get; set; }

        public int? CountryId { get; set; }
        public M_Country? Country { get; set; }

        public int? StateId { get; set; }
        public M_State? State { get; set; }

        public int? CityId { get; set; }
        public M_City? City { get; set; }

        public string? Pincode { get; set; }
        public int? DomainId { get; set; }
        public M_Domain? Domain { get; set; }


        public int? SubDomainId { get; set; }
        public M_SubDomain? SubDomain { get; set; }

        public int? OnboardingManagerId { get; set; }
        public Users? OnboardingManager { get; set; }



        public string? PersonalMailId { get; set; }
        public string? Phone { get; set; }
        public string? CurrentAddress { get; set; }
        public DateTime? FinalOnboaridngDate { get; set; }
        public string? AadharLast4Digits { get; set; }
        public string? NameAsPerAadhar { get; set; }
        public string? JobLocation { get; set; }
        public string? DOB { get; set; }
        public int? GenderId { get; set; }
        public M_MasterData? Gender { get; set; }
        public int? TransportRequirementId { get; set; }
        public M_MasterData? TransportRequirement { get; set; }
        public bool? CandidateBGVCompleted { get; set; }


        public ProfileTracker? ProfileTracker { get; set; }
        public AssetDetails? AssetDetails { get; set; }
        public TrainingDetails? TrainingDetails { get; set; }



        public int? CandidateId { get; set; }
        public Candidate? Candidate { get; set; }


        public int? OnboaridngDateChangeCount { get; set; }
        public bool? IsRequestException { get; set; }

    }

    public class ProfileTracker : BaseIdentifier
    {
        public bool? IsEmployeeIdGenerated { get; set; }
        public string? EmployeeNameAsPerId { get; set; }
        public int? EmployeeId { get; set; }
        public string? HPEEmailId { get; set; }
        public DateTime? ProfileCreatedOn { get; set; }
        public string? SmartProfileId { get; set; }
        public DateTime? ProfileApprovalDate { get; set; }
        public string? LHCCCode { get; set; }
        public int? CostCenterId { get; set; }
        public M_MasterData? CostCenter { get; set; }
        public string? CostCenterName { get; set; }

        public int CandidatePersonalDetailsId { get; set; }
    }


    public class AssetDetails : BaseIdentifier
    {
        public bool? IsJoinConfirmed { get; set; }
        public bool? IsPCAllocated { get; set; }
        public DateTime? PCRequestCreatedDate { get; set; }

        public string? PCRequestRefNo { get; set; }
        public string? PCSerialNo { get; set; }
        public DateTime? PCAllocationDate { get; set; }
        public int? ModeOfPcShipmentId { get; set; }
        public M_MasterData? ModeOfPcShipment { get; set; }
        public DateTime? PCReceivedOn { get; set; }
        public DateTime? PCConfigurationDate { get; set; }
        public int? ITAssetStatusID { get; set; }
        public M_MasterData? ITAssetStatus { get; set; }
        public int? ComplianceFollowedId { get; set; }
        public M_MasterData? ComplianceFollowed { get; set; }
        public int? DelayCategoryId { get; set; }
        public M_MasterData? DelayCategory { get; set; }
        public string? Comments { get; set; }

        public int CandidatePersonalDetailsId { get; set; }
    }

    public class TrainingDetails : BaseIdentifier
    {
        public bool? IsMovedToManager { get; set; }
        public int? SessionTakenByManagerId { get; set; }
        public Users? SessionTakenByManager { get; set; }
        public List<int>? TrainingModuleIds { get; set; }
        public DateTime? ReleaseToOperationsDate { get; set; }

        public bool? IsTrainingCompleted { get; set; }
        public DateTime? TrainingSharedOn { get; set; }
        public DateTime? TrainingCompleted { get; set; }
        public bool? IsOrientationCompleted { get; set; }
        public DateTime? OrientationDate { get; set; }
        public DateTime? OrientationCompletionDate { get; set; }
        public DateTime? RescheduleOrientationDate { get; set; }
        public DateTime? OrientationSharedOn { get; set; }
        public int? OrientationStatusId { get; set; }
        public M_MasterData? OrientationStatus { get; set; }
        public string? ReasonForReschedule { get; set; }
        public int? ResumeUploadId { get; set; }
        public DocumentDetails? ResumeUploaded { get; set; }
        public int? RCMSUploadStatusId { get; set; }
        public M_MasterData? RCMSUploadStatus { get; set; }

        public int CandidatePersonalDetailsId { get; set; }
    }

    public class CandidateBgvDetails : BaseIdentifier
    {
        public int? VendorId { get; set; }
        public Partner? Vendor { get; set; }

        public int? PGUId { get; set; }
        public M_MasterData? PGU { get; set; }
        public DateTime? StartDate { get; set; }
        public bool? IsUploadedBGVDocs { get; set; }
        public bool? NDAAvailability { get; set; }
        public int? NDAAvailabilityDocId { get; set; }
        public DocumentDetails? NDAAvailabilityDoc { get; set; }
        public bool? CDAAvailability { get; set; }
        public int? CDAAvailabilityDocId { get; set; }
        public DocumentDetails? CDAAvailabilityDoc { get; set; }

        public bool? IsBGVAvailableWithPartner { get; set; }
        public int? BGVStatusId { get; set; }
        public string? BGVStatusName { get; set; }
        public int? BGVCategoryId { get; set; }
        public string? BGVCategoryName { get; set; }
        public DateTime? BGVCompletionDate { get; set; }
        public List<DocumentDetails>? UploadBGVDocs { get; set; }
        public List<DocumentDetails>? AdditionalDocs { get; set; }
        public bool? CandidateBGVCompleted { get; set; }
        public int? CandidatePersonalDetailsId { get; set; }

        public string? Comments {  get; set; }

        public DateTime? LastUpdated { get; set; }
    }
}

