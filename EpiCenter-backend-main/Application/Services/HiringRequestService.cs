using AutoMapper;
using ClosedXML.Excel;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.HMS.HiringRequest;
using EpicenterX.Application.DTOs.HMS.JobDetails;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Linq;
using static EpicenterX.Utility.Utility;
using Users = EpicenterX.Domain.Entities.Users;

namespace EpicenterX.Application.Services
{
    public class HiringRequestService(AppDBContext _context, ICommuncationService _communicationService,
                                      IGenericRepository<HiringRequest> _hiringRequestRepository,
                                      IGenericRepository<OnholdHiringRequest> _onHoldHiringRequestRepository,
                                      IGenericRepository<M_City> _cityRepository,
                                      IGenericRepository<JobDetails> _jobDetailsRepository,
                                      IGenericRepository<PartnerCategory> _partnerCategoryRepository,
                                      IGenericRepository<InterviewRound> _interviewRoundRepository,
                                      IGenericRepository<Candidate> _candidateRepository,
                                      IGenericRepository<CandidateHistory> _candidateHistoryRepository,
                                      IGenericRepository<Partner> _partnerRepository,
                                      IGenericRepository<HiringReqPartner> _hiringReqPartnerRepository,
                                      IGenericRepository<Users> _userRepository,
                                      IInterviewSlotService _interviewSlotService,
                                      IGenericRepository<ContactMatrix> _contactMatrixRepository,
                                      IConfiguration _configuration,
                                      IApplicationUtilities _applicationUtilities,
                                      IHelperMethods _helperMethods,
                                      IGenericRepository<Calibration> _calibrationRepository,
                                      IMapper _mapper) : BaseService, IHiringService
    {
        public async Task<ApiResponseDto<HiringProfileDto>> GetHiringProfile(string hrqId)
        {
            return await ExecuteAsync(async () =>
            {
                var (UserId, RoleId, PartnerId) = _helperMethods.GetUserDetails();

                var result = await _hiringRequestRepository.GetAsync(query => query
                    .Include(x => x.RequestApprover)
                    .Include(x => x.HiringManager)
                    .Include(x => x.RecordType)
                    .Include(x => x.OnholdRequestedByRole)
                    .Include(x => x.OnholdRaisedByUser)
                    .Include(x => x.OnholdReason)
                    .Include(x => x.OnholdReviewedByUser)
                    .Include(x => x.OnHoldReviewStatus)
                    .Include(x => x.Domain)
                    .ThenInclude(x => x!.DomainManager)
                    .Include(x => x.HiringType)
                    .Include(x => x.HiringStatus)
                    .Include(x => x.ApprovalStatus)
                    .Include(x => x.RMOwner)
                    .Include(x => x.Requestor)
                    .Include(x => x.Business)
                    .Include(x => x.PartnerCategory)
                    .ThenInclude(x => x!.SelectedPartners)
                    .Include(x => x.BETApprover)
                    .Where(x => x.HrqId == hrqId));

                HiringProfileDto profile = new()
                {
                    HiringDetails = new()
                };

                var partnerContributions = new List<PartnerContibutions>();

                var selectedPartners = result.PartnerCategory != null ? result!.PartnerCategory.SelectedPartners : null;

                if (selectedPartners != null && selectedPartners.Count > 0)
                {
                    foreach (var hiirngPartner in selectedPartners)
                    {
                        var partner = await _partnerRepository.GetAsync(hiirngPartner.PartnerId);


                        var totalProfilesSubmitted = partner != null ? await (from c in _context.CandidateForms
                                                                              join p in _context.Partners on c.PartnerId equals p.Id
                                                                              where p.Id == partner.Id && c.HiringRequestId == result.Id
                                                                              select c)
                                                   .CountAsync() : 0;
                        if (partner != null)
                            partnerContributions.Add(new()
                            {
                                Contributions = totalProfilesSubmitted,
                                PartnerId = partner.Id,
                                PartnerCode = partner.PartnerCode,
                                Nickname = partner.Nickname,
                            });
                    }
                }

                var talents = await _candidateRepository.GetListAsync(query => query
                                                                                .Include(x => x.Partner)
                                                                                .Include(x => x.IntakeStatus)
                                                                                .Include(x => x.InterviewSlots!)
                                                                                .ThenInclude(x => x.CurrentRound)
                                                                                .Include(x => x.Resume)
                                                                                .Where(x => x.HiringRequestId == result!.Id
                                                                                && (RoleId != (int)ROLES.PANEL || x.InterviewSlots.Any(slot => slot.Panel.Any(panel => panel == UserId)))
                                                                                ));

                var talentDtos = _mapper.Map<List<GetCandidateDto>>(talents);

                talentDtos.ForEach(c => c.TatInDays = _applicationUtilities.CalculateTatDays(c.InterviewTatStartDate ?? DateTime.UtcNow, c.InterviewTatEndDate));

                profile.PartnerContributions = partnerContributions;

                profile.SelectedTalents = [.. talentDtos.Where(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED ||
                                                                    x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ROLLED_OUT ||
                                                                    x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED ||
                                                                    x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED ||
                                                                    x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.ONBOARDED)];

                profile.TalentPipeline = [.. talentDtos.Where(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING)];

                profile.RejectedCandidates = [.. talentDtos.Where(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.REJECTED)];

                profile.TalentBench = [.. talentDtos.Where(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING)];

                profile.DroppedCandidates = [.. talentDtos.Where(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP)];

                _mapper.Map(result, profile.HiringDetails);

                if (profile.HiringDetails != null)
                    profile.HiringDetails.HasChildRequests = _context.Hiring.Where(x => x.ParentHrqId == result.HrqId).Count() > 0;

                var upcomingInterviews = await _interviewSlotService.GetUpcomingInterviewList(result.Id);

                profile.UpcomingInterviews = upcomingInterviews;

                return _mapper.Map<HiringProfileDto>(profile);

            }, "Hiring request fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<HiringGridViewDto>>> GetPagedHiringRequests(HiringListPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                (DateTime financialYearStartDate, DateTime financialYearEndDate)? financialDateRange = null;

                var range = _helperMethods.GetDateRangeByDurationId(pageData.TATDurationId ?? (int)DurationRange.All);

                if (pageData.FinancialYear != null && pageData.FinancialYear != 1 && pageData.QuarterId != null)
                    financialDateRange = await _helperMethods.GetFinancialQuarterRange(pageData.FinancialYear ?? 0, (FinancialQuarter)(pageData.QuarterId ?? 5));

                var result = await _hiringRequestRepository.GetPaginatedListWithJoinQueryAsync<HiringGridViewDto>(pageData,
                       query => from hiringRequest in query

                                join business in _context.M_MasterData on hiringRequest.BusinessId equals business.Id into businesses
                                from business in businesses.DefaultIfEmpty()

                                join requestor in _context.Users on hiringRequest.RequestorId equals requestor.UserId into requestors
                                from requestor in requestors.DefaultIfEmpty()

                                join requestApprover in _context.Users on hiringRequest.RequestApproverId equals requestApprover.UserId into requestApprovers
                                from requestApprover in requestApprovers.DefaultIfEmpty()

                                join domain in _context.M_Domains on hiringRequest.DomainId equals domain.Id into domains
                                from domain in domains.DefaultIfEmpty()

                                join rmOwner in _context.Users on hiringRequest.RmOwnerId equals rmOwner.UserId into rmOwners
                                from rmOwner in rmOwners.DefaultIfEmpty()

                                join status in _context.M_MasterData on hiringRequest.HiringStatusId equals status.Id into statuses
                                from status in statuses.DefaultIfEmpty()

                                where (pageData.IsBin == true ? (pageData.IsApproved == false ? hiringRequest.ApprovalStatusId == (int)APPROVAL_STATUS.REJECTED : hiringRequest.ApprovalStatusId == null) :
                                (
                                    (pageData.IsParent != true || hiringRequest.IsParentHRQ == true) &&
                                    (pageData.HiringStatusIds != null && pageData.HiringStatusIds.Count > 0 && pageData.HiringStatusIds.Contains(hiringRequest.HiringStatusId ?? 0)) &&
                                    (((pageData.IsAssigned == false || pageData.IsAssigned == null) && (hiringRequest.IsRMOwnerAccepted == null || hiringRequest.IsRMOwnerAccepted == false) && (hiringRequest.ApprovalStatusId != null)
                                    && (hiringRequest.HiringStatusId == (int)HIRING_STATUS.WIP || hiringRequest.HiringStatusId == (int)HIRING_STATUS.CANCELLED)
                                    ) ||
                                    (pageData.IsAssigned == true && hiringRequest.IsRMOwnerAccepted == true)) &&
                                    (
                                        (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.RMOwner) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER && hiringRequest.HiringMangerId == loggedInUserDetails.UserId) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER && hiringRequest.InterviewRounds.Any(slot => slot.Panel.Any(panel => panel == loggedInUserDetails.UserId))) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.DomainManager && domain!.DomainManagerId == loggedInUserDetails.UserId) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.DomainManager && hiringRequest.InterviewRounds.Any(slot => slot.Panel.Any(panel => panel == loggedInUserDetails.UserId))) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.BETApprover && hiringRequest!.BETApproverId == loggedInUserDetails.UserId) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.BETMember && hiringRequest!.CreatedBy == loggedInUserDetails.UserId) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.PANEL && hiringRequest.InterviewRounds.Any(slot => slot.Panel.Any(panel => panel == loggedInUserDetails.UserId)))
                                    )
                                ))
                                && (financialDateRange == null || (hiringRequest.RequestStartDate.Date >= financialDateRange.Value.financialYearStartDate.Date && hiringRequest.RequestStartDate.Date <= financialDateRange.Value.financialYearEndDate.Date))
                                && (range == null || (hiringRequest.RequestStartDate.Date >= range.Value.StartDate.Date && hiringRequest.RequestStartDate.Date <= range.Value.EndDate!.Value.Date))

                                orderby (hiringRequest.UpdatedAt ?? hiringRequest.CreatedAt ?? DateTime.MinValue) descending,
                                         hiringRequest.Id descending

                                select new HiringGridViewDto
                                {
                                    Id = hiringRequest.Id,
                                    HrqId = hiringRequest.HrqId,
                                    BusinessName = business.Name,
                                    RcMsProjectId = hiringRequest.RCMSProjectId,
                                    RcMsResourceRequestId = hiringRequest.RCMSResourceRequestId,
                                    ProjectName = hiringRequest.ProjectName,
                                    RequestorName = requestor.FullName,
                                    RequestApproverName = requestApprover.FullName,
                                    JobTitle = hiringRequest.JobTitle,
                                    RequestStartDate = hiringRequest.RequestStartDate,
                                    RequestCreationDate = hiringRequest.RequestCreationDate,
                                    ParentHrqId = hiringRequest.ParentHrqId,
                                    HiringStatusName = status.Name,
                                    RMOwnerName = rmOwner.FullName,
                                    IsRMOwnerAccepted = hiringRequest.IsRMOwnerAccepted,
                                    TatInDays = _applicationUtilities.CalculateTatDays(hiringRequest.RequestStartDate,
                                                                                       hiringRequest.HiringStatusId == (int)HIRING_STATUS.ON_HOLD ? hiringRequest.OnholdDate
                                                                                       : hiringRequest.HiringStatusId == (int)HIRING_STATUS.CLOSED ? hiringRequest.ClosedDate
                                                                                       : hiringRequest.HiringStatusId == (int)HIRING_STATUS.CANCELLED ? hiringRequest.CancelledDate
                                                                                       : DateTime.UtcNow),
                                    TotalHeadCount = _context.Hiring.Count(h => (pageData.IsParent == true ? (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) : h.HrqId == hiringRequest.HrqId) && h.HiringStatusId != (int)HIRING_STATUS.CANCELLED && h.BETApproverId != null),
                                    OpenHeadCount = _context.Hiring.Count(h => (pageData.IsParent == true ? (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) : h.HrqId == hiringRequest.HrqId) && h.HiringStatusId == (int)HIRING_STATUS.WIP),
                                    ClosedHeadCount = _context.Hiring.Count(h => (pageData.IsParent == true ? (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) : h.HrqId == hiringRequest.HrqId) && h.HiringStatusId == (int)HIRING_STATUS.CLOSED),
                                    IdentifiedHeadCount = _context.Hiring.Count(h => (pageData.IsParent == true ? (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) : h.HrqId == hiringRequest.HrqId) && (h.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED || h.HiringStatusId == (int)HIRING_STATUS.OFFER_ACCEPTED)),
                                    OnholdHeadCount = _context.Hiring.Count(h => (pageData.IsParent == true ? (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) : h.HrqId == hiringRequest.HrqId) && (h.HiringStatusId == (int)HIRING_STATUS.ON_HOLD)),
                                });

                return result;

            }, "Hiring requests fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetHiringRequestDto>>> GetHiringRequests()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _hiringRequestRepository.GetListAsync(query => query
                    .Include(x => x.RecordType)
                    .Include(x => x.HiringManager)
                    .Include(x => x.OnholdRequestedByRole)
                    .Include(x => x.OnholdRaisedByUser)
                    .Include(x => x.OnholdReason)
                    .Include(x => x.OnholdReviewedByUser)
                    .Include(x => x.OnHoldReviewStatus)
                    .Include(x => x.Domain)
                    .ThenInclude(x => x!.DomainManager)
                    .Include(x => x.HiringType)
                    .Include(x => x.HiringStatus)
                    .Include(x => x.ApprovalStatus)
                    .Include(x => x.RMOwner)
                    .Include(x => x.Requestor)
                    .Include(x => x.Business)
                    .Include(x => x.BETApprover));
                return _mapper.Map<IEnumerable<GetHiringRequestDto>>(result);
            }, "Hiring requests fetched successfully.");
        }

        public async Task<ApiResponseDto<GetHiringRequestDto>> GetHiringRequest(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _hiringRequestRepository.GetAsync(query => query
                    .Include(x => x.RecordType)
                    .Include(x => x.HiringManager)
                    .Include(x => x.OnholdRequestedByRole)
                    .Include(x => x.OnholdRaisedByUser)
                    .Include(x => x.OnholdReason)
                    .Include(x => x.OnholdReviewedByUser)
                    .Include(x => x.OnHoldReviewStatus)
                    .Include(x => x.HiringType)
                    .Include(x => x.Domain)
                    .ThenInclude(x => x!.DomainManager)
                    .Include(x => x.HiringStatus)
                    .Include(x => x.ApprovalStatus)
                    .Include(x => x.RMOwner)
                    .Include(x => x.Requestor)
                    .Include(x => x.Business)
                    .Include(x => x.BETApprover)
                    .Include(x => x.JobDetails)
                    .Include(x => x.PartnerCategory)
                    .Include(x => x.InterviewRounds)
                    .Where(x => x.Id == id)) ?? throw new Exception($"HiringRequest is not found with Id : {id}");

                var resultDto = _mapper.Map<GetHiringRequestDto>(entity);

                var _hasJobDetails = entity.JobDetails != null;
                var _hasInterviewRounds = entity.InterviewRounds != null && entity.InterviewRounds.Count() > 0;
                var _hasPartnerCategory = entity.PartnerCategory != null;

                resultDto.HasJobDetails = _hasJobDetails == true;
                resultDto.HasInterviewRounds = _hasJobDetails == true && _hasInterviewRounds == true;
                resultDto.HasPartnerCategory = _hasJobDetails == true && _hasInterviewRounds == true && _hasPartnerCategory == true;

                return resultDto;

            }, "Hiring request fetched successfully.");
        }

        public async Task<ApiResponseDto<GetHiringRequestDto>> AddHiringRequest(AddHiringRequestDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                string? parentHrqId = null;
                int currentHiringRequestId = 0;

                if (dto.RecordTypeId == (int)REC_TYPE.NEW)
                {
                    GetHiringRequestDto singleHiringRequiestDtos = new();

                    // Status set to new for new hiring requests.
                    dto.HiringStatusId = (int)HIRING_STATUS.NEW;

                    if (!dto.IsSinglePosition && dto.IsMultiplePositions && dto.NumberOfPositions > 1)
                    {
                        for (int i = 0; i < dto.NumberOfPositions; i++)
                        {
                            if (i == 0)
                            {
                                HiringRequest parentHiring = _mapper.Map<HiringRequest>(dto);

                                parentHiring.IsParentHRQ = true;

                                var result = await _hiringRequestRepository.AddAsync(parentHiring);
                                parentHrqId = result.HrqId;
                                singleHiringRequiestDtos = _mapper.Map<GetHiringRequestDto>(result);
                                currentHiringRequestId = result.Id;
                            }
                            else
                            {
                                HiringRequest childHiring = new();
                                _mapper.Map(dto, childHiring);

                                childHiring.ParentHrqId = parentHrqId;
                                childHiring.IsParentHRQ = false;
                                childHiring.IsMultiplePositions = false;
                                childHiring.NumberOfPositions = 0;

                                var result = await _hiringRequestRepository.AddAsync(childHiring);
                                currentHiringRequestId = result.Id;
                            }
                        }


                        await SendRMApprovalForHiringEmail((int)HiringEmailTemplateEnums.RMApprovalNotification, currentHiringRequestId);

                        await SendHiringRequestCreateAckEmail((int)HiringEmailTemplateEnums.HiringRequestCreationAcknowledgementNotification, currentHiringRequestId);

                        return _mapper.Map<GetHiringRequestDto>(singleHiringRequiestDtos);
                    }
                    else
                    {
                        HiringRequest parentHiring = _mapper.Map<HiringRequest>(dto);
                        parentHiring.IsParentHRQ = true;
                        parentHiring.IsMultiplePositions = false;
                        var result = await _hiringRequestRepository.AddAsync(parentHiring);

                        currentHiringRequestId = result.Id;

                        await SendRMApprovalForHiringEmail((int)HiringEmailTemplateEnums.RMApprovalNotification, currentHiringRequestId);

                        await SendHiringRequestCreateAckEmail((int)HiringEmailTemplateEnums.HiringRequestCreationAcknowledgementNotification, currentHiringRequestId);

                        return _mapper.Map<GetHiringRequestDto>(result);
                    }
                }
                else if (dto.RecordTypeId == (int)REC_TYPE.REPLICA)
                {
                    if (dto.ReferredHrqId == null || !(await ValidateHrqId(dto.ReferredHrqId)))
                        throw new Exception("ReferredHrqId is invalid.");

                    GetHiringRequestDto singleHiringRequiestDtos = new();
                    // Status set to new for new hiring requests.
                    dto.HiringStatusId = (int)HIRING_STATUS.NEW;

                    if (!dto.IsSinglePosition && dto.IsMultiplePositions && dto.NumberOfPositions > 1)
                    {
                        for (int i = 0; i < dto.NumberOfPositions; i++)
                        {
                            if (i == 0)
                            {
                                HiringRequest parentHiring = _mapper.Map<HiringRequest>(dto);

                                parentHiring.IsParentHRQ = true;
                                parentHiring.IsRMOwnerAccepted = null;
                                parentHiring.RmOwnerId = null;
                                parentHiring.RMOwner = null;
                                parentHiring.RmOwnerAcceptedOn = null;
                                parentHiring.HiringStatusId = (int)HIRING_STATUS.NEW;
                                parentHiring.RequestStartDate = dto.RequestStartDate;

                                var result = await _hiringRequestRepository.AddAsync(parentHiring);
                                parentHrqId = result.HrqId;
                                currentHiringRequestId = result.Id;
                                singleHiringRequiestDtos = _mapper.Map<GetHiringRequestDto>(result);
                            }
                            else
                            {
                                HiringRequest childHiring = new();
                                _mapper.Map(dto, childHiring);

                                childHiring.ParentHrqId = parentHrqId;
                                childHiring.IsParentHRQ = false;
                                childHiring.IsMultiplePositions = false;
                                childHiring.NumberOfPositions = 0;
                                childHiring.IsRMOwnerAccepted = null;
                                childHiring.RmOwnerId = null;
                                childHiring.RMOwner = null;
                                childHiring.RmOwnerAcceptedOn = null;
                                childHiring.HiringStatusId = (int)HIRING_STATUS.NEW;
                                childHiring.RequestStartDate = dto.RequestStartDate;

                                var result = await _hiringRequestRepository.AddAsync(childHiring);
                                currentHiringRequestId = result.Id;

                            }

                            var repicaHiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.HrqId == dto.ReferredHrqId));

                            // Add Job Details From Replica HRQ
                            var replicaJobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == repicaHiringRequest.Id));

                            if (replicaJobDetails != null)
                            {
                                replicaJobDetails.Id = 0;
                                replicaJobDetails.HiringRequestId = currentHiringRequestId;
                                await _jobDetailsRepository.AddAsync(replicaJobDetails);
                            }

                            // Add PartnerCategory From Replica HRQ
                            var replicaPartnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == repicaHiringRequest.Id));

                            if (replicaPartnerCategory != null)
                            {
                                replicaPartnerCategory.Id = 0;
                                replicaPartnerCategory.HiringRequestId = currentHiringRequestId;

                                if (replicaPartnerCategory.SelectedPartners?.Count > 0)
                                {
                                    foreach (var item in replicaPartnerCategory.SelectedPartners)
                                    {
                                        item.Id = 0;
                                    }
                                }

                                await _partnerCategoryRepository.AddAsync(replicaPartnerCategory);

                                if (replicaPartnerCategory.SelectedPartners != null && replicaPartnerCategory.SelectedPartners.Count() > 0)
                                {
                                    foreach (var ptnr in replicaPartnerCategory.SelectedPartners)
                                    {
                                        try
                                        {
                                            var partner = await _partnerRepository.GetAsync(ptnr.PartnerId);
                                            var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                                            var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                                            var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == currentHiringRequestId));

                                            var jobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));
                                            string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;
                                            if (jobDetails != null)
                                            {
                                                var city = jobDetails != null ? await _cityRepository.GetAsync(query => query.Where(x => jobDetails.PrimaryCityIds.Contains(x.Id))) : null;

                                                if (toEmail == null)
                                                {
                                                    toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                                                }

                                                var ccEmail = approver.Email;


                                                var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "Partner.");

                                                var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(approver, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "HiringManager.");

                                                var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);


                                                var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "HiringRequest.");

                                                var hiringPartdictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);


                                                var locationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(city, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "Location.");

                                                var dictionary = Utility.Utility.Merge(locationDict, hiringPartdictionary);

                                                var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                                                dictionary.Add("ProfileLink", link);

                                                await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerHiringAssociationStatusUpdateNotification, toEmail,
                                                  dictionary, ccEmail);

                                            }
                                        }
                                        catch (Exception ex)
                                        { }
                                    }
                                }
                            }

                            // Add Interview rounds From Replica HRQ
                            var replicaInterviewRounds = await _interviewRoundRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == repicaHiringRequest.Id));

                            if (replicaInterviewRounds != null && replicaInterviewRounds.Count() > 0)
                            {
                                foreach (var interviewRound in replicaInterviewRounds)
                                {
                                    interviewRound.Id = 0;
                                    interviewRound.HiringRequestId = currentHiringRequestId;
                                }
                                await _interviewRoundRepository.AddListAsync(replicaInterviewRounds);
                            }
                        }


                        await SendRMApprovalForHiringEmail((int)HiringEmailTemplateEnums.RMApprovalNotification, currentHiringRequestId);

                        await SendHiringRequestCreateAckEmail((int)HiringEmailTemplateEnums.HiringRequestCreationAcknowledgementNotification, currentHiringRequestId);


                        return _mapper.Map<GetHiringRequestDto>(singleHiringRequiestDtos);
                    }
                    else
                    {
                        HiringRequest parentHiring = _mapper.Map<HiringRequest>(dto);

                        parentHiring.IsParentHRQ = true;
                        parentHiring.IsMultiplePositions = false;
                        parentHiring.NumberOfPositions = 0;
                        parentHiring.IsRMOwnerAccepted = null;
                        parentHiring.RmOwnerId = null;
                        parentHiring.RMOwner = null;
                        parentHiring.RmOwnerAcceptedOn = null;

                        var result = await _hiringRequestRepository.AddAsync(parentHiring);
                        currentHiringRequestId = result.Id;
                        if (result != null)
                        {
                            // Getting Replica HRQ
                            var repicaHiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.HrqId == result.ReferredHrqId));

                            // Add Job Details From Replica HRQ
                            var replicaJobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == repicaHiringRequest.Id));

                            if (replicaJobDetails != null)
                            {
                                replicaJobDetails.Id = 0;
                                replicaJobDetails.HiringRequestId = result.Id;
                                await _jobDetailsRepository.AddAsync(replicaJobDetails);
                            }

                            // Add PartnerCategory From Replica HRQ
                            var replicaPartnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == repicaHiringRequest.Id));

                            if (replicaPartnerCategory != null)
                            {
                                replicaPartnerCategory.Id = 0;
                                replicaPartnerCategory.HiringRequestId = result.Id;

                                if (replicaPartnerCategory.SelectedPartners?.Count > 0)
                                {
                                    foreach (var item in replicaPartnerCategory.SelectedPartners)
                                    {
                                        item.Id = 0;
                                    }
                                }

                                await _partnerCategoryRepository.AddAsync(replicaPartnerCategory);

                                if (replicaPartnerCategory.SelectedPartners != null && replicaPartnerCategory.SelectedPartners.Count() > 0)
                                {
                                    foreach (var ptnr in replicaPartnerCategory.SelectedPartners)
                                    {

                                        try
                                        {
                                            var partner = await _partnerRepository.GetAsync(ptnr.PartnerId);
                                            var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                                            var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                                            var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == result.Id));

                                            var jobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));
                                            string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;
                                            if (jobDetails != null)
                                            {
                                                var city = jobDetails != null ? await _cityRepository.GetAsync(query => query.Where(x => jobDetails.PrimaryCityIds.Contains(x.Id))) : null;

                                                if (toEmail == null)
                                                {
                                                    toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                                                }

                                                var ccEmail = approver.Email;


                                                var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "Partner.");

                                                var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(approver, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "HiringManager.");

                                                var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);


                                                var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "HiringRequest.");

                                                var hiringPartdictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);


                                                var locationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(city, new JsonSerializerSettings
                                                {
                                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                    Formatting = Formatting.Indented,
                                                    ContractResolver = new DefaultContractResolver
                                                    {
                                                        NamingStrategy = new InitCapNamingStrategy()
                                                    }
                                                }), "Location.");

                                                var dictionary = Utility.Utility.Merge(locationDict, hiringPartdictionary);

                                                var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                                                dictionary.Add("ProfileLink", link);

                                                await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerHiringAssociationStatusUpdateNotification, toEmail,
                                                  dictionary, ccEmail);

                                            }
                                        }
                                        catch (Exception ex)
                                        { }
                                    }
                                }
                            }

                            // Add Interview rounds From Replica HRQ
                            var replicaInterviewRounds = await _interviewRoundRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == repicaHiringRequest.Id));

                            if (replicaInterviewRounds != null && replicaInterviewRounds.Any())
                            {
                                foreach (var interviewRound in replicaInterviewRounds)
                                {
                                    interviewRound.Id = 0;
                                    interviewRound.HiringRequestId = result.Id;
                                }
                                await _interviewRoundRepository.AddListAsync(replicaInterviewRounds);
                            }
                        }

                        await SendRMApprovalForHiringEmail((int)HiringEmailTemplateEnums.RMApprovalNotification, currentHiringRequestId);

                        await SendHiringRequestCreateAckEmail((int)HiringEmailTemplateEnums.HiringRequestCreationAcknowledgementNotification, currentHiringRequestId);

                        return _mapper.Map<GetHiringRequestDto>(result);
                    }
                }

                throw new Exception("RecordTypeId is not valid.");

            }, "Hiring request added successfully.");
        }


        public async Task<ApiResponseDto<string>> AddChildHiringRequests(AddChildHiringRequestsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == dto.ParentHiringRequestId));

                if (hiringRequest == null || hiringRequest.HiringStatusId != (int)HIRING_STATUS.WIP || hiringRequest.IsParentHRQ != true)
                    throw new Exception("ParentHiringRequestId is invalid.");

                hiringRequest.NumberOfPositions = (hiringRequest.NumberOfPositions ?? 0) + (dto.NoOfPositions ?? 0);

                await _hiringRequestRepository.UpdateAsync(hiringRequest);

                var parentHrqId = hiringRequest.HrqId;

                if (dto.NoOfPositions >= 1)
                {
                    List<JobDetails> _jobDetailsList = [];
                    List<PartnerCategory> _partnerCategoryList = [];
                    List<InterviewRound> _interviewRoundList = [];


                    for (int i = 0; i < dto.NoOfPositions; i++)
                    {
                        var childHiring = _mapper.Map<HiringRequest>(hiringRequest);

                        childHiring.Id = 0;
                        childHiring.ParentHrqId = parentHrqId;
                        childHiring.IsParentHRQ = false;
                        childHiring.IsMultiplePositions = false;
                        childHiring.NumberOfPositions = 0;
                        childHiring.IsRMOwnerAccepted = null;
                        childHiring.RmOwnerId = null;
                        childHiring.RMOwner = null;
                        childHiring.RmOwnerAcceptedOn = null;
                        childHiring.ApprovalStatusId = null;
                        childHiring.ApproverComments = null;
                        childHiring.RequestApproverId = null;
                        childHiring.ApproverUpdatedDate = null;
                        childHiring.HiringStatusId = (int)HIRING_STATUS.NEW;

                        var result = await _hiringRequestRepository.AddAsync(childHiring);

                        // Add Job Details From Replica HRQ
                        var replicaJobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == dto.ParentHiringRequestId));

                        if (replicaJobDetails != null)
                        {
                            JobDetails newItem = new()
                            {
                                JobDescription = replicaJobDetails.JobDescription,
                                HiringActivityId = replicaJobDetails.HiringActivityId,
                                JobPriorityId = replicaJobDetails.JobPriorityId,
                                HiringDate = replicaJobDetails.HiringDate,
                                ResourceTypeId = replicaJobDetails.ResourceTypeId,

                                JobLocation = replicaJobDetails.JobLocation,

                                SubDomainId = replicaJobDetails.SubDomainId,

                                PrimarySkills = replicaJobDetails.PrimarySkills != null
                                    ? [.. replicaJobDetails.PrimarySkills]
                                    : null,

                                SecondarySkills = replicaJobDetails.SecondarySkills != null
                                    ? [.. replicaJobDetails.SecondarySkills]
                                    : null,

                                MandatoryCertificationId = replicaJobDetails.MandatoryCertificationId,
                                MandatoryCertification = replicaJobDetails.MandatoryCertification,
                                BadgeRecId = replicaJobDetails.BadgeRecId,
                                JobLevelId = replicaJobDetails.JobLevelId,
                                RelevantExperience = replicaJobDetails.RelevantExperience,
                                TotalExperience = replicaJobDetails.TotalExperience,

                                CountryId = replicaJobDetails.CountryId,
                                StateIds = replicaJobDetails.StateIds,
                                PrimaryCityIds = replicaJobDetails.PrimaryCityIds,
                                SecondaryCityIds = replicaJobDetails.SecondaryCityIds,
                                HiringRequestId = result.Id
                            };

                            _jobDetailsList.Add(newItem);
                        }

                        // Add PartnerCategory From Replica HRQ
                        var replicaPartnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == dto.ParentHiringRequestId));

                        if (replicaPartnerCategory != null)
                        {
                            PartnerCategory newItem = new();

                            newItem.IsSpecificPartner = replicaPartnerCategory.IsSpecificPartner;
                            newItem.IsProxyPartner = replicaPartnerCategory.IsProxyPartner;
                            newItem.IsRecommendThePartner = replicaPartnerCategory.IsRecommendThePartner;
                            newItem.ProfileCAP = replicaPartnerCategory.ProfileCAP;
                            newItem.Comments = replicaPartnerCategory.Comments;
                            newItem.HiringRequestId = result.Id; // Assign the new HRQ Id

                            // Deep copy for SelectedPartners (reset IDs and assign FK)
                            if (replicaPartnerCategory.SelectedPartners != null && replicaPartnerCategory.SelectedPartners.Any())
                            {
                                newItem.SelectedPartners = new List<HiringReqPartner>();

                                foreach (var partner in replicaPartnerCategory.SelectedPartners)
                                {
                                    var newPartner = new HiringReqPartner
                                    {
                                        Id = 0,
                                        PartnerId = partner.PartnerId,
                                        AssignedOn = partner.AssignedOn,
                                    };

                                    newItem.SelectedPartners.Add(newPartner);
                                }
                            }

                            _partnerCategoryList.Add(newItem);
                        }

                        // Add Interview rounds From Replica HRQ
                        var replicaInterviewRounds = await _interviewRoundRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == dto.ParentHiringRequestId));

                        if (replicaInterviewRounds != null && replicaInterviewRounds.Count() > 0)
                        {
                            List<InterviewRound> listItems = new();

                            foreach (var round in replicaInterviewRounds)
                            {
                                var newRound = new InterviewRound
                                {
                                    Id = 0,
                                    RoundNumber = round.RoundNumber,
                                    RoundNameId = round.RoundNameId,
                                    ModeOfInterview = round.ModeOfInterview,
                                    Comments = round.Comments,
                                    IsAddSpecificCandidates = round.IsAddSpecificCandidates,
                                    AddFeedbackCritria = round.AddFeedbackCritria,
                                    CategoryId = round.CategoryId,
                                    HiringRequestId = result.Id,
                                    SkipScreening = round.SkipScreening,
                                    ScreeningCap = round.ScreeningCap,
                                    AvailableDays = round.AvailableDays != null ? [.. round.AvailableDays] : [],
                                    Panel = round.Panel != null ? [.. round.Panel] : [],
                                    Candidates = round.Candidates != null ? [.. round.Candidates] : [],
                                };

                                listItems.Add(newRound);
                            }

                            _interviewRoundList.AddRange(listItems);
                        }
                    }

                    await _jobDetailsRepository.AddListAsync(_jobDetailsList);
                    await _partnerCategoryRepository.AddListAsync(_partnerCategoryList);
                    await _interviewRoundRepository.AddListAsync(_interviewRoundList);
                }
            }, "Added new hiring requests to existing Hiring Request successfully.");
        }

        private async Task SendRMApprovalForHiringEmail(int template, int currentHiringRequestId)
        {

            try
            {
                var beteamManger = await _userRepository.GetListAsync(query => query.Include(x => x.UserRoles!).ThenInclude(x => x.Role).Where(x => x.IsActive == true && x.UserRoles!.Any(x => x.RoleId == (int)ROLES.BETApprover)));

                foreach (var betManagr in beteamManger)
                {
                    var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == currentHiringRequestId));

                    string toEmail = betManagr.Email;

                    var hiringManger = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                    var ccEmail = hiringManger.Email;

                    var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManger, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "HiringManager.");

                    var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "HiringRequest.");

                    var hiringDictionary = Utility.Utility.Merge(hiringRequestDict, hiringDict);


                    var betTeamManagerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(betManagr, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "BETeamManager.");

                    var dictionary = Utility.Utility.Merge(betTeamManagerDict, hiringDictionary);

                    var link = _configuration["ClientHostName"] + "/home/hiring-manage/hiring-profile?id=" + hiringRequest.HrqId;
                    dictionary.Add("ProfileLink", link);

                    await _communicationService.AddNotification(template, toEmail,
                      dictionary, ccEmail);
                }
            }
            catch (Exception ex)
            { }


        }

        private async Task SendHiringRequestCreateAckEmail(int template, int currentHiringRequestId)
        {

            try
            {

                {
                    var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == currentHiringRequestId));

                    var beteamMember = await _userRepository.GetAsync(hiringRequest.CreatedBy);

                    string toEmail = beteamMember.Email;

                    var hiringManger = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                    var ccEmail = hiringManger.Email;

                    var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManger, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "HiringManager.");

                    var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "HiringRequest.");

                    var hiringDictionary = Utility.Utility.Merge(hiringRequestDict, hiringDict);


                    var betTeamMemberDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(beteamMember, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "BETeamMember.");

                    var dictionary = Utility.Utility.Merge(betTeamMemberDict, hiringDictionary);

                    var link = _configuration["ClientHostName"] + "/home/hiring-manage/hiring-profile?id=" + hiringRequest.HrqId;
                    dictionary.Add("ProfileLink", link);

                    await _communicationService.AddNotification(template, toEmail,
                      dictionary, ccEmail);
                }
            }
            catch (Exception ex)
            { }


        }


        private async Task<bool> ValidateHrqId(string? hrqId)
        {
            var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.HrqId == hrqId));

            return hiringRequest != null;
        }

        public async Task<ApiResponseDto<string>> UpdateHiringRequest(AddHiringRequestDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _hiringRequestRepository.GetAsync(dto.Id) ?? throw new Exception($"HiringRequest is not found with Id : {dto.Id}");

                entity.HiringMangerId = dto.HiringMangerId;

                await _hiringRequestRepository.UpdateAsync(entity);

                var partnerCatDetails = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == entity.Id));

                if (partnerCatDetails?.SelectedPartners?.Count > 0)
                    foreach (var partners in partnerCatDetails.SelectedPartners)
                    {
                        try
                        {
                            var partner = await _partnerRepository.GetAsync(partners.PartnerId);
                            var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));

                            var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == dto.Id));

                            var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                            string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                            if (toEmail == null)
                            {
                                toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                            }

                            var ccEmail = hiringManager.Email;


                            var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,

                            }), "Partner.");

                            var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManager, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "HiringManager.");

                            var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);

                            var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "HiringRequest.");

                            var dictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);

                            var link = _configuration["ClientHostName"] + "/home/hiring-details?hrqid=" + hiringRequest.HrqId;
                            dictionary.Add("ProfileLink", link);


                            await _communicationService.AddNotification((int)HiringEmailTemplateEnums.HiringRequestJobDetailsUpdatedNotification, toEmail,
                                dictionary, ccEmail);

                        }
                        catch (Exception ex)
                        { }
                    }

            }, "Hiring request updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ChangeApprovalStatus(int id, int? approverStatusId, string? approverComments, DateTime? approverDate, bool? proceedToCancelChildHrqs = false)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();
                var entity = await _hiringRequestRepository.GetAsync(id) ?? throw new Exception($"HiringRequest is not found with Id : {id}");

                if (approverStatusId == (int)APPROVAL_STATUS.APPROVED)
                {
                    if (entity.IsParentHRQ == true)
                    {
                        entity.RequestApproverId = loggedInUser.UserId;
                        entity.ApprovalStatusId = (int)APPROVAL_STATUS.APPROVED;
                        entity.ApproverComments = approverComments;
                        entity.ApproverUpdatedDate = approverDate;
                        entity.HiringStatusId = (int)HIRING_STATUS.WIP;
                        await _hiringRequestRepository.UpdateAsync(entity);
                        return;
                    }
                    else if (entity.IsParentHRQ == false)
                    {
                        var parentHrq = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.HrqId == entity.ParentHrqId));

                        if (parentHrq.ApprovalStatusId == null && approverStatusId == (int)APPROVAL_STATUS.APPROVED)
                            throw new Exception("Child hiring requests is not approved untill parent hiring request approved.");

                        entity.RequestApproverId = loggedInUser.UserId;
                        entity.ApprovalStatusId = (int)APPROVAL_STATUS.APPROVED;
                        entity.ApproverComments = approverComments;
                        entity.ApproverUpdatedDate = approverDate;
                        entity.HiringStatusId = (int)HIRING_STATUS.WIP;

                        await _hiringRequestRepository.UpdateAsync(entity);
                    }
                }
                else if (approverStatusId == (int)APPROVAL_STATUS.REJECTED)
                {
                    if (entity.IsParentHRQ == true && proceedToCancelChildHrqs == null)
                    {
                        throw new Exception("Do you want to cancel child hiring requests also?");
                    }
                    else if (entity.IsParentHRQ == true && proceedToCancelChildHrqs == false)
                    {
                        return;
                    }
                    else if (entity.IsParentHRQ == true && proceedToCancelChildHrqs == true)
                    {
                        List<HiringRequest> hiringRequests = [];

                        var childRequests = await _hiringRequestRepository.GetListAsync(query => query.Where(x => x.ParentHrqId == entity.HrqId));

                        foreach (var req in childRequests)
                        {
                            entity.RequestApproverId = loggedInUser.UserId;
                            req.ApprovalStatusId = approverStatusId;
                            req.ApproverComments = approverComments;
                            req.ApproverUpdatedDate = approverDate;
                            req.HiringStatusId = (int)HIRING_STATUS.CANCELLED;
                            req.CancelledDate = DateTime.UtcNow;

                            hiringRequests.Add(req);
                        }

                        entity.RequestApproverId = loggedInUser.UserId;
                        entity.ApprovalStatusId = approverStatusId;
                        entity.ApproverComments = approverComments;
                        entity.ApproverUpdatedDate = approverDate;
                        entity.HiringStatusId = (int)HIRING_STATUS.CANCELLED;
                        entity.CancelledDate = DateTime.UtcNow;

                        hiringRequests.Add(entity);

                        await _hiringRequestRepository.UpdateListAsync(hiringRequests);
                        return;
                    }
                    else if (entity.IsParentHRQ == false)
                    {
                        var parentHrq = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.HrqId == entity.ParentHrqId));

                        entity.RequestApproverId = loggedInUser.UserId;
                        entity.ApprovalStatusId = approverStatusId;
                        entity.ApproverComments = approverComments;
                        entity.ApproverUpdatedDate = approverDate;
                        entity.HiringStatusId = (int)HIRING_STATUS.CANCELLED;
                        entity.CancelledDate = DateTime.UtcNow;

                        await _hiringRequestRepository.UpdateAsync(entity);
                    }
                }

                try
                {
                    var partnerCategory1 = await _partnerCategoryRepository.GetAsync(query => query.Where(x => x.HiringRequestId == id));

                    var selectedPartners1 = await _hiringReqPartnerRepository.GetListAsync(query => query.Where(x => x.PartnerCategoryId == partnerCategory1.Id));

                    var prtnerList1 = selectedPartners1?.Select(partner => partner.PartnerId).ToList();

                    if (prtnerList1 != null)
                    {
                        foreach (var partner in prtnerList1)
                        {
                            await SendHiringStatusUpdateToPartnerEmail((int)HiringEmailTemplateEnums.HiringRequestStatusUpdateNotification, partner.Value, id);
                        }
                    }
                }
                catch (Exception ex)
                { }

            }, "Hiring request approval status updated successfully.");
        }

        private async Task SendHiringStatusUpdateToPartnerEmail(int template, int partnerId, int hiringRequestId)
        {
            try
            {
                var prtner = await _partnerRepository.GetAsync(partnerId);
                var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));
                var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId));
                var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                if (toEmail == null)
                {
                    toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                }

                var ccEmail = hiringManager.Email;

                var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(prtner, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,

                }), "Partner.");

                var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManager, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new InitCapNamingStrategy()
                    }
                }), "HiringManager.");

                var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);

                var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new InitCapNamingStrategy()
                    }
                }), "HiringRequest.");

                var dictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);

                var link = _configuration["ClientHostName"] + "/home/hiring-details?hrqid=" + hiringRequest.HrqId;
                dictionary.Add("ProfileLink", link);


                await _communicationService.AddNotification((int)template, toEmail,
                    dictionary, ccEmail);

            }
            catch (Exception ex)
            { }

        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, int hiringStatusId)
        {
            return await ExecuteAsync(async () =>
            {
                List<Candidate> candidates = [];
                List<CandidateHistory> candidateHistories = [];

                var entity = await _hiringRequestRepository.GetAsync(id) ?? throw new Exception($"HiringRequest is not found with Id : {id}");

                if (entity.HiringStatusId == (int)HIRING_STATUS.ON_HOLD && hiringStatusId == (int)HIRING_STATUS.WIP)
                {
                    entity.HiringStatusId = (int)HIRING_STATUS.WIP;

                    entity.OnholdRequestedBy = null;
                    entity.OnholdRaisedBy = null;
                    entity.OnholdRequestedDate = null;
                    entity.OnholdReasonId = null;
                    entity.OnholdComments = null;
                    entity.FreezeCandidateTypes = null;

                    entity.OnholdDate = null;
                    entity.OnholdReviewedByUserId = null;
                    entity.OnHoldReviewStatusId = null;

                    if (entity.IsParentHRQ == false)
                    {
                        var parentHrq = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.HrqId == entity.ParentHrqId));

                        if (parentHrq != null && parentHrq.HiringStatusId == (int)HIRING_STATUS.ON_HOLD)
                            throw new Exception("A child hiring request cannot be activated until its parent hiring request is activated.");
                    }

                    var candidatesToUnFreeze = await _candidateRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == entity.Id && x.IsFreezed == true));

                    if (candidatesToUnFreeze.Count() > 0)
                        foreach (var candidate in candidatesToUnFreeze)
                        {
                            candidate.IntakeStatusId = candidate.PreviousIntakeStatusId;
                            candidate.IsFreezed = null;
                            candidate.CandidateFreezedReason = null;
                            candidates.Add(candidate);

                            var candidateHistory = await _candidateHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id
                                                                                                                     && x.PartnerId == candidate.PartnerId
                                                                                                                     && x.HiringRequestId == candidate.HiringRequestId));

                            candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                            candidateHistory.IsFreezed = candidate.IsFreezed;
                            candidateHistory.CandidateFreezedReason = candidate.CandidateFreezedReason;
                            candidateHistories.Add(candidateHistory);
                        }

                    if (candidates.Count > 0)
                        await _candidateRepository.UpdateListAsync(candidates);

                    if (candidateHistories.Count > 0)
                        await _candidateHistoryRepository.UpdateListAsync(candidateHistories);
                }
                else
                    entity.HiringStatusId = hiringStatusId;

                await _hiringRequestRepository.UpdateAsync(entity);

            }, "Hiring request status updated successfully.");
        }

        public async Task<ApiResponseDto<string>> RMOwnerApproval(int id, int rmOwnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _hiringRequestRepository.GetAsync(id) ?? throw new Exception($"HiringRequest is not found with Id : {id}");

                if (entity.IsParentHRQ == false)
                {
                    var parentHrq = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.HrqId == entity.ParentHrqId));

                    if (parentHrq.IsRMOwnerAccepted == null)
                        throw new Exception("Child hiring requests is not accepted untill parent hiring request accepted.");
                }


                entity.IsRMOwnerAccepted = true;
                entity.RmOwnerId = rmOwnerId;
                entity.RmOwnerAcceptedOn = DateTime.UtcNow;

                await _hiringRequestRepository.UpdateAsync(entity);

                if (entity.IsParentHRQ == true)
                {
                    var childHirinRequests = await _hiringRequestRepository.GetListAsync(query => query.Where(x => x.ParentHrqId == entity.HrqId && x.HiringStatusId == (int)HIRING_STATUS.WIP));

                    if (childHirinRequests?.Count() > 0)
                        foreach (var childHrq in childHirinRequests)
                        {
                            if (childHrq != null)
                            {
                                childHrq.IsRMOwnerAccepted = true;
                                childHrq.RmOwnerId = rmOwnerId;
                                childHrq.RmOwnerAcceptedOn = DateTime.UtcNow;

                                await _hiringRequestRepository.UpdateAsync(childHrq);

                                await SendHiringRequestAcceptedToRMEmail(childHrq.Id, (int)HiringEmailTemplateEnums.RMAcceptedNotification);
                            }
                        }
                }

                await SendHiringRequestAcceptedToRMEmail(entity.Id, (int)HiringEmailTemplateEnums.RMAcceptedNotification);

            }, "RM Owner accepted/mapped successfully.");
        }

        private async Task SendHiringRequestAcceptedToRMEmail(int hiringRequestId, int template)
        {

            try
            {
                var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId));

                var rmOwner = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.RmOwnerId));

                var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                string toEmail = hiringManager.Email;

                var ccEmail = rmOwner.Email;

                var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManager, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new InitCapNamingStrategy()
                    }
                }), "HiringManager.");

                var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new InitCapNamingStrategy()
                    }
                }), "HiringRequest.");

                var hiringDictionary = Utility.Utility.Merge(hiringRequestDict, hiringDict);


                var rmOwnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(rmOwner, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new InitCapNamingStrategy()
                    }
                }), "RMOwner.");

                var dictionary = Utility.Utility.Merge(rmOwnerDict, hiringDictionary);

                var link = _configuration["ClientHostName"] + "/home/hiring-manage/hiring-profile?id=" + hiringRequest.HrqId;
                dictionary.Add("ProfileLink", link);

                await _communicationService.AddNotification(template, toEmail,
                  dictionary, ccEmail);
            }
            catch (Exception ex)
            { }
        }

        public async Task<ApiResponseDto<string>> TransferCandidate(TransferCandidateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _hiringRequestRepository.GetAsync(dto.HiringRequestId) ?? throw new Exception($"HiringRequest is not found with Id : {dto.HiringRequestId}");

                if (entity.IsParentHRQ == true)
                {
                    var childEntities = await _hiringRequestRepository.GetListAsync(query => query.Where(x => x.ParentHrqId == entity.HrqId
                                                                                          && x.IsRMOwnerAccepted == true
                                                                                          && x.HiringStatusId != (int)HIRING_STATUS.CANCELLED
                                                                                          && x.HiringStatusId != (int)HIRING_STATUS.CLOSED
                                                                                          && x.HiringStatusId != (int)HIRING_STATUS.CALLED_OFF
                                                                                          && x.HiringStatusId != (int)HIRING_STATUS.ON_HOLD));

                    foreach (var hrq in childEntities)
                    {
                        if (hrq.IsCandidateSelected != true)
                        {
                            throw new Exception($"Please complete child hiring requests in order to complete parent hiring request.");
                        }
                    }
                }

                if (entity.HiringStatusId == (int)HIRING_STATUS.WIP && (entity.IsCandidateSelected == null || entity.IsCandidateSelected == false))
                {
                    var candidate = await _candidateRepository.GetAsync(dto.CandidateId) ?? throw new Exception($"Candidate is not found with Id : {dto.CandidateId}");

                    if (candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED)
                    {
                        candidate.OriginalHiringRequestId = candidate.HiringRequestId; // Store the original hiring request ID
                        candidate.IsTransferred = true;
                        candidate.TransferredByUserId = dto.TransferredBy;
                        candidate.HiringRequestId = dto.HiringRequestId;

                        await _candidateRepository.UpdateAsync(candidate);

                        entity.HiringStatusId = (int)HIRING_STATUS.CANDIDATE_IDENTIFIED;
                        entity.IsCandidateSelected = true;
                        entity.CandidateId = dto.CandidateId;
                        await _hiringRequestRepository.UpdateAsync(entity);
                    }
                    else
                    {
                        throw new Exception($"Candidate is not in a valid state to transfer. Current status");
                    }
                }
                else
                {
                    throw new Exception("Hiring request is not in a valid state to transfer candidate.");
                }

            }, "Hiring request transferred successfully.");
        }


        public async Task<ApiResponseDto<GetHiringRequestDto>> GetHiringRequestByHRQID(string hrqId)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _hiringRequestRepository.GetAsync(query => query
                    .Include(x => x.Domain)
                    .ThenInclude(x => x!.DomainManager)
                    .Include(x => x.RecordType)
                    .Include(x => x.JobDetails)
                    .Include(x => x.HiringType)
                    .Include(x => x.HiringStatus)
                    .Include(x => x.HiringManager)
                    .Include(x => x.ApprovalStatus)
                    .Include(x => x.RMOwner)
                    .Include(x => x.Requestor)
                    .Include(x => x.Business)
                    .Include(x => x.BETApprover)
                    .Where(x => x.HrqId == hrqId))
                ?? throw new Exception($"HiringRequest is not found with HrqId : {hrqId}");

                if (entity.IsParentHRQ == false || entity.IsParentHRQ == null)
                    throw new Exception($"HiringRequest with HrqId : {hrqId} is a child HRQ and cannot be fetched directly.");

                return _mapper.Map<GetHiringRequestDto>(entity);
            }, "Hiring request fetched successfully.");
        }

        public async Task<ApiResponseDto<ValidatedHiringRequestDetailsDto>> ValidateHiringRequestByHRQID(string hrqId)
        {
            return await ExecuteAsync(async () =>
            {
                var validatedHiringRequest = await _hiringRequestRepository.GetItemWithJoinAsync<ValidatedHiringRequestDetailsDto>(query => from hiring in query

                                                                                                                                            join jobDetails in _context.JobDetails on hiring.Id equals jobDetails.HiringRequestId into jobDetailsGroup
                                                                                                                                            from jobDetails in jobDetailsGroup.DefaultIfEmpty()

                                                                                                                                            join partnerCategory in _context.JobDetails on hiring.Id equals partnerCategory.HiringRequestId into partnerCategoryGroup
                                                                                                                                            from partnerCategory in partnerCategoryGroup.DefaultIfEmpty()

                                                                                                                                            where hiring.HrqId == hrqId && hiring.IsParentHRQ == true

                                                                                                                                            select new ValidatedHiringRequestDetailsDto
                                                                                                                                            {
                                                                                                                                                HiringRequestId = hiring.Id,
                                                                                                                                                HrqId = hiring.HrqId,
                                                                                                                                                JobTitle = hiring.JobTitle,
                                                                                                                                                ResourceTypeId = jobDetails.ResourceTypeId,
                                                                                                                                                ResourceTypeName = jobDetails.ResourceType.Name,
                                                                                                                                                HiringStatusId = hiring.HiringStatusId,
                                                                                                                                                HiringStatusName = hiring.HiringStatus.Name,
                                                                                                                                                InterviewRoundsCount = _context.InterviewRounds.Count(x => x.HiringRequestId == hiring.Id),
                                                                                                                                                IsJobDetailsAdded = jobDetails != null,
                                                                                                                                                IsPartnerCategoryAdded = partnerCategory != null,
                                                                                                                                                JobDetails = new GetJobDetailsDto
                                                                                                                                                {
                                                                                                                                                    PrimaryCityIds = jobDetails.PrimaryCityIds,
                                                                                                                                                    SecondaryCityIds = jobDetails.SecondaryCityIds,
                                                                                                                                                }
                                                                                                                                            });

                if (validatedHiringRequest.IsJobDetailsAdded == false)
                {
                    throw new Exception($"Please add JobDetails for the HrqId: '{validatedHiringRequest.HrqId}'");
                }

                if (validatedHiringRequest.IsPartnerCategoryAdded == false)
                {
                    throw new Exception($"Please add PartnerCategory for the HrqId: '{validatedHiringRequest.HrqId}'");
                }

                if (validatedHiringRequest.InterviewRoundsCount == 0)
                {
                    throw new Exception($"Please ensure at least one interview round is added for the HrqId: '{validatedHiringRequest.HrqId}'");
                }

                // Merge both city ID lists, handle nulls, and get distinct IDs
                var mergedCityIds = (validatedHiringRequest.JobDetails?.PrimaryCityIds ?? [])
                    .Concat(validatedHiringRequest.JobDetails?.SecondaryCityIds ?? [])
                    .Distinct()
                    .ToList();

                // Query M_Cities table to fetch the city details
                var cities = await _context.M_Cities
                    .Where(c => mergedCityIds.Contains(c.Id))
                    .ToListAsync();

                // Map to your DTOs
                validatedHiringRequest.JobLocations = _mapper.Map<List<MasterDto>>(cities);
                validatedHiringRequest.JobDetails = null;

                return validatedHiringRequest;

            }, "Hiring request fetched successfully.");
        }


        //public async Task<ApiResponseDto<PagedResult<PartnerHrqsGridDto>>> GetPagedPartnerHiringRequests(PageDto pageData, int? partnerId)
        //{
        //    return await ExecuteAsync(async () =>
        //    {
        //        var result = await _hiringRequestRepository.GetPaginatedListAsync(pageData.PageNumber, pageData.PageSize, pageData.SearchColumn, pageData.SearchText,
        //        query => query
        //                .Include(h => h.PartnerCategory)
        //                .Where(pc => partnerId!= null && pc.PartnerCategory!.SelectedPartners.Contains(partnerId.Value)));

        //        var dtos = _mapper.Map<IEnumerable<PartnerHrqsGridDto>>(result.Items);

        //        return new PagedResult<PartnerHrqsGridDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
        //    }, "Partner mapped Hiring requests fetched successfully.");
        //}

        public async Task<ApiResponseDto<PagedResult<PartnerHrqsGridDto>>> GetPagedPartnerHiringRequests(PartnerHiringListPageDto pageData, int? partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                (DateTime financialYearStartDate, DateTime financialYearEndDate)? financialDateRange = null;

                if (pageData.FinancialYear != null && pageData.FinancialYear != 1 && pageData.QuarterId != null)
                    financialDateRange = await _helperMethods.GetFinancialQuarterRange(pageData.FinancialYear ?? 0, (FinancialQuarter)(pageData.QuarterId ?? 5));

                var partnerIdParam = new SqlParameter("@PartnerId", partnerId != null ? partnerId.Value : 0);
                var hiringStatusIdsParam = new SqlParameter("@HiringStatusIds", pageData.HiringStatusIds != null && pageData.HiringStatusIds.Any() ? string.Join(",", pageData.HiringStatusIds) : (object)DBNull.Value);
                var financialStartParam = new SqlParameter("@FinancialYearStart", financialDateRange?.financialYearStartDate ?? (object)DBNull.Value);
                var financialEndParam = new SqlParameter("@FinancialYearEnd", financialDateRange?.financialYearEndDate ?? (object)DBNull.Value);

                var raw = await _context.PartnerHRQDetails
                    .FromSqlRaw("EXEC GetHiringRequestDetails  @PartnerId, @HiringStatusIds, @FinancialYearStart, @FinancialYearEnd",
                                partnerIdParam,
                                hiringStatusIdsParam,
                                financialStartParam,
                                financialEndParam)
                    .ToListAsync();

                var dtos = _mapper.Map<List<PartnerHrqsGridDto>>(raw);

                var hrqIds = dtos.Select(d => d.HrqId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

                var hiringRecords = await _context.Hiring
                    .Where(h => hrqIds.Contains(h.HrqId))
                    .Select(h => new { h.Id, h.HrqId, h.RequestStartDate, h.OnholdDate, h.ClosedDate })
                    .ToListAsync();

                var hiringIdByHrq = hiringRecords.ToDictionary(x => x.HrqId!, x => x.Id);
                var hiringDatesByHrq = hiringRecords.ToDictionary(x => x.HrqId!, x => new { x.RequestStartDate, x.OnholdDate, x.ClosedDate });

                var hiringIds = hiringRecords.Select(x => x.Id).ToList();

                var jobDetailsList = await _context.JobDetails
                    .Where(j => j.HiringRequestId != null && hiringIds.Contains(j.HiringRequestId.Value))
                    .ToListAsync();

                var jobDetailsByHrq = jobDetailsList
                    .GroupJoin(hiringRecords, jd => jd.HiringRequestId, hr => hr.Id, (jd, hrs) => new { jd, hrs })
                    .SelectMany(x => x.hrs.Select(hr => new { HrqId = hr.HrqId, JobDetails = x.jd }))
                    .ToLookup(x => x.HrqId, x => x.JobDetails)
                    .ToDictionary(l => l.Key!, l => l.FirstOrDefault());

                var allSkillIds = jobDetailsList
                    .SelectMany(j => (j.PrimarySkills ?? new List<int>()).Concat(j.SecondarySkills ?? new List<int>()))
                    .Where(id => id != 0)
                    .Distinct()
                    .ToList();

                var skillDict = new Dictionary<int, string>();
                if (allSkillIds.Any())
                {
                    var skills = await _context.M_Skills.Where(s => allSkillIds.Contains(s.Id)).ToListAsync();
                    skillDict = skills.ToDictionary(s => s.Id, s => s.Name ?? string.Empty);
                }

                var candidateForms = await _context.CandidateForms
                    .Where(cf => cf.HiringRequestId != null && hiringIds.Contains(cf.HiringRequestId.Value))
                    .Select(cf => new { HiringRequestId = cf.HiringRequestId.Value, IntakeStatusId = cf.IntakeStatusId, PartnerId = cf.PartnerId })
                    .ToListAsync();

                var candidateCountsByHiringId = candidateForms
                    .Where(c => c.PartnerId == partnerId)
                    .GroupBy(cf => cf.HiringRequestId)
                    .ToDictionary(
                        g => g.Key,
                        g => new
                        {
                            Total = g.Count(),
                            Rejected = g.Count(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.REJECTED),
                            Dropped = g.Count(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP),
                            Identified = g.Count(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED)
                        });

                foreach (var hiringRequest in dtos)
                {

                    string primarySkillsText = string.Empty;
                    string secondarySkillsText = string.Empty;

                    if (!string.IsNullOrEmpty(hiringRequest.HrqId) && jobDetailsByHrq.TryGetValue(hiringRequest.HrqId, out var jobDetails) && jobDetails != null)
                    {
                        var primaryIds = jobDetails.PrimarySkills ?? new List<int>();
                        var secondaryIds = jobDetails.SecondarySkills ?? new List<int>();

                        primarySkillsText = primaryIds.Any()
                            ? string.Join(", ", primaryIds.Where(id => skillDict.ContainsKey(id)).Select(id => skillDict[id]))
                            : string.Empty;

                        secondarySkillsText = secondaryIds.Any()
                            ? string.Join(", ", secondaryIds.Where(id => skillDict.ContainsKey(id)).Select(id => skillDict[id]))
                            : string.Empty;
                    }

                    DateTime? requestStart = null;
                    DateTime? onholdDate = null;
                    DateTime? closedDate = null;
                    int? financialYear = null;
                    int? hid = null;

                    if (!string.IsNullOrEmpty(hiringRequest.HrqId) && hiringDatesByHrq.TryGetValue(hiringRequest.HrqId, out var dates))
                    {
                        requestStart = dates.RequestStartDate;
                        onholdDate = dates.OnholdDate;
                        closedDate = dates.ClosedDate;
                        financialYear = dates.RequestStartDate.Year;
                    }

                    if (!string.IsNullOrEmpty(hiringRequest.HrqId) && hiringIdByHrq.TryGetValue(hiringRequest.HrqId, out var hidTmp))
                        hid = hidTmp;

                    int totalSubmissions = 0, rejectedCount = 0, droppedCount = 0, identifiedCount = 0;
                    if (hid.HasValue && candidateCountsByHiringId.TryGetValue(hid.Value, out var cnts))
                    {
                        totalSubmissions = cnts.Total;
                        rejectedCount = cnts.Rejected;
                        droppedCount = cnts.Dropped;
                        identifiedCount = cnts.Identified;
                    }

                    hiringRequest.PrimarySkills = primarySkillsText;
                    hiringRequest.SecondarySkills = secondarySkillsText;
                    hiringRequest.RequestStartDate = requestStart;
                    hiringRequest.OnholdDate = onholdDate;
                    hiringRequest.ClosedDate = closedDate;
                    hiringRequest.FinancialYear = financialYear;
                    hiringRequest.TotalSubmission = totalSubmissions;
                    hiringRequest.Rejects = rejectedCount;
                    hiringRequest.Drops = droppedCount;
                    hiringRequest.Identified = identifiedCount;
                }

                return PaginationHelper.GetPagedResult(pageData, dtos);
            }, "Partner mapped Hiring requests fetched successfully.");
        }

        public async Task<byte[]> ExportPartnerHiringRequestsToExcel(PartnerHiringListPageDto pageData, int? partnerId)
        {
            (DateTime financialYearStartDate, DateTime financialYearEndDate)? financialDateRange = null;

            if (pageData.FinancialYear != null && pageData.FinancialYear != 1 && pageData.QuarterId != null)
                financialDateRange = await _helperMethods.GetFinancialQuarterRange(pageData.FinancialYear ?? 0, (FinancialQuarter)(pageData.QuarterId ?? 5));

            var partnerIdParam = new SqlParameter("@PartnerId", partnerId != null ? partnerId.Value : 0);
            var hiringStatusIdsParam = new SqlParameter("@HiringStatusIds", pageData.HiringStatusIds != null && pageData.HiringStatusIds.Any() ? string.Join(",", pageData.HiringStatusIds) : (object)DBNull.Value);
            var financialStartParam = new SqlParameter("@FinancialYearStart", financialDateRange?.financialYearStartDate ?? (object)DBNull.Value);
            var financialEndParam = new SqlParameter("@FinancialYearEnd", financialDateRange?.financialYearEndDate ?? (object)DBNull.Value);

            var result = await _context.PartnerHRQDetails
                .FromSqlRaw("EXEC GetHiringRequestDetails  @PartnerId, @HiringStatusIds, @FinancialYearStart, @FinancialYearEnd",
                            partnerIdParam,
                            hiringStatusIdsParam,
                            financialStartParam,
                            financialEndParam)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<PartnerHrqsGridDto>>(result);

            foreach (var hiringRequest in dtos)
            {
                hiringRequest.CurrentStatusHeadCount =
                    _context.Hiring.Count(h =>
                        (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) &&
                        h.HiringStatusId == hiringRequest.HiringStatusId);
            }

            var hrqIds = dtos.Select(d => d.HrqId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

            var hiringRecords = await _context.Hiring
                .Where(h => hrqIds.Contains(h.HrqId))
                .Select(h => new { h.Id, h.HrqId, h.RequestStartDate, h.OnholdDate, h.ClosedDate })
                .ToListAsync();

            var hiringIdByHrq = hiringRecords.ToDictionary(x => x.HrqId!, x => x.Id);
            var hiringDatesByHrq = hiringRecords.ToDictionary(x => x.HrqId!, x => new { x.RequestStartDate, x.OnholdDate, x.ClosedDate });

            var hiringIds = hiringRecords.Select(x => x.Id).ToList();

            var jobDetailsList = await _context.JobDetails
                .Where(j => j.HiringRequestId != null && hiringIds.Contains(j.HiringRequestId.Value))
                .ToListAsync();

            var jobDetailsByHrq = jobDetailsList
                .GroupJoin(hiringRecords, jd => jd.HiringRequestId, hr => hr.Id, (jd, hrs) => new { jd, hrs })
                .SelectMany(x => x.hrs.Select(hr => new { HrqId = hr.HrqId, JobDetails = x.jd }))
                .ToLookup(x => x.HrqId, x => x.JobDetails)
                .ToDictionary(l => l.Key!, l => l.FirstOrDefault());

            var allSkillIds = jobDetailsList
                .SelectMany(j => (j.PrimarySkills ?? new List<int>()).Concat(j.SecondarySkills ?? new List<int>()))
                .Where(id => id != 0)
                .Distinct()
                .ToList();

            var skillDict = new Dictionary<int, string>();
            if (allSkillIds.Any())
            {
                var skills = await _context.M_Skills.Where(s => allSkillIds.Contains(s.Id)).ToListAsync();
                skillDict = skills.ToDictionary(s => s.Id, s => s.Name ?? string.Empty);
            }

            var candidateForms = await _context.CandidateForms
                .Where(cf => cf.HiringRequestId != null && hiringIds.Contains(cf.HiringRequestId.Value))
                .Select(cf => new { HiringRequestId = cf.HiringRequestId.Value, IntakeStatusId = cf.IntakeStatusId, PartnerId = cf.PartnerId })
                .ToListAsync();

            var candidateCountsByHiringId = candidateForms
                    .Where(c => c.PartnerId == partnerId)
                    .GroupBy(cf => cf.HiringRequestId)
                    .ToDictionary(
                        g => g.Key,
                        g => new
                        {
                            Total = g.Count(),
                            Rejected = g.Count(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.REJECTED),
                            Dropped = g.Count(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP),
                            Identified = g.Count(x => x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED)
                        });

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("PartnerHiringRequests");

            var headers = new[]
            {
        "HRQ ID","Role Hired For","Business Name","RM Owner","Partner Assigned Date",
        "HC Opened","HC Filled","Priority","HRQ Status","Total Submission","Rejects","Drops","Identified","Primary Skills",
        "Secondary Skills","HRQ Open Date","HRQ Hold Date","HRQ Closed Date","Financial Year"
    };

            for (int i = 0; i < headers.Length; i++)
            {
                var headerCell = ws.Cell(1, i + 1);
                headerCell.Value = headers[i];
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Font.FontColor = XLColor.White;
                headerCell.Style.Fill.BackgroundColor = XLColor.DarkGreen;
                headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Column(i + 1).Width = 25;
            }

            int row = 2;
            foreach (var hr in dtos)
            {
                string primarySkillsText = string.Empty;
                string secondarySkillsText = string.Empty;

                if (!string.IsNullOrEmpty(hr.HrqId) && jobDetailsByHrq.TryGetValue(hr.HrqId, out var jobDetails) && jobDetails != null)
                {
                    var primaryIds = jobDetails.PrimarySkills ?? new List<int>();
                    var secondaryIds = jobDetails.SecondarySkills ?? new List<int>();

                    primarySkillsText = primaryIds.Any()
                        ? string.Join(", ", primaryIds.Where(id => skillDict.ContainsKey(id)).Select(id => skillDict[id]))
                        : string.Empty;

                    secondarySkillsText = secondaryIds.Any()
                        ? string.Join(", ", secondaryIds.Where(id => skillDict.ContainsKey(id)).Select(id => skillDict[id]))
                        : string.Empty;
                }

                DateTime? requestStart = null;
                DateTime? onholdDate = null;
                DateTime? closedDate = null;
                int? financialYear = null;
                int? hiringId = null;

                if (!string.IsNullOrEmpty(hr.HrqId) && hiringDatesByHrq.TryGetValue(hr.HrqId, out var dates))
                {
                    requestStart = dates.RequestStartDate;
                    onholdDate = dates.OnholdDate;
                    closedDate = dates.ClosedDate;
                    financialYear = dates.RequestStartDate.Year;
                }

                if (!string.IsNullOrEmpty(hr.HrqId) && hiringIdByHrq.TryGetValue(hr.HrqId, out var hid))
                    hiringId = hid;

                int rejectedCount = 0;
                int droppedCount = 0;
                int identifiedCount = 0;
                int totalSubmissions = 0;

                if (hr.HrqId == "HRQ2054")
                {

                }

                if (hiringId.HasValue && candidateCountsByHiringId.TryGetValue(hiringId.Value, out var cnts))
                {
                    totalSubmissions = cnts.Total;
                    rejectedCount = cnts.Rejected;
                    droppedCount = cnts.Dropped;
                    identifiedCount = cnts.Identified;
                }

                ws.Cell(row, 1).Value = hr.HrqId;
                ws.Cell(row, 2).Value = hr.JobTitle;
                ws.Cell(row, 3).Value = hr.BusinessName;
                ws.Cell(row, 4).Value = hr.RMOwnerName;
                ws.Cell(row, 5).Value = hr.PartnerAssignedDate?.Date;
                ws.Cell(row, 5).Style.DateFormat.Format = "dd-MMM-yyyy";

                ws.Cell(row, 6).Value = hr.NumberOfPositions;
                ws.Cell(row, 7).Value = hr.CurrentStatusHeadCount;

                ws.Cell(row, 8).Value = hr.JobPriorityName;
                ws.Cell(row, 9).Value = hr.HiringStatusName;

                ws.Cell(row, 10).Value = totalSubmissions;
                ws.Cell(row, 11).Value = rejectedCount;
                ws.Cell(row, 12).Value = droppedCount;
                ws.Cell(row, 13).Value = identifiedCount;

                ws.Cell(row, 14).Value = primarySkillsText;
                ws.Cell(row, 15).Value = secondarySkillsText;

                ws.Cell(row, 16).Value = requestStart?.Date;
                ws.Cell(row, 16).Style.DateFormat.Format = "dd-MMM-yyyy";

                ws.Cell(row, 17).Value = onholdDate?.Date;
                ws.Cell(row, 17).Style.DateFormat.Format = "dd-MMM-yyyy";

                ws.Cell(row, 18).Value = closedDate?.Date;
                ws.Cell(row, 18).Style.DateFormat.Format = "dd-MMM-yyyy";

                ws.Cell(row, 19).Value = financialYear;

                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }


        public async Task<ApiResponseDto<string>> UpdateSelectedPartnersForHrqID(int hiringRequestId, int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var partnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == hiringRequestId)) ?? throw new Exception($"Partner Category is not with HiringRequestId : {hiringRequestId}");

                if (partnerCategory.SelectedPartners!.Count > 0)
                {
                    var hiringPartnerId = partnerCategory.SelectedPartners!.FirstOrDefault(x => x.PartnerId == partnerId)?.Id;
                    if (hiringPartnerId == null)
                        throw new Exception($"Partner is not added to Hiring request {partnerCategory.HiringRequestId}");
                    try
                    {
                        var partner = await _partnerRepository.GetAsync(partnerId);
                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                        var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == partnerCategory.HiringRequestId));

                        var jobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));
                        string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;
                        if (jobDetails != null)
                        {
                            var city = jobDetails != null ? await _cityRepository.GetAsync(query => query.Where(x => jobDetails.PrimaryCityIds.Contains(x.Id))) : null;

                            if (toEmail == null)
                            {
                                toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                            }

                            var ccEmail = approver.Email;


                            var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "Partner.");

                            var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(approver, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "HiringManager.");

                            var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);


                            var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "HiringRequest.");

                            var hiringPartdictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);


                            var locationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(city, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "Location.");

                            var dictionary = Utility.Utility.Merge(locationDict, hiringPartdictionary);

                            var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                            dictionary.Add("ProfileLink", link);

                            await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerHiringAssociationStatusUpdateNotification, toEmail,
                              dictionary, ccEmail);

                        }
                    }
                    catch (Exception ex)
                    { }

                    await _hiringReqPartnerRepository.DeleteAsync(hiringPartnerId);
                }

                //var templateDetails = await _emailTemplateService.GetTemplateByName(PartnerEmailTemplateEnums.PartnerHiringAssociationStatusUpdateNotification.ToString());

                //var toEmail = "";
                //await _communicationService.AddNotification(templateDetails.Data.NotificationId, toEmail,
                //    Utility.Utility.FlattenJsonToDictionary(JsonConvert.SerializeObject(partnerCategory)));


            }, "Partner removed form HiringRequest successfully.");
        }

        public async Task<ApiResponseDto<string>> OnHoldHiringRequest(int hiringRequestId, AddOnholdHiringRequestDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                if (dto.OnholdCategoryId != (int)OnHoldHiringCategory.Full && dto.OnholdCategoryId != (int)OnHoldHiringCategory.Partial)
                    throw new Exception("Please select OnholdCategory.");

                var entity = await _hiringRequestRepository.GetAsync(hiringRequestId) ?? throw new Exception($"HiringRequest is not found with Id : {hiringRequestId}");

                if (entity.HiringStatusId == (int)HIRING_STATUS.ON_HOLD)
                    throw new Exception($"This Hiring Request is already moved to \"OnHold\".");

                if (await _onHoldHiringRequestRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequestId && x.ReviewStatusId == (int)REVIEW_STATUS.PENDING)) != null)
                    throw new Exception($"The current hiring request is already sent for onhold approval.");

                if (entity.HiringStatusId != (int)HIRING_STATUS.WIP && entity.HiringStatusId != (int)HIRING_STATUS.CANDIDATE_IDENTIFIED)
                    throw new Exception($"A Hiring Request cannot be moved to \"OnHold\" unless its current status is either \"WIP\" or \"Candidate-Identified\".");

                if (dto.OnholdCategoryId == (int)OnHoldHiringCategory.Partial)
                {
                    var childHirings = await _hiringRequestRepository.GetListAsync(query => query.Where(x => x.ParentHrqId == entity.HrqId && (x.HiringStatusId == (int)HIRING_STATUS.WIP || x.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED)).OrderBy(x => x.Id));

                    var nextParentHiringRequest = childHirings.FirstOrDefault() ?? throw new Exception("No child hiring requests available to assign as next parent.");
                }

                var onHoldEntity = new OnholdHiringRequest
                {
                    HiringRequestId = hiringRequestId,
                    OnholdCategoryId = dto.OnholdCategoryId,
                    OnholdRequestedDate = dto.OnholdRequestedDate ?? DateTime.UtcNow,
                    OnholdRequestedByRoleId = dto.OnholdRequestedByRoleId,
                    OnholdRaisedByUserId = dto.OnholdRaisedByUserId,
                    OnholdReasonId = dto.OnholdReasonId,
                    OnholdComments = dto.OnholdComments,
                    ReviewStatusId = (int)REVIEW_STATUS.PENDING,
                    FreezeCandidateTypes = dto.FreezeCandidateTypes
                };

                await _onHoldHiringRequestRepository.AddAsync(onHoldEntity);

                var hiringRequest = await _hiringRequestRepository.GetAsync(dto.HiringRequestId);

                hiringRequest.OnHoldReviewStatusId = (int)REVIEW_STATUS.PENDING;
                hiringRequest.OnholdRaisedBy = dto.OnholdRaisedByUserId;
                hiringRequest.OnholdRequestedBy = dto.OnholdRequestedByRoleId;
                hiringRequest.OnholdReasonId = dto.OnholdReasonId;
                hiringRequest.OnholdRequestedDate = dto.OnholdRequestedDate;

                await _hiringRequestRepository.UpdateAsync(hiringRequest);

            }, "Onhold approval sent successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<OnholdHiringGridViewDto>>> GetOnHoldHiringRequestApprovals(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var result = await _onHoldHiringRequestRepository.GetPaginatedListWithJoinQueryAsync<OnholdHiringGridViewDto>(pageData,
                       query => from onholdRequest in query

                                join hiringRequest in _context.Hiring on onholdRequest.HiringRequestId equals hiringRequest.Id

                                join status in _context.M_MasterData on hiringRequest.HiringStatusId equals status.Id into statuses
                                from status in statuses.DefaultIfEmpty()

                                where loggedInUserDetails.RoleId == (int)ROLES.ADMIN

                                orderby (onholdRequest.UpdatedAt ?? onholdRequest.CreatedAt ?? DateTime.MinValue) descending

                                select new OnholdHiringGridViewDto
                                {
                                    OnholdRequestId = onholdRequest.Id,
                                    HiringRequestId = hiringRequest.Id,
                                    HrqId = hiringRequest.HrqId,
                                    RoleHiredFor = hiringRequest.JobTitle,
                                    ParentHrqId = hiringRequest.ParentHrqId,
                                    HiringStatusName = status.Name,
                                    OnholdCategoryName = onholdRequest.OnholdCategory.Name,
                                    OnholdRequestedDate = onholdRequest.OnholdRequestedDate,
                                    OnholdRequestedByRoleName = onholdRequest.OnholdRequestedByRole.RoleName,
                                    OnholdRaisedByUserName = onholdRequest.OnholdRaisedByUser.FullName,
                                    OnholdReasonName = onholdRequest.OnholdReason.Name,
                                    OnholdComments = onholdRequest.OnholdComments,
                                    ReviewStatusName = onholdRequest.ReviewStatus.Name,
                                    ReviewedDate = onholdRequest.ReviewedDate,
                                    ReviewComments = onholdRequest.ReviewedComments,
                                    ReviewedByName = onholdRequest.OnHoldReviewedByUser.FullName,
                                });

                return result;

            }, "OnHold requests fetched successfully.");
        }


        public async Task<ApiResponseDto<string>> ApproveOnHoldHiringRequests(int hiringRequestId, int? reviewStatusId, int? OnholdRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();

                List<HiringRequest>? hiringList = [];
                List<Candidate>? candidateList = [];
                List<CandidateHistory> candidateHistoriesToFreezeList = [];


                var onHoldEntity = await _onHoldHiringRequestRepository.GetAsync(query => query.Where(x => x.Id == OnholdRequestId)) ?? throw new Exception($"Onhold request is not found with HiringRequestId : {hiringRequestId}");

                if (onHoldEntity != null)
                {
                    onHoldEntity.ReviewStatusId = reviewStatusId;
                    onHoldEntity.ReviewedDate = DateTime.UtcNow;
                    onHoldEntity.OnHoldReviewedByUserId = loggedInUser.UserId;

                    if (reviewStatusId == (int)REVIEW_STATUS.APPROVED)
                    {
                        if (onHoldEntity.OnholdCategoryId != (int)OnHoldHiringCategory.Full && onHoldEntity.OnholdCategoryId != (int)OnHoldHiringCategory.Partial)
                            throw new Exception("Please select Onhold Category.");

                        var entity = await _hiringRequestRepository.GetAsync(hiringRequestId) ?? throw new Exception($"HiringRequest is not found with Id : {hiringRequestId}");

                        if (entity.HiringStatusId != (int)HIRING_STATUS.WIP && entity.HiringStatusId != (int)HIRING_STATUS.CANDIDATE_IDENTIFIED)
                            throw new Exception($"A Hiring Request cannot be moved to \"OnHold\" unless its current status is either \"WIP\" or \"Candidate-Identified\".");

                        entity.PreviousHiringStatusId = entity.HiringStatusId;
                        entity.HiringStatusId = (int)HIRING_STATUS.ON_HOLD;
                        entity.OnholdRequestedBy = onHoldEntity.OnholdRequestedByRoleId;
                        entity.OnholdRaisedBy = onHoldEntity.OnholdRaisedByUserId;
                        entity.OnholdRequestedDate = onHoldEntity.OnholdRequestedDate;
                        entity.OnholdReasonId = onHoldEntity.OnholdReasonId;
                        entity.OnholdComments = onHoldEntity.OnholdComments;
                        entity.FreezeCandidateTypes = onHoldEntity.FreezeCandidateTypes;

                        entity.OnholdReviewedByUserId = onHoldEntity.OnHoldReviewedByUserId;
                        entity.OnHoldReviewStatusId = (int)REVIEW_STATUS.APPROVED;
                        entity.OnholdDate = onHoldEntity.ReviewedDate;
                        entity.NumberOfPositions = onHoldEntity.OnholdCategoryId == (int)OnHoldHiringCategory.Partial ? 1 : entity.NumberOfPositions;

                        hiringList.Add(entity);

                        var childHirings = await _hiringRequestRepository.GetListAsync(query => query.Where(x => x.ParentHrqId == entity.HrqId && (x.HiringStatusId == (int)HIRING_STATUS.WIP || x.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED)).OrderBy(x => x.Id));

                        if (onHoldEntity.OnholdCategoryId == (int)OnHoldHiringCategory.Full)
                        {
                            foreach (var child in childHirings)
                            {
                                child.PreviousHiringStatusId = child.HiringStatusId;
                                child.HiringStatusId = (int)HIRING_STATUS.ON_HOLD;

                                child.OnholdRequestedBy = onHoldEntity.OnholdRequestedByRoleId;
                                child.OnholdRaisedBy = onHoldEntity.OnholdRaisedByUserId;
                                child.OnholdRequestedDate = onHoldEntity.OnholdRequestedDate;
                                child.OnholdReasonId = onHoldEntity.OnholdReasonId;
                                child.OnholdComments = onHoldEntity.OnholdComments;
                                child.FreezeCandidateTypes = onHoldEntity.FreezeCandidateTypes;

                                child.OnholdReviewedByUserId = onHoldEntity.OnHoldReviewedByUserId;
                                child.OnHoldReviewStatusId = (int)REVIEW_STATUS.APPROVED;
                                child.OnholdDate = onHoldEntity.ReviewedDate;

                                hiringList.Add(child);
                            }

                            foreach (var hiringRequest in hiringList)
                            {
                                var candidatesToFreeze = await _candidateRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));

                                foreach (var candidate in candidatesToFreeze)
                                {
                                    candidate.PreviousIntakeStatusId = candidate.IntakeStatusId;
                                    candidate.CandidateFreezedOn = DateTime.UtcNow;
                                    candidate.IsFreezed = true;
                                    candidate.CandidateFreezedReason = $"Current Hiring request ({hiringRequest.HrqId} is put on-hold)";
                                    candidateList.Add(candidate);

                                    var candidateHistory = await _candidateHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id
                                                                                             && x.PartnerId == candidate.PartnerId
                                                                                             && x.HiringRequestId == candidate.HiringRequestId));
                                    if (candidateHistory != null)
                                    {
                                        candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                                        candidateHistory.IsFreezed = candidate.IsFreezed;
                                        candidateHistory.CandidateFreezedReason = candidate.CandidateFreezedReason;
                                        candidateHistoriesToFreezeList.Add(candidateHistory);
                                    }
                                }
                            }
                        }
                        else if (onHoldEntity.OnholdCategoryId == (int)OnHoldHiringCategory.Partial)
                        {
                            var nextParentHiringRequest = childHirings.FirstOrDefault() ?? throw new Exception("No child hiring requests available to assign as next parent.");

                            nextParentHiringRequest.IsParentHRQ = true;
                            nextParentHiringRequest.ParentHrqId = null;
                            nextParentHiringRequest.PreviousParentHrqId = entity.HrqId;
                            nextParentHiringRequest.NumberOfPositions = childHirings != null ? childHirings.Count() : 0;

                            hiringList.Add(nextParentHiringRequest);

                            if (childHirings?.Count() > 0)
                                foreach (var child in childHirings.Where(x => x.Id != nextParentHiringRequest.Id))
                                {
                                    child.ParentHrqId = nextParentHiringRequest.HrqId;
                                    child.IsParentHRQ = false;
                                    hiringList.Add(child);
                                }

                            var statuses = new List<int>();

                            if (onHoldEntity.FreezeCandidateTypes?.Contains((int)FreezeCandidateType.TalentPool) == true)
                                statuses.Add((int)CANDIDATE_INTAKE_STATUS.SCREENING);

                            if (onHoldEntity.FreezeCandidateTypes?.Contains((int)FreezeCandidateType.CandidateIdentified) == true)
                                statuses.Add((int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED);

                            var candidatesToFreeze = await _candidateRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == entity.Id
                                                                                                                && (x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING ||
                                                                                                                    x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.REJECTED)
                            ));

                            foreach (var candidate in candidatesToFreeze)
                            {
                                candidate.PreviousIntakeStatusId = candidate.IntakeStatusId;
                                candidate.IsFreezed = true;
                                candidate.CandidateFreezedReason = $"Current Hiring request ({entity.HrqId} is put on-hold)";
                                candidateList.Add(candidate);

                                var candidateHistory = await _candidateHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id
                                                                                             && x.PartnerId == candidate.PartnerId
                                                                                             && x.HiringRequestId == candidate.HiringRequestId));

                                candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                                candidateHistory.IsFreezed = candidate.IsFreezed;
                                candidateHistory.CandidateFreezedReason = candidate.CandidateFreezedReason;
                                candidateHistoriesToFreezeList.Add(candidateHistory);
                            }

                            var transferCnadidates = await _candidateRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == entity.Id
                                                                                                                && (statuses != null && statuses.Contains(x.IntakeStatusId ?? 0))
                                                                                                                ));

                            foreach (var candidate in transferCnadidates)
                            {
                                candidate.HiringRequestId = nextParentHiringRequest.Id;
                                candidate.OriginalHiringRequestId = entity.Id;
                                candidate.IsTransferred = true;
                                candidateList.Add(candidate);
                            }
                        }

                        if (hiringList.Count > 0)
                            await _hiringRequestRepository.UpdateListAsync(hiringList);

                        if (candidateList.Count > 0)
                            await _candidateRepository.UpdateListAsync(candidateList);

                        if (candidateHistoriesToFreezeList.Count > 0)
                            await _candidateHistoryRepository.UpdateListAsync(candidateHistoriesToFreezeList);

                        var partnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequestId));

                        if (partnerCategory != null)
                        {
                            var selectedPartners = await _hiringReqPartnerRepository.GetListAsync(query => query.Where(x => x.PartnerCategoryId == partnerCategory.Id));

                            var prtnerList = selectedPartners?.Select(partner => partner.PartnerId).ToList();

                            if (prtnerList != null)
                            {
                                foreach (var partner in prtnerList)
                                {
                                    try
                                    {
                                        var prtner = await _partnerRepository.GetAsync(partner);
                                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));
                                        var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId));
                                        var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                                        string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                                        if (toEmail == null)
                                        {
                                            toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                                        }

                                        var ccEmail = hiringManager.Email;

                                        var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(prtner, new JsonSerializerSettings
                                        {
                                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                            Formatting = Formatting.Indented,

                                        }), "Partner.");

                                        var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManager, new JsonSerializerSettings
                                        {
                                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                            Formatting = Formatting.Indented,
                                            ContractResolver = new DefaultContractResolver
                                            {
                                                NamingStrategy = new InitCapNamingStrategy()
                                            }
                                        }), "HiringManager.");

                                        var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);

                                        var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                                        {
                                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                            Formatting = Formatting.Indented,
                                            ContractResolver = new DefaultContractResolver
                                            {
                                                NamingStrategy = new InitCapNamingStrategy()
                                            }
                                        }), "HiringRequest.");

                                        var dictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);

                                        var link = _configuration["ClientHostName"] + "/home/hiring-details?hrqid=" + hiringRequest.HrqId;
                                        dictionary.Add("ProfileLink", link);


                                        await _communicationService.AddNotification((int)HiringEmailTemplateEnums.HiringRequestOnHoldNotification, toEmail,
                                           dictionary, ccEmail);

                                    }
                                    catch (Exception ex)
                                    { }
                                }
                            }
                        }
                    }
                    else if (reviewStatusId == (int)REVIEW_STATUS.REJECTED)
                    {
                        onHoldEntity.ReviewedComments = onHoldEntity.ReviewedComments;
                        var hiringRequest = await _hiringRequestRepository.GetAsync(hiringRequestId);

                        hiringRequest.OnHoldReviewStatusId = (int)REVIEW_STATUS.REJECTED;
                        hiringRequest.OnholdRaisedBy = null;
                        hiringRequest.OnholdRequestedBy = null;
                        hiringRequest.OnholdReasonId = null;
                        hiringRequest.OnholdRequestedDate = null;

                        await _hiringRequestRepository.UpdateAsync(hiringRequest);
                    }

                    await _onHoldHiringRequestRepository.UpdateAsync(onHoldEntity);
                }



            }, "Hiring request moved to onhold successfully.");
        }

        public async Task<ApiResponseDto<string>> ResumeHiringRequest(int hiringRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _hiringRequestRepository.GetAsync(hiringRequestId) ?? throw new Exception($"HiringRequest is not found with Id : {hiringRequestId}");

                entity.HiringStatusId = (int)HIRING_STATUS.WIP;

                await _hiringRequestRepository.UpdateAsync(entity);

                //if (entity.PartnerCategory.SelectedPartners != null && entity.PartnerCategory.SelectedPartners.Count() > 0)
                //{
                //    foreach (var partner in entity.PartnerCategory.SelectedPartners)
                //    {
                //        //  var templateDetails = await _emailTemplateService.GetTemplateByName(HiringEmailTemplateEnums.HiringRequestStatusUpdateNotification.ToString());

                //        //var toEmail = "";
                //        //await _communicationService.AddNotification(templateDetails.Data.NotificationId, toEmail,
                //        //    Utility.Utility.FlattenJsonToDictionary(JsonConvert.SerializeObject(entity)));
                //    }
                //}

            }, "Hiring request moved to WIP successfully.");
        }

        public async Task<ApiResponseDto<ViewHiringRequestDto>> GetHiringRequestViewDetails(string hrqId)
        {
            return await ExecuteAsync(async () =>
            {
                var currentloggedInUserDetails = _helperMethods.GetUserDetails();

                ViewHiringRequestDto viewHiringRequestDto = new ViewHiringRequestDto();

                // Fetch Hiring Request view details
                var hiringResult = await _hiringRequestRepository.GetAsync(query => query
                                                                             .Include(x => x.RecordType)
                                                                             .Include(x => x.HiringManager)
                                                                             .Include(x => x.RequestApprover)
                                                                             .Include(x => x.OnholdRequestedByRole)
                                                                             .Include(x => x.OnholdRaisedByUser)
                                                                             .Include(x => x.OnholdReason)
                                                                             .Include(x => x.OnholdReviewedByUser)
                                                                             .Include(x => x.OnHoldReviewStatus)
                                                                             .Include(x => x.Domain).ThenInclude(x => x!.DomainManager)
                                                                             .Include(x => x.HiringType)
                                                                             .Include(x => x.HiringStatus)
                                                                             .Include(x => x.ApprovalStatus)
                                                                             .Include(x => x.RMOwner)
                                                                             .Include(x => x.Requestor)
                                                                             .Include(x => x.Business)
                                                                             .Include(x => x.BETApprover)
                                                                             .Include(x => x.PartnerCategory).ThenInclude(x => x.SelectedPartners)
                                                                             .Where(x => x.HrqId == hrqId));

                viewHiringRequestDto.ViewHiringDetails = _mapper.Map<ViewHiringDetailsDto>(hiringResult, opt =>
                {
                    opt.Items["PartnerId"] = currentloggedInUserDetails.PartnerId;
                });

                if (currentloggedInUserDetails.RoleId != null && currentloggedInUserDetails.RoleId == (int)ROLES.PARTNER)
                {
                    viewHiringRequestDto.ViewHiringDetails.ProjectName = null;
                    viewHiringRequestDto.ViewHiringDetails.HiringTypeName = null;
                    viewHiringRequestDto.ViewHiringDetails.RequestStartDate = null;
                }

                var jobDetailsResult = await _jobDetailsRepository.GetItemWithJoinAsync(
                     query => from jobDetail in query

                              join activity in _context.M_MasterData on jobDetail.HiringActivityId equals activity.Id into activities
                              from activity in activities.DefaultIfEmpty()

                              join priority in _context.M_MasterData on jobDetail.JobPriorityId equals priority.Id into priorities
                              from priority in priorities.DefaultIfEmpty()

                              join subDomain in _context.M_SubDomains on jobDetail.SubDomainId equals subDomain.Id into subDomains
                              from subDomain in subDomains.DefaultIfEmpty()

                              join subManager in _context.Users on subDomain.SubDomainManagerId equals subManager.UserId into subManagers
                              from subManager in subManagers.DefaultIfEmpty()


                              where jobDetail.HiringRequestId == hiringResult.Id

                              select new ViewJobDetailsDto
                              {
                                  JobDescription = jobDetail.JobDescription,
                                  HiringActivityName = activity.Name,
                                  JobPriorityName = priority.Name,
                                  SubDomainName = subDomain.Name,
                                  SubDomainManagerName = subManager.FullName ?? string.Empty,
                                  //PrimarySkillsNames = jobDetail.PrimarySkills,
                                  //SecondarySkillsNames = jobDetail.SecondarySkillsNames,
                                  MandatoryCertification = jobDetail.MandatoryCertification,
                                  JobLevelName = jobDetail.JobLevel.Name,
                                  RelevantExperience = jobDetail.RelevantExperience,
                                  TotalExperience = jobDetail.TotalExperience,
                                  Country = jobDetail.Country != null ? jobDetail.Country.Name : string.Empty,
                                  States = string.Join(", ", _context.M_States.Where(st => jobDetail.StateIds.Contains(st.Id)).Select(ud => ud.Name)),
                                  JobLocations = string.Join(", ", _context.M_Cities.Where(st => jobDetail.PrimaryCityIds.Contains(st.Id)).Select(ud => ud.Name)),
                                  SecondaryCitys = string.Join(", ", _context.M_Cities.Where(st => jobDetail.SecondaryCityIds.Contains(st.Id)).Select(ud => ud.Name)),
                              });


                if (jobDetailsResult != null)
                    viewHiringRequestDto.ViewJobDetails = _mapper.Map<ViewJobDetailsDto>(jobDetailsResult);
                //                     viewHiringRequestDto.ViewJobDetails = jobDetailsResult;


                var interviewRounds = await _interviewRoundRepository.GetListAsync(query => query
                                                                                    .Include(x => x.RoundName)
                                                                                    .Include(x => x.FeedbackCritriaOptions!)
                                                                                        .ThenInclude(x => x.CriteriaOption)
                                                                                    .Include(x => x.InterviewMode!)
                                                                                    .Where(x => x.HiringRequestId == hiringResult.Id));
                var allUsers = await _userRepository.GetListAsync("User");
                var allCandidates = await _candidateRepository.GetListAsync();

                if (interviewRounds.Any())
                {
                    var interviewRoundsResult = await Task.WhenAll(interviewRounds.Select(x => Task.FromResult(new ViewInterviewRoundsDto
                    {
                        //HiringRequestId = x.HiringRequestId,
                        RoundNumber = x.RoundNumber,
                        RoundNameName = x.RoundName?.Name,
                        //Panel = x.Panel,
                        PanelNames = x.Panel != null ? string.Join(", ", allUsers.Where(u => x.Panel.Contains(u.UserId)).Select(u => u.FullName)) : string.Empty,
                        ModeOfInterviewName = x.InterviewMode?.Name,
                        Comments = x.Comments,
                        //IsAddSpecificCandidates = x.IsAddSpecificCandidates,
                        //Candidates = x.Candidates,
                        //CandidateNames = string.Join(", ", allCandidates.Where(c => x.Candidates!.Contains(c.Id)).Select(c => c.FullName)),
                        AddFeedbackCritria = x.AddFeedbackCritria,
                        //CategoryId = x.CategoryId,
                        //SkipScreening = x.SkipScreening,
                        //ScreeningCap = x.ScreeningCap,
                        //AvailableDays = x.AvailableDays,
                        FeedbackCritriaOptions = x.FeedbackCritriaOptions?.Select(f => new FeedbackCritriaOptionsDto
                        {
                            CriteriaOptionId = f.CriteriaOptionId,
                            Name = f.CriteriaOption?.Name
                        }).ToList()
                    })));

                    viewHiringRequestDto.ViewInterviewRounds = interviewRoundsResult.ToList();
                }

                var calibrationDetailsResult = await _calibrationRepository.GetListAsync(query => query.Include(x => x.Documents)
                                                                                                .Where(x => x.HiringRequestId == hiringResult.Id));

                if (calibrationDetailsResult != null)
                    viewHiringRequestDto.ViewCalibrationDetails = _mapper.Map<List<ViewCalibrationDetailsDto>>(calibrationDetailsResult);


                return viewHiringRequestDto;

            }, "Hiring request view details fetched successfully.");
        }

        public async Task<byte[]> ExportAllHiringRequestsToExcel(PageDto pageData, bool? isBin, bool? isAssigned, List<int> hiringStatusId, int? durationId, bool? isParent, int? financialYearStart, int? quarterId, int? userId = null)
        {
            var range = _helperMethods.GetDateRangeByDurationId(durationId ?? (int)DurationRange.All);

            (DateTime financialYearStartDate, DateTime financialYearEndDate)? financialDateRange = null;

            if (financialYearStart != null && financialYearStart != 1 && quarterId != null)
            {
                financialDateRange = await _helperMethods.GetFinancialQuarterRange(
                    financialYearStart.Value,
                    (FinancialQuarter)quarterId.Value
                );
            }

            // Fetch hiring requests without pagination
            var hiringRequests = await _hiringRequestRepository.GetListWithJoinAsync<GetHiringRequestExportDto>(query => from hiringRequest in query

                                                                                                                         join business in _context.M_MasterData on hiringRequest.BusinessId equals business.Id into businesses
                                                                                                                         from business in businesses.DefaultIfEmpty()

                                                                                                                         join requestor in _context.Users on hiringRequest.RequestorId equals requestor.UserId into requestors
                                                                                                                         from requestor in requestors.DefaultIfEmpty()

                                                                                                                         join domain in _context.M_Domains on hiringRequest.DomainId equals domain.Id into domains
                                                                                                                         from domain in domains.DefaultIfEmpty()

                                                                                                                         join rmOwner in _context.Users on hiringRequest.RmOwnerId equals rmOwner.UserId into rmOwners
                                                                                                                         from rmOwner in rmOwners.DefaultIfEmpty()

                                                                                                                         join status in _context.M_MasterData on hiringRequest.HiringStatusId equals status.Id into statuses
                                                                                                                         from status in statuses.DefaultIfEmpty()

                                                                                                                         where (isBin == true ? (hiringRequest.ApprovalStatusId == null) :
                                                                                                                                 (
                                                                                                                                     (isParent == true ? hiringRequest.IsParentHRQ == true : true) &&
                                                                                                                                     (!hiringStatusId.Any() || hiringStatusId.Contains(hiringRequest.HiringStatusId ?? 0)) &&
                                                                                                                                     (
                                                                                                                                         ((isAssigned == false || isAssigned == null) && (hiringRequest.IsRMOwnerAccepted == null || hiringRequest.IsRMOwnerAccepted == false) && (hiringRequest.ApprovalStatusId != null)) ||
                                                                                                                                         (isAssigned == true && hiringRequest.IsRMOwnerAccepted == true)
                                                                                                                                     )
                                                                                                                                  )
                                                                                                                          ) &&
                                                                                                                         (range == null || (hiringRequest.UpdatedAt ?? hiringRequest.CreatedAt ?? DateTime.UtcNow).Date >= range.Value.StartDate.Date && (hiringRequest.UpdatedAt ?? hiringRequest.CreatedAt ?? DateTime.UtcNow).Date <= range.Value.EndDate.Value.Date)

                     // Financial Year filter
                     && (financialDateRange == null ||
                        (hiringRequest.RequestStartDate.Date >= financialDateRange.Value.financialYearStartDate.Date &&
                         hiringRequest.RequestStartDate.Date <= financialDateRange.Value.financialYearEndDate.Date))

                     // Duration filter
                     && (range == null ||
                        (hiringRequest.RequestStartDate.Date >= range.Value.StartDate.Date &&
                         hiringRequest.RequestStartDate.Date <= range.Value.EndDate.Value.Date))

                                                                                                                         orderby (hiringRequest.UpdatedAt ?? hiringRequest.CreatedAt ?? DateTime.MinValue) descending,
                                                                                                                                 hiringRequest.Id descending

                                                                                                                         select new GetHiringRequestExportDto
                                                                                                                         {
                                                                                                                             HrqId = hiringRequest.HrqId,
                                                                                                                             BusinessName = business.Name,
                                                                                                                             RCMSProjectId = hiringRequest.RCMSProjectId,
                                                                                                                             ParentHrqId = hiringRequest.ParentHrqId,
                                                                                                                             ProjectName = hiringRequest.ProjectName,
                                                                                                                             JobTitle = hiringRequest.JobTitle,
                                                                                                                             RequestStartDate = hiringRequest.RequestStartDate,
                                                                                                                             HiringCreatedAt = hiringRequest.CreatedAt,
                                                                                                                             RequestClosedDate = hiringRequest.ClosedDate,
                                                                                                                             HiringStatusName = status.Name,
                                                                                                                             RMOwnerName = rmOwner.FullName,
                                                                                                                             TotalHeadCount = hiringRequest.NumberOfPositions == 0 ? 1 : hiringRequest.NumberOfPositions,
                                                                                                                             TAT = _applicationUtilities.CalculateTatDays(
                                                                                                                                isBin == true
                                                                                                                                    ? (hiringRequest.CreatedAt ?? hiringRequest.UpdatedAt ?? DateTime.UtcNow)
                                                                                                                                    : hiringRequest.RequestStartDate,
                                                                                                                                hiringRequest.HiringStatusId == (int)HIRING_STATUS.ON_HOLD
                                                                                                                                    ? (hiringRequest.OnholdDate ?? DateTime.UtcNow)
                                                                                                                                : hiringRequest.HiringStatusId == (int)HIRING_STATUS.CLOSED
                                                                                                                                    ? (hiringRequest.ClosedDate ?? DateTime.UtcNow)
                                                                                                                                : hiringRequest.HiringStatusId == (int)HIRING_STATUS.CANCELLED
                                                                                                                                    ? (hiringRequest.CancelledDate ?? DateTime.UtcNow)
                                                                                                                                : (DateTime?)null
                                                                                                                            ),

                                                                                                                             CurrentStatusHeadCount = hiringRequest.HiringStatusId == (int)HIRING_STATUS.WIP
                                                                                                                                                     ? _context.Hiring.Count(h =>
                                                                                                                                                         (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) &&
                                                                                                                                                         h.HiringStatusId == (int)HIRING_STATUS.WIP)
                                                                                                                                                 : hiringRequest.HiringStatusId == (int)HIRING_STATUS.CLOSED
                                                                                                                                                     ? _context.Hiring.Count(h =>
                                                                                                                                                         (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) &&
                                                                                                                                                         h.HiringStatusId == (int)HIRING_STATUS.CLOSED)
                                                                                                                                                 : hiringRequest.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED
                                                                                                                                                     ? _context.Hiring.Count(h =>
                                                                                                                                                         (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) &&
                                                                                                                                                         h.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED)
                                                                                                                                                 : hiringRequest.HiringStatusId == (int)HIRING_STATUS.ON_HOLD
                                                                                                                                                     ? _context.Hiring.Count(h =>
                                                                                                                                                         (h.ParentHrqId == hiringRequest.HrqId || h.HrqId == hiringRequest.HrqId) &&
                                                                                                                                                         h.HiringStatusId == (int)HIRING_STATUS.ON_HOLD)
                                                                                                                                                 : 0,

                                                                                                                         });

            hiringRequests = PaginationHelper.GetSortedResult(hiringRequests, pageData.SortColumns);

            using var workbook = new XLWorkbook();

            var ws = workbook.Worksheets.Add("HiringRequests");

            // Add headers
            var headers = new[] { "HRQID", "Business","RCMS ID", "Parent HRQID","Project","Role Hired For", "Request Start Date",
                                   "Request Created Date","Hiring Status","RM Owner","Request Closed Date ","TAT","Current HeadCount","Total Head Count"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var headerCell = ws.Cell(1, i + 1);
                headerCell.Value = headers[i];
                ws.Column(i + 1).Width = 25;

                // Styling
                headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Font.FontColor = XLColor.White;
                headerCell.Style.Fill.BackgroundColor = XLColor.Green;
            }

            // Fill data
            int row = 2;
            foreach (var hr in hiringRequests)
            {
                ws.Cell(row, 1).Value = hr.HrqId;
                ws.Cell(row, 2).Value = hr.BusinessName;
                ws.Cell(row, 3).Value = hr.RCMSProjectId;
                ws.Cell(row, 4).Value = hr.ParentHrqId;
                ws.Cell(row, 5).Value = hr.ProjectName;
                ws.Cell(row, 6).Value = hr.JobTitle;
                ws.Cell(row, 7).Value = hr.RequestStartDate?.Date;
                ws.Cell(row, 7).Style.DateFormat.Format = "dd-MMM-yyyy";
                ws.Cell(row, 8).Value = hr.HiringCreatedAt?.Date;
                ws.Cell(row, 8).Style.DateFormat.Format = "dd-MMM-yyyy";
                ws.Cell(row, 9).Value = hr.HiringStatusName;
                ws.Cell(row, 10).Value = hr.RMOwnerName;
                ws.Cell(row, 11).Value = hr.RequestClosedDate?.Date;
                ws.Cell(row, 11).Style.DateFormat.Format = "dd-MMM-yyyy";
                ws.Cell(row, 12).Value = hr.TAT;
                ws.Cell(row, 13).Value = hr.CurrentStatusHeadCount;
                ws.Cell(row, 14).Value = hr.TotalHeadCount;
                row++;
            }

            // Save to memory stream
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }


    }
}
