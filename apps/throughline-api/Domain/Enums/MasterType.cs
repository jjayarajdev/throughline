namespace EpicenterX.Domain.Enums
{
    public enum MASTER_TYPE
    {
        TYPE = 0,
        AGREEMENT_TYPE = 1,
        BUSINESS_UNIT = 2,
        CANDIDATE_STATUS = 3,
        CONTACT_MATRIX_CONTACT_TYPE = 4,
        USER_TYPE = 5,
        EMAIL_CATEGORY = 6,
        EMPLOYEE_TYPE = 7,
        ENGAGEMENT_STATUS = 8,
        ENGAGEMENT_TYPE = 9,
        ESCALATION_MATRIX_CONTACT_TYPE = 10,
        EVALUATION_STATUS = 11,
        HIRING_STATUS = 12,
        HIRING_TYPE = 13,
        HIRING_ACTIVITY_TYPE = 14,
        CANDIDATE_INTAKE_STATUS = 15,
        INTERVIEW_ROUND = 16,
        JOB_LEVEL = 17,
        JOB_PRIORITY = 18,
        PARTNER_STATUS = 19,
        PO_STATUS = 20,
        PO_TYPE = 21,
        PREFIX_TYPE = 22,
        REC_TYPE = 23,
        REJECTION_REASON = 24,
        ACTIVE_INACTIVE_STATUS = 25,
        COUNTRY = 26,
        STATE = 27,
        CITY = 28,
        DOMAIN = 29,
        SUBDOMAIN = 30,
        SKILL = 31,
        APPROVAL_STATUS = 32,
        FEEDBACK_CATEGORY = 33,
        RESOURCE_TYPE = 40,
        INTERVIEW_MODE = 41,
        NOTIFICATION_CATEGORY = 42,
        ACTIVE_PARTNERS = 43,
        PRIMARY_SKILLS = 44,
        SECONDARY_SKILLS = 45,
        ACTIVE_APPROVERS = 46,
        SLOT_STATUS = 47,
        ACTIVE_PANEL = 48,
        ACTIVE_HIRINGMANAGERS = 49,
        INTERVIEW_SLOT_STATUS = 50,
        PARTNER_APPROVAL_STATUS = 51,
        PARTNER_HIRING_REQUESTS = 52,
        ACTIVE_RM_OWENER = 53,
        DOMAIN_SPECIFIC_PARTNERS = 54,
        HRQ_SPECIFIC_PARTNERS = 55,
        SOW_CR_TYPES = 56,
        PO_CR_TYPES = 57,
        EMPLOYEE_CATEGORY_TYPE = 58,
        PGU_TYPE = 59,
        YES_OR_NO = 60, // Transport Required dropdown and Yes or No types
        GENDER = 61,
        EMPLOYEE_STATUS = 62,
        PC_SHIPMENT_MODE = 63,
        IT_ASSET_STATUS = 64,
        ORIENTATION_STATUS = 65,
        HRQ_ONHOLD_REASONS = 66,
        GRID_NAMES = 67,
        ALL_HIRING_REQUESTS = 68,
        DELAY_CATEGORY = 69,
        RATE_CATEGORY = 70,
        ACTIVE_USERS = 71,
        CAN_ONHOLD_ROLES = 72,
        RATE_CARD_CATEGORIES = 73,
        TAT_CATEGORIES = 74,
        ACTIVE_DOMAINMANAGERS = 75,
        BGV_CATEGORY = 76,
        BGV_STATUS_TYPES = 77,
        CANDIDATE_CATEGORY = 78,
        COMPLAINCE_FOLLOWED = 79,
        JOINING_STATUS = 80,
        TRAINING_MODULE = 81,
        USERS_BY_ROLES = 82,
        PARTNER_CATEGORY = 83,
        HRQ_JOBLOCATIONS = 84,
        REVIEW_STATUS = 85,
        PARTNER_TIRE = 86,
        CANDIDATE_DROP_REASON = 87,
        CANDIDATE_REINTIATE_REASON = 88,
        CANDIDATE_RECONSIDER_REASON = 89,

    }

    public enum JOINING_STATUS
    {
        Joined = 80001,
        Declined = 80002,
        Rescheduled = 80003
    }
    public enum COMPLAINCE_FOLLOWED
    {
        On_Time = 79001,
        Delayed = 79002,
        Yet_To_Join = 79003,
        Candidate_Dropped = 79004
    }

    public enum FinancialQuarter
    {
        Q1 = 1,
        Q2 = 2,
        Q3 = 3,
        Q4 = 4,
    }

    public enum DOC_TYPE
    {
        CDADOCS = 1,
        NDADOCS = 2,
    }

    public enum DurationRange
    {
        Days_0_30 = 1,
        Days_30_60 = 2,
        Days_60_90 = 3,
        Days_90_120 = 4,
        Days_120_Plus = 5,
        All = 6,
    }

    public enum PARTNER_APPROVAL_STATUS
    {
        PENDING = 1,
        APPROVED = 2,
        REJECTED = 3,
        REINITIATED = 4,
    }

    public enum INTAKE_STATUS_CATEGORY
    {
        Identified = 1,
        Offered = 2,
        Decliend = 3,
        NewJoiners = 4,
    }

    public enum GRID_NAMES
    {
        PartnerManagement = 1,
        HiringManagement = 2,
        CandidateManagement = 3,
        PartnerProfile_HiringDetails = 4,
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
        Partner_Engagement_OpenListGrid = 20,
        Candidate_Management_ALLHRQIDGrid = 21,
        CandidateApproval_PartnerException_MatrixEscalation = 22,
        CandidateApproval_PartnerException_SOWAcceptance = 23,
        CandidateManagement_ReviewCandidates = 25,
        CandidateApproval_HiringException = 26,
        Partner_Profile_TalentPool = 27,
        HiringManagement_ReviewRequests = 28,
        CandidateApproval_Duplicates = 29,
    }


    public enum INTERVIEW_ACTION_TYPE
    {
        CREATED = 1,
        PARTNER_ACCEPTED = 2,
        PARTNER_REJECTED = 3,
        PARTNER_RESCHEDULE_REQUESTED = 4,
        SCHEDULED = 5,
        RESCHEDULED = 6,
        COMPLETED = 7,
        MOVED_TO_FEEDBACK_PENDING = 8,
        PARTNER_UPDATED_RESCHEDULE_OR_CANDIDATE_DROPPED = 9,
        REJECTED = 10
    }

    public enum REC_TYPE
    {
        NEW = 23001,
        REPLICA = 23002,
    }

    public enum DURATION
    {
        ALL = 0,
        CURRENTDAY = 1,
        CURRENTWEEK = 2,
        CURRENTMONTH = 3,
    }
    public enum INTERVIEW_SLOT_STATUS
    {
        PENDING = 50001,
        INTERVIEW_SCHEDULED = 50002,
        RESHEDULED = 50003,
        FEEDBACK_PENDING = 50004,
        SELECTED = 50005,
        REJECTED = 50006,
        DROPPED = 50007,
        ONHOLD = 50008,
        DECLINED = 50009,
    }

    public enum INTERVIEW_SLOT_STATUS_CATEGORY
    {
        PENDING = 1,
        INTERVIEW_SCHEDULED = 2,
    }

    public enum NOTIFICATION_CATEGORY
    {
        PARTNER_APPROVAL = 42001,
        PARTNER_EVALUATION_INITIATED = 42002,
        PARTNER_EVALUATION_COMPLETED = 42003,
        PARTNER_EVALUATION_REJECTED = 42004,
        PARTNER_EVALUATION_EXTENDED = 42005,
        PARTNER_EMPANELED_REJECTED = 42006,
        PARTNER_EMPANELED_COMPLETED = 42007,
        PARTNER_EVALUATION_DUE_APPROACHING = 42008,
        PARTNER_PO_THRESHOLD_REACHED = 42009,
        PARTNER_PO_EXPIRATION_NOTIFICATION = 42010,
        PARTNER_PO_EXTENDED_NOTIFICATION = 42011,
        HIRING_REQUEST_APPROVAL = 42012,
        HIRING_REQUEST_INITIATED_TO_PARTNERS = 42013,
        INTERVIEW_NOTIFICATION_TO_PANELS = 42014,
        SLOT_ASSIGNMENT_NOTIFICATION_TO_PARTNERS = 42015,
        SLOT_ACCEPTANCY_NOTIFICATION_FROM_PARTNERS = 42016,
        SLOT_RESCHEDULE_NOTIFICATION_FROM_PARTNERS = 42017,
        INTERVIEW_STATUS_UPDATES = 42018,
        OVERALL_STATUS_UPDATES = 42019,
        AWAITING_BIN_ACTION = 42020,
        CANDIDATE_PROFILE_APPROVAL = 42021,
        CANDIDATE_PROFILE_MAPPED_TO_RMOWNER = 42022,
        CANDIDATE_SLOT_ASSIGNED_NOTIFICATION = 42023,
        CANDIDATE_RESCHEDULED_NOTIFICATION = 42024,
        CANDIDATE_STATUS_UPDATE_TO_PARTNER = 42025,
        CANDIDATE_PROFILE_STAGEWISE_NOTIFICATION = 42026,
        CANDIDATE_ONBOARDING_INITIATED_NOTIFICATION = 42027,
        CANDIDATE_DOCUMENT_PENDING_UPLOADS_NOTIFICATION = 42028,
    }

    public enum NAME_TYPE
    {
        PERSON = 5001,
        COMPANY = 5002,
    }

    public enum ROLES
    {
        ADMIN = 1,
        HIRINGMANAGER = 2,
        VENDORMANAGER = 3,
        PARTNER = 4,
        PANEL = 5,
        RMOwner = 6,
        BETApprover = 7,
        DomainManager = 9,
        Leadership = 10,
        BETMember = 11
    }

    public enum CONTACT_MATRIX_CONTACT_TYPE
    {
        HIRINGSPOC = 1,
        ACCOUNTMANAGER = 2,
        HRSPOC = 3,
        FINANCESPOC = 4,
        COMPLIANCESPOC = 5
    }

    public enum CONTACT_MATRIX_STATUS
    {
        PENDING = 1,
        APPROVED = 2,
        REJECTED = 3,
    }
    public enum ACTIVE_STATUS
    {
        ACTIVE = 25001,
        INACTIVE = 25002,

    }
    public enum INTERVIEW_MODE
    {
        IN_PERSON = 41001,
        VIRTUAL = 41002,
        PHONE_CALL = 41003,
        PROFILE_REVIEW = 41004,
        ONLINE_ASSESSMENT = 41005,
        CODING_ASSESSMENT = 41006,
        ONLINE_EXERCISE = 41007,
        CODING_EXERCISE = 41008,
    }


    public enum AGREEMENT_TYPE
    {
        MSA_MATER_SERVICE_AGREEMENT = 1001,
        POTAC = 1002
    }

    public enum BUSINESS_UNIT
    {
        PS_GCC = 2001,
        UIDAI = 2002,
        RPA = 2003,
    }

    public enum CANDIDATE_STATUS
    {
        SCREEN_SELECT = 3001,
        SCREEN_REJECT = 3002,
        TECH_SELECT = 3003,
        TECH_REJECT = 3004,
        CANDIDATE_ON_HOLD = 3005,
        SELECTED = 3006,
        CANDIDATE_DROP = 3007,
        OPS_SELECT = 3008,
        OPS_REJECT = 3009,
        REJECTED = 3010,
    }

    public enum CANDIDATE_MATRIX_CONTACT_TYPE
    {
        HIRING_SPOC = 4001,
        ACCOUNT_MANAGER = 4002,
        HR_SPOC = 4003,
        FINANCE_SPOC = 4004,
        COMPLAINCE_SPOC = 4005,
        OTHERS = 4006,
    }

    public enum EMAIL_CATEGORY
    {
        PARTNER_ONBOARDING = 6001,
        PARTNER_OFFBOARDING = 6002,
    }

    public enum EMPLOYEE_TYPE
    {
        PERMENANT = 7001,
        CONTRACT = 7002,
    }

    public enum ENGAGEMENT_STATUS
    {
        ACTIVE = 8001,
        INACTIVE = 8002,
        EVALUATION_IN_PROGRESS = 8003,
        REJECTED = 8004,
    }
    public enum ENGAGEMENT_TYPE
    {
        LABOUR = 9001,
        TRAINING = 9002,
        APPLICATION_DEVELOPMENT = 9003,
        CONSULTING = 9004,
        OTHERS = 9005,
    }

    public enum ESCALATION_MATRIX_CONTACT_TYPE
    {
        LEADERSHIP_1 = 10001,
        LEADERSHIP_2 = 10002,
        LEADERSHIP_3 = 10003,
    }

    public enum EVALUATION_STATUS
    {
        INITIATED = 11001,
        COMPLETED = 11002,
        EXTENDED = 11003,
        REJECTED = 11004,
        EMPANELLED = 11005,
    }

    public enum SCREENING_STATUS
    {
        Accepted = 1,
        Rejected = 2,
        Dropped = 3
    }


    public enum HIRING_STATUS
    {
        // Review requests
        NEW = 12001,

        // In-Progress requests
        WIP = 12002,

        OFFER_ACCEPTED = 12003,
        CANDIDATE_IDENTIFIED = 12004,
        ON_HOLD = 12005,
        CALLED_OFF = 12006,

        // Closed requests
        CLOSED = 12007,

        // Cancelled requests
        CANCELLED = 12008,
    }

    public enum HIRING_TYPE
    {
        NEW_DEAL = 13001,
        EXISTING_DEAL = 13002,
        BACKFILL = 13003,
        NEW_INVESTMENT = 13004,
    }
    public enum HIRING_ACTIVITY_TYPE
    {
        LATERAL_EXTERNAL = 14001,
        LATERAL_INTERNAL = 14002,
    }

    public enum CANDIDATE_INTAKE_STATUS
    {
        //NEW = 15001,
        SCREENING = 15002,  // Screening
        INTERVIEWING = 15003, // Interviewing
        FEEDBACK_PENDING = 15004,
        CANDIDATE_IDENTIFIED = 15009,
        REJECTED = 15005,
        ONHOLD = 15006,
        OFFER_ROLLED_OUT = 15007,
        ONBOARDED = 15008,
        CANDIDATE_DROP = 15010,
        OFFER_ACCEPTED = 15011,
        OFFER_DECLINED = 15012,
        //CANDIDATE_FREEZED = 15013,
    }

    public enum SLOT_STATUS
    {
        PENDING = 47001,
        CONFIRMED = 47002,
    }

    public enum RESHEDULE_OR_DROPPED
    {
        RESHEDULED = 1,
        DROPPED = 2,
    }

    public enum RESHEDULE_INITIATED
    {
        CANDIDATE = 1,
        PANEL = 2
    }

    public enum INTERVIEW_ROUND
    {
        SCREENING = 16001,
        ONLINE_ASSESSMENT = 16002,
        CODE_ASSESSMENT = 16003,
        BUSINESS_CASE = 16004,
        TECHNICAL = 16005,
        TECHNICAL_OPS = 16006,
        OPS = 16007,
        FINAL = 16008,
    }

    public enum JOB_LEVEL
    {
        ENTRY = 17001,
        INTERMEDIATE = 17002,
        SPECIALIST = 17003,
        EXPERT = 17004,
        MASTER = 17005,
    }

    public enum JOB_PRIORITY
    {
        CRITICAL = 18001,
        HIGH = 18002,
        MEDIUM = 18003,
        LOW = 18004,
        IDENTIFIED = 18005,
    }

    public enum PARTNER_STATUS
    {
        ACTIVE = 19001,
        INACTIVE = 19002,
        EVALUATION_IN_PROGRESS = 19003,
        REJECTED = 19004
    }

    public enum PO_STATUS
    {
        ACTIVE = 20001,
        INACTIVE = 20002,
        UP_FOR_RENEWAL = 20003,
        THRESHOLD_REACHED = 20004,
        ABOUT_TO_EXPIRE = 20005,
    }
    public enum SOW_STATUS
    {
        ACTIVE = 1,
        INACTIVE = 2,
        ABOUT_TO_EXPIRE = 3,
        UP_FOR_RENEWAL = 4,
    }

    public enum PO_TYPE
    {
        NEW = 21001,
        AMENDMENT = 21002,
    }

    public enum APPROVAL_STATUS
    {
        APPROVED = 32001,
        REJECTED = 32002,
    }

    public enum REVIEW_STATUS
    {
        PENDING = 85001,
        APPROVED = 85002,
        REJECTED = 85003,
    }


    public enum EVALUATION_ENGAGEMENTS
    {
        INPROGRESS = 1,
        EXPIRING = 2,
        COMPLETED = 3,
        EMPANELLED = 4,
        REJECTED = 5,
    }

    public enum SLOT_ALLOCATION
    {
        ASSIGN_SLOTS = 1,
        PENDING = 2,
        REJECTED = 3,
        SCHEDULED = 4,
    }

    public enum PO_CATEGORY_TYPE
    {
        ACTIVE = 1,
        EXPIRING = 2,
        INACTIVE = 3,
    }

    public enum EvaluationStatus
    {
        Extended = 1,
        Completed = 2,
        Rejected = 3
    }

    public enum OnHoldHiringCategory
    {
        Full = 1,
        Partial = 2
    }

    public enum FreezeCandidateType
    {
        TalentPool = 1,
        TalentPipeline = 2,
        CandidateIdentified = 3,
        CandidateRejected = 4,
    }
    public enum MATRIX_TYPE
    {
        CONTACT_MATRIX = 1,
        ESCALATION_MATRIX = 2
    }


    public enum EXCEPTION_APPROVAL_STATUS
    {
        Accepted = 1,
        Declined = 2
    }

    public enum CANDIDATE_DROP_REASON
    {
        NOT_RESPONDING = 87001,
        NOT_WILLING = 87002,
        NOT_MATCH = 87003
    }

    public enum CANDIDATE_REINTIATE_REASON
    {
        INTERESTED = 88001,
        AVAILABLE = 88002,
        BEST_SUITE = 88003
    }

    public enum CANDIDATE_RECONSIDER_REASON
    {
        INTERESTED = 89001,
        AVAILABLE = 89002,
        BEST_SUITE = 89003
    }

    public enum CONFIGURATON_KEYS
    {
        DefaultOnboardingManagerEmail,
        DefaultHiringManagerEmail,
        DefaultOnHoldNotificationRemainderInDays,
        DefaultOnHoldRejectInDays,
        DefaultPartnerInactiveInDays,
        DefaultRMOwnerEmail,
        DefaultRMOwnerAssignHours
    }
}
