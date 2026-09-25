using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class DashboardService(AppDBContext _dbContext,
        IGenericRepository<Partner> _partnerRepository,
        IHelperMethods _helperMethods,
        IGenericRepository<HiringRequest> _hiringRepository) : BaseService, IDashboardService
    {
        public async Task<ApiResponseDto<DashboardDto>> GetDashboardDetails()
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var today = DateTime.Today;
                var currentDayOfWeek = (int)today.DayOfWeek;

                // Assuming week starts on Monday (you can adjust if your week starts on Sunday)
                var weekStart = today.AddDays(-((currentDayOfWeek + 6) % 7)); // Monday
                var weekEnd = weekStart.AddDays(6); // Sunday

                var weeklySubmissions = _dbContext.CandidateForms.Include(x => x.HiringRequest).ThenInclude(h => h!.Domain)
    .Where(ci => ci.CreatedAt >= weekStart && ci.CreatedAt <= weekEnd
        && (
           (loggedInUserDetails.RoleId == (int)ROLES.ADMIN)
        || (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER)
        || (loggedInUserDetails.RoleId == (int)ROLES.RMOwner)
                                        || (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER && ci.HiringRequest != null && ci.HiringRequest.HiringMangerId == loggedInUserDetails.UserId)
                                        || (loggedInUserDetails.RoleId == (int)ROLES.DomainManager && ci.HiringRequest != null && ci.HiringRequest.Domain != null && ci.HiringRequest.Domain.DomainManagerId == loggedInUserDetails.UserId)
                                        || (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && ci.PartnerId == loggedInUserDetails.PartnerId)
                                        || (loggedInUserDetails.RoleId == (int)ROLES.BETMember && ci.HiringRequest != null && ci.HiringRequest.CreatedBy == loggedInUserDetails.UserId)
                                        || (loggedInUserDetails.RoleId == (int)ROLES.PANEL && ci.HiringRequest != null && ci.HiringRequest.InterviewRounds != null && ci.HiringRequest.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUserDetails.UserId ?? 0)))
                                        || (loggedInUserDetails.RoleId == (int)ROLES.BETApprover && ci.HiringRequest != null && ci.HiringRequest.BETApproverId == loggedInUserDetails.UserId))
        )
                                        .AsEnumerable() // switch to in-memory processing
                                        .GroupBy(ci => ci.CreatedAt!.Value.DayOfWeek)
    .Select(g => new KeyValues
    {
                                            Name = g.Key.ToString(),   // e.g. "Monday"
        Count = g.Count()
    })
                                        .OrderBy(g => (int)Enum.Parse(typeof(DayOfWeek), g.Name!))
                                        .ToList(); ;


                var activePartners = (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER || loggedInUserDetails.RoleId == (int)ROLES.DomainManager || loggedInUserDetails.RoleId == (int)ROLES.PARTNER) ? 0 : await _partnerRepository.GetCountAsync(query => query.Where(x => x.PartnerStatusId == (int)PARTNER_STATUS.ACTIVE));

                var activeCandidates = await _dbContext.CandidateForms.Include(x => x.HiringRequest)
                                                        .ThenInclude(h => h.Domain)
                                                        .Where(x =>
                                                                 x.IntakeStatusId != null 
                                                                 && x.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.REJECTED
                                                                 && x.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP
                                                                 && x.IntakeStatusId != (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED
                                                                 && x.IsFreezed != true
                                                                 && (
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.RMOwner) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.PARTNER
                                                                          && x.PartnerId == loggedInUserDetails.PartnerId) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.PANEL && x.HiringRequest != null
                                                                          && (x.HiringRequest.InterviewRounds != null && x.HiringRequest.InterviewRounds.Any(r => r.Panel != null && r.Panel.Contains(loggedInUserDetails.UserId ?? 0))
                                                                              || x.InterviewSlots != null && x.InterviewSlots.Any(s => s.Panel != null && s.Panel.Contains(loggedInUserDetails.UserId ?? 0))
                                                                          )
                                                                     ) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.BETApprover && x.HiringRequest != null
                                                                          && x.HiringRequest.BETApproverId == loggedInUserDetails.UserId) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.BETMember && x.HiringRequest != null
                                                                          && x.HiringRequest.CreatedBy == loggedInUserDetails.UserId) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.DomainManager && x.HiringRequest != null && x.HiringRequest.Domain != null
                                                                          && x.HiringRequest.Domain.DomainManagerId == loggedInUserDetails.UserId) ||
                                                                     (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER && x.HiringRequest != null
                                                                          && x.HiringRequest.HiringMangerId == loggedInUserDetails.UserId)
                                                                 ))
                                                        .CountAsync();


                var activeRequests = await _hiringRepository.GetCountAsync(query => query.Where(x => (x.HiringStatusId == (int)HIRING_STATUS.WIP || x.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED || x.HiringStatusId == (int)HIRING_STATUS.OFFER_ACCEPTED) &&
                                                                                               (
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.RMOwner) ||
                                                                                                      //(loggedInUserDetails.RoleId == (int)ROLES.PARTNER && x.PartnerCategory != null && x.PartnerCategory.IsProxyPartner == false && x.PartnerCategory.IsSpecificPartner == true && x.PartnerCategory.SelectedPartners!.Any(x => x.PartnerId == loggedInUserDetails.PartnerId)) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && x.PartnerCategory != null && x.PartnerCategory.IsProxyPartner == false && x.PartnerCategory.SelectedPartners.Any(x => x.PartnerId == loggedInUserDetails.PartnerId)) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.PANEL && x.InterviewRounds != null && x.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUserDetails.UserId ?? 0))) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.BETApprover && x.BETApproverId == loggedInUserDetails.UserId) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.BETMember && x.CreatedBy == loggedInUserDetails.UserId) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.DomainManager && x.Domain != null && x.Domain.DomainManagerId == loggedInUserDetails.UserId) ||
                                                                                                      (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER && x.HiringMangerId == loggedInUserDetails.UserId)
                                                                                               )
                ));

                var unassignedHiringRequestCount = await _hiringRepository.GetCountAsync(query => query.Where(x => x.ApprovalStatusId == (int)APPROVAL_STATUS.APPROVED && (x.IsRMOwnerAccepted == null || x.IsRMOwnerAccepted == false)
                && (
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.RMOwner) ||
                                                                                                                //(loggedInUserDetails.RoleId == (int)ROLES.PARTNER && x.PartnerCategory != null && x.PartnerCategory.IsProxyPartner == false && x.PartnerCategory.IsSpecificPartner == true && x.PartnerCategory.SelectedPartners!.Any(x => x.PartnerId == loggedInUserDetails.PartnerId)) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && x.PartnerCategory != null && x.PartnerCategory.IsProxyPartner == false && x.PartnerCategory.SelectedPartners.Any(x => x.PartnerId == loggedInUserDetails.PartnerId)) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.PANEL && x.InterviewRounds != null && x.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUserDetails.UserId ?? 0))) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.BETApprover && x.BETApproverId == loggedInUserDetails.UserId) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.BETMember && x.CreatedBy == loggedInUserDetails.UserId) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.DomainManager && x.Domain != null && x.Domain.DomainManagerId == loggedInUserDetails.UserId) ||
                                                                                                                (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER && x.HiringMangerId == loggedInUserDetails.UserId)
                    )
                ));

                var partnersDistibutions = await _dbContext.CandidateForms
                                .Where(c => c.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.ONBOARDED
                                         && !string.IsNullOrEmpty(c.Partner.PartnerName)
                                         && (loggedInUserDetails.RoleId == (int)ROLES.PARTNER || loggedInUserDetails.PartnerId == null || c.PartnerId == loggedInUserDetails.PartnerId))
                                .GroupBy(c => c.Partner.PartnerName)
                                .Select(g => new KeyValues()
                                {
                                    Name = g.Key,
                                    Count = g.Count()
                                }).ToListAsync();

                var candidateStageSummary = await _dbContext.CandidateForms.Include(x => x.HiringRequest).ThenInclude(h => h.Domain)
                                .Where(ci => ci.IntakeStatusId != null &&
                                (
                                  (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.RMOwner) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER && ci.HiringRequest != null && ci.HiringRequest.HiringMangerId == loggedInUserDetails.UserId) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.DomainManager && ci.HiringRequest != null && ci.HiringRequest.Domain != null && ci.HiringRequest.Domain.DomainManagerId == loggedInUserDetails.UserId) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && ci.PartnerId == loggedInUserDetails.PartnerId) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.PANEL && ci.HiringRequest != null && ci.HiringRequest.InterviewRounds != null && ci.HiringRequest.InterviewRounds.Any(x => x.Panel != null && x.Panel.Contains(loggedInUserDetails.UserId ?? 0))) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.BETMember && ci.HiringRequest != null && ci.HiringRequest.CreatedBy == loggedInUserDetails.UserId) ||
                                  (loggedInUserDetails.RoleId == (int)ROLES.BETApprover && ci.HiringRequest != null && ci.HiringRequest.BETApproverId == loggedInUserDetails.UserId))
                                )
                                .GroupBy(ci => ci.IntakeStatus.Name)
                                .Select(g => new KeyValues()
                                {
                                    Name = g.Key,
                                    Count = g.Count()
                                })
                                .ToListAsync();

                DashboardDto _dashBoardDto = new()
                {
                    ActivePartners = activePartners,
                    ActiveCandidates = activeCandidates,
                    ActiveRequests = activeRequests,
                    UnassignedHiringRequestCount = unassignedHiringRequestCount,
                    PartnersDistibutions = partnersDistibutions,
                    CandidateStageSummary = candidateStageSummary,
                    WeeklySubmissions = [.. weeklySubmissions]
                };

                if (loggedInUserDetails.RoleId == (int)ROLES.PANEL | loggedInUserDetails.RoleId == (int)ROLES.DomainManager || loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER)
                {
                    _dashBoardDto.InterviewsCompleted = await _dbContext.InterviewSlotAllocation.Include(x => x.CurrentRound)
                                                                                                 .Where(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED
                                                                                                            && ((x.Panel != null && x.Panel.Contains(loggedInUserDetails.UserId ?? 0))
                                                                                                    || (x.CurrentRound != null && x.CurrentRound.Panel != null && x.CurrentRound.Panel.Contains(loggedInUserDetails.UserId ?? 0))))
                                                                                                  .Select(x => x.Id)
                                                                                                  .Where(hrqId => hrqId != 0)
                                                                                                  .Distinct()
                                                                                                  .CountAsync();

                    _dashBoardDto.InterviewsScheduled = await _dbContext.InterviewSlotAllocation.Include(x => x.CurrentRound)
                                                                                                 .Where(x => (x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.PENDING || x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.INTERVIEW_SCHEDULED)
                                                                                                     && ((x.Panel != null && x.Panel.Contains(loggedInUserDetails.UserId ?? 0))
                                                                                                    || (x.CurrentRound != null && x.CurrentRound.Panel != null && x.CurrentRound.Panel.Contains(loggedInUserDetails.UserId ?? 0))))
                                                                                                 .Select(x => x.Id)
                                                                                                 .Where(hrqId => hrqId != 0)
                                                                                                 .Distinct()
                                                                                                 .CountAsync();


                    _dashBoardDto.FeedbackPending = await _dbContext.InterviewSlotAllocation.Include(x => x.CurrentRound)
                                                                                            .Where(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.FEEDBACK_PENDING
                                                                                                && ((x.Panel != null && x.Panel.Contains(loggedInUserDetails.UserId ?? 0))
                                                                                                    || (x.CurrentRound != null && x.CurrentRound.Panel != null && x.CurrentRound.Panel.Contains(loggedInUserDetails.UserId ?? 0))))
                                                                                            .Select(x => x.Id)
                                                                                            .Where(hrqId => hrqId != 0)
                                                                                            .Distinct()
                                                                                            .CountAsync();


                    _dashBoardDto.FeedbackGiven = await _dbContext.InterviewSlotAllocation.Include(x => x.CurrentRound)
                                                                                           .Where(x => (x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED || x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.REJECTED)
                                                                                               && (x.FeedbackGivenByUserId == loggedInUserDetails.UserId))
                                                                                           .Select(x => x.Id)
                                                                                           .Where(hrqId => hrqId != 0)
                                                                                           .Distinct()
                                                                                           .CountAsync();
                }

                return _dashBoardDto;

            }, "Dashboard details fetched successfully.");
        }
    }
}

