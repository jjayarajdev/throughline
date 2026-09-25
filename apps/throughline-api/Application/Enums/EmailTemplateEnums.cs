namespace EpicenterX.Application.Enums
{
    public enum PartnerEmailTemplateEnums : int
    {
        PartnerApprovalNotification = 42001,
        PartnerEvaluationInitiated = 42002,
        PartnerEvaluationCompleted = 4003,
        PartnerEvaluationRejected = 4004,
        PartnerEvaluationExtended = 4005,
        PartnerEmpaneledRejected = 4006,
        PartnerEmpaneledCompleted = 4007,
        PartnerEvaluationDueApproaching = 4008,
        PartnerPOThresholdReached = 4009,
        PartnerPOExpirationNotification = 4010,
        PartnerPOExtendedNotification = 4011,
        
        CandidateInterviewStatusNotification = 42003,
        CandidateInterviewPending = 42004,
        CandidateInterviewRescheduledNotification = 42005,
        ScheduleInterviewSlotNotification = 42006,
        PartnerInterviewSlotApprovedNotification = 42007,
        PartnerCandidateInterviewStatusUpdateReminderNotification = 42008,
        PartnerInterviewSlotUpdateNotification = 42009,
        PartnerInterviewSlotApprovalUpdateNotification = 42010,
        CandidateInterviewStatusUpdateNotification = 42011,
        PartnerHiringAssociationStatusUpdateNotification = 42012,
        PartnerApprovedNotification = 42013,
        CandidateUploadedNotification = 42014,
        PartnerContactAddedMatrixApproval = 42015,
        PartnerContactUpdatedMatrixApproval = 42016,
        PartnerEscalationMatrixApproval = 42017,
        PartnerEscalationMatrixUpdate = 42018,
        PartnerEngagementNotification = 42019,
        BackgroundPartnerEvaluationUpdateNotification = 42020,
        PartnerEscalationAddedMatrixApproval = 42021,
        PartnerEmpaneledUpdationNotification = 42022,
        PartnerSOWAddedNotification = 42023,
        PartnerSowPODetailUpdateNotification = 42024,
        PartnerSowDetailUpdatedNotification = 42025,
        PartnerSowPODetailAddNotification = 42026,
        PartnerJobDetailsAddedNotification = 42027,
        PartnerJobDetailsEditedNotification = 42028,
        PartnerCandidateUpload = 42029,
        PartnerEscalationUpdatedMatrixApproval = 42030,
        PartnerEmpanelement = 42031,
        PartnerEvaluationUpdateForHiringManagerNotification = 42032,
        PartnerEvaluationUpdateNotification = 42033,
        PartnerHiringRemoveAssociationNotification = 42034,
        PartnerInterviewSlotAcceptedUpdateNotification = 42035,
        PartnerInterviewSlotRejectedUpdateNotification = 42036,
        PartnerCandidateInterviewStatusUpdateNotification = 42037,
        PartnerCandidateInterviewNotHappendNotification = 42038,
        PartnerJobPrioirtyUpdatedNotification = 42039,
        HiringRequestCandidateInterviewUpdateNotification = 42040,

        RMAcceptedNotification = 43002,
        RMRejectedNotification = 43012
    }

    public enum HiringEmailTemplateEnums : int
    {

        RMApprovalNotification = 44001,
        HiringRequestCreationAcknowledgementNotification = 44010,
        RMAcceptedNotification = 44012,
        HiringRequestJobDetailsUpdatedNotification = 44013,
        HiringRequestApprovedNotification = 43003,
        HiringRequestStatusUpdateNotification = 44017,
        HiringRequestAddedNotification = 43005,
        HiringRequestUpdatedNotification = 43006,

        AddCalibrationNotification = 44015,
        UpdateCalibrationNotification = 43009,

        PartnerPOExtendedNotification = 4011,
        PartnerContactMatrixApproval = 42003,
        PartnerEscalationMatrixUpdateApproval = 42004,
        PartnerEmpanelement = 42005,
        PartnerUpdateApprovalNotification = 42006,
        PartnerApprovedNotification = 42007,
        PartnerContactAddedMatrixApproval = 42008,
        PartnerContactUpdatedMatrixApproval = 42009,
        PartnerEscalationAddedMatrixApproval = 42010,
        PartnerEmpanelemntUpdatedNotification = 42012,
        PartnerSowDetailAddedNotification = 42013,
        PartnerSowPODetailAddedNotification = 42014,
        PartnerSowDetailUpdatedNotification = 42015,
        PartnerSowPODetailUpdateNotification = 42016,

        HiringRequestOnHoldNotification = 44016,
        HiringRequestJobPrioirtyUpdatedNotification = 44014,
    }

    public enum CandidateEmailTemplateEnums : int
    {

        PartnerCandidateUpload = 45001,
        CandidateProfileAccepted = 45002
    }
}
