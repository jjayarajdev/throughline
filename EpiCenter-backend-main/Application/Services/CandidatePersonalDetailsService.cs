using AutoMapper;
using DocumentFormat.OpenXml.Bibliography;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.Onboarding.PersonalDetails;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph.Models.Security;
using Microsoft.Graph.Models;

namespace EpicenterX.Application.Services
{
    public class CandidatePersonalDetailsService(AppDBContext _context,
        IGenericRepository<CandidatePersonalDetails> _repository,
        IGenericRepository<Candidate> _candidateRepository,
        IGenericRepository<HiringRequest> _hiringRepository,
        IGenericRepository<CandidateHistory> _candidateHistoryRepository,

        IMapper _mapper
        ) : BaseService, ICandidatePersonalDetailsService
    {
        public async Task<ApiResponseDto<PagedResult<GetCandidatePersonalDetailsDto>>> GetPagedPersonalDetails(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _repository.GetPaginatedListAsync(
                    pageData,
                    query => query
                    .Include(x => x.Category)
                    .Include(x => x.OnboardingManager)
                    .Include(x => x.Gender)
                    .Include(x => x.TransportRequirement)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.HiringRequest)
                            .ThenInclude(x => x!.JobDetails)
                                .ThenInclude(x => x!.SubDomain)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.Country)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.State)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.City)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.HiringRequest)
                            .ThenInclude(x => x!.Domain)
                );

                var dtos = _mapper.Map<IEnumerable<GetCandidatePersonalDetailsDto>>(result.Items);
                return new PagedResult<GetCandidatePersonalDetailsDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Personal details fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetCandidatePersonalDetailsDto>>> GetPersonalDetailsList()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _repository.GetListAsync(query => query
                    .Include(x => x.Category)
                    .Include(x => x.OnboardingManager)
                    .Include(x => x.Gender)
                    .Include(x => x.TransportRequirement)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.HiringRequest)
                            .ThenInclude(x => x!.JobDetails)
                                .ThenInclude(x => x!.SubDomain)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.HiringRequest)
                            .ThenInclude(x => x!.Business)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.Country)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.State)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.City)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.HiringRequest)
                            .ThenInclude(x => x!.Domain)
                    );

                return _mapper.Map<IEnumerable<GetCandidatePersonalDetailsDto>>(result);

            }, "Personal details list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCandidatePersonalDetailsDto>> GetPersonalDetail(int id, int? candidateId, int? hiringRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                if (id == 0)
                {
                    if (candidateId == null || hiringRequestId == null)
                        throw new ArgumentException("CandidateId and HiringRequestId must be provided when Id is not specified.");

                    return await _candidateRepository.GetItemWithJoinAsync<GetCandidatePersonalDetailsDto>(
                                                            query => from candidate in query

                                                                     join hiring in _context.Hiring on candidate.HiringRequestId equals hiring.Id into hiringGroup
                                                                     from hiring in hiringGroup.DefaultIfEmpty()

                                                                     join ratecard in _context.CandidateRateCard on candidate.CandidateRateCardId equals ratecard.Id into rateCardGroup
                                                                     from ratecard in rateCardGroup.DefaultIfEmpty()

                                                                     join partner in _context.Partners on candidate.PartnerId equals partner.Id into partnerGroup
                                                                     from partner in partnerGroup.DefaultIfEmpty()

                                                                     join intake in _context.M_MasterData on candidate.IntakeStatusId equals intake.Id into intakeGroup
                                                                     from intake in intakeGroup.DefaultIfEmpty()

                                                                     where (candidate.Id == candidateId && candidate.HiringRequestId == hiringRequestId)
                                                                     select new GetCandidatePersonalDetailsDto
                                                                     {
                                                                         Id = 0,
                                                                         CandidateId = candidate.Id,
                                                                         CandidateName = candidate.FullName,
                                                                         CandidateCode = candidate.CandidateCode,
                                                                         PersonalMailId = candidate.Email,
                                                                         Phone = candidate.PhoneNumber,
                                                                         HiringRequestId = hiring != null ? hiring.Id : 0,
                                                                         HrqId = hiring != null ? hiring.HrqId : null,
                                                                         HiringManagerName = hiring != null ? hiring.HiringManager.FullName : null,
                                                                         RoleHiredFor = hiring != null ? hiring.JobTitle : null,
                                                                         SourceId = partner != null ? partner.Id : 0,
                                                                         SourceName = partner != null ? partner.PartnerName : null,
                                                                         CountryId = candidate.CountryId,
                                                                         CountryName = candidate.Country.Name,
                                                                         StateId = candidate.StateId,
                                                                         StateName = candidate.State.Name,
                                                                         CityId = candidate.CityId,
                                                                         CityName = candidate.City.Name,
                                                                         DomainId = hiring != null ? hiring.DomainId : null,
                                                                         DomainName = hiring != null ? hiring.Domain.Name : null,
                                                                         SubDomainId = hiring.JobDetails != null ? hiring.JobDetails.SubDomainId : null,
                                                                         SubDomainName = hiring.JobDetails != null ? hiring.JobDetails.SubDomain.Name : null,
                                                                         DateOfJoining = ratecard.DOJ,
                                                                         ResourceTypeId = hiring.JobDetails != null ? hiring.JobDetails.ResourceTypeId : null,
                                                                         ResourceTypeName = hiring.JobDetails != null ? hiring.JobDetails.ResourceType.Name : null,
                                                                         JobLocation = hiring.JobDetails != null ? hiring.JobDetails.JobLocation : null,
                                                                         PGUId = hiring.BusinessId,
                                                                         PGUName = hiring.Business.Name
                                                                     })
                    ?? throw new Exception($"Caniddate is not found with Candidate Id : {candidateId}");
                }

                var result = await _repository.GetAsync(query => query
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x.Partner)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.HiringRequest)
                            .ThenInclude(x => x!.HiringManager)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x.HiringRequest)
                            .ThenInclude(x => x.JobDetails)
                                .ThenInclude(x => x.ResourceType)
                    .Include(x => x.Candidate)
                        .ThenInclude(x => x!.HiringRequest)
                            .ThenInclude(x => x!.Business)
                    .Include(x => x.Category)
                    .Include(x => x.OnboardingManager)
                    .Include(x => x.Gender)
                    .Include(x => x.TransportRequirement)
                    .Include(x => x.SubDomain)
                    .Include(x => x.Domain)
                    .Include(x => x!.Country)
                    .Include(x => x!.State)
                    .Include(x => x.City)
                    .Where(x => x.Id == id))

                ?? throw new Exception($"Personal details not found with Id: {id}");

                return _mapper.Map<GetCandidatePersonalDetailsDto>(result);

            }, "Personal details fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCandidatePersonalDetailsDto>> AddPersonalDetail(AddCandidatePersonalDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var existingPerssonalDetails = await _repository.GetAsync(query => query
                                                                  .Include(x => x.Candidate)
                                                                      .ThenInclude(x => x!.HiringRequest)
                                                                  .Where(x => x.Candidate!.HiringRequest!.Id == dto.HiringRequestId
                                                                  && x.CandidateId == dto.CandidateId));

                if (existingPerssonalDetails != null)
                    throw new Exception($"Personal details already added for the candidate with Id: {dto.CandidateId}");

                var result = await _repository.AddAsync(_mapper.Map<CandidatePersonalDetails>(dto));

                return _mapper.Map<GetCandidatePersonalDetailsDto>(result);

            }, "Personal details added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdatePersonalDetail(AddCandidatePersonalDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _repository.GetAsync(query => query
                    .Include(x => x.Category)
                    .Include(x => x.OnboardingManager)
                    .Include(x => x.Gender)
                    .Include(x => x.TransportRequirement)
                    .Include(x => x.Candidate)
                    .ThenInclude(x => x!.HiringRequest)
                    .Where(x => x.Id == dto.Id))
                ?? throw new Exception($"Personal details not found with CandidateId: {dto.CandidateId}");

                result.CandidateId = dto.CandidateId;
                result.CategoryId = dto.CategoryId;
                result.RoleHiredFor = dto.RoleHiredFor;
                result.DateOfJoining = dto.DateOfJoining;
                result.OnboardingManagerId = dto.OnboardingManagerId;
                result.PersonalMailId = dto.PersonalMailId;
                result.CurrentAddress = dto.CurrentAddress;
                result.FinalOnboaridngDate = dto.FinalOnboaridngDate;
                result.AadharLast4Digits = dto.AadharLast4Digits;
                result.NameAsPerAadhar = dto.NameAsPerAadhar;
                result.JobLocation = dto.JobLocation;
                result.DOB = dto.DOB;
                result.GenderId = dto.GenderId;
                result.TransportRequirementId = dto.TransportRequirementId;
                result.Pincode = dto.Pincode;

                result.Phone = dto.Phone;
                result.CountryId = dto.CountryId;
                result.StateId = dto.StateId;
                result.CityId = dto.CityId;
                result.DomainId = dto.DomainId;
                result.SubDomainId = dto.SubDomainId;

                await _repository.UpdateAsync(result, false);

            }, "Personal detail updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _repository.GetAsync(id) ?? throw new Exception($"Personal details not found with Id: {id}");

                result.IsActive = isActive;

                await _repository.UpdateAsync(result);

            }, "Personal details status updated successfully.");
        }

        public async Task<ApiResponseDto<string>> SubmitOnboardingDetails(SubmitOnboardingDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var existingPerssonalDetails = await _repository.GetAsync(query => query
                                                                  .Include(x => x.Candidate)
                                                                  .Include(x => x.AssetDetails)
                                                                  .Include(x => x.ProfileTracker)
                                                                  .Include(x => x.TrainingDetails)
                                                                  .Where(x =>
                                                                  (x.Candidate!.HiringRequestId == dto.HiringRequestId
                                                                  && x.CandidateId == dto.CandidateId) || x.Id == dto.CandidatePersonalDetailsId))
                ?? throw new Exception($"Personal details not added for the candidate with Id: {dto.CandidateId}");

                existingPerssonalDetails.CandidateBGVCompleted = dto.CandidateBGVCompleted;

                await _repository.UpdateAsync(existingPerssonalDetails, false);

                // Close Hiring request
                var hiring = await _hiringRepository.GetAsync(dto.HiringRequestId);

                if (hiring.HiringStatusId == (int)HIRING_STATUS.WIP || hiring.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED)
                {
                    hiring.HiringStatusId = (int)HIRING_STATUS.CLOSED;
                    hiring.ClosedDate = DateTime.UtcNow;
                    await _hiringRepository.UpdateAsync(hiring, false);
                }

                // Make candidate to onboarding
                var candidate = await _candidateRepository.GetAsync(dto.CandidateId);

                candidate.IntakeStatusId = (int)CANDIDATE_INTAKE_STATUS.ONBOARDED;

                await _candidateRepository.UpdateAsync(candidate);


                // Freeze all existing candidates to the onboarded HRQ
                List<Candidate> candidatesToFreezeList = [];
                List<CandidateHistory> candidateHistoriesToFreezeList = [];

                var existingCandidatesToFreeze = await _candidateRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == dto.HiringRequestId && x.Id != dto.CandidateId));

                foreach (var candidateToFreeze in existingCandidatesToFreeze)
                {
                    candidateToFreeze.IsFreezed = true;
                    candidate.CandidateFreezedReason = $"Current Hiring request ({hiring.HrqId} is closed.)";

                    candidatesToFreezeList.Add(candidateToFreeze);

                    var candidateHistory = await _candidateHistoryRepository.GetAsync(query => query.Where(x => x.CandidateId == candidate.Id
                                                                                         && x.PartnerId == candidate.PartnerId
                                                                                         && x.HiringRequestId == candidate.HiringRequestId));

                    candidateHistory.IntakeStatusId = candidate.IntakeStatusId;
                    candidateHistory.IsFreezed = candidate.IsFreezed;
                    candidateHistory.CandidateFreezedReason = candidate.CandidateFreezedReason;
                    candidateHistoriesToFreezeList.Add(candidateHistory);

                }

                if (candidatesToFreezeList.Count > 0)
                    await _candidateRepository.UpdateListAsync(candidatesToFreezeList);

                if (candidateHistoriesToFreezeList.Count > 0)
                    await _candidateHistoryRepository.UpdateListAsync(candidateHistoriesToFreezeList);

            }, "Onboarding details submitted successfully.");
        }
    }
}
