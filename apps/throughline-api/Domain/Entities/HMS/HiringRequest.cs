using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.HMS
{
    public class HiringRequest : BaseIdentifier
    {
        public int? RequestorId { get; set; }
        public Users? Requestor { get; set; }
        public int? RecordTypeId { get; set; }
        public M_MasterData? RecordType { get; set; }
        public string? JobTitle { get; set; }

        public bool? IsRMOwnerAccepted { get; set; }
        public DateTime? RmOwnerAcceptedOn { get; set; } // Foreign Key to User (Logged-in user)
        public int? RmOwnerId { get; set; } // Foreign Key to User (Logged-in user)
        public Users? RMOwner { get; set; } // Foreign Key to User (Logged-in user)
        public string? RMOwnerComments { get; set; }


        public int? EngagementTypeId { get; set; }
        public M_MasterData? EngagementType { get; set; }

        public int? DomainId { get; set; } // From Master
        public M_Domain? Domain { get; set; }

        public int? HiringMangerId { get; set; } // Foreign Key to User (Logged-in user)
        public Users? HiringManager { get; set; } // Foreign Key to User (Logged-in user)

        public string HrqId { get; set; } = string.Empty; // Auto-generated (HRQ0592)
        public bool? IsParentHRQ { get; set; }
        public string? ParentHrqId { get; set; }
        public string? PreviousParentHrqId { get; set; }
        public string RCMSProjectId { get; set; } = string.Empty; // Auto-populated
        public string RCMSResourceRequestId { get; set; } = string.Empty; // Auto-populated
        public string ProjectName { get; set; } = string.Empty;
        public int? BusinessId { get; set; } // Business Master
        public M_MasterData? Business { get; set; }
        public DateTime RequestStartDate { get; set; }
        public DateTime RequestCreationDate { get; set; }
        public int? HiringTypeId { get; set; } // HiringType Master
        public M_MasterData? HiringType { get; set; }
        public int? HiringStatusId { get; set; } // HiringStatus Master
        public M_MasterData? HiringStatus { get; set; }

        public int? PreviousHiringStatusId { get; set; }
        public M_MasterData? PreviousHiringStatus { get; set; }

        public int? ProjectDurationMonths { get; set; }

        public string? HrqIdURL { get; set; }

        public string? EmployeeId { get; set; }
        public string? ReferredHrqId { get; set; }

        public int? BETApproverId { get; set; }
        public Users? BETApprover { get; set; }


        public int? RequestApproverId { get; set; }
        public Users? RequestApprover { get; set; }
        public DateTime? ApproverUpdatedDate { get; set; }
        public string? ApproverComments { get; set; }
        public int? ApprovalStatusId { get; set; }
        public M_MasterData? ApprovalStatus { get; set; }
        public string? ApproverEmail { get; set; }

        public bool IsSinglePosition { get; set; }
        public bool IsMultiplePositions { get; set; }
        public int? NumberOfPositions { get; set; } // Enabled if "Multi" is selected

        public bool? SkipScreening { get; set; }

        public DateTime? CancelledDate { get; set; }
        public DateTime? ClosedDate { get; set; }


        // Selected Candidate Details
        public bool? IsCandidateSelected { get; set; }
        public int? CandidateId { get; set; }

        public JobDetails? JobDetails { get; set; }
        public PartnerCategory? PartnerCategory { get; set; }
        public IEnumerable<InterviewRound>? InterviewRounds { get; set; }


        // Added Onhold Details
        public int? OnholdRequestedBy { get; set; }
        public Role? OnholdRequestedByRole { get; set; }
        public int? OnholdRaisedBy { get; set; }
        public Users? OnholdRaisedByUser { get; set; }
        public DateTime? OnholdRequestedDate { get; set; }
        public int? OnholdReasonId { get; set; }
        public M_MasterData? OnholdReason { get; set; }
        public string? OnholdComments { get; set; }
        public List<int>? FreezeCandidateTypes { get; set; }


        public DateTime? OnholdDate { get; set; } /// OnHold Reviewed Date
        public int? OnholdReviewedByUserId { get; set; }
        public Users? OnholdReviewedByUser { get; set; }
        public int? OnHoldReviewStatusId { get; set; }
        public M_MasterData? OnHoldReviewStatus { get; set; }
    }
}
