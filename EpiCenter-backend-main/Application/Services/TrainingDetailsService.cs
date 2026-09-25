using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.TrainingDetails;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class TrainingDetailsService(IGenericRepository<TrainingDetails> _trainingDetailsRepository, IGenericRepository<CandidatePersonalDetails> _persoalDetailsRepository,

                                     IMapper _mapper) : BaseService, ITrainingDetailsService
    {
        public async Task<ApiResponseDto<PagedResult<GetTrainingDetailsDto>>> GetPagedTrainingDetails(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _trainingDetailsRepository.GetPaginatedListAsync(
                    pageData,
                    query => query.Include(x=>x.OrientationStatus)
                                  .Include(x=>x.ResumeUploaded)
                                  .Include(x => x.SessionTakenByManager)
                                  //.Include(x => x.TrainingModule)
                                  .Include(x=>x.RCMSUploadStatus)
                );

                var dtos = _mapper.Map<IEnumerable<GetTrainingDetailsDto>>(result.Items);
                return new PagedResult<GetTrainingDetailsDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Training Details fetched successfully.");
        }
        
        public async Task<ApiResponseDto<IEnumerable<GetTrainingDetailsDto>>> GetTrainingDetailsList()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _trainingDetailsRepository.GetListAsync(query => query.Include(x => x.OrientationStatus)
                                  //.Include(x => x.TrainingModule)
                                  .Include(x => x.ResumeUploaded)
                                  .Include(x => x.SessionTakenByManager)
                                  .Include(x => x.RCMSUploadStatus));
                return _mapper.Map<IEnumerable<GetTrainingDetailsDto>>(result);
            }, "Training Details list fetched successfully.");
        }
        public async Task<ApiResponseDto<GetTrainingDetailsDto>> GetTrainingDetail(int candidatePersonalDetailsId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _trainingDetailsRepository.GetAsync(query => query.Include(x => x.OrientationStatus)
                                  .Include(x => x.ResumeUploaded)
                                  .Include(x => x.RCMSUploadStatus)
                                  .Include(x => x.SessionTakenByManager)
                                  .Where(x => x.CandidatePersonalDetailsId == candidatePersonalDetailsId)

                ) ?? throw new Exception($"Training Details not found with Id: {candidatePersonalDetailsId}");

                var dto = _mapper.Map<GetTrainingDetailsDto>(result);

                var personalDetails = await _persoalDetailsRepository.GetAsync(candidatePersonalDetailsId);
                if(personalDetails != null)
                {
                    dto.DOJ = personalDetails.DateOfJoining;
                }

                return dto;

            }, "Training Details fetched successfully.");
        }

        public async Task<ApiResponseDto<GetTrainingDetailsDto>> AddTrainingDetail(AddTrainingDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var existing = await _trainingDetailsRepository.GetAsync(query =>
                    query
                    .Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId)
                );

                if (existing != null)
                    throw new Exception($"Training Details already exists for candidate.");

                var entity = await _trainingDetailsRepository.AddAsync(_mapper.Map<TrainingDetails>(dto));
                return _mapper.Map<GetTrainingDetailsDto>(entity);
            }, "Training Details added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateTrainingDetail(AddTrainingDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _trainingDetailsRepository.GetAsync(query =>
                    query.Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId))
                    ?? throw new Exception($"Training Details not found with Id: {dto.Id}");

                //_mapper.Map(dto, entity);

                entity.IsTrainingCompleted = dto.IsTrainingCompleted;
                entity.TrainingSharedOn = dto.TrainingSharedOn;
                entity.TrainingCompleted = dto.TrainingCompleted;
                entity.IsOrientationCompleted = dto.IsOrientationCompleted;
                entity.OrientationDate = dto.OrientationDate;
                entity.OrientationCompletionDate = dto.OrientationCompletionDate;
                entity.RescheduleOrientationDate = dto.RescheduleOrientationDate;
                entity.OrientationSharedOn = dto.OrientationSharedOn;
                entity.OrientationStatusId = dto.OrientationStatusId;
                entity.ReasonForReschedule = dto.ReasonForReschedule;
                entity.ResumeUploadId = dto.ResumeUploadId;
                entity.ResumeUploaded = _mapper.Map<DocumentDetails>(dto.ResumeUploaded);
                entity.RCMSUploadStatusId = dto.RCMSUploadStatusId;
                entity.TrainingModuleIds = dto.TrainingModuleIds;
                entity.ReleaseToOperationsDate = dto.ReleaseToOperationsDate;

                entity.SessionTakenByManagerId = dto.SessionTakenByManagerId;
                entity.IsMovedToManager = dto.IsMovedToManager;

                await _trainingDetailsRepository.UpdateAsync(entity);

            }, "Training Details updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleTrainingStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _trainingDetailsRepository.GetAsync(id)
                    ?? throw new Exception($"Training Details not found with Id: {id}");

                entity.IsActive = isActive;
                await _trainingDetailsRepository.UpdateAsync(entity);

            }, "Training Details updated successfully.");
        }
    }
}
