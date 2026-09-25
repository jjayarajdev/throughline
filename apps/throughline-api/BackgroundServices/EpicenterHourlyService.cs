using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.BackgroundServices
{
    public class EpicenterHourlyService(IServiceProvider _serviceProvider,
                                        ILogger<EpicenterHourlyService> _logger) : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var startDate = DateTime.UtcNow.AddDays(-30).Date;
            var endDate = DateTime.UtcNow.Date;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();

                    var _interviewSlotRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<InterviewSlot>>();
                    var _interviewSlotHistoryRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<InterviewSlotAllocationHistory>>();
                    var _candidateFormRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<Candidate>>();
                    var _candidateFormHistoryRepository = scope.ServiceProvider.GetRequiredService<IGenericRepository<CandidateHistory>>();


                    #region  1. Drop pending interviews that exceeded ValidityHours without Partner acceptance

                    var expiredSlots = await _interviewSlotRepository.GetListAsync(query => query.Where(x => x.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.PENDING &&
                                                                                                             x.ValidityHours.HasValue &&
                                                                                                             (x.LastStatusUpdated ?? x.CreatedAt) <= DateTime.UtcNow.AddHours(-x.ValidityHours.Value)));

                    foreach (var item in expiredSlots)
                    {
                        try
                        {
                            var historyItem = new InterviewSlotAllocationHistory
                            {
                                CandidateId = item.CandidateId,
                                PartnerId = item.PartnerId,
                                Partner = item.Partner,
                                CurrentRoundId = item.CurrentRoundId,
                                CurrentRound = item.CurrentRound,
                                Date = item.Date,
                                Time = item.Time,
                                Panel = item.Panel,
                                ValidityHours = item.ValidityHours,
                                Duration = item.Duration,
                                IsPartnerAccepted = item.IsPartnerAccepted,
                                RejectedOn = DateTime.UtcNow,
                                RejectedReason = "This slot is auto cancelled due to Partner is not accepted with in validity hours.",
                                RejectionCount = item.RejectionCount,
                                IsResheduled = item.IsResheduled,
                                Feedback = item.Feedback,
                                CandidateRating = item.CandidateRating?.ToList(),
                                CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.DECLINED,
                                AddedAt = DateTime.UtcNow // history usually records time of entry
                            };

                            await _interviewSlotHistoryRepository.AddAsync(historyItem);

                            if (item.RejectionCount >= 3)
                            {
                                item.CandidateInterviewStatusId = (int)INTERVIEW_SLOT_STATUS.DROPPED;
                            }
                            else
                            {
                                item.RejectionCount = (item.RejectionCount ?? 0) + 1;
                                // Clear interview-specific fields
                                item.Date = null;
                                item.Time = null;
                                item.ValidityHours = null;
                                item.Duration = null;
                                item.HMAdditionalComments = null;
                                item.Panel = null;
                                item.CandidateInterviewStatusId = null;
                            }

                            await _interviewSlotRepository.UpdateAsync(item, false);

                            var candidate = await _candidateFormRepository.GetAsync(item.CandidateId);

                            if (candidate != null && item.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.DROPPED)
                            {
                                candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP;

                                await _candidateFormRepository.UpdateAsync(candidate, false);

                                var candidateHistory = await _candidateFormHistoryRepository.GetAsync(query => query.Where(x => x.PartnerId == candidate.PartnerId
                                                                                                                                && x.HiringRequestId == candidate.HiringRequestId
                                                                                                                                && x.CandidateId == candidate.Id));
                                if (candidateHistory != null)
                                {

                                    candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                                    await _candidateFormHistoryRepository.UpdateAsync(candidateHistory, false);

                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to update PENDING interview slot ID: {id}", item.Id);
                        }
                    }

                    #endregion
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled error in interview slot cleanup job.");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromHours(2), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Interview slot cleanup service stopping...");
                    break;
                }
            }
        }
    }
}
