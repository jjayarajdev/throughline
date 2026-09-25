namespace EpicenterX.Application.DTOs.HMS.HiringRequest
{
    public class ViewHiringRequestDto
    {
        //public int? HiringRequestId { get; set; }
        //public string? HrqId { get; set; }
        //public string JobTitle { get; set; } = string.Empty;
        //public string? RMOwnerName { get; set; }
        //public string? HiringManagerName { get; set; }
        //public string ProjectName { get; set; } = string.Empty;
        //public string? BusinessName { get; set; }
        //public DateTime RequestStartDate { get; set; }
        //public string? DomainName { get; set; }
        //public string? DomainManagerName { get; set; }


        //public string? RecordTypeName { get; set; }
        //public string? RcMsId { get; set; }
        //public bool? IsRMOwnerAccepted { get; set; }
        //public DateTime? RmOwnerAcceptedOn { get; set; }
        //public string? EngagementTypeName { get; set; }
        //public string? HierarchyLevel { get; set; }
        //public string? ParentHrqId { get; set; }
        //public string RcMsProjectId { get; set; } = string.Empty; // Auto-populated
        //public string RcMsResourceRequestId { get; set; } = string.Empty; // Auto-populated

        //public DateTime RequestCreationDate { get; set; }
        //public string? HiringStatusName { get; set; }
        //public int? ProjectDurationMonths { get; set; }
        //public string? EmployeeId { get; set; }
        //public string? ReferredHrqId { get; set; }


        // BET Approver Details
        //public string? BETApproverName { get; set; }
        //public DateTime? ApproverUpdatedDate { get; set; }
        //public string? ApproverComments { get; set; }
        //public string? ApprovalStatusName { get; set; }
        //public string? ApproverEmail { get; set; }

        //public bool IsSinglePosition { get; set; }
        //public bool IsMultiplePositions { get; set; }
        //public int? NumberOfPositions { get; set; }

        //public string? ResourceTypeName { get; set; }
        //public string? RequestorName { get; set; }


        // Onhold Details
        //public DateTime? OnholdDate { get; set; }
        //public string? OnholdByUserName { get; set; }
        //public int? OnholdReasonId { get; set; }
        //public string? OnholdReasonName { get; set; }
        //public string? OnholdComments { get; set; }


        public ViewHiringDetailsDto? ViewHiringDetails { get; set; }
        public ViewJobDetailsDto? ViewJobDetails { get; set; }
        //public ViewPartnerCategoryDto? ViewPartnerCategoryDto { get; set; }
        public List<ViewInterviewRoundsDto>? ViewInterviewRounds { get; set; }
        public List<ViewCalibrationDetailsDto>? ViewCalibrationDetails { get; set; }
    }

    public class ViewHiringDetailsDto
    {
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? HiringManagerName { get; set; }
        public string? RMOwnerName { get; set; }
        public string? HiringTypeName { get; set; }
        public string? ProjectName { get; set; }
        public string? BusinessName { get; set; }
        public DateTime? RequestStartDate { get; set; }
        public DateTime? RequestAssignedDate { get; set; }
        public string? DomainName { get; set; }
        public string? DomainManagerName { get; set; }
        public string? BETApproverName { get; set; }
        public string? RequestApprovedBy { get; set; }
        public string? RequestApprovedOn { get; set; }
        public string? RequestApprovedByComments { get; set; }
        public string? RequestRejectedBy { get; set; }
        public string? RequestRejectedOn { get; set; }
        public string? RequestRejectedByComments { get; set; }
    }

    public class ViewJobDetailsDto
    {
        public string? JobDescription { get; set; }
        public string? HiringActivityName { get; set; }
        public string? JobPriorityName { get; set; }
        public string? SubDomainName { get; set; }
        public string? SubDomainManagerName { get; set; }
        public string? PrimarySkillsNames { get; set; }
        public string? SecondarySkillsNames { get; set; }
        public string? MandatoryCertification { get; set; }
        public string? JobLevelName { get; set; }
        public int? RelevantExperience { get; set; }
        public int? TotalExperience { get; set; }
        public string? Country { get; set; }
        public string? States { get; set; }
        public string? JobLocations { get; set; }
        public string? SecondaryCitys { get; set; }

        //public DateTime? HiringDate { get; set; }
        //public string? ResourceTypeName { get; set; }
        //public DocumentDetailDto? UploadedJD { get; set; }
        //public int HiringRequestId { get; set; }
    }

    public class ViewPartnerCategoryDto
    {
        //public int HiringRequestId { get; set; }
        public bool IsSpecificPartner { get; set; }
        public bool IsProxyPartner { get; set; }
        public bool IsRecommendThePartner { get; set; }
        public string? SelectedPartners { get; set; }
        public int? ProfileCAP { get; set; }
        public string? Comments { get; set; }
    }

    public class ViewInterviewRoundsDto
    {
        //public int? HiringRequestId { get; set; } // Foreign Key
        public int? RoundNumber { get; set; }
        public string? RoundNameName { get; set; } //Round Master: Screening, Technical, etc.
        public string? PanelNames { get; set; }
        public string? ModeOfInterviewName { get; set; }
        public string? CategoryName { get; set; }

        public string? Comments { get; set; }
        //public bool? IsAddSpecificCandidates { get; set; }
        //public List<int>? Candidates { get; set; }
        //public string? CandidateNames { get; set; }
        public bool? AddFeedbackCritria { get; set; }
        //public bool? SkipScreening { get; set; }
        //public int? ScreeningCap { get; set; }
        //public List<string>? AvailableDays { get; set; }
        public List<FeedbackCritriaOptionsDto>? FeedbackCritriaOptions { get; set; }
    }

    public class ViewCalibrationDetailsDto
    {
        public string? HrqId { get; set; }
        public string? JobTitle { get; set; }
        public string? Attendees { get; set; }
        public DateTime CalibrationDate { get; set; }
        public string? Certifications { get; set; }
        public DocumentDetailDto? Documents { get; set; }
        public string? Comments { get; set; }


        //public string? PrimarySkills { get; set; }
        //public string? SecondarySkills { get; set; }
        //public int? HiringRequestId { get; set; }
    }
}
