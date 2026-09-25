export const SLOT_STATUS = {
  ASSIGN_SLOT: 1,
  PENDING: 2,
  SCHEDULED: 4,
  DECLINED: 3,
} as const;

export type SlotStatusType = (typeof SLOT_STATUS)[keyof typeof SLOT_STATUS];

export const SLOT_STATUS_CONFIG = {
  [SLOT_STATUS.ASSIGN_SLOT]: {
    title: "Assign Slot",
    actionButton: "Assign Slot",
    sheetComponent: "AssignSlotSheet",
  },
  [SLOT_STATUS.PENDING]: {
    title: "Pending",
    actionButton: "Pending",
    sheetComponent: "PendingSheet",
  },
  [SLOT_STATUS.DECLINED]: {
    title: "Declined",
    actionButton: "Assign Slot",
    sheetComponent: "DeclinedSheet",
  },
  [SLOT_STATUS.SCHEDULED]: {
    title: "Scheduled",
    actionButton: "Edit",
    sheetComponent: "ScheduledSheet",
  },
} as const;

//partner slot status

export const PARTNER_SLOT_STATUS = {
  ASSIGN_SLOT: 1,
  SCHEDULED: 2,
} as const;

export const PARTNER_SLOT_STATUS_CONFIG = {
  [PARTNER_SLOT_STATUS.ASSIGN_SLOT]: {
    title: "Accept Slot",
    actionButton: "Manage",
    sheetComponent: "AssignSlotSheet",
  },
  [PARTNER_SLOT_STATUS.SCHEDULED]: {
    title: "Scheduled",
    actionButton: "Confirm",
    sheetComponent: "ScheduledSheet",
  },
} as const;

export enum EnumType {
  tat = 48,
}
type InterviewFilterOption = {
  id: number;
  name: string;
};

// Filter options array
export const InterviewFilterOptions: InterviewFilterOption[] = [
  { id: 15009, name: "CANDIDATE IDENTIFIED" },
  { id: 15007, name: "OFFER ROLLED OUT" },
  { id: 15008, name: "ONBOARDED" },
  { id: 15011, name: "OFFER ACCEPTED" },
  { id: 15012, name: "OFFER DECLINED" }
]

export enum RoundName{
  SCREENING = 16001,
  ONLINE_ASSESSMENT = 16002,
  CODE_ASSESSMENT = 16003,
  BUSINESS_CASE = 16004,
  TECHNICAL = 16005,
  TECHNICAL_OPS = 16006,
  OPS = 16007,
  FINAL = 16008,
}
