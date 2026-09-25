using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.InterviewRound;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class InterviewRoundService(IGenericRepository<InterviewRound> _interviewRoundRepository,
        IGenericRepository<HiringRequest> _hiringRepository,
        IGenericRepository<FeedbackCritriaOptions> _feedbackRepository,
        IHMSUtilities _hmsUtilities,
        IHelperMethods _helperMethods,
        IMapper _mapper) : BaseService, IInterviewRoundService
    {
        public async Task<ApiResponseDto<PagedResult<GetInterviewRoundDto>>> GetPagedInterviewRounds(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _interviewRoundRepository.GetPaginatedListAsync(pageData,
                                            query => query.Include(x => x.FeedbackCritriaOptions!)
                                                                .ThenInclude(x => x.CriteriaOption)
                                                          .Include(x => x.RoundName));
                var dtos = _mapper.Map<IEnumerable<GetInterviewRoundDto>>(result.Items);

                foreach (var dto in dtos)
                {
                    dto.PanelNames = await _helperMethods.GetUserNamesStringAsync(dto.Panel);
                }

                return new PagedResult<GetInterviewRoundDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Interview rounds fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetInterviewRoundDto>>> GetInterviewRounds(int hiringRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _interviewRoundRepository.GetListAsync(query => query
               .Include(x => x.RoundName)
               .Include(x => x.FeedbackCritriaOptions!)
                       .ThenInclude(x => x.CriteriaOption)
               .Include(x => x.InterviewMode!)
               .Where(x => x.HiringRequestId == hiringRequestId));
                var dtos = _mapper.Map<IEnumerable<GetInterviewRoundDto>>(result);

                foreach (var dto in dtos)
                {
                    dto.PanelNames = await _helperMethods.GetUserNamesStringAsync(dto.Panel);
                }

                return dtos;

            }, "Interview rounds fetched successfully.");
        }

        public async Task<ApiResponseDto<GetInterviewRoundDto>> GetInterviewRound(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _interviewRoundRepository.GetAsync(query => query
                        .Include(x => x.FeedbackCritriaOptions!)
                        .ThenInclude(x => x.CriteriaOption)
                        .Include(x => x.RoundName).Where(x => x.Id == id)) ?? throw new Exception($"Interview round is not found with Id : {id}");

                var dto = _mapper.Map<GetInterviewRoundDto>(entity);

                dto.PanelNames = await _helperMethods.GetUserNamesStringAsync(dto.Panel);

                return dto;

            }, "Interview round fetched successfully.");
        }

        public async Task<ApiResponseDto<GetInterviewRoundDto>> AddInterviewRound(AddInterviewRoundDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var isParent = await _hmsUtilities.VerifyParentHiringRequestId(dto.HiringRequestId);

                if (isParent == true)
                {
                    var existingInterviewRounds = await _interviewRoundRepository.GetListAsync(query => query.Include(x => x.RoundName).Where(x => x.HiringRequestId == dto.HiringRequestId && x.IsActive == true));


                    // Update SkipScreening In Hiring Request
                    if (existingInterviewRounds?.Count() == 0)
                    {
                        var hiringRequest = await _hiringRepository.GetAsync(dto.HiringRequestId);
                        hiringRequest.SkipScreening = dto.SkipScreening;
                        await _hiringRepository.UpdateAsync(hiringRequest);
                    }

                    // Verify If the Round is already Existed
                    var existingInterviewRound = await _interviewRoundRepository.GetAsync(query => query.Include(x => x.RoundName)
                                .Where(x => x.RoundNameId == dto.RoundNameId
                                && x.RoundNumber == dto.RoundNumber
                                && x.HiringRequestId == dto.HiringRequestId
                                && x.IsActive == true));

                    if (existingInterviewRound != null)
                        throw new Exception($"Inreview round already existed with Id : {existingInterviewRound.Id}");


                    // Add Interview Round in Parent
                    var entity = await _interviewRoundRepository.AddAsync(_mapper.Map<InterviewRound>(dto));

                    var childHirinRequestIds = await _hmsUtilities.GetChildHiringRequestIds(entity.HiringRequestId);

                    if (childHirinRequestIds != null && childHirinRequestIds.Count() > 0)
                        foreach (var id in childHirinRequestIds)
                        {
                            var interviewRound = await _interviewRoundRepository.GetAsync(query => query.Where(x => x.HiringRequestId == id && x.RoundNumber == dto.RoundNumber));

                            if (interviewRound == null)
                            {
                                interviewRound = _mapper.Map<InterviewRound>(dto);
                                interviewRound.Id = 0;
                                interviewRound.HiringRequestId = id;
                                await _interviewRoundRepository.AddAsync(interviewRound);
                            }
                        }

                    if (entity?.Panel?.Count > 0)
                    {
                        await _helperMethods.AddUserRoles(entity.Panel!, (int)ROLES.PANEL);
                    }

                    return _mapper.Map<GetInterviewRoundDto>(entity);

                }

                throw new Exception("Error adding in Interviewrounds");

            }, "Interview round added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateInterviewRound(AddInterviewRoundDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _interviewRoundRepository.GetAsync(query => query.Include(x => x.FeedbackCritriaOptions).Where(x => x.Id == dto.Id)) ?? throw new Exception($"Interview round is not found with Id : {dto.Id}");

                entity.HiringRequestId = dto.HiringRequestId;
                entity.RoundNameId = dto.RoundNameId;
                entity.RoundNumber = dto.RoundNumber;
                entity.ModeOfInterview = dto.ModeOfInterview;
                entity.Panel = dto.Panel;
                entity.Candidates = dto.Candidates;
                entity.AddFeedbackCritria = dto.AddFeedbackCritria;
                entity.IsAddSpecificCandidates = dto.IsAddSpecificCandidates;
                entity.CategoryId = dto.CategoryId;
                entity.SkipScreening = dto.SkipScreening;
                entity.Comments = dto.Comments;
                entity.ScreeningCap = dto.ScreeningCap;
                entity.AvailableDays = dto.AvailableDays;

                if (dto.AddFeedbackCritria == true && dto.FeedbackCritriaOptions?.Count > 0)
                {
                    var documentsToDeleteIds = entity.FeedbackCritriaOptions?.Where(x => x.InterviewRoundId == dto.Id)
                                                    .Select(d => d.Id)
                                                    .ToList();

                    if (documentsToDeleteIds != null && documentsToDeleteIds.Count > 0)
                    {
                        await _feedbackRepository.DeleteListAsync(documentsToDeleteIds);
                    }

                    var newFeedbackList = dto.FeedbackCritriaOptions!.Where(x => x.Id == 0);

                    if (newFeedbackList?.Count() > 0)
                    {
                        await _feedbackRepository.AddListAsync(_mapper.Map<List<FeedbackCritriaOptions>>(newFeedbackList));
                    }

                    var existingFeedbackList = dto.FeedbackCritriaOptions!.Where(x => x.Id != 0);
                    if (existingFeedbackList?.Count() > 0)
                    {
                        await _feedbackRepository.UpdateListAsync(_mapper.Map<List<FeedbackCritriaOptions>>(existingFeedbackList));
                    }
                }

                await _interviewRoundRepository.UpdateAsync(entity, false);

                if (entity?.Panel?.Count > 0)
                {
                    await _helperMethods.AddUserRoles(entity.Panel!, (int)ROLES.PANEL);
                }

            }, "Interview round updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _interviewRoundRepository.GetAsync(id) ?? throw new Exception($"Interview round is not found with Id : {id}");
                entity.IsActive = isActive;
                await _interviewRoundRepository.UpdateAsync(entity);

            }, "Interview round status updated successfully.");
        }

    }
}
