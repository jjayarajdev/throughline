using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Domain.Entities.CMS
{
    public class CandidateHistory : BaseIdentifier
    {
        public int? CandidateId { get; set; }
        //public Candidate? Candidate { get; set; }
        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
        public int? HiringRequestId { get; set; }
        public HiringRequest? HiringRequest { get; set; }
        public bool IsSingleEntry { get; set; }
        public string? CandidateCode { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public List<int>? PrimarySkillIds { get; set; }
        public List<int>? SecondarySkillIds { get; set; }
        public int? CountryId { get; set; }
        public M_Country? Country { get; set; }
        public int? StateId { get; set; }
        public M_State? State { get; set; }
        public int? CityId { get; set; }
        public M_City? City { get; set; }
        public string? Diversity { get; set; }
        public int? NoticePeriod { get; set; }
        public int? RelevantExperience { get; set; }
        public string? CurrentlyWorking { get; set; }
        public string? CurrentOrganisation { get; set; }
        public string? LastOrganisation { get; set; }

        public DateTime? LastWorkingDay { get; set; }
        public int? ResumeId { get; set; }
        public DocumentDetails? Resume { get; set; }
        public string? EmployeeId { get; set; }
        public int? ResourceTypeId { get; set; }
        public M_MasterData? ResourceType { get; set; }
        public string? PCLifecycleId { get; set; }
        public bool? RequestedMicrosoftAccount { get; set; }
        public bool? ConsideredForFutureRequirements { get; set; }
        public string? IsReferred { get; set; }
        public string? ReferredBy { get; set; }
        public string? Comments { get; set; }

        public int? IntakeStatusId { get; set; }
        public int? PreviousIntakeStatusId { get; set; }
        public bool? IsFreezed { get; set; }
        public string? CandidateFreezedReason { get; set; }
        public M_MasterData? IntakeStatus { get; set; }
        public int? CandidateStatusId { get; set; }
        public M_MasterData? CandidateStatus { get; set; }
        public bool? IsAgreedForTermsConditions { get; set; }
        public int? ApprovedBy { get; set; }
        public Users? Approver { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public bool? IsDuplicate { get; set; }
        public bool? IsScreeningCompleted { get; set; }
        public DateTime? ScreeningCompletedOn { get; set; }
        public DateTime? InterviewCompletedOn { get; set; }
        public DateTime? CandidateIdentifiedOn { get; set; }
        public DateTime? CandidateDroppedOn { get; set; }
        public DateTime? CandidateReintiatedOn { get; set; }
        public int? CandidateDropOrReintiateByUserId { get; set; }
        public string? CandidateDropOrReintiateByUserComments { get; set; }
        public DateTime? CandidateFreezedOn { get; set; }
        public DateTime? OfferAcceptedOn { get; set; }
        public DateTime? OfferDeclinedOn { get; set; }
        public DateTime? OfferRolledOutOn { get; set; }
        public DateTime? CandidateOnholdOn { get; set; }
        public DateTime? CandidateRejectedOn { get; set; }
        public DateTime? CandidateJoinedOn { get; set; }
        public DateTime? CandidateRescheduledOn { get; set; }
        public bool? ScreeningStatus { get; set; }
        public DateTime? ResumeUploadedOn { get; set; }


        //Transfer Details
        public int? OriginalHiringRequestId { get; set; }
        public bool? IsTransferred { get; set; }
        public int? TransferredByUserId { get; set; }

        public int? CandidateRateCardId { get; set; }

        public DateTime? ReUploadedCandidateOn { get; set; }
        public int? CandidateReconsiderationHistoryId { get; set; }

        public CandidateHistory()
        {

        }
        public CandidateHistory(Candidate candidate)
        {
            CandidateId = candidate.Id;
            PartnerId = candidate.PartnerId;
            HiringRequestId = candidate.HiringRequestId;
            IsSingleEntry = candidate.IsSingleEntry;
            CandidateCode = candidate.CandidateCode;
            FullName = candidate.FullName;
            PhoneNumber = candidate.PhoneNumber;
            Email = candidate.Email;
            CountryId = candidate.CountryId;
            StateId = candidate.StateId;
            CityId = candidate.CityId;
            Diversity = candidate.Diversity;
            NoticePeriod = candidate.NoticePeriod;
            RelevantExperience = candidate.RelevantExperience;
            CurrentlyWorking = candidate.CurrentlyWorking;
            CurrentOrganisation = candidate.CurrentOrganisation;
            LastOrganisation = candidate.LastOrganisation;
            LastWorkingDay = candidate.LastWorkingDay;
            ResumeId = candidate.ResumeId;
            EmployeeId = candidate.EmployeeId;
            ResourceTypeId = candidate.ResourceTypeId;
            PCLifecycleId = candidate.PCLifecycleId;
            RequestedMicrosoftAccount = candidate.RequestedMicrosoftAccount;
            ConsideredForFutureRequirements = candidate.ConsideredForFutureRequirements;
            IsReferred = candidate.IsReferred;
            ReferredBy = candidate.ReferredBy;
            Comments = candidate.Comments;
            IntakeStatusId = candidate.IntakeStatusId;
            CandidateStatusId = candidate.CandidateStatusId;
            IsAgreedForTermsConditions = candidate.IsAgreedForTermsConditions;
            ApprovedBy = candidate.ApprovedBy;
            ApprovedDate = candidate.ApprovedDate;
            IsDuplicate = candidate.IsDuplicate;
            IsScreeningCompleted = candidate.IsScreeningCompleted;
            ScreeningCompletedOn = candidate.ScreeningCompletedOn;
            InterviewCompletedOn = candidate.InterviewCompletedOn;
            CandidateIdentifiedOn = candidate.CandidateIdentifiedOn;
            CandidateDroppedOn = candidate.CandidateDroppedOn;
            CandidateFreezedOn = candidate.CandidateFreezedOn;
            OfferDeclinedOn = candidate.OfferDeclinedOn;
            OfferAcceptedOn = candidate.OfferAcceptedOn;
            OfferRolledOutOn = candidate.OfferRolledOutOn;
            CandidateOnholdOn = candidate.CandidateOnholdOn;
            CandidateRejectedOn = candidate.CandidateRejectedOn;
            CandidateRescheduledOn = candidate.CandidateRescheduledOn;
            CandidateJoinedOn = candidate.CandidateJoinedOn;
            ScreeningStatus = candidate.ScreeningStatus;
            ResumeUploadedOn = candidate.ResumeUploadedOn;
            OriginalHiringRequestId = candidate.OriginalHiringRequestId;
            IsTransferred = candidate.IsTransferred;
            TransferredByUserId = candidate.TransferredByUserId;
            CandidateRateCardId = candidate.CandidateRateCardId;
            PrimarySkillIds = candidate.PrimarySkillIds;
            SecondarySkillIds = candidate.SecondarySkillIds;
            IsActive = true;
        }
    }
}
