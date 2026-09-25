using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.Onboarding.ProfileTracker;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class ProfileTrackerService(IGenericRepository<ProfileTracker> _profileTrackerRepository,
        IMapper _mapper) : BaseService, IProfileTrackerService
    {
        public async Task<ApiResponseDto<PagedResult<GetProfileTrackerDto>>> GetPagedProfileTrackerDetails(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _profileTrackerRepository.GetPaginatedListAsync(
                    pageData,
                    query => query
                        .Include(x => x.CostCenter)
                );

                var dtos = _mapper.Map<IEnumerable<GetProfileTrackerDto>>(result.Items);
                return new PagedResult<GetProfileTrackerDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Profile tracker details fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetProfileTrackerDto>>> GetProfileTrackerDetailsList()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _profileTrackerRepository.GetListAsync(query => query
                        .Include(x => x.CostCenter));

                return _mapper.Map<IEnumerable<GetProfileTrackerDto>>(result);
            }, "Profile tracker list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetProfileTrackerDto>> GetProfileTrackerDetail(int candidatePersonalDetailsId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _profileTrackerRepository.GetAsync(query => query
                        .Include(x => x.CostCenter)
                        .Where(x => x.CandidatePersonalDetailsId == candidatePersonalDetailsId)
                );

                return result == null
                    ? throw new Exception($"Profile tracker not found with Id: {candidatePersonalDetailsId}")
                    : _mapper.Map<GetProfileTrackerDto>(result);
            }, "Profile tracker detail fetched successfully.");
        }

        public async Task<ApiResponseDto<GetProfileTrackerDto>> AddProfileTrackerDetail(AddProfileTrackerDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var existing = await _profileTrackerRepository.GetAsync(query => query
                        .Include(x => x.CostCenter)
                    .Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId)
                );

                if (existing != null)
                    throw new Exception($"Profile tracker already exists for candidate.");

                var entity = await _profileTrackerRepository.AddAsync(_mapper.Map<ProfileTracker>(dto));
                return _mapper.Map<GetProfileTrackerDto>(entity);
            }, "Profile tracker added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateProfileTrackerDetail(AddProfileTrackerDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _profileTrackerRepository.GetAsync(query =>
                    query.Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId))
                    ?? throw new Exception($"Profile tracker not found with Id: {dto.Id}");

                entity.IsEmployeeIdGenerated = dto.IsEmployeeIdGenerated;
                entity.EmployeeNameAsPerId = dto.EmployeeNameAsPerId;
                entity.EmployeeId = dto.EmployeeId;
                entity.HPEEmailId = dto.HPEEmailId;
                entity.ProfileCreatedOn = dto.ProfileCreatedOn;
                entity.SmartProfileId = dto.SmartProfileId;
                entity.ProfileApprovalDate = dto.ProfileApprovalDate;
                entity.LHCCCode = dto.LHCCCode;
                entity.CostCenterId = dto.CostCenterId;
                entity.CostCenterName = dto.CostCenterName;
                entity.CandidatePersonalDetailsId = dto.CandidatePersonalDetailsId;

                await _profileTrackerRepository.UpdateAsync(entity);

            }, "Profile tracker updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleProfileTrackerStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _profileTrackerRepository.GetAsync(id)
                    ?? throw new Exception($"Profile tracker not found with Id: {id}");

                entity.IsActive = isActive;
                await _profileTrackerRepository.UpdateAsync(entity);

            }, "Profile tracker status updated successfully.");
        }
    }
}
