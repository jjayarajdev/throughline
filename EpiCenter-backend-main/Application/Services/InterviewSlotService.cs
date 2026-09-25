using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.InterviewSlot;
using EpicenterX.Application.DTOs.Panel;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class InterviewSlotService(AppDBContext _context,
                                      ICommuncationService _communicationService,
                                      IGenericRepository<Partner> _partnerRepository,
                                      IGenericRepository<Candidate> _candidateFormRepository,
                                      IGenericRepository<CandidateHistory> _candidateFormHistoryRepository,
                                      IGenericRepository<InterviewSlot> _slotAllocationRepository,
                                      IGenericRepository<CandidateInterviewFeedBack> _feedbackRepository,
                                      ICandidateHelperMethods _candidateHelperMethods,
                                      IConfiguration _configuration,
                                      IGenericRepository<HiringRequest> _hiringRequestRepository,
                                      IHelperMethods _helperMethods,
                                      IGenericRepository<Users> _userRepostory,
                                      IGenericRepository<ContactMatrix> _contactMatrixRepository,
                                      IGenericRepository<InterviewActionLog> _interviewActionRepository,
                                      IApplicationUtilities _applicationUtilities,
                                      IGenericRepository<InterviewSlotAllocationHistory> _interviewSlotHistoryRepository,
                                      IGenericRepository<CandidateReconsiderationHistory> _candidateReconsiderationHistoryRepository,
                                      IMapper _mapper) : BaseService, IInterviewSlotService
    {
        #region Candidate Interview Allocation

        public async Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetInterviewScreeningList(InterviewSlotScreeningPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();

                var candidatesWithScreeningRounds = await (
                    from candidate in _context.CandidateForms
                    join hiring in _context.Hiring on candidate.HiringRequestId equals hiring.Id
                    join round in _context.InterviewRounds on candidate.HiringRequestId equals round.HiringRequestId
                    join domain in _context.M_Domains on hiring.DomainId equals domain.Id
                    where candidate.IsFreezed != true
                          && candidate.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP
                          && candidate.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.REJECTED
                          && candidate.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.ONHOLD
                          && (hiring.HiringStatusId == (int)HIRING_STATUS.WIP || hiring.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED || hiring.HiringStatusId == (int)HIRING_STATUS.OFFER_ACCEPTED)
                          && (loggedInUser.RoleId != (int)ROLES.DomainManager || domain.DomainManagerId == loggedInUser.UserId || round.Panel!.Contains(loggedInUser.UserId ?? 0))
                          && (loggedInUser.RoleId != (int)ROLES.HIRINGMANAGER || hiring.HiringMangerId == loggedInUser.UserId || round.Panel!.Contains(loggedInUser.UserId ?? 0))
                          && (loggedInUser.RoleId != (int)ROLES.PARTNER || candidate.PartnerId == loggedInUser.PartnerId)
                          && candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING
                          && (from round in _context.InterviewRounds
                              where round.HiringRequestId == hiring.Id
                              && (pageData.IsScreening == true ? (round.RoundNameId == (int)INTERVIEW_ROUND.SCREENING) : (round.RoundNameId == (int)INTERVIEW_ROUND.CODE_ASSESSMENT || round.RoundNameId == (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT))
                              select round).Any()
                    select candidate)
                .Distinct()
                .Include(x => x.Resume)
                .Include(x => x.Partner)
                .Include(x => x.InterviewSlots!).ThenInclude(x => x.CurrentRound).ThenInclude(x => x!.RoundName)
                .Include(x => x.InterviewSlots!).ThenInclude(x => x.CandidateInterviewStatus)
                .Include(x => x.IntakeStatus)
                .Include(x => x.HiringRequest)!.ThenInclude(x => x!.Domain)
                .Include(x => x.HiringRequest)!.ThenInclude(x => x!.HiringStatus)
                .Include(x => x.HiringRequest)!.ThenInclude(x => x!.InterviewRounds!).ThenInclude(x => x!.RoundName)
                .Include(x => x.HiringRequest)!.ThenInclude(x => x!.InterviewRounds!).ThenInclude(x => x!.InterviewMode)
                .ToListAsync();

                foreach (var item in candidatesWithScreeningRounds)
                {
                    item.HiringRequest!.InterviewRounds = [.. item.HiringRequest.InterviewRounds!
                        .Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(item.Id)))];
                }

                var dtos = _mapper.Map<IEnumerable<GetInterviewSlotDto>>(candidatesWithScreeningRounds);

                var resultDtos = (await Task.WhenAll(dtos.Select(async dto =>
                {
                    var currentCandidate = candidatesWithScreeningRounds.First(x => x.Id == dto.CandidateId);

                    var interviewRounds = currentCandidate.HiringRequest!.InterviewRounds!
                        .Where(r => r.RoundNameId == (int)INTERVIEW_ROUND.SCREENING ||
                                    r.RoundNameId == (int)INTERVIEW_ROUND.CODE_ASSESSMENT ||
                                    r.RoundNameId == (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT)
                        .OrderBy(r => r.RoundNumber)
                        .ToList();

                    var screeningSlot = currentCandidate.InterviewSlots!
                        .FirstOrDefault(x => (x.CurrentRound!.RoundNameId == (int)INTERVIEW_ROUND.SCREENING ||
                                             x.CurrentRound!.RoundNameId == (int)INTERVIEW_ROUND.CODE_ASSESSMENT ||
                                             x.CurrentRound!.RoundNameId == (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT) && x.CurrentRound.HiringRequestId == x.Candidate.HiringRequestId);

                    if (interviewRounds.Count != 0 && (screeningSlot == null ||
                        (screeningSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.SELECTED &&
                         screeningSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.REJECTED)))
                    {
                        var currentRound = interviewRounds.FirstOrDefault(r => r.ModeOfInterview == (int)INTERVIEW_MODE.PHONE_CALL ||
                                                                               r.ModeOfInterview == (int)INTERVIEW_MODE.PROFILE_REVIEW ||
                                                                               r.ModeOfInterview == (int)INTERVIEW_MODE.ONLINE_EXERCISE ||
                                                                               r.ModeOfInterview == (int)INTERVIEW_MODE.CODING_EXERCISE);

                        if (currentRound != null)
                        {
                            dto.DomainManagerId = currentCandidate.HiringRequest.Domain.DomainManagerId;
                            dto.HiringManagerId = currentCandidate.HiringRequest.HiringMangerId;
                            dto.CurrentRoundId = currentRound.Id;
                            dto.CurrentRoundName = currentRound.RoundName?.Name;
                            dto.TatInDays = _applicationUtilities.CalculateTatDays(currentCandidate.ReUploadedCandidateOn ?? currentCandidate.CreatedAt ?? DateTime.UtcNow,
                                                                                   null);
                            dto.NoticePeriod = currentCandidate.NoticePeriod;
                            dto.Phone = currentCandidate.PhoneNumber;
                            dto.HMComments = currentRound.Comments;
                            dto.InterviewModeId = currentRound.ModeOfInterview;
                            dto.InterviewModeName = currentRound.InterviewMode?.Name;
                            dto.IsSlotAssigned = screeningSlot != null && screeningSlot.CandidateInterviewStatusId != null;

                            dto.Panel = screeningSlot != null ?
                                screeningSlot.Panel?.Concat(screeningSlot.CurrentRound?.Panel ?? new List<int>()).Distinct().ToList() :
                                currentRound.Panel;
                            dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                            return dto;
                        }
                    }

                    return null;
                }))).Where(dto => dto?.CurrentRoundId != null).ToList();

                if (pageData.StartDate != null && pageData.EndDate != null)
                    resultDtos = [.. resultDtos.Where(x => (x.UpdatedAt ?? x.CreatedAt ?? DateTime.UtcNow).Date >= pageData.StartDate.Value.Date && (x.UpdatedAt ?? x.CreatedAt ?? DateTime.UtcNow).Date <= pageData.EndDate.Value.Date)];

                if (loggedInUser.RoleId == (int)ROLES.PANEL)
                {
                    resultDtos = [.. resultDtos.Where(x => x!.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0))];
                }

                if (loggedInUser.RoleId == (int)ROLES.HIRINGMANAGER && pageData.IsSelf == true)
                {
                    resultDtos = [.. resultDtos.Where(x => x!.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0))];
                }
                else if (loggedInUser.RoleId == (int)ROLES.HIRINGMANAGER && (pageData.IsSelf == false || pageData.IsSelf == null))
                {
                    resultDtos = [.. resultDtos.Where(x => x!.HiringRequestId != null && x.HiringManagerId == loggedInUser.UserId)];
                }

                if (loggedInUser.RoleId == (int)ROLES.DomainManager && pageData.IsSelf == true)
                {
                    resultDtos = [.. resultDtos.Where(x => x!.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0))];
                }
                else if (loggedInUser.RoleId == (int)ROLES.DomainManager && (pageData.IsSelf == false || pageData.IsSelf == null))
                {
                    resultDtos = [.. resultDtos.Where(x => x!.DomainManagerId != null && x.DomainManagerId == loggedInUser.UserId)];
                }

                return PaginationHelper.GetPagedResult<GetInterviewSlotDto>(pageData, resultDtos);

            }, "Candidates screening list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetInterviewSlotDto>> ScheduleCandidateInterviewSlot(AddInterviewSlotDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                InterviewSlot? added = null;

                var interviewSlot = await _slotAllocationRepository.GetAsync(query => query
                                                                           .Include(x => x.CurrentRound)
                                                                           .Include(x => x.CandidateInterviewStatus)
                                                                           .Where(x => x.CandidateId == dto.CandidateId && x.CurrentRoundId == dto.CurrentRoundId));

                if (interviewSlot != null)
                {
                    if (interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED)
                        throw new Exception("Interview slot is already scheduled.");
                    else if (interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.PENDING)
                        throw new Exception("Interview slot is assigned and waiting for the Partner's approval.");
                    else if (interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                        throw new Exception("Candidate was selected in this interview round.");
                    else if (interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                        throw new Exception("Candidate was rejected in this interview round.");
                    else if (interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.RESHEDULED)
                    {
                        // If the slot is rescheduled, we can update the existing slot
                        interviewSlot.Date = dto.Date;
                        interviewSlot.Time = dto.Time;
                        interviewSlot.Panel = dto.Panel;
                        interviewSlot.LastStatusUpdated = DateTime.UtcNow;
                        interviewSlot.ValidityHours = dto.ValidityHours;
                        await _slotAllocationRepository.UpdateAsync(interviewSlot, false);

                        added = interviewSlot;

                        await _interviewActionRepository.AddAsync(new InterviewActionLog
                        {
                            InterviewSlotId = interviewSlot.Id,
                            ActionType = (int)INTERVIEW_ACTION_TYPE.RESCHEDULED,
                            Comments = dto.Comments,
                            PerformedByUserId = loggedInUserDetails.UserId,
                        });
                    }
                }
                else
                {
                    var candidate = await _candidateFormRepository.GetAsync(dto.CandidateId)
                        ?? throw new KeyNotFoundException($"Candidate with ID: {dto.CandidateId} is not found.");

                    var addInterviewSlot = _mapper.Map<InterviewSlot>(dto);

                    addInterviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.PENDING;
                    addInterviewSlot.LastStatusUpdated = DateTime.UtcNow;

                    var previousSlot = _context.InterviewSlotAllocation.Where(x => x.CandidateId == candidate.Id).OrderByDescending(x => x.Id).FirstOrDefault();

                    addInterviewSlot.InterviewRoundStartDate = previousSlot?.InterviewRoundCompleteDate ?? candidate.CreatedAt;

                    added = await _slotAllocationRepository.AddAsync(addInterviewSlot);

                    await _interviewActionRepository.AddAsync(new InterviewActionLog
                    {
                        InterviewSlotId = addInterviewSlot.Id,
                        ActionType = (int)INTERVIEW_ACTION_TYPE.CREATED,
                        Comments = dto.Comments,
                        PerformedByUserId = 1//dto.UserId,
                    });
                }

                if (added != null)
                {
                    var candidateresult = await _candidateFormRepository.GetAsync(added.CandidateId);
                    var addedInterviewSlot = await _slotAllocationRepository.GetAsync(query => query.Include(x => x.CurrentRound).Where(x => x.Id == added.Id));

                    if (candidateresult.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING && addedInterviewSlot.CurrentRound!.RoundNameId != (int)INTERVIEW_ROUND.SCREENING)
                    {
                        candidateresult.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING;
                        await _candidateFormRepository.UpdateAsync(candidateresult, false);

                        var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidateresult.Id &&
                                                                                                                    x.HiringRequestId == candidateresult.HiringRequestId &&
                                                                                                                    x.PartnerId == candidateresult.PartnerId));

                        if (candidateHistory != null)
                        {
                            candidateHistory.IntakeStatusId = candidateresult.IntakeStatusId;

                            await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                        }
                    }

                    // Assign Panel roles to the Panel members
                    if (interviewSlot?.Panel?.Count > 0)
                    {
                        await _helperMethods.AddUserRoles(interviewSlot.Panel!, (int)ROLES.PANEL);
                    }
                }

                try
                {
                    var partner = await _partnerRepository.GetAsync(query => query.Where(x => x.Id == dto.PartnerId));
                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                    var approver = await _userRepostory.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                    var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == dto.HiringRequestId));
                    var candidateDetails = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == dto.CandidateId));


                    string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

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


                    var candidateDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(candidateDetails, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "Candidate.");

                    var dictionary = Utility.Utility.Merge(candidateDict, hiringPartdictionary);

                    var link = _configuration["ClientHostName"] + "/home/partner-slot-management?tab=assignslot";
                    dictionary.Add("ProfileLink", link);

                    await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerInterviewSlotUpdateNotification, toEmail,
                      dictionary, ccEmail);
                }
                catch (Exception ex)
                { }


                return _mapper.Map<GetInterviewSlotDto>(added);

            }, "Interview slot added successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetPartnerInterviewSlotPendingApprovalRequests(int? partnerId, int? categoryId, PageDto pageData, int? durationId)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var (startDate, endDate) = _helperMethods.GetCurrentDurationRange(durationId);

                var result = await _candidateFormRepository.GetListAsync(query => query
                                    .Include(x => x.Partner)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.RoundName)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CandidateInterviewStatus)
                                    .Include(x => x.IntakeStatus)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.HiringStatus)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.RoundName)
                                    .Where(x => x.IsFreezed != true
                                     && x.PartnerId == (loggedInUserDetails.PartnerId == null ? x.PartnerId : loggedInUserDetails.PartnerId)
                                     && x.HiringRequest!.InterviewRounds!.Any()
                                     && (x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.WIP || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.OFFER_ACCEPTED)
                                     && x.InterviewSlots!.Any()
                                     && (x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING
                                     || x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING)));

                foreach (var item in result)
                {
                    item.HiringRequest!.InterviewRounds = [.. item.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(item.Id)))];
                }

                var dtos = _mapper.Map<IEnumerable<GetInterviewSlotDto>>(result);

                var resultDtos = new List<GetInterviewSlotDto>();

                foreach (var dto in dtos)
                {
                    var currentCandidate = result.FirstOrDefault(x => x.Id == dto.CandidateId);

                    if (currentCandidate != null)
                    {
                        var candidateInterviewRounds = currentCandidate!.HiringRequest!.InterviewRounds!.ToList();
                        var candidateInterviewSlots = currentCandidate!.InterviewSlots!.ToList();

                        if (currentCandidate!.HiringRequest!.InterviewRounds!.Any())
                        {
                            if (candidateInterviewSlots?.Count > 0)
                            {
                                var currentSlot = candidateInterviewSlots.FirstOrDefault(x => categoryId == (int)INTERVIEW_SLOT_STATUS_CATEGORY.PENDING ? x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.PENDING :
                                (x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED && (x.IsInterviewCompleted == null || x.IsInterviewCompleted == false)));

                                if (currentSlot != null)
                                {
                                    TimeSpan? time = DateTime.UtcNow - (currentSlot.LastStatusUpdated ?? currentSlot.CreatedAt);
                                    double totalHours = time?.TotalHours ?? 0;

                                    if (currentSlot.ValidityHours != null && currentSlot.ValidityHours <= totalHours && currentSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.PENDING)
                                    {
                                        // Record the auto-cancellation, then remove the slot. Only FK ids are copied:
                                        // currentSlot comes from a no-tracking query, so assigning its navigation objects
                                        // (Partner, CurrentRound, CandidateInterviewStatus, CandidateRating) makes EF try
                                        // to INSERT those rows again (duplicate PK on M_MasterData / InterviewRounds).
                                        var historyItem = new InterviewSlotAllocationHistory
                                        {
                                            HiringRequestId = currentCandidate.HiringRequestId,
                                            CandidateId = currentSlot.CandidateId,
                                            PartnerId = currentSlot.PartnerId,
                                            CurrentRoundId = currentSlot.CurrentRoundId,
                                            Date = currentSlot.Date,
                                            Time = currentSlot.Time,
                                            Panel = currentSlot.Panel,
                                            ValidityHours = currentSlot.ValidityHours,
                                            Duration = currentSlot.Duration,
                                            IsPartnerAccepted = currentSlot.IsPartnerAccepted,
                                            RejectedOn = DateTime.UtcNow,
                                            RejectedReason = "This slot is auto cancelled due to Partner is not accepted with in validity hours.",
                                            RejectionCount = currentSlot.RejectionCount,
                                            IsResheduled = currentSlot.IsResheduled,
                                            Feedback = currentSlot.Feedback,
                                            CandidateInterviewStatusId = currentSlot.CandidateInterviewStatusId,
                                            AddedAt = DateTime.UtcNow, // history usually records time of entry
                                            IsActive = true,
                                            CreatedAt = DateTime.UtcNow,
                                            CreatedBy = loggedInUserDetails.UserId
                                        };

                                        // Archive + delete atomically: both repositories share this scoped DbContext,
                                        // so one transaction on _context covers both SaveChanges calls.
                                        await using (var transaction = await _context.Database.BeginTransactionAsync())
                                        {
                                            try
                                            {
                                                await _interviewSlotHistoryRepository.AddAsync(historyItem);
                                                await _slotAllocationRepository.DeleteAsync(currentSlot.Id);
                                                await transaction.CommitAsync();
                                            }
                                            catch
                                            {
                                                await transaction.RollbackAsync();
                                                throw;
                                            }
                                        }
                                        continue;
                                    }

                                    dto.InterviewSlotId = currentSlot.Id;
                                    dto.CurrentRoundId = currentSlot!.CurrentRoundId;
                                    dto.CurrentRoundName = currentSlot!.CurrentRound!.RoundName!.Name;
                                    dto.HMComments = currentSlot!.CurrentRound!.Comments;
                                    dto.InterviewSlotId = currentSlot!.Id;
                                    dto.Date = currentSlot!.Date;
                                    dto.Time = currentSlot!.Time;
                                    dto.PartnerComments = currentSlot!.PartnerInterviewAcceptanceComments;
                                    dto.CandidateInterviewStatusId = currentSlot!.CandidateInterviewStatusId;
                                    dto.CandidateInterviewStatusName = currentSlot!.CandidateInterviewStatus!.Name;
                                    dto.ValidityHours = currentSlot!.ValidityHours;
                                    dto.Duration = currentSlot!.Duration;
                                    dto.SlotCreatedAt = currentSlot.CreatedAt;
                                    dto.TatInDays = _applicationUtilities.CalculateTatDays(currentSlot.InterviewRoundStartDate
                                                                                        ?? currentCandidate.ReUploadedCandidateOn
                                                                                        ?? currentCandidate.CreatedAt
                                                                                        ?? DateTime.UtcNow, null);
                                    dto.NoticePeriod = currentCandidate.NoticePeriod;
                                    dto.Phone = currentCandidate.PhoneNumber;
                                    dto.HMAdditionalComments = currentSlot.HMAdditionalComments;

                                    dto.Panel = ([.. (currentSlot.Panel ?? [])
                                                       .Concat((currentSlot.CurrentRound?.Panel ?? []))
                                                       .Select(x => x)
                                                       .Distinct()]);
                                    dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                                }

                                if (currentSlot != null)
                                    resultDtos.Add(dto);
                            }
                        }
                    }
                }

                if (startDate != null && endDate != null)
                    resultDtos = [.. resultDtos.Where(x =>
                                        {
                                            var dateTime = (x.Date?.Add(x.Time ?? TimeSpan.Zero)) ?? DateTime.MinValue;
                                            return dateTime >= startDate.Value && dateTime <= endDate.Value;
                                        })
                                     ];
                return PaginationHelper.GetPagedResult<GetInterviewSlotDto>(pageData, resultDtos.Where(x => x.PartnerId == (partnerId != null ? partnerId : x.PartnerId)));

            }, "Candidate interviewslots fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> PartnerUpdateCandidateInterviewSlot(int interviewSlotId, bool isAccepted, string comments)
        {
            return await ExecuteAsync(async () =>
            {
                var template = PartnerEmailTemplateEnums.PartnerInterviewSlotAcceptedUpdateNotification;
                var interviewSlot = await _slotAllocationRepository.GetAsync(query => query.Where(x => x.Id == interviewSlotId));

                if (interviewSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.PENDING)
                    throw new Exception("Partner Already accepted/rejected the request.");

                var panelAlreadyAssignedToSameSlot = await _slotAllocationRepository.GetAsync(query => query.Where(
                    x => x.Panel!.Any(x => interviewSlot.Panel!.Contains(x))
                    && x.Date == interviewSlot.Date && x.Time == interviewSlot.Time && x.Id != interviewSlot.Id && x.IsPartnerAccepted == true));

                if (panelAlreadyAssignedToSameSlot != null)
                {
                    var matches = panelAlreadyAssignedToSameSlot.Panel!.Intersect(interviewSlot.Panel!).ToList();
                    throw new Exception($"Panel already occupied for this slot date and time.\n {string.Join('\n', matches)}");
                }

                interviewSlot.IsPartnerAccepted = isAccepted;
                interviewSlot.CandidateInterviewStatusId = isAccepted ? (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED : (int)INTERVIEW_SLOT_STATUS.DECLINED;

                interviewSlot.LastStatusUpdated = DateTime.UtcNow;
                interviewSlot.PartnerInterviewAcceptanceComments = comments;
                interviewSlot.RejectionCount = !isAccepted ? (interviewSlot.RejectionCount ?? 0) + 1 : interviewSlot.RejectionCount;

                if (isAccepted == false)
                {
                    interviewSlot.Date = null;
                    interviewSlot.Time = null;
                    interviewSlot.ValidityHours = null;
                    interviewSlot.Duration = null;
                    interviewSlot.HMAdditionalComments = null;
                    interviewSlot.Panel = null;

                    template = PartnerEmailTemplateEnums.PartnerInterviewSlotRejectedUpdateNotification;
                }

                var candidate = await _candidateFormRepository.GetAsync(interviewSlot.CandidateId) ?? throw new Exception($"No candidate found with Id : {interviewSlot.CandidateId}");

                var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id &&
                                                                                                                      x.HiringRequestId == candidate.HiringRequestId &&
                                                                                                                      x.PartnerId == candidate.PartnerId));

                if (interviewSlot.RejectionCount >= 3)
                {
                    interviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.DROPPED;
                    interviewSlot.Feedback = "Partner rejected/rescheduled the interview slot for 3 times.";
                    interviewSlot.InterviewRoundCompleteDate = DateTime.UtcNow;

                    candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP;
                    candidate.CandidateStatusId = (int)CANDIDATE_STATUS.CANDIDATE_DROP;
                    candidate.CandidateDroppedOn = DateTime.UtcNow;

                    template = PartnerEmailTemplateEnums.PartnerInterviewSlotRejectedUpdateNotification;
                }
                else
                {
                    candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING;

                    if (candidateHistory != null)
                    {
                        candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                        await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                    }
                }

                await _slotAllocationRepository.UpdateAsync(interviewSlot, false);

                await _candidateFormRepository.UpdateAsync(candidate, false);

                if (candidateHistory != null)
                {
                    candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                    candidateHistory.CandidateStatusId = candidate.CandidateStatusId;
                    candidateHistory.CandidateDroppedOn = candidate.CandidateDroppedOn;

                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistory, false);
                }

                var actionType = interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED
                ? (int)INTERVIEW_ACTION_TYPE.SCHEDULED
                : (candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.REJECTED ? (int)INTERVIEW_ACTION_TYPE.REJECTED
                : (int)INTERVIEW_ACTION_TYPE.PARTNER_REJECTED);

                await _interviewActionRepository.AddAsync(new InterviewActionLog
                {
                    InterviewSlotId = interviewSlot.Id,
                    ActionType = actionType,
                    Comments = comments,
                    PerformedByUserId = 1//dto.UserId,
                });

                try
                {
                    var candidateDetails = await _candidateFormRepository.GetAsync(candidate.Id);
                    var partner = await _partnerRepository.GetAsync(candidate.PartnerId);

                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                    var approver = await _userRepostory.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                    var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == candidate.HiringRequestId));

                    string ccEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                    if (ccEmail == null)
                    {
                        ccEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                    }

                    var toEmail = approver.Email;

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

                    var candidateDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(candidateDetails, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "Candidate.");

                    var dictionary = Utility.Utility.Merge(candidateDict, hiringPartdictionary);

                    var link = _configuration["ClientHostName"] + (isAccepted ? "/home/slot-management?section=slot-allocation&tab=scheduled" : "/home/slot-management?section=slot-allocation&tab=declined");
                    dictionary.Add("ProfileLink", link);

                    await _communicationService.AddNotification((int)template, toEmail,
                      dictionary, ccEmail);

                    // updating the link
                    var partnerLink = _configuration["ClientHostName"] + "/home/partner-slot-management?tab=scheduled";
                    dictionary["ProfileLink"] = partnerLink;

                    //partner email to update the interview status
                    await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.HiringRequestCandidateInterviewUpdateNotification, ccEmail, dictionary, toEmail);

                }
                catch (Exception ex)
                { }

            }, $"Partner {(isAccepted == true ? "accepted" : "declined")} interview slot successfully.");
        }

        public async Task<ApiResponseDto<string>> PartnerUpdateCandidateInterviewStatus(CandidateInterviewUpdateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var interviewSlot = await _slotAllocationRepository.GetAsync(query => query.Include(x => x.CurrentRound).ThenInclude(x => x!.RoundName).Where(x => x.Id == dto.InterviewSlotId));

                interviewSlot.IsInterviewCompleted = dto.IsInterviewCompleted;
                interviewSlot.PartnerInterviewCompletedComments = dto.PartnerInterviewCompletedComments;
                interviewSlot.PartnerInterviewConfirmedOn = DateTime.UtcNow;

                if (dto.IsInterviewCompleted == false)
                {
                    var candidate = await _candidateFormRepository.GetAsync(interviewSlot.CandidateId);

                    interviewSlot.ResheduledOrDropped = dto.ResheduledOrDropped;

                    if (dto.ResheduledOrDropped == (int)RESHEDULE_OR_DROPPED.RESHEDULED)
                    {
                        interviewSlot.ResheduleIntiatedBy = dto.ResheduleIntiatedBy;
                        interviewSlot.RejectionCount = dto.ResheduleIntiatedBy == (int)RESHEDULE_INITIATED.CANDIDATE ? (interviewSlot.RejectionCount ?? 0) + 1 : interviewSlot.RejectionCount;
                        interviewSlot.RescheduleCount = dto.ResheduleIntiatedBy == (int)RESHEDULE_INITIATED.CANDIDATE ? (interviewSlot.RescheduleCount ?? 0) + 1 : interviewSlot.RescheduleCount;
                        interviewSlot.IsResheduled = true;
                        interviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.RESHEDULED;

                        interviewSlot.Date = null;
                        interviewSlot.Time = null;
                        interviewSlot.ValidityHours = null;
                        interviewSlot.Duration = null;
                        interviewSlot.HMAdditionalComments = null;
                        interviewSlot.Panel = null;

                        if (interviewSlot.RejectionCount >= 3)
                        {
                            interviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.RESHEDULED;
                            interviewSlot.InterviewRoundCompleteDate = DateTime.UtcNow;
                            interviewSlot.Feedback = "Partner rejected/rescheduled the interview slot for 3 times.";

                            candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP;
                            candidate.CandidateStatusId = (int)CANDIDATE_STATUS.CANDIDATE_DROP;

                            await _candidateFormRepository.UpdateAsync(candidate, false);

                            var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id &&
                                                                                                                      x.HiringRequestId == candidate.HiringRequestId &&
                                                                                                                      x.PartnerId == candidate.PartnerId));

                            if (candidateHistory != null)
                            {
                                candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                                candidateHistory.CandidateStatusId = candidate.CandidateStatusId;

                                await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                            }
                        }
                    }
                    else if (dto.ResheduledOrDropped == (int)RESHEDULE_OR_DROPPED.DROPPED)
                    {
                        candidate.CandidateStatusId = (int)CANDIDATE_STATUS.CANDIDATE_DROP;
                        candidate.CandidateDroppedOn = DateTime.UtcNow;

                        candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP;

                        await _candidateFormRepository.UpdateAsync(candidate, false);

                        var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id &&
                                                                                                                     x.HiringRequestId == candidate.HiringRequestId &&
                                                                                                                     x.PartnerId == candidate.PartnerId));

                        if (candidateHistory != null)
                        {
                            candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                            candidateHistory.CandidateDroppedOn = candidate.CandidateDroppedOn;
                            candidateHistory.CandidateStatusId = candidate.CandidateStatusId;

                            await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                        }

                        interviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.DROPPED;
                    }
                }
                else
                {
                    interviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.FEEDBACK_PENDING;
                }

                await _slotAllocationRepository.UpdateAsync(interviewSlot, false);

                var actionType = interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.RESHEDULED
                   ? (int)INTERVIEW_ACTION_TYPE.RESCHEDULED : (
                   interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.FEEDBACK_PENDING ? (int)INTERVIEW_ACTION_TYPE.MOVED_TO_FEEDBACK_PENDING
                   : (int)INTERVIEW_ACTION_TYPE.REJECTED);

                await _interviewActionRepository.AddAsync(new InterviewActionLog
                {
                    InterviewSlotId = interviewSlot.Id,
                    ActionType = actionType,
                    Comments = dto.PartnerInterviewCompletedComments,
                    PerformedByUserId = 1//dto.UserId,
                });

                var template = PartnerEmailTemplateEnums.PartnerCandidateInterviewStatusUpdateNotification;

                if (interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.RESHEDULED)
                {
                    template = PartnerEmailTemplateEnums.PartnerCandidateInterviewNotHappendNotification;
                }

                try
                {
                    var candidateDetails = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == interviewSlot.CandidateId));
                    var partner = await _partnerRepository.GetAsync(query => query.Where(x => x.Id == candidateDetails.PartnerId));


                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                    var approver = await _userRepostory.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                    var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == candidateDetails.HiringRequestId));


                    string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

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


                    var candidateDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(candidateDetails, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "Candidate.");

                    var dictionary = Utility.Utility.Merge(candidateDict, hiringPartdictionary);

                    var link = _configuration["ClientHostName"] + "/home/slot-management?section=evaluation&tab=feedback-pending";
                    dictionary.Add("ProfileLink", link);

                    await _communicationService.AddNotification((int)template, toEmail,
                      dictionary, ccEmail);

                }
                catch (Exception ex)
                { }

            }, "Partner updated interview slot status successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetCandidateInterviewSlotList(InterviewSlotListPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();

                if (loggedInUser.UserId == null || loggedInUser.RoleId == null)
                    throw new Exception("Invalid user.");

                var result = await _candidateFormRepository.GetListAsync(query => query
                                    .Include(x => x.Partner)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.RoundName)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.InterviewMode)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CandidateInterviewStatus)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.RoundName)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.InterviewMode)
                                    .Where(x => x.IsFreezed != true
                                                && x.HiringRequest!.InterviewRounds!.Any()
                                                && (x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.WIP || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.OFFER_ACCEPTED)
                                                && (x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING || x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING)
                                                && (loggedInUser.RoleId != (int)ROLES.PARTNER || x.PartnerId == loggedInUser.PartnerId)
                                                && (loggedInUser.RoleId != (int)ROLES.HIRINGMANAGER || x.HiringRequest.HiringMangerId == loggedInUser.UserId || x.HiringRequest.InterviewRounds.Any(x => x.Panel.Contains(loggedInUser.UserId ?? 0))))
                                    );

                foreach (var item in result)
                {
                    item.HiringRequest!.InterviewRounds = [.. item.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(item.Id)))];
                }

                var dtos = _mapper.Map<IEnumerable<GetInterviewSlotDto>>(result);

                var resultDtos = new List<GetInterviewSlotDto>();

                foreach (var dto in dtos)
                {
                    var currentCandidate = result.FirstOrDefault(x => x.Id == dto.CandidateId);

                    if (currentCandidate == null) continue;

                    var candidateInterviewRounds = currentCandidate.HiringRequest?.InterviewRounds?
                                                        .OrderBy(x => x.RoundNumber)
                                                        .ToList();

                    if (candidateInterviewRounds == null || candidateInterviewRounds.Count == 0)
                        continue;

                    var cleanedSlots = currentCandidate.InterviewSlots?
                                          .Where(x => x.CurrentRound.HiringRequestId == currentCandidate.HiringRequestId)
                                          .OrderByDescending(x => x.Id)
                                          .GroupBy(slot => new { slot.CandidateId, slot.CurrentRoundId })
                                          .Select(group => group.First())
                                          .ToList();

                    var currentSlot = cleanedSlots!.FirstOrDefault();

                    if (currentSlot == null)
                    {
                        var nextRound = candidateInterviewRounds.FirstOrDefault();

                        if (nextRound != null && (nextRound.ModeOfInterview == (int)INTERVIEW_MODE.PHONE_CALL
                                               || nextRound.ModeOfInterview == (int)INTERVIEW_MODE.PROFILE_REVIEW
                                               || nextRound.ModeOfInterview == (int)INTERVIEW_MODE.ONLINE_EXERCISE
                                               || nextRound.ModeOfInterview == (int)INTERVIEW_MODE.CODING_EXERCISE))
                            continue;

                        if (nextRound != null)
                        {
                            dto.Panel = nextRound.Panel;
                            dto.AvailableDays = nextRound.AvailableDays;
                            dto.CurrentRoundId = nextRound.Id;
                            dto.CurrentRoundName = nextRound.RoundName?.Name;
                            dto.InterviewModeId = nextRound.ModeOfInterview;
                            dto.InterviewModeName = nextRound.InterviewMode?.Name;
                            dto.NoticePeriod = currentCandidate.NoticePeriod;
                            dto.HMComments = nextRound.Comments;
                            dto.Phone = currentCandidate.PhoneNumber;
                            dto.TatInDays = _applicationUtilities.CalculateTatDays(currentCandidate.ReUploadedCandidateOn ?? currentCandidate.CreatedAt ?? DateTime.UtcNow, null);
                            dto.CreatedAt = currentCandidate.CreatedAt;
                            dto.UpdatedAt = currentCandidate.UpdatedAt;
                            dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;

                            resultDtos.Add(dto);
                            continue;
                        }
                    }

                    if (currentSlot != null && currentSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                    {
                        var currentIndex = candidateInterviewRounds.FindIndex(r => r.Id == currentSlot.CurrentRoundId);
                        var nextRound = (currentIndex >= 0 && currentIndex < candidateInterviewRounds.Count() - 1)
                                        ? candidateInterviewRounds[currentIndex + 1]
                                        : null;

                        if (nextRound != null && (nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.PHONE_CALL ||
                                                  nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.PROFILE_REVIEW ||
                                                  nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.ONLINE_EXERCISE ||
                                                  nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.CODING_EXERCISE)
                            )
                            continue;

                        if (nextRound != null)
                        {
                            dto.Panel = nextRound.Panel;
                            dto.PanelNames = await _helperMethods.GetUserNamesStringAsync(dto.Panel);
                            dto.AvailableDays = nextRound.AvailableDays;

                            dto.CurrentRoundId = nextRound.Id;
                            dto.CurrentRoundName = nextRound.RoundName?.Name;
                            dto.InterviewModeId = nextRound.ModeOfInterview;
                            dto.InterviewModeName = nextRound.InterviewMode?.Name;
                            dto.NoticePeriod = currentCandidate.NoticePeriod;
                            dto.HMComments = nextRound.Comments;
                            dto.Phone = currentCandidate.PhoneNumber;
                            dto.TatInDays = _applicationUtilities.CalculateTatDays(currentSlot.InterviewRoundCompleteDate ?? DateTime.UtcNow, null);
                            dto.CreatedAt = currentSlot.CreatedAt;
                            dto.UpdatedAt = currentSlot.UpdatedAt;
                        }
                    }
                    else if (currentSlot != null && currentSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.SELECTED)
                    {
                        if (currentSlot?.CurrentRound?.RoundNameId == (int)INTERVIEW_ROUND.SCREENING
                        && (currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.PHONE_CALL || currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.PROFILE_REVIEW
                        || currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.ONLINE_EXERCISE || currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.CODING_EXERCISE))
                            continue;

                        dto.Panel = currentSlot!.CurrentRound!.Panel;
                        dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                        dto.AdditionalPanel = currentSlot!.Panel;
                        dto.AdditionalPanelNames = await _helperMethods.GetUserNamesStringAsync(currentSlot.Panel);
                        dto.AvailableDays = currentSlot.CurrentRound!.AvailableDays;
                        dto.InterviewSlotId = currentSlot.Id;
                        dto.CurrentRoundId = currentSlot.CurrentRoundId;
                        dto.CurrentRoundName = currentSlot.CurrentRound?.RoundName?.Name;
                        dto.InterviewSlotId = currentSlot.Id;
                        dto.Date = currentSlot.Date;
                        dto.Time = currentSlot.Time;
                        dto.Duration = currentSlot.Duration;
                        dto.ValidityHours = currentSlot.ValidityHours;
                        dto.PartnerComments = currentSlot.PartnerInterviewAcceptanceComments;
                        dto.CandidateInterviewStatusId = currentSlot.CandidateInterviewStatusId;
                        dto.CandidateInterviewStatusName = currentSlot.CandidateInterviewStatus?.Name;
                        dto.InterviewModeId = currentSlot.CurrentRound!.ModeOfInterview;
                        dto.InterviewModeName = currentSlot.CurrentRound!.InterviewMode?.Name;
                        dto.RejectionCount = currentSlot.RejectionCount;
                        dto.RescheduleCount = currentSlot.RescheduleCount;
                        dto.NoticePeriod = currentCandidate.NoticePeriod;
                        dto.Phone = currentCandidate.PhoneNumber;
                        dto.HMComments = currentSlot.CurrentRound?.Comments;
                        dto.TatInDays = _applicationUtilities.CalculateTatDays(currentSlot.InterviewRoundCompleteDate ?? currentSlot.InterviewRoundStartDate ?? DateTime.UtcNow, null);
                        dto.CreatedAt = currentSlot.CreatedAt;
                        dto.UpdatedAt = currentSlot.UpdatedAt;
                    }

                    if (dto.CurrentRoundId != null)
                        resultDtos.Add(dto);
                }

                if (pageData.StartDate != null && pageData.EndDate != null)
                {
                    if (pageData.SlotStatusTypeId == (int)SLOT_ALLOCATION.ASSIGN_SLOTS)
                        resultDtos = [.. resultDtos.Where(x => (x.UpdatedAt ?? x.CreatedAt ?? DateTime.UtcNow).Date >= pageData.StartDate.Value.Date && (x.UpdatedAt ?? x.CreatedAt ?? DateTime.UtcNow).Date <= pageData.EndDate.Value.Date)];
                    else
                        resultDtos = [.. resultDtos.Where(x =>
                                        {
                                            var dateTime = (x.Date?.Add(x.Time ?? TimeSpan.Zero)) ?? DateTime.MinValue;
                                            return dateTime >= pageData.StartDate.Value && dateTime <= pageData.EndDate.Value;
                                        })
                                     ];
                }

                if (pageData.SlotStatusTypeId == (int)SLOT_ALLOCATION.ASSIGN_SLOTS)
                    resultDtos = [.. resultDtos.Where(x => x.CandidateInterviewStatusId == null || x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.RESHEDULED)];
                else if (pageData.SlotStatusTypeId == (int)SLOT_ALLOCATION.PENDING)
                    resultDtos = [.. resultDtos.Where(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.PENDING)];
                else if (pageData.SlotStatusTypeId == (int)SLOT_ALLOCATION.REJECTED)
                    resultDtos = [.. resultDtos.Where(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.DECLINED)];
                else if (pageData.SlotStatusTypeId == (int)SLOT_ALLOCATION.SCHEDULED)
                    resultDtos = [.. resultDtos.Where(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED)];

                if (loggedInUser.RoleId == (int)ROLES.PANEL)
                {
                    resultDtos = resultDtos.Where(x => x.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0)).ToList();
                }

                return PaginationHelper.GetPagedResult<GetInterviewSlotDto>(pageData, resultDtos.AsEnumerable());

            }, "Interviewlist fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateInterviewFeedback(AddFeedbackDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedinUser = _helperMethods.GetUserDetails();
                var result = await _slotAllocationRepository.GetAsync(query => query.Where(x => x.Id == dto.InterviewSlotId));

                result.Feedback = dto.Feedback;
                result.PanelFeedbackGivenOn = DateTime.UtcNow;
                result.FeedbackGivenByUserId = loggedinUser.UserId;
                result.CandidateInterviewStatusId = dto.InterviewStatusId;
                result.InterviewRoundCompleteDate = DateTime.UtcNow;

                await _slotAllocationRepository.UpdateAsync(result, false);

                if (result.CandidateId != null)
                {
                    var candidate = await _candidateFormRepository.GetAsync(query => query
                    .Include(x => x.HiringRequest)
                    .ThenInclude(x => x!.InterviewRounds!.OrderByDescending(x => x.RoundNumber))
                    .Where(x => x.Id == result.CandidateId));

                    candidate.HiringRequest!.InterviewRounds = [.. candidate.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(candidate.Id)))];

                    if (candidate == null) return;

                    var updateCandidate = await _candidateFormRepository.GetAsync(result.CandidateId);

                    var history = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == updateCandidate.Id &&
                                                                                                             x.HiringRequestId == updateCandidate.HiringRequestId &&
                                                                                                             x.HiringRequestId == updateCandidate.HiringRequestId));

                    if (updateCandidate == null) return;

                    if (result.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                    {
                        var lastRound = candidate?.HiringRequest?.InterviewRounds?
                            .OrderByDescending(x => x.RoundNumber)
                            .FirstOrDefault();

                        if (lastRound?.Id == result.CurrentRoundId)
                        {
                            updateCandidate.CandidateStatusId = (int)CANDIDATE_STATUS.SELECTED;
                            updateCandidate.InterviewCompletedOn = DateTime.UtcNow;
                            updateCandidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED;
                        }
                        else
                        {
                            updateCandidate.CandidateStatusId = await _candidateHelperMethods.GetCandidateStatusBasedInterviewRoundId(result.CurrentRoundId, result.CandidateInterviewStatusId);
                        }

                        await _candidateFormRepository.UpdateAsync(updateCandidate, false);


                    }
                    else if (result.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.REJECTED)
                    {
                        updateCandidate.CandidateStatusId = await _candidateHelperMethods.GetCandidateStatusBasedInterviewRoundId(result.CurrentRoundId, result.CandidateInterviewStatusId);
                        updateCandidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.REJECTED;
                        updateCandidate.CandidateRejectedOn = DateTime.UtcNow;
                        await _candidateFormRepository.UpdateAsync(updateCandidate, false);
                    }

                    if (history != null)
                    {
                        history.CandidateStatusId = updateCandidate.CandidateStatusId;
                        history.InterviewCompletedOn = updateCandidate.InterviewCompletedOn;
                        history.CandidateRejectedOn = updateCandidate.CandidateRejectedOn;
                        history.IntakeStatusId = updateCandidate.IntakeStatusId;

                        await _candidateFormHistoryRepository.UpdateAsync(history, false);
                    }
                }
            }, "Feedback updated successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetInterviewFeedbackPendingList(InterviewFeedbackPendingListPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();

                var result = await _candidateFormRepository.GetListAsync(query => query
                                    .Include(x => x.Partner)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.RoundName)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.InterviewMode)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CandidateInterviewStatus)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CandidateRating)
                                    .Include(x => x.IntakeStatus)
                                    .Include(x => x.Resume)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.Domain)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.HiringStatus)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.RoundName)
                                    .Where(x => x.IsFreezed != true
                                        && x.HiringRequest!.InterviewRounds!.Any()
                                        && (x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.WIP || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.OFFER_ACCEPTED)
                                        && (x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING || x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING || x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.FEEDBACK_PENDING)
                                        && x.InterviewSlots!.Any()
                                        && (loggedInUser.RoleId != (int)ROLES.DomainManager || x.HiringRequest.Domain!.DomainManagerId == loggedInUser.UserId || x.HiringRequest.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUser.UserId ?? 0)))
                                        && (loggedInUser.RoleId != (int)ROLES.HIRINGMANAGER || x.HiringRequest.HiringMangerId == loggedInUser.UserId || x.HiringRequest.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUser.UserId ?? 0)))
                                        && (loggedInUser.RoleId != (int)ROLES.PARTNER || x.PartnerId == loggedInUser.PartnerId))
                                    );

                var dtos = _mapper.Map<IEnumerable<GetInterviewSlotDto>>(result);

                var resultDtos = new List<GetInterviewSlotDto>();

                foreach (var dto in dtos)
                {
                    var currentCandidate = result.FirstOrDefault(x => x.Id == dto.CandidateId);

                    if (currentCandidate != null)
                    {
                        var candidateInterviewRounds = currentCandidate!.HiringRequest!.InterviewRounds!.ToList();
                        var candidateInterviewSlots = currentCandidate!.InterviewSlots!.ToList();

                        if (currentCandidate!.HiringRequest!.InterviewRounds!.Any())
                        {
                            if (candidateInterviewSlots?.Count > 0)
                            {
                                var currentSlot = candidateInterviewSlots.FirstOrDefault(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.FEEDBACK_PENDING || x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.ONHOLD);

                                if (currentSlot != null)
                                {
                                    dto.InterviewSlotId = currentSlot.Id;
                                    dto.CurrentRoundId = currentSlot!.CurrentRoundId;
                                    dto.CurrentRoundName = currentSlot!.CurrentRound!.RoundName!.Name;
                                    dto.InterviewSlotId = currentSlot!.Id;
                                    dto.Date = currentSlot!.Date;
                                    dto.Time = currentSlot!.Time;
                                    dto.PartnerComments = currentSlot!.PartnerInterviewAcceptanceComments;
                                    dto.CandidateInterviewStatusId = currentSlot!.CandidateInterviewStatusId;
                                    dto.CandidateInterviewStatusName = currentSlot!.CandidateInterviewStatus!.Name;
                                    dto.TatInDays = _applicationUtilities.CalculateTatDays(currentSlot.InterviewRoundCompleteDate ?? currentSlot.CreatedAt ?? DateTime.UtcNow, null);
                                    dto.NoticePeriod = currentCandidate.NoticePeriod;
                                    dto.Phone = currentCandidate.PhoneNumber;
                                    dto.HMComments = currentSlot.CurrentRound?.Comments;
                                    dto.InterviewModeName = currentSlot!.CurrentRound?.InterviewMode?.Name;
                                    dto.Panel = currentSlot.CurrentRound?.Panel ?? [];
                                    dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                                    dto.AdditionalPanel = currentSlot.Panel ?? [];
                                    dto.AdditionalPanelNames = dto.AdditionalPanel != null ? string.Join(", ", _context.Users.Where(ud => dto.AdditionalPanel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                                    dto.HasInterviewFeedback = currentSlot.CurrentRound!.AddFeedbackCritria ?? false;

                                    resultDtos.Add(dto);
                                }
                            }
                        }
                    }
                }

                if (pageData.StartDate != null && pageData.EndDate != null)
                    resultDtos = [.. resultDtos.Where(x =>
                                     {
                                         var dateTime = (x.Date?.Add(x.Time ?? TimeSpan.Zero)) ?? DateTime.MinValue;
                                         return dateTime >= pageData.StartDate.Value && dateTime <= pageData.EndDate.Value;
                                     })
                                 ];

                if (loggedInUser.RoleId == (int)ROLES.PANEL)
                {
                    resultDtos = resultDtos.Where(x => x.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0)).ToList();
                }

                if (loggedInUser.RoleId == (int)ROLES.HIRINGMANAGER && pageData.IsSelf == true)
                {
                    resultDtos = [.. resultDtos.Where(x => x!.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0))];
                }

                if (loggedInUser.RoleId == (int)ROLES.DomainManager && pageData.IsSelf == true)
                {
                    resultDtos = [.. resultDtos.Where(x => x!.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0))];
                }

                return PaginationHelper.GetPagedResult<GetInterviewSlotDto>(pageData, resultDtos.AsEnumerable());

            }, "Interviewlist fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPanelFeedFormDto>> GetInterviewSlotFeedbackDetails(int? InterviewSlotId)
        {
            return await ExecuteAsync(async () =>
            {
                var currentInterviewSlot = await _slotAllocationRepository.GetAsync(query => query.Include(x => x.CandidateRating).Where(x => x.Id == InterviewSlotId));

                if (currentInterviewSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.FEEDBACK_PENDING && (!string.IsNullOrEmpty(currentInterviewSlot.Feedback) || currentInterviewSlot.CandidateRating?.ToList().Count > 0))
                {
                    throw new Exception("Feedback already submitted to this candidate.");
                }

                var feedbackformDto = await _context.InterviewSlotAllocation
                                                .Join(_context.CandidateForms,
                                                    slot => slot.CandidateId,
                                                    candidate => candidate.Id,
                                                    (slot, candidate) => new { slot, candidate })
                                                .Join(_context.Hiring,
                                                    temp => temp.slot.Candidate!.HiringRequestId,
                                                    hiring => hiring.Id,
                                                    (temp, hiring) => new { temp.slot, temp.candidate, hiring })
                                                .Where(x => x.slot.Id == InterviewSlotId)
                                                .Select(x => new GetPanelFeedFormDto
                                                {
                                                    InterviewSlotId = x.slot.Id,
                                                    CandidateId = x.candidate.Id,
                                                    CandidateName = x.candidate.FullName,
                                                    CandidateCode = x.candidate.CandidateCode,
                                                    InterviewRoundNumber = x.slot.CurrentRound!.RoundNumber,
                                                    InterviewPanelMember = x.slot.CurrentRound.Panel,
                                                    InterviewAdditionalPanelMember = x.slot.Panel,
                                                    InterviewDate = x.slot.Date,
                                                    InterviewType = _mapper.Map<DropdownDto>(x.slot.CurrentRound!.RoundName),
                                                    InterviewMode = _mapper.Map<DropdownDto>(x.slot.CurrentRound.InterviewMode),
                                                    CandidateInterviewStatus = _mapper.Map<DropdownDto>(x.slot.CandidateInterviewStatus!),
                                                    FeedbackGivenByUserId = x.slot.FeedbackGivenByUserId,
                                                    FeedbackGivenByUserName = x.slot.FeedbackGivenByUser.FullName,
                                                    FeedbackGivenByUserRoleName = x.slot.FeedbackGivenByUser.UserRoles.FirstOrDefault().Role.RoleName,
                                                    FeedbackCritriaOptions = x.slot.CurrentRound.FeedbackCritriaOptions!
                                                        .Select(fco => new DropdownDto()
                                                        {
                                                            Id = fco.CriteriaOptionId,
                                                            Name = fco.CriteriaOption != null ? fco.CriteriaOption.Name : "",
                                                            Rating = x.slot.CandidateRating.FirstOrDefault(r => r.CriteriaOptionId == fco.CriteriaOptionId)!.Rating,
                                                            Comments = x.slot.CandidateRating.FirstOrDefault(r => r.CriteriaOptionId == fco.CriteriaOptionId)!.Comments
                                                        }).ToList(),
                                                    InterviewPanelNames = x.slot.CurrentRound.Panel != null ? string.Join(", ", _context.Users.Where(ud => x.slot.CurrentRound.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty,
                                                    InterviewAdditionalPanelMemberNames = x.slot.Panel != null ? string.Join(", ", _context.Users.Where(ud => x.slot.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty,
                                                })
                                                .FirstOrDefaultAsync();

                return feedbackformDto ?? throw new Exception("No details found.");

            }, "Candidate feedback form details fetched successfully.");

        }

        public async Task<ApiResponseDto<string>> UpdateInterviewSlotFeedbackDetails(List<UpdatePanelFeedbackFormDto> dtos)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedinUser = _helperMethods.GetUserDetails();

                var feedbackResult = await _feedbackRepository.GetListAsync(query => query.Where(x => x.InterviewSlotId == dtos.FirstOrDefault()!.InterviewSlotId));

                var _currentInterviewSlot = await _slotAllocationRepository.GetAsync(dtos.FirstOrDefault()!.InterviewSlotId);

                if (_currentInterviewSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.FEEDBACK_PENDING && feedbackResult != null && feedbackResult.Count() > 0)
                    throw new Exception("Candidate feedback is submitted already.");
                else if (feedbackResult != null && feedbackResult.Count() > 0)
                {
                    List<int> ratingIds = feedbackResult.Select(x => x.Id).ToList();
                    await _feedbackRepository.DeleteListAsync(ratingIds);
                }

                await _feedbackRepository.AddListAsync(_mapper.Map<List<CandidateInterviewFeedBack>>(dtos));

                _currentInterviewSlot.CandidateInterviewStatusId = dtos.FirstOrDefault()!.CandidateInterviewStatusId;

                var _feedback = string.Join(",", dtos.Select(x => x.Comments ?? string.Empty)
                                                    .Where(c => !string.IsNullOrWhiteSpace(c)));

                _currentInterviewSlot.Feedback = !string.IsNullOrEmpty(_feedback) ? _feedback : "Feedback added";
                _currentInterviewSlot.FeedbackGivenByUserId = loggedinUser.UserId;
                _currentInterviewSlot.PanelFeedbackGivenOn = DateTime.UtcNow;
                _currentInterviewSlot.InterviewRoundCompleteDate = DateTime.UtcNow;

                await _slotAllocationRepository.UpdateAsync(_currentInterviewSlot, false);

                if (dtos.FirstOrDefault()!.CandidateInterviewStatusId != null)
                {
                    var candidate = await _candidateFormRepository.GetAsync(query => query
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.RoundName)
                                    .Where(x => x.Id == dtos.FirstOrDefault()!.CandidateId));

                    candidate.HiringRequest!.InterviewRounds = [.. candidate.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(candidate.Id)))];

                    var updateCandidate = await _candidateFormRepository.GetAsync(dtos.FirstOrDefault()!.CandidateId);

                    var history = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == updateCandidate.Id &&
                                                                                         x.HiringRequestId == updateCandidate.HiringRequestId &&
                                                                                         x.HiringRequestId == updateCandidate.HiringRequestId));


                    if (dtos.FirstOrDefault()!.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                    {
                        var lastRound = candidate?.HiringRequest?.InterviewRounds?
                            .OrderByDescending(x => x.RoundNumber)
                            .FirstOrDefault();

                        if (lastRound?.Id == _currentInterviewSlot!.CurrentRoundId)
                        {
                            updateCandidate.CandidateStatusId = (int)CANDIDATE_STATUS.SELECTED;
                            updateCandidate.InterviewCompletedOn = DateTime.UtcNow;
                            updateCandidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED;
                            updateCandidate.CandidateIdentifiedOn = DateTime.UtcNow;
                        }
                        else
                        {
                            updateCandidate.CandidateStatusId = await _candidateHelperMethods.GetCandidateStatusBasedInterviewRoundId(_currentInterviewSlot.CurrentRoundId, _currentInterviewSlot.CandidateInterviewStatusId);
                        }
                        await _candidateFormRepository.UpdateAsync(updateCandidate, false);

                    }
                    else if (dtos.FirstOrDefault()!.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.REJECTED)
                    {
                        updateCandidate.CandidateStatusId = await _candidateHelperMethods.GetCandidateStatusBasedInterviewRoundId(_currentInterviewSlot.CurrentRoundId, _currentInterviewSlot.CandidateInterviewStatusId);
                        updateCandidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.REJECTED;
                        updateCandidate.CandidateRejectedOn = DateTime.UtcNow;
                        await _candidateFormRepository.UpdateAsync(updateCandidate, false);
                    }

                    if (history != null)
                    {
                        history.CandidateStatusId = updateCandidate.CandidateStatusId;
                        history.InterviewCompletedOn = updateCandidate.InterviewCompletedOn;
                        history.CandidateRejectedOn = updateCandidate.CandidateRejectedOn;
                        history.IntakeStatusId = updateCandidate.IntakeStatusId;

                        await _candidateFormHistoryRepository.UpdateAsync(history, false);
                    }
                }

            }, "Candidate feedback updated successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateCandidateScreeningSlot(AddScreeningSlotDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                if (dto.ScreeningStatusId != null)
                {
                    InterviewSlot _screeningSlot = new()
                    {
                        CurrentRoundId = dto.CurrentRoundId,
                        CandidateId = dto.CandidateId,
                        CandidateInterviewStatusId = dto.ScreeningStatusId == (int)SCREENING_STATUS.Accepted ? (int)INTERVIEW_SLOT_STATUS.SELECTED :
                                                     dto.ScreeningStatusId == (int)SCREENING_STATUS.Dropped ? (int)INTERVIEW_SLOT_STATUS.DROPPED :
                                                     (int)INTERVIEW_SLOT_STATUS.REJECTED,
                        LastStatusUpdated = DateTime.UtcNow,
                        InterviewRoundStartDate = _context.CandidateForms.AsNoTracking().FirstOrDefault(x => x.Id == dto.CandidateId).CreatedAt,
                        InterviewRoundCompleteDate = DateTime.UtcNow,
                        Date = DateTime.UtcNow,
                        Time = DateTime.UtcNow.TimeOfDay,
                        Feedback = dto.Comments,
                        IsActive = true,
                        PanelFeedbackGivenOn = DateTime.UtcNow,
                        FeedbackGivenByUserId = loggedInUserDetails.UserId,
                    };

                    var added = await _slotAllocationRepository.AddAsync(_screeningSlot);

                    var entity = await _candidateFormRepository.GetAsync(query => query.Include(x => x.InterviewSlots)
                                                                                    .Include(x => x.HiringRequest)
                                                                                    .ThenInclude(x => x.InterviewRounds)
                                                                                    .Where(x => x.Id == dto.CandidateId)) ?? throw new Exception($"Candidate is not found with CandidateId : {dto.CandidateId}");

                    entity.HiringRequest!.InterviewRounds = [.. entity.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(entity.Id)))];

                    entity.IsScreeningCompleted = true;
                    entity.ScreeningCompletedOn = DateTime.UtcNow;
                    entity.ScreeningStatus = dto.ScreeningStatusId == (int)SCREENING_STATUS.Accepted ? true : false;
                    entity.IntakeStatusId = dto.ScreeningStatusId == (int)SCREENING_STATUS.Accepted ? (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING :
                                            (dto.ScreeningStatusId == (int)SCREENING_STATUS.Dropped ? (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP :
                                            (dto.ScreeningStatusId == (int)SCREENING_STATUS.Rejected ? (int)CANDIDATE_INTAKE_STATUS.REJECTED : entity.IntakeStatusId));

                    entity.CandidateStatusId = dto.ScreeningStatusId == (int)SCREENING_STATUS.Accepted ? (int)CANDIDATE_STATUS.SCREEN_SELECT : (int)CANDIDATE_STATUS.SCREEN_REJECT;

                    var candidateInterviewRounds = entity.HiringRequest?.InterviewRounds?
                                                        .OrderBy(x => x.RoundNumber)
                                                        .ToList();

                    if (candidateInterviewRounds == null || candidateInterviewRounds.Count() == 0)
                        throw new Exception("No interview rounds found");

                    var cleanedSlots = entity.InterviewSlots?
                                          .OrderByDescending(x => x.Id)
                                          .GroupBy(slot => new { slot.CandidateId, slot.CurrentRoundId })
                                          .Select(group => group.First())
                                          .ToList();

                    var currentSlot = cleanedSlots!.FirstOrDefault();

                    var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == entity.Id &&
                                                                                           x.HiringRequestId == entity.HiringRequestId &&
                                                                                           x.PartnerId == entity.PartnerId));

                    if (currentSlot != null && currentSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                    {
                        var currentIndex = candidateInterviewRounds.FindIndex(r => r.Id == currentSlot.CurrentRoundId);
                        var nextRound = (currentIndex >= 0 && currentIndex < candidateInterviewRounds.Count() - 1)
                                        ? candidateInterviewRounds[currentIndex + 1]
                                        : null;
                        if (nextRound == null)
                        {
                            entity.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED;
                            entity.CandidateIdentifiedOn = DateTime.UtcNow;
                        }
                    }

                    await _candidateFormRepository.UpdateAsync(entity, false);

                    if (candidateHistory != null)
                    {
                        candidateHistory.IntakeStatusId = entity.IntakeStatusId;
                        candidateHistory.CandidateStatusId = entity.CandidateStatusId;

                        await _candidateFormHistoryRepository.UpdateAsync(candidateHistory, false);
                    }

                    added.PartnerId = entity.PartnerId;

                    await _slotAllocationRepository.UpdateAsync(added, false);
                }

            }, "Candidate form status updated successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetInterviewSelectedList(InterviewSelectedListPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();

                var result = await _candidateFormRepository.GetListAsync(query => query
                                    .Include(x => x.Partner)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.RoundName)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CandidateInterviewStatus)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CandidateRating)
                                    .Include(x => x.IntakeStatus)
                                    .Include(x => x.Resume)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.HiringStatus)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.Domain)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.RoundName)
                                    .Where(x => x.IsFreezed != true
                                    && x.HiringRequest!.InterviewRounds!.Any()
                                    && (x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.WIP || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED || x.HiringRequest.HiringStatusId == (int)HIRING_STATUS.OFFER_ACCEPTED)
                                    && x.InterviewSlots!.Any()
                                    && pageData.IntakeStatusIds != null && pageData.IntakeStatusIds.Count > 0 && pageData.IntakeStatusIds.Contains(x.IntakeStatusId ?? 0)
                                    && (loggedInUser.RoleId != (int)ROLES.DomainManager || x.HiringRequest.Domain!.DomainManagerId == loggedInUser.UserId || x.HiringRequest.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUser.UserId ?? 0)))
                                    && (loggedInUser.RoleId != (int)ROLES.HIRINGMANAGER || x.HiringRequest.HiringMangerId == loggedInUser.UserId || x.HiringRequest.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUser.UserId ?? 0)))
                                    && (loggedInUser.RoleId != (int)ROLES.PARTNER || x.PartnerId == loggedInUser.PartnerId)
                                    ));

                foreach (var item in result)
                {
                    item.HiringRequest!.InterviewRounds = [.. item.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(item.Id)))];
                }

                var resultDtos = _mapper.Map<IEnumerable<GetInterviewSlotDto>>(result);

                foreach (var dto in resultDtos)
                {
                    var currentCandidate = result.FirstOrDefault(x => x.Id == dto.CandidateId);
                    if (currentCandidate == null) continue;

                    var lastSlot = currentCandidate.InterviewSlots?
                                          .OrderByDescending(x => x.Id)
                                          .GroupBy(slot => new { slot.CandidateId, slot.CurrentRoundId })
                                          .Select(group => group.First())
                                          .FirstOrDefault();
                    dto.CurrentRoundName = lastSlot.CurrentRound.RoundName.Name;
                    dto.TatInDays = _applicationUtilities.CalculateTatDays(lastSlot.InterviewRoundCompleteDate ?? lastSlot?.CreatedAt ?? DateTime.UtcNow, null);
                    dto.Panel = ([.. (lastSlot!.Panel ?? []).Concat((lastSlot.CurrentRound?.Panel ?? []))
                                                       .Select(x => x)
                                                       .Distinct()]);
                    dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                    dto.Date = lastSlot.Date;
                    dto.Time = lastSlot.Time;
                }

                if (pageData.StartDate != null && pageData.EndDate != null)
                    resultDtos = [.. resultDtos.Where(x =>
                                     {
                                         var dateTime = (x.Date?.Add(x.Time ?? TimeSpan.Zero)) ?? DateTime.MinValue;
                                         return dateTime >= pageData.StartDate.Value && dateTime <= pageData.EndDate.Value;
                                     })
                                 ];
                if (loggedInUser.RoleId == (int)ROLES.PANEL)
                {
                    resultDtos = resultDtos.Where(x => x.Panel != null && x.Panel!.Contains(loggedInUser.UserId ?? 0)).ToList();
                }

                return PaginationHelper.GetPagedResult<GetInterviewSlotDto>(pageData, resultDtos.AsEnumerable());

            }, "Candidate feedback updated successfully.");
        }

        public async Task<IEnumerable<GetInterviewSlotDto>> GetUpcomingInterviewList(int? hiringRequestId)
        {
            var result = await _candidateFormRepository.GetListAsync(query => query
                                .Include(x => x.Partner)
                                .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                .ThenInclude(x => x!.CurrentRound)
                                .ThenInclude(x => x!.RoundName)
                                .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                .ThenInclude(x => x!.CandidateInterviewStatus)
                                .Include(x => x.HiringRequest)
                                .ThenInclude(x => x!.InterviewRounds!)
                                .ThenInclude(x => x!.RoundName)
                                .Where(x => x.IsFreezed != true
                                && x.HiringRequestId == hiringRequestId && x.HiringRequest!.InterviewRounds!.Any() && x.InterviewSlots!.Any()
                                && (x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING)));

            foreach (var item in result)
            {
                item.HiringRequest!.InterviewRounds = [.. item.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(item.Id)))];
            }

            var dtos = _mapper.Map<IEnumerable<GetInterviewSlotDto>>(result);

            var resultDtos = new List<GetInterviewSlotDto>();

            foreach (var dto in dtos)
            {
                var currentCandidate = result.FirstOrDefault(x => x.Id == dto.CandidateId);
                if (currentCandidate == null) continue;

                var candidateInterviewRounds = currentCandidate.HiringRequest?.InterviewRounds?
                                                    .OrderBy(x => x.RoundNumber)
                                                    .ToList();

                if (candidateInterviewRounds == null || !candidateInterviewRounds.Any())
                    continue;

                var cleanedSlots = currentCandidate.InterviewSlots?
                                      .OrderByDescending(x => x.Id)
                                      .GroupBy(slot => new { slot.CandidateId, slot.CurrentRoundId })
                                      .Select(group => group.First())
                                      .ToList();

                if (cleanedSlots == null || !cleanedSlots.Any())
                    continue;

                cleanedSlots = cleanedSlots!.Where(x => x.CurrentRound != null && x.CurrentRound!.RoundNameId != (int)INTERVIEW_ROUND.SCREENING).ToList();

                var currentSlot = cleanedSlots.FirstOrDefault();

                if (currentSlot != null && currentSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED)
                {
                    dto.Panel = currentSlot.CurrentRound!.Panel;
                    dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                    dto.AvailableDays = currentSlot.CurrentRound!.AvailableDays;
                    dto.InterviewSlotId = currentSlot.Id;
                    dto.CurrentRoundId = currentSlot.CurrentRoundId;
                    dto.CurrentRoundName = currentSlot.CurrentRound?.RoundName?.Name;
                    dto.InterviewSlotId = currentSlot.Id;
                    dto.Date = currentSlot.Date;
                    dto.Time = currentSlot.Time;
                    dto.PartnerComments = currentSlot.PartnerInterviewAcceptanceComments;
                    dto.CandidateInterviewStatusId = currentSlot.CandidateInterviewStatusId;
                    dto.CandidateInterviewStatusName = currentSlot.CandidateInterviewStatus?.Name;
                    dto.NoticePeriod = currentCandidate.NoticePeriod;
                    dto.Phone = currentCandidate.PhoneNumber;
                }

                if (dto.CurrentRoundId != null)
                    resultDtos.Add(dto);

            }

            return resultDtos.OrderByDescending(x => x.Date).AsEnumerable();
        }

        public async Task<ApiResponseDto<string>> EditCandidateInterviewSlot(EditInterviewSlotDto dto)
        {
            return await ExecuteAsync(async () =>
            {

                var loggedInUserDetails = _helperMethods.GetUserDetails();
                var interviewSlot = await _slotAllocationRepository.GetAsync(dto.InterviewSlotId);

                interviewSlot.Panel = dto.Panel;
                interviewSlot.Date = dto.Date;
                interviewSlot.Time = dto.Time;
                interviewSlot.ValidityHours = dto.ValidityHours;
                interviewSlot.Duration = dto.Duration;
                interviewSlot.CandidateInterviewStatusId = dto.CandidateInterviewStatusId;
                interviewSlot.HMAdditionalComments = dto.HMAdditionalComments;
                interviewSlot.LastStatusUpdated = DateTime.UtcNow;

                if (interviewSlot.CandidateInterviewStatusId == null 
                || interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED
                || interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.RESHEDULED
                || interviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.DECLINED)
                {
                    interviewSlot.IsPartnerAccepted = null;
                    interviewSlot.PartenrAcceptedOn = null;
                    interviewSlot.PartnerInterviewAcceptanceComments = null;
                    interviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.PENDING;
                }

                await _slotAllocationRepository.UpdateAsync(interviewSlot, false);

                await _interviewActionRepository.AddAsync(new InterviewActionLog
                {
                    InterviewSlotId = interviewSlot.Id,
                    ActionType = (int)INTERVIEW_ACTION_TYPE.RESCHEDULED,
                    Comments = dto.HMAdditionalComments,
                    PerformedByUserId = loggedInUserDetails.UserId,
                });

                // Assign Panel roles to the Panel members
                if (interviewSlot?.Panel?.Count > 0)
                {
                    await _helperMethods.AddUserRoles(interviewSlot.Panel!, (int)ROLES.PANEL);
                }

            }, $"Interview slot {(dto.CandidateInterviewStatusId == null ? "added" : "edited")} successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateInterviewFeedbackDetailsDto>> GetCandidateInterviewFeedbackDetails(int? candidateId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await (
                    from c in _context.CandidateForms
                    join intake in _context.M_MasterData on c.IntakeStatusId equals intake.Id
                    join h in _context.Hiring on (c.OriginalHiringRequestId ?? c.HiringRequestId) equals h.Id
                    join ir in _context.InterviewRounds on h.Id equals ir.HiringRequestId
                    join isa in _context.InterviewSlotAllocation on new { CandidateId = c.Id, CurrentRoundId = ir.Id }
                                                                equals new
                                                                {
                                                                    CandidateId = isa.CandidateId ?? 0,
                                                                    CurrentRoundId = isa.CurrentRoundId ?? 0
                                                                }
                    join cif in _context.CandidateInterviewFeedBack on isa.Id equals cif.InterviewSlotId into cifGroup
                    from cif in cifGroup.DefaultIfEmpty()
                    join category in _context.M_MasterData on cif.FeedbackCategoryId equals category.Id into categoryGroup
                    from category in categoryGroup.DefaultIfEmpty()
                    join criteria in _context.M_MasterData on cif.CriteriaOptionId equals criteria.Id into criteriaGroup
                    from criteria in criteriaGroup.DefaultIfEmpty()
                    join status in _context.M_MasterData on isa.CandidateInterviewStatusId equals status.Id into statusGroup
                    from status in statusGroup.DefaultIfEmpty()
                    where c.Id == candidateId
                    group new { c, ir, isa, cif, category, criteria, status, intake } by new { c.Id, c.FullName, c.CandidateCode, intake.Name } into g
                    select new GetCandidateInterviewFeedbackDetailsDto
                    {
                        CandidateId = g.Key.Id,
                        CandidateName = g.Key.FullName,
                        CandidateCode = g.Key.CandidateCode,
                        FinalStatus = g.Key.Name,
                        GetCnadidateInterviewRoundFeedbackDetailsDtos = (
                            from item in g
                            group item by new { item.ir.Id, item.ir.RoundNameId } into roundGroup
                            select new GetCnadidateInterviewRoundFeedbackDetailsDto
                            {
                                InterviewSlotId = roundGroup.FirstOrDefault().isa!.Id,
                                InterviewDate = roundGroup.FirstOrDefault().isa!.Date,
                                InterviewTime = roundGroup.FirstOrDefault().isa!.Time,
                                InterviewRoundName = roundGroup.FirstOrDefault().ir.RoundName.Name,
                                InterviewModeName = roundGroup.FirstOrDefault().ir.InterviewMode.Name,
                                CandidateInterviewStatusName = roundGroup.FirstOrDefault().status!.Name,
                                Comments = roundGroup.FirstOrDefault().ir!.Comments,
                                InterviewPanel = roundGroup.FirstOrDefault().ir!.Panel,
                                InterviewAdditionalPanel = roundGroup.FirstOrDefault().isa!.Panel,
                                PanelFeedbackComments = roundGroup.FirstOrDefault().isa!.Feedback,
                                FeedbackGivenByUserId = roundGroup.FirstOrDefault().isa.FeedbackGivenByUserId,
                                FeedbackGivenByUserName = roundGroup.FirstOrDefault().isa.FeedbackGivenByUser.FullName,
                                FeedbackGivenByUserRoleName = roundGroup.FirstOrDefault().isa.FeedbackGivenByUser.UserRoles.FirstOrDefault().Role.RoleName,
                                //FeedbackGivenOn = _applicationUtilities.GetLocalTime(roundGroup.FirstOrDefault().isa.PanelFeedbackGivenOn),
                                FeedbackGivenOn = roundGroup.FirstOrDefault().isa.PanelFeedbackGivenOn,
                                FeedbackCategoryName = roundGroup.FirstOrDefault().category!.Name,
                                FeedbackCategoryDetails = (
                                    from feedback in roundGroup
                                    where feedback.cif != null
                                    select new GetFeedbackCategoryDetailsDto
                                    {
                                        Comments = feedback.cif.Comments,
                                        Rating = feedback.cif.Rating,
                                        CriteriaOptionName = feedback.criteria!.Name
                                    }).ToList()
                            }).ToList()
                    }).FirstOrDefaultAsync();


                foreach (var item in result.GetCnadidateInterviewRoundFeedbackDetailsDtos)
                {
                    item.InterviewPanelNames = item?.InterviewPanel != null ? string.Join(", ", _context.Users.Where(ud => item.InterviewPanel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                    item.InterviewAdditionalPanelNames = item?.InterviewAdditionalPanel != null ? string.Join(", ", _context.Users.Where(ud => item.InterviewAdditionalPanel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                }

                return result ?? new GetCandidateInterviewFeedbackDetailsDto();

            }, "Feedback details fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetUnallocatedPartnerCandidatesList(CandidateAwaitingSlotListPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var result = await _candidateFormRepository.GetListAsync(query => query
                                    .Include(x => x.Partner)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.RoundName)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CurrentRound)
                                    .ThenInclude(x => x!.InterviewMode)
                                    .Include(x => x.InterviewSlots!.Where(x => x.CurrentRoundId != null))
                                    .ThenInclude(x => x!.CandidateInterviewStatus)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.RoundName)
                                    .Include(x => x.HiringRequest)
                                    .ThenInclude(x => x!.InterviewRounds!)
                                    .ThenInclude(x => x!.InterviewMode)
                                    .Where(x => x.IsFreezed != true
                                    && x.HiringRequest!.InterviewRounds!.Any()
                                    && (x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING || x.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING)
                                    && (
                                        (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.RMOwner) ||
                                        (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && x.PartnerId == loggedInUserDetails.PartnerId)
                                       )
                                    ));

                foreach (var item in result)
                {
                    item.HiringRequest!.InterviewRounds = [.. item.HiringRequest.InterviewRounds!.Where(r => r.IsAddSpecificCandidates == false || (r.IsAddSpecificCandidates == true && r.Candidates!.Contains(item.Id)))];
                }

                var dtos = _mapper.Map<IEnumerable<GetInterviewSlotDto>>(result);

                var resultDtos = new List<GetInterviewSlotDto>();

                foreach (var dto in dtos)
                {
                    var currentCandidate = result.FirstOrDefault(x => x.Id == dto.CandidateId);

                    if (currentCandidate == null) continue;

                    var candidateInterviewRounds = currentCandidate.HiringRequest?.InterviewRounds?
                                                        .OrderBy(x => x.RoundNumber)
                                                        .ToList();

                    if (candidateInterviewRounds == null || candidateInterviewRounds.Count == 0)
                        continue;

                    var cleanedSlots = currentCandidate.InterviewSlots?
                                          .OrderByDescending(x => x.Id)
                                          .GroupBy(slot => new { slot.CandidateId, slot.CurrentRoundId })
                                          .Select(group => group.First())
                                          .ToList();

                    var currentSlot = cleanedSlots!.FirstOrDefault();

                    if (currentSlot == null)
                    {
                        var nextRound = candidateInterviewRounds.FirstOrDefault();

                        if (nextRound != null && (nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.PHONE_CALL
                        || nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.PROFILE_REVIEW
                        || nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.ONLINE_EXERCISE
                        || nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.CODING_EXERCISE))
                            continue;

                        if (nextRound != null)
                        {
                            dto.Panel = nextRound.Panel;
                            dto.AvailableDays = nextRound.AvailableDays;
                            dto.CurrentRoundId = nextRound.Id;
                            dto.CurrentRoundName = nextRound.RoundName?.Name;
                            dto.InterviewModeId = nextRound.ModeOfInterview;
                            dto.InterviewModeName = nextRound.InterviewMode?.Name;
                            dto.NoticePeriod = currentCandidate.NoticePeriod;
                            dto.HMComments = nextRound.Comments;
                            dto.Phone = currentCandidate.PhoneNumber;
                            dto.TatInDays = _applicationUtilities.CalculateTatDays(currentCandidate.ReUploadedCandidateOn ?? currentCandidate.CreatedAt ?? DateTime.UtcNow, null);
                            dto.CreatedAt = currentCandidate.CreatedAt;
                            dto.UpdatedAt = currentCandidate.UpdatedAt;
                            dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;

                            resultDtos.Add(dto);
                            continue;
                        }
                    }

                    if (currentSlot != null && currentSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                    {
                        var currentIndex = candidateInterviewRounds.FindIndex(r => r.Id == currentSlot.CurrentRoundId);
                        var nextRound = (currentIndex >= 0 && currentIndex < candidateInterviewRounds.Count() - 1)
                                        ? candidateInterviewRounds[currentIndex + 1]
                                        : null;

                        if (nextRound != null && (nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.PHONE_CALL
                        || nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.PROFILE_REVIEW
                        || nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.ONLINE_EXERCISE
                        || nextRound?.ModeOfInterview == (int)INTERVIEW_MODE.CODING_EXERCISE))
                            continue;

                        if (nextRound != null)
                        {
                            dto.Panel = nextRound.Panel;
                            dto.PanelNames = await _helperMethods.GetUserNamesStringAsync(dto.Panel);
                            dto.AvailableDays = nextRound.AvailableDays;

                            dto.CurrentRoundId = nextRound.Id;
                            dto.CurrentRoundName = nextRound.RoundName?.Name;
                            dto.InterviewModeId = nextRound.ModeOfInterview;
                            dto.InterviewModeName = nextRound.InterviewMode?.Name;
                            dto.NoticePeriod = currentCandidate.NoticePeriod;
                            dto.HMComments = nextRound.Comments;
                            dto.Phone = currentCandidate.PhoneNumber;
                            dto.TatInDays = _applicationUtilities.CalculateTatDays(currentSlot.InterviewRoundCompleteDate ?? DateTime.UtcNow, null);
                            dto.CreatedAt = currentSlot.CreatedAt;
                            dto.UpdatedAt = currentSlot.UpdatedAt;
                        }
                    }
                    else if (currentSlot != null && currentSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.SELECTED)
                    {
                        if (currentSlot?.CurrentRound?.RoundNameId == (int)INTERVIEW_ROUND.SCREENING
                        && (currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.PHONE_CALL || currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.PROFILE_REVIEW
                        || currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.ONLINE_EXERCISE || currentSlot?.CurrentRound?.ModeOfInterview == (int)INTERVIEW_MODE.CODING_EXERCISE))
                            continue;

                        dto.Panel = currentSlot!.CurrentRound!.Panel;
                        dto.PanelNames = dto.Panel != null ? string.Join(", ", _context.Users.Where(ud => dto.Panel.Contains(ud.UserId)).Select(ud => ud.FullName)) : string.Empty;
                        dto.AdditionalPanel = currentSlot!.Panel;
                        dto.AdditionalPanelNames = await _helperMethods.GetUserNamesStringAsync(currentSlot.Panel);
                        dto.AvailableDays = currentSlot.CurrentRound!.AvailableDays;
                        dto.InterviewSlotId = currentSlot.Id;
                        dto.CurrentRoundId = currentSlot.CurrentRoundId;
                        dto.CurrentRoundName = currentSlot.CurrentRound?.RoundName?.Name;
                        dto.InterviewSlotId = currentSlot.Id;
                        dto.Date = currentSlot.Date;
                        dto.Time = currentSlot.Time;
                        dto.Duration = currentSlot.Duration;
                        dto.ValidityHours = currentSlot.ValidityHours;
                        dto.PartnerComments = currentSlot.PartnerInterviewAcceptanceComments;
                        dto.CandidateInterviewStatusId = currentSlot.CandidateInterviewStatusId;
                        dto.CandidateInterviewStatusName = currentSlot.CandidateInterviewStatus?.Name;
                        dto.InterviewModeId = currentSlot.CurrentRound!.ModeOfInterview;
                        dto.InterviewModeName = currentSlot.CurrentRound!.InterviewMode?.Name;
                        dto.RejectionCount = currentSlot.RejectionCount;
                        dto.RescheduleCount = currentSlot.RescheduleCount;
                        dto.NoticePeriod = currentCandidate.NoticePeriod;
                        dto.Phone = currentCandidate.PhoneNumber;
                        dto.HMComments = currentSlot.CurrentRound?.Comments;
                        dto.TatInDays = _applicationUtilities.CalculateTatDays(currentSlot.InterviewRoundCompleteDate ?? DateTime.UtcNow, null);
                        dto.CreatedAt = currentSlot.CreatedAt;
                        dto.UpdatedAt = currentSlot.UpdatedAt;
                    }

                    if (dto.CurrentRoundId != null)
                        resultDtos.Add(dto);
                }

                if (pageData.StartDate != null && pageData.EndDate != null)
                    resultDtos = [.. resultDtos.Where(x => (x.UpdatedAt ?? x.CreatedAt ?? DateTime.UtcNow).Date >= pageData.StartDate.Value.Date && (x.UpdatedAt ?? x.CreatedAt ?? DateTime.UtcNow).Date <= pageData.EndDate.Value.Date)];

                resultDtos = [.. resultDtos.Where(x => x.CandidateInterviewStatusId == null || x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.RESHEDULED)];

                return PaginationHelper.GetPagedResult<GetInterviewSlotDto>(pageData, resultDtos.AsEnumerable());

            }, "Partners candidates Interviewlist fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> ReconsiderCandidate(ReconsiderCandidateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var candidate = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == dto.CandidateId && x.HiringRequestId == dto.HiringRequestId));

                var latestInterviewSlot = await _slotAllocationRepository.GetAsync(query => query.Include(x => x.CurrentRound)
                                                                                                 .Where(x => x.CandidateId == dto.CandidateId
                                                                                                        && x.CurrentRound.HiringRequestId == dto.HiringRequestId)
                                                                                                 .OrderByDescending(x => x.CurrentRoundId));

                var hiring = await _hiringRequestRepository.GetAsync(query => query.Include(x => x.HiringStatus).Where(x => x.Id == dto.HiringRequestId));

                if (hiring.HiringStatusId != (int)HIRING_STATUS.WIP && hiring.HiringStatusId != (int)HIRING_STATUS.CANDIDATE_IDENTIFIED && hiring.HiringStatusId != (int)HIRING_STATUS.OFFER_ACCEPTED)
                    throw new Exception($"Assigned HRQ is {hiring.HiringStatus?.Name}");

                if (latestInterviewSlot != null && latestInterviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.REJECTED)
                {
                    latestInterviewSlot.CandidateInterviewStatusId = null;
                    latestInterviewSlot.Date = null;
                    latestInterviewSlot.Time = null;
                    latestInterviewSlot.FeedbackGivenByUserId = null;
                    latestInterviewSlot.PanelFeedbackGivenOn = null;
                    latestInterviewSlot.ValidityHours = null;
                    latestInterviewSlot.Duration = null;
                    latestInterviewSlot.HMAdditionalComments = null;
                    latestInterviewSlot.Panel = null;
                    latestInterviewSlot.IsInterviewCompleted = null;
                    latestInterviewSlot.Feedback = null;
                    latestInterviewSlot.InterviewRoundCompleteDate = null;
                    latestInterviewSlot.LastStatusUpdated = DateTime.UtcNow;
                    latestInterviewSlot.RescheduleCount = null;
                    latestInterviewSlot.RejectionCount = null;

                    await _slotAllocationRepository.UpdateAsync(latestInterviewSlot, false);
                }

                var reconsiderationDetails = await _candidateReconsiderationHistoryRepository.AddAsync(new CandidateReconsiderationHistory()
                {
                    CandidateId = dto.CandidateId,
                    HiringRequestId = dto.HiringRequestId,
                    ReconsideredByUserId = loggedInUserDetails.UserId,
                    LastInterviewSlotId = latestInterviewSlot?.Id,
                    ReconsiderReasonId = dto.ReconsiderReasonId,
                    ReconsiderComments = dto.ReconsiderComments,
                    ReconsideredOn = DateTime.Now
                });

                candidate.CandidateReconsiderationHistoryId = reconsiderationDetails?.Id;
                candidate.IntakeStatusId = candidate.PreviousIntakeStatusId ?? await _candidateHelperMethods.GetIntakeStatusBasedOnInterviewRoundStatus(candidate.HiringRequestId, candidate.Id);
                candidate.CandidateDroppedOn = null;
                candidate.PreviousIntakeStatusId = null;

                await _candidateFormRepository.UpdateAsync(candidate, false);

                var candidateHistroy = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.PartnerId == candidate.PartnerId && x.CandidateId == candidate.Id && x.HiringRequestId == candidate.HiringRequestId));

                if (candidateHistroy != null)
                {
                    candidateHistroy.IntakeStatusId = candidate.IntakeStatusId;
                    candidateHistroy.CandidateDroppedOn = null;
                    candidateHistroy.CandidateReconsiderationHistoryId = reconsiderationDetails?.Id;

                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistroy, false);
                }

            }, "Candidate reconsiderd successfully.");
        }

        #endregion
    }
}
