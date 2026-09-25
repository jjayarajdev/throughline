export enum FilterTypeEnum {
  PMSGrid = 1,
  HMSGrid = 2,
  CMSGrid = 3,
  PartnerManagement = 1,
  HiringManagement = 2,
  CandidateManagement = 3,
  PartnerProfileHiringDetails = 4,
  HiirngManagement_PartnerHiringRequest = 5,
  SOWManagement_PartnerSOWDetails = 6,
  SOWManagement_CompleteSOWDetails = 7,
  CandidateApprovalGrid = 8,
  Evaluation_Screening = 9,
  Evaluation_FeedbackPending = 10,
  Evaluation_Completed = 11,
  SlotAllocation_AssignSlots = 12,
  SlotAllocation_Pending = 13,
  SlotAllocation_Declined = 14,
  SlotAllocation_Scheduled = 15,
  CandidateOnboarding_Identified = 16,
  CandidateOnboarding_Offered = 17,
  CandidateOnboarding_Declined = 18,
  Engagement_Management = 19,
  Partner_Engagement_OpenListGrid=20,
  All_HRQID =21,
  MATRIXESCALATION=22,
  SOW=23
}


export enum SlotAllocationType{
  assignslot = 1,
  pending = 2,
  declined = 3,
  scheduled = 4,
}
