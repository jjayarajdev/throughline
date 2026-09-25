using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using Microsoft.EntityFrameworkCore;


namespace EpicenterX.BackgroundServices
{
    public class EpiCenterDailyService(IServiceProvider _serviceProvider,
                                       ILogger<EpiCenterDailyService> _logger) : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Creating Scope
                    using var scope = _serviceProvider.CreateScope();

                    // Create Repo Instances
                    var _candidateRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<Candidate>>();
                    var _candidateBinRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<CandidateBin>>();
                    var _partnerRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<Partner>>();
                    var _hiringRequestRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<HiringRequest>>();
                    var _userRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<Users>>();
                    var _interviewSlotRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<InterviewSlot>>();
                    var _configRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<M_Configuration>>();

                    var rmOwnerConfiguration = await _configRepository.GetAsync(query => query.Where(x => x.ConfigKey == CONFIGURATON_KEYS.DefaultRMOwnerEmail.ToString()));
                    var defaultRMOwnerAssignHoursConfiguration = await _configRepository.GetAsync(query => query.Where(x => x.ConfigKey == CONFIGURATON_KEYS.DefaultRMOwnerAssignHours.ToString()));
                    var defaultOnHoldCandidatesRejectConfiguration = await _configRepository.GetAsync(query => query.Where(x => x.ConfigKey == CONFIGURATON_KEYS.DefaultOnHoldRejectInDays.ToString()));
                    var defaultPartnerInactiveInDaysConfiguration = await _configRepository.GetAsync(query => query.Where(x => x.ConfigKey == CONFIGURATON_KEYS.DefaultPartnerInactiveInDays.ToString()));

                    #region 1. Inactive Partners whoever not upload a candidate profile since 30 days / evaluation end date is completed.
                    ////<----------Commented the below code to stop automatic partner deactivation if not upload any profile since 30 days.--------->
                    _logger.LogInformation("Service : Getting partner list : Not uploading Profile since 30 days : {time}", DateTimeOffset.Now);

                    if (int.TryParse(defaultPartnerInactiveInDaysConfiguration.ConfigValue, out int defaultPartnerInactiveInDays))
                    {
                        var startDate = DateTime.UtcNow.AddDays(-(defaultPartnerInactiveInDays)).Date;

                        var empanelledStatues = new List<int>() { (int)EVALUATION_STATUS.COMPLETED, (int)EVALUATION_STATUS.EMPANELLED };

                        var partners = await _partnerRepository.GetListAsync(query => query.Include(p => p.Engagements)
                                                                                           .Include(p => p.PartnerStatus)
                                                                                           .Where(p => p.PartnerStatusId == (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS)
                                                                                           .Where(p => p.Engagements.All(e => !empanelledStatues.Contains(e.EvaluationStatusId ?? 11002)))
                                                                                           .Where(p => p.PartnerEmpanel.IsEmpaneledPartner != true)
                                                                                           .Where(p => p.StartDate < startDate)
                                                                             );

                        var partnerIds = partners.Select(p => p.Id).ToList();

                        // Get all partners that have submitted at least one candidate in the last 30 days
                        var activePartnerIds = (await _candidateRepository.GetListAsync(query => query
                            .Where(c => c.CreatedAt < startDate && c.PartnerId != null && partnerIds.Contains(c.PartnerId.Value))))
                            .Select(c => c.PartnerId!.Value)
                            .Distinct()
                            .ToList();

                        List<Partner> inactivePartners = [.. partners.Where(p => !activePartnerIds.Contains(p.Id) && (p.LastActivatedDate == null || p.LastActivatedDate < startDate))];

                        var expiredPartners = await _partnerRepository.GetListAsync(query => query.Include(p => p.Engagements).Include(p => p.PartnerEmpanel).Include(p => p.PartnerStatus)
                                                                                                  .Where(p => p.PartnerStatusId == (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS)
                                                                                                  .Where(p => p.Engagements.Count > 0 && p.Engagements.All(e => !empanelledStatues.Contains(e.EvaluationStatusId ?? 0) && (e.IsExtendedEvaluation == true ? e.EvaluationExtendedDate < DateTime.UtcNow : e.EvaluationEndDate < DateTime.UtcNow)))
                                                                                                  .Where(p => p.PartnerEmpanel.IsEmpaneledPartner != true)
                          );

                        var expiredPartnerIds = expiredPartners.Select(p => p.Id).ToList();

                        inactivePartners.AddRange(expiredPartners.Where(x => inactivePartners.All(y => y.Id != x.Id)));

                        if (inactivePartners.Count > 0)
                        {
                            foreach (var partner in inactivePartners)
                            {
                                partner.PartnerStatusId = (int)PARTNER_STATUS.INACTIVE;
                            }

                            await _partnerRepository.UpdateListAsync(inactivePartners);
                        }

                        _logger.LogInformation("Partner status updated at: {time}", DateTimeOffset.Now);
                    }
                    #endregion


                    #region 2. Automatically assign RMOwner if any hiring request not assigned until 48 hours.

                    ////<----------Commented the below code to stop automatic RMOwner assign if no RMOwner accepted Hiring request since 48 hours.--------->

                    _logger.LogInformation("Service : Getting HiringRequest list : Not assigned RMOwner since 48 hours : {time}", DateTimeOffset.Now);

                    if (int.TryParse(defaultRMOwnerAssignHoursConfiguration.ConfigValue, out int defaultRMOwnerAssignHours))
                    {
                        var defaultRMOwner = await _userRepository.GetAsync(query => query.Where(x => x.Email == rmOwnerConfiguration.ConfigValue));

                        if (defaultRMOwner != null)
                        {
                            var unassignedRequests = await _hiringRequestRepository.GetListAsync(query =>
                           query.Where(x => x.ApprovalStatusId == (int)APPROVAL_STATUS.APPROVED &&
                                            x.RmOwnerId == null &&
                                            x.ApproverUpdatedDate != null &&
                                            x.ApproverUpdatedDate <= DateTime.UtcNow.AddHours(-(defaultRMOwnerAssignHours))));

                            if (unassignedRequests.Any())
                            {
                                foreach (var hrq in unassignedRequests)
                                {
                                    hrq.RmOwnerId = defaultRMOwner?.UserId;
                                    hrq.RmOwnerAcceptedOn = DateTime.UtcNow;
                                    hrq.IsRMOwnerAccepted = true;
                                    hrq.RMOwnerComments = $"The RM Owner was automatically assigned to {defaultRMOwner?.FullName} after 48 hours due to no response.";
                                }

                                await _hiringRequestRepository.UpdateListAsync(unassignedRequests);
                            }
                        }
                    }
                    #endregion


                    #region 3. Reject ONHOLD interviews older than 14 days

                    _logger.LogInformation("Service : Getting Candidates list : If interviewStatus is on hold since last 14 days : {time}", DateTimeOffset.Now);

                    List<Candidate> feedbackOnholdedCandidates = [];

                    if (int.TryParse(defaultOnHoldCandidatesRejectConfiguration.ConfigValue, out int defaultOnHoldCandidatesRejectInDays))
                    {
                        var onholdInterviews = await _interviewSlotRepository.GetListAsync(query =>
                        query.Where(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.ONHOLD &&
                                         x.LastStatusUpdated.HasValue &&
                                         x.LastStatusUpdated.Value.Date <= DateTime.UtcNow.AddDays(-(defaultOnHoldCandidatesRejectInDays)).Date));
                        if (onholdInterviews.Any())
                            foreach (var item in onholdInterviews)
                            {
                                try
                                {
                                    item.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.REJECTED;

                                    await _interviewSlotRepository.UpdateAsync(item);

                                    var onholdedCandidate = await _candidateRepository.GetAsync(item.CandidateId);

                                    onholdedCandidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.REJECTED;

                                    feedbackOnholdedCandidates.Add(onholdedCandidate);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "Failed to update ONHOLD interview slot ID: {id}", item.Id);
                                }
                            }

                        if (feedbackOnholdedCandidates?.Count > 0)
                            await _candidateRepository.UpdateListAsync(feedbackOnholdedCandidates);

                    }
                    #endregion


                    _logger.LogInformation("Candidate cleanup executed at: {time}", DateTimeOffset.Now);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing candidate cleanup.");
                }


                try
                {
                    await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Candidate cleanup service is stopping...");
                    break;
                }
            }
        }
    }
}
