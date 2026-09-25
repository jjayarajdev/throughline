using AutoMapper;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Enums;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Extensions.HelperMethods
{

    public interface ICandidateHelperMethods
    {
        string NormalizePhone(string phone);
        Task<bool> VerifyProfileCap(int? partnerId, int? hiringRequestId);
        Task<bool> VerifyScreeningCap(int? hiringRequestId);
        Task<int?> GetIntakeStatusBasedOnHiringRequestId(int? hiringRequestId);
        Task<int?> GetIntakeStatusBasedOnInterviewRoundStatus(int? hiringRequestId, int? candidateId);
        Task<int?> GetCandidateStatusBasedInterviewRoundId(int? interviewRoundId, int? status);
        MarkDuplicateCandidateDto MarkIfCandidateIsExistedInCandidateForms(string? email, string? phone);
        Task MarkDuplicateIfCandidateIsExistedInCandidateBin(int? CurrentBinId, string CandidateCode, string? email, string? phone);
        Task<Users> GetOnboardingManagerDetails();
    }


    public class CandidateHelperMethods(IGenericRepository<PartnerCategory> _partnerCategoryRepository,
                                        IGenericRepository<Candidate> _candidateFormRepository,
                                        IGenericRepository<InterviewRound> _interviewRoundRepository,
                                        IGenericRepository<InterviewSlot> _interviewSlotRepository,
                                        IGenericRepository<CandidateRateCard> _rateCardRepository,
                                        IGenericRepository<Users> _userRoundRepository,
                                        IGenericRepository<M_Configuration> _configRepository,
                                        IMapper _mapper,
                                        AppDBContext _context) : ICandidateHelperMethods
    {
        public string NormalizePhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return string.Empty;

            // Keep only digits
            return new string([.. phone.Where(char.IsDigit)]);
        }

        public async Task<bool> VerifyProfileCap(int? partnerId, int? hiringRequestId)
        {
            var partnerCategory = await _partnerCategoryRepository.GetAsync(query => query
               .Where(x => x.HiringRequestId == hiringRequestId)) ?? throw new Exception("No profilecap added.");

            int formCount = await _candidateFormRepository
                .GetCountAsync(query => query.Where(x => x.CreatedAt >= DateTime.Today && x.CreatedAt < DateTime.Today.AddDays(1)
                        && x.PartnerId == partnerId && x.HiringRequestId == hiringRequestId));

            return formCount >= partnerCategory.ProfileCAP;
        }

        public async Task<bool> VerifyScreeningCap(int? hiringRequestId)
        {
            var screeningRound = await _interviewRoundRepository.GetAsync(query => query
               .Where(x => x.HiringRequestId == hiringRequestId && x.RoundNameId == (int)INTERVIEW_ROUND.SCREENING));
            if (screeningRound == null)
                return false;

            if (screeningRound.ScreeningCap == null)
                return false;

            // Get today's count from candidate form
            int formCount = await _candidateFormRepository
                .GetCountAsync(query => query.Where(x => x.CreatedAt >= DateTime.Today && x.CreatedAt < DateTime.Today.AddDays(1) && x.HiringRequestId == hiringRequestId));

            return formCount >= screeningRound.ScreeningCap;
        }

        public async Task<int?> GetIntakeStatusBasedOnHiringRequestId(int? hiringRequestId)
        {
            var interviewRounds = await _interviewRoundRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == hiringRequestId));

            if (interviewRounds != null && interviewRounds!.Any(x => x.RoundNameId == (int)INTERVIEW_ROUND.SCREENING
            || x.RoundNameId == (int)INTERVIEW_ROUND.CODE_ASSESSMENT
            || x.RoundNameId == (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT))
            {
                return (int)CANDIDATE_INTAKE_STATUS.SCREENING;
            }
            else if (interviewRounds != null && interviewRounds!.Any(x => x.RoundNameId != (int)INTERVIEW_ROUND.SCREENING
            && x.RoundNameId != (int)INTERVIEW_ROUND.CODE_ASSESSMENT
            && x.RoundNameId != (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT))
            {
                return (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING;
            }

            return null;
        }

        public async Task<int?> GetIntakeStatusBasedOnInterviewRoundStatus(int? hiringRequestId, int? candidateId)
        {
            var candidate = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == candidateId)) ?? throw new Exception($"No candidate found with Id : {candidateId}");

            var interviewRounds = await _interviewRoundRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == hiringRequestId));

            var currentInterviewSlot = await _interviewSlotRepository.GetAsync(query => query.Include(x => x.CurrentRound)
                                                                                             .Where(x => x.CandidateId == candidateId)
                                                                                             .OrderByDescending(x => x.CurrentRoundId));

            if (currentInterviewSlot == null)
            {
                if (interviewRounds != null && interviewRounds!.Any(x => x.RoundNameId == (int)INTERVIEW_ROUND.SCREENING
                || x.RoundNameId == (int)INTERVIEW_ROUND.CODE_ASSESSMENT
                || x.RoundNameId == (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT))
                    return (int)CANDIDATE_INTAKE_STATUS.SCREENING;
                else if (interviewRounds != null && interviewRounds!.Any(x => x.RoundNameId != (int)INTERVIEW_ROUND.SCREENING
                && x.RoundNameId != (int)INTERVIEW_ROUND.CODE_ASSESSMENT
                && x.RoundNameId != (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT))
                    return (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING;
            }
            else
            {
                if (currentInterviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.REJECTED)
                    return (int)CANDIDATE_INTAKE_STATUS.REJECTED;
                else if (currentInterviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.DROPPED)
                    return (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_DROP;
                else if (currentInterviewSlot.CurrentRound?.RoundNumber < interviewRounds.Count())
                {
                    if (currentInterviewSlot.CurrentRound.RoundNameId == (int)INTERVIEW_ROUND.SCREENING
                        || currentInterviewSlot.CurrentRound.RoundNameId == (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT
                        || currentInterviewSlot.CurrentRound.RoundNameId == (int)INTERVIEW_ROUND.CODE_ASSESSMENT)
                        return (int)CANDIDATE_INTAKE_STATUS.SCREENING;
                    else
                        return (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING;
                }
                else if (currentInterviewSlot.CurrentRound?.RoundNumber == interviewRounds.Count())
                {
                    var rateCard = await _rateCardRepository.GetAsync(query => query.Where(x => x.CandidateId == candidateId));

                    if (rateCard != null)
                    {
                        if (candidate.OfferAcceptedOn != null)
                            return (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED;
                        else if (candidate.OfferDeclinedOn != null)
                            return (int)CANDIDATE_INTAKE_STATUS.OFFER_DECLINED;
                        else if (candidate.OfferRolledOutOn != null)
                            return (int)CANDIDATE_INTAKE_STATUS.OFFER_ROLLED_OUT;
                    }
                    else if (currentInterviewSlot.CandidateInterviewStatusId == (int)INTERVIEW_SLOT_STATUS.SELECTED)
                        return (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED;
                    else if (currentInterviewSlot.CandidateInterviewStatusId != (int)INTERVIEW_SLOT_STATUS.SELECTED)
                        return (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING;
                }
            }

            return null;
        }

        public async Task<int?> GetCandidateStatusBasedInterviewRoundId(int? interviewRoundId, int? status)
        {
            var currentInterviewround = await _interviewRoundRepository.GetAsync(query => query.Where(x => x.Id == interviewRoundId)) ?? throw new Exception($"No interviewround found with Id : {interviewRoundId}");

            if (status == (int)INTERVIEW_SLOT_STATUS.SELECTED || status == (int)INTERVIEW_SLOT_STATUS.REJECTED)
            {

                if (currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.SCREENING)
                {
                    return status == (int)INTERVIEW_SLOT_STATUS.SELECTED ? (int)CANDIDATE_STATUS.SCREEN_SELECT : (int)CANDIDATE_STATUS.SCREEN_REJECT;
                }
                else if (currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.ONLINE_ASSESSMENT || currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.CODE_ASSESSMENT ||
                    currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.BUSINESS_CASE || currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.TECHNICAL)
                {
                    return status == (int)INTERVIEW_SLOT_STATUS.SELECTED ? (int)CANDIDATE_STATUS.TECH_SELECT : (int)CANDIDATE_STATUS.TECH_REJECT;
                }
                else if (currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.TECHNICAL_OPS || currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.OPS ||
                    currentInterviewround.RoundNameId == (int)INTERVIEW_ROUND.FINAL)
                {
                    return status == (int)INTERVIEW_SLOT_STATUS.SELECTED ? (int)CANDIDATE_STATUS.OPS_SELECT : (int)CANDIDATE_STATUS.OPS_REJECT;
                }
            }

            return null;
        }

        public MarkDuplicateCandidateDto MarkIfCandidateIsExistedInCandidateForms(string? email, string? phone)
        {
            var emailParam = new SqlParameter("@Email", email ?? (object)DBNull.Value);
            var phoneParam = new SqlParameter("@Phone", phone ?? (object)DBNull.Value);

            var results = _context.DuplicateCheckResult
                .FromSqlRaw("EXEC dbo.FindDuplicateCandidatesSummary @Email, @Phone", emailParam, phoneParam)
                .ToList();

            var duplicateInfo = results.FirstOrDefault();

            return _mapper.Map<MarkDuplicateCandidateDto>(duplicateInfo) ?? new MarkDuplicateCandidateDto();
        }

        public async Task MarkDuplicateIfCandidateIsExistedInCandidateBin(int? CurrentBinId, string CandidateCode, string? email, string? phone)
        {
            await _context.Database.ExecuteSqlRawAsync("EXEC UpdateDuplicateCandidateCode @CurrentReviewCandidateId = {0}, @CandidateCode = {1}, @Email = {2}, @Phone = {3}", CurrentBinId, CandidateCode, email, phone);
        }



        public async Task<Users> GetOnboardingManagerDetails()
        {
            var onboardingManagerConfiguration = await _configRepository.GetAsync(query => query.Where(x => x.ConfigKey == CONFIGURATON_KEYS.DefaultOnboardingManagerEmail.ToString()));

            var onboardingManager = await _userRoundRepository.GetAsync(query => query.Where(x => x.Email == onboardingManagerConfiguration.ConfigValue));

            return onboardingManager;
        }
    }
}
