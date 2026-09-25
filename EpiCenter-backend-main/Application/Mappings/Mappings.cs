using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.CandidateBin;
using EpicenterX.Application.DTOs.CMS.CandidateRateCard;
using EpicenterX.Application.DTOs.CMS.InterviewSlot;
using EpicenterX.Application.DTOs.CMS.JoiningRescheduleHistory;
using EpicenterX.Application.DTOs.CMS.Onboarding.AssetDetails;
using EpicenterX.Application.DTOs.CMS.Onboarding.CandidateBgvDetails;
using EpicenterX.Application.DTOs.CMS.Onboarding.PersonalDetails;
using EpicenterX.Application.DTOs.CMS.Onboarding.ProfileTracker;
using EpicenterX.Application.DTOs.CMS.Onboarding.TrainingDetails;
using EpicenterX.Application.DTOs.GetAllMatrix;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.HMS.Calibration;
using EpicenterX.Application.DTOs.HMS.HiringRequest;
using EpicenterX.Application.DTOs.HMS.InterviewRound;
using EpicenterX.Application.DTOs.HMS.JobDetails;
using EpicenterX.Application.DTOs.HMS.PartnerCategory;
using EpicenterX.Application.DTOs.Masters;
using EpicenterX.Application.DTOs.Panel;
using EpicenterX.Application.DTOs.PMS;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Application.DTOs.PMS.Empanelment;
using EpicenterX.Application.DTOs.PMS.Engagement;
using EpicenterX.Application.DTOs.PMS.EscalationMatrix;
using EpicenterX.Application.DTOs.PMS.PartnerProfile;
using EpicenterX.Application.DTOs.PMS.SOW;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Mappings
{
    public class Mappings : Profile
    {
        public Mappings()
        {
            #region Masters

            CreateMap<BaseIdentifierDto, BaseIdentifier>().AfterMap<BaseIdentifierMapping>();
            CreateMap<BaseIdentifier, BaseIdentifierDto>().AfterMap<BaseIdentifierDtoMapping>();

            CreateMap<DropdownDto, M_MasterData>().ReverseMap();
            CreateMap<M_Form, FormDto>().ReverseMap();
            CreateMap<RoleFormAccessDto, M_RoleFormAccess>().ReverseMap();
            CreateMap<M_Module, ModuleDto>().ReverseMap();

            CreateMap<GetSearchColumnDto, M_SearchColumn>().ReverseMap();

            CreateMap<MasterDto, M_JobLevel>().ReverseMap();

            CreateMap<CountryMasterDto, M_Country>().ReverseMap();
            CreateMap<StateMasterDto, M_State>().ReverseMap();
            CreateMap<CityMasterDto, M_City>().ReverseMap();
            CreateMap<FeedbackCritriaOptions, DropdownDto>()
                .ForMember(destination => destination.Name, opt => opt.MapFrom(src => src.CriteriaOption!.Name));

            CreateMap<M_Country, CountryMasterDto>()
               .ForMember(destination => destination.CountryId, opt => opt.MapFrom(src => src.Id))
               .ForMember(destination => destination.CountryName, opt => opt.MapFrom(src => src.Name));

            CreateMap<M_State, StateMasterDto>()
                .ForMember(destination => destination.CountryId, opt => opt.MapFrom(src => src.CountryId))
                .ForMember(destination => destination.StateId, opt => opt.MapFrom(src => src.Id))
                .ForMember(destination => destination.StateName, opt => opt.MapFrom(src => src.Name));

            CreateMap<M_City, CityMasterDto>()
                .ForMember(destination => destination.StateId, opt => opt.MapFrom(src => src.StateId))
                .ForMember(destination => destination.CityId, opt => opt.MapFrom(src => src.Id))
                .ForMember(destination => destination.CityName, opt => opt.MapFrom(src => src.Name));

            CreateMap<HiringRequest, MasterDto>().ReverseMap();

            CreateMap<Partner, MasterDto>()
                    .ForMember(destination => destination.StateId, opt => opt.MapFrom(src => (int?)null))
                    .ForMember(destination => destination.CountryId, opt => opt.MapFrom(src => (int?)null))
                    .ForMember(destination => destination.DomainIds, opt => opt.MapFrom(src => (List<int>?)null))
                    .ForMember(destination => destination.PartnerCode, opt => opt.MapFrom(src => src.PartnerCode))
                    .ForMember(destination => destination.Name, opt => opt.MapFrom(src => src.Nickname));

            CreateMap<MasterDto, M_City>().ReverseMap();
            CreateMap<MasterDto, M_Country>().ReverseMap();
            CreateMap<M_Country, MasterDto>()
                    .ForMember(destination => destination.CountryCode, opt => opt.MapFrom(src => src.CountryCode));

            CreateMap<M_Domain, MasterDto>()
                .ForMember(destination => destination.DomainManagerId, opt => opt.MapFrom(src => src.DomainManagerId))
                .ForMember(destination => destination.DomainManagerName, opt => opt.MapFrom(src => src.DomainManager!.FullName));

            CreateMap<MasterDto, M_Domain>();

            CreateMap<MasterDto, M_SubDomain>();


            CreateMap<MasterDto, M_Skill>().ReverseMap();
            CreateMap<MasterDto, M_State>().ReverseMap();

            CreateMap<M_SubDomain, MasterDto>()
                    .ForMember(destination => destination.DomainId, opt => opt.MapFrom(src => src.DomainId))
                    .ForMember(destination => destination.SubDomainManagerName, opt => opt.MapFrom(src => src.SubDomainManager!.FullName));

            CreateMap<MasterDto, M_MasterData>().ReverseMap();
            CreateMap<GetMasterDto, M_MasterData>().ReverseMap();
            CreateMap<DocumentDetails, DocumentDetailDto>().AfterMap<DocumentMapping>();
            CreateMap<DocumentDetailDto, DocumentDetails>().AfterMap<DocumentReverseMapping>();

            CreateMap<Users, MasterDto>()
                   .ForMember(destination => destination.Id, opt => opt.MapFrom(src => src.UserId))
                   .ForMember(destination => destination.Email, opt => opt.MapFrom(src => src.Email))
                   .ForMember(destination => destination.Name, opt => opt.MapFrom(src => src.Username));

            CreateMap<Users, EmployeeDto>()
                  .ForMember(destination => destination.EmployeeCode, opt => opt.MapFrom(src => src.EmployeeId))
                  .ForMember(destination => destination.Email, opt => opt.MapFrom(src => src.Email))
                  .ForMember(destination => destination.FullName, opt => opt.MapFrom(src => src.FullName));

            #endregion

            #region PMS

            #region Partner Profile

            CreateMap<AddPartnerDto, Partner>();

            CreateMap<Partner, GetPartnerDto>()
              .ForPath(destination => destination.IsEmpaneled, opt => opt.MapFrom(src => src.PartnerEmpanel!.IsEmpaneledPartner!))
              .ForPath(destination => destination.EngagementTypeName, opt => opt.MapFrom(src => string.Join(", ", src.Engagements!.Select(x => x.EngagementType!.Name))))
              .ForPath(destination => destination.CountryName, opt => opt.MapFrom(src => src.Country!.Name))
              .ForPath(destination => destination.StateName, opt => opt.MapFrom(src => src.State!.Name))
              .ForPath(destination => destination.ApproverName, opt => opt.MapFrom(src => src.Approver!.FullName))
              .ForPath(destination => destination.ApproverEmail, opt => opt.MapFrom(src => src.Approver!.Email))
              .ForPath(destination => destination.PartnerCategoryName, opt => opt.MapFrom(src => src.PartnerCategory!.Name))
              .ForPath(destination => destination.ServicingCountryName, opt => opt.MapFrom(src => src.ServicingCountry!.Name))
              .ForPath(destination => destination.PartnerTireName, opt => opt.MapFrom(src => src.PartnerTire!.Name))
              .ForPath(destination => destination.PartnerTenureInDays, opt => opt.MapFrom(src => src.CreatedAt.HasValue ? (DateTime.UtcNow.Date - src.CreatedAt.Value.Date).Days : 0))
              .ForPath(destination => destination.CityName, opt => opt.MapFrom(src => src.City!.Name))
              .ForPath(destination => destination.ReintiatedOn, opt => opt.MapFrom(src => src.LastActivatedDate))
              .ForPath(destination => destination.ReintiatedByUsername, opt => opt.MapFrom(src => src.LastReinitiatedByUser.FullName))
              .ForPath(destination => destination.ReintiatedComments, opt => opt.MapFrom(src => src.LastReinitiatedByUserComments))
              .ForMember(dest => dest.BusinessUnitName, opt => opt.MapFrom(src => src.Engagements != null && src.Engagements.Any() ? src.Engagements.First().BusinessUnit.Name : null))
              .ForMember(dest => dest.EngagementTypeName, opt => opt.MapFrom(src => src.Engagements != null && src.Engagements.Any() ? src.Engagements.Select(e => e.EngagementType.Name).Distinct().FirstOrDefault() : null));


            CreateMap<Partner, PartnerGridViewDto>()
              .ForPath(destination => destination.PartnerId, opt => opt.MapFrom(src => src.Id))
              .ForPath(destination => destination.StartDate, opt => opt.MapFrom(src => src.StartDate))
              .ForPath(destination => destination.Nickname, opt => opt.MapFrom(src => src.Nickname))
              .ForPath(destination => destination.PartnerStatusName, opt => opt.MapFrom(src => src.PartnerStatus!.Name))
              .ForPath(destination => destination.PartnerTireName, opt => opt.MapFrom(src => src.PartnerTire!.Name))
              .ForPath(destination => destination.ApprovedStatus, opt => opt.MapFrom(src => src.ApprovedStatus))
              .ForPath(destination => destination.EngagementTypeName, opt => opt.MapFrom(src => string.Join(", ", src.Engagements!.Select(x => x.EngagementType!.Name))))
              .ForPath(destination => destination.ApproverName, opt => opt.MapFrom(src => src.Approver!.FullName));

            #endregion

            #region Contact Matrix

            CreateMap<AddContactMatrixDto, ContactMatrix>();

            CreateMap<ContactMatrix, GetContactMatrixDto>()
                .ForPath(destination => destination.ContactMatrixTypeName, opt => opt.MapFrom(src => src.ContactMatrixType!.Name))
                .ForPath(destination => destination.StatusName, opt => opt.MapFrom(src => src.Status!.Name))
                .ForPath(destination => destination.CountryName, opt => opt.MapFrom(src => src.Country!.Name))
                .ForMember(dest => dest.ApprovalStatusId, opt => opt.MapFrom(src => src.ApprovalStatusId));

            #endregion

            #region Escalation Matrix

            CreateMap<AddEscalationMatrixDto, EscalationMatrix>();

            CreateMap<EscalationMatrix, GetEscalationMatrixDto>()
                .ForPath(destination => destination.EscalationMatrixTypeName, opt => opt.MapFrom(src => src.EscalationMatrixType!.Name))
                .ForPath(destination => destination.StatusName, opt => opt.MapFrom(src => src.Status!.Name))
                .ForPath(destination => destination.CountryName, opt => opt.MapFrom(src => src.Country!.Name))
                .ForMember(dest => dest.ApprovalStatusId, opt => opt.MapFrom(src => src.ApprovalStatusId));

            #endregion

            #region Matrix (Unified)

            CreateMap<ContactMatrix, MatrixDto>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => MATRIX_TYPE.CONTACT_MATRIX))
                .ForMember(dest => dest.ContactTypeName, opt => opt.MapFrom(src => src.ContactMatrixType != null ? src.ContactMatrixType.Name : null))
                .ForMember(dest => dest.Nickname, opt => opt.MapFrom(src => src.Partner != null ? src.Partner.Nickname : null))
                .ForMember(dest => dest.PartnerName, opt => opt.MapFrom(src => src.Partner != null ? src.Partner.PartnerName : null));

            CreateMap<EscalationMatrix, MatrixDto>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => MATRIX_TYPE.ESCALATION_MATRIX))
                .ForMember(dest => dest.EscalationMatrixTypeName, opt => opt.MapFrom(src => src.EscalationMatrixType != null ? src.EscalationMatrixType.Name : null))
                .ForMember(dest => dest.Nickname, opt => opt.MapFrom(src => src.Partner != null ? src.Partner.Nickname : null))
                .ForMember(dest => dest.PartnerName, opt => opt.MapFrom(src => src.Partner != null ? src.Partner.PartnerName : null));

            CreateMap<SOW, SOWMatrix>()
                 .ForMember(dest => dest.SOWNumber, opt => opt.MapFrom(src => src.SOWNumber))
                 .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => src.StartDate))
                 .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.EndDate))
                 .ForMember(dest => dest.TCValue, opt => opt.MapFrom(src => src.TCValue))
                 .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));



            #endregion


            #region Engagement

            CreateMap<Engagement, EngagementHistory>()
                .ForPath(destination => destination.Id, opt => opt.Ignore())
                .ForPath(destination => destination.EngagementId, opt => opt.MapFrom(src => src.Id));

            CreateMap<EngagementHistory, GetEngagementDto>()
                .ForPath(destination => destination.Id, opt => opt.MapFrom(src => src.EngagementId))
                .ForPath(destination => destination.TenuareInDays, opt => opt.MapFrom(src => src.EvaluationStartDate != DateTime.MinValue ? (DateTime.UtcNow - src.EvaluationStartDate).Days : (int?)null))
                .ForPath(destination => destination.EngagementStatusName, opt => opt.MapFrom(src => src.EngagementStatus!.Name))
                .ForPath(destination => destination.EngagementTypeName, opt => opt.MapFrom(src => src.EngagementType!.Name))
                .ForPath(destination => destination.EvaluationStatusName, opt => opt.MapFrom(src => src.EvaluationStatus!.Name))
                .ForPath(destination => destination.PartnerName, opt => opt.MapFrom(src => src.Partner!.PartnerName))
                .ForPath(destination => destination.PartnerCode, opt => opt.MapFrom(src => src.Partner!.PartnerCode))
                .ForPath(destination => destination.CreatedUserName, opt => opt.MapFrom(src => src.CreatedUser!.FullName))
                .ForPath(destination => destination.BusinessUnitName, opt => opt.MapFrom(src => src.BusinessUnit!.Name));

            CreateMap<AddEngagementDto, Engagement>();

            CreateMap<Engagement, GetEngagementDto>()
                .ForPath(destination => destination.TenuareInDays, opt => opt.MapFrom(src => src.EvaluationStartDate != DateTime.MinValue ? (DateTime.UtcNow - src.EvaluationStartDate).Days : (int?)null))
                .ForPath(destination => destination.EngagementStatusName, opt => opt.MapFrom(src => src.EngagementStatus!.Name))
                .ForPath(destination => destination.EngagementTypeName, opt => opt.MapFrom(src => src.EngagementType!.Name))
                .ForPath(destination => destination.EvaluationStatusName, opt => opt.MapFrom(src => src.EvaluationStatus!.Name))
                .ForPath(destination => destination.Nickname, opt => opt.MapFrom(src => src.Partner!.Nickname))
                .ForPath(destination => destination.PartnerCode, opt => opt.MapFrom(src => src.Partner!.PartnerCode))
                .ForPath(destination => destination.IsEmpaneled, opt => opt.MapFrom(src => src.EvaluationStatusId == (int)EVALUATION_STATUS.EMPANELLED))
                .ForPath(destination => destination.BusinessUnitName, opt => opt.MapFrom(src => src.BusinessUnit!.Name));

            #endregion

            #region Partner Empanelment

            CreateMap<AddPartnerEmpanelDto, PartnerEmpanel>();

            CreateMap<PartnerEmpanel, GetPartnerEmpanelDto>()
            .ForPath(destination => destination.AgreementTypeName, opt => opt.MapFrom(src => src.AgreementType!.Name))
            .ForPath(destination => destination.RejectionReasonTypeName, opt => opt.MapFrom(src => src.RejectionReasonType!.Name));

            #endregion

            #region SOW

            CreateMap<AddSOWDto, SOW>();

            CreateMap<SOW, GetSOWDto>()
               .ForMember(destination => destination.PartnerCode, opt => opt.MapFrom(src => src.Partner!.PartnerCode))
               .ForMember(destination => destination.PartnerName, opt => opt.MapFrom(src => src.Partner!.PartnerName))
               .ForMember(dest => dest.ApprovalStatusId, opt => opt.MapFrom(src => src.ApprovalStatusId));

            CreateMap<AddPODetailDto, PODetail>();

            CreateMap<PODetail, GetPODetailDto>()
                .ForMember(destination => destination.SowNumber, opt => opt.MapFrom(src => src.Sow!.SOWNumber));

            CreateMap<AddSOW_CRDto, SOW_CR>();
            CreateMap<SOW_CR, GetSOW_CRDto>();

            CreateMap<AddPO_CRDto, PO_CR>();
            CreateMap<PO_CR, GetPO_CRDto>();


            CreateMap<SOWHistory, SOW>();

            CreateMap<SOW, SOWHistory>()
                .ForMember(destination => destination.Id, opt => opt.MapFrom(src => 0))
                .ForMember(destination => destination.SOWID, opt => opt.MapFrom(src => src.Id));


            CreateMap<PODetailHistory, PODetail>();

            CreateMap<PODetail, PODetailHistory>()
               .ForMember(destination => destination.Id, opt => opt.MapFrom(src => 0))
               .ForMember(destination => destination.PODetailId, opt => opt.MapFrom(src => src.Id));

            #endregion

            #region  Partern Hiring Requests

            CreateMap<HiringReqPartnerDto, HiringReqPartner>().ReverseMap();

            #endregion

            #endregion

            #region HMS

            #region RCMSDetails

            CreateMap<GetHiringRequestDto, RCMSDetails>().ReverseMap();

            CreateMap<RCMSDetails, GetHiringRequestDto>()
                   .ForMember(destination => destination.Id, opt => opt.MapFrom(src => 0))
                   .ForMember(destination => destination.RcMsProjectId, opt => opt.MapFrom(src => src.ProjectId))
                   .ForMember(destination => destination.HiringMangerId, opt => opt.MapFrom(src => src.HiringManagerId))
                   .ForMember(destination => destination.HiringManagerName, opt => opt.MapFrom(src => src.HiringManager.FullName))
                   .ForMember(destination => destination.RcMsResourceRequestId, opt => opt.MapFrom(src => src.RcMsResourceRequestId));

            #endregion


            #region Hiring Request View

            CreateMap<HiringRequest, ViewHiringDetailsDto>()
               //.ForPath(destination => destination.ResourceTypeName, opt => opt.MapFrom(src => src.JobDetails!.ResourceType!.Name))
               .ForPath(destination => destination.DomainName, opt => opt.MapFrom(src => src.Domain!.Name))
               .ForPath(destination => destination.DomainManagerName, opt => opt.MapFrom(src => src.Domain!.DomainManager!.FullName))
               .ForPath(destination => destination.BusinessName, opt => opt.MapFrom(src => src.Business!.Name))
               .ForPath(destination => destination.HiringTypeName, opt => opt.MapFrom(src => src.HiringType!.Name))
               .ForPath(destination => destination.HiringManagerName, opt => opt.MapFrom(src => src.HiringManager!.FullName))
               .ForPath(destination => destination.RMOwnerName, opt => opt.MapFrom(src => src.RMOwner!.FullName))
               .ForPath(destination => destination.BETApproverName, opt => opt.MapFrom(src => src.BETApprover!.FullName))
               .ForMember(dest => dest.RequestAssignedDate, opt => opt.MapFrom((src, dest, destMember, context) =>
               {
                   if (context.Items.TryGetValue("PartnerId", out var partnerObj) && partnerObj is int partnerId)
                   {
                       return src.PartnerCategory.SelectedPartners
                           .Where(x => x.PartnerId == partnerId)
                           .Select(x => x.AssignedOn)
                           .FirstOrDefault();
                   }
                   return null; // safe default if PartnerId not provided
               }))
               .ForPath(destination => destination.RequestApprovedBy, opt => opt.MapFrom(src => src.HiringStatusId != (int)HIRING_STATUS.CANCELLED ? src.RequestApprover!.FullName : null))
               .ForPath(destination => destination.RequestApprovedOn, opt => opt.MapFrom(src => src.HiringStatusId != (int)HIRING_STATUS.CANCELLED ? src.ApproverUpdatedDate : null))
               .ForPath(destination => destination.RequestApprovedByComments, opt => opt.MapFrom(src => src.HiringStatusId != (int)HIRING_STATUS.CANCELLED ? src.ApproverComments : null))

               .ForPath(destination => destination.RequestRejectedBy, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.CANCELLED ? src.RequestApprover!.FullName : null))
               .ForPath(destination => destination.RequestRejectedOn, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.CANCELLED ? src.ApproverUpdatedDate : null))
               .ForPath(destination => destination.RequestRejectedByComments, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.CANCELLED ? src.ApproverComments : null))
               ;
            //.ForPath(destination => destination.RequestorName, opt => opt.MapFrom(src => $"{src.Requestor!.FirstName} {src.Requestor!.LastName}"))
            //.ForPath(destination => destination.OnholdDate, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.ON_HOLD ? src.OnholdDate : null))
            //.ForPath(destination => destination.OnholdByUserName, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.ON_HOLD ? src.OnholdByUser!.RoleName : null))
            //.ForPath(destination => destination.OnholdReasonId, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.ON_HOLD ? src.OnholdReasonId : null))
            //.ForPath(destination => destination.OnholdReasonName, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.ON_HOLD ? src.OnholdReason!.Name : null))
            //.ForPath(destination => destination.OnholdComments, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.ON_HOLD ? src.OnholdComments : null))
            //.ForPath(destination => destination.ApprovalStatusName, opt => opt.MapFrom(src => src.ApprovalStatus!.Name));

            CreateMap<JobDetails, ViewJobDetailsDto>()
               .ForPath(destination => destination.HiringActivityName, opt => opt.MapFrom(src => src!.HiringActivity!.Name))
               .ForPath(destination => destination.JobPriorityName, opt => opt.MapFrom(src => src!.JobPriority!.Name))
               .ForPath(destination => destination.JobLevelName, opt => opt.MapFrom(src => src!.JobLevel!.Name))
               .ForPath(destination => destination.Country, opt => opt.MapFrom(src => src!.Country!.Name))
               .ForPath(destination => destination.SubDomainManagerName, opt => opt.MapFrom(src => src!.SubDomain!.SubDomainManager!.FullName));


            CreateMap<ViewInterviewRoundsDto, ViewInterviewRoundsDto>();
            CreateMap<ViewInterviewRoundsDto, ViewInterviewRoundsDto>();

            CreateMap<Calibration, ViewCalibrationDetailsDto>()
               //.ForPath(destination => destination.PrimarySkills, opt => opt.MapFrom(src => src!.PrimarySkillsChanges))
               .ForPath(destination => destination.Documents, opt => opt.MapFrom(src => string.IsNullOrEmpty(src!.Documents!.AttachmentName) ? null : src!.Documents));

            #endregion

            #region Hiring Request

            CreateMap<JoiningRescheduleHistory, GetJoiningRescheduleHistoryDto>()
                .ForPath(destination => destination.ModifiedbyUsername, opt => opt.MapFrom(src => src.ModifiedbyUser!.FullName));

            CreateMap<GetJoiningRescheduleHistoryDto, JoiningRescheduleHistory>();
            CreateMap<AddHiringRequestDto, HiringRequest>();
            CreateMap<HiringRequest, GetHiringRequestDto>()
                .ForPath(destination => destination.HiringManagerName, opt => opt.MapFrom(src => src.HiringManager!.FullName))
                .ForPath(destination => destination.ResourceTypeId, opt => opt.MapFrom(src => src.JobDetails!.ResourceTypeId))
                .ForPath(destination => destination.DomainName, opt => opt.MapFrom(src => src.Domain!.Name))
                .ForPath(destination => destination.DomainManagerName, opt => opt.MapFrom(src => src.Domain!.DomainManager!.FullName))
                .ForPath(destination => destination.RecordTypeName, opt => opt.MapFrom(src => src.RecordType!.Name))
                .ForPath(destination => destination.BusinessName, opt => opt.MapFrom(src => src.Business!.Name))
                .ForPath(destination => destination.HiringTypeName, opt => opt.MapFrom(src => src.HiringType!.Name))
                .ForPath(destination => destination.HiringStatusName, opt => opt.MapFrom(src => src.HiringStatus!.Name))
                .ForPath(destination => destination.RMOwnerName, opt => opt.MapFrom(src => src.RMOwner!.FullName))
                .ForPath(destination => destination.RMOwnerComments, opt => opt.MapFrom(src => src.RMOwnerComments))
                .ForPath(destination => destination.RequestApproverFieldName, opt => opt.MapFrom(src => src.HiringStatusId == (int)HIRING_STATUS.CANCELLED ? "Rejected" : "Approved"))
                .ForPath(destination => destination.RequestApproverName, opt => opt.MapFrom(src => src.RequestApprover!.FullName))
                .ForPath(destination => destination.RequestorName, opt => opt.MapFrom(src => src.Requestor!.FullName))

                ///Onhold Details
                .ForPath(destination => destination.OnholdRequestedDate, opt => opt.MapFrom(src => src.OnholdRequestedDate))
                .ForPath(destination => destination.OnholdRequestedBy, opt => opt.MapFrom(src => src.OnholdRequestedBy))
                .ForPath(destination => destination.OnholdRequestedByRoleName, opt => opt.MapFrom(src => src.OnholdRequestedByRole!.RoleName))
                .ForPath(destination => destination.OnholdRaisedBy, opt => opt.MapFrom(src => src.OnholdRaisedBy))
                .ForPath(destination => destination.OnholdRaisedByUserName, opt => opt.MapFrom(src => src.OnholdRaisedByUser!.FullName))
                .ForPath(destination => destination.OnholdReasonId, opt => opt.MapFrom(src => src.OnholdReasonId))
                .ForPath(destination => destination.OnholdReasonName, opt => opt.MapFrom(src => src.OnholdReason!.Name))
                .ForPath(destination => destination.OnholdComments, opt => opt.MapFrom(src => src.OnholdComments))
                .ForPath(destination => destination.FreezeCandidateTypes, opt => opt.MapFrom(src => src.FreezeCandidateTypes))
                .ForPath(destination => destination.OnholdDate, opt => opt.MapFrom(src => src.OnholdDate))
                .ForPath(destination => destination.OnholdReviewedByUserId, opt => opt.MapFrom(src => src.OnholdReviewedByUserId))
                .ForPath(destination => destination.OnholdReviewedByUserName, opt => opt.MapFrom(src => src.OnholdReviewedByUser!.FullName))
                .ForPath(destination => destination.OnHoldReviewStatusId, opt => opt.MapFrom(src => src.OnHoldReviewStatusId))
                .ForPath(destination => destination.OnHoldReviewStatusName, opt => opt.MapFrom(src => src.OnHoldReviewStatus!.Name))


                .ForPath(destination => destination.BETApproverName, opt => opt.MapFrom(src => src.BETApprover!.FullName))
                .ForPath(destination => destination.ApprovalStatusName, opt => opt.MapFrom(src => src.ApprovalStatus!.Name));

            CreateMap<HiringRequest, PartnerHrqsGridDto>()
                .ForPath(destination => destination.HiringRequestId, opt => opt.MapFrom(src => src!.Id))
                .ForPath(destination => destination.HrqId, opt => opt.MapFrom(src => src!.HrqId))
                .ForPath(destination => destination.BusinessId, opt => opt.MapFrom(src => src!.BusinessId))
                .ForPath(destination => destination.BusinessName, opt => opt.MapFrom(src => src!.Business!.Name))
                .ForPath(destination => destination.RMOwnerId, opt => opt.MapFrom(src => src!.RmOwnerId))
                .ForPath(destination => destination.RequestApproverName, opt => opt.MapFrom(src => src.RequestApprover!.FullName))
                .ForPath(destination => destination.RMOwnerName, opt => opt.MapFrom(src => src!.RMOwner!.FullName));

            #endregion

            #region Job Details

            CreateMap<AddJobDetailsDto, JobDetails>();
            CreateMap<JobDetails, GetJobDetailsDto>()
                .ForPath(destination => destination.SubDomainManagerId, opt => opt.MapFrom(src => src!.SubDomain!.SubDomainManagerId))
                .ForPath(destination => destination.SubDomainManagerName, opt => opt.MapFrom(src => src!.SubDomain!.SubDomainManager!.FullName));

            #endregion

            #region Partner Category

            CreateMap<AddPartnerCategoryDto, PartnerCategory>();
            CreateMap<PartnerCategory, GetPartnerCategoryDto>();

            #endregion

            #region Interview Round

            CreateMap<AddInterviewRoundDto, InterviewRound>();
            CreateMap<InterviewRound, GetInterviewRoundDto>()
                .ForPath(destination => destination.ModeOfInterviewName, opt => opt.MapFrom(src => src.InterviewMode!.Name))
                .ForPath(destination => destination.PanelNames, opt => opt.MapFrom(src => src.InterviewMode!.Name))
                .ForPath(destination => destination.RoundNameName, opt => opt.MapFrom(src => src.RoundName!.Name));


            #region Feedback Category

            CreateMap<FeedbackCategoryDto, FeedbackCategory>();
            CreateMap<FeedbackCategory, FeedbackCategoryDto>();

            #region Feedback Criteria Options
            CreateMap<FeedbackCritriaOptionsDto, FeedbackCritriaOptions>();

            CreateMap<FeedbackCritriaOptions, FeedbackCritriaOptionsDto>()
                .ForPath(destination => destination.Name, opt => opt.MapFrom(src => src.CriteriaOption!.Name));

            #endregion

            #endregion

            #endregion

            #region Calibration

            CreateMap<AddCalibrationDto, Calibration>()
                .ForPath(destination => destination.PrimarySkillsChanges, opt => opt.MapFrom(src => src!.PrimarySkills))
                .ForPath(destination => destination.SecondarySkillsChnages, opt => opt.MapFrom(src => src!.SecondarySkills));

            CreateMap<Calibration, GetCalibrationDto>()
                .ForPath(destination => destination.PrimarySkills, opt => opt.MapFrom(src => src!.PrimarySkillsChanges))
                .ForPath(destination => destination.SecondarySkills, opt => opt.MapFrom(src => src!.SecondarySkillsChnages));

            #endregion

            #endregion

            #region CMS

            #region Candidate Profile

            CreateMap<Candidate, CandidateProfileDto>();

            #endregion

            #region Candidate Bin

            CreateMap<AddCandidateBinDto, CandidateBin>()
                    .ForPath(destination => destination.PrimarySkillIds, opt => opt.MapFrom(src => src.PrimarySkillIdList))
                    .ForPath(destination => destination.SecondarySkillIds, opt => opt.MapFrom(src => src.SecondarySkillIdList))
                    .ForPath(destination => destination.PreferredWorkLocationIds, opt => opt.MapFrom(src => src.PreferredWorkLocationIdList))
                    .ForPath(destination => destination.Id, opt => opt.MapFrom(src => src.CandidateBinId))
                    .ForPath(destination => destination.CurrentOrganisation, opt => opt.MapFrom(src => src.CurrentOrganisation));

            CreateMap<AddCandidateBinDto, Candidate>()
                    .ForPath(destination => destination.PrimarySkillIds, opt => opt.MapFrom(src => src.PrimarySkillIdList))
                    .ForPath(destination => destination.SecondarySkillIds, opt => opt.MapFrom(src => src.SecondarySkillIdList))
                    .ForPath(destination => destination.PreferredWorkLocationIds, opt => opt.MapFrom(src => src.PreferredWorkLocationIdList))
                    .ForPath(destination => destination.CurrentOrganisation, opt => opt.MapFrom(src => src.CurrentOrganisation));

            CreateMap<Candidate, GetCandidateBinDto>()
                .ForPath(destination => destination.CandidateCode, opt => opt.MapFrom(src => src.CandidateCode))
                .ForPath(destination => destination.CandidateId, opt => opt.MapFrom(src => src.Id))
                .ForPath(destination => destination.Id, opt => opt.Ignore());

            CreateMap<CandidateBin, GetCandidateBinDto>()
                .ForPath(destination => destination.PartnerComments, opt => opt.MapFrom(src => src.PartnerComments))
                .ForPath(destination => destination.HrqId, opt => opt.MapFrom(src => src.HiringRequest!.HrqId))
                .ForPath(destination => destination.JobTitle, opt => opt.MapFrom(src => src.HiringRequest!.JobTitle))
                .ForPath(destination => destination.PartnerName, opt => opt.MapFrom(src => src.Partner!.PartnerName))
                .ForPath(destination => destination.NickName, opt => opt.MapFrom(src => src.Partner!.Nickname))
                .ForPath(destination => destination.ExistingCandidateCode, opt => opt.MapFrom(src => src.ExistingCandidateCode))
                .ForPath(destination => destination.CandidateBinId, opt => opt.MapFrom(src => src.Id));

            CreateMap<AddCandidateBinDto, GetCandidateBinDto>().ReverseMap();

            CreateMap<GetCandidateBinDto, Candidate>();

            CreateMap<Candidate, GetCandidateBinDto>();

            CreateMap<CandidateBin, Candidate>()
                 .ForPath(destination => destination.PrimarySkillIds, opt => opt.MapFrom(src => src.PrimarySkillIds))
                 .ForPath(destination => destination.SecondarySkillIds, opt => opt.MapFrom(src => src.SecondarySkillIds));

            #endregion

            #region Candidate

            CreateMap<Candidate, CandidateHistory>().ReverseMap();

            CreateMap<AddCandidateDto, GetCandidateDto>().ReverseMap();

            CreateMap<MarkDuplicateCandidate, MarkDuplicateCandidateDto>().ReverseMap();

            CreateMap<AddCandidateDto, Candidate>()
                 .ForMember(dest => dest.InterviewSlots, opt => opt.Ignore())
                 .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                 .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

            CreateMap<Candidate, GetCandidateDto>()
               .ForPath(destination => destination.InterviewTatStartDate, opt => opt.MapFrom(src => src.ReUploadedCandidateOn ?? src.CreatedAt))
               .ForPath(destination => destination.InterviewTatEndDate, opt => opt.MapFrom(src =>
                            src.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING ? DateTime.UtcNow :
                            src.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING ? src.ScreeningCompletedOn :
                            src.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED ? src.CandidateIdentifiedOn :
                            src.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ROLLED_OUT ? src.OfferRolledOutOn :
                            src.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED ? src.OfferAcceptedOn :
                            src.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED ? src.OfferDeclinedOn :
                            src.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.REJECTED ? src.CandidateRejectedOn
                           : DateTime.UtcNow))
               .ForPath(destination => destination.ResourceTypeName, opt => opt.MapFrom(src => src.HiringRequest.JobDetails.ResourceType.Name))
               .ForPath(destination => destination.HrqId, opt => opt.MapFrom(src => src.HiringRequest!.HrqId))
               .ForPath(destination => destination.IsParentHrq, opt => opt.MapFrom(src => src.HiringRequest!.IsParentHRQ))
               .ForPath(destination => destination.JobTitle, opt => opt.MapFrom(src => src!.HiringRequest!.JobTitle))
               .ForPath(destination => destination.HiringStatusId, opt => opt.MapFrom(src => src!.HiringRequest!.HiringStatusId))
               .ForPath(destination => destination.HiringStatusName, opt => opt.MapFrom(src => src!.HiringRequest!.HiringStatus!.Name))
               .ForPath(destination => destination.IntakeStatusName, opt => opt.MapFrom(src => src!.IntakeStatus!.Name))
               .ForPath(destination => destination.CandidateStatusName, opt => opt.MapFrom(src => src!.CandidateStatus!.Name))
               .ForPath(destination => destination.EnableCandidateHrqTransfer, opt => opt.MapFrom(src => src!.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED && (src.IsTransferred == null || src.IsTransferred == false)))
               .ForPath(destination => destination.PartnerName, opt => opt.MapFrom(src => src!.Partner!.PartnerName))
               .ForPath(destination => destination.NickName, opt => opt.MapFrom(src => src!.Partner!.Nickname))
               .ForPath(destination => destination.FreezedStatus, opt => opt.MapFrom(src => src!.IsFreezed == true ? "Freezed" : null));

            CreateMap<Candidate, CandidateDetailsDto>()
                .ForMember(destination => destination.HiringManager, opt => opt.MapFrom(src => src.HiringRequest!.HiringManager))
                .ForMember(destination => destination.HiringManagerId, opt => opt.MapFrom(src => src.HiringRequest!.HiringMangerId))
                .ForMember(destination => destination.DateOfJoining, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(destination => destination.Role, opt => opt.MapFrom(src => src.HiringRequest!.JobTitle))
                .ForMember(destination => destination.CategoryId, opt => opt.MapFrom(src => src.HiringRequest!.RecordTypeId))
                .ForMember(destination => destination.CategoryName, opt => opt.MapFrom(src => src.HiringRequest!.RecordType!.Name))
                .ForMember(destination => destination.EmployeeStatusId, opt => opt.MapFrom(src => src.CandidateStatus!.Id))
                .ForMember(destination => destination.EmployeeStatus, opt => opt.MapFrom(src => src.CandidateStatus))
                .ForMember(destination => destination.EmployeeName, opt => opt.MapFrom(src => src.FullName))
                .ForMember(destination => destination.PartnerName, opt => opt.MapFrom(src => src.Partner!.PartnerName))
                .ForMember(destination => destination.BusinessUnit, opt => opt.MapFrom(src => src.HiringRequest!.Business!))
                .ForMember(destination => destination.CountryName, opt => opt.MapFrom(src => src.Country!.Name))
                .ForMember(destination => destination.StateName, opt => opt.MapFrom(src => src.State!.Name))
                .ForMember(destination => destination.Domains, opt => opt.MapFrom(src => src.Partner!.DomainIds!))
                .ForMember(destination => destination.SubDomains, opt => opt.MapFrom(src => src.Partner!.SubDomainIds!))
                .ForMember(destination => destination.CityName, opt => opt.MapFrom(src => src.City!.Name));

            CreateMap<AddCandidateBinDto, CandidateBinBulkUploadDto>();

            CreateMap<CandidateBulkUpload, GetCandidateBinDto>();


            #endregion

            #region Interview Slot

            CreateMap<AddInterviewSlotDto, InterviewSlot>()
                .ForPath(destination => destination.HMAdditionalComments, opt => opt.MapFrom(src => src!.Comments));

            CreateMap<InterviewSlot, GetInterviewSlotDto>()
                .ForPath(destination => destination.Panel, opt => opt.MapFrom(src => src!.Panel))
                .ForPath(destination => destination.InterviewSlotId, opt => opt.MapFrom(src => src!.Id))
                .ForPath(destination => destination.CandidateInterviewStatusName, opt => opt.MapFrom(src => src!.CandidateInterviewStatus!.Name))
                .ForPath(destination => destination.Nickname, opt => opt.MapFrom(src => src!.Candidate!.Partner!.Nickname));

            CreateMap<Candidate, GetInterviewSlotDto>()
                .ForPath(destination => destination.Id, opt => opt.MapFrom(src => 0))
                .ForPath(destination => destination.CandidateId, opt => opt.MapFrom(src => src!.Id))
                .ForPath(destination => destination.CandidateCode, opt => opt.MapFrom(src => src!.CandidateCode))
                .ForPath(destination => destination.CandidateName, opt => opt.MapFrom(src => src!.FullName))
                .ForPath(destination => destination.JobTitle, opt => opt.MapFrom(src => src!.HiringRequest!.JobTitle))
                .ForPath(destination => destination.PartnerId, opt => opt.MapFrom(src => src!.PartnerId))
                .ForPath(destination => destination.Nickname, opt => opt.MapFrom(src => src!.Partner!.Nickname))
                .ForPath(destination => destination.IntakeStatusId, opt => opt.MapFrom(src => src!.IntakeStatusId))
                .ForPath(destination => destination.IntakeStatusName, opt => opt.MapFrom(src => src!.IntakeStatus!.Name))
                .ForPath(destination => destination.IntakeStatusName, opt => opt.MapFrom(src => src!.IntakeStatus!.Name))
                .ForPath(destination => destination.HrqId, opt => opt.MapFrom(src => src.HiringRequest!.HrqId));

            CreateMap<InterviewSlotAllocationHistory, InterviewSlot>().ReverseMap();

            CreateMap<UpdatePanelFeedbackFormDto, CandidateInterviewFeedBack>().ReverseMap();

            #endregion

            #region Candidate Rate Card

            CreateMap<AddCandidateRateCardDto, CandidateRateCard>();
            CreateMap<CandidateRateCard, GetCandidateRateCardDto>();

            #endregion

            #region Candidate Personal Details

            CreateMap<AddCandidatePersonalDetailsDto, CandidatePersonalDetails>();

            CreateMap<Candidate, GetCandidatePersonalDetailsDto>()
                .ForMember(destination => destination.Id, opt => opt.Ignore())
                .ForMember(destination => destination.CandidateId, opt => opt.MapFrom(src => src.Id))
                .ForMember(destination => destination.CandidateCode, opt => opt.MapFrom(src => src.CandidateCode))
                .ForMember(destination => destination.CandidateName, opt => opt.MapFrom(src => src.FullName))
                //.ForMember(destination => destination.DateOfJoining, opt => opt.MapFrom(src => src.CandidateRateCard!.DOJ))
                .ForMember(destination => destination.PersonalMailId, opt => opt.MapFrom(src => src.Email))
                .ForMember(destination => destination.Phone, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(destination => destination.HiringRequestId, opt => opt.MapFrom(src => src.HiringRequest!.Id))
                .ForMember(destination => destination.HrqId, opt => opt.MapFrom(src => src.HiringRequest!.HrqId))
                .ForMember(destination => destination.HiringManagerName, opt => opt.MapFrom(src => src.HiringRequest!.HiringManager.FullName))
                .ForMember(destination => destination.SourceId, opt => opt.MapFrom(src => src.Partner!.Id))
                .ForMember(destination => destination.SourceName, opt => opt.MapFrom(src => src.Partner!.PartnerName))
                .ForMember(destination => destination.RoleHiredFor, opt => opt.MapFrom(src => src.HiringRequest!.JobTitle))
                .ForMember(destination => destination.CountryId, opt => opt.MapFrom(src => src.CountryId))
                .ForMember(destination => destination.CountryName, opt => opt.MapFrom(src => src.Country!.Name))
                .ForMember(destination => destination.StateId, opt => opt.MapFrom(src => src.StateId))
                .ForMember(destination => destination.StateName, opt => opt.MapFrom(src => src.State!.Name))
                .ForMember(destination => destination.CityId, opt => opt.MapFrom(src => src.CityId))
                .ForMember(destination => destination.CityName, opt => opt.MapFrom(src => src.City!.Name))
                .ForMember(destination => destination.DomainId, opt => opt.MapFrom(src => src.HiringRequest!.DomainId))
                .ForMember(destination => destination.DomainName, opt => opt.MapFrom(src => src.HiringRequest!.Domain!.Name))
                .ForMember(destination => destination.SubDomainId, opt => opt.MapFrom(src => src.HiringRequest!.JobDetails!.SubDomainId))
                .ForMember(destination => destination.SubDomainName, opt => opt.MapFrom(src => src.HiringRequest!.JobDetails!.SubDomain!.Name))
                .ForMember(destination => destination.PGUId, opt => opt.MapFrom(src => src.HiringRequest!.BusinessId))
                .ForMember(destination => destination.PGUName, opt => opt.MapFrom(src => src.HiringRequest!.Business!.Name));


            CreateMap<CandidatePersonalDetails, GetCandidatePersonalDetailsDto>()
                .ForMember(destination => destination.CandidateId, opt => opt.MapFrom(src => src.Candidate.Id))
                .ForMember(destination => destination.CandidateCode, opt => opt.MapFrom(src => src.Candidate.CandidateCode))
                .ForMember(destination => destination.CandidateName, opt => opt.MapFrom(src => src.Candidate.FullName))
                .ForMember(destination => destination.HiringRequestId, opt => opt.MapFrom(src => src.Candidate.HiringRequestId))
                .ForMember(destination => destination.SourceId, opt => opt.MapFrom(src => src.Candidate.Partner!.Id))
                .ForMember(destination => destination.SourceName, opt => opt.MapFrom(src => src.Candidate.Partner!.PartnerName))
                .ForMember(destination => destination.Phone, opt => opt.MapFrom(src => src.Phone))
                .ForMember(destination => destination.RoleHiredFor, opt => opt.MapFrom(src => src.RoleHiredFor))
                 .ForMember(destination => destination.CandidateCode, opt => opt.MapFrom(src => src.Candidate!.CandidateCode))
                .ForMember(destination => destination.PersonalMailId, opt => opt.MapFrom(src => src.PersonalMailId))
                //.ForMember(destination => destination.DateOfJoining, opt => opt.MapFrom(src => src.Candidate!.CandidateRateCard!.DOJ))
                .ForMember(destination => destination.HiringRequestId, opt => opt.MapFrom(src => src.Candidate!.HiringRequest!.Id))
                .ForMember(destination => destination.HrqId, opt => opt.MapFrom(src => src.Candidate!.HiringRequest!.HrqId))
                .ForMember(destination => destination.HiringManagerName, opt => opt.MapFrom(src => src.Candidate!.HiringRequest!.HiringManager.FullName))
                .ForMember(destination => destination.OnboardingManagerName, opt => opt.MapFrom(src => src.OnboardingManager.FullName))
                .ForMember(destination => destination.SourceName, opt => opt.MapFrom(src => src.Candidate!.Partner!.PartnerName))
                .ForMember(destination => destination.RoleHiredFor, opt => opt.MapFrom(src => src.Candidate!.HiringRequest!.JobTitle))
                .ForMember(destination => destination.CountryName, opt => opt.MapFrom(src => src.Country!.Name))
                .ForMember(destination => destination.StateName, opt => opt.MapFrom(src => src!.State!.Name))
                .ForMember(destination => destination.CityName, opt => opt.MapFrom(src => src.City!.Name))
                .ForMember(destination => destination.DomainName, opt => opt.MapFrom(src => src!.Domain!.Name))
                .ForMember(destination => destination.ResourceTypeId, opt => opt.MapFrom(src => src!.Candidate.HiringRequest.JobDetails!.ResourceTypeId))
                .ForMember(destination => destination.ResourceTypeName, opt => opt.MapFrom(src => src!.Candidate.HiringRequest.JobDetails!.ResourceType.Name))
                .ForMember(destination => destination.SubDomainName, opt => opt.MapFrom(src => src.SubDomain!.Name))
                .ForMember(destination => destination.PGUId, opt => opt.MapFrom(src => src.Candidate.HiringRequest!.BusinessId))
                .ForMember(destination => destination.PGUName, opt => opt.MapFrom(src => src.Candidate.HiringRequest!.Business!.Name));

            #endregion

            #region Asset Details

            CreateMap<AddAssetDetailsDto, AssetDetails>();

            CreateMap<AssetDetails, GetAssetDetailsDto>()
                 .ForMember(destination => destination.ModeOfPcShipmentName, opt => opt.MapFrom(src => src.ModeOfPcShipment!.Name))
                 .ForMember(destination => destination.ComplianceFollowedName, opt => opt.MapFrom(src => src.ComplianceFollowed!.Name))
                 .ForMember(destination => destination.DelayCategoryName, opt => opt.MapFrom(src => src.DelayCategory!.Name))
                 .ForMember(destination => destination.ITAssetStatusName, opt => opt.MapFrom(src => src.ITAssetStatus!.Name));

            #endregion

            #region Training Details

            CreateMap<AddTrainingDetailsDto, TrainingDetails>();

            CreateMap<TrainingDetails, GetTrainingDetailsDto>()
                 .ForMember(destination => destination.SessionTakenByManagerName, opt => opt.MapFrom(src => src.SessionTakenByManager!.FullName))
                 .ForMember(destination => destination.OrientationStatusName, opt => opt.MapFrom(src => src.OrientationStatus!.Name));

            #endregion

            #region Profile Tracker

            CreateMap<AddProfileTrackerDto, ProfileTracker>();

            CreateMap<ProfileTracker, GetProfileTrackerDto>();
            //.ForMember(destination => destination.CostCenterName, opt => opt.MapFrom(src => src.CostCenter!.Name));

            #endregion

            #region Candidate BGV Details

            CreateMap<AddCandidateBgvDetailsDto, CandidateBgvDetails>();

            CreateMap<CandidateBgvDetails, GetCandidateBgvDetailsDto>()
                .ForMember(destination => destination.VendorName, opt => opt.MapFrom(src => src.Vendor.PartnerName));

            #endregion

            #endregion

            #region Grids

            CreateMap<PartnerHrqsGrid, PartnerHrqsGridDto>();


            #endregion

            #region Users

            CreateMap<Users, UserDto>()
               .ForMember(destination => destination.RoleNames, opt => opt.MapFrom(src => string.Join(',', src.UserRoles!.Select(x => x.Role!.RoleName)!)));
            CreateMap<UserDto, Users>();

            CreateMap<UserRole, UserRoleDto>()
                .ForMember(destination => destination.Email, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(destination => destination.PartnerName, opt => opt.MapFrom(src => src.Partner!.PartnerName))
                .ForMember(destination => destination.RoleName, opt => opt.MapFrom(src => src.Role!.RoleName))
                .ForMember(destination => destination.FullName, opt => opt.MapFrom(src => src.User!.FullName));
            CreateMap<UserRoleDto, UserRole>();

            #endregion

            #region Roles

            CreateMap<Role, RoleDto>();
            CreateMap<RoleDto, Role>();

            #endregion

            #region Dropdown Related Mappings

            CreateMap<DropdownDto, Role>();

            CreateMap<Role, DropdownDto>()
                .ForMember(destination => destination.Id, opt => opt.MapFrom(src => src.RoleId))
                .ForMember(destination => destination.Name, opt => opt.MapFrom(src => src.RoleName));

            CreateMap<Role, MasterDto>()
               .ForMember(destination => destination.Id, opt => opt.MapFrom(src => src.RoleId))
               .ForMember(destination => destination.Name, opt => opt.MapFrom(src => src.RoleName));

            CreateMap<DropdownDto, FeedbackCritriaOptions>();



            #endregion

            #region Utilities


            CreateMap<EmailTemplateDetailsDto, EmailTemplate>().ReverseMap();
            CreateMap<NotificationDto, Notifications>().ReverseMap();

            #endregion

        }
    }
}
