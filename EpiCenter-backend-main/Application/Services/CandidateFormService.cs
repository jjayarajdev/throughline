using AutoMapper;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Vml;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.CandidateRateCard;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Domain.Shared.HelperClasses;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Data;
using System.Linq;
using static EpicenterX.Utility.Utility;
using Users = EpicenterX.Domain.Entities.Users;

namespace EpicenterX.Application.Services
{
    public class CandidateFormService(AppDBContext _context,
                                      IGenericRepository<Candidate> _candidateFormRepository,
                                      IGenericRepository<CandidateHistory> _candidateFormHistoryRepository,
                                      IGenericRepository<CandidateRateCard> _candidateRateCardRepository,
                                      IGenericRepository<Partner> _partnerRepository,
                                      IConfiguration _configuration,
                                      ICommuncationService _communicationService,
                                      IGenericRepository<Users> _userRepository,
                                      IGenericRepository<HiringRequest> _hiringRepository,
                                      ICandidateHelperMethods _candidateHelperMethods,
                                      IGenericRepository<ContactMatrix> _contactMatrixRepository,
                                      IHelperMethods _helperMethods,
                                      IGenericRepository<CandidatePersonalDetails> _candidatePersonalDetailsRepository,
                                      IGenericRepository<CandidateBgvDetails> _candidateBGVDetailsRepository,
                                      IGenericRepository<AssetDetails> _assetDetailsRepository,
                                      IGenericRepository<DocumentDetails> _docRepository,
                                      IGenericRepository<JoiningRescheduleHistory> _joiningResceduleRepository,
                                      IFileService _fileService,
                                      IApplicationUtilities _applicationUtilities,
                                      IGenericRepository<InterviewRound> _interviewRoundRepository,
                                      IGenericRepository<InterviewSlot> _interviewSlotRepository,
                                      IMapper _mapper) : BaseService, ICandidateFormService
    {

        #region CandidateForms

        public async Task<ApiResponseDto<CandidateDataDto>> GetCandidateInterviewHistory(string candidateCode, int? partnerId, bool isAdmin = false)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();

                var candidate = await _context.CandidateForms.Include(x => x.CandidateDropOrReintiateByUser)
                                                             .Where(c => c.CandidateCode == candidateCode)
                                                             .AsNoTracking()
                                                             .Select(c => new CandidateDataDto
                                                             {
                                                                 CandidateId = c.Id,
                                                                 FullName = c.FullName,
                                                                 CandidateCode = c.CandidateCode,
                                                                 Email = c.Email,
                                                                 PhoneNumber = c.PhoneNumber,
                                                                 PrimarySkills = string.Join("; ", _context.M_Skills.Where(x => c.PrimarySkillIds != null && c.PrimarySkillIds.Contains(x.Id)).Select(x => x.Name)) ?? string.Empty,
                                                                 SecondarySkills = string.Join("; ", _context.M_Skills.Where(x => c.SecondarySkillIds != null && c.SecondarySkillIds.Contains(x.Id)).Select(x => x.Name)) ?? string.Empty,
                                                                 Country = c.Country.Name,
                                                                 State = c.State.Name,
                                                                 CityName = c.City.Name,
                                                                 Diversity = c.Diversity,
                                                                 NoticePeriodDays = c.NoticePeriod,
                                                                 RelevantExperienceYears = c.RelevantExperience,
                                                                 CurrentlyWorking = c.CurrentlyWorking,
                                                                 IntakeStatusId = c.IntakeStatusId,
                                                                 IntakeStatus = c.IntakeStatus.Name,
                                                                 CurrentLastOrganisation = c.CurrentOrganisation,
                                                                 LastWorkingDate = c.LastWorkingDay,
                                                                 Resume = c.Resume != null ? _mapper.Map<DocumentDetailDto>(c.Resume) : null,
                                                                 IsReferred = c.IsReferred,
                                                                 ReferredByEmail = c.ReferredBy,
                                                                 CreatedAt = c.ReUploadedCandidateOn ?? c.CreatedAt,
                                                                 CandidateDropOrReintiateByUserComments = c.CandidateDropOrReintiateByUserComments,
                                                                 CandidateDropOrReintiateByUserName = c.CandidateDropOrReintiateByUser.FullName,
                                                                 CandidateDroppedOrReintiatedOn = c.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP ? c.CandidateDroppedOn :
                                                                                                   c.CandidateReintiatedOn,
                                                                 IsDropped = c.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP ? true : (c.CandidateDropOrReintiateByUserId != null ? false : null)
                                                             })
                                                             .FirstOrDefaultAsync();


                if (candidate != null)
                {
                    var _persomalDetails = await _context.CandidatePersonalDetails.Include(x => x.ProfileTracker).Where(x => x.CandidateId == candidate.CandidateId).FirstOrDefaultAsync();

                    candidate.DateOfJoining = _persomalDetails?.DateOfJoining;
                    candidate.EmployeeId = _persomalDetails?.ProfileTracker?.EmployeeId;

                    var candidateHistories = await _context.CandidateFormHistory.Where(h => h.CandidateId == candidate.CandidateId && (loggedInUser.RoleId != (int)ROLES.PARTNER || h.PartnerId == loggedInUser.PartnerId))
                                                    .Include(x => x.Partner)
                                                    .Include(x => x.HiringRequest)
                                                    .ThenInclude(x => x.HiringStatus)
                                                    .Include(x => x.HiringRequest)
                                                    .ThenInclude(x => x.InterviewRounds)
                                                    .ThenInclude(x => x.RoundName)
                                                     .Include(x => x.HiringRequest)
                                                    .ThenInclude(x => x.InterviewRounds)
                                                    .ThenInclude(x => x.InterviewMode)
                                                    .AsNoTracking()
                                                    .ToListAsync();

                    var interviewSlots = await _context.InterviewSlotAllocation.Where(i => i.Candidate.CandidateCode == candidateCode)
                                                                        .Include(i => i.CandidateInterviewStatus)
                                                                        .Include(i => i.CurrentRound)
                                                                            .ThenInclude(r => r.HiringRequest)
                                                                                .ThenInclude(hr => hr.HiringStatus)
                                                                        .Include(i => i.CurrentRound.RoundName)
                                                                        .Include(i => i.CurrentRound.InterviewMode)
                                                                        .Include(i => i.FeedbackGivenByUser)
                                                                            .ThenInclude(u => u.UserRoles)
                                                                                .ThenInclude(ur => ur.Role)
                                                                        .Include(i => i.CandidateRating)
                                                                            .ThenInclude(r => r.CriteriaOption)
                                                                        .AsNoTracking()
                                                                        .ToListAsync();

                    if (candidate != null)
                    {
                        candidate.CandidateHistory = candidateHistories
                            .Select(history =>
                            {
                                var hiringRequest = history.HiringRequest;

                                if (hiringRequest == null || hiringRequest.InterviewRounds == null)
                                    return null;

                                var hrqId = hiringRequest.HrqId;
                                var roleHiredFor = hiringRequest.JobTitle ?? string.Empty;
                                var hiringStatus = hiringRequest.HiringStatus?.Name ?? string.Empty;
                                var partner = history.Partner?.PartnerName ?? string.Empty;

                                var rounds = new List<CandidateInterviewFeedbackDto>();
                                bool stopFurtherRounds = false;

                                foreach (var round in hiringRequest.InterviewRounds.OrderBy(r => r.RoundNumber))
                                {
                                    if (stopFurtherRounds) break;

                                    var slot = interviewSlots.FirstOrDefault(s => s.CurrentRoundId == round.Id);

                                    if (slot != null)
                                    {
                                        var feedbackDto = new CandidateInterviewFeedbackDto
                                        {
                                            InterviewRoundNumber = round.RoundNumber,
                                            InterviewRoundName = round.RoundName?.Name ?? string.Empty,
                                            InterviewPanelNames = string.Join(", ",
                                                _context.Users
                                                    .Where(u => round.Panel != null && round.Panel.Contains(u.UserId))
                                                    .Select(u => u.FullName)),
                                            InterviewAdditionalPanelNames = string.Join(", ",
                                                _context.Users
                                                    .Where(u => slot.Panel != null && slot.Panel.Contains(u.UserId))
                                                    .Select(u => u.FullName)),
                                            InterviewModeName = round.InterviewMode?.Name ?? string.Empty,
                                            InterviewDate = slot.Date,
                                            InterviewTime = slot.Time,
                                            Comments = (round.AddFeedbackCritria == true && slot.CandidateRating.Any())
                                                ? string.Empty
                                                : (slot.Feedback ?? string.Empty),
                                            CandidateInterviewStatusName = slot.CandidateInterviewStatus?.Name ?? "Pending",
                                            FeedbackGivenOn = slot.PanelFeedbackGivenOn,
                                            FeedbackGivenByUserId = slot.FeedbackGivenByUserId,
                                            FeedbackGivenByUserName = slot.FeedbackGivenByUser?.FullName ?? string.Empty,
                                            FeedbackGivenByUserRoleName = slot.FeedbackGivenByUser?.UserRoles
                                                ?.FirstOrDefault()
                                                ?.Role?.RoleName ?? string.Empty,
                                            FeedbackCategoryDetails = slot.CandidateRating?
                                                .Select(fd => new FeedbackCategoryDetailDto
                                                {
                                                    CriteriaOptionName = fd.CriteriaOption?.Name ?? string.Empty,
                                                    Rating = fd.Rating,
                                                    Comments = fd.Comments ?? string.Empty
                                                }).ToList() ?? new List<FeedbackCategoryDetailDto>(),
                                            InterviewStartDate = slot.InterviewRoundStartDate ?? slot.Date,
                                            InterviewCompletedDate = slot.InterviewRoundCompleteDate ?? slot.PanelFeedbackGivenOn,
                                            TatInDays = slot.Date == null ? 0 : _applicationUtilities.CalculateTatDays(slot.Date ?? DateTime.MinValue, slot.PanelFeedbackGivenOn)
                                        };

                                        rounds.Add(feedbackDto);

                                        // stop showing next rounds if rejected or selected
                                        if (slot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.SELECTED)
                                        {
                                            stopFurtherRounds = true;
                                        }
                                    }
                                    else
                                    {
                                        // pending round
                                        if (candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING || candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING)
                                            rounds.Add(new CandidateInterviewFeedbackDto
                                            {
                                                InterviewRoundNumber = round.RoundNumber,
                                                InterviewRoundName = round.RoundName?.Name ?? string.Empty,
                                                InterviewModeName = round.InterviewMode?.Name ?? string.Empty,
                                                CandidateInterviewStatusName = "Pending",
                                                InterviewPanelNames = string.Join(", ", _context.Users.Where(u => round.Panel != null && round.Panel.Contains(u.UserId)).Select(u => u.FullName)),
                                            });

                                        // once we add a pending round, don’t go further
                                        stopFurtherRounds = true;
                                    }
                                }

                                var candidateTatStartDate = (history.ReUploadedCandidateOn ?? history.CreatedAt ?? rounds.FirstOrDefault()?.InterviewStartDate);

                                return new CandidateInterviewHistoryDto
                                {
                                    Id = history.Id,
                                    HrqId = hrqId,
                                    RoleHiredFor = roleHiredFor,
                                    TatInDays = candidateTatStartDate == null ? 0 : _applicationUtilities.CalculateTatDays(candidateTatStartDate ?? DateTime.MinValue, rounds.LastOrDefault()?.InterviewCompletedDate),
                                    Partner = partner,
                                    HiringStatus = hiringStatus,
                                    CandidateInterviewFeedback = rounds.OrderByDescending(x => x.InterviewRoundNumber).ToList(),
                                    ProfileUploadedOn = history.ReUploadedCandidateOn ?? history.CreatedAt
                                };
                            })
                            .Where(x => x != null)
                            .OrderByDescending(x => x.ProfileUploadedOn)
                            .ToList();
                    }
                }

                return candidate ?? throw new Exception("Candidate details not found.");

            }, "Candidate Profile details fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<CandidateGridViewDto>>> GetPagedCandidateForms(PageDto pageData, int? partnerId, List<int>? intakeStatusId)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var grouped = await (from candidate in _context.CandidateFormHistory
                                     join currentCandidate in _context.CandidateForms on candidate.CandidateId equals currentCandidate.Id into currCandidate
                                     from currentCandidate in currCandidate.DefaultIfEmpty()
                                     join partner in _context.Partners on candidate.PartnerId equals partner.Id into partners
                                     from partner in partners.DefaultIfEmpty()
                                     join hiringRequest in _context.Hiring on candidate.HiringRequestId equals hiringRequest.Id into hiringRequests
                                     from hiringRequest in hiringRequests.DefaultIfEmpty()
                                     join resume in _context.DocumentDetails on candidate.ResumeId equals resume.Id into documents
                                     from resume in documents.DefaultIfEmpty()
                                     join intakeStatus in _context.M_MasterData on currentCandidate.IntakeStatusId equals intakeStatus.Id into intakeStatuses
                                     from intakeStatus in intakeStatuses.DefaultIfEmpty()
                                     join candidateStatus in _context.M_MasterData on candidate.CandidateStatusId equals candidateStatus.Id into candidateStatuses
                                     from candidateStatus in candidateStatuses.DefaultIfEmpty()
                                     where (intakeStatusId != null && intakeStatusId.Count > 0 && intakeStatusId.Contains(currentCandidate.IntakeStatusId ?? 0))
                                            && (candidate.PartnerId == (partnerId == null ? candidate.PartnerId : partnerId))
                                            && (loggedInUserDetails.RoleId != (int)ROLES.PARTNER || candidate.PartnerId == loggedInUserDetails.PartnerId)

                                     orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending

                                     select new
                                     {
                                         candidate,
                                         currentCandidate,
                                         partner,
                                         hiringRequest,
                                         resume,
                                         intakeStatus,
                                         candidateStatus
                                     }).ToListAsync();

                var latestRecords = grouped
                     .GroupBy(x => x.candidate.CandidateCode)
                     .Select(g => g.OrderByDescending(x => x.candidate.ReUploadedCandidateOn ?? x.candidate.UpdatedAt ?? x.candidate.CreatedAt).First())
                     .ToList();

                // Preload related hires and last interview slots like the export method so we can populate the same columns
                var hiringIds = latestRecords.Select(l => l.hiringRequest?.Id).Where(id => id != null).Select(id => id!.Value).Distinct().ToList();
                var hires = new List<HiringRequest>();
                if (hiringIds.Any())
                {
                    hires = await _context.Hiring
                        .Where(h => hiringIds.Contains(h.Id))
                        .Include(h => h.HiringStatus)
                        .Include(h => h.JobDetails)
                            .ThenInclude(j => j!.SubDomain)
                        .Include(h => h.Domain)
                        .Include(h => h.HiringManager)
                        .ToListAsync();
                }
                var hiresById = hires.ToDictionary(h => h.Id, h => h);

                var candidateIds = latestRecords.Select(l => l.candidate.CandidateId).Where(id => id != null).Select(id => id!.Value).Distinct().ToList();
                var lastSlots = new Dictionary<int, InterviewSlot>();
                if (candidateIds.Any())
                {
                    var slots = await _context.InterviewSlotAllocation
                        .Where(s => candidateIds.Contains(s.CandidateId ?? 0))
                        .Include(s => s.CurrentRound)
                            .ThenInclude(r => r.RoundName)
                        .Include(s => s.CandidateInterviewStatus)
                        .OrderByDescending(s => s.PanelFeedbackGivenOn ?? s.Date ?? DateTime.Now)
                        .ToListAsync();

                    lastSlots = slots
                        .Where(s => s.CandidateId != null)
                        .GroupBy(s => s.CandidateId!.Value)
                        .ToDictionary(g => g.Key, g => g.First());
                }

                // build DTO list with the same columns as export
                var latestPerCandidate = latestRecords
                    .Select(latest =>
                    {
                        var candidateHistory = latest.candidate;
                        var currentCandidate = latest.currentCandidate;
                        var partner = latest.partner;
                        var hiring = latest.hiringRequest != null && hiresById.ContainsKey(latest.hiringRequest.Id) ? hiresById[latest.hiringRequest.Id] : latest.hiringRequest;
                        var resume = latest.resume;

                        DateTime? profileUploadedOn = candidateHistory.ReUploadedCandidateOn ?? currentCandidate?.CreatedAt;
                        DateTime tatStart = profileUploadedOn ?? DateTime.UtcNow;

                        InterviewSlot? lastSlot = null;
                        if (candidateHistory.CandidateId.HasValue && lastSlots.TryGetValue(candidateHistory.CandidateId.Value, out var slot))
                            lastSlot = slot;

                        DateTime? tatEnd = lastSlot?.PanelFeedbackGivenOn ?? (DateTime?)DateTime.UtcNow;
                        int tatDays = _applicationUtilities.CalculateTatDays(tatStart, tatEnd);

                        DateTime? resumeUploadDate = resume?.CreatedAt ?? currentCandidate?.Resume?.CreatedAt;

                        string domainName = hiring?.Domain?.Name ?? string.Empty;
                        string subDomainName = hiring?.JobDetails?.SubDomain?.Name ?? string.Empty;

                        string hiringManagerName = hiring?.HiringManager?.FullName ?? string.Empty;

                        string lastInterviewRound = lastSlot?.CurrentRound?.RoundName?.Name ?? string.Empty;
                        string lastInterviewStatus = lastSlot?.CandidateInterviewStatus?.Name ?? string.Empty;
                        string lastInterviewFeedback = lastSlot?.Feedback ?? string.Empty;

                        DateTime? requestStart = hiring == null ? null : (DateTime?)hiring.RequestStartDate;
                        DateTime? onholdDate = hiring == null ? null : (DateTime?)hiring.OnholdDate;
                        DateTime? closedDate = hiring == null ? null : (DateTime?)hiring.ClosedDate;

                        // Map into CandidateGridViewDto (include export columns)
                        return new CandidateGridViewDto
                        {
                            Id = latest.candidate.CandidateId ?? 0,
                            CandidateCode = latest.candidate.CandidateCode,
                            FullName = latest.candidate.FullName,
                            Email = latest.candidate.Email,
                            PhoneNumber = latest.candidate.PhoneNumber,
                            Nickname = partner?.Nickname,
                            HrqId = hiring?.HrqId,
                            HrqStatus = hiring?.HiringStatus?.Name,
                            CandidateId = latest.candidate.CandidateId,
                            JobTitle = hiring?.JobTitle,
                            IntakeStatusName = latest.intakeStatus?.Name,
                            CandidateStatusName = latest.candidateStatus?.Name,
                            ProfileCreatedAt = profileUploadedOn ?? latest.currentCandidate.CreatedAt,
                            TATInDays = tatDays,
                            HrqAssignDate = requestStart,
                            DomainName = domainName,
                            SubDomainName = subDomainName,
                            RelevantExperience = latest.candidate.RelevantExperience,
                            PartnerName = partner?.Nickname ?? partner?.PartnerName,
                            ResumeUploadDate = resumeUploadDate,
                            HrqOnHoldDate = onholdDate,
                            HiringStartDate = requestStart,
                            HiringClosedDate = closedDate,
                            HiringManagerName = hiringManagerName,
                            LastInterviewRound = lastInterviewRound,
                            LastInterviewStatus = lastInterviewStatus,
                            LastInterviewFeedback = lastInterviewFeedback,
                            IsActive = latest.candidate.IsActive,
                            Resume = resume != null ? _mapper.Map<DocumentDetailDto>(resume) : latest.currentCandidate.Resume != null ? _mapper.Map<DocumentDetailDto>(latest.currentCandidate.Resume) : null,
                            InterviewCompletedOn = latest.candidate.InterviewCompletedOn
                        };
                    })
                    .OrderByDescending(x => x.ProfileCreatedAt)
                    .ToList();

                return PaginationHelper.GetPagedResult<CandidateGridViewDto>(pageData, latestPerCandidate);

            }, "Candidate forms fetched successfully.");
        }


        public async Task<ApiResponseDto<PagedResult<CandidateGridViewDto>>> GetPagedPartnerCandidateForms(PartnerTalentPoolPageDto pageData, int? partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                (DateTime financialYearStartDate, DateTime financialYearEndDate)? financialDateRange = null;

                if (pageData.FinancialYear != null && pageData.FinancialYear != 1 && pageData.QuarterId != null)
                    financialDateRange = await _helperMethods.GetFinancialQuarterRange(pageData.FinancialYear ?? 0, (FinancialQuarter)(pageData.QuarterId ?? 5));

                var grouped = await (from candidate in _context.CandidateFormHistory
                                     join currentCandidate in _context.CandidateForms on candidate.CandidateId equals currentCandidate.Id into currCandidate
                                     from currentCandidate in currCandidate.DefaultIfEmpty()
                                     join partner in _context.Partners on candidate.PartnerId equals partner.Id into partners
                                     from partner in partners.DefaultIfEmpty()
                                     join hiringRequest in _context.Hiring on candidate.HiringRequestId equals hiringRequest.Id into hiringRequests
                                     from hiringRequest in hiringRequests.DefaultIfEmpty()
                                     join resume in _context.DocumentDetails on candidate.ResumeId equals resume.Id into documents
                                     from resume in documents.DefaultIfEmpty()
                                     join intakeStatus in _context.M_MasterData on currentCandidate.IntakeStatusId equals intakeStatus.Id into intakeStatuses
                                     from intakeStatus in intakeStatuses.DefaultIfEmpty()
                                     join candidateStatus in _context.M_MasterData on candidate.CandidateStatusId equals candidateStatus.Id into candidateStatuses
                                     from candidateStatus in candidateStatuses.DefaultIfEmpty()
                                     where (pageData.IntakeStatusIds != null && pageData.IntakeStatusIds.Count > 0 && pageData.IntakeStatusIds.Contains(currentCandidate.IntakeStatusId ?? 0))
                                            && (candidate.PartnerId == (partnerId == null ? candidate.PartnerId : partnerId))
                                            && (loggedInUserDetails.RoleId != (int)ROLES.PARTNER || candidate.PartnerId == loggedInUserDetails.PartnerId)

                                     orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending

                                     select new
                                     {
                                         candidate,
                                         currentCandidate,
                                         partner,
                                         hiringRequest,
                                         resume,
                                         intakeStatus,
                                         candidateStatus
                                     }).ToListAsync();

                var latestRecords = grouped
                     .GroupBy(x => x.candidate.CandidateCode)
                     .Select(g => g.OrderByDescending(x => x.candidate.ReUploadedCandidateOn ?? x.candidate.UpdatedAt ?? x.candidate.CreatedAt).First())
                     .ToList();

                // Preload related hires and last interview slots like the export method so we can populate the same columns
                var hiringIds = latestRecords.Select(l => l.hiringRequest?.Id).Where(id => id != null).Select(id => id!.Value).Distinct().ToList();
                var hires = new List<HiringRequest>();
                if (hiringIds.Any())
                {
                    hires = await _context.Hiring
                        .Where(h => hiringIds.Contains(h.Id))
                        .Include(h => h.HiringStatus)
                        .Include(h => h.JobDetails)
                            .ThenInclude(j => j!.SubDomain)
                        .Include(h => h.Domain)
                        .Include(h => h.HiringManager)
                        .ToListAsync();
                }
                var hiresById = hires.ToDictionary(h => h.Id, h => h);

                var candidateIds = latestRecords.Select(l => l.candidate.CandidateId).Where(id => id != null).Select(id => id!.Value).Distinct().ToList();
                var lastSlots = new Dictionary<int, InterviewSlot>();
                if (candidateIds.Any())
                {
                    var slots = await _context.InterviewSlotAllocation
                        .Where(s => candidateIds.Contains(s.CandidateId ?? 0))
                        .Include(s => s.CurrentRound)
                            .ThenInclude(r => r.RoundName)
                        .Include(s => s.CandidateInterviewStatus)
                        .OrderByDescending(s => s.PanelFeedbackGivenOn ?? s.Date ?? DateTime.Now)
                        .ToListAsync();

                    lastSlots = slots
                        .Where(s => s.CandidateId != null)
                        .GroupBy(s => s.CandidateId!.Value)
                        .ToDictionary(g => g.Key, g => g.First());
                }

                // build DTO list with the same columns as export
                List<CandidateGridViewDto> latestPerCandidate = latestRecords
                    .Select(latest =>
                    {
                        var candidateHistory = latest.candidate;
                        var currentCandidate = latest.currentCandidate;
                        var partner = latest.partner;
                        var hiring = latest.hiringRequest != null && hiresById.ContainsKey(latest.hiringRequest.Id) ? hiresById[latest.hiringRequest.Id] : latest.hiringRequest;
                        var resume = latest.resume;

                        DateTime? profileUploadedOn = candidateHistory.ReUploadedCandidateOn ?? currentCandidate?.CreatedAt;
                        DateTime tatStart = profileUploadedOn ?? DateTime.UtcNow;

                        InterviewSlot? lastSlot = null;
                        if (candidateHistory.CandidateId.HasValue && lastSlots.TryGetValue(candidateHistory.CandidateId.Value, out var slot))
                            lastSlot = slot;

                        DateTime? tatEnd = lastSlot?.PanelFeedbackGivenOn ?? (DateTime?)DateTime.UtcNow;
                        int tatDays = _applicationUtilities.CalculateTatDays(tatStart, tatEnd);

                        DateTime? resumeUploadDate = resume?.CreatedAt ?? currentCandidate?.Resume?.CreatedAt;

                        string domainName = hiring?.Domain?.Name ?? string.Empty;
                        string subDomainName = hiring?.JobDetails?.SubDomain?.Name ?? string.Empty;

                        string hiringManagerName = hiring?.HiringManager?.FullName ?? string.Empty;

                        string lastInterviewRound = lastSlot?.CurrentRound?.RoundName?.Name ?? string.Empty;
                        string lastInterviewStatus = lastSlot?.CandidateInterviewStatus?.Name ?? string.Empty;
                        string lastInterviewFeedback = lastSlot?.Feedback ?? string.Empty;

                        DateTime? requestStart = hiring == null ? null : (DateTime?)hiring.RequestStartDate;
                        DateTime? onholdDate = hiring == null ? null : (DateTime?)hiring.OnholdDate;
                        DateTime? closedDate = hiring == null ? null : (DateTime?)hiring.ClosedDate;

                        // Map into CandidateGridViewDto (include export columns)
                        return new CandidateGridViewDto
                        {
                            Id = latest.candidate.CandidateId ?? 0,
                            CandidateCode = latest.candidate.CandidateCode,
                            FullName = latest.candidate.FullName,
                            Email = latest.candidate.Email,
                            PhoneNumber = latest.candidate.PhoneNumber,
                            Nickname = partner?.Nickname,
                            HrqId = hiring?.HrqId,
                            HrqStatus = hiring?.HiringStatus?.Name,
                            CandidateId = latest.candidate.CandidateId,
                            JobTitle = hiring?.JobTitle,
                            IntakeStatusName = latest.intakeStatus?.Name,
                            CandidateStatusName = latest.candidateStatus?.Name,
                            ProfileCreatedAt = profileUploadedOn ?? latest.currentCandidate.CreatedAt,
                            TATInDays = tatDays,
                            HrqAssignDate = requestStart,
                            DomainName = domainName,
                            SubDomainName = subDomainName,
                            RelevantExperience = latest.candidate.RelevantExperience,
                            PartnerName = partner?.Nickname ?? partner?.PartnerName,
                            ResumeUploadDate = resumeUploadDate,
                            HrqOnHoldDate = onholdDate,
                            HiringStartDate = requestStart,
                            HiringClosedDate = closedDate,
                            HiringManagerName = hiringManagerName,
                            LastInterviewRound = lastInterviewRound,
                            LastInterviewStatus = lastInterviewStatus,
                            LastInterviewFeedback = lastInterviewFeedback,
                            IsActive = latest.candidate.IsActive,
                            Resume = resume != null ? _mapper.Map<DocumentDetailDto>(resume) : latest.currentCandidate.Resume != null ? _mapper.Map<DocumentDetailDto>(latest.currentCandidate.Resume) : null,
                            InterviewCompletedOn = latest.candidate.InterviewCompletedOn
                        };
                    })
                    .OrderByDescending(x => x.ProfileCreatedAt)
                    .ToList();

                if (latestPerCandidate.Count() > 0)
                    latestPerCandidate = latestPerCandidate.Where(c =>
                    {
                        if (financialDateRange == null)
                            return true;

                        return c.ProfileCreatedAt >= financialDateRange.Value.financialYearStartDate.Date &&
                               c.ProfileCreatedAt <= financialDateRange.Value.financialYearEndDate.Date;
                    }).ToList();

                return PaginationHelper.GetPagedResult<CandidateGridViewDto>(pageData, latestPerCandidate);

            }, "Candidate forms fetched successfully.");
        }

        public async Task<byte[]> ExportCandidateFormsToExcel(int? partnerId, PartnerTalentPoolPageDto pageData)
        {
            var loggedInUserDetails = _helperMethods.GetUserDetails();

            (DateTime financialYearStartDate, DateTime financialYearEndDate)? financialDateRange = null;


            if (pageData.FinancialYear != null && pageData.FinancialYear != 1 && pageData.QuarterId != null)
                financialDateRange = await _helperMethods.GetFinancialQuarterRange(pageData.FinancialYear ?? 0, (FinancialQuarter)(pageData.QuarterId ?? 5));

            var grouped = await (from candidate in _context.CandidateFormHistory
                                 join currentCandidate in _context.CandidateForms on candidate.CandidateId equals currentCandidate.Id into currCandidate
                                 from currentCandidate in currCandidate.DefaultIfEmpty()
                                 join partner in _context.Partners on candidate.PartnerId equals partner.Id into partners
                                 from partner in partners.DefaultIfEmpty()
                                 join hiringRequest in _context.Hiring on candidate.HiringRequestId equals hiringRequest.Id into hiringRequests
                                 from hiringRequest in hiringRequests.DefaultIfEmpty()
                                 join resume in _context.DocumentDetails on candidate.ResumeId equals resume.Id into documents
                                 from resume in documents.DefaultIfEmpty()
                                 join intakeStatus in _context.M_MasterData on currentCandidate!.IntakeStatusId equals intakeStatus.Id into intakeStatuses
                                 from intakeStatus in intakeStatuses.DefaultIfEmpty()
                                 join candidateStatus in _context.M_MasterData on candidate.CandidateStatusId equals candidateStatus.Id into candidateStatuses
                                 from candidateStatus in candidateStatuses.DefaultIfEmpty()
                                 where (pageData.IntakeStatusIds != null && pageData.IntakeStatusIds.Count > 0 && pageData.IntakeStatusIds.Contains(currentCandidate.IntakeStatusId ?? 0))
                                           && (candidate.PartnerId == (partnerId == null ? candidate.PartnerId : partnerId))
                                           && (loggedInUserDetails.RoleId != (int)ROLES.PARTNER || candidate.PartnerId == loggedInUserDetails.PartnerId)

                                 orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending

                                 select new
                                 {
                                     candidate,
                                     currentCandidate,
                                     partner,
                                     hiringRequest,
                                     resume,
                                     intakeStatus,
                                     candidateStatus
                                 }).ToListAsync();

            var latestRecords = grouped
                 .GroupBy(x => x.candidate.CandidateCode)
                 .Select(g => g.OrderByDescending(x =>
                         x.candidate.ReUploadedCandidateOn ??
                         x.candidate.UpdatedAt ??
                         x.candidate.CreatedAt)
                         .First())
                 .ToList();

            var hiringIds = latestRecords.Select(l => l.hiringRequest?.Id).Where(id => id != null).Select(id => id!.Value).Distinct().ToList();
            var hires = new List<HiringRequest>();
            if (hiringIds.Any())
            {
                hires = await _context.Hiring
                    .Where(h => hiringIds.Contains(h.Id))
                    .Include(h => h.HiringStatus)
                    .Include(h => h.JobDetails)
                        .ThenInclude(j => j!.SubDomain)
                    .Include(h => h.Domain)
                    .Include(h => h.HiringManager)
                    .ToListAsync();
            }
            var hiresById = hires.ToDictionary(h => h.Id, h => h);

            var candidateIds = latestRecords.Select(l => l.candidate.CandidateId).Where(id => id != null).Select(id => id!.Value).Distinct().ToList();

            if (latestRecords.Count() > 0)
                latestRecords = latestRecords.Where(c =>
                {
                    if (financialDateRange == null)
                        return true;
                    var candidateHistory = c.candidate;
                    var currentCandidate = c.currentCandidate;

                    DateTime? profileUploadedOn = candidateHistory.ReUploadedCandidateOn ?? currentCandidate?.CreatedAt;

                    return profileUploadedOn >= financialDateRange.Value.financialYearStartDate.Date &&
                           profileUploadedOn <= financialDateRange.Value.financialYearEndDate.Date;
                }).ToList();

            var lastSlots = new Dictionary<int, InterviewSlot>();
            if (candidateIds.Any())
            {
                var slots = await _context.InterviewSlotAllocation
                    .Where(s => candidateIds.Contains(s.CandidateId ?? 0))
                    .Include(s => s.CurrentRound)
                        .ThenInclude(r => r.RoundName)
                    .Include(s => s.CandidateInterviewStatus)
                    .OrderByDescending(s => s.PanelFeedbackGivenOn ?? s.Date ?? DateTime.Now)
                    .ToListAsync();

                lastSlots = slots
                    .Where(s => s.CandidateId != null)
                    .GroupBy(s => s.CandidateId!.Value)
                    .ToDictionary(g => g.Key, g => g.First());
            }

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Candidates");

            string[] headers =
            {
        "HRQ ID","HRQ Status","Candidate ID","Candidate Name","Contact Number","Role Hired For","Profile Upload Date","TAT (In Days)",
        "HRQ Assign Date","Candidate Email","Domain Name","SubDomain Name","Experience","Partner","Candidate Status","Resume Upload Date",
        "HRQ on-Hold Date","Hiring Start Date","Hiring Closed Date","Hiring Manager Name","Last Interview Round","Last Interview Status","Last Interview Feedback"
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

            foreach (var latest in latestRecords)
            {
                var candidateHistory = latest.candidate;
                var currentCandidate = latest.currentCandidate;
                var partner = latest.partner;
                var hiring = latest.hiringRequest != null && hiresById.ContainsKey(latest.hiringRequest.Id) ? hiresById[latest.hiringRequest.Id] : latest.hiringRequest;
                var resume = latest.resume;

                DateTime? profileUploadedOn = candidateHistory.ReUploadedCandidateOn ?? currentCandidate?.CreatedAt;

                DateTime tatStart = profileUploadedOn ?? DateTime.UtcNow;

                InterviewSlot? lastSlot = null;
                if (candidateHistory.CandidateId.HasValue && lastSlots.TryGetValue(candidateHistory.CandidateId.Value, out var slot))
                    lastSlot = slot;

                DateTime? tatEnd = lastSlot?.PanelFeedbackGivenOn ?? (DateTime?)DateTime.UtcNow;
                int tatDays = _applicationUtilities.CalculateTatDays(tatStart, tatEnd);

                DateTime? resumeUploadDate = resume?.CreatedAt ?? currentCandidate?.Resume?.CreatedAt;

                string domainName = hiring?.Domain?.Name ?? string.Empty;
                string subDomainName = hiring?.JobDetails?.SubDomain?.Name ?? string.Empty;

                string hiringManagerName = hiring?.HiringManager?.FullName ?? string.Empty;

                string lastInterviewRound = lastSlot?.CurrentRound?.RoundName?.Name ?? string.Empty;
                string lastInterviewStatus = lastSlot?.CandidateInterviewStatus?.Name ?? string.Empty;
                string lastInterviewFeedback = lastSlot?.Feedback ?? string.Empty;

                DateTime? requestStart = hiring == null ? null : (DateTime?)hiring.RequestStartDate;
                DateTime? onholdDate = hiring == null ? null : (DateTime?)hiring.OnholdDate;
                DateTime? closedDate = hiring == null ? null : (DateTime?)hiring.ClosedDate;

                ws.Cell(row, 1).Value = hiring?.HrqId;
                ws.Cell(row, 2).Value = hiring?.HiringStatus?.Name ?? string.Empty;
                ws.Cell(row, 3).Value = candidateHistory.CandidateCode;
                ws.Cell(row, 4).Value = candidateHistory.FullName ?? string.Empty;
                ws.Cell(row, 5).Value = candidateHistory.PhoneNumber ?? string.Empty;
                //ws.Cell(row, 6).Value = latest.intakeStatus?.Name ?? string.Empty;              
                ws.Cell(row, 6).Value = hiring?.JobTitle ?? string.Empty;

                if (profileUploadedOn.HasValue)
                {
                    ws.Cell(row, 7).Value = profileUploadedOn.Value;
                    ws.Cell(row, 7).Style.DateFormat.Format = "dd-MMM-yyyy";
                }

                ws.Cell(row, 8).Value = tatDays;

                //ws.Cell(row, 10).Value = resume?.AttachmentName ?? currentCandidate?.Resume?.AttachmentName ?? string.Empty;

                if (requestStart.HasValue)
                {
                    ws.Cell(row, 9).Value = requestStart.Value;
                    ws.Cell(row, 9).Style.DateFormat.Format = "dd-MMM-yyyy";
                }

                ws.Cell(row, 10).Value = candidateHistory.Email ?? string.Empty;
                ws.Cell(row, 11).Value = domainName;
                ws.Cell(row, 12).Value = subDomainName;
                ws.Cell(row, 13).Value = candidateHistory.RelevantExperience;
                ws.Cell(row, 14).Value = partner?.Nickname ?? partner?.PartnerName ?? string.Empty;
                ws.Cell(row, 15).Value = latest.intakeStatus?.Name ?? string.Empty;

                if (resumeUploadDate.HasValue)
                {
                    ws.Cell(row, 16).Value = resumeUploadDate.Value;
                    ws.Cell(row, 16).Style.DateFormat.Format = "dd-MMM-yyyy";
                }

                if (onholdDate.HasValue)
                {
                    ws.Cell(row, 17).Value = onholdDate.Value;
                    ws.Cell(row, 17).Style.DateFormat.Format = "dd-MMM-yyyy";
                }

                if (requestStart.HasValue)
                {
                    ws.Cell(row, 18).Value = requestStart.Value;
                    ws.Cell(row, 18).Style.DateFormat.Format = "dd-MMM-yyyy";
                }

                if (closedDate.HasValue)
                {
                    ws.Cell(row, 19).Value = closedDate.Value;
                    ws.Cell(row, 19).Style.DateFormat.Format = "dd-MMM-yyyy";
                }

                ws.Cell(row, 20).Value = hiringManagerName;
                ws.Cell(row, 21).Value = lastInterviewRound;
                ws.Cell(row, 22).Value = lastInterviewStatus;
                ws.Cell(row, 23).Value = lastInterviewFeedback;

                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<ApiResponseDto<PagedResult<CandidateGridViewDto>>> GetAllPagedCandidateForms(PageDto pageData, int? intakeStatusId)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var result = await _candidateFormHistoryRepository.GetPaginatedListWithJoinQueryAsync<CandidateGridViewDto>(pageData,

                    query => from candidate in query

                             join partner in _context.Partners on candidate.PartnerId equals partner.Id into partners
                             from partner in partners.DefaultIfEmpty()

                             join hiringRequest in _context.Hiring on candidate.HiringRequestId equals hiringRequest.Id into hiringRequests
                             from hiringRequest in hiringRequests.DefaultIfEmpty()

                             join resume in _context.DocumentDetails on candidate.ResumeId equals resume.Id into documents
                             from resume in documents.DefaultIfEmpty()

                             join intakeStatus in _context.M_MasterData on candidate.IntakeStatusId equals intakeStatus.Id into intakeStatuses
                             from intakeStatus in intakeStatuses.DefaultIfEmpty()

                             join candidateStatus in _context.M_MasterData on candidate.CandidateStatusId equals candidateStatus.Id into candidateStatuses
                             from candidateStatus in candidateStatuses.DefaultIfEmpty()

                             where
                             (
                                (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER) ||
                                (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && candidate.PartnerId == loggedInUserDetails.PartnerId) ||
                                (loggedInUserDetails.RoleId == (int)ROLES.RMOwner)
                             )
                             && (candidate.IntakeStatusId == (intakeStatusId ?? candidate.IntakeStatusId))

                             orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending,
                                      candidate.Id descending

                             select new CandidateGridViewDto
                             {
                                 Id = candidate.Id,
                                 PartnerName = partner.PartnerName,
                                 HrqId = hiringRequest.HrqId,
                                 CandidateCode = candidate.CandidateCode,
                                 FullName = candidate.FullName,
                                 Email = candidate.Email,
                                 PhoneNumber = candidate.PhoneNumber,
                                 JobTitle = hiringRequest.JobTitle,
                                 RelevantExperience = candidate.RelevantExperience,
                                 IsAgreedForTermsConditions = candidate.IsAgreedForTermsConditions,
                                 IntakeStatusName = intakeStatus.Name,
                                 CandidateStatusName = candidateStatus.Name,
                                 IsActive = candidate.IsActive,
                                 Resume = resume != null ? _mapper.Map<DocumentDetailDto>(resume) : null
                             });
                return result;

            }, "Candidate forms fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetCandidateDto>>> GetPagedFinalCandidates(PageDto pageData, int? partnerId, int? intakeStatusCategoryId, int? intakeStatusId, int? durationId)
        {
            return await ExecuteAsync(async () =>
            {
                var (startDate, endDate) = _helperMethods.GetCurrentDurationRange(durationId ?? (int)DURATION.ALL);

                var finalList = await _candidateFormRepository.GetPaginatedListWithJoinQueryAsync<GetCandidateDto>(pageData,
                                query => from candidate in query

                                         join hiring in _context.Hiring on candidate.HiringRequestId equals hiring.Id into hiringGroup
                                         from hiring in hiringGroup.DefaultIfEmpty()

                                         join ratecard in _context.CandidateRateCard on candidate.CandidateRateCardId equals ratecard.Id into rateCardGroup
                                         from ratecard in rateCardGroup.DefaultIfEmpty()

                                         join personalDetails in _context.CandidatePersonalDetails on candidate.Id equals personalDetails.CandidateId into personalDetailsGroup
                                         from personalDetails in personalDetailsGroup.DefaultIfEmpty()

                                         join status in _context.M_MasterData on hiring.HiringStatusId equals status.Id into statusGroup
                                         from status in statusGroup.DefaultIfEmpty()

                                         join partner in _context.Partners on candidate.PartnerId equals partner.Id into partnerGroup
                                         from partner in partnerGroup.DefaultIfEmpty()

                                         join intake in _context.M_MasterData on candidate.IntakeStatusId equals intake.Id into intakeGroup
                                         from intake in intakeGroup.DefaultIfEmpty()

                                         join cStatus in _context.M_MasterData on candidate.CandidateStatusId equals cStatus.Id into cStatusGroup
                                         from cStatus in cStatusGroup.DefaultIfEmpty()

                                         join resume in _context.DocumentDetails on candidate.ResumeId equals resume.Id into resumeGroup
                                         from resume in resumeGroup.DefaultIfEmpty()

                                         orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending,
                                         candidate.Id descending

                                         where (partnerId == null || candidate.PartnerId == partnerId) &&
                                               (personalDetails == null || personalDetails.IsRequestException == false || personalDetails.IsRequestException == null) &&
                                               (
                                                  (intakeStatusCategoryId == null) ||
                                                  (
                                                  intakeStatusCategoryId == (int)INTAKE_STATUS_CATEGORY.Identified && candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED && (hiring.HiringStatusId == (int)HIRING_STATUS.WIP || hiring.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED)
                                                  ) ||
                                                  (
                                                  intakeStatusCategoryId == (int)INTAKE_STATUS_CATEGORY.Offered && (candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ROLLED_OUT || candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED) && hiring.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED
                                                  && (intakeStatusId != null ? candidate.IntakeStatusId == intakeStatusId : true)
                                                  ) ||
                                                  (
                                                  intakeStatusCategoryId == (int)INTAKE_STATUS_CATEGORY.Decliend && candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED
                                                  ) ||
                                                  (
                                                   intakeStatusCategoryId == (int)INTAKE_STATUS_CATEGORY.NewJoiners && (candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.ONBOARDED) && personalDetails.AssetDetails.IsJoinConfirmed == true
                                                  )
                                               ) &&
                                               (startDate == null || endDate == null || personalDetails.DateOfJoining.Value.Date >= startDate.Value.Date && personalDetails.DateOfJoining.Value.Date <= endDate.Value.Date)

                                         select new GetCandidateDto
                                         {
                                             PartnerId = candidate.PartnerId,
                                             CandidateRateCardId = ratecard.Id,
                                             PartnerName = partner.PartnerName,
                                             NickName = partner.Nickname,
                                             HiringStatusId = hiring.HiringStatusId,
                                             HiringStatusName = status.Name,
                                             JobTitle = hiring.JobTitle,
                                             CandidateCode = candidate.CandidateCode,
                                             IsSingleEntry = candidate.IsSingleEntry,
                                             HiringRequestId = hiring.Id,
                                             HrqId = hiring.HrqId,
                                             FullName = candidate.FullName,
                                             PhoneNumber = candidate.PhoneNumber,
                                             Email = candidate.Email,
                                             ResourceTypeId = hiring.JobDetails.ResourceTypeId,
                                             ResourceTypeName = hiring.JobDetails.ResourceType.Name,
                                             CountryId = candidate.CountryId,
                                             StateId = candidate.StateId,
                                             CityId = candidate.CityId,
                                             RelevantExperience = candidate.RelevantExperience,
                                             IntakeStatusId = candidate.IntakeStatusId,
                                             IntakeStatusName = intake.Name,
                                             CandidateStatusId = candidate.CandidateStatusId,
                                             CandidateStatusName = cStatus.Name,
                                             IsDuplicate = candidate.IsDuplicate,
                                             IsParentHrq = hiring.IsParentHRQ,
                                             CandidatePersonalDetailsId = personalDetails.Id,
                                             PCAllocationDate = personalDetails.AssetDetails != null ? personalDetails.AssetDetails.PCAllocationDate : null,
                                             PCConfigurationDate = personalDetails.AssetDetails != null ? personalDetails.AssetDetails.PCConfigurationDate : null,
                                             ReleaseToOperationsDate = personalDetails.TrainingDetails != null ? personalDetails.TrainingDetails.ReleaseToOperationsDate : null,
                                             DOJ = ratecard.DOJ,
                                             IsPCAllocated = personalDetails.AssetDetails.IsPCAllocated,
                                             IsJoinConfirmed = personalDetails.AssetDetails.IsJoinConfirmed,
                                             Id = candidate.Id,
                                             CandidateBGVCompleted = personalDetails.CandidateBGVCompleted,
                                             IsActive = candidate.IsActive,
                                             JoiningConfirmationComments = intakeStatusCategoryId == (int)INTAKE_STATUS_CATEGORY.Decliend ? candidate.JoiningConfirmationComments : "",
                                             EmployeeId = personalDetails.ProfileTracker == null ? "" : (personalDetails.ProfileTracker.EmployeeId != null ? personalDetails.ProfileTracker.EmployeeId.ToString() : ""),
                                             ChildHRQCount = _context.Hiring.Count(h => h.IsParentHRQ == false && h.ParentHrqId == hiring.HrqId && h.HiringStatusId == (int)HIRING_STATUS.WIP)
                                         }

                         );

                return finalList;

            }, "Candidate forms fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> GetCandidateForms()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateFormRepository.GetListAsync(query => query
                .Include(x => x.IntakeStatus)
                .Include(x => x.Resume)
                .Include(x => x.HiringRequest)
                .ThenInclude(x => x!.HiringStatus)
                .Include(x => x.Partner));
                return _mapper.Map<IEnumerable<GetCandidateDto>>(result);
            }, "Candidate forms list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateDto>> GetCandidateForm(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateFormRepository.GetAsync(query => query
                .Include(x => x.IntakeStatus)
                .Include(x => x.Resume)
                .Include(x => x.HiringRequest)
                .ThenInclude(x => x!.HiringStatus)
                 .Include(x => x.HiringRequest)
                .ThenInclude(x => x.JobDetails)
                .ThenInclude(x => x.ResourceType)
                .Include(x => x.Partner).Where(x => x.Id == id))
                ?? throw new Exception($"Candidate is not found with CandidateId : {id}");

                var dto = _mapper.Map<GetCandidateDto>(result);

                var mergedCities = await _context.JobDetails
                                     .Where(j => j.HiringRequestId == result.HiringRequestId)
                                     .Select(j =>
                                         (j.PrimaryCityIds ?? new List<int>())
                                         .Concat(j.SecondaryCityIds ?? new List<int>())
                                     )
                                     .FirstOrDefaultAsync();

                var validCityIds = mergedCities?.Distinct().ToList() ?? new List<int>();

                var workLocationsMap = await _context.M_Cities!.Where(c => validCityIds.Contains(c.Id)).ToListAsync();

                dto.PreferredWorkLocations = _mapper.Map<List<MasterDto>>(_context.M_Cities.Where(x => (validCityIds ?? new List<int>()).Contains(x.Id)).ToList());

                return dto;
            }, "Candidate form fetched successfully.");
        }

        public async Task<ApiResponseDto<CandidateDetailsDto>> GetCandidateDetails(string candidateCode)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateFormRepository.GetAsync(query => query
                .Include(x => x.Partner)
                .Include(x => x.Country)
                .Include(x => x.State)
                .Include(x => x.City)
                .Include(x => x.CandidateStatus)
                .Include(x => x.HiringRequest)
                .ThenInclude(x => x!.HiringStatus)
                .Where(x => x.CandidateCode == candidateCode));
                return result == null ? throw new Exception($"Candidate is not found with CandidateId : {candidateCode}") : _mapper.Map<CandidateDetailsDto>(result);
            }, "Candidate Details fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateDto>> AddCandidateForm(AddCandidateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                if (await _candidateHelperMethods.VerifyProfileCap(dto.PartnerId, dto.HiringRequestId))
                    throw new Exception("The partner has exceeded the daily limit for adding profiles. No additional profiles can be added today.");

                if (await _candidateHelperMethods.VerifyScreeningCap(dto.HiringRequestId))
                    throw new Exception($"Screening cap exceeded for Hiring Request ID {dto.HiringRequestId}. Please add tomorrow.");

                // Updated It is a single Entry
                dto.IsSingleEntry = true;
                dto.ResumeUploadedOn = dto.Resume != null ? DateTime.UtcNow : null;
                dto.IntakeStatusId = await _candidateHelperMethods.GetIntakeStatusBasedOnHiringRequestId(dto.HiringRequestId);
                var added = await _candidateFormRepository.AddAsync(_mapper.Map<Candidate>(dto));

                if (dto.PartnerId.HasValue)
                    await SendCandidateUploadedEmail(dto.PartnerId.Value, dto.HiringRequestId, added.Id);

                return _mapper.Map<GetCandidateDto>(added);
            }
            , "Candidate form added successfully.");
        }

        private async Task SendCandidateUploadedEmail(int partnerId, int hiringRequestId, int candidateId)
        {
            try
            {
                var prtner = await _partnerRepository.GetAsync(partnerId);
                var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));
                var hiringRequest = await _hiringRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId));
                var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));
                var candidate = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == candidateId));
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

                var candidateDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(candidate, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new InitCapNamingStrategy()
                    }
                }), "Candidate.");

                var candidareHiringDict = Utility.Utility.Merge(candidateDict, hiringRequestDict);

                var dictionary = Utility.Utility.Merge(candidareHiringDict, partHiringDict);

                var link = _configuration["ClientHostName"] + "/home/candidate-management/candidate-profile?id=" + candidate.CandidateCode;
                dictionary.Add("ProfileLink", link);


                await _communicationService.AddNotification((int)CandidateEmailTemplateEnums.PartnerCandidateUpload, toEmail,
                    dictionary, ccEmail);

            }
            catch (Exception ex)
            { }

        }


        public async Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> AddBulkCandidates(int? partnerId, IEnumerable<AddCandidateDto> candidates)
        {
            return await ExecuteAsync(async () =>
            {
                var invalidEntries = new List<string>();

                // Get distinct input values
                var hrqIds = candidates.Select(c => c.HrqId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct();
                var countryNames = candidates.Select(c => c.CountryName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var stateNames = candidates.Select(c => c.StateName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var cityNames = candidates.Select(c => c.CityName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();

                // Get full matching entities
                var hiringMap = await _context.Hiring.Include(x => x.JobDetails)
                    .Where(h => hrqIds.Contains(h.HrqId))
                    .ToDictionaryAsync(h => h.HrqId, StringComparer.OrdinalIgnoreCase);

                var countryMap = await _context.M_Countries!
                    .Where(c => countryNames!.Contains(c.Name!))
                    .ToDictionaryAsync(c => c!.Name!, StringComparer.OrdinalIgnoreCase);

                var stateMap = await _context.M_States
                    .Where(s => stateNames.Contains(s.Name))
                    .ToDictionaryAsync(s => s!.Name!, StringComparer.OrdinalIgnoreCase);

                var cityMap = await _context!.M_Cities!
                    .Where(c => cityNames!.Contains(c.Name!))
                    .ToDictionaryAsync(c => c!.Name!, StringComparer.OrdinalIgnoreCase);

                // Validate and enrich candidate data
                foreach (var candidate in candidates)
                {
                    var errors = new List<string>();

                    if (!string.IsNullOrWhiteSpace(candidate.HrqId) && hiringMap.TryGetValue(candidate.HrqId, out var hiring))
                    {
                        candidate.PartnerId = partnerId;
                        candidate.HrqId = hiring.HrqId;
                        candidate.HiringRequestId = hiring.Id;
                        candidate.ResourceTypeId = hiring.JobDetails!.ResourceTypeId;
                        candidate.IntakeStatusId = await _candidateHelperMethods.GetIntakeStatusBasedOnHiringRequestId(hiring.Id);
                    }
                    else
                    {
                        errors.Add($"HRQID '{candidate.HrqId}'");
                    }

                    if (!string.IsNullOrWhiteSpace(candidate.CountryName) && countryMap.TryGetValue(candidate.CountryName, out var country))
                    {
                        candidate.CountryId = country.Id;
                    }
                    else
                    {
                        errors.Add($"Country '{candidate.CountryName}'");
                    }

                    if (!string.IsNullOrWhiteSpace(candidate.StateName) && stateMap.TryGetValue(candidate.StateName, out var state))
                    {
                        candidate.StateId = state.Id;
                    }
                    else
                    {
                        errors.Add($"State '{candidate.StateName}'");
                    }

                    if (!string.IsNullOrWhiteSpace(candidate.CityName) && cityMap.TryGetValue(candidate.CityName, out var city))
                    {
                        candidate.CityId = city.Id;
                    }
                    else
                    {
                        errors.Add($"City '{candidate.CityName}'");
                    }

                    if (errors.Count != 0)
                        invalidEntries.Add($"Candidate [{candidate.Email}] has invalid data: {string.Join(", ", errors)}");

                    // Updated It is a single Entry
                    candidate.IsSingleEntry = false;
                }

                if (invalidEntries.Count != 0)
                {
                    var _message = $"Validation failed for some candidates:\n{string.Join("\n", invalidEntries)}";
                    throw new Exception(_message);
                }

                var result = await _candidateFormRepository.AddListAsync(_mapper.Map<IEnumerable<Candidate>>(candidates));


                foreach (var candidte in result)
                {
                    if (candidte.PartnerId != null && candidte.PartnerId.HasValue && candidte.HiringRequestId != null && candidte.HiringRequestId.HasValue)
                        await SendCandidateUploadedEmail(candidte.PartnerId.Value, candidte.HiringRequestId.Value, candidte.Id);
                }

                return _mapper.Map<IEnumerable<GetCandidateDto>>(result);
            }, "Candidates uploaded successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateCandidateForm(AddCandidateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _candidateFormRepository.GetAsync(query => query.Include(x => x.Resume).Where(x => x.Id == dto.Id))
                ?? throw new Exception($"Candidate is not found with CandidateId : {dto.Id}");

                _mapper.Map(dto, entity);

                await _candidateFormRepository.UpdateAsync(entity);

                var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == entity.Id &&
                                                                                                                       x.HiringRequestId == entity.HiringRequestId &&
                                                                                                                       x.PartnerId == entity.PartnerId));

                if (candidateHistory != null)
                {
                    candidateHistory.IntakeStatusId = entity.IntakeStatusId;
                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                }

            }, "Candidate form updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _candidateFormRepository.GetAsync(id) ?? throw new Exception($"Candidate is not found with CandidateId : {id}");
                entity.IsActive = false;
                await _candidateFormRepository.UpdateAsync(entity);

                var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == entity.Id &&
                                                                                                                      x.HiringRequestId == entity.HiringRequestId &&
                                                                                                                      x.PartnerId == entity.PartnerId));

                if (candidateHistory != null)
                {
                    candidateHistory.IntakeStatusId = entity.IntakeStatusId;
                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                }

            }, "Candidate form status updated successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> GetCandidatesByHrqId(string hrqId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateFormRepository.GetListAsync(query => query
                                                                                 .Include(x => x.IntakeStatus)
                                                                                 .Include(x => x.Resume)
                                                                                 .Include(x => x.HiringRequest)
                                                                                 .ThenInclude(x => x!.HiringStatus)
                                                                                 .Include(x => x.Partner)
                                                                                 .Where(x => x.HiringRequest!.HrqId == hrqId));

                return _mapper.Map<IEnumerable<GetCandidateDto>>(result);

            }, "Candidates list fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> MoveCandidateToCart(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _candidateFormRepository.GetAsync(id) ?? throw new Exception($"Candidate is not found with CandidateId : {id}");
                entity.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.SCREENING;
                await _candidateFormRepository.UpdateAsync(entity);

                var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == entity.Id &&
                                                                                                                      x.HiringRequestId == entity.HiringRequestId &&
                                                                                                                      x.PartnerId == entity.PartnerId));

                if (candidateHistory != null)
                {
                    candidateHistory.IntakeStatusId = entity.IntakeStatusId;
                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                }

            }, "Candidate form status updated successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> GetCandidatesByHrqId(int hiringRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateFormRepository.GetListAsync(query => query
                .Include(x => x!.IntakeStatus)
                .Include(x => x.Resume)
                .Include(x => x.HiringRequest).ThenInclude(x => x!.HiringStatus)
                .Include(x => x.Partner)
                .Where(x => x.HiringRequest!.Id == hiringRequestId
                && (x.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED
                    && x.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP
                    && x.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.REJECTED)));

                return _mapper.Map<IEnumerable<GetCandidateDto>>(result);
            }, "Candidates list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateRateCardDto>> MoveCandidateToOfferRolledOutAsync(AddCandidateRateCardDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var added = await _candidateRateCardRepository.AddAsync(_mapper.Map<CandidateRateCard>(dto));

                if (added != null)
                {
                    var candidate = await _candidateFormRepository.GetAsync(added.CandidateId);
                    if (candidate != null)
                    {
                        candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.OFFER_ROLLED_OUT;
                        candidate.OfferRolledOutOn = DateTime.UtcNow;
                        candidate.CandidateRateCardId = added.Id;
                        await _candidateFormRepository.UpdateAsync(candidate);


                        var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id &&
                                                                                                                        x.HiringRequestId == candidate.HiringRequestId &&
                                                                                                                        x.PartnerId == candidate.PartnerId));

                        if (candidateHistory != null)
                        {
                            candidateHistory.CandidateRateCardId = candidate.CandidateRateCardId;
                            candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                            candidateHistory.OfferRolledOutOn = candidate.OfferRolledOutOn;
                            await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                        }
                    }
                }

                return _mapper.Map<GetCandidateRateCardDto>(added);

            }, "Candidate form added successfully.");
        }

        public async Task<ApiResponseDto<string>> CandidateConfirmOfferAsync(CandidateConfirmOfferDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var candidate = await _candidateFormRepository.GetAsync(dto.CandidateId);

                if (candidate != null)
                {
                    //candidate.IntakeStatusId = dto.OfferStatus == true ? (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED : (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED;
                    if (dto.OfferStatus == true)
                    {
                        candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED;
                        candidate.OfferAcceptedOn = DateTime.UtcNow;
                    }
                    else
                    {
                        candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED;
                        candidate.OfferDeclinedOn = DateTime.UtcNow;
                    }
                    candidate.Comments = dto.Comments;
                    await _candidateFormRepository.UpdateAsync(candidate);

                    var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id &&
                                                                                                                        x.HiringRequestId == candidate.HiringRequestId &&
                                                                                                                        x.PartnerId == candidate.PartnerId));

                    if (candidateHistory != null)
                    {
                        candidateHistory.CandidateRateCardId = candidate.CandidateRateCardId;
                        candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                        candidateHistory.OfferAcceptedOn = candidate.OfferAcceptedOn;
                        candidateHistory.OfferDeclinedOn = candidate.OfferDeclinedOn;
                        await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                    }

                    if (candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED)
                    {
                        var hiringRequest = await _hiringRepository.GetAsync(candidate.HiringRequestId);

                        hiringRequest.HiringStatusId = (int)HIRING_STATUS.WIP;
                        hiringRequest.IsCandidateSelected = false;
                        hiringRequest.CandidateId = null;

                        await _hiringRepository.UpdateAsync(hiringRequest);
                    }
                }
            }, "Candidate confirmed offer status successfully.");
        }

        public async Task<ApiResponseDto<string>> CandidateJoiningConfirmationAsync(CandidateJoinConfirmationDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var candidate = await _candidateFormRepository.GetAsync(dto.CandidateId) ?? throw new Exception($"Candidate not found with Id {dto.CandidateId}");

                var assetDetails = await _assetDetailsRepository.GetAsync(query => query.Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId));
                var personaldetails = await _candidatePersonalDetailsRepository.GetAsync(query => query.Where(x => x.Id == dto.CandidatePersonalDetailsId));

                var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(
           x => x.CandidateId == candidate.Id &&
                x.HiringRequestId == candidate.HiringRequestId &&
                x.PartnerId == candidate.PartnerId));
                if (dto.JoiningStatusId == (int)JOINING_STATUS.Declined)
                {
                    candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED;
                    candidate.OfferDeclinedOn = DateTime.UtcNow;
                    candidate.CandidateDroppedOn = DateTime.UtcNow;
                    candidate.JoiningConfirmationComments = dto.Comments;

                    await _candidateFormRepository.UpdateAsync(candidate);

                    if (candidateHistory != null)
                    {
                        candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                        candidateHistory.OfferDeclinedOn = candidate.OfferDeclinedOn;
                        candidateHistory.CandidateDroppedOn = candidate.CandidateDroppedOn;
                        await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                    }

                    // Revert Hiring Status to WIP
                    var hiring = await _hiringRepository.GetAsync(candidate.HiringRequestId) ?? throw new Exception($"Hiring not found with Id {candidate.HiringRequestId}");

                    hiring.HiringStatusId = (int)HIRING_STATUS.WIP;
                    hiring.IsCandidateSelected = false;
                    hiring.CandidateId = null;

                    await _hiringRepository.UpdateAsync(hiring);

                }
                else if (dto.JoiningStatusId == (int)JOINING_STATUS.Joined)
                {
                    if (assetDetails == null)
                    {
                        AssetDetails _assetDetails = new();
                        _assetDetails.IsJoinConfirmed = true;
                        candidate.CandidateJoinedOn = DateTime.UtcNow;
                        _assetDetails.CandidatePersonalDetailsId = dto.CandidatePersonalDetailsId ?? 0;

                        await _assetDetailsRepository.AddAsync(_assetDetails);
                    }
                    else
                    {
                        assetDetails.IsJoinConfirmed = true;
                        candidate.CandidateJoinedOn = DateTime.UtcNow;
                        await _assetDetailsRepository.UpdateAsync(assetDetails);
                    }

                    candidate.JoiningConfirmationComments = dto.Comments;

                    await _candidateFormRepository.UpdateAsync(candidate);

                    if (candidateHistory != null)
                    {
                        candidateHistory.CandidateJoinedOn = candidate.CandidateJoinedOn;
                        await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                    }
                }
                else if (dto.JoiningStatusId == (int)JOINING_STATUS.Rescheduled)
                {
                    if (personaldetails != null)
                    {
                        personaldetails.FinalOnboaridngDate = dto.FinalOnboaridngDate;
                        personaldetails.IsRequestException = personaldetails.OnboaridngDateChangeCount >= 3;
                        personaldetails.OnboaridngDateChangeCount = (personaldetails.OnboaridngDateChangeCount ?? 0) + 1;
                        candidate.CandidateRescheduledOn = DateTime.UtcNow;

                        await _candidatePersonalDetailsRepository.UpdateAsync(personaldetails);
                        var newHistoryItem = await _joiningResceduleRepository.AddAsync(new JoiningRescheduleHistory()
                        {
                            CandidateId = personaldetails.CandidateId,
                            PersonalDetailsId = personaldetails.Id,
                            Comments = dto.Comments,
                            FinalOnboardingDate = dto.FinalOnboaridngDate,
                            Modifiedby = loggedInUserDetails.UserId,
                            ModifiedOn = DateTime.UtcNow
                        });
                    }

                    candidate.JoiningConfirmationComments = dto.Comments;

                    await _candidateFormRepository.UpdateAsync(candidate);
                    if (candidateHistory != null)
                    {
                        candidateHistory.CandidateRescheduledOn = candidate.CandidateRescheduledOn;
                        await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                    }
                }

            }, "Candidate confirmed offer status successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateRateCardDto>> GetCandidateRateCard(int rateCardId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateRateCardRepository.GetAsync(query => query.Include(x => x.Category)
                                                                                      .Where(x => x.Id == rateCardId));

                return result == null ? throw new Exception($"CandidateRateCard is not found with Id : {rateCardId}") : _mapper.Map<GetCandidateRateCardDto>(result);

            }, "Candidate form fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> CandidateFinalOnboardingConfirmationAsync(ApproveOnboardingDateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var personaldetails = await _candidatePersonalDetailsRepository.GetAsync(query => query.Where(x => x.Id == dto.CandidatePersonalDetailsId));

                if (dto.Approve == true)
                {
                    personaldetails.IsRequestException = false;
                    await _candidatePersonalDetailsRepository.UpdateAsync(personaldetails);
                }
                else if (dto.Approve == false)
                {
                    var candidate = await _candidateFormRepository.GetAsync(dto.CandidateId) ?? throw new Exception($"Candidate not found with Id {dto.CandidateId}");
                    candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED;
                    candidate.Comments = dto.Comments;

                    personaldetails.IsRequestException = false;
                    await _candidatePersonalDetailsRepository.UpdateAsync(personaldetails);

                    await _candidateFormRepository.UpdateAsync(candidate);

                    var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id &&
                                                                                                                       x.HiringRequestId == candidate.HiringRequestId &&
                                                                                                                       x.PartnerId == candidate.PartnerId));

                    if (candidateHistory != null)
                    {
                        candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                        await _candidateFormHistoryRepository.UpdateAsync(candidateHistory);
                    }

                    if (candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED)
                    {
                        var hiringRequest = await _hiringRepository.GetAsync(candidate.HiringRequestId);

                        hiringRequest.HiringStatusId = (int)HIRING_STATUS.WIP;
                        hiringRequest.IsCandidateSelected = false;
                        hiringRequest.CandidateId = null;

                        await _hiringRepository.UpdateAsync(hiringRequest);
                    }
                }

            }, "Candidate form fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetCandidateCDANDAApprovalListDto>>> GetCandidateOnboardingExceptionList(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                return await _candidateFormRepository.GetPaginatedListWithJoinQueryAsync<GetCandidateCDANDAApprovalListDto>(pageData,
                              query => from candidate in query

                                       join hiring in _context.Hiring on candidate.HiringRequestId equals hiring.Id into hiringGroup
                                       from hiring in hiringGroup.DefaultIfEmpty()

                                       join personalDetails in _context.CandidatePersonalDetails on candidate.Id equals personalDetails.CandidateId into personalDetailsGroup
                                       from personalDetails in personalDetailsGroup.DefaultIfEmpty()

                                       join profileTracker in _context.ProfileTracker on personalDetails.Id equals profileTracker.CandidatePersonalDetailsId into profileTrackerGroup
                                       from profileTracker in profileTrackerGroup.DefaultIfEmpty()

                                       join bgvDetails in _context.CandidateBgvDetails on personalDetails.Id equals bgvDetails.CandidatePersonalDetailsId into bgvDetailsGroup
                                       from bgvDetails in bgvDetailsGroup.DefaultIfEmpty()

                                       join partner in _context.Partners on candidate.PartnerId equals partner.Id into partnerGroup
                                       from partner in partnerGroup.DefaultIfEmpty()

                                       join intake in _context.M_MasterData on candidate.IntakeStatusId equals intake.Id into intakeGroup
                                       from intake in intakeGroup.DefaultIfEmpty()

                                       orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending,
                                       candidate.Id descending

                                       where
                                       //hiring.IsParentHRQ == true && 
                                       personalDetails.IsRequestException == true
                                       && candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED
                                       && (loggedInUserDetails.RoleId != (int)ROLES.PARTNER || candidate.PartnerId == loggedInUserDetails.UserId)

                                       select new GetCandidateCDANDAApprovalListDto
                                       {
                                           CandidateId = candidate.Id,
                                           PartnerId = candidate.PartnerId,
                                           NickName = partner.Nickname,
                                           JobTitle = hiring.JobTitle,
                                           CandidateCode = candidate.CandidateCode,
                                           HiringRequestId = hiring.Id,
                                           HrqId = hiring.HrqId,
                                           CandidateName = candidate.FullName,
                                           CandidateContact = candidate.PhoneNumber,
                                           CandidateEmail = candidate.Email,
                                           IntakeStatusId = candidate.IntakeStatusId,
                                           IntakeStatusName = intake.Name,
                                           CandidatePersonalDetailsId = personalDetails.Id,
                                           DateOfJoining = personalDetails.DateOfJoining,
                                           CandidateBGVCompleted = personalDetails.CandidateBGVCompleted,
                                           EmployeeId = profileTracker == null ? "" : (profileTracker.EmployeeId != null ? profileTracker.EmployeeId.ToString() : ""),
                                           IsUploadedBGVDocs = bgvDetails.IsUploadedBGVDocs,
                                           ResourceTypeName = hiring.JobDetails.ResourceType.Name,
                                       }

                       );
            }, "Candidate onboarding exception list fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetCandidateCDANDAApprovalListDto>>> GetCandidateCDANDAApprovingList(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                return await _candidateFormRepository.GetPaginatedListWithJoinQueryAsync<GetCandidateCDANDAApprovalListDto>(pageData,
                               query => from candidate in query

                                        join hiring in _context.Hiring on candidate.HiringRequestId equals hiring.Id into hiringGroup
                                        from hiring in hiringGroup.DefaultIfEmpty()

                                        join personalDetails in _context.CandidatePersonalDetails on candidate.Id equals personalDetails.CandidateId into personalDetailsGroup
                                        from personalDetails in personalDetailsGroup.DefaultIfEmpty()

                                        join profileTracker in _context.ProfileTracker on personalDetails.Id equals profileTracker.CandidatePersonalDetailsId into profileTrackerGroup
                                        from profileTracker in profileTrackerGroup.DefaultIfEmpty()

                                        join bgvDetails in _context.CandidateBgvDetails on personalDetails.Id equals bgvDetails.CandidatePersonalDetailsId into bgvDetailsGroup
                                        from bgvDetails in bgvDetailsGroup.DefaultIfEmpty()

                                        join partner in _context.Partners on candidate.PartnerId equals partner.Id into partnerGroup
                                        from partner in partnerGroup.DefaultIfEmpty()

                                        join intake in _context.M_MasterData on candidate.IntakeStatusId equals intake.Id into intakeGroup
                                        from intake in intakeGroup.DefaultIfEmpty()

                                        orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending,
                                        candidate.Id descending

                                        where bgvDetails.IsUploadedBGVDocs == true && candidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED && (bgvDetails.CandidateBGVCompleted == false || bgvDetails.CandidateBGVCompleted == null)

                                        select new GetCandidateCDANDAApprovalListDto
                                        {
                                            CandidateId = candidate.Id,
                                            PartnerId = candidate.PartnerId,
                                            NickName = partner.Nickname,
                                            JobTitle = hiring.JobTitle,
                                            CandidateCode = candidate.CandidateCode,
                                            HiringRequestId = hiring.Id,
                                            HrqId = hiring.HrqId,
                                            CandidateName = candidate.FullName,
                                            CandidateContact = candidate.PhoneNumber,
                                            CandidateEmail = candidate.Email,
                                            IntakeStatusId = candidate.IntakeStatusId,
                                            IntakeStatusName = intake.Name,
                                            CandidatePersonalDetailsId = personalDetails.Id,
                                            DateOfJoining = personalDetails.DateOfJoining,
                                            CandidateBGVCompleted = personalDetails.CandidateBGVCompleted,
                                            EmployeeId = profileTracker == null ? "" : (profileTracker.EmployeeId != null ? profileTracker.EmployeeId.ToString() : ""),
                                            IsUploadedBGVDocs = bgvDetails.IsUploadedBGVDocs,
                                            CDADoc = _mapper.Map<DocumentDetailDto>(bgvDetails.CDAAvailabilityDoc),
                                            NDADoc = _mapper.Map<DocumentDetailDto>(bgvDetails.NDAAvailabilityDoc),
                                            ResourceTypeName = hiring.JobDetails!.ResourceType!.Name,
                                            LastUpdated = bgvDetails.LastUpdated
                                        }

                        );

            }, "CDA/NDA Docs verifiation list fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> CandidateBGVConfirmationAsync(ApproveBGVDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var bgvDetails = await _candidateBGVDetailsRepository.GetAsync(query => query.Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId));


                if (dto.Approve == true)
                {
                    bgvDetails.CandidateBGVCompleted = true;
                    bgvDetails.IsUploadedBGVDocs = false;
                    bgvDetails.Comments = dto.Comments;

                    await _candidateBGVDetailsRepository.UpdateAsync(bgvDetails);
                }
                else if (dto.Approve == false)
                {
                    bgvDetails.IsUploadedBGVDocs = false;
                    bgvDetails.CandidateBGVCompleted = false;
                    bgvDetails.Comments = dto.Comments;

                    var cdaDoc = await _docRepository.GetAsync(bgvDetails.CDAAvailabilityDocId);

                    if (cdaDoc != null)
                    {
                        if (cdaDoc?.AttachmentName != null)
                            await _fileService.DeleteFileAsync(cdaDoc.AttachmentName);
                        bgvDetails.CDAAvailabilityDocId = null;
                    }

                    var ndaDoc = await _docRepository.GetAsync(bgvDetails.NDAAvailabilityDocId);

                    if (ndaDoc != null)
                    {
                        if (ndaDoc?.AttachmentName != null)
                            await _fileService.DeleteFileAsync(ndaDoc.AttachmentName);
                        bgvDetails.NDAAvailabilityDocId = null;
                    }

                    await _candidateBGVDetailsRepository.UpdateAsync(bgvDetails);
                }

            }, "Candidate form fetched successfully.");
        }

        public async Task<byte[]> ExportLatestCandidateDetails(PageDto pageData, bool? isBin, int? partnerId, List<int> intakeStatusId)
        {
            var loggedInUserDetails = _helperMethods.GetUserDetails();

            using var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();

            using var command = conn.CreateCommand();
            command.CommandText = "sp_GetCandidateHiringDetails";
            command.CommandType = CommandType.StoredProcedure;

            var partnerParam = new SqlParameter("@PartnerId", SqlDbType.Int) { Value = (object)partnerId ?? DBNull.Value };
            command.Parameters.Add(partnerParam);

            var loggedInPartnerParam = new SqlParameter("@LoggedInPartnerId", SqlDbType.Int) { Value = (object)loggedInUserDetails.PartnerId ?? DBNull.Value };
            command.Parameters.Add(loggedInPartnerParam);

            var loggedInRoleParam = new SqlParameter("@LoggedInRoleId", SqlDbType.Int) { Value = loggedInUserDetails.RoleId };
            command.Parameters.Add(loggedInRoleParam);

            var intakeStatusParam = new SqlParameter("@IntakeStatusIds", SqlDbType.Structured)
            {
                TypeName = "IntListType",
                Value = IntListTVP.CreateIntListTvp(intakeStatusId ?? new List<int>())
            };
            command.Parameters.Add(intakeStatusParam);

            var candidatesData = new List<GetExportCandidate>();
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    candidatesData.Add(new GetExportCandidate
                    {
                        HrqId = reader["HrqId"]?.ToString(),
                        HiringStatus = reader["HiringStatus"]?.ToString(),
                        CandidateCode = reader["CandidateCode"]?.ToString(),
                        CandidateName = reader["CandidateName"]?.ToString(),
                        Email = reader["Email"]?.ToString(),
                        PhoneNumber = reader["PhoneNumber"]?.ToString(),
                        RoleHiredFor = reader["RoleHiredFor"]?.ToString(),
                        DomainName = reader["DomainName"]?.ToString(),
                        SubDomainName = reader["SubDomainName"]?.ToString(),
                        Experience = reader["Experience"] as int?,
                        Partner = reader["Partner"]?.ToString(),
                        IntakeStatusName = reader["IntakeStatusName"]?.ToString(),
                        ProfileCreatedAt = reader["ProfileCreatedAt"] as DateTime?,
                        OnholdDate = reader["OnholdDate"] as DateTime?,
                        RequestStartDate = reader["RequestStartDate"] as DateTime?,
                        ClosedDate = reader["ClosedDate"] as DateTime?,
                        HiringManagerName = reader["HiringManagerName"]?.ToString(),
                        LastInterviewRound = reader["LastInterviewRound"]?.ToString(),
                        LastInterviewStatus = reader["LastInterviewStatus"]?.ToString()
                    });
                }
            }

            // Apply sorting
            var candidates = PaginationHelper.GetSortedResult(candidatesData, pageData.SortColumns);

            // Excel export
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Candidates");

            var headers = new[]
            {
        "HrqId","HiringStatus","Candidate Id","Candidate Name","Email","Phone Number",
        "Role Hired For","DomainName","SubDomainName","Experience","Partner","Status",
        "ProfileCreatedAt","OnholdDate","RequestStartDate","ClosedDate",
        "HiringManagerName","LastInterviewRound","LastInterviewStatus"
    };

            for (int i = 0; i < headers.Length; i++)
            {
                var headerCell = ws.Cell(1, i + 1);
                headerCell.Value = headers[i];
                ws.Column(i + 1).Width = 25;
                headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Font.FontColor = XLColor.White;
                headerCell.Style.Fill.BackgroundColor = XLColor.Green;
            }

            int row = 2;
            foreach (var c in candidates)
            {
                ws.Cell(row, 1).Value = c.HrqId;
                ws.Cell(row, 2).Value = c.HiringStatus;
                ws.Cell(row, 3).Value = c.CandidateCode;
                ws.Cell(row, 4).Value = c.CandidateName;
                ws.Cell(row, 5).Value = c.Email;
                ws.Cell(row, 6).Value = c.PhoneNumber;
                ws.Cell(row, 7).Value = c.RoleHiredFor;
                ws.Cell(row, 8).Value = c.DomainName;
                ws.Cell(row, 9).Value = c.SubDomainName;
                ws.Cell(row, 10).Value = c.Experience;
                ws.Cell(row, 11).Value = c.Partner;
                ws.Cell(row, 12).Value = c.IntakeStatusName;
                ws.Cell(row, 13).Value = c.ProfileCreatedAt?.ToString("d");
                ws.Cell(row, 14).Value = c.OnholdDate?.ToString("d");
                ws.Cell(row, 15).Value = c.RequestStartDate?.ToString("d");
                ws.Cell(row, 16).Value = c.ClosedDate?.ToString("d");
                ws.Cell(row, 17).Value = c.HiringManagerName;
                ws.Cell(row, 18).Value = c.LastInterviewRound;
                ws.Cell(row, 19).Value = c.LastInterviewStatus;
                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportInterviewFeedback(PageDto pageData, bool? isBin, int? partnerId, List<int> intakeStatusId)
        {
            var loggedInUserDetails = _helperMethods.GetUserDetails();

            var intakeStatusParam = new SqlParameter("@IntakeStatusIds", SqlDbType.Structured)
            {
                TypeName = "IntListType",
                Value = IntListTVP.CreateIntListTvp(intakeStatusId ?? new List<int>())
            };

            var partnerParam = new SqlParameter("@PartnerId", SqlDbType.Int)
            {
                Value = (object)partnerId ?? DBNull.Value
            };

            var loggedInPartnerParam = new SqlParameter("@LoggedInPartnerId", SqlDbType.Int)
            {
                Value = (object)loggedInUserDetails.PartnerId ?? DBNull.Value
            };

            var loggedInRoleParam = new SqlParameter("@LoggedInRoleId", SqlDbType.Int)
            {
                Value = loggedInUserDetails.RoleId
            };
            var feedbackData = await _context
                .Set<GetExportFeedbackCandidate>()
                .FromSqlRaw(
                    "EXEC sp_GetCandidateInterviewFeedback @IntakeStatusIds, @PartnerId, @LoggedInPartnerId, @LoggedInRoleId",
                    intakeStatusParam, partnerParam, loggedInPartnerParam, loggedInRoleParam
                )
                .ToListAsync();

            var sortedFeedback = PaginationHelper.GetSortedResult(feedbackData, pageData.SortColumns);

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Interview Feedback");

            var headers = new[]
            {
        "HrqId","Partner","Candidate Id","Candidate Name","Email","Phone Number","RoundName","RoundStatus","Round Number",
        "DateOfInterview","Feedbackgivenby","FeebackDate","PanelComments","PanelDetails","IsLastInterview"
    };

            for (int i = 0; i < headers.Length; i++)
            {
                var headerCell = ws.Cell(1, i + 1);
                headerCell.Value = headers[i];
                ws.Column(i + 1).Width = 25;
                headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Font.FontColor = XLColor.White;
                headerCell.Style.Fill.BackgroundColor = XLColor.Green;
            }

            int row = 2;
            foreach (var c in sortedFeedback)
            {
                ws.Cell(row, 1).Value = c.HrqId;
                ws.Cell(row, 2).Value = c.PartnerName;
                ws.Cell(row, 3).Value = c.CandidateCode;
                ws.Cell(row, 4).Value = c.FullName;
                ws.Cell(row, 5).Value = c.Email;
                ws.Cell(row, 6).Value = c.PhoneNumber;
                ws.Cell(row, 7).Value = c.RoundName;
                ws.Cell(row, 8).Value = c.RoundStatus;
                ws.Cell(row, 9).Value = c.RoundNumber;
                ws.Cell(row, 10).Value = c.DateOfInterview?.ToString("d");
                ws.Cell(row, 11).Value = c.Feedbackgivenby;
                ws.Cell(row, 12).Value = c.FeebackDate?.ToString("d");
                ws.Cell(row, 13).Value = c.PanelComments;
                ws.Cell(row, 14).Value = c.PanelDetails;
                ws.Cell(row, 15).Value = c.IsLastInterview;
                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportCandidateInterviewFeedback(PageDto pageData, int? partnerId, List<int> intakeStatusId)
        {
            try
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var intakeStatusParam = new SqlParameter("@IntakeStatusIds", SqlDbType.Structured)
                {
                    TypeName = "IntListType",
                    Value = IntListTVP.CreateIntListTvp(intakeStatusId ?? new List<int>())
                };

                var partnerParam = new SqlParameter("@PartnerId", SqlDbType.Int)
                {
                    Value = (object)partnerId ?? DBNull.Value
                };

                var loggedInPartnerParam = new SqlParameter("@LoggedInPartnerId", SqlDbType.Int)
                {
                    Value = (object)loggedInUserDetails.PartnerId ?? DBNull.Value
                };

                var loggedInRoleParam = new SqlParameter("@LoggedInRoleId", SqlDbType.Int)
                {
                    Value = loggedInUserDetails.RoleId
                };
                var feedbackData = await _context
                    .Set<GetExportCandidateInterviewDetails>()
                    .FromSqlRaw(
                        "EXEC sp_GetCandidate_HRQ_InterviewDetails @IntakeStatusIds, @PartnerId, @LoggedInPartnerId, @LoggedInRoleId",
                        intakeStatusParam, partnerParam, loggedInPartnerParam, loggedInRoleParam
                    )
                    .ToListAsync();

                var sortedFeedback = PaginationHelper.GetSortedResult(feedbackData, pageData.SortColumns);

                using var workbook = new XLWorkbook();
                var ws = workbook.Worksheets.Add("Interview Feedback");

                var headers = new[]{"HRQID",
                                "Candidate Id",
                                "Full Name",
                                "Phone Number",
                                "Email ID",
                                "Profile Uploaded On",
                                "Role Hired For",
                                "Primary Skills",
                                "Secondary Skills",
                                "Diversity",
                                "Current Country",
                                "Current State",
                                "Current City",
                                "Work Location",
                                "Notice Period",
                                "Relevant Experience (Years)",
                                "Currently Working (Yes/No)",
                                "Organisation",
                                "Partner Id",
                                "Last Working Day",
                                "Partner Alias Name",
                                "Domain",
                                "Sub Domain",
                                "Hiring Manager",
                                "Interview Round Order",
                                "Interview Round Name",
                                "Interview Status",
                                "Final Status",
                                "HRQ Status",
                                "HRQ Hold Date",
                                "Scheduled Date",
                                "Schedule Time",
                                "Interview Comments / Feedbacks",
                                "Feedback Date",
                                //"Feedback Time",
                                "Feedback Updated By",
                                "Interview Taken",
                                "Comment",
                                "Reschedule Count",
                                "Decline Count",
                                "Panel",
                                "Last Interview"
            };


                for (int i = 0; i < headers.Length; i++)
                {
                    var headerCell = ws.Cell(1, i + 1);
                    headerCell.Value = headers[i];
                    ws.Column(i + 1).Width = 25;
                    headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                    headerCell.Style.Font.Bold = true;
                    headerCell.Style.Font.FontColor = XLColor.White;
                    headerCell.Style.Fill.BackgroundColor = XLColor.Green;
                }

                int row = 2;
                foreach (var c in sortedFeedback)
                {
                    ws.Cell(row, 1).Value = c.HrqId;
                    ws.Cell(row, 2).Value = c.CandidateId;
                    ws.Cell(row, 3).Value = c.FullName;
                    ws.Cell(row, 4).Value = c.PhoneNumber;
                    ws.Cell(row, 5).Value = c.Email;
                    ws.Cell(row, 6).Value = c.ProfileCreatedAt?.Date;
                    ws.Cell(row, 6).Style.DateFormat.Format = "dd-MMM-yyyy";
                    ws.Cell(row, 7).Value = c.RoleHiredFor;
                    ws.Cell(row, 8).Value = c.PrimarySkills;
                    ws.Cell(row, 9).Value = c.SecondarySkills;
                    ws.Cell(row, 10).Value = c.Diversity;
                    ws.Cell(row, 11).Value = c.CurrentCountry;
                    ws.Cell(row, 12).Value = c.CurrentState;
                    ws.Cell(row, 13).Value = c.CurrentCity;
                    ws.Cell(row, 14).Value = c.WorkLocation;
                    ws.Cell(row, 15).Value = c.NoticePeriod;
                    ws.Cell(row, 16).Value = c.RelevantExperience;
                    ws.Cell(row, 17).Value = c.CurrentlyWorking;
                    ws.Cell(row, 18).Value = c.Organisation;
                    ws.Cell(row, 19).Value = c.PartnerId;
                    ws.Cell(row, 20).Value = c.LastWorkingDay?.Date;
                    ws.Cell(row, 20).Style.DateFormat.Format = "dd-MMM-yyyy";
                    ws.Cell(row, 21).Value = c.PartnerAlias;
                    ws.Cell(row, 22).Value = c.Domain;
                    ws.Cell(row, 23).Value = c.SubDomain;
                    ws.Cell(row, 24).Value = c.HiringManager;
                    ws.Cell(row, 25).Value = c.InterviewRoundOrder;
                    ws.Cell(row, 26).Value = c.InterviewRoundName;
                    ws.Cell(row, 27).Value = c.InterviewStatus;
                    ws.Cell(row, 28).Value = c.FinalStatus;
                    ws.Cell(row, 29).Value = c.HRQStatus;
                    ws.Cell(row, 30).Value = c.HRQHoldDate?.Date;
                    ws.Cell(row, 30).Style.DateFormat.Format = "dd-MMM-yyyy";
                    ws.Cell(row, 31).Value = c.ScheduledDate?.Date;
                    ws.Cell(row, 31).Style.DateFormat.Format = "dd-MMM-yyyy";
                    if (!string.IsNullOrEmpty(c.ScheduleTime))
                    {
                        if (TimeSpan.TryParse(c.ScheduleTime, out var time))
                        {
                            ws.Cell(row, 32).Value = time.ToString(@"hh\:mm");
                        }
                        else
                        {
                            ws.Cell(row, 32).Value = c.ScheduleTime;
                        }
                    }
                    else
                    {
                        ws.Cell(row, 32).Value = "";
                    }

                    ws.Cell(row, 33).Value = c.InterviewComments_Feedbacks;
                    ws.Cell(row, 34).Value = c.FeedbackDate?.Date;
                    ws.Cell(row, 34).Style.DateFormat.Format = "dd-MMM-yyyy";
                    ws.Cell(row, 35).Value = c.FeedbackUpdatedBy;
                    ws.Cell(row, 36).Value = c.InterviewTaken == 1 ? "1" : "";
                    ws.Cell(row, 37).Value = c.Comment;
                    ws.Cell(row, 38).Value = c.RescheduleCount;
                    ws.Cell(row, 39).Value = c.DeclineCount;
                    ws.Cell(row, 40).Value = c.Panel;
                    ws.Cell(row, 41).Value = c.LastInterview == 1 ? "1" : "";
                    //ws.Cell(row, 42).Value = c.ProfileCreatedAt;
                    //ws.Cell(row, 43).Value = c.InterviewSlotId;


                    row++;
                }

                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<ApiResponseDto<string>> DropCandidate(int candidateId, CandidateDropOrReintiateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();
                var candidate = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == candidateId));

                var latestInterviewSlot = await _interviewSlotRepository.GetAsync(query => query.Include(x => x.CurrentRound).Where(x => x.CandidateId == candidateId && x.CurrentRound.HiringRequestId == candidate.HiringRequestId).OrderByDescending(x => x.CurrentRoundId));

                if (latestInterviewSlot == null)
                {
                    var currentRound = await _interviewRoundRepository.GetAsync(query => query.Where(x => x.HiringRequestId == candidate.HiringRequestId).OrderBy(x => x.Id));

                    var interviewSlot = new InterviewSlot()
                    {
                        CurrentRoundId = currentRound.Id,
                        CandidateId = candidate.Id,
                        Date = DateTime.UtcNow,
                        Time = DateTime.UtcNow.TimeOfDay,
                        Feedback = "Candidate dropped from candidate profile",
                        CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.DROPPED,
                        IsActive = true,
                        IsInterviewCompleted = false,
                        LastStatusUpdated = DateTime.UtcNow,
                        InterviewRoundStartDate = candidate.ReUploadedCandidateOn ?? candidate.CreatedAt,
                        InterviewRoundCompleteDate = DateTime.UtcNow
                    };

                    await _interviewSlotRepository.AddAsync(interviewSlot);
                }
                else if (latestInterviewSlot != null && latestInterviewSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.SELECTED
                && latestInterviewSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.REJECTED
                && latestInterviewSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.DROPPED)
                {
                    latestInterviewSlot.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.DROPPED;
                    await _interviewSlotRepository.UpdateAsync(latestInterviewSlot);
                }

                candidate.PreviousIntakeStatusId = candidate.IntakeStatusId;
                candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP;
                candidate.CandidateDroppedOn = DateTime.UtcNow;

                candidate.CandidateDropOrReintiateByUserId = loggedInUserDetails.UserId;
                candidate.CandidateDropOrReintiateByUserComments = dto.DropOrReintiateByUserComments;

                await _candidateFormRepository.UpdateAsync(candidate, false);

                var candidateHistroy = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.PartnerId == candidate.PartnerId && x.CandidateId == candidate.Id && x.HiringRequestId == candidate.HiringRequestId));

                if (candidateHistroy != null)
                {
                    candidateHistroy.PreviousIntakeStatusId = candidate.PreviousIntakeStatusId;
                    candidateHistroy.IntakeStatusId = candidate.IntakeStatusId;
                    candidateHistroy.CandidateDroppedOn = candidate.CandidateDroppedOn;

                    candidateHistroy.CandidateDropOrReintiateByUserId = loggedInUserDetails.UserId;
                    candidateHistroy.CandidateDropOrReintiateByUserComments = dto.DropOrReintiateByUserComments;

                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistroy, false);
                }

            }, "Candidate dropped successfully.");
        }

        public async Task<ApiResponseDto<string>> ReenableDroppedCandidate(int candidateId, CandidateDropOrReintiateDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var candidate = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == candidateId));

                var latestInterviewSlot = await _interviewSlotRepository.GetAsync(query => query.Include(x => x.CurrentRound).Where(x => x.CandidateId == candidateId && x.CurrentRound.HiringRequestId == candidate.HiringRequestId).OrderByDescending(x => x.CurrentRoundId));

                var hiring = await _hiringRepository.GetAsync(query => query.Include(x => x.HiringStatus).Where(x => x.Id == candidate.HiringRequestId));

                if (hiring.HiringStatusId != (int)HIRING_STATUS.WIP && hiring.HiringStatusId != (int)HIRING_STATUS.CANDIDATE_IDENTIFIED && hiring.HiringStatusId != (int)HIRING_STATUS.OFFER_ACCEPTED)
                    throw new Exception($"Assigned HRQ is {hiring.HiringStatus?.Name}");

                if (latestInterviewSlot != null && latestInterviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.DROPPED)
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

                    await _interviewSlotRepository.UpdateAsync(latestInterviewSlot, false);
                }

                candidate.IntakeStatusId = candidate.PreviousIntakeStatusId ?? await _candidateHelperMethods.GetIntakeStatusBasedOnInterviewRoundStatus(candidate.HiringRequestId, candidate.Id);
                candidate.CandidateDroppedOn = null;
                candidate.CandidateReintiatedOn = DateTime.Now;
                candidate.PreviousIntakeStatusId = null;
                candidate.CandidateDropOrReintiateByUserId = loggedInUserDetails.UserId;
                candidate.CandidateDropOrReintiateByUserComments = dto.DropOrReintiateByUserComments;


                await _candidateFormRepository.UpdateAsync(candidate, false);

                var candidateHistroy = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.PartnerId == candidate.PartnerId && x.CandidateId == candidate.Id && x.HiringRequestId == candidate.HiringRequestId));

                if (candidateHistroy != null)
                {
                    candidateHistroy.IntakeStatusId = candidate.IntakeStatusId;
                    candidateHistroy.CandidateDroppedOn = null;
                    candidateHistroy.CandidateDropOrReintiateByUserId = loggedInUserDetails.UserId;
                    candidateHistroy.CandidateDropOrReintiateByUserComments = dto.DropOrReintiateByUserComments;

                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistroy, false);
                }

            }, "Candidate re-intiated successfully.");
        }


        #endregion CandidateForms
    }
}